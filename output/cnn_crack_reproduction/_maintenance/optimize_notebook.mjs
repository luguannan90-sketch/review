import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file=path.join(root,'CNN混凝土裂缝识别复现.ipynb');
const raw=fs.readFileSync(file,'utf8');
const nb=JSON.parse(raw);
if(nb.cells.filter(c=>c.cell_type==='code').length!==22) throw Error('Unexpected notebook layout');
fs.mkdirSync(path.join(root,'_backups'),{recursive:true});
const backup=path.join(root,'_backups',`优化前_${new Date().toISOString().replace(/[:.]/g,'-')}.ipynb`);
fs.writeFileSync(backup,raw,{flag:'wx'});
const list=s=>s.trim().split('\n').map((l,i,a)=>l+(i<a.length-1?'\n':''));
const get=n=>nb.cells[n*2].source.join('');
const set=(n,s)=>{nb.cells[n*2].source=list(s);};
const desc=(n,title,s)=>{nb.cells[n*2-1].source=list(`## ${n} ${title}\n\n${s}`);};
set(2,`# 2 实验配置：模型、数据划分和训练参数
PROJECT_ROOT = Path.cwd().resolve()
DATA_ROOT = PROJECT_ROOT / 'SDNET2018' / 'SDNET2018'

# 改模型时只修改这一项；原报告模型仍可选 ConcreteCrackCNN。
MODEL_NAME = 'ImprovedCrackCNN'
DROPOUT = 0.3
MODEL_KWARGS = {'dropout': DROPOUT} if MODEL_NAME == 'ImprovedCrackCNN' else {}
SPLIT_SEED = 42       # 固定数据划分，比较实验时不要修改
SEED = 42            # 模型初始化、训练打乱及增强的随机种子
USE_FLIPS = True
LEARNING_RATE = 0.0001
BATCH_SIZE = 32
EPOCHS = 30
PATIENCE = 5
NUM_WORKERS = 0
MAX_TRAIN_BATCHES = None
IMAGE_SIZE = 224
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]

EXPERIMENT_NAME = 'improved_cnn_flip_lr1e4_seed42'
OUTPUT_DIR = PROJECT_ROOT / 'artifacts' / EXPERIMENT_NAME
# 只预测旧模型时可填 Path(r'完整模型路径')；None 表示使用本次实验最佳模型。
CHECKPOINT_OVERRIDE = None
RUN_TEST_EVALUATION = False
RUN_SMALL_SAMPLE_CHECK = False
assert MODEL_NAME in ('ConcreteCrackCNN', 'ImprovedCrackCNN')
assert EPOCHS > 0 and BATCH_SIZE > 0 and LEARNING_RATE > 0 and PATIENCE > 0
print('Dataset:', DATA_ROOT)
print('Experiment:', OUTPUT_DIR)
print('Model:', MODEL_NAME, MODEL_KWARGS)
print('Split seed / train seed:', SPLIT_SEED, SEED)`);
desc(2,'统一实验配置','集中管理模型选择、增强开关、学习率、输出目录和两种随机种子。划分种子与训练种子已分开：重复不同初始化实验时只改 SEED，保持 SPLIT_SEED 不变。默认训练改进 CNN；选择 ConcreteCrackCNN 可复用原模型。已有模型的目录不会被训练单元静默覆盖。');
set(4,get(4).replaceAll('transforms.Resize((224, 224))','transforms.Resize((IMAGE_SIZE, IMAGE_SIZE))').replaceAll('mean=[0.485, 0.456, 0.406]','mean=MEAN').replaceAll('std=[0.229, 0.224, 0.225]','std=STD').replace('    transforms.RandomHorizontalFlip(p=0.5),\n    transforms.RandomVerticalFlip(p=0.5),','    *([transforms.RandomHorizontalFlip(p=0.5),\n       transforms.RandomVerticalFlip(p=0.5)] if USE_FLIPS else []),'));
set(7,get(7).replace('random.Random(SEED)','random.Random(SPLIT_SEED)'));
desc(7,'固定照片分组，划分训练与验证数据','按文件名前缀分组，固定 SPLIT_SEED=42，保持原来 10,848 张训练、2,772 张验证的划分。改变模型初始化种子不会再改变验证集。该规则以文件名前缀代表来源分组；图片数量、路径或命名变化后需重新核对。');
set(8,get(8).replace('    shuffle=True,','    shuffle=True,\n    generator=torch.Generator().manual_seed(SEED),').replace('print("训练预处理：水平翻转 + 垂直翻转")','print("训练翻转增强：", USE_FLIPS)'));
set(9,get(9)+`


class ImprovedCrackCNN(nn.Module):
    """较小的 CNN：三级卷积、批归一化、4×4 池化与 Dropout。"""
    def __init__(self, dropout=0.3):
        super().__init__()
        def block(in_channels, out_channels):
            return nn.Sequential(
                nn.Conv2d(in_channels, out_channels, 3, padding=1, bias=False),
                nn.BatchNorm2d(out_channels),
                nn.ReLU(inplace=True),
                nn.MaxPool2d(2),
            )
        self.features = nn.Sequential(block(3, 16), block(16, 32), block(32, 64))
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d((4, 4)),
            nn.Flatten(),
            nn.Linear(64 * 4 * 4, 64),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(64, 2),
        )

    def forward(self, x):
        return self.classifier(self.features(x))


def build_model(name, kwargs=None):
    registry = {
        'ConcreteCrackCNN': ConcreteCrackCNN,
        'ImprovedCrackCNN': ImprovedCrackCNN,
    }
    if name not in registry:
        raise ValueError(f'未知模型：{name}')
    return registry[name](**(kwargs or {}))`);
