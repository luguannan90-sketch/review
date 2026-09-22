# 科研服务器与 WSL 远程连接技能手册

面向刚开始接触 Windows、Linux、SSH 和科研服务器的用户。

## 0. 快速开始：Mac 连接 Windows/WSL

这一节是每天真正需要操作的部分。后面的章节再解释原理和细节。

### 0.1 Windows 端先准备

确保 Windows：

1. 已打开并登录 Tailscale；
2. Ubuntu/WSL 正在运行；
3. Ubuntu 中 SSH 服务已启动：

```bash
sudo service ssh start
```

4. Windows 的端口转发仍然存在；
5. Windows 不处于睡眠状态。

### 0.2 Mac 启用 Tailscale

在 Mac 上：

1. 打开 Tailscale；
2. 登录与 Windows 相同的账号；
3. 确认 Windows 设备显示为在线；
4. 打开 Mac 的“终端”。

Mac 和 Windows 不必连接同一个 Wi-Fi，Tailscale 可以提供虚拟网络连接。

### 0.3 Mac 配置本地 WSL 别名

在 Mac 终端执行：

```bash
mkdir -p ~/.ssh
nano ~/.ssh/config
```

在打开的文件中写入：

```sshconfig
Host local-wsl
    HostName 100.106.61.13
    User researcher
    Port 2222
```

其中 `100.106.61.13` 要换成当前 Windows 的 Tailscale IP。

在 `nano` 中保存：

```text
Ctrl+O → 回车 → Ctrl+X
```

然后设置权限：

```bash
chmod 600 ~/.ssh/config
```

### 0.4 Mac 连接 Windows 里的 Ubuntu

以后直接执行：

```bash
ssh local-wsl
```

成功后看到：

```text
researcher@localhost:~$
```

说明你已经进入 Windows 里的 WSL/Ubuntu。此时输入的 Linux 命令实际在 Windows 的 Ubuntu 中运行。

如果还没有设置 SSH 别名，也可以临时使用完整命令：

```bash
ssh -l researcher -p 2222 100.106.61.13
```

### 0.5 Mac 正常关闭连接

只结束本次连接：

```bash
exit
```

或按 `Ctrl+D`。

如果任务正在 tmux 中运行，先按：

```text
Ctrl+B，松开，再按 D
```

这样会退出当前界面，但任务继续运行；之后再输入 `exit` 关闭 SSH。

### 0.6 Mac 连接真正科研服务器

拿到科研服务器的地址、用户名和端口后，在 Mac 的同一个配置文件中加入：

```sshconfig
Host research-server
    HostName 真实服务器地址
    User 真实用户名
    Port 真实端口
```

以后连接科研服务器只需：

```bash
ssh research-server
```

`local-wsl` 和 `research-server` 都只是 Mac 本地的别名，不会修改服务器真实名称。

### 0.7 快速关闭本地环境

如果只是不再使用 Mac 连接：

```bash
exit
```

如果要停止 Ubuntu 的 SSH 服务，在 Ubuntu 中执行：

```bash
sudo service ssh stop
```

如果要完全停止 WSL，在 Windows PowerShell 中执行：

```powershell
wsl --shutdown
```

不要在还需要远程运行任务时执行 `wsl --shutdown`。

## 1. 整体理解

```text
Windows 笔记本
├─ PowerShell：Windows 命令窗口
├─ WSL：让 Windows 运行 Linux
│  └─ Ubuntu：WSL 里的 Linux 系统
└─ Tailscale：跨网络连接设备

Mac → SSH/Tailscale → Windows → WSL/Ubuntu
```

WSL 提供本地 Linux 环境，但不会自动变成科研服务器。真正的科研服务器是另一台长期运行、资源更强的远程 Linux 电脑。

## 2. 命令执行位置

