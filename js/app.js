import { buildQuestion } from "./quiz-engine.js";
import { buildRoundOrder } from "./round.js";

export function createApp({
  document,
  fetchImpl,
  buildQuestionFn = buildQuestion,
  buildRoundOrderFn = buildRoundOrder,
}) {
  const elements = {
    status: document.querySelector("[data-status]"),
    title: document.querySelector("[data-title]"),
    image: document.querySelector("[data-image]"),
    imageWrap: document.querySelector("[data-image-wrap]"),
    feedback: document.querySelector("[data-feedback]"),
    choices: document.querySelector("[data-choices]"),
    next: document.querySelector("[data-next]"),
    credit: document.querySelector("[data-credit]"),
    sourceLink: document.querySelector("[data-source-link]"),
    articleLink: document.querySelector("[data-article-link]"),
    answer: document.querySelector("[data-answer]"),
    loader: document.querySelector("[data-loader]"),
    error: document.querySelector("[data-error]"),
    titleScreen: document.querySelector("[data-title-screen]"),
    quizScreen: document.querySelector("[data-quiz-screen]"),
    startButton: document.querySelector("[data-start-button]"),
    encyclopediaButton: document.querySelector("[data-encyclopedia-button]"),
  };

  const state = {
    trains: [],
    order: [],
    currentIndex: 0,
    currentQuestion: null,
    answered: false,
    disabledChoices: new Set(),
    completedRound: false,
    currentView: "title",
  };

  function setView(view) {
    state.currentView = view;
    elements.titleScreen.hidden = view !== "title";
    elements.quizScreen.hidden = view !== "quiz";
  }

  function updateProgress() {
    elements.status.textContent = `${state.currentIndex + 1} / ${state.order.length} もん`;
  }

  function renderCredit(train) {
    elements.credit.textContent = `しゃしん: ${train.imageAuthor} / ${train.imageLicense}`;
    elements.sourceLink.href = train.imageSourceUrl;
    elements.articleLink.href = train.wikipediaUrl;
  }

  function showFeedback({ tone, text }) {
    elements.feedback.textContent = text;
    elements.feedback.dataset.tone = tone;
  }

  function clearFeedback() {
    elements.feedback.textContent = "";
    elements.feedback.dataset.tone = "idle";
    elements.answer.hidden = true;
    elements.answer.textContent = "";
  }

  function markChoices(correctId, wrongId) {
    for (const button of elements.choices.querySelectorAll("button")) {
      if (button.dataset.choiceId === correctId) {
        button.dataset.state = "correct";
        button.disabled = false;
      } else if (button.dataset.choiceId === wrongId) {
        button.dataset.state = "wrong";
        button.disabled = true;
      } else if (state.answered) {
        button.dataset.state = "inactive";
        button.disabled = true;
      }
    }
  }

  function handleChoice(choiceId) {
    if (!state.currentQuestion) {
      return;
    }

    const { answer } = state.currentQuestion;
    if (choiceId === answer.id) {
      state.answered = true;
      showFeedback({ tone: "success", text: "⭕ せいかい！" });
      elements.answer.hidden = false;
      elements.answer.textContent = answer.displayName;
      elements.next.hidden = false;
      markChoices(answer.id, "");
      return;
    }

    state.disabledChoices.add(choiceId);
    showFeedback({ tone: "retry", text: "❌ もういちど えらんでね" });
    markChoices(answer.id, choiceId);
  }

  function createChoiceButton(choice, slotIndex) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = choice.displayName;
    button.dataset.choiceId = choice.id;
    button.dataset.category = choice.category;
    button.dataset.slot = String(slotIndex);
    button.disabled = state.disabledChoices.has(choice.id);
    button.addEventListener("click", () => handleChoice(choice.id));
    return button;
  }

  function renderQuestion() {
    const currentId = state.order[state.currentIndex];
    state.currentQuestion = buildQuestionFn(state.trains, currentId);
    state.answered = false;
    state.disabledChoices = new Set();
    state.completedRound = false;

    const { answer, choices, prompt } = state.currentQuestion;
    elements.title.textContent = prompt;
    elements.image.src = answer.imageUrl;
    elements.image.alt = `${answer.displayName} のしゃしん`;
    elements.imageWrap.dataset.loaded = "false";
    elements.image.addEventListener(
      "load",
      () => {
        elements.imageWrap.dataset.loaded = "true";
      },
      { once: true },
    );

    elements.choices.replaceChildren(
      ...choices.map((choice, index) => createChoiceButton(choice, index)),
    );
    elements.next.hidden = true;
    clearFeedback();
    renderCredit(answer);
    updateProgress();
    setView("quiz");
  }

  function showCompletion() {
    state.completedRound = true;
    elements.title.textContent = "ぜんぶ できたね！";
    elements.image.src = state.trains[0].imageUrl;
    elements.image.alt = "だいひょうの電車のしゃしん";
    elements.choices.replaceChildren();
    elements.answer.hidden = false;
    elements.answer.textContent = "もういちど あそぶ？";
    showFeedback({ tone: "success", text: "🚆 おつかれさま！" });
    elements.next.hidden = false;
    elements.next.textContent = "もう いっかい";
    renderCredit(state.trains[0]);
    elements.status.textContent = `${state.order.length} / ${state.order.length} もん`;
    setView("quiz");
  }

  function handleNext() {
    if (state.completedRound) {
      state.currentIndex = 0;
      state.order = buildRoundOrderFn(state.trains.map((train) => train.id));
      elements.next.textContent = "つぎへ";
      renderQuestion();
      return;
    }

    state.currentIndex += 1;

    if (state.currentIndex >= state.order.length) {
      state.currentIndex = 0;
      showCompletion();
      return;
    }

    elements.next.textContent = "つぎへ";
    renderQuestion();
  }

  function startQuiz() {
    if (!state.trains.length) {
      return;
    }

    state.currentIndex = 0;
    state.order = buildRoundOrderFn(state.trains.map((train) => train.id));
    elements.next.textContent = "つぎへ";
    renderQuestion();
  }

  async function loadTrains() {
    const response = await fetchImpl("./data/trains.json");
    if (!response.ok) {
      throw new Error("クイズデータを読み込めませんでした");
    }

    return response.json();
  }

  async function bootstrap() {
    setView("title");
    elements.error.hidden = true;
    elements.error.textContent = "";
    elements.loader.hidden = false;
    elements.startButton.disabled = true;
    elements.encyclopediaButton.disabled = true;
    elements.next.addEventListener("click", handleNext);
    elements.startButton.addEventListener("click", startQuiz);

    try {
      state.trains = await loadTrains();
      state.order = buildRoundOrderFn(state.trains.map((train) => train.id));
      elements.loader.hidden = true;
      elements.startButton.disabled = false;
    } catch (error) {
      console.error(error);
      elements.loader.hidden = true;
      elements.error.hidden = false;
      elements.error.textContent = "データのよみこみに しっぱいしたよ";
    }
  }

  return {
    elements,
    state,
    bootstrap,
    handleNext,
    startQuiz,
    setView,
  };
}

if (typeof document !== "undefined" && typeof fetch !== "undefined") {
  const app = createApp({
    document,
    fetchImpl: fetch.bind(globalThis),
  });
  app.bootstrap();
}
