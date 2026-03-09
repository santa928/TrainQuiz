function dedupeById(trains) {
  return dedupeByKey(trains, (train) => train.id);
}

function dedupeByKey(trains, getKey) {
  const seen = new Set();

  return trains.filter((train) => {
    const key = getKey(train);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function shuffleWith(trains, random = Math.random) {
  const copy = [...trains];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function sanitizeChoicePool(trains) {
  return dedupeById(trains);
}

export function buildQuestion(trains, correctId, random = Math.random) {
  const sanitizedPool = sanitizeChoicePool(trains);
  const correctTrain = sanitizedPool.find((train) => train.id === correctId);

  if (!correctTrain) {
    throw new Error(`Unknown train id: ${correctId}`);
  }

  const sameCategory = sanitizedPool.filter(
    (train) =>
      train.id !== correctTrain.id &&
      train.displayName !== correctTrain.displayName &&
      train.category === correctTrain.category,
  );
  const fallbackPool = sanitizedPool.filter(
    (train) =>
      train.id !== correctTrain.id &&
      train.displayName !== correctTrain.displayName &&
      train.category !== correctTrain.category,
  );

  const distractors = dedupeByKey(
    [...shuffleWith(sameCategory, random), ...shuffleWith(fallbackPool, random)],
    (train) => train.displayName,
  ).slice(0, 3);

  if (distractors.length < 3) {
    throw new Error("Need at least three distractors to build a question");
  }

  return {
    prompt: "これ なあに？",
    correctId: correctTrain.id,
    answer: correctTrain,
    choices: shuffleWith([correctTrain, ...distractors], random),
  };
}
