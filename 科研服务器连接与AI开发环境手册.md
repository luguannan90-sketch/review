# 科研服务器连接与 AI 开发环境手册

## 目标

```text
Mac/Windows → SSH 或 VPN/Tailscale → 科研服务器 Ubuntu/Linux
```

## 一、连接前准备

向管理员确认：

- 服务器地址或域名；
- 用户名；
- SSH 端口；
- 密码或 SSH 私钥；
- 是否需要校园 VPN、跳板机或代理。

不要把密码或私钥发给别人。

## 二、SSH 登录与别名

Windows PowerShell 或 Mac Terminal 都可以使用：

```bash
ssh 用户名@服务器地址 -p 服务器端口
```

推荐在客户端的 SSH 配置文件中加入：

```sshconfig
Host research-server
    HostName 真实服务器地址
    User 真实用户名
    Port 真实端口
```

以后只需：

```bash
ssh research-server
```

`research-server` 只是本地别名，不会改变服务器真实名称。

登录后先确认：

```bash
whoami
hostname
pwd
which python
```

## 三、Conda 环境

推荐结构：

```text
base：Conda 默认环境，尽量少修改
ml：机器学习项目环境
```

进入环境：

```bash
conda activate ml
which python
python --version
```

正确路径应类似：

```text
/home/researcher/miniconda3/envs/ml/bin/python
```

创建环境：

```bash
conda create -n ml python=3.11 pip -y
```

退出环境：

```bash
conda deactivate
```

不要使用 `sudo pip` 随意修改系统 Python，也不要把所有项目堆进 `base`。

## 四、PyTorch 与 GPU

查看 GPU：

```bash
nvidia-smi
```

如果 WSL 中找不到命令，可以尝试：

```bash
/usr/lib/wsl/lib/nvidia-smi
```

验证 PyTorch：

```bash
conda activate ml
python -c "import torch; print('PyTorch:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('PyTorch CUDA:', torch.version.cuda); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')"
```

关键结果：

```text
CUDA available: True
GPU: NVIDIA GeForce RTX 4060 Laptop GPU
```

实际矩阵测试：

```python
import torch

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
a = torch.rand(3, 3, device=device)
b = torch.rand(3, 3, device=device)
c = a @ b
print("使用设备:", device)
print("计算所在设备:", c.device)
```

看到 `cuda:0` 才说明张量实际使用了 GPU。PyTorch 版本会变化，新环境应以 [PyTorch 官方安装选择器](https://pytorch.org/get-started/locally/) 为准。

## 五、项目目录

推荐：

```text
/home/researcher/projects/your-project
```

创建：

```bash
mkdir -p ~/projects/your-project
cd ~/projects/your-project

## 六、VS Code Remote SSH

在 Mac 的 VS Code 中：

1. 按 `Command + Shift + P`。
2. 选择 `Remote-SSH: Connect to Host...`。
3. 选择 `research-server`。
4. 确认左下角显示 `SSH: research-server`。
5. 打开远程项目目录。
6. 选择 Python 解释器：

```text
/home/researcher/miniconda3/envs/ml/bin/python
```

远程窗口中编辑的文件实际保存在服务器，不是 Mac 本地。

终端中的 `conda activate ml` 只影响当前终端；VS Code 的 `Python: Select Interpreter` 影响 Pylance 和“运行 Python 文件”按钮，两者需要分别确认。

## 七、日常工作流

### VS Code

1. 确认 Tailscale/VPN 在线。
2. 连接 `research-server`。
3. 确认左下角是远程窗口。
4. 选择 `ml` 的 Python。
5. 打开远程终端：

```bash
conda activate ml
pwd
which python
python your_script.py
```

程序结果通常看“终端”；扩展日志看“输出”；断点调试看“调试控制台”。

### 纯终端

```bash
ssh research-server
conda activate ml
cd ~/projects/your-project
python your_script.py
```

## 八、tmux：长任务必须使用

创建会话：

```bash
tmux new -s research
```

运行程序后，按 `Ctrl+B`，松开，再按 `D`，任务会继续运行。

重新连接：

```bash
tmux ls
tmux attach -t research
```

停止当前程序：按 `Ctrl+C`。

终止整个会话：

```bash
tmux kill-session -t research
```

这个命令会终止会话中的任务，执行前确认不再需要继续运行。

## 九、关闭方式

### 暂时离开但保留任务

```text
Ctrl+B → D
```

然后：

```bash
exit
```

### 停止任务并关闭连接

```text
Ctrl+C
```

确认程序停止后：

```bash
exit
```

退出 tmux 后再执行一次 `exit`，即可退出 SSH。

不要直接关闭终端窗口来结束长任务；没有 tmux 时，任务可能随 SSH 断开而中断。

## 十、常见问题

| 现象 | 优先检查 |
|---|---|
| SSH 超时 | IP、端口、Tailscale/VPN、服务器是否在线 |
| 到密码提示但登录失败 | 用户名和密码 |
| `conda: command not found` | `source ~/.bashrc`，检查 Miniconda 路径 |
| 终端能 `import torch`，Pylance 报错 | VS Code 是否选错 Python 解释器 |
| `torch.cuda.is_available()` 为 False | `which python`、PyTorch 版本、`nvidia-smi`、GPU 通道 |
| GPU 显存不足 | 降低 batch size、输入尺寸或使用混合精度 |
| AI 扩展面板空白 | Reload Window、查看扩展日志和运行位置 |

## 十一、安全边界

不要盲目执行：

```bash
curl ... | bash
curl ... | sh
codex --yolo
```

优先下载后查看脚本，再决定是否执行。初学阶段使用默认权限或逐次确认模式。

AI 生成的代码仍需自己测试，尤其检查单位、数据泄漏、收敛性和物理合理性。

文档中的软件版本和网络参数会变化，迁移或重装时以当日官方文档和实际命令输出为准。
```
