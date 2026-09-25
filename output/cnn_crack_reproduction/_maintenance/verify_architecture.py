"""Check notebook integrity and new/legacy checkpoint inference without retraining."""
import ast
import json
from pathlib import Path
import os

import matplotlib
matplotlib.use('Agg')
import torch

root = Path(__file__).resolve().parents[1]
os.chdir(root)
notebook_path = root / 'CNN混凝土裂缝识别复现.ipynb'
nb = json.loads(notebook_path.read_text(encoding='utf-8'))
cells = [''.join(cell['source']) for cell in nb['cells'] if cell['cell_type'] == 'code']
for source in cells:
    ast.parse(source)
ns = {}
for i in range(13):
    exec(compile(cells[i], f'section-{i+1}', 'exec'), ns)
assert len(ns['train_data']) == 10848 and len(ns['val_data']) == 2772
assert set(ns['train_indices']).isdisjoint(ns['val_indices'])
images, labels = next(iter(ns['val_loader']))
images = images[:4].to(ns['device'])
labels = labels[:4].to(ns['device'])
candidate = ns['model']
candidate.train()
loss = ns['criterion'](candidate(images), labels)
loss.backward()
assert torch.isfinite(loss)
assert any(p.grad is not None and p.grad.abs().sum() > 0 for p in candidate.parameters())
ns['optimizer'].step()
candidate.eval()
with torch.inference_mode():
    reference = candidate(images).cpu()
assert reference.shape == (4, 2)
qa = root / '_maintenance' / 'verification_outputs'
qa.mkdir(exist_ok=True)
checkpoint = qa / 'improved_roundtrip.pt'
torch.save({
    'model_state_dict': candidate.state_dict(),
    'architecture': ns['MODEL_NAME'], 'model_kwargs': ns['MODEL_KWARGS'],
    'class_names': list(ns['CLASS_NAMES']), 'image_size': [224, 224],
    'normalization': {'mean': ns['MEAN'], 'std': ns['STD']},
}, checkpoint)
ns['CHECKPOINT_OVERRIDE'] = checkpoint
exec(compile(cells[16], 'section-17', 'exec'), ns)
with torch.inference_mode():
    restored = ns['inference_model'](images).cpu()
torch.testing.assert_close(restored, reference)
candidate_parameters = sum(p.numel() for p in candidate.parameters())
baseline = ns['build_model']('ConcreteCrackCNN')
baseline_parameters = sum(p.numel() for p in baseline.parameters())
ns['CHECKPOINT_OVERRIDE'] = root / 'artifacts/group_validation_flip/model_best.pt'
exec(compile(cells[16], 'section-17-legacy', 'exec'), ns)
with torch.inference_mode():
    assert ns['inference_model'](images).shape == (4, 2)
report = {'status': 'passed', 'baseline_parameters': baseline_parameters,
          'improved_parameters': candidate_parameters,
          'reduction_percent': (1 - candidate_parameters / baseline_parameters) * 100,
          'checks': ['notebook format and code syntax', 'original group split',
                     'finite backward gradients', 'improved checkpoint roundtrip',
                     'legacy checkpoint loading and forward pass']}
(qa / 'verification.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
