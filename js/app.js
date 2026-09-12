import { buildQuestion } from "./quiz-engine.js";
import { buildRoundOrder } from "./round.js";
import { createSpeechPlayer } from "./speech.js";

const CHOICE_COLORS = ["みずいろ", "ぴんく", "みどり", "きいろ"];
const SPEECH_SETTING_KEY = "trainquiz.read-aloud";

/** Connect the quiz views, answer state and optional device speech to the DOM. */
export function createApp({
  document,
  fetchImpl,
  buildQuestionFn = buildQuestion,
  buildRoundOrderFn = buildRoundOrder,
}) {
  const isQuizEligibleTrain = (train) => train.category !== "steam";

  const viewWindow = document.defaultView ?? null;
  const elements = {
    status: document.querySelector("[data-status]"),
    title: document.querySelector("[data-title]"),
    image: document.querySelector("[data-image]"),
    imageWrap: document.querySelector("[data-image-wrap]"),
    feedback: document.querySelector("[data-feedback]"),
    choices: document.querySelector("[data-choices]"),
    speechToggle: document.querySelector("[data-speech-toggle]"),
    quizSpeechToggle: document.querySelector("[data-quiz-speech-toggle]"),
    speechReplay: document.querySelector("[data-speech-replay]"),
    speechStatus: document.querySelector("[data-speech-status]"),
    titleSpeechStatus: document.querySelector("[data-title-speech-status]"),
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
    encyclopediaListScreen: document.querySelector("[data-encyclopedia-list-screen]"),
    encyclopediaDetailScreen: document.querySelector("[data-encyclopedia-detail-screen]"),
    encyclopediaList: document.querySelector("[data-encyclopedia-list]"),
    encyclopediaCount: document.querySelector("[data-encyclopedia-count]"),
    encyclopediaBackButton: document.querySelector("[data-encyclopedia-back-button]"),
    encyclopediaDetailBackButton: document.querySelector(
      "[data-encyclopedia-detail-back-button]",
    ),
    encyclopediaDetailImagePanel: document.querySelector(
      "[data-encyclopedia-detail-image-panel]",
    ),
    encyclopediaDetailTitle: document.querySelector(
      "[data-encyclopedia-detail-title]",
    ),
    encyclopediaDetailImage: document.querySelector(
      "[data-encyclopedia-detail-image]",
    ),
    encyclopediaDetailDescription: document.querySelector(
      "[data-encyclopedia-detail-description]",
    ),
    encyclopediaSpecsPanel: document.querySelector("[data-encyclopedia-specs-panel]"),
    encyclopediaDetailRoute: document.querySelector("[data-encyclopedia-detail-route]"),
    encyclopediaRouteEndpointsItem: document.querySelector(
      "[data-encyclopedia-route-endpoints-item]",
    ),
    encyclopediaDetailRouteEndpoints: document.querySelector(
      "[data-encyclopedia-detail-route-endpoints]",
    ),
    encyclopediaDetailFeature: document.querySelector("[data-encyclopedia-detail-feature]"),
    encyclopediaDetailSpeed: document.querySelector("[data-encyclopedia-detail-speed]"),
    encyclopediaDetailCompare: document.querySelector(
      "[data-encyclopedia-detail-compare]",
    ),
    encyclopediaDetailCompareLabel: document.querySelector(
      "[data-encyclopedia-detail-compare-label]",
    ),
    encyclopediaDetailCompareText: document.querySelector(
      "[data-encyclopedia-detail-compare-text]",
    ),
    encyclopediaDetailCredit: document.querySelector(
      "[data-encyclopedia-detail-credit]",
    ),
    encyclopediaDetailSourceLink: document.querySelector(
      "[data-encyclopedia-detail-source-link]",
    ),
    encyclopediaDetailArticleLink: document.querySelector(
      "[data-encyclopedia-detail-article-link]",
    ),
    resultPanel: document.querySelector("[data-result-panel]"),
    score: document.querySelector("[data-score]"),
    scoreTotal: document.querySelector("[data-score-total]"),
    retryButton: document.querySelector("[data-retry-button]"),
    homeButton: document.querySelector("[data-home-button]"),
  };

  const state = {
    trains: [],
    quizTrains: [],
    order: [],
    currentIndex: 0,
    currentQuestion: null,
    answered: false,
    disabledChoices: new Set(),
    completedRound: false,
    currentView: "title",
    correctCount: 0,
    selectedTrainId: null,
    encyclopediaListScrollTop: 0,
    encyclopediaPageScrollY: 0,
    speechEnabled: false,
    speechStatus: "idle",
    speakingChoiceId: null,
  };
  let choiceControls = [];
  const speech = createSpeechPlayer(viewWindow, ({ status, activeId }) => {
    state.speechStatus = status;
    state.speakingChoiceId = activeId;
    updateSpeechControls();
  });

  /** Stop speech when navigation hides the question that supplied its choices. */
  function setView(view) {
    if (view !== state.currentView) speech.stop();
    state.currentView = view;
    elements.titleScreen.hidden = view !== "title";
    elements.quizScreen.hidden = view !== "quiz";
    elements.encyclopediaListScreen.hidden = view !== "encyclopedia-list";
    elements.encyclopediaDetailScreen.hidden = view !== "encyclopedia-detail";
  }

  /** Keep both toggles, replay actions and guidance consistent with answer state. */
  function updateSpeechControls() {
    const enabled = state.speechEnabled && speech.supported;
    for (const toggle of [elements.speechToggle, elements.quizSpeechToggle]) {
      toggle.disabled = !speech.supported;
      toggle.setAttribute("aria-pressed", String(enabled));
      toggle.textContent = enabled ? "🔊 よみあげ ON" : "🔇 よみあげ OFF";
    }
    elements.speechReplay.hidden = !enabled;
    elements.speechReplay.disabled = state.answered || state.completedRound;
    elements.choices.dataset.speech = String(enabled);
    elements.quizScreen.dataset.speech = String(enabled);
    elements.quizScreen.dataset.answered = String(state.answered);
    for (const { card, button, replay, id } of choiceControls) {
      const speaking = state.speakingChoiceId === id;
      card.dataset.speaking = String(speaking);
      button.dataset.speaking = String(speaking);
      replay.hidden = !enabled || state.answered;
      replay.disabled = state.answered;
    }
    let message = enabled
      ? "🔊で ききなおせるよ。こたえは なまえの ボタンを おしてね"
      : "よみあげを ON にすると なまえを よむよ";
    if (!speech.supported) {
      message = "このブラウザでは よみあげが つかえません";
    } else if (enabled && state.speechStatus === "unavailable") {
      message = "日本語の音声が見つかりません。端末の日本語音声を確認して、🔊でもういちど試してください";
    } else if (enabled && state.speechStatus === "error") {
      message = "音声を再生できませんでした。音量を確認して、🔊でもういちど試してください";
    } else if (enabled && state.answered) {
      message = "つぎへ ▶ を おしてね";
    } else if (enabled && state.speechStatus === "speaking") {
      const slot = state.currentQuestion?.choices.findIndex((c) => c.id === state.speakingChoiceId);
      message = slot >= 0 ? `${CHOICE_COLORS[slot]}の ボタンを よんでいるよ` : "よんでいるよ";
    } else if (enabled && state.speechStatus === "loading") {
      message = "おとを じゅんびしているよ…";
    }
    elements.speechStatus.textContent = message;
    elements.titleSpeechStatus.textContent = !speech.supported || state.speechStatus === "unavailable" || state.speechStatus === "error"
      ? message
      : "ONにすると、4つの なまえを じゅんばんに よむよ";
  }

  /** Read only visible unanswered choices; replay never submits an answer. */
  function readChoices(choiceId = null) {
    if (!state.speechEnabled || state.currentView !== "quiz" || state.answered || state.completedRound) return;
    const items = state.currentQuestion.choices.map((choice, slot) => ({
      id: choice.id,
      text: `${CHOICE_COLORS[slot]}の ボタン。${choice.displayName}`,
    }));
    speech.play(choiceId ? items.filter((item) => item.id === choiceId) : items);
  }

  /** Persist the parent's opt-in without making blocked storage fatal to play. */
  function toggleSpeech() {
    if (!speech.supported) return;
    state.speechEnabled = !state.speechEnabled;
    speech.stop();
    try {
      viewWindow.localStorage?.setItem(SPEECH_SETTING_KEY, String(state.speechEnabled));
    } catch { /* Private browsing/storage restrictions must not block the quiz. */ }
    updateSpeechControls();
    if (state.speechEnabled) readChoices();
  }

  function setQuizMode(mode) {
    elements.quizScreen.dataset.mode = mode;
    elements.resultPanel.hidden = mode !== "result";
  }

  function updateProgress() {
    elements.status.textContent = `${state.currentIndex + 1} / ${state.order.length} もん`;
  }

  function renderReferences(target, train) {
    target.credit.textContent = `しゃしん: ${train.imageAuthor} / ${train.imageLicense}`;
    target.sourceLink.href = train.imageSourceUrl;
    target.articleLink.href = train.wikipediaUrl;
  }

  function renderPanelImage(panel, image, { src, alt }) {
    panel.dataset.loaded = "false";
    image.alt = alt;
    image.addEventListener(
      "load",
      () => {
        panel.dataset.loaded = "true";
      },
      { once: true },
    );
    image.src = src;

    if (image.complete && image.naturalWidth !== 0) {
      panel.dataset.loaded = "true";
    }
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
    for (const { button } of choiceControls) {
      if (button.dataset.choiceId === correctId) {
        button.dataset.state = "correct";
        button.disabled = state.answered;
      } else if (button.dataset.choiceId === wrongId) {
        button.dataset.state = "wrong";
        button.disabled = true;
      } else if (state.answered) {
        button.dataset.state = "inactive";
        button.disabled = true;
      }
    }
  }

  /** Score a single answer and cancel the now-obsolete spoken options. */
  function handleChoice(choiceId) {
    if (!state.currentQuestion || state.answered) {
      return;
    }

    speech.stop();
    const { answer } = state.currentQuestion;
    if (choiceId === answer.id) {
      state.correctCount += 1;
      state.answered = true;
      showFeedback({ tone: "success", text: "⭕ せいかい！" });
      elements.answer.hidden = false;
      elements.answer.textContent = answer.displayName;
      elements.next.hidden = false;
      markChoices(answer.id, "");
      updateSpeechControls();
      return;
    }

    state.answered = true;
    state.disabledChoices.add(choiceId);
    showFeedback({ tone: "retry", text: "❌ おしい！ これだよ" });
    elements.answer.hidden = false;
    elements.answer.textContent = answer.displayName;
    elements.next.hidden = false;
    markChoices(answer.id, choiceId);
    updateSpeechControls();
  }

  /** Group separate answer/listen buttons without nesting interactive elements. */
  function createChoiceButton(choice, slotIndex) {
    const card = document.createElement("div");
    const button = document.createElement("button");
    const replay = document.createElement("button");
    card.className = "choice-card";
    card.dataset.slot = String(slotIndex);
    button.type = "button";
    button.className = "choice-button";
    button.textContent = choice.displayName;
    button.dataset.choiceId = choice.id;
    button.dataset.category = choice.category;
    button.dataset.slot = String(slotIndex);
    button.disabled = state.disabledChoices.has(choice.id);
    button.addEventListener("click", () => handleChoice(choice.id));
    replay.type = "button";
    replay.className = "choice-listen";
    replay.textContent = "🔊";
    replay.setAttribute("aria-label", `${CHOICE_COLORS[slotIndex]}：${choice.displayName} を きく`);
    replay.addEventListener("click", () => readChoices(choice.id));
    card.replaceChildren(button, replay);
    choiceControls.push({ card, button, replay, id: choice.id });
    return card;
  }

  function createEncyclopediaCard(train, index) {
    const button = document.createElement("button");
    const imageWrap = document.createElement("div");
    const image = document.createElement("img");
    const title = document.createElement("strong");
    const meta = document.createElement("span");

    button.type = "button";
    button.className = "encyclopedia-card";
    button.dataset.trainId = train.id;
    button.dataset.slot = String(index % 4);
    button.addEventListener("click", () => showEncyclopediaDetail(train.id));

    imageWrap.className = "encyclopedia-card-image";
    image.src = train.imageUrl;
    image.alt = `${train.displayName} のしゃしん`;
    image.loading = "lazy";
    imageWrap.replaceChildren(image);

    title.className = "encyclopedia-card-title";
    title.textContent = train.displayName;

    meta.className = "encyclopedia-card-meta";
    meta.textContent = train.operator;

    button.replaceChildren(imageWrap, title, meta);
    return button;
  }

  function getEncyclopediaTrains() {
    const seenDisplayNames = new Set();

    return state.trains.filter((train) => {
      if (seenDisplayNames.has(train.displayName)) {
        return false;
      }

      seenDisplayNames.add(train.displayName);
      return true;
    });
  }

  function renderEncyclopediaList() {
    const encyclopediaTrains = getEncyclopediaTrains();

    elements.encyclopediaCount.textContent = `${encyclopediaTrains.length} しゅるい`;
    elements.encyclopediaList.replaceChildren(
      ...encyclopediaTrains.map((train, index) => createEncyclopediaCard(train, index)),
    );
  }

  function setEncyclopediaListScrollTop(scrollTop) {
    if (typeof elements.encyclopediaList.scrollTo === "function") {
      elements.encyclopediaList.scrollTo({ top: scrollTop, left: 0 });
      return;
    }

    elements.encyclopediaList.scrollTop = scrollTop;
  }

  function setPageScrollTop(scrollTop) {
    if (!viewWindow || typeof viewWindow.scrollTo !== "function") {
      return;
    }

    viewWindow.scrollTo(0, scrollTop);
  }

  function restoreEncyclopediaListPosition() {
    setEncyclopediaListScrollTop(state.encyclopediaListScrollTop);
    setPageScrollTop(state.encyclopediaPageScrollY);
  }

  function runAfterNextPaint(callback) {
    if (!viewWindow || typeof viewWindow.requestAnimationFrame !== "function") {
      callback();
      return;
    }

    viewWindow.requestAnimationFrame(() => {
      viewWindow.requestAnimationFrame(callback);
    });
  }

  function stabilizePageScroll(scrollTop) {
    setPageScrollTop(scrollTop);
    runAfterNextPaint(() => {
      setPageScrollTop(scrollTop);
    });

    if (viewWindow && typeof viewWindow.setTimeout === "function") {
      viewWindow.setTimeout(() => {
        setPageScrollTop(scrollTop);
      }, 120);
    }
  }

  function showEncyclopediaList({ restoreScroll = false } = {}) {
    renderEncyclopediaList();
    setView("encyclopedia-list");

    if (restoreScroll) {
      restoreEncyclopediaListPosition();
      stabilizePageScroll(state.encyclopediaPageScrollY);
      return;
    }

    state.encyclopediaListScrollTop = 0;
    state.encyclopediaPageScrollY = 0;
    setEncyclopediaListScrollTop(0);
    setPageScrollTop(0);
  }

  function hideEncyclopediaSpecs() {
    elements.encyclopediaSpecsPanel.hidden = true;
    elements.encyclopediaDetailRoute.textContent = "";
    elements.encyclopediaRouteEndpointsItem.hidden = true;
    elements.encyclopediaDetailRouteEndpoints.textContent = "";
    elements.encyclopediaDetailFeature.textContent = "";
    elements.encyclopediaDetailSpeed.textContent = "";
    elements.encyclopediaDetailCompare.hidden = true;
    elements.encyclopediaDetailCompareLabel.textContent = "";
    elements.encyclopediaDetailCompareText.textContent = "";
  }

  function renderEncyclopediaSpecs(train) {
    const details = train.encyclopedia;
    if (!details) {
      hideEncyclopediaSpecs();
      return;
    }

    elements.encyclopediaSpecsPanel.hidden = false;
    elements.encyclopediaDetailRoute.textContent = details.routeSummary;

    if (details.routeEndpointsSummary) {
      elements.encyclopediaRouteEndpointsItem.hidden = false;
      elements.encyclopediaDetailRouteEndpoints.textContent =
        details.routeEndpointsSummary;
    } else {
      elements.encyclopediaRouteEndpointsItem.hidden = true;
      elements.encyclopediaDetailRouteEndpoints.textContent = "";
    }

    elements.encyclopediaDetailFeature.textContent = details.featureSummary;
    elements.encyclopediaDetailSpeed.textContent = `${details.speedLabel} / ${details.topSpeedKmh} km/h`;

    if (!details.comparison) {
      elements.encyclopediaDetailCompare.hidden = true;
      elements.encyclopediaDetailCompareLabel.textContent = "";
      elements.encyclopediaDetailCompareText.textContent = "";
      return;
    }

    const otherTrain = state.trains.find(
      (entry) => entry.id === details.comparison.otherTrainId,
    );
    const otherLabel = otherTrain?.displayName ?? details.comparison.otherTrainId;
    elements.encyclopediaDetailCompare.hidden = false;
    elements.encyclopediaDetailCompareLabel.textContent = `${otherLabel} との ちがい`;
    elements.encyclopediaDetailCompareText.textContent = details.comparison.summary;
  }

  function showEncyclopediaDetail(trainId) {
    const train = state.trains.find((entry) => entry.id === trainId);
    if (!train) {
      return;
    }

    state.encyclopediaListScrollTop = elements.encyclopediaList.scrollTop;
    state.encyclopediaPageScrollY = viewWindow?.scrollY ?? 0;
    state.selectedTrainId = train.id;
    elements.encyclopediaDetailTitle.textContent = train.displayName;
    renderPanelImage(elements.encyclopediaDetailImagePanel, elements.encyclopediaDetailImage, {
      src: train.imageUrl,
      alt: `${train.displayName} のしゃしん`,
    });
    elements.encyclopediaDetailDescription.textContent = train.descriptionShort;
    renderEncyclopediaSpecs(train);
    renderReferences(
      {
        credit: elements.encyclopediaDetailCredit,
        sourceLink: elements.encyclopediaDetailSourceLink,
        articleLink: elements.encyclopediaDetailArticleLink,
      },
      train,
    );
    setView("encyclopedia-detail");
  }

  /** Render a fresh question, then start opted-in speech inside the initiating tap. */
  function renderQuestion() {
    speech.stop();
    const currentId = state.order[state.currentIndex];
    state.currentQuestion = buildQuestionFn(state.quizTrains, currentId);
    state.answered = false;
    state.disabledChoices = new Set();
    state.completedRound = false;
    setQuizMode("question");

    const { answer, choices, prompt } = state.currentQuestion;
    elements.title.textContent = prompt;
    renderPanelImage(elements.imageWrap, elements.image, {
      src: answer.imageUrl,
      alt: `${answer.displayName} のしゃしん`,
    });

    choiceControls = [];
    elements.choices.replaceChildren(
      ...choices.map((choice, index) => createChoiceButton(choice, index)),
    );
    elements.next.hidden = true;
    clearFeedback();
    renderReferences(
      {
        credit: elements.credit,
        sourceLink: elements.sourceLink,
        articleLink: elements.articleLink,
      },
      answer,
    );
    updateProgress();
    setView("quiz");
    updateSpeechControls();
    readChoices();
  }

  /** Present the round score after clearing any remaining spoken choice. */
  function showCompletion() {
    speech.stop();
    const total = state.order.length;
    state.completedRound = true;
    elements.title.textContent = "ぜんぶ できたね！";
    elements.answer.hidden = true;
    elements.answer.textContent = "";
    if (state.correctCount === total) {
      showFeedback({ tone: "success", text: "パーフェクト！ すごい！ ✨" });
    } else if (state.correctCount === 0) {
      showFeedback({ tone: "success", text: "いっぱい あそんだね！ 👏" });
    } else {
      showFeedback({ tone: "success", text: "たいへん よくできました 💮" });
    }
    elements.score.textContent = String(state.correctCount);
    elements.scoreTotal.textContent = String(total);
    elements.retryButton.textContent = "🔄 もういちど あそぶ";
    elements.homeButton.textContent = "🏠 タイトルへ もどる";
    elements.next.hidden = true;
    elements.status.textContent = `${total} / ${total} もん`;
    setQuizMode("result");
    setView("quiz");
  }

  function handleRetry() {
    if (!state.quizTrains.length) {
      return;
    }

    state.currentIndex = 0;
    state.correctCount = 0;
    state.order = buildRoundOrderFn(state.quizTrains.map((train) => train.id));
    elements.next.textContent = "つぎへ ▶";
    renderQuestion();
  }

  function handleReturnToTitle() {
    state.completedRound = false;
    state.currentIndex = 0;
    state.correctCount = 0;
    state.selectedTrainId = null;
    state.encyclopediaListScrollTop = 0;
    state.encyclopediaPageScrollY = 0;
    elements.next.textContent = "つぎへ ▶";
    setQuizMode("question");
    setView("title");
    setPageScrollTop(0);
  }

  function handleNext() {
    if (state.completedRound) {
      return;
    }

    state.currentIndex += 1;

    if (state.currentIndex >= state.order.length) {
      state.currentIndex = 0;
      showCompletion();
      return;
    }

    elements.next.textContent = "つぎへ ▶";
    renderQuestion();
  }

  function startQuiz() {
    if (!state.quizTrains.length) {
      return;
    }

    state.currentIndex = 0;
    state.correctCount = 0;
    state.order = buildRoundOrderFn(state.quizTrains.map((train) => train.id));
    elements.next.textContent = "つぎへ ▶";
    renderQuestion();
  }

  async function loadTrains() {
    const response = await fetchImpl("./data/trains.json");
    if (!response.ok) {
      throw new Error("クイズデータを読み込めませんでした");
    }

    return response.json();
  }

  /** Load data and the saved opt-in; initial page load never starts speech. */
  async function bootstrap() {
    try {
      state.speechEnabled = speech.supported && viewWindow.localStorage?.getItem(SPEECH_SETTING_KEY) === "true";
    } catch { /* Storage can be denied; use the silent default for this visit. */ }
    updateSpeechControls();
    elements.speechToggle.addEventListener("click", toggleSpeech);
    elements.quizSpeechToggle.addEventListener("click", toggleSpeech);
    elements.speechReplay.addEventListener("click", () => readChoices());
    document.addEventListener?.("visibilitychange", () => {
      if (document.hidden) speech.stop();
    });
    viewWindow?.addEventListener?.("pagehide", () => speech.stop());
    setView("title");
    elements.error.hidden = true;
    elements.error.textContent = "";
    elements.loader.hidden = false;
    elements.startButton.disabled = true;
    elements.encyclopediaButton.disabled = true;
    elements.next.addEventListener("click", handleNext);
    elements.startButton.addEventListener("click", startQuiz);
    elements.encyclopediaButton.addEventListener("click", showEncyclopediaList);
    elements.encyclopediaBackButton.addEventListener("click", handleReturnToTitle);
    elements.encyclopediaDetailBackButton.addEventListener("click", () =>
      showEncyclopediaList({ restoreScroll: true }),
    );
    elements.retryButton.addEventListener("click", handleRetry);
    elements.homeButton.addEventListener("click", handleReturnToTitle);

    try {
      state.trains = await loadTrains();
      state.quizTrains = state.trains.filter(isQuizEligibleTrain);
      state.order = buildRoundOrderFn(state.quizTrains.map((train) => train.id));
      elements.loader.hidden = true;
      elements.startButton.disabled = state.quizTrains.length === 0;
      elements.encyclopediaButton.disabled = state.trains.length === 0;
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
