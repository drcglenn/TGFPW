import json, os, numpy as np, soundfile as sf
here = os.path.dirname(os.path.abspath(__file__)); tl = json.load(open(os.path.join(here, 'timeline.json')))
sr = 24000; mix = np.zeros(int((tl['total'] + 1) * sr), np.float32)
for a in tl['audio']:
  x, r = sf.read(os.path.join(here, 'wav', a['file']), dtype='float32'); assert r == sr
  i = int(a['at'] * sr); mix[i:i + len(x)] += x
sf.write(os.path.join(here, 'narration.wav'), mix, sr); print('narration', round(len(mix) / sr, 1), 's, peak', round(float(np.abs(mix).max()), 2))
