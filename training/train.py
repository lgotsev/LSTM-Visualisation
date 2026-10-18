"""Обучение на малки RNN и LSTM върху IMDB при еднакви условия.

Употреба: python train.py <cell: rnn|lstm> <hidden> [epochs]
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
import json, sys, time, random
import torch, torch.nn as nn
from torch.nn.utils.rnn import pack_padded_sequence

torch.set_num_threads(2)
CELL, HIDDEN = sys.argv[1], int(sys.argv[2])
EPOCHS = int(sys.argv[3]) if len(sys.argv) > 3 else 6
EMB, BATCH, LR, SEED = 8, 64, 3e-3, 42
torch.manual_seed(SEED); random.seed(SEED)

D = json.load(open(os.path.join(HERE, "prepared.json")))
V = len(D["itos"])


class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.emb = nn.Embedding(V, EMB, padding_idx=0)
        rnn = nn.LSTM if CELL == "lstm" else nn.RNN
        self.rnn = rnn(EMB, HIDDEN, batch_first=True)
        self.out = nn.Linear(HIDDEN, 1)

    def forward(self, x, lengths):
        packed = pack_padded_sequence(self.emb(x), lengths, batch_first=True, enforce_sorted=False)
        _, h = self.rnn(packed)
        h = h[0] if CELL == "lstm" else h
        return self.out(h[-1]).squeeze(-1)


def batches(split, shuffle):
    data = [d for d in D[split] if len(d[0]) > 0]
    # групиране по дължина за скорост
    data.sort(key=lambda d: len(d[0]))
    chunks = [data[i:i + BATCH] for i in range(0, len(data), BATCH)]
    if shuffle:
        random.shuffle(chunks)
    for ch in chunks:
        L = max(len(s) for s, _ in ch)
        x = torch.zeros(len(ch), L, dtype=torch.long)
        for i, (s, _) in enumerate(ch):
            x[i, :len(s)] = torch.tensor(s)
        yield x, torch.tensor([len(s) for s, _ in ch]), torch.tensor([y for _, y in ch], dtype=torch.float)


def evaluate(model, split):
    model.eval(); ok = n = 0
    with torch.no_grad():
        for x, l, y in batches(split, False):
            ok += ((model(x, l) > 0).float() == y).sum().item(); n += len(y)
    return ok / n


model = Net()
opt = torch.optim.Adam(model.parameters(), lr=LR)
lossf = nn.BCEWithLogitsLoss()
best, best_state = 0, None
for ep in range(EPOCHS):
    model.train(); t0 = time.time(); tot = cnt = 0
    for x, l, y in batches("train", True):
        opt.zero_grad()
        loss = lossf(model(x, l), y)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        opt.step()
        tot += loss.item() * len(y); cnt += len(y)
    va = evaluate(model, "val")
    print(f"{CELL}{HIDDEN} ep{ep+1} loss={tot/cnt:.3f} val={va:.3f} ({time.time()-t0:.0f}s)", flush=True)
    if va > best:
        best, best_state = va, {k: v.clone() for k, v in model.state_dict().items()}

model.load_state_dict(best_state)
te = evaluate(model, "test")
n_params = sum(p.numel() for n, p in model.named_parameters() if not n.startswith("emb"))
print(f"RESULT {CELL}{HIDDEN}: best val={best:.3f} test={te:.3f} params(без embedding)={n_params}")
torch.save(best_state, os.path.join(HERE, f"{CELL}{HIDDEN}.pt"))
