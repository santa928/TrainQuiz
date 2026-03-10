import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

test("app assigns a stable slot index to each choice button", () => {
  assert.match(appSource, /button\.dataset\.slot = String\(slotIndex\);/);
  assert.match(
    appSource,
    /choices\.map\(\(choice, index\) => createChoiceButton\(choice, index\)\)/,
  );
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
