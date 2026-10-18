"""Синтетична задача за дълга памет: първият символ е A или B, следват N случайни
разсейващи символа, етикетът е първият символ. Може ли мрежата да се НАУЧИ на това?

Употреба: python synthetic.py <hidden> <N1,N2,...>
"""
import sys, torch, torch.nn as nn
torch.set_num_threads(2)
H = int(sys.argv[1]); NS = [int(n) for n in sys.argv[2].split(",")]
import os
V, EMB, BATCH = 10, 8, 64
STEPS = int(os.environ.get('STEPS', 2000)); LR = float(os.environ.get('LR', 1e-2)); SEEDS = int(os.environ.get('SEEDS', 1))   # 0=A, 1=B, 2..9 разсейващи


def sample(n, N, g):
    y = torch.randint(0, 2, (n,), generator=g)
    x = torch.randint(2, V, (n, N + 1), generator=g)
    x[:, 0] = y
    return x, y.float()


class Net(nn.Module):
    def __init__(s, cell):
        super().__init__()
        s.cell = cell
        s.emb = nn.Embedding(V, EMB)
        s.rnn = (nn.LSTM if cell == "lstm" else nn.RNN)(EMB, H, batch_first=True)
        s.out = nn.Linear(H, 1)
        if cell == 'lstm':  # стандартна практика: bias на forget gate = 1
            with torch.no_grad():
                s.rnn.bias_ih_l0[H:2*H].fill_(float(os.environ.get("FB", 1))); s.rnn.bias_hh_l0[H:2*H].zero_()

    def forward(s, x):
        _, h = s.rnn(s.emb(x))
        h = h[0] if s.cell == "lstm" else h
        return s.out(h[-1]).squeeze(-1)


for N in NS:
    row = []
    for cell in os.environ.get("CELLS", "rnn,lstm").split(","):
        best = 0
        for seed in range(SEEDS):
            torch.manual_seed(seed); g = torch.Generator().manual_seed(seed)
            m = Net(cell); opt = torch.optim.Adam(m.parameters(), lr=LR)
            for step in range(STEPS):
                x, y = sample(BATCH, N, g)
                loss = nn.functional.binary_cross_entropy_with_logits(m(x), y)
                opt.zero_grad(); loss.backward()
                nn.utils.clip_grad_norm_(m.parameters(), 1.0); opt.step()
            x, y = sample(2000, N, torch.Generator().manual_seed(999))
            with torch.no_grad():
                acc = ((m(x) > 0).float() == y).float().mean().item()
            best = max(best, acc)
        row.append(f"{cell}={best:.2f}")
    print(f"N={N:3d}  " + "  ".join(row), flush=True)