| 操作 | Windows PowerShell | WSL/Ubuntu | Mac | 科研服务器 |
|---|---:|---:|---:|---:|
| 安装 WSL/Ubuntu | ✓ |  |  |  |
| 安装 OpenSSH Client | ✓ |  |  |  |
| 安装 `openssh-server` |  | ✓ |  | 服务器端执行同类命令 |
| 建立 Windows 端口转发 | ✓ 管理员 |  |  |  |
| 安装/登录 Tailscale | ✓ |  | ✓ | 可选 |
| 使用 SSH 连接 | ✓ |  | ✓ | 作为连接目标 |
| 安装 Conda/Node/OpenCode/Codex | 通常不需要 | 可选练习 | 通常不需要 | 通常在这里安装 |
| 使用 tmux/Herdr | 可选 | 可练习 | 通过 SSH 使用 | 通常在这里长期运行 |

看到 `/home/...`、`~/.bashrc`，通常是在 Linux 中执行；看到 `C:\Users\...`、`$env:USERPROFILE`，通常是在 Windows 中执行。

## 3. Windows PowerShell 与 SSH

管理员 PowerShell 用于安装系统组件、修改防火墙和端口转发；普通 PowerShell 用于日常 SSH 登录、传文件和检查版本。

检查 SSH：

```powershell
ssh -V
```

如果找不到 SSH，在管理员 PowerShell 中安装：

