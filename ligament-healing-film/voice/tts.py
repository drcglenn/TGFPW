"""Speak every segment in voice/segments.json with Kokoro. Usage: python tts.py <kokoro_dir> <voice> [speed]"""
import json, re, sys, os, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
kdir, voice = sys.argv[1], sys.argv[2]; speed = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
here = os.path.dirname(os.path.abspath(__file__))
SUBS = [
  (r'Grade III', 'Grade three'), (r'Grade II', 'Grade two'), (r'Grade I\b', 'Grade one'),
  (r'\bPDGF\b', 'P D G F'), (r'TGF-β', 'T G F beta'), (r'\bIGF\b', 'I G F'), (r'\bACL\b', 'A C L'), (r'\bMCL\b', 'M C L'),
  (r'\(BEAR\)', ', or BEAR,'), (r'\bBEAR\b', 'bear'), (r'30%', '30 percent'), (r'M1 → M2', 'M one to M two'),
  (r'\(([^)]*)\)', r', \1,'), (r'~', 'about '), (r'0–48 h', 'Zero to forty-eight hours'), (r'(\d+)–(\d+)\+', r'\1 to \2 and beyond'),
  (r'(\d+)–(\d+)', r'\1 to \2'), (r'\b47 h\b', '47 hours'), (r'1,200 mg/day', 'twelve hundred milligrams a day'), (r'(\d) wk', r'\1 weeks'),
  (r'IL-1β', 'I L one beta'), (r'IL-6', 'I L six'), (r'IL-10', 'I L ten'), (r'IGF-1', 'I G F one'), (r'TGF-β1', 'T G F beta one'),
  (r'\bTNF\b', 'T N F'), (r'\bM1\b', 'M one'), (r'\bM2\b', 'M two'), (r'MyoD', 'myo D'), (r'Myf5', 'myf five'),
  (r'\bNSAIDs\b', 'N-sayds'), (r'\bNSAID\b', 'N-sayd'), (r'\bDAMPs\b', 'damps'), (r'\bCOX\b', 'cox'), (r'\bCK\b', 'C K'),
  (r'\bGI\b', 'G I'), (r'\bVEGF\b', 'vej-eff'), (r'eNOS', 'e-noss'), (r'\bESWT\b', 'E S W T'), (r'\bNMJs\b', 'neuromuscular junctions'),
  (r'\bPRP\b', 'P R P'), (r'\bMRI\b', 'M R I'), (r'\bHA\b', 'hyaluronan'), (r'e-stim', 'e-stim'), (r'20 Hz', '20 hertz'),
  (r'type III', 'type three'), (r'type I\b', 'type one'), (r'Type III', 'Type three'), (r'Type I\b', 'Type one'),
  (r'→', ' to '), (r'calcium–hyaluronan', 'calcium hyaluronan'), (r'"', ''), (r'tenascin-C', 'tenascin C'),
]
def norm(t):
  for a, b in SUBS: t = re.sub(a, b, t)
  return re.sub(r'\s+,', ',', re.sub(r'\s+', ' ', t)).strip()
d = json.load(open(os.path.join(here, 'segments.json')))
k = Kokoro(os.path.join(kdir, 'model.onnx'), os.path.join(kdir, 'voices.npz'))
os.makedirs(os.path.join(here, 'wav'), exist_ok=True)
out = []
for i, s in enumerate(d['segs']):
  txt = norm(s['text'])
  a, sr = k.create(txt, voice=voice, speed=speed, lang='en-gb' if voice.startswith('b') else 'en-us')
  nz = np.nonzero(np.abs(a) > 1e-3)[0]
  if len(nz): a = a[max(0, nz[0] - 800): nz[-1] + 2400]
  sf.write(os.path.join(here, 'wav', f'{i:03d}.wav'), a, sr)
  out.append({**s, 'spoken': txt, 'dur': len(a) / sr, 'sr': sr})
  print(f'{i:3d} {len(a)/sr:5.1f}s  {txt[:70]}')
json.dump(out, open(os.path.join(here, 'durations.json'), 'w'), indent=1)
