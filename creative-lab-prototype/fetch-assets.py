"""Download the exact public Meshy assets observed while reviewing its UI."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen
import json
import re

assets_dir = Path(__file__).parent / 'public' / 'assets'
sources = json.loads((assets_dir / 'sources.json').read_text())

def download(item):
    name, url = item
    if (assets_dir / name).exists():
        return name, 'cached'
    data = urlopen(url, timeout=30).read()
    (assets_dir / name).write_bytes(data)
    return name, len(data)

for result in ThreadPoolExecutor(max_workers=8).map(download, sources.items()):
    print(result)

html = urlopen('https://www.meshy.ai/creative-lab', timeout=30).read().decode()
logo = next(svg for svg in re.findall(r'<svg\b.*?</svg>', html, re.S) if 'viewBox="0 0 167 64"' in svg)
(assets_dir / 'meshy-logo.svg').write_text(logo)
print('Saved official Meshy logo')
