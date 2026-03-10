export const QUESTIONS_PER_ROUND = 5;

export function shuffleWith(list, random = Math.random) {
  const copy = [...list];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function buildRoundOrder(
  ids,
  random = Math.random,
  maxQuestions = QUESTIONS_PER_ROUND,
) {
  return shuffleWith(ids, random).slice(0, maxQuestions);
}
