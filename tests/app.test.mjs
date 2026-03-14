import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createApp } from "../js/app.js";

const stylesSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = tagName;
    this.textContent = "";
    this.hidden = false;
    this.disabled = false;
    this.dataset = {};
    this.children = [];
    this.listeners = new Map();
    this.className = "";
    this.type = "";
    this.href = "";
    this.src = "";
    this.alt = "";
  }

  addEventListener(type, listener, options = {}) {
    const handlers = this.listeners.get(type) ?? [];
    handlers.push({ listener, once: options.once === true });
    this.listeners.set(type, handlers);
  }

  dispatch(type) {
    const handlers = this.listeners.get(type) ?? [];
    const remaining = [];

    for (const handler of handlers) {
      handler.listener();
      if (!handler.once) {
        remaining.push(handler);
      }
    }

    this.listeners.set(type, remaining);
  }

  click() {
    if (this.disabled) {
      return;
    }

    this.dispatch("click");
  }

  replaceChildren(...nodes) {
    this.children = nodes;
  }

  querySelectorAll(selector) {
    if (selector === "button") {
      return this.children.filter((child) => child.tagName === "button");
    }

    return [];
  }
}

function createDocument() {
  const elements = {
    status: new FakeElement("p"),
    title: new FakeElement("h1"),
    image: new FakeElement("img"),
    imageWrap: new FakeElement("div"),
    feedback: new FakeElement("p"),
    choices: new FakeElement("section"),
    next: new FakeElement("button"),
    credit: new FakeElement("p"),
    sourceLink: new FakeElement("a"),
    articleLink: new FakeElement("a"),
    answer: new FakeElement("p"),
    loader: new FakeElement("p"),
    error: new FakeElement("p"),
    titleScreen: new FakeElement("section"),
    quizScreen: new FakeElement("section"),
    startButton: new FakeElement("button"),
    encyclopediaButton: new FakeElement("button"),
    resultPanel: new FakeElement("section"),
    score: new FakeElement("span"),
    scoreTotal: new FakeElement("span"),
    retryButton: new FakeElement("button"),
    homeButton: new FakeElement("button"),
    encyclopediaListScreen: new FakeElement("section"),
    encyclopediaDetailScreen: new FakeElement("section"),
    encyclopediaList: new FakeElement("section"),
    encyclopediaCount: new FakeElement("p"),
    encyclopediaBackButton: new FakeElement("button"),
    encyclopediaDetailBackButton: new FakeElement("button"),
    encyclopediaDetailTitle: new FakeElement("h1"),
    encyclopediaDetailImage: new FakeElement("img"),
    encyclopediaDetailDescription: new FakeElement("p"),
    encyclopediaDetailCredit: new FakeElement("p"),
    encyclopediaDetailSourceLink: new FakeElement("a"),
    encyclopediaDetailArticleLink: new FakeElement("a"),
  };
  elements.resultPanel.hidden = true;
  elements.encyclopediaListScreen.hidden = true;
  elements.encyclopediaDetailScreen.hidden = true;

  const selectorMap = new Map([
    ["[data-status]", elements.status],
    ["[data-title]", elements.title],
    ["[data-image]", elements.image],
    ["[data-image-wrap]", elements.imageWrap],
    ["[data-feedback]", elements.feedback],
    ["[data-choices]", elements.choices],
    ["[data-next]", elements.next],
    ["[data-credit]", elements.credit],
    ["[data-source-link]", elements.sourceLink],
    ["[data-article-link]", elements.articleLink],
    ["[data-answer]", elements.answer],
    ["[data-loader]", elements.loader],
    ["[data-error]", elements.error],
    ["[data-title-screen]", elements.titleScreen],
    ["[data-quiz-screen]", elements.quizScreen],
    ["[data-start-button]", elements.startButton],
    ["[data-encyclopedia-button]", elements.encyclopediaButton],
    ["[data-result-panel]", elements.resultPanel],
    ["[data-score]", elements.score],
    ["[data-score-total]", elements.scoreTotal],
    ["[data-retry-button]", elements.retryButton],
    ["[data-home-button]", elements.homeButton],
    ["[data-encyclopedia-list-screen]", elements.encyclopediaListScreen],
    ["[data-encyclopedia-detail-screen]", elements.encyclopediaDetailScreen],
    ["[data-encyclopedia-list]", elements.encyclopediaList],
    ["[data-encyclopedia-count]", elements.encyclopediaCount],
    ["[data-encyclopedia-back-button]", elements.encyclopediaBackButton],
    ["[data-encyclopedia-detail-back-button]", elements.encyclopediaDetailBackButton],
    ["[data-encyclopedia-detail-title]", elements.encyclopediaDetailTitle],
    ["[data-encyclopedia-detail-image]", elements.encyclopediaDetailImage],
    ["[data-encyclopedia-detail-description]", elements.encyclopediaDetailDescription],
    ["[data-encyclopedia-detail-credit]", elements.encyclopediaDetailCredit],
    ["[data-encyclopedia-detail-source-link]", elements.encyclopediaDetailSourceLink],
    ["[data-encyclopedia-detail-article-link]", elements.encyclopediaDetailArticleLink],
  ]);

  return {
    elements,
    document: {
      querySelector(selector) {
        return selectorMap.get(selector) ?? null;
      },
      createElement(tagName) {
        return new FakeElement(tagName);
      },
    },
  };
}