```powershell
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

如果程序已安装但路径未刷新，可临时执行：

```powershell
$env:Path += ";$env:WINDIR\System32\OpenSSH"
ssh -V
```

上面两条命令要分开执行；第一条只对当前窗口有效。如需永久加入当前用户 PATH：

```powershell
$sshDir = "$env:WINDIR\System32\OpenSSH"
$currentUserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (($currentUserPath -split ";") -notcontains $sshDir) {
    [Environment]::SetEnvironmentVariable("Path", "$currentUserPath;$sshDir", "User")
}
```

PATH 不是语言系统，而是电脑寻找程序的文件夹清单。

## 4. 安装 WSL 和 Ubuntu

在管理员 PowerShell 中执行：

```powershell
wsl --install -d Ubuntu-24.04
```

安装可能启用 `VirtualMachinePlatform` 并要求重启。重启后检查：

```powershell
wsl --status
wsl -l -v
```

如果显示“没有已安装的分发”，说明 WSL 主程序有了，但 Ubuntu 尚未安装，重新执行安装命令即可。若名称不可用：

```powershell
wsl --list --online
```

官方资料：

- [Microsoft：安装 WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Microsoft：WSL 开发环境](https://learn.microsoft.com/en-us/windows/wsl/setup/environment)

第一次打开 Ubuntu 时创建 Linux 用户名和密码。密码输入时不会显示字符，这是正常的。进入后检查：

```bash
whoami
pwd
ls
```

## 5. 在 Ubuntu 中启用 SSH

以下命令在 Ubuntu 中执行，不是在 Windows PowerShell 中执行：

```bash
sudo apt update
sudo apt install openssh-server -y
sudo service ssh start
sudo service ssh status
```

看到 `Active: active (running)` 说明 SSH 正在运行。关闭 Ubuntu 窗口不会卸载系统，但 WSL/SSH 可能停止；重新打开后执行：

```bash
sudo service ssh start
```

## 6. Windows 端口转发

WSL2 通常使用 NAT 网络。先在 Ubuntu 中获取 WSL 地址：

```bash
hostname -I
```

假设结果为 `172.19.64.220`，在管理员 PowerShell 中建立 Windows `2222` 到 WSL `22` 的转发：

```powershell
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=2222 connectaddress=172.19.64.220 connectport=22
```

查看规则：

```powershell
netsh interface portproxy show all
```

本机测试：

```powershell
ssh -l researcher -p 2222 localhost
```

首次出现指纹提示时输入 `yes`，再输入 Ubuntu 密码。密码不会显示。推荐使用 `-l` 指定用户名，不要写成 `researcher\@localhost`。

## 7. 用 Tailscale 解决校园网隔离

校园网可能允许电脑上网，却禁止 Mac 直接访问 Windows。此时在 Windows 和 Mac 都安装 Tailscale，并登录同一账号：

- [Tailscale Windows 安装](https://tailscale.com/docs/install/windows)
- [Tailscale macOS 安装](https://tailscale.com/docs/install/mac)

Windows 查看 Tailscale IP：

```powershell
tailscale ip -4
```

例如得到 `100.106.61.13`。在管理员 PowerShell 中允许 Tailscale 访问 2222：

```powershell
New-NetFirewallRule -DisplayName "WSL SSH via Tailscale" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 2222 -RemoteAddress 100.64.0.0/10
```

Mac 连接 Windows 中的 Ubuntu：

```bash
ssh -l researcher -p 2222 100.106.61.13
```

把 IP 换成当前 Windows 的 Tailscale IP。链路为：

```text
Mac → Tailscale → Windows:2222 → WSL:22 → Ubuntu
```

Tailscale 只提供网络连接，目标端仍需运行 SSH 服务。

## 8. 从 Mac 练习 Linux

SSH 登录后，Mac 只是远程终端，命令实际在 Ubuntu 中运行。

基础命令：

```bash
whoami
pwd
ls
```

创建练习文件：

```bash
mkdir -p ~/practice
cd ~/practice
echo "hello from Mac" > test.txt
cat test.txt
```

练习 tmux：

```bash
sudo apt install tmux -y
tmux new -s test
```

进入 tmux 后运行：

```bash
sleep 1000
```

按 `Ctrl+B`，松开，再按 `D`，可以分离但保持任务运行。重新进入：

```bash
tmux attach -t test
```

退出 SSH：

```bash
exit
```

## 9. 地址和网络的变化

- WSL 地址，例如 `172.19.64.220`，可能随 WSL 重启变化。
- Windows Wi-Fi 地址，例如 `10.111.6.41`，可能随网络或 DHCP 变化。
- Tailscale 地址，例如 `100.106.61.13`，应以当前 Tailscale 显示为准。

WSL 地址变化后，需要更新 `portproxy` 的 `connectaddress`：

```powershell
netsh interface portproxy show all
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=2222
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=2222 connectaddress=新的WSL_IP connectport=22
```

## 10. 教程命令的安全边界

科研服务器教程中的命令只是参考资料，不应盲目复制执行。

对下面这类命令先查看脚本，再执行：

```bash
curl ... | bash
curl ... | sh
```

更稳妥的形式：

```bash
curl -fL URL -o /tmp/install.sh
head -n 20 /tmp/install.sh
bash /tmp/install.sh
```

谨慎使用：

```bash
codex --yolo
```

这类选项可能放宽自动执行权限。初学阶段优先使用默认权限或逐次确认模式。

## 11. 常见问题速查

### `ssh` 不是命令

检查 OpenSSH Client 是否安装，关闭并重新打开 PowerShell。必要时将下面路径加入 PATH：

```text
C:\Windows\System32\OpenSSH
```

### `wsl` 不是命令

确认 `C:\Windows\System32` 在 PATH 中，或临时使用：

```powershell
& "$env:WINDIR\System32\wsl.exe" --status
```

### WSL 已安装但没有发行版

```powershell
wsl --list --online
wsl --install -d Ubuntu-24.04
```

### SSH 连接后一直空白

可能正在等待密码。直接输入密码并回车，密码不会显示。

如果长时间无反应，检查：

- Mac 和 Windows 是否登录同一个 Tailscale 账号；
- Ubuntu 的 SSH 服务是否仍在运行；
- Windows 2222 端口转发是否存在；
- Windows 防火墙是否放行 2222；
- 使用 `ssh -v` 查看连接过程。

### 校园网下 Mac 找不到 Windows

优先选择：

1. Tailscale；
2. 同一个家用 Wi-Fi；
3. 同一个手机热点；
4. 学校提供的 VPN。

不要未经允许把 SSH 端口直接暴露到公网。

## 12. 学习顺序

1. 在 Windows PowerShell 中确认 `ssh -V`。
2. 安装 WSL 和 Ubuntu。
3. 在 Ubuntu 中练习 `pwd`、`ls`、`whoami`。
4. 在 Ubuntu 中安装并启动 SSH 服务。
5. 在 Windows 本机测试 `ssh -l researcher -p 2222 localhost`。
6. 在 Windows 和 Mac 安装并登录 Tailscale。
7. 从 Mac 连接 Windows 中的 Ubuntu。
8. 练习文件、tmux、退出和重新连接。
9. 获取科研服务器地址、用户名和端口后，再连接真正的科研服务器。
10. 登录科研服务器后，再配置 Conda、Node.js、OpenCode、Codex、tmux 和 Herdr。

完成本地练习后，你已经掌握了连接科研服务器所需的核心概念：终端、SSH、Linux 环境、端口、网络、用户和持久会话。

---

## 13. AI 科研开发环境总览

本节适用于已经能够通过 SSH 或 VS Code Remote SSH 进入 Ubuntu/科研服务器的情况。

典型链路：

```text
Mac
  ↓ VS Code / Terminal
