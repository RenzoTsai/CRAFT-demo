import test from "node:test";
import assert from "node:assert/strict";
import { DISPLAY, fitDisplay } from "../src/stage.mjs";
test("desktop, phone landscape and narrow embeds preserve one shared display scale", () => {
  for (const [w, h] of [
    [1508, 825],
    [1284, 702],
    [915, 412],
    [393, 215],
  ]) {
    const f = fitDisplay(w, h);
    assert.ok(f.scale > 0);
    assert.ok(DISPLAY.width * f.scale <= w + 0.001);
    assert.ok(DISPLAY.height * f.scale <= h + 0.001);
    assert.ok(Math.abs(f.left * 2 + DISPLAY.width * f.scale - w) < 0.001);
  }
});
test("unmeasured viewports never produce NaN transforms", () => {
  assert.deepEqual(fitDisplay(0, 0), { scale: 0, left: 0, top: 0 });
});