function createFetchStub(trains) {
  return async () => ({
    ok: true,
    async json() {
      return trains;
    },
  });
}

function createHarness() {
  const trains = [
    {
      id: "train-a",
      displayName: "はやぶさ",
      canonicalName: "E5系",
      category: "shinkansen",
      operator: "JR東日本",
      descriptionShort: "はやい しんかんせん",
      imageUrl: "https://example.com/hayabusa.png",
      imageAuthor: "author",
      imageLicense: "license",
      imageSourceUrl: "https://example.com/source-a",
      wikipediaUrl: "https://example.com/article-a",
    },
    {
      id: "train-b",
      displayName: "こまち",
      canonicalName: "E6系",
      category: "shinkansen",
      operator: "JR東日本",
      descriptionShort: "あかい しんかんせん",
      imageUrl: "https://example.com/komachi.png",
      imageAuthor: "author",
      imageLicense: "license",
      imageSourceUrl: "https://example.com/source-b",
      wikipediaUrl: "https://example.com/article-b",
    },
  ];
  const { document, elements } = createDocument();
  const app = createApp({
    document,
    fetchImpl: createFetchStub(trains),
    buildRoundOrderFn: () => ["train-a", "train-b", "train-a", "train-b", "train-a"],
    buildQuestionFn: (_, currentId) => ({
      prompt: "これ なあに？",
      answer: trains.find((train) => train.id === currentId),
      choices: trains.map((train) => ({
        id: train.id,
        displayName: train.displayName,
        category: "train",
      })),
    }),
  });

  return { app, elements };
}

function createFailingFetchStub() {
  return async () => ({
    ok: false,
    async json() {
      throw new Error("should not be called");
    },
  });
}

test("bootstrap 後はタイトル画面が表示され、クイズ画面は隠れる", async () => {
  const { app, elements } = createHarness();

  await app.bootstrap();

  assert.equal(elements.titleScreen.hidden, false);
  assert.equal(elements.quizScreen.hidden, true);
  assert.equal(elements.startButton.disabled, false);
  assert.equal(elements.encyclopediaButton.disabled, false);
});

test("タイトル画面の ずかん を押すと図鑑一覧が表示される", async () => {
  const { app, elements } = createHarness();

  await app.bootstrap();
  elements.encyclopediaButton.click();

  assert.equal(elements.titleScreen.hidden, true);
  assert.equal(elements.encyclopediaListScreen.hidden, false);
  assert.equal(elements.encyclopediaDetailScreen.hidden, true);
  assert.equal(elements.encyclopediaList.children.length, 2);
  assert.equal(elements.encyclopediaCount.textContent, "2 しゅるい");
});

test("図鑑一覧のカードを押すと詳細が表示され、もどるで一覧へ戻れる", async () => {
  const { app, elements } = createHarness();

  await app.bootstrap();
  elements.encyclopediaButton.click();
  elements.encyclopediaList.children[0].click();

  assert.equal(elements.encyclopediaListScreen.hidden, true);
  assert.equal(elements.encyclopediaDetailScreen.hidden, false);
  assert.equal(elements.encyclopediaDetailTitle.textContent, "はやぶさ");
  assert.equal(elements.encyclopediaDetailDescription.textContent, "はやい しんかんせん");
  assert.equal(elements.encyclopediaDetailImage.src, "https://example.com/hayabusa.png");
  assert.equal(elements.encyclopediaDetailCredit.textContent, "しゃしん: author / license");
  assert.equal(elements.encyclopediaDetailSourceLink.href, "https://example.com/source-a");
  assert.equal(elements.encyclopediaDetailArticleLink.href, "https://example.com/article-a");

  elements.encyclopediaDetailBackButton.click();

  assert.equal(elements.encyclopediaListScreen.hidden, false);
  assert.equal(elements.encyclopediaDetailScreen.hidden, true);
});

test("クイズをはじめるを押すとクイズ画面に切り替わる", async () => {
  const { app, elements } = createHarness();

  await app.bootstrap();
  elements.startButton.click();

  assert.equal(elements.titleScreen.hidden, true);
  assert.equal(elements.quizScreen.hidden, false);
  assert.equal(elements.status.textContent, "1 / 5 もん");
  assert.equal(elements.title.textContent, "これ なあに？");
  assert.equal(elements.choices.children.length, 2);
});