Tailscale + SSH
  ↓
Windows / WSL2 或真正的科研服务器
  ↓
Ubuntu
  ↓ Conda 环境 ml
Python 3.11
  ↓
PyTorch + CUDA Runtime
  ↓
NVIDIA GPU
```

重要区分：

- Mac 主要提供界面、键盘和 VS Code；
- Windows/WSL 或科研服务器保存代码、Python 环境和数据；
- GPU 计算发生在远程 Ubuntu 所在的机器上；
- 安装 VS Code 扩展不等于安装 Python 包；
- 安装 PyTorch 不等于安装 VS Code 扩展。

### 13.1 一次配置记录示例

下面是一次实际环境记录，软件版本和地址会变化，不能当作永久固定值：

| 项目 | 示例值 |
|---|---|
| SSH 别名 | `research-server` |
| Tailscale IP | `100.106.61.13` |
| SSH 端口 | `2222` |
| SSH 用户 | `researcher` |
| 远程系统 | Ubuntu 24.04.5 LTS / WSL2 |
| CPU | AMD Ryzen 9 7945HX，16 核 32 线程 |
| GPU | NVIDIA GeForce RTX 4060 Laptop GPU |
| 显存 | 约 8 GB |
| Miniconda | `/home/researcher/miniconda3` |
| Conda 环境 | `ml` |
| Python | 3.11.16 |
| PyTorch | 2.14.0+cu130（当时记录） |
| 项目目录 | `/home/researcher/projects/hello-pytorch` |

## 14. SSH 别名与 VS Code Remote SSH

### 14.1 Mac 的 SSH 配置

在 Mac 的 `~/.ssh/config` 中可以写：

```sshconfig
Host research-server
    HostName 100.106.61.13
    User researcher
    Port 2222
```

之后终端中只需：

```bash
ssh research-server
```

如果 Tailscale IP 变化，要同步更新 `HostName`。

### 14.2 VS Code Remote SSH 工作流

1. 在 Mac 打开 VS Code。
2. 按 `Command + Shift + P`。
3. 选择 `Remote-SSH: Connect to Host...`。
4. 选择 `research-server`。
5. 确认左下角显示 `SSH: research-server`。
6. 打开远程项目目录，例如：

```text
/home/researcher/projects/hello-pytorch
```

在远程窗口中编辑的文件实际保存在远程 Ubuntu，不是 Mac 本地。

### 14.3 VS Code 的本地与远程扩展

VS Code Remote SSH 通常有两套运行位置：

```text
Mac 本地
├─ VS Code 界面
├─ Remote - SSH
└─ 界面型扩展

远程 Ubuntu
├─ VS Code Server
├─ Python/Pylance 等远程扩展
├─ 项目代码
└─ Python、PyTorch、GPU
```

安装扩展时，注意是否显示 `Install in SSH: research-server`。扩展安装在远程侧，只表示扩展组件在那里运行，不表示大模型一定在远程 GPU 上推理；许多 AI 扩展仍然通过网络调用云端模型。

## 15. Conda、base、ml 和 Python

### 15.1 环境关系

```text
/usr/bin/python3
└─ Ubuntu 系统 Python，不要随意 sudo pip 修改

