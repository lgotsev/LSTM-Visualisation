"""Изнася теглата за браузъра и референтни стойности за тестовете.

Изход:
  weights.json   — речник, RNN-4 и LSTM-4 (IMDB), 10 синтетични модела
  reference.json — оценки дума по дума и стойности на гейтовете, сметнати с ЗАКРЪГЛЕНИТЕ тегла
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
import json, re, numpy as np, torch

R = 4  # знаци след десетичната точка
D = HERE + "/"
itos = json.load(open(D + "prepared.json"))["itos"]


def rnd(a):
    a = np.round(np.asarray(a, dtype=np.float64), R)
    return a


def load(cell):
    st = {k: v.numpy().astype(np.float64) for k, v in torch.load(D + f"{cell}4.pt").items()}
    return {"emb": rnd(st["emb.weight"]), "Wx": rnd(st["rnn.weight_ih_l0"]), "Wh": rnd(st["rnn.weight_hh_l0"]),
            "b": rnd(st["rnn.bias_ih_l0"] + st["rnn.bias_hh_l0"]), "wo": rnd(st["out.weight"][0]), "bo": float(rnd(st["out.bias"][0]))}


models = {"rnn": load("rnn"), "lstm": load("lstm")}
sig = lambda z: 1 / (1 + np.exp(-z))
TOK = re.compile(r"[a-z]+(?:'[a-z]+)?")
stoi = {w: i for i, w in enumerate(itos)}


def run(m, cell, text):
    toks = TOK.findall(text.lower().replace("’", "'"))
    H = 4; h = np.zeros(H); c = np.zeros(H); steps = []
    for w in toks:
        x = m["emb"][stoi.get(w, 1)]
        z = m["Wx"] @ x + m["Wh"] @ h + m["b"]
        if cell == "lstm":
            i, f, g, o = sig(z[:H]), sig(z[H:2*H]), np.tanh(z[2*H:3*H]), sig(z[3*H:])
            c = f * c + i * g; h = o * np.tanh(c)
            st = {"i": i, "f": f, "g": g, "o": o, "c": c.copy(), "h": h.copy()}
        else:
            h = np.tanh(z); st = {"h": h.copy()}
        p = sig(m["wo"] @ h + m["bo"])
        steps.append({"w": w, "p": round(float(p), 6), **{k: [round(float(v), 6) for v in a] for k, a in st.items()}})
    return steps


SENTENCES = [
    "i expected a great movie but it was a waste of time",
    "i liked this film", "i did not like this film",
    "a wonderful film", "a terrible film",
    "this movie was good", "this movie was not good", "this movie was not bad",
    "the first half was boring but the ending was absolutely brilliant",
    "I didn’t enjoy it, honestly.",
]
ref = {s: {cell: run(models[cell], cell, s) for cell in models} for s in SENTENCES}

syn = json.load(open(D + "synthetic_models.json"))
for k, m in syn["models"].items():
    for key in ["emb", "Wx", "Wh", "b", "wo"]:
        m[key] = np.round(np.array(m[key]), R).tolist()
    m["bo"] = round(m["bo"], R)

tolist = lambda a: a.tolist() if isinstance(a, np.ndarray) else a
out = {
    "vocab": itos,
    "models": {cell: {k: tolist(v) for k, v in m.items()} for cell, m in models.items()},
    "synthetic": syn,
    "meta": {"hidden": 4, "emb": 8, "acc": {"lstm": 0.870, "rnn": 0.824}},
}
s = json.dumps(out, separators=(",", ":"))
open(D + "weights.json", "w").write(s)
json.dump(ref, open(D + "reference.json", "w"))
print("weights.json KB:", len(s) // 1024)
for snt in SENTENCES[:5]:
    print(f"{ref[snt]['lstm'][-1]['p']:.3f} {ref[snt]['rnn'][-1]['p']:.3f}  {snt}")
