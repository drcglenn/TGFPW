# Patched, Not Rebuilt

An animated, evidence-tagged film of how a ligament heals after a sprain, side by side with
muscle. Companion to `../muscle-healing-film` (Inside the Strain), and built on its engine.

- `index.html` – interactive player (publish with `film-core.js` from the muscle film alongside)
- `lig-engine.js` – ligament drawing: crimped collagen bundles, epiligament, knee, cells, cards
- `lig-scenes.js` – the 11 scenes, captions, tie-in cards and timeline
- `render.html` + `export.cjs` – frame and MP4 export; `voice/` – Kokoro voiceover pipeline

```
node voice/build_script.cjs
python voice/tts.py <kokoro_dir> am_michael 1.08
node voice/timeline.cjs && python voice/mix.py
node export.cjs video silent.mp4 30 sci voice/timeline.json
ffmpeg -i silent.mp4 -i voice/narration.wav -map 0:v -map 1:a -c:v copy -af loudnorm -c:a aac patched-not-rebuilt-voiceover.mp4
```
