# Inside the Strain

An animated, evidence-labeled film of what happens inside a hamstring after a strain,
from second 0 to month 6+. Built for athletic trainers and sports clinicians.

- `index.html` – the interactive player: scrub, jump to scenes, switch captions between
  scientific and plain-language, read the full narration and clinical tie-in for each scene.
- `film-core.js` – the drawing engine (fibers, basal lamina, cells, capillaries, scar, fascia).
- `film-scenes.js` – the 13 scenes, captions, tie-in cards, and timeline.
- `render.html` + `export.cjs` – renders the film to MP4 (1080p, 30 fps).

## Re-render the video

```
node export.cjs video inside-the-strain.mp4 30 sci     # scientific captions
node export.cjs video inside-the-strain-plain.mp4 30 plain   # plain-language captions
node export.cjs video inside-the-strain-clean.mp4 30 off     # no captions (for voiceover)
```

Needs Node, Playwright with Chromium, and ffmpeg. Every frame is a pure function of time,
so editing timings or text in `film-scenes.js` and re-running is all it takes.

## Voiceover

Narration is generated with Kokoro (open-source TTS, voice `am_michael`) from the caption text,
the tie-in cards and the intro. Where a spoken line runs longer than its caption window, the
animation for that stretch is slowed to fit, so picture and voice stay in sync.

```
node voice/build_script.cjs                      # dump voiced segments
python voice/tts.py <kokoro_dir> am_michael 1.08 # synthesize (needs kokoro-onnx + model files)
node voice/timeline.cjs                          # stretch timeline to fit each line
python voice/mix.py                              # build voice/narration.wav
node export.cjs video silent.mp4 30 sci voice/timeline.json
ffmpeg -i silent.mp4 -i voice/narration.wav -map 0:v -map 1:a -c:v copy -af loudnorm -c:a aac inside-the-strain-voiceover.mp4
```

Pronunciation fixes for abbreviations live in the `SUBS` list in `voice/tts.py`.
