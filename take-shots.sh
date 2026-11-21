#!/bin/bash
# Captures the four screenshots listed in shots.json with headless Chrome.
# Usage: ./take-shots.sh   (run from the repository root; serve.ts must be
# running on http://localhost:8080)
set -e
cd "$(dirname "$0")"
mkdir -p screenshots
python3 - <<'PY'
import json, subprocess, sys
shots = json.load(open('shots.json'))
for shot in shots:
    url = 'http://localhost:8080/' + shot['query']
    out = 'screenshots/' + shot['name']
    cmd = [
        'google-chrome-stable', '--headless=new', '--disable-gpu',
        '--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars',
        f"--window-size={shot['w']},{shot['h']}",
        '--virtual-time-budget=8000',
        f'--screenshot={out}', url,
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print('FAILED', shot['name'], r.stderr[-500:])
        sys.exit(1)
    print('shot', shot['name'], '->', out)
PY
python3 - <<'PY'
from PIL import Image
import os
for name in sorted(os.listdir('screenshots')):
    path = os.path.join('screenshots', name)
    im = Image.open(path)
    size = os.path.getsize(path)
    ok = size <= 256 * 1024 and max(im.size) <= 1280 and min(im.size) >= 480
    print(f"{name}: {im.size[0]}x{im.size[1]} {im.format} {size} bytes {'OK' if ok else 'FAIL'}")
PY
