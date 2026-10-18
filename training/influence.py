import os
HERE = os.path.dirname(os.path.abspath(__file__))
"""Реално влияние на думата според разстоянието до края: средно |d logit / d x_t| върху тестови ревюта с 200 думи."""
import json, torch, numpy as np
D = json.load(open(os.path.join(HERE, "prepared.json"))); itos = D["itos"]
revs = [s for s, _ in D["test"] if len(s) == 200][:400]
X = torch.tensor(revs)
for cell in ["rnn", "lstm"]:
    st = torch.load(os.path.join(HERE, f"{cell}4.pt"))
    emb = torch.nn.Embedding(len(itos), 8); emb.weight.data = st["emb.weight"]
    rnn = (torch.nn.LSTM if cell == "lstm" else torch.nn.RNN)(8, 4, batch_first=True)
    rnn.load_state_dict({k[4:]: v for k, v in st.items() if k.startswith("rnn.")})
    e = emb(X).detach().requires_grad_(True)
    _, h = rnn(e); h = h[0] if cell == "lstm" else h
    logit = (h[-1] @ st["out.weight"].T + st["out.bias"]).sum()
    logit.backward()
    g = e.grad.norm(dim=2).mean(0).numpy()[::-1]   # индекс 0 = последната дума
    g = g / g[0]
    print(cell, " ".join(f"{d}:{g[d]:.3f}" for d in [0, 5, 10, 20, 30, 50, 75, 100, 150, 199]))
