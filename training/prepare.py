"""Подготовка на IMDB: почистване, токенизация, речник, разделяне."""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
import csv, re, json, random, collections, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "data", "IMDB-Dataset.csv")
OUT = os.path.join(HERE, "prepared.json")
VOCAB = 5000          # най-честите думи
MAXLEN = 200          # пазим последните 200 думи
SEED = 42

TOKEN_RE = re.compile(r"[a-z]+(?:'[a-z]+)?")

def tokenize(text):
    text = text.replace("<br />", " ").lower()
    return TOKEN_RE.findall(text)

csv.field_size_limit(10**8)
rows = list(csv.reader(open(SRC, encoding="utf-8")))[1:]
seen, data = set(), []
for review, label in rows:
    if review in seen:
        continue
    seen.add(review)
    data.append((tokenize(review), 1 if label == "positive" else 0))
print("уникални ревюта:", len(data))

random.Random(SEED).shuffle(data)
n_test, n_val = 4582, 5000
test, val, train = data[:n_test], data[n_test:n_test + n_val], data[n_test + n_val:]
print("train/val/test:", len(train), len(val), len(test))

cnt = collections.Counter(w for toks, _ in train for w in toks)
itos = ["<pad>", "<unk>"] + [w for w, _ in cnt.most_common(VOCAB)]
stoi = {w: i for i, w in enumerate(itos)}

def encode(toks):
    return [stoi.get(w, 1) for w in toks][-MAXLEN:]

out = {
    "itos": itos,
    "train": [[encode(t), y] for t, y in train],
    "val": [[encode(t), y] for t, y in val],
    "test": [[encode(t), y] for t, y in test],
}
json.dump(out, open(OUT, "w"))
unk = sum(1 for t, _ in train for w in t if w not in stoi) / sum(len(t) for t, _ in train)
print("речник:", len(itos), "| дял непознати думи в train: %.1f%%" % (100 * unk))
print("not/never/no в речника:", [w in stoi for w in ["not", "never", "no", "don't", "isn't"]])