desc(9,'模型工厂：原始 CNN 与改进 CNN','原 CNN 保留，旧权重仍可加载。改进模型使用三级卷积和 BatchNorm，再将特征压缩为 4×4，避免原来 100352→128 的巨大全连接层；Dropout 只在训练时随机丢弃部分特征。输出仍为两类 logits，损失函数仍为加权交叉熵。该组合是新的架构候选，是否更准确需要验证实验，不能只凭参数更少判断。');
let engine=get(10);
engine=engine.replace('    return weighted_loss_sum / weight_sum','    if weight_sum == 0:\n        raise ValueError("没有处理任何训练图片")\n    return weighted_loss_sum / weight_sum');
const cut=engine.indexOf('    true_positive =');
engine=engine.slice(0,cut)+`    if weight_sum == 0:
        raise ValueError('评估数据集为空')
    return weighted_loss_sum / weight_sum, calculate_metrics(targets, predictions)
`;
set(10,engine);
desc(10,'训练与评估引擎','训练负责梯度更新，评估使用 inference_mode，不更新参数。损失按类别权重总和汇总；指标统一调用第 11 节 calculate_metrics，避免多套计算逻辑不一致。先运行第 11 节定义后再调用评估函数。');
let init=get(13).replace('model = ConcreteCrackCNN().to(device)','model = build_model(MODEL_NAME, MODEL_KWARGS).to(device)');
init+=`

run_config = {
    'experiment': EXPERIMENT_NAME,
    'model': MODEL_NAME, 'model_kwargs': dict(MODEL_KWARGS),
    'seed': SEED, 'split_seed': SPLIT_SEED,
    'learning_rate': LEARNING_RATE, 'batch_size': BATCH_SIZE,
    'epoch_limit': EPOCHS, 'early_stopping_patience': PATIENCE,
    'augmentation': ['horizontal_flip', 'vertical_flip'] if USE_FLIPS else [],
    'image_size': [IMAGE_SIZE, IMAGE_SIZE],
    'normalization': {'mean': MEAN, 'std': STD},
    'class_names': list(CLASS_NAMES), 'class_weights': class_weights.tolist(),
    'torch_version': str(torch.__version__), 'device': str(device),
    'parameter_count': sum(p.numel() for p in model.parameters()),
}
`;
set(13,init);
desc(13,'初始化选定模型、损失函数和优化器','从相同种子初始化第 2 节选择的网络。类别权重只根据训练子集计算；学习率仍为 0.0001，不同时新增学习率调度或采样策略。记录 run_config，供保存和加载使用。重复运行会重置模型；训练前需与 DataLoader 的初始化一并重新运行。');
let training=get(14);
training=training.replace('history = {',`if (OUTPUT_DIR / 'model_last.pt').exists() or (OUTPUT_DIR / 'model_best.pt').exists():
    raise FileExistsError('实验目录已有模型，请在第 2 节设置新的 EXPERIMENT_NAME 后重启运行。')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
(OUTPUT_DIR / 'config.json').write_text(
    json.dumps(run_config, ensure_ascii=False, indent=2), encoding='utf-8'
)
history = {`);
training=training.replace("'architecture': 'ConcreteCrackCNN',", "'architecture': MODEL_NAME,\n        'model_kwargs': dict(MODEL_KWARGS),\n        'config': run_config,");
training=training.replace("    if rounds_without_improvement >= patience:",`    (OUTPUT_DIR / 'history.json').write_text(
        json.dumps({'history': history, 'best_epoch': best_epoch,
                    'best_val_f1': best_val_f1, 'epochs_ran': len(history['train_loss']),
                    'elapsed_seconds': time.perf_counter() - started},
                   ensure_ascii=False, indent=2), encoding='utf-8'
    )

    if rounds_without_improvement >= patience:`);
