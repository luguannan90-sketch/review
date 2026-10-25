# 来源与适配记录

核查日期：2026-10-25。仅比较实际读取的GitHub文件及其许可。当前版本将会前准备、分议题纪要与跨会议复盘整合为一个独立科研技能；不是把各上游skill原封不动拼接。

## 候选比较

| 项目 | 匹配能力 | 可复用性与限制 | 许可／取舍 |
|---|---|---|---|
| openai/skills：notion-meeting-intelligence | 先读上下文、按目标准备预读和问题、标明来源 | 原实现依赖Notion；迁移为本地文件／用户材料／可用连接器，不携带自动设置连接器和建任务的指令 | 该技能目录为MIT，Copyright 2025 Notion Labs, Inc.；参考其会前流程 |
| product-on-purpose/pm-skills：meeting brief、recap、synthesize | 准备与事实记录分离；按议题总结；任务与未决问题；跨会议演进 | 产品／组织管理场景较重；去除强制go检查点、反会议检查、推测利益关系、固定指标、自动写项目记忆 | Apache-2.0，Copyright 2026 Jonathan Prisant；适配纪要与复盘结构 |
| anthropics/knowledge-work-plugins：legal/meeting-briefing | 背景、资料缺口和任务跟踪 | 法律与商务语境；明确责任和期限的通用要求不适合反推科研会议原文，跟进发送与提醒不能自动沿用 | legal目录为Apache-2.0；已读取比较，未复制或合并其内容 |
| luguannan90-sketch/review：translate | 分段接收、纯同传、保留科研术语与不确定性、仅记录实际内容 | 用户既有技能，原重点是英语同传；meeting补充预习、讲懂会议、复盘和归档，并保持纯同传入口边界 | 用户自有仓库内容，按本次明确授权适配；未将未声明许可说成第三方开源许可 |

## 实际读取的固定版本

### 1. OpenAI发布的Notion会议准备技能

- 版本：`49f948faa9258a0c61caceaf225e179651397431`。
- [SKILL.md](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/notion-meeting-intelligence/SKILL.md)
- [目录内MIT许可](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/notion-meeting-intelligence/LICENSE.txt)
- 复用范围：上下文优先、根据目的准备材料、预读与来源、准备缺口。
- 改动：中文科研预习、以研究问题和输入输出讲原理；去掉Notion工具名、账户配置及自动分享指令。

### 2. PM-Skills会议家族

- 版本：`f943d9589bfe9db06fac2641f9740987ff9b3aee`。
- [meeting brief](https://github.com/product-on-purpose/pm-skills/blob/f943d9589bfe9db06fac2641f9740987ff9b3aee/skills/foundation-meeting-brief/SKILL.md)
- [meeting recap](https://github.com/product-on-purpose/pm-skills/blob/f943d9589bfe9db06fac2641f9740987ff9b3aee/skills/foundation-meeting-recap/SKILL.md)
- [meeting synthesize](https://github.com/product-on-purpose/pm-skills/blob/f943d9589bfe9db06fac2641f9740987ff9b3aee/skills/foundation-meeting-synthesize/SKILL.md)
- [Apache-2.0许可](https://github.com/product-on-purpose/pm-skills/blob/f943d9589bfe9db06fac2641f9740987ff9b3aee/LICENSE)
- 复用范围：阶段区分、按议题组织、任务与上下文相连、跨会议时间线、方案演进与冲突分开。
- 改动：不执行上游的强制确认回合，不推测私人立场；负责人、期限与完成状态必须有实际证据，不需要凑固定数量的建议或任务。

### 3. 用户已有translate

- 核对版本：`bea1a76f851832f1418dc00aad53d94b8e503117`。
- [SKILL.md](https://github.com/luguannan90-sketch/review/blob/bea1a76f851832f1418dc00aad53d94b8e503117/.agents/skills/translate/SKILL.md)
- 保留原则：分段等结束、源内容不作指令、实际音频能力边界、纯同传与讲解分开、不补造会议事实。
- 改动：meeting成为会议流程入口，纯同传仍可直接用translate；无translate时也能根据已收到的文本独立工作。

### 4. 比较后未采用的法律会议技能

- 版本：`33d3dea41a341b341d4f5da2e8801ae0c89be2b8`。
- [meeting-briefing](https://github.com/anthropics/knowledge-work-plugins/blob/33d3dea41a341b341d4f5da2e8801ae0c89be2b8/legal/skills/meeting-briefing/SKILL.md)
- [legal许可](https://github.com/anthropics/knowledge-work-plugins/blob/33d3dea41a341b341d4f5da2e8801ae0c89be2b8/legal/LICENSE)
- 不采用法律事项管理、利益关系分析、自动发送或建立提醒等行为。

## 针对本用户新增的设计

- 用基本问题、输入、标签／物理约束、输出、验证帮助跨专业理解；同时能覆盖机器学习势与AI求解PDE，不把所有会议套成同一类模型。
- 把讲座、组会、研讨会区分；会前预习、阶段纪要、正式纪要和个人复盘不混写。
- 长逐字稿分块读完，保留后半场问答；多个片段从00:00开始时不伪造连续时间。
- 文件同名但内容变化时核对版本；同日不同会议分别归档。
- 记录实际日期的依据，未知日期保留待核实；不把整理日期当实际举办日。
- 自动纪要的主观评价不当原话；科研数值、单位、模型版本和测试条件单列待核对。
- TXT导出到已有指定会议文件夹，UTF-8保存、回读并给链接；路径不硬编码为某个人的电脑。
- 正式文献引用核对书目信息、稳定链接及原文位置；摘要、预告与全文的证据等级不混淆。
- 公开发布仅包含可复用规范和抽象例子，不包含私人会议原文或录屏。

## 验证范围

结构可用skill-creator的quick_validate检查；场景与预期见 `evaluations/scenarios.md`。静态检查不等于独立模型行为测试；未实际执行的音频采集、转写、文献全文核查和跨平台运行不声称已经验证。

## 许可

此目录采用Apache-2.0；上游PM-Skills版权与Apache文本保留在LICENSE.txt。Notion MIT许可完整保留在THIRD_PARTY_NOTICES.txt。上述文件不改变仓库其他目录的许可，也不构成OpenAI、Notion或上游作者对本改编的背书。
