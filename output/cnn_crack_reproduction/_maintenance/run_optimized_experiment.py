"""Run the edited notebook in the CUDA environment and retain visible cell outputs."""
import base64
import contextlib
import io
import json
import os
from pathlib import Path
import sys
import traceback

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root = Path(__file__).resolve().parents[1]
os.chdir(root)
target = root / 'CNN混凝土裂缝识别复现.ipynb'
original = target.read_bytes()
nb = json.loads(original.decode('utf-8'))
namespace = {}
outputs = []

class Tee(io.StringIO):
    def write(self, text):
        sys.__stdout__.write(text)
        sys.__stdout__.flush()
        return super().write(text)

def show(*args, **kwargs):
    for figure_id in plt.get_fignums():
        figure = plt.figure(figure_id)
        buffer = io.BytesIO()
        figure.savefig(buffer, format='png', dpi=110, bbox_inches='tight')
        outputs.append({'output_type': 'display_data', 'metadata': {}, 'data': {
            'image/png': base64.b64encode(buffer.getvalue()).decode('ascii'),
            'text/plain': ['<Figure: executed experiment>'],
        }})
    plt.close('all')

plt.show = show
count = 0
for cell in nb['cells']:
    if cell['cell_type'] != 'code':
        continue
    count += 1
    outputs = []
    stream = Tee()
    print(f'Executing section {count}', flush=True)
    try:
        with contextlib.redirect_stdout(stream):
            exec(compile(''.join(cell['source']), f'section-{count}', 'exec'), namespace)
    except Exception:
        traceback.print_exc()
        raise
    cell['execution_count'] = count
    text = stream.getvalue()
    cell['outputs'] = ([{'output_type': 'stream', 'name': 'stdout', 'text': text.splitlines(True)}]
                       if text else []) + outputs

executed = root / '_maintenance' / 'verification_outputs' / 'optimized_executed.ipynb'
executed.write_text(json.dumps(nb, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
if target.read_bytes() == original:
    target.write_text(json.dumps(nb, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('Saved executed notebook in place.', flush=True)
else:
    print(f'Notebook changed during execution; retained current edits. Executed copy: {executed}', flush=True)
