# write：面向计算材料的论文写作 skill

基于 MIT 开源项目 [Humanizer-zh](https://github.com/op7418/Humanizer-zh) 定制，适合计算材料、DFT/VASP、机器学习原子间势及铁电/压电/介电研究的中英文论文写作。减少空话、翻译腔和模板段落，保留术语、数值、引文和证据边界。

## 用法

```text
$write 润色这段论文，减少 AI 味，保留学术语气，不改变数据、术语和引文。

$write 根据附件图表和真实方法记录起草结果讨论；区分观察、机理推测和限制，缺材料就标出。

$write 把这段中文改成自然的学术英文，保留 may/suggest 等不确定程度，不增加实验或计算。

$write 审阅这段 MACE 介电响应论文，检查标签、模型输出、介电贡献和泛化结论是否对应。
```

支持摘要、引言、方法、结果讨论、结论、图注和审稿回复。已有段落默认保守润色；只有计划时写设想或有明确缺口的草稿，不生成貌似完成的研究结果。不保证通过 AI 检测器，也不替代作者核验。

## 在其他设备安装

将整个 `write` 文件夹放入 `~/.codex/skills/`，或项目的 `.agents/skills/`；保留 `references/`、`agents/`、来源和许可文件。下次对话可调用 `$write`。不要只复制 `SKILL.md`。

也可在已具备 Codex skill-installer 脚本的环境中运行：

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo luguannan90-sketch/review --path .agents/skills/write
```

本包无额外依赖、API key 或常驻进程。不会自动上传论文或发送审稿回复。实际文献格式按当次指定的学校/期刊要求处理。

出处和改编范围见 [SOURCE.md](SOURCE.md)，MIT 许可见 [LICENSE.txt](LICENSE.txt)。
