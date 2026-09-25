import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'CNN混凝土裂缝识别复现.ipynb');
const original = fs.readFileSync(target, 'utf8');
const nb = JSON.parse(original);
if (nb.cells.length !== 34) throw new Error('Notebook changed; inspect before applying this one-time migration.');
const source = i => nb.cells[i].source.join('');
if (!source(33).includes('misclassified_summary') || !source(17).includes('rounds_without_improvement')) {
  throw new Error('Unexpected notebook layout');
}
const backupDir = path.join(root, '_backups');
fs.mkdirSync(backupDir, { recursive: true });
const backup = path.join(backupDir, `CNN混凝土裂缝识别复现_整理前_${new Date().toISOString().replace(/[:.]/g, '-')}.ipynb`);
fs.writeFileSync(backup, original, { flag: 'wx' });

const lines = s => s.trim().split('\n').map((line, i, arr) => line + (i < arr.length - 1 ? '\n' : ''));
const cells = [];
const md = s => cells.push({ cell_type: 'markdown', metadata: {}, source: lines(s) });
const code = s => cells.push({ cell_type: 'code', execution_count: null, metadata: {}, outputs: [], source: lines(s) });
function section(title, description, body) {
  md(`## ${title}\n\n${description}`);
  code(`# ${title}\n# 用途和运行条件见上方说明单元。\n\n${body}`);
}
const guarded = (flag, body, message) => `if ${flag}:\n${body.trim().split('\n').map(l => '    ' + l).join('\n')}\nelse:\n    print(${JSON.stringify(message)})`;

md(`# CNN 混凝土裂缝识别训练与应用\n\n本 Notebook 保留当前翻转增强实验：原始 ConcreteCrackCNN、加权交叉熵、学习率 0.0001、最多 30 轮、验证 F1 连续 5 轮未改善时早停。标签固定为无裂缝 uncracked=0、有裂缝 cracked=1。\n\n**运行路线**\n\n- 训练新模型：依次运行第 1–16 节，再运行第 17–19 节查看最佳模型表现。第 14 节会重新训练，并覆盖当前输出目录中的同名模型文件；新实验请先改第 2 节的目录。\n- 只预测自己的图片：运行第 1、2、3、4、9、17、21 节即可，无需训练或加载整个数据集。第 17 节读取已有的 model_best.pt。\n- 最终测试：方案确定后，在第 2 节启用 RUN_TEST_EVALUATION，再运行第 20 节。\n- 小样本排错：第 22 节为可选诊断，默认跳过；不代表实际泛化性能。\n\n整理前的全部代码、历史输出和执行序号保存在同目录 _backups 文件夹。当前显示输出已清空，避免把旧实验结果误当成新顺序的执行结果。`);

section('1 导入依赖与定义类别名称', '用途：导入后续代码需要的库，并固定类别顺序。\n\n运行时机：每次重启内核后首先运行。输出：PyTorch 版本和 CUDA 是否可用。', `from collections import Counter
from pathlib import Path
import json
import random
import time

import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
import torch
from torch import nn, optim
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, transforms

CLASS_NAMES = ('uncracked', 'cracked')
print('PyTorch:', torch.__version__)
print('CUDA available:', torch.cuda.is_available())`);

