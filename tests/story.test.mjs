import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  reduce,
  isBusy,
  nextMove,
  exportContext,
} from "../src/flow.mjs";
const key = (s, k) => reduce(s, { type: "direction", key: k });
const complete = (s) => reduce(s, { type: "complete" });
test("down starts photo capture and recording; only right submits it", () => {
  let s = key(initialState(), "ArrowDown");
  assert.equal(s.phase, "photo");
  assert.equal(s.recording, true);
  s = reduce(s, { type: "transcript", text: "My shadow moves." });
  assert.equal(s.phase, "photo");
  s = key(s, "ArrowRight");
  assert.equal(s.phase, "submitted");
  assert.equal(isBusy(s), true);
  assert.equal(s.recording, false);
  assert.equal(complete(s).phase, "showing-image");
});
test("right records and submits a question answer; up starts role-play", () => {
  let s = complete(key(key(initialState(), "ArrowDown"), "ArrowRight"));
  s = key(s, "ArrowRight");
  assert.equal(s.phase, "question");
  assert.equal(s.recording, true);
  s = complete(key(s, "ArrowRight"));
  assert.equal(s.answered, true);
  s = key(s, "ArrowUp");
  assert.equal(s.phase, "starting-role-play");
  assert.equal(isBusy(s), true);
  assert.equal(complete(s).phase, "role-play");
});
test("role-play keeps distinct listening and waiting states before the next reply", () => {
  let s = { ...initialState(), phase: "role-play", hasScene: true };
  s = key(s, "ArrowRight");
  assert.equal(s.phase, "role-play-listening");
  assert.equal(s.recording, true);
  s = key(s, "ArrowRight");
  assert.equal(s.phase, "role-play-waiting");
  assert.equal(s.roleTurn, 0);
  s = complete(s);
  assert.equal(s.phase, "role-play");
  assert.equal(s.roleTurn, 1);
});
test("left clears every active interface, hides all icons and cancels pending responses while preserving story data", () => {
  for (const phase of [
    "photo",
    "question",
    "starting-role-play",
    "role-play-listening",
    "role-play-waiting",
  ]) {
    const s = key(
      {
        ...initialState(),
        phase,
        hasScene: true,
        buttons: true,
        pending: "role-turn",
        recording: true,
        draft: "My text",
      },
      "ArrowLeft",
    );
    assert.equal(s.phase, "none");
    assert.equal(s.buttons, false);
    assert.equal(s.pending, null);
    assert.equal(s.draft, "My text");
    assert.equal(complete(s), s);
  }
});
test("generation preserves authored text; saving updates the exported draft", () => {
  let s = {
    ...initialState(),
    hasScene: true,
    phase: "editing",
    draft: "My authored ending",
  };
  s = complete(reduce(s, { type: "generate" }));
  assert.equal(s.draft, "My authored ending");
  assert.ok(s.generated.length > 100);
  s = reduce(s, { type: "save" });
  assert.equal(exportContext(s).fiction.draft, "My authored ending");
  assert.equal(s.revision, 1);
});
test("the guide has one action and never enables an action during processing", () => {
  let s = initialState();
  assert.equal(nextMove(s).key, "ArrowDown");
  s = key(s, "ArrowDown");
  assert.equal(nextMove(s).key, "ArrowRight");
  s = key(s, "ArrowRight");
  assert.equal(nextMove(s).action, undefined);
  assert.equal(nextMove(s).key, undefined);
});

test("the guided path goes directly from generated content to role-play", () => {
  const s = complete(key(key(initialState(), "ArrowDown"), "ArrowRight"));
  assert.equal(nextMove(s).key, "ArrowUp");
  assert.equal(s.answered, false);
});

test('home editing and plot stay in desktop mode during generation and revision', async () => {
  const { isDesktop } = await import('../src/flow.mjs');
  let state = { ...initialState(), hasScene: true, roleTurn: 1 };
  state = reduce(state, { type: 'edit' });
  assert.ok(isDesktop(state));
  state = reduce(state, { type: 'generate' });
  assert.ok(isDesktop(state));
  state = reduce(state, { type: 'complete' });
  state = reduce(state, { type: 'feedback', text: 'Make it more tense.' });
  state = reduce(state, { type: 'revise' });
  assert.ok(isDesktop(state));
  state = reduce(state, { type: 'complete' });
  state = reduce(state, { type: 'plot' });
  assert.ok(isDesktop(state));
  assert.equal(state.hasScene, true);
  assert.equal(state.roleTurn, 1);
  state = reduce(state, { type: 'close-editor' });
  assert.equal(isDesktop(state), false);
});
