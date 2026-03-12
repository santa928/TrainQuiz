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
  };

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
      imageUrl: "https://example.com/hayabusa.png",
      imageAuthor: "author",
      imageLicense: "license",
      imageSourceUrl: "https://example.com/source-a",
      wikipediaUrl: "https://example.com/article-a",
    },
    {
      id: "train-b",
      displayName: "こまち",
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
  assert.equal(elements.encyclopediaButton.disabled, true);
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

test("完了後の CTA でタイトル画面へ戻る", async () => {
  const { app, elements } = createHarness();

  await app.bootstrap();
  app.startQuiz();
  app.state.currentIndex = app.state.order.length - 1;

  app.handleNext();

  assert.equal(app.state.completedRound, true);
  assert.equal(elements.next.textContent, "🏠 タイトルへ もどる");
  assert.equal(elements.answer.textContent, "たいへん よくできました 💮");
  assert.equal(elements.titleScreen.hidden, true);
  assert.equal(elements.quizScreen.hidden, false);

  app.handleNext();

  assert.equal(elements.titleScreen.hidden, false);
  assert.equal(elements.quizScreen.hidden, true);
});

test("不正解直後に正解を表示して つぎへ 進める", async () => {
  const { app, elements } = createHarness();

  await app.bootstrap();
  app.startQuiz();

  const [correctButton, wrongButton] = elements.choices.children;
  wrongButton.click();

  assert.equal(elements.feedback.textContent, "❌ もういちど えらんでね");
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
