// Вградени изречения (проверени с обучените модели).
export const MAIN = 'i expected a great movie but it was a waste of time';

export const PRESETS = [
  { text: MAIN, note: 'централен пример: обрат при „waste“' },
  { text: 'i liked this film', note: '' },
  { text: 'i did not like this film', note: 'отрицание' },
  { text: 'a wonderful film', note: '' },
  { text: 'a terrible film', note: '' },
];

// Слаби случаи за задачата „Ловец на грешки“.
export const WEAK = ['this movie was not bad', 'this movie was good', 'this movie was not good'];

// Неутрален пълнеж за секция 2 (30 думи, повтаря се до 150).
const FILLER_30 = (
  'i watched it last saturday with my brother at the cinema near our house and ' +
  'then we went home by bus and talked about the story for a while'
).split(' ');
export const filler = (n) => Array.from({ length: n }, (_, k) => FILLER_30[k % FILLER_30.length]);

// Реално измерено влияние на дума според разстоянието до края (training/influence.py).
export const INFLUENCE = {
  d: [0, 5, 10, 20, 30, 50, 75, 100, 150],
  rnn: [1, 0.422, 0.331, 0.218, 0.193, 0.064, 0.019, 0.001, 0],
  lstm: [1, 0.554, 0.48, 0.434, 0.35, 0.332, 0.298, 0.219, 0.196],
};

// Линк към самопроверката в Google Forms — попълва се от преподавателя.
export const FORMS_URL = 'https://forms.gle/jXtwxRPjTW3X3k4k6';
