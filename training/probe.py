"""Проверка на обучените модели с ръчен forward pass (същата математика като в браузъра).

Употреба: python probe.py <cell> <hidden>
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
import json, sys, re
import numpy as np, torch

CELL, H = sys.argv[1], int(sys.argv[2])
itos = json.load(open(os.path.join(HERE, "prepared.json")))["itos"]
stoi = {w: i for i, w in enumerate(itos)}
S = {k: v.numpy().astype(np.float64) for k, v in torch.load(os.path.join(HERE, f"{CELL}{H}.pt")).items()}
E, Wx, Wh = S["emb.weight"], S["rnn.weight_ih_l0"], S["rnn.weight_hh_l0"]
b = S["rnn.bias_ih_l0"] + S["rnn.bias_hh_l0"]
Wo, bo = S["out.weight"][0], S["out.bias"][0]
sig = lambda z: 1 / (1 + np.exp(-z))


def run(text):
    toks = re.findall(r"[a-z]+(?:'[a-z]+)?", text.lower())
    h, c = np.zeros(H), np.zeros(H)
    trace = []
    for w in toks:
        x = E[stoi.get(w, 1)]
        z = Wx @ x + Wh @ h + b
        if CELL == "lstm":
            i, f, g, o = sig(z[:H]), sig(z[H:2*H]), np.tanh(z[2*H:3*H]), sig(z[3*H:])
            c = f * c + i * g
            h = o * np.tanh(c)
            gates = dict(i=i.mean(), f=f.mean(), o=o.mean())
        else:
            h = np.tanh(z); gates = {}
        p = sig(Wo @ h + bo)
        trace.append((w if w in stoi else w + "?", p, gates))
    return trace


def final(text):
    return run(text)[-1][1]


print(f"===== {CELL}{H} =====")
print("-- отрицание (вероятност 'положително') --")
for a, bb in [("this movie was good", "this movie was not good"),
              ("this movie was great", "this movie was not great"),
              ("the acting was good", "the acting was not good at all"),
              ("i liked this film", "i did not like this film"),
              ("this movie was bad", "this movie was not bad"),
              ("a wonderful film", "a terrible film")]:
    print(f"  {final(a):.2f}  {a:35s} | {final(bb):.2f}  {bb}")

print("-- дълга памет: ключова дума в началото + неутрален пълнеж --")
filler = ("i watched it last saturday with my brother at the cinema near our house and "
          "then we went home by bus and talked about the story for a while")
fw = filler.split()
for key in ["terrible", "wonderful"]:
    row = []
    for n in [0, 5, 10, 20, 30]:
        row.append(f"{n:2d}w:{final(f'the movie was {key} ' + ' '.join(fw[:n])):.2f}")
    print(f"  {key:10s}", "  ".join(row))
print(f"  само пълнеж: {final('the movie was ' + filler):.2f}")

print("-- дума по дума --")
for s in ["the first half was boring but the ending was absolutely brilliant",
          "i expected a great movie but it was a waste of time"]:
    print("  " + "  ".join(f"{w}:{p:.2f}" for w, p, _ in run(s)))
    if CELL == "lstm":
        print("   f̄: " + " ".join(f"{g['f']:.2f}" for _, _, g in run(s)))
