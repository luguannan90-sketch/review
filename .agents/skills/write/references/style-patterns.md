# 学术表达检查与领域示例

改编自 Humanizer-zh 的语义保护、声音校准、模板句和中文表达检查；下列学术场景为本版本新增。所有数字和材料场景均为教学构造，不是用户的结果或真实文献结论。

## 先判断是否有问题

| 表达线索 | 适合怎样处理 | 必须保留的边界 |
| --- | --- | --- |
| 随着……迅猛发展；在……时代背景下 | 没有独立信息时删去，直接进入具体问题 | 真正的时间趋势与因果背景 |
| 至关重要；意义深远；开辟全新道路 | 用已有的问题或结果说明意义，材料不够则删套话 | 作者有依据的判断和具体用途 |
| 不仅……更……；不是 X 而是 Y | 删除只有拔高作用的对比 | 纠正真实误解、区分两种机制的对比 |
| 首先/其次/最后；此外/与此同时 | 减少机械复现，不要求全部删除 | 顺序、同时发生和真实转折 |
| 赋能、闭环、全方位、系统性 | 回到已有定义和具体动作 | 控制理论等领域中的正式术语 |
| 对……进行研究/开展分析 | 可改为直接动词，避免长串名词化 | 正在/计划/已经、次数与研究范围 |
| demonstrates / proves / elucidates | 检查是否超出证据；按来源保留 suggests / is consistent with | 不把确定结论机械改弱，也不把推测改强 |
| excellent / unprecedented / groundbreaking | 有可比基线时写已有比较；缺乏依据则去掉赞美 | 不补造基线、百分比或“首次” |
| 每段固定三点、重复总结和意义拔高 | 按真实信息组织，段落之间推进问题 | 独立信息、真实三项结果和必要总结 |
| 生硬同义词替换、连续超长定语 | 用领域常用词，调整修饰关系 | 相、张量、势函数和模型名称保持一致 |

## 例 1：中文结果，保留比较范围和限制

输入：

> 本研究通过对 MACE 模型进行精细化优化，实现了预测能力的显著跃升。在相同测试集上，力的 RMSE 从 0.12 eV/Å 降至 0.08 eV/Å，充分彰显了其卓越的泛化能力。然而，高温构型尚未测试。

建议稿：

> 优化 MACE 模型后，相同测试集上的力 RMSE 从 0.12 eV/Å 降至 0.08 eV/Å。高温构型尚未测试，因此这一结果尚不足以说明模型在高温条件下的泛化能力。

这里对“卓越泛化”做了有说明的主张收窄。不能添加材料名称、优化策略、统计显著性、数据量或高温性能；若用户只授权语言修改，正文外说明原主张的问题及建议稿的收窄。

## 例 2：不靠虚构细节消除空话

输入：

> 本研究为高性能铁电材料的设计提供了全新思路，展现出广阔的应用前景。

仅凭这句话无法恢复科学结果。可向作者索取研究对象、具体改变和证据；也可给待补框架：

> 本研究考察了【待补：材料与调控变量】对【待补：物性】的影响。结果表明【待补：有依据的发现及条件】。

这是需要补材料的草稿，不能称为最终论文结论。

## 例 3：英文讨论，保持推测和外推边界

输入：

> These findings provide profound insights into the underlying mechanism. The peak in the dielectric response may be associated with a soft mode, but the mode contribution has not been evaluated. This groundbreaking observation paves the way for next-generation devices.

建议稿：

> The peak in the dielectric response may be associated with a soft mode, although the mode contribution has not been evaluated.

保留 may 和未评价的事实；不能补写声子计算、模式频率或器件性能。

## 例 4：不要把所有术语、重复或被动语态当作 AI 痕迹

输入：

> Born effective charges were calculated using density functional perturbation theory. The electronic and ionic contributions to the dielectric tensor are reported separately.

若材料确实支持，可原样保留。不能为了变化，把 Born effective charges 换成 nominal charges，或把第二句压成“the dielectric constant was calculated”而丢失贡献区分。

## 例 5：方法参数与 LaTeX 保护

输入：

> The plane-wave cutoff was set to 520 eV. Forces were converged to $0.01\,\mathrm{eV}/\AA$; see Fig.~\ref{fig:conv} and Ref.~\cite{provided-key}.

没有明显问题可不改。不要“规范化”为别的阈值，不推测软件/泛函，不重写引用键或标签；不得声称已核实 `provided-key` 所指文献。

## 例 6：贡献归属与完成状态

输入：

> 我们使用公开的预训练势完成了结构优化，计划补充声子计算。该流程在 AI 辅助下搭建，目前只在一个结构上运行过。

建议稿可保持原文。不把“使用”改成“开发”，不把“运行过”改成“系统验证”，不把“计划补充”改成“证实动力学稳定”。

## 作者样本与段落节奏

有样本时比较句长、首尾衔接、主被动偏好和专业程度；不复制样本中不属于当前研究的事实。没有样本时保留现有学术语域，以明确的对象和动词承接信息。长句承载紧密限定关系时可以保留；不要为了“像人”随机加断句、情绪或夸张。