test("5問終了後は結果画面でせいかい数と 2 本の導線を表示する", async () => {
  const { app, elements } = createHarness();

  await app.bootstrap();
  app.startQuiz();
  app.state.correctCount = 3;
  app.state.currentIndex = app.state.order.length - 1;

  app.handleNext();

  assert.equal(app.state.completedRound, true);
  assert.equal(elements.resultPanel.hidden, false);
  assert.equal(elements.score.textContent, "3");
  assert.equal(elements.retryButton.textContent, "🔄 もういちど あそぶ");
  assert.equal(elements.homeButton.textContent, "🏠 タイトルへ もどる");
  assert.equal(elements.next.hidden, true);
  assert.equal(elements.titleScreen.hidden, true);
  assert.equal(elements.quizScreen.hidden, false);
});

test("結果画面の もういちど で新しいラウンドを始める", async () => {
  const { app, elements } = createHarness();

  await app.bootstrap();
  app.startQuiz();
  app.state.correctCount = 2;
  app.state.currentIndex = app.state.order.length - 1;

  app.handleNext();
  elements.retryButton.click();

  assert.equal(app.state.completedRound, false);
  assert.equal(app.state.correctCount, 0);
  assert.equal(elements.resultPanel.hidden, true);
  assert.equal(elements.titleScreen.hidden, true);
  assert.equal(elements.quizScreen.hidden, false);
  assert.equal(elements.status.textContent, "1 / 5 もん");
  assert.equal(elements.title.textContent, "これ なあに？");
});

test("結果画面の タイトルへ でタイトル画面へ戻る", async () => {
  const { app, elements } = createHarness();

  await app.bootstrap();
  app.startQuiz();
  app.state.correctCount = 4;
  app.state.currentIndex = app.state.order.length - 1;

  app.handleNext();
  elements.homeButton.click();

  assert.equal(app.state.completedRound, false);
  assert.equal(app.state.correctCount, 0);
  assert.equal(elements.resultPanel.hidden, true);
  assert.equal(elements.titleScreen.hidden, false);
  assert.equal(elements.quizScreen.hidden, true);
});

test("不正解直後に正解を表示して つぎへ 進める", async () => {
  const { app, elements } = createHarness();

  await app.bootstrap();
  app.startQuiz();

  const [correctButton, wrongButton] = elements.choices.children;
  wrongButton.click();

  assert.equal(elements.feedback.textContent, "❌ おしい！ これだよ");
  assert.equal(elements.feedback.dataset.tone, "retry");
  assert.equal(correctButton.dataset.state, "correct");
  assert.equal(wrongButton.dataset.state, "wrong");
  assert.equal(elements.answer.hidden, false);
  assert.equal(elements.answer.textContent, "はやぶさ");
  assert.equal(elements.next.hidden, false);

  app.handleNext();

  assert.equal(app.state.currentIndex, 1);
  assert.equal(elements.status.textContent, "2 / 5 もん");
  assert.equal(elements.answer.hidden, true);
  assert.equal(elements.next.hidden, true);
});

test("不正解後に正解を押し直しても正解数は増えない", async () => {
  const { app, elements } = createHarness();

  await app.bootstrap();
  app.startQuiz();

  const [correctButton, wrongButton] = elements.choices.children;
  wrongButton.click();
  correctButton.click();

  assert.equal(app.state.correctCount, 0);
  assert.equal(correctButton.disabled, true);
  assert.equal(elements.feedback.textContent, "❌ おしい！ これだよ");
  assert.equal(elements.next.hidden, false);
});

test("データ読み込みに失敗したときはタイトル画面にエラーを出す", async () => {
  const { document, elements } = createDocument();
  const app = createApp({
    document,
    fetchImpl: createFailingFetchStub(),
    buildRoundOrderFn: () => [],
    buildQuestionFn: () => {
      throw new Error("should not render a question");
    },
  });
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    await app.bootstrap();
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(elements.titleScreen.hidden, false);
  assert.equal(elements.quizScreen.hidden, true);
  assert.equal(elements.startButton.disabled, true);
  assert.equal(elements.error.hidden, false);
  assert.equal(elements.error.textContent, "データのよみこみに しっぱいしたよ");
});

test("styles define four slot-based background colors", () => {
  assert.match(stylesSource, /\.choice-button\[data-slot="0"\]/);
  assert.match(stylesSource, /\.choice-button\[data-slot="1"\]/);
  assert.match(stylesSource, /\.choice-button\[data-slot="2"\]/);
  assert.match(stylesSource, /\.choice-button\[data-slot="3"\]/);
});

test("styles keep correct and wrong states distinct from the base slot colors", () => {
  assert.match(stylesSource, /\.choice-button\[data-state="wrong"\]/);
  assert.match(stylesSource, /\.choice-button\[data-state="correct"\]/);
  assert.doesNotMatch(
    stylesSource,
    /\.choice-button\[data-state="correct"\]\s*\{[^}]*background:/s,
  );
});