set(14,training);
desc(14,'执行训练与早停，每轮保存检查点','保持 30 轮上限、验证 F1 选择最佳模型和 patience=5。每轮保存最后模型及训练历史；最佳模型与最后模型都记录架构名称、构造参数和预处理信息。已存在的实验目录会报错，请设置新实验名，避免覆盖历史对照。检查点用于推理，尚未保存完整优化器和随机状态，不用于无缝断点续训。');
let save=get(15);
const a=save.indexOf('config = {'),b=save.indexOf("(OUTPUT_DIR / 'config.json')",a);
save=save.slice(0,a)+`config = {**run_config, 'epochs_ran': epochs_ran}\n`+save.slice(b);
save=save.replace("'seed': SEED,", "'seed': SPLIT_SEED,");
save=save.replace("'experiment': 'group_validation_flip',", "'experiment': EXPERIMENT_NAME,");
save=save.replace("'train_count': len(train_indices),", "'train_files': [str(Path(train_full.samples[i][0]).relative_to(DATA_ROOT)) for i in train_indices],\n    'validation_files': [str(Path(train_full.samples[i][0]).relative_to(DATA_ROOT)) for i in val_indices],\n    'train_count': len(train_indices),");
set(15,save);
set(17,`# 17 根据检查点自动构造模型与预测预处理
CHECKPOINT_PATH = Path(CHECKPOINT_OVERRIDE) if CHECKPOINT_OVERRIDE else OUTPUT_DIR / 'model_best.pt'
assert CHECKPOINT_PATH.is_file(), f'找不到模型：{CHECKPOINT_PATH}'
best_checkpoint = torch.load(CHECKPOINT_PATH, map_location=device, weights_only=True)
assert best_checkpoint['class_names'] == list(CLASS_NAMES), '模型类别顺序不匹配'
inference_model = build_model(
    best_checkpoint['architecture'], best_checkpoint.get('model_kwargs', {})
).to(device)
inference_model.load_state_dict(best_checkpoint['model_state_dict'])
inference_model.eval()
normalization = best_checkpoint['normalization']
inference_transform = transforms.Compose([
    transforms.Resize(tuple(best_checkpoint['image_size'])),
    transforms.ToTensor(),
    transforms.Normalize(mean=normalization['mean'], std=normalization['std']),
])
print('Loaded:', CHECKPOINT_PATH)
print('Architecture:', best_checkpoint['architecture'])
print('Best epoch:', best_checkpoint.get('epoch', '未记录'))`);
desc(17,'自动加载原模型或改进模型','读取检查点中的 architecture 和 model_kwargs 自动创建网络，严格加载权重；旧版 ConcreteCrackCNN 权重也兼容。预测预处理从检查点恢复，不依赖当前训练配置。只预测时运行第 1、2、3、9、17、21 节，在第 2 节用 CHECKPOINT_OVERRIDE 指向已有模型。');
set(21,get(21).replace('transform(rgb_image)','inference_transform(rgb_image)'));
desc(21,'独立预测自己的图片','只需导入、配置、设备、模型定义和加载模型即可预测，不依赖数据集或训练单元。修改 sample_path；使用模型文件记录的固定预处理。输出整张图片的分类及两类分数，不定位裂缝，不把模型分数视为可靠性保证。');
set(22,get(22).replace('small_model = ConcreteCrackCNN().to(device)','small_model = build_model(MODEL_NAME, MODEL_KWARGS).to(device)'));
desc(22,'固定小样本学习能力检查（可选）','沿用各 16 张两类图片，检查当前选定模型是否能够学习。默认跳过；输出小样本诊断，不覆盖正式模型。小样本满分不能证明模型的泛化性能。');
nb.cells[0].source=list(`# CNN 混凝土裂缝识别：可对照的模型优化\n\n整体结构：配置 → 数据与固定分组 → 模型工厂 → 训练及验证 → 最佳检查点 → 诊断与独立预测。每块均保留中文说明。\n\n- 原模型 ConcreteCrackCNN 完整保留，约 1285 万参数；改进候选 ImprovedCrackCNN 用更小的特征分类层、BatchNorm 和 Dropout。\n- 第 2 节选择模型；默认改进 CNN、翻转增强、学习率 0.0001、最多 30 轮。类别权重和原验证分组保持不变。\n- SPLIT_SEED 固定划分，SEED 控制模型与训练随机性。重复不同随机种子时不要改变 SPLIT_SEED。\n- 训练：顺序运行第 1–19 节。输出到新实验目录，历史模型不会被静默覆盖。\n- 只预测：运行第 1、2、3、9、17、21 节，并将 CHECKPOINT_OVERRIDE 指向已有模型。\n- 第 20 节最终测试和第 22 节小样本诊断默认关闭。测试集不用于挑选模型。\n- 原翻转 CNN 验证 F1 约 0.523、BA 约 0.727，是待比较的历史基准；优化代码本身不等于精度已经提升。\n\n本文件整理前的原件及执行输出已备份到 _backups。`);
nb.cells.at(-1).source=list(`## 实验比较与应用边界\n\n比较不同模型时，固定数据划分、增强、学习率和评价方法，查看验证 Precision、Recall、F1 和 BA。改进网络同时改变了特征层、池化和正则化，若有提升，只能归因于这一组合；确认单独组件的作用需另外做消融实验。\n\n验证集用于选模型，测试集保留到方案确定后。分类模型输出整张图的裂缝类别，不提供裂缝位置、宽度或结构安全结论。\n\n输出包括 config.json、split.json、history.json、metrics.json、model_best.pt、model_last.pt、learning_curves.png 和诊断图片。模型文件包含架构及预处理信息，加载时自动还原。`);
nb.cells.forEach(c=>{if(c.cell_type==='code'){c.execution_count=null;c.outputs=[];}});
fs.writeFileSync(file,JSON.stringify(nb,null,1)+'\n');
console.log(JSON.stringify({file,backup}));
