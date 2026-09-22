# Mac 连接 Windows/WSL 实践手册

## 目标

```text
Mac → Tailscale → Windows → WSL/Ubuntu
```

这只是本地练习环境，不是真正的科研服务器。

## 一、Windows 端启动

1. 打开 Ubuntu，或在 PowerShell 执行 `wsl`。
2. 在 Ubuntu 中启动 SSH：

```bash
sudo service ssh start
sudo service ssh status
```

3. Windows 右下角打开 Tailscale，确认已登录并在线。
4. 在 Windows PowerShell 查看 Tailscale IP：

```powershell
tailscale ip -4
```

5. Windows 不要睡眠。

## 二、Mac 端启用和配置

在 Mac 打开 Tailscale，登录与 Windows 相同的账号，并确认 Windows 设备在线。然后打开 Mac“终端”。

配置 SSH 别名：

```bash
mkdir -p ~/.ssh
nano ~/.ssh/config
```

写入以下内容，并把 IP 换成当前 Windows 的 Tailscale IP：

```sshconfig
Host local-wsl
    HostName 100.106.61.13
    User researcher
    Port 2222
```

在 nano 中保存：`Ctrl+O` → 回车 → `Ctrl+X`。

然后执行：

```bash
chmod 600 ~/.ssh/config
```

## 三、Mac 连接和使用

使用别名连接：

```bash
ssh local-wsl
```

也可以使用完整命令：

```bash
ssh -l researcher -p 2222 100.106.61.13
```

看到 `researcher@localhost:~$`，说明已经进入 Windows 里的 Ubuntu。

基础练习：

```bash
whoami
pwd
ls
mkdir -p ~/practice
cd ~/practice
echo "hello from Mac" > test.txt
cat test.txt
```

## 四、tmux 练习

```bash
sudo apt install tmux -y
tmux new -s test
```

运行任务：

```bash
sleep 1000
```

保留任务并离开：按 `Ctrl+B`，松开，再按 `D`。

恢复：

```bash
tmux attach -t test
```

## 五、关闭方式

只退出 Mac 的远程连接：

```bash
exit
```

保留 tmux 任务：先按 `Ctrl+B` → `D`，再执行 `exit`。

停止 Ubuntu SSH 服务：

```bash
sudo service ssh stop
```

完全停止 WSL，在 Windows PowerShell 中执行：

```powershell
wsl --shutdown
```

这不会删除 Ubuntu，只会停止 WSL。

## 六、常见问题

- SSH 后空白：可能正在等待密码；直接输入密码并回车，密码不会显示。
- 校园网无法直连：确认 Windows 和 Mac 登录同一个 Tailscale 账号。
- WSL 重启后无法连接：在 Ubuntu 执行 `hostname -I`，检查 WSL IP 是否变化，并更新 Windows 的端口转发。

## 七、连接链路

```text
Mac
  ↓ Tailscale
Windows:2222
  ↓ portproxy
WSL:22
  ↓
Ubuntu SSH
```