let config = source(1).replace('from pathlib import Path\n\n', '');
config = config.replace('EPOCHS = 30', 'EPOCHS = 30\nPATIENCE = 5\nRUN_TEST_EVALUATION = False\nRUN_SMALL_SAMPLE_CHECK = False');
config = config.replace(/assert \(DATA_ROOT \/ 'train'\).*\nassert \(DATA_ROOT \/ 'test'\).*\n/, '');
section('2 设置路径、训练参数与可选检查', '用途：集中设置数据位置、实验输出目录和训练参数。PROJECT_ROOT 是内核当前工作目录，不保证始终等于 Notebook 所在目录；路径不对时可改成绝对路径。\n\n当前使用完整分组数据；QUICK_RUN 和 MAX_TRAIN_SAMPLES/MAX_TEST_SAMPLES 是旧版本保留变量，不再自动启用小样本模式。EPOCHS 是轮数上限，PATIENCE 是早停等待轮数。\n\n输出：路径、学习率和轮数上限。只预测时，OUTPUT_DIR 应指向已有模型的实验目录。', config);
section('3 固定随机种子并选择计算设备', '用途：设置 Python、NumPy、PyTorch 的随机起点，自动选择 CUDA 或 CPU。固定种子有助于重复实验，但不能保证跨环境结果完全相同。\n\n依赖：第 1、2 节。输出：设备和显卡名称。', source(3));
section('4 定义图像预处理与标签规则', '用途：训练图片随机水平/垂直翻转；验证、测试和预测只使用固定预处理。所有图片转为 224×224 的 RGB Tensor 并标准化。\n\nC 开头的目录映射为裂缝 1，U 开头映射为无裂缝 0。此处只定义处理规则和 Dataset 类，还没有加载图片列表。', source(5));
section('5 加载数据列表并检查类别数量', '用途：分别创建训练增强版、训练固定版和测试版数据集，检查前两者图片顺序一致。\n\n依赖：第 1–4 节及 DATA_ROOT 下的 train/test 目录。输出：两类图片数量；不会复制或移动原始图片。', `assert (DATA_ROOT / 'train').is_dir(), f'找不到训练集：{DATA_ROOT / "train"}'
assert (DATA_ROOT / 'test').is_dir(), f'找不到测试集：{DATA_ROOT / "test"}'

${source(7)}`);
section('6 查看图片文件名', '用途：打印每类前 10 个文件名，帮助检查命名方式。\n\n例如 7001-1.jpg 的分组前缀是 7001。仅检查文件名不能证明标签内容正确；需要时再查看图片。依赖：第 5 节。', source(8));
section('7 按文件名前缀划分训练集与验证集', '用途：同一前缀的图片放在同一组，约 20% 的组用于验证。组数比例不等于精确图片比例。\n\n依赖：第 5 节的数据列表。输出：train_indices、val_indices 和类别统计；检查索引不重叠且两边都有两个类别。固定 SEED 和文件列表后，后续实验复用相同划分。', source(9));
section('8 创建训练、验证、测试与诊断加载器', '用途：训练加载器打乱图片并使用翻转增强；验证和测试加载器不打乱、使用固定预处理。\n\n另建 train_eval_loader，专门在不随机翻转的条件下诊断训练集，便于和验证集比较。创建测试加载器不会执行测试。', source(11) + `\n\ntrain_eval_loader = DataLoader(
    Subset(train_full, train_indices),
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=NUM_WORKERS,
)`);