/home/researcher/miniconda3
├─ base：Conda 默认环境
└─ envs/ml：机器学习项目环境
```

建议：`base` 只做基础管理，每个项目使用独立环境，不要把所有项目都堆进 `base`。

### 15.2 常用命令

```bash
conda activate ml
conda deactivate
python --version
which python
pip --version
```

记忆：

- `cd` 改变“我在哪个目录”；
- `conda activate ml` 改变“我使用哪套软件环境”。

检查结果应类似：

```text
/home/researcher/miniconda3/envs/ml/bin/python
```

如果不希望每次登录自动进入 `base`：

```bash
conda config --set auto_activate_base false
```

### 15.3 创建机器学习环境

```bash
conda create -n ml python=3.11 pip -y
conda activate ml
```

如果遇到 Conda channel 服务条款提示，应按照当前 Conda 输出和官方说明处理，不要机械复制旧记录。

## 16. NVIDIA、CUDA 与 PyTorch

### 16.1 三个 CUDA 版本不要混淆

1. `nvidia-smi` 显示的 CUDA Version：主要表示驱动支持的 CUDA 能力上限。
2. `torch.version.cuda`：当前 PyTorch wheel 使用的 CUDA Runtime 版本。
3. `nvcc --version`：如果安装了完整 CUDA Toolkit，显示 Toolkit 编译器版本。

三个数字不要求完全相同。判断 PyTorch 是否真的使用 GPU，应以实际计算验证为准。

### 16.2 GPU 检查

```bash
nvidia-smi
```

如果 WSL 中提示找不到，但下面路径可用：

```bash
/usr/lib/wsl/lib/nvidia-smi
```

说明 GPU 驱动通道可能已经存在，只是该目录不在 PATH 中。不要因为 `nvidia-smi` 的 CUDA 数字就盲目在 WSL 内安装 Linux 显卡驱动。

### 16.3 PyTorch 检查

在正确的 Conda 环境中执行：

```bash
conda activate ml
python -c "import torch; print('PyTorch:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('PyTorch CUDA:', torch.version.cuda); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')"
```

真正打通 GPU 的关键结果是：

```text
CUDA available: True
GPU: NVIDIA GeForce RTX 4060 Laptop GPU
```

### 16.4 实际矩阵计算测试

```python
import torch

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
a = torch.rand(3, 3, device=device)
b = torch.rand(3, 3, device=device)
c = a @ b

print("使用设备:", device)
print("计算所在设备:", c.device)
```

看到 `cuda:0` 才说明张量实际放到了 GPU 上并完成了计算，而不只是检测到了显卡。

### 16.5 安装 PyTorch

PyTorch 和 CUDA wheel 会更新。新环境应以 [PyTorch 官方安装选择器](https://pytorch.org/get-started/locally/) 为准，不要机械复制旧版本命令。历史示例：

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu130
```

安装后必须重新运行 GPU 验证。

## 17. 项目目录与 VS Code 解释器

推荐项目结构：

```text
/home/researcher/
├─ miniconda3/
│  └─ envs/ml/
└─ projects/
   └─ hello-pytorch/
      └─ test_gpu.py
```

创建目录：

```bash
mkdir -p ~/projects/hello-pytorch
cd ~/projects/hello-pytorch
pwd
```

在 VS Code 远程窗口中，按 `Command + Shift + P`，选择：

```text
Python: Select Interpreter
```

选择或手动输入：

```text
/home/researcher/miniconda3/envs/ml/bin/python
```

当前终端执行 `conda activate ml` 只影响终端；VS Code 解释器选择会影响 Pylance 和“运行 Python 文件”按钮。两者需要分别确认。

### 17.1 Pylance 报 import 错误

如果终端可以：

```bash
python -c "import torch; print(torch.__version__)"
```

但 Pylance 报 `无法解析导入 torch`，优先检查 VS Code 是否错误选成了 `/usr/bin/python3`，不要立刻重装 PyTorch。

### 17.2 终端、输出、调试控制台

