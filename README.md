# CRAFT — Interactive Demo

[Try the demo](https://code.runzecai.com/CRAFT-demo/)

An interactive first-person walkthrough of CRAFT: Context-aware Reality–Fiction Transformation. The page follows a writer from noticing a shadow to imagining a scene, conversing with a character, and editing a story.

## Run

Requires Node.js 20.19+ (or 22.12+).

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:8772**.

```sh
npm test
npm run build
npm run preview
```

`dist/` is a standalone static website. It works on a root URL or in a subdirectory. Fonts and media are bundled locally; there is no backend and no API key is needed.

## Explore

The guided path follows the CRAFT interaction sequence:

**Proactive suggestion → take a photo → speak and submit → view generated content → role-play.**

1. Read the blue suggestion, then press **↓** or **Take a photo**. The photo card opens and an example spoken idea appears word by word.
2. Press **→** or **Submit idea**. After processing, the transformation, generated image and question appear.
3. Read the generated content, then press **↑** or **Enter role-play**.
4. Press **→** to start a reply, then **→** again to submit it. The character card remains visible while the transcript appears to its right.
5. Press **←** to exit role-play and clear the display. The writing editor is available afterward.

Answering the question beside the transformation is optional: **→** starts the answer and another **→** submits it. It is not a required step before role-play.

The opening page introduces CRAFT with a world-camera / generated-image comparison and a five-step overview. **Try the experience** expands the first-person demo directly below the blue introduction on the same page. The introduction and five-step overview remain available; **Overview** scrolls back to the introduction without hiding the demo or resetting progress. **Continue the experience** returns to the expanded demo. One next-action button sits outside the glasses view, beside an interactive ring-mouse diagram. Its highlighted direction indicates the next step; clicking a direction, pressing an arrow key or using the next-action button shows the same press feedback and drives the same interaction. The arrow keys work while focus is outside text fields and the plot editor. Clicking the world-camera background shows or hides the directional controls. While idle, **↑** opens captured moments. **Escape** leaves expanded view or clears the active interface.

The glasses view uses the CRAFT application's 1508 × 825 coordinate system and scales as a whole, including text and controls. Main content stays near the top, the question sits to its right, the mode label is below the main card, and the role-play card is centered horizontally. Processing hides directional controls; proactive suggestions appear only while idle. On a phone, use landscape orientation and the expand control for a larger view.

## Writing and saved content

The desktop segment first clicks **Show Plot**, moves a moment, edits its description and saves the graph. It then returns to the writing editor and automatically demonstrates generating a draft, typing modification feedback, regenerating, selecting/copying the revised text into the right column, and saving. A simulated cursor and click feedback show each step. Pause/resume and replay controls sit outside the monitor. This stores the draft and plot in browser storage and enables text and JSON downloads for the current session. **Show plot** opens the plot editor with moment images, descriptions, relevance/detail labels and a legend. Moments can be edited, moved or deleted; connections can be added, selected and deleted. On phones, select a moment and use Edit, Connect or Delete. Save Plot Connections stores the graph in this browser; Reset Layout rearranges the current graph without discarding edits.

**Restart** resets the current walkthrough; it does not remove a separately stored draft. Reloading starts a fresh walkthrough. Download saved content before leaving if you want to keep an accessible copy.

## Scope

This is a guided example with prepared speech and AI responses. It demonstrates recording, transcription and response states without accessing a microphone or making generation requests. Voice playback uses bundled, AI-generated OpenAI MP3 files. Proactive suggestions and recording states are silent; generated content reads Answer (when present), Scene, Plot, Characters and Question in order. Role-play reads only the current character dialogue. Moments reads the captured moment list. The Voice control appears only when a speaking state has prepared audio; starting input or leaving the view stops playback.

Story generation and revision use prepared examples. The editing sequence is animated; plot connections are interactive. The JSON download describes this demo's story context; it is not an import file for the full research application. There is no camera or microphone access, analytics, backend or API key.

## Prepare voice audio

The offline preparation script uses [OpenAI text-to-speech](https://developers.openai.com/api/docs/guides/text-to-speech) with `gpt-4o-mini-tts`, the `coral` voice and speed `1.2`.

Provide `OPENAI_API_KEY` in the local generation environment, then run:

```sh
npm run generate:tts
npm run build
```

This prepares 14 clips from `src/speech.mjs`, saves MP3s in `public/media/speech/`, and records their text and checksums in `src/speech-manifest.json`. Unchanged clips are reused. Preparation sends only the sample text to OpenAI; the key is read from the process environment and is never written into the site. The public page plays local audio files and makes no TTS API requests. An empty manifest means audio preparation is still pending.

## Media

- `public/media/world-camera.mp4`: an 18.5-second silent excerpt of the white-wall/shadow scene from the CRAFT video-figure material; encoded at 1280 × 720. Original audio and identifying metadata are omitted.
- `public/media/world-camera.jpg`: a still of the same scene.
- `public/media/roleplay-fellow-student.png`: a prepared fictional character portrait generated with the built-in image tool using `world-camera.jpg` as the base. The image follows the CRAFT portrait requirements: a square face-and-upper-body portrait, preserving the base composition/background and matching the character’s concerned opening dialogue, with no text or overlays.
- `public/media/imagined-shadow.png`: an AI-generated illustrative transformation, created using the built-in image-generation tool. It is an example asset, not an image from a participant's study session.

The fictional scene image uses this prompt:

> Preserve the white concrete wall, ceiling pipes, camera viewpoint and photographic texture. Transform the diffuse human shadow into a deeper charcoal silhouette with subtle branching shapes around its head and shoulders, one arm reaching independently. Keep it a shadow on the wall, with no actual person, face, eyes, lettering or interface. Use restrained photographic magical realism.

## Structure

- `src/App.jsx`: page, next-action guide, speech playback and saved-content downloads.
- `src/WearerView.jsx` and `src/wearer.css`: glasses interface and writing editor.
- `src/PlotView.tsx`: plot nodes and editable connections.
- `src/flow.mjs`: interaction states, next-action guidance and context export.
- `src/story.mjs`: prepared scene and dialogue.
- `src/speech.mjs`, `src/useDemoSpeech.jsx` and `src/speech-player.mjs`: source-matched speech queues and local audio playback.
- `scripts/generate-tts.mjs`: offline OpenAI speech preparation.
- `src/stage.mjs`: proportional display scaling.
- `src/styles.css`: portfolio-style page surrounding the glasses view.
- `tests/`: interaction progression, cancellation, draft preservation and scaling checks.

## Research

[CRAFT: Exploring Wearable Creative AI on Smart Glasses for Fiction Writing in Real-World Contexts](https://dl.acm.org/doi/10.1145/3831952) · IMWUT / UbiComp 2026

[Paper PDF](https://dl.acm.org/doi/pdf/10.1145/3831952) · [Research code](https://github.com/RenzoTsai/CRAFT)

Runze Cai, Yuxuan Huang, Lin-Ping Yuan, Kexin Xiang, David Hsu, Collier Nogues, Jussi Holopainen, and Shengdong Zhao. 2026. Proc. ACM Interact. Mob. Wearable Ubiquitous Technol. 10, 3, Article 81, 34 pages.

## Story and desktop continuation

The scenario follows the video figure: Alex is writing a campus thriller about a student whose body changes after an experiment. A car park shadow prompts a spoken idea. Responses and a dialogue rehearsal are prepared for the interactive example. The page focuses on this car park example, role-play and desktop revision.

Story Editing Interface and Plot are shown inside a desktop monitor illustration, representing continued writing at home. The story editor plays an animated example; Plot remains interactive after the sequence completes. The ring mouse and glasses keyboard shortcuts are hidden/disabled in these desktop states, including generation and revision.

### Role-play portrait prompt

Base image: `public/media/world-camera.jpg`.

> Generate a square face-and-upper-body portrait of the fictional fellow student speaking “I saw you staring at the wall. Was that really your shadow?” Use the base image’s composition and background. The adult university student wears plain casual clothing, has short dark hair and a quietly concerned, inquisitive expression. Preserve the pale concrete wall, overhead conduit and subdued illumination. Integrate the character naturally into that scene. No text, watermark, UI, exterior buildings, cars or trees.

## Research context in the page

The guide outside the glasses display explains the three similarity relations from §6.3.1 (identical, iconic, symbolic) during proactive suggestion. During transformation, this band instead presents the authenticity triad from §4.3.1: factual accuracy, logical and behavioral consistency, and emotional and psychological authenticity. The shadow examples are illustrative interpretations of prepared material, not live model classifications. The three relations appear as parallel explanations below the action guide, without tabs or added controls; they do not change the story or generated image. A separate section summarizes the design goals from §4.5 and offers an expandable explanation of perceptual breadth, depth and translation from §6.3.2. These are research-grounded design goals and directions, not claims that this prepared demo implements or validates every proposed capability.

## Deployment

Pushes to `main` run the tests, build with the `/CRAFT-demo/` base path, and deploy to GitHub Pages. The demo bundles its prepared images, video, and voice clips; running the published site requires no API keys.
