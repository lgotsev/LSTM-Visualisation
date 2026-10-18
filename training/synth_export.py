"""Обучава и записва синтетичните модели (RNN-4 и LSTM-4) за N = 10, 20, 30, 50, 100.

Настройки (по-добрите от експериментите):
  RNN:  lr = 1e-2
  LSTM: lr = 3e-3, начален bias на forget gate = 3
И двата: 3000 стъпки по 64 примера, 2 опита, пази се по-добрият.
Изход: synthetic_models.json (тегла с обединени bias-и + точност върху 2000 тестови примера).
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
import json, torch, torch.nn as nn
torch.set_num_threads(2)
V, EMB, H, BATCH, STEPS = 10, 8, 4, 64, 3000
CFG = {"rnn": dict(lr=1e-2, fb=None), "lstm": dict(lr=3e-3, fb=3.0)}
NS = [10, 20, 30, 50, 100]


def sample(n, N, g):
    y = torch.randint(0, 2, (n,), generator=g)
    x = torch.randint(2, V, (n, N + 1), generator=g)
    x[:, 0] = y
    return x, y.float()


class Net(nn.Module):
    def __init__(s, cell, fb):
        super().__init__()
        s.cell = cell
        s.emb = nn.Embedding(V, EMB)
        s.rnn = (nn.LSTM if cell == "lstm" else nn.RNN)(EMB, H, batch_first=True)
        s.out = nn.Linear(H, 1)
        if fb is not None:
            with torch.no_grad():
                s.rnn.bias_ih_l0[H:2 * H].fill_(fb); s.rnn.bias_hh_l0[H:2 * H].zero_()

    def forward(s, x):
        _, h = s.rnn(s.emb(x))
        h = h[0] if s.cell == "lstm" else h
        return s.out(h[-1]).squeeze(-1)


def export(m):
    r = lambda t: [[round(v, 5) for v in row] for row in t.tolist()]
    r1 = lambda t: [round(v, 5) for v in t.tolist()]
    return {"emb": r(m.emb.weight), "Wx": r(m.rnn.weight_ih_l0), "Wh": r(m.rnn.weight_hh_l0),
            "b": r1(m.rnn.bias_ih_l0 + m.rnn.bias_hh_l0), "wo": r1(m.out.weight[0]), "bo": round(m.out.bias.item(), 5)}


out = {"vocab": V, "hidden": H, "note": "0=A, 1=B, 2..9 разсейващи символи", "models": {}}
for N in NS:
    for cell, cfg in CFG.items():
        best, best_m = -1, None
        for seed in range(2):
            torch.manual_seed(seed); g = torch.Generator().manual_seed(seed)
            m = Net(cell, cfg["fb"]); opt = torch.optim.Adam(m.parameters(), lr=cfg["lr"])
            for _ in range(STEPS):
                x, y = sample(BATCH, N, g)
                loss = nn.functional.binary_cross_entropy_with_logits(m(x), y)
                opt.zero_grad(); loss.backward()
                nn.utils.clip_grad_norm_(m.parameters(), 1.0); opt.step()
            x, y = sample(2000, N, torch.Generator().manual_seed(999))
            with torch.no_grad():
                acc = ((m(x) > 0).float() == y).float().mean().item()
            if acc > best:
                best, best_m = acc, m
        out["models"][f"{cell}_{N}"] = {"N": N, "cell": cell, "acc": round(best, 4), **export(best_m)}
        print(f"N={N:3d} {cell:4s} acc={best:.3f}", flush=True)
        json.dump(out, open(os.path.join(HERE, "synthetic_models.json"), "w"))
print("DONE")