| 面板 | 用途 |
|---|---|
| 终端 Terminal | 输入命令，运行 Python，查看程序输出和报错 |
| 输出 Output | 查看 VS Code、Remote SSH、Python、Pylance、AI 扩展日志 |
| 调试控制台 Debug Console | 启动断点调试后查看调试表达式 |

普通 Python 程序的 `print()` 结果通常在“终端”，不是“输出”。

## 18. AI 编程扩展的排查原则

AI 扩展卡顿或面板空白时，不要先重装 Python、PyTorch 或 GPU 驱动。按以下顺序排查：

1. 确认左下角仍显示 `SSH: research-server`。
2. 确认普通 Python/GPU 程序可以正常运行。
3. 执行 `Developer: Reload Window`。
4. 查看“输出”面板中的扩展日志。
5. 用 `Developer: Show Running Extensions` 查看扩展运行在 Local 还是 SSH 侧。
6. 检查扩展是否支持 Remote SSH，以及是否需要 `Install in SSH: research-server`。
7. 分别测试 Mac → 服务器的 SSH 网络，以及服务器 → AI 服务的网络。

扩展激活耗时、网络延迟、Pylance 索引和模型请求耗时可能混在一起，不能把所有数字都当作 SSH 延迟。

## 19. 每天的工作流

### VS Code 工作流

1. 确认 Tailscale 在线。
2. 打开 VS Code。
3. `Command + Shift + P` → `Remote-SSH: Connect to Host...` → `research-server`。
4. 确认左下角显示 `SSH: research-server`。
5. 打开远程项目目录。
6. 选择 `ml` 环境的 Python 解释器。
7. 打开远程终端，执行：

```bash
conda activate ml
pwd
which python
python test_gpu.py
```

### 纯终端工作流

```bash
ssh research-server
conda activate ml
cd ~/projects/hello-pytorch
which python
python test_gpu.py
```

结束：

```bash
conda deactivate
exit
```

不需要每天重新安装 Miniconda、创建 `ml` 或安装 PyTorch。

## 20. 最重要的判断原则

1. 先判断问题在哪一层：网络、SSH、WSL、Conda、Python、PyTorch/CUDA、VS Code 还是 AI 扩展。
2. 命令执行结束不等于结果正确；GPU 计算要看到 `cuda:0`。
3. 不要因为 `nvidia-smi` 的 CUDA 数字盲装完整 Toolkit。
4. 不要污染系统 Python，也不要把所有项目堆进 `base`。
5. 遇到 `import` 报错先确认 `which python` 和 VS Code 解释器。
6. 扩展的本地/远程运行位置由扩展设计决定，不能一律装到服务器。
7. AI 生成的代码仍需自己运行、测试和判断，尤其要检查单位、数据泄漏、收敛性和物理合理性。

---

文档版本：根据 2026-09-21 至 2026-09-22 的实际配置和验证记录整理。软件版本、IP 地址和网络参数可能变化；迁移或重装时，应以当日官方文档和实际命令输出为准。

---

## 21. Mac 连接 Windows/WSL：每天怎么使用和关闭

### 21.1 启动前检查

在 Windows 上：

1. Windows 已开机，且不要进入睡眠。
2. Tailscale 已登录并显示在线。
3. 打开 Ubuntu/WSL。
4. 在 Ubuntu 中启动 SSH：

```bash
sudo service ssh start
```

5. 如果 WSL 重启过，检查地址：

```bash
hostname -I
```

如果地址和原来的不同，需要在管理员 PowerShell 更新端口转发：

```powershell
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=2222
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=2222 connectaddress=新的WSL_IP connectport=22
```

### 21.2 Mac 上连接

确认 Mac 的 Tailscale 也在线，然后在 Mac 终端执行：

```bash
ssh -l researcher -p 2222 100.106.61.13
```

把 `100.106.61.13` 换成 Windows 当前的 Tailscale IP。

如果已经配置了 Mac 的 SSH 别名，也可以执行：

```bash
ssh research-server
```

登录成功后，看到类似下面的提示，说明已经进入 Windows 里的 Ubuntu：

```text
researcher@localhost:~$
```

