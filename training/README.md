# Обучение на моделите

Допълнителен материал: как са получени теглата в приложението. Изисква Python 3.10+, `torch` и `numpy` (обучението върви на обикновен процесор, около 4 минути на модел).

## Данни

IMDB Movie Reviews, 50 000 ревюта (Maas и др., 2011), версията `IMDB Dataset.csv` от Kaggle (колони `review`, `sentiment`). Файлът (66 MB) не е в хранилището — сложете го като `training/data/IMDB-Dataset.csv`.

## Стъпки

```bash
cd training
python prepare.py                 # почистване (418 дубликата, <br />), речник 5 000 думи, 40 000 / 5 000 / 4 582
python train.py lstm 4 10         # LSTM, 4 единици, 10 епохи  → lstm4.pt  (тест 87.0%)
python train.py rnn 4 10          # RNN, 4 единици, 10 епохи   → rnn4.pt   (тест 82.4%)
python synth_export.py            # 10 синтетични модела        → synthetic_models.json
python export_weights.py          # weights.json + reference.json за тестовете
cp weights.json ../src/model/ && cp reference.json ../tests/
```

`lstm4.pt`, `rnn4.pt` и `synthetic_models.json` са включени, така че `export_weights.py` може да се пусне и без повторно обучение.

## Проверки

- `probe.py lstm 4` — отрицание, дълга памет с неутрален пълнеж, оценка дума по дума.
- `influence.py` — реалното влияние на дума според разстоянието до края (графиката в секция 2).
- `synthetic.py 4 10,30,100` — експерименти със синтетичната задача (`STEPS`, `LR`, `FB` за bias на forget gate, `CELLS`).

## Наблюдения

- С 8 единици RNN се научи да пази ключовата дума и след 150 думи; с 4 — я губи около 50-тата. Един модел не е закон; синтетичната задача е строгата проверка.
- В синтетичната задача LSTM стига N = 100 само с начален bias на forget gate = 3. Със стандартния bias 1 се проваля още при N = 50.