const modelParts = source(13).split('model = ConcreteCrackCNN().to(device)');
if (modelParts.length !== 2) throw new Error('Could not separate model definition and initialization');
section('9 定义 CNN 网络结构', '用途：定义两层卷积、池化和全连接层。输入必须为 3×224×224，输出两类 logits。\n\n本节只定义类，不创建训练模型，也不更新参数。只加载已有模型进行预测时也要先运行本节。', modelParts[0]);
section('10 定义单轮训练与验证函数', '用途：train_one_epoch 执行反向传播和参数更新；evaluate 只检查结果，不更新参数。\n\n两者均按类别权重总和汇总损失。验证返回 Precision、Recall、Specificity、F1、BA 和混淆矩阵计数。运行本节仅定义函数，不会开始训练。', source(15));
const metricsFunctions = source(21).split('\ntargets, predictions = collect_predictions')[0];
section('11 定义预测收集与分类指标函数', '用途：收集整批预测，并计算以裂缝为正类的 Accuracy、Precision、Recall、F1、Specificity、BA。\n\n这些是通用函数，供最终测试使用；运行本节本身不会访问测试集。', metricsFunctions);
const probabilityFunction = source(27).split('\n\ndef print_split_diagnostics')[0];
const summarizeFunction = source(28).split('\n\nlr_diagnostics =')[0];
section('12 定义概率分布诊断函数', '用途：统计预测裂缝概率的均值、标准差、分位数及两类真实标签下的平均概率，用于判断模型是否总预测同一类。\n\n依赖：第 10 节。此处只定义函数；第 18 节才实际执行诊断。', probabilityFunction + '\n\n' + summarizeFunction);
section('13 初始化新模型、类别权重和优化器', '用途：按相同种子新建模型，用实际训练子集计算类别权重，并创建 Adam 优化器。\n\n依赖：分组名单、第 9 节模型类。再次运行本节会重置内存中的模型和优化器；只预测时跳过本节。输出：结构、参数量、类别数量和权重。', 'seed_everything(SEED)\nmodel = ConcreteCrackCNN().to(device)' + modelParts[1]);
section('14 开始训练、每轮验证并保存最佳模型', '用途：最多训练 EPOCHS 轮；每轮记录训练/验证结果。验证 F1 严格超过历史最佳时保存 model_best.pt；每轮保存 model_last.pt。\n\n连续 PATIENCE 轮未改善就停止。最佳模型依据验证 F1 选出，不代表已满足应用要求。依赖：第 1–13 节；运行本节会写入当前实验目录。', source(17).replace('patience = 5', 'patience = PATIENCE'));
let save = source(23);
const start = save.indexOf('last_checkpoint = {');
const end = save.indexOf("torch.save(last_checkpoint, OUTPUT_DIR / 'model_last.pt')");
if (start < 0 || end < 0) throw new Error('Missing duplicate last checkpoint block');
save = save.slice(0, start) + "# 两份模型已由训练循环保存；此处仅保存实验记录。\n" + save.slice(end + "torch.save(last_checkpoint, OUTPUT_DIR / 'model_last.pt')".length);
save = save.replace("    'experiment': 'group_validation_flip',", "    'experiment': OUTPUT_DIR.name,");
save = save.replace("config = {", "config = {\n    'seed': SEED,");
save = save.replace("split = {", "split = {\n    'seed': SEED,\n    'train_indices': train_indices,\n    'validation_indices': val_indices,\n    'validation_groups': sorted(val_groups),\n    'training_groups': sorted(set(groups) - val_groups),");
section('15 保存配置、划分名单和训练历史', '用途：保存 config.json、split.json、history.json 和 metrics.json。metrics.json 汇总的是最佳验证结果，不是测试成绩。\n\n依赖：第 14 节训练完成。本节不重复保存模型参数，避免加载最佳模型后误把它覆盖为“最后模型”。split.json 同时保留分组名单和图片索引。', save);
section('16 绘制训练与验证损失曲线', '用途：同时观察训练损失和验证损失随轮次的变化，辅助判断停滞或过拟合。训练损失来自增强图片，验证损失来自固定图片，不宜仅凭两条曲线的高低下结论。\n\n依赖：训练后的 history。输出：learning_curves.png。', source(19));
section('17 加载已保存的最佳模型', '用途：从 OUTPUT_DIR/model_best.pt 恢复模型，用于后续诊断和预测；加载不会训练。\n\n依赖：第 1、2、3、9 节及已有模型文件，不需要运行模型初始化或训练单元。这里单独创建 inference_model，不改变训练模型 model 和优化器的配对关系。', `CHECKPOINT_PATH = OUTPUT_DIR / 'model_best.pt'
assert CHECKPOINT_PATH.is_file(), f'找不到模型：{CHECKPOINT_PATH}'
best_checkpoint = torch.load(
    CHECKPOINT_PATH, map_location=device, weights_only=True
)
assert best_checkpoint['class_names'] == list(CLASS_NAMES), '模型类别顺序不匹配'
inference_model = ConcreteCrackCNN().to(device)
inference_model.load_state_dict(best_checkpoint['model_state_dict'])
inference_model.eval()
print('Loaded:', CHECKPOINT_PATH)
print('Best epoch:', best_checkpoint.get('epoch', '未记录'))`);
// Make the diagnostic helper explicit about which model it evaluates.
for (const c of cells) {
  if (c.cell_type !== 'code') continue;
  let s = c.source.join('');
  if (s.includes('def summarize_current_split(')) {
    s = s.replace('def summarize_current_split(name, loader):', 'def summarize_current_split(model, name, loader):');
    c.source = lines(s);
  }
}
section('18 诊断最佳模型的训练集与验证集表现', '用途：在固定预处理下比较训练集与验证集，查看分类指标和概率分布。\n\n依赖：第 8、10、12、13、17 节。只做诊断，不更新参数。输出 diagnostics.json；不使用测试集选择方案。', `diagnostics = {
    'best_epoch': best_checkpoint.get('epoch'),
    'train': summarize_current_split(inference_model, 'train', train_eval_loader),
    'validation': summarize_current_split(inference_model, 'validation', val_loader),
}
(OUTPUT_DIR / 'diagnostics.json').write_text(
    json.dumps(diagnostics, ensure_ascii=False, indent=2), encoding='utf-8'
)
print('Saved:', OUTPUT_DIR / 'diagnostics.json')`);
section('19 查看验证集误报与漏检图片', '用途：各展示最多 12 张误报和漏检图片，帮助发现阴影、纹理或细小裂缝等误判模式。\n\n依赖：第 8、12、17 节。输出 validation_misclassified.png 和 misclassified_examples.json。示例按当前顺序取前几张，不代表全部错误的分布。', source(33).replace('collect_probability_diagnostics(model, val_loader, device)', 'collect_probability_diagnostics(inference_model, val_loader, device)'));
section('20 最终测试集评估（可选）', '用途：方案确定后，评估最佳模型在测试集上的表现。默认 RUN_TEST_EVALUATION=False，整本运行时会跳过。\n\n启用后依赖第 8、11、17 节。输出 test_metrics.json；不要反复根据测试成绩选择权重、模型或阈值。', guarded('RUN_TEST_EVALUATION', `targets, predictions = collect_predictions(inference_model, test_loader, device)
test_metrics = calculate_metrics(targets, predictions)
for name, value in test_metrics.items():
    print(f'{name}: {value:.4f}' if isinstance(value, float) else f'{name}: {value}')
(OUTPUT_DIR / 'test_metrics.json').write_text(
    json.dumps(test_metrics, ensure_ascii=False, indent=2), encoding='utf-8'
)`, '已跳过最终测试；方案确定后将 RUN_TEST_EVALUATION 改为 True。'));
section('21 使用最佳模型识别自己的图片', '用途：修改 sample_path 为实际图片路径，显示预测类别、两类概率和图片。\n\n只预测的运行路线：第 1、2、3、4、9、17、21 节。概率是模型输出，不等于正确率；模型只做整张图片分类，不标注裂缝位置。', source(25).replace('model.eval()', 'inference_model.eval()').replace('model(input_tensor)', 'inference_model(input_tensor)'));
let small = source(27).slice(source(27).indexOf('label_indices = {'));
small = small.replaceAll("OUTPUT_DIR / 'diagnostics.json'", "OUTPUT_DIR / 'small_sample_diagnostics.json'");
section('22 固定 32 张图片的学习能力检查（可选）', '用途：从训练子集中各取 16 张图片，用新建的 small_model 重复训练，检查基本学习链路。重复 3 次，每次 50 轮；默认跳过，不属于正式实验。\n\n启用 RUN_SMALL_SAMPLE_CHECK 后运行，依赖数据划分、模型定义、损失权重及训练/评估函数。结果保存为 small_sample_diagnostics.json，避免覆盖最佳模型的诊断记录。小样本达到 100% 不代表实际泛化性能。', guarded('RUN_SMALL_SAMPLE_CHECK', small, '已跳过固定 32 张图片检查；需要排错时再启用 RUN_SMALL_SAMPLE_CHECK。'));
md(`## 指标与文件速查\n\n- Recall：实际裂缝中找出了多少；Precision：判为裂缝的图片中多少是真的。\n- F1：综合 Precision 和 Recall；BA：裂缝召回率和无裂缝识别率的平均值。\n- Train Loss：训练过程的加权损失；Validation Loss：验证集的加权损失，都不是错误百分比。\n- model_best.pt：验证 F1 最高的模型；model_last.pt：训练最后一轮的模型；都需要结合网络定义加载。\n- 当前训练/验证来自桥面目录，测试来自路面目录，应结合表面类型差异解释结果。\n\n旧版重复诊断、早停后追加训练以及粘贴到开头的代码文本已从主流程移除，完整原件保存在 _backups；已有实验结果文件未更改。`);
nb.cells = cells;
nb.nbformat = 4;
nb.nbformat_minor = 5;
cells.forEach((cell, i) => { cell.id = `cnn-section-${String(i).padStart(3, '0')}`; });
fs.writeFileSync(target, JSON.stringify(nb, null, 1) + '\n', 'utf8');
console.log(JSON.stringify({ target, backup, cells: cells.length, codeCells: cells.filter(c => c.cell_type === 'code').length }));