此时输入的 Linux 命令实际在 WSL/Ubuntu 中运行，而不是在 Mac 本机运行。

### 21.3 Mac 端正常退出连接

如果只是结束本次远程操作，在 Ubuntu 中执行：

```bash
exit
```

或者按：

```text
Ctrl+D
```

这只会退出 SSH，不会卸载 Ubuntu，也不会删除文件。

### 21.4 暂停连接但保留任务

如果正在运行较长任务，先进入 tmux：

```bash
tmux attach -t test
```

然后按：

```text
Ctrl+B，松开，再按 D
```

这样会离开 tmux，但任务继续运行。之后退出 SSH：

```bash
exit
```

下次重新连接后恢复：

```bash
tmux attach -t test
```

### 21.5 彻底停止本地服务

如果暂时不想让 Mac 再连接，可以在 Windows 的 Ubuntu 窗口中执行：

```bash
sudo service ssh stop
```

也可以关闭 Ubuntu 窗口。若希望完全停止 WSL，在 Windows PowerShell 中执行：

```powershell
wsl --shutdown
```

`wsl --shutdown` 会停止所有 WSL 发行版；下次需要重新打开 Ubuntu，并再次启动 SSH 服务。

Tailscale 不必每次关闭。只要不需要跨网络连接，可以退出 Tailscale 或保持其后台运行，二者都不会删除配置。

---

## 22. Windows 连接科研服务器：每天怎么使用和关闭

### 22.1 准备信息

连接真正的科研服务器前，需要从管理员获得：

- 服务器地址或域名；
- SSH 用户名；
- SSH 端口；
- 密码或 SSH 私钥；
- 是否需要校园 VPN、跳板机或代理。

不要把密码或私钥发送给其他人。

### 22.2 Windows 上启动连接

在普通 PowerShell 中执行：

```powershell
ssh 用户名@服务器地址 -p 服务器端口
```

例如：

```powershell
ssh researcher@example-server -p 2222
```

如果已经配置了 Windows SSH 别名：

```powershell
ssh research-server
```

如果服务器需要 Tailscale、校园 VPN 或 Clash，先确保对应网络已连接，再执行 SSH。

### 22.3 登录后的基本工作流

登录服务器后，先确认自己在哪台机器、使用哪个用户：

```bash
whoami
hostname
pwd
```

进入项目并激活环境：

```bash
cd ~/projects/your-project
conda activate ml
which python
```

运行代码：

```bash
python your_script.py
```

长时间任务建议放进 tmux：

```bash
tmux new -s research
cd ~/projects/your-project
conda activate ml
python your_script.py
```

### 22.4 暂时离开但保留科研任务

在 tmux 中按：

```text
Ctrl+B，松开，再按 D
```

然后退出 SSH：

```bash
exit
```

此时服务器上的任务仍然继续运行。下次重新登录：

```powershell
ssh research-server
```

查看会话：

```bash
tmux ls
```

恢复会话：

```bash
tmux attach -t research
```

### 22.5 停止科研任务并关闭连接

如果要停止当前程序，在程序运行的终端按：

```text
Ctrl+C
```

确认程序停止后，可以退出 tmux：

```bash
exit
```

再退出 SSH：

```bash
exit
```

如果要直接删除指定 tmux 会话：

```bash
tmux kill-session -t research
```

这会终止该会话中的任务，执行前确认不再需要任务继续运行。

### 22.6 两种“关闭”不要混淆

| 操作 | 结果 |
|---|---|
| `exit` | 退出当前 SSH 或 tmux shell |
| `Ctrl+B`、`D` | 离开 tmux，任务继续 |
| `Ctrl+C` | 停止当前前台程序 |
| `tmux kill-session -t research` | 终止整个指定 tmux 会话及其中任务 |
| 关闭 PowerShell 窗口 | 可能断开 SSH；没有 tmux 的任务可能中断 |
| 关闭服务器 | 所有远程任务和连接都停止，不要随意执行 |

最安全的日常结束方式是：

```text
长任务：Ctrl+B → D → exit
短任务：Ctrl+C（如需停止）→ exit
```
