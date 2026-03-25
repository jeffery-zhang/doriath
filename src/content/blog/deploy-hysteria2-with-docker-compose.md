---
title: 用 Docker Compose 部署 Hysteria 2
description: 一篇从零开始的 Hysteria 2 部署笔记：涵盖依赖安装、Cloudflare DNS、TLS 证书申请、Docker Compose 配置与客户端导入。
pubDate: 2026-03-25
tags:
  - docker
  - network
  - hysteria2
  - tutorial
---

如果你只想先抓住主线，可以先记住这几件事：准备一台有公网 IP 的 Linux 服务器，把一个子域名解析到这台机器，在 Cloudflare 中保持 **DNS only**，为该域名申请 TLS 证书，然后用 Docker Compose 启动 Hysteria 2 服务，最后确认 `2443/udp` 已经放行，并把连接参数交给客户端。

本文按从零开始部署的顺序来写。文中的域名、IP、密码、节点名都使用公开示例，不对应任何真实环境。你可以把示例域名理解为 `hy2.example.com`，把示例 IP 理解为 `203.0.113.10`，实际操作时替换成自己的值即可。

## 部署前提

假定你已经具备下面这些条件：

- 一台可以通过 SSH 登录的 Linux VPS
- 一个可在 Cloudflare 中管理 DNS 的域名
- 服务器拥有公网 IPv4
- 你可以修改服务器防火墙或云平台安全组

本文示例统一使用这些约定：

- 域名：`hy2.example.com`
- 端口：`2443/udp`
- 部署目录：`/opt/hy2`

`2443/udp` 不是强制值，但它足够常见，也不容易和默认 Web 服务冲突。若你后续改了端口，服务端配置、防火墙和客户端参数都要一起改。

## 一、安装依赖

先在服务器上安装这组基础工具：

- `curl`
- `jq`
- `socat`
- `ca-certificates`
- `docker`
- `docker compose`

如果你的系统是 Ubuntu 或 Debian，可以直接执行：

```bash
sudo apt-get update
sudo apt-get install -y curl jq socat ca-certificates
sudo apt-get install -y docker.io docker-compose-plugin
```

安装后可以顺手检查版本：

```bash
curl --version
jq --version
socat -V
docker --version
docker compose version
```

这些依赖里，`docker` 和 `docker compose` 用来运行服务；`curl`、`jq`、`socat` 则主要服务于证书申请和排查过程。

## 二、准备目录

为了让配置和证书都集中管理，先创建部署目录：

```bash
sudo mkdir -p /opt/hy2/{config,certs}
cd /opt/hy2
```

目录约定如下：

- `config/` 用于放服务端配置
- `certs/` 用于放 TLS 证书

如果服务器上还有别的业务，保持这种单独目录会更容易维护和迁移。

## 三、在 Cloudflare 中添加 DNS 记录

接下来把子域名指向你的服务器公网 IP。以 `hy2.example.com` 为例，常见设置如下：

- `Type`: `A`
- `Name`: `hy2`
- `IPv4 address`: `你的服务器公网 IP`
- `TTL`: `Auto`
- `Proxy status`: **DNS only**

如果你喜欢直接看完整结果，那它应该等价于：

- `hy2.example.com -> 你的服务器公网 IP`

这里最重要的一点只有一个：**必须是 DNS only，而不是 Proxied。**

更直白一点说，开了橙云以后，客户端连到的就不再是你的服务器公网 IP，而是先连到 Cloudflare 的代理层。对于普通网站，这通常不是问题；但 Hysteria 2 走的是基于 UDP 的 QUIC 流量，要求客户端直接和你的服务器完成握手、证书校验与数据传输。Cloudflare 面板里这类普通 `A` 记录的 **Proxied** 并不会像代理网页那样，替你把 Hysteria 2 流量原样转发回源站。

所以一旦开了橙云，结果通常就是两种：要么客户端根本连不上，要么握手阶段直接失败。很多人以为是配置、证书或端口有问题，最后排查一圈，真正的原因只是 DNS 记录开成了 **Proxied**。

如果你的目标只是自建一个可用的 Hysteria 2 节点，这里就不要绕弯子，直接保持 **DNS only** 即可。

## 四、申请 TLS 证书

Hysteria 2 需要 TLS 证书。对公开使用的节点，优先建议使用 Let's Encrypt 这类正式证书，这样客户端通常不需要额外导入自签证书。

下面示例使用 `acme.sh`：

### 1. 安装 acme.sh

```bash
curl https://get.acme.sh | sh
```

### 2. 设定证书提供方

```bash
~/.acme.sh/acme.sh --set-default-ca --server letsencrypt
```

### 3. 为域名签发证书

在确认 `hy2.example.com` 已经解析到服务器后执行：

```bash
~/.acme.sh/acme.sh --issue -d hy2.example.com --standalone
```

`--standalone` 模式通常会临时占用 `80/tcp`。如果你机器上已经有 Web 服务在跑，先确认 80 端口不会冲突。

### 4. 把证书安装到部署目录

```bash
~/.acme.sh/acme.sh --install-cert -d hy2.example.com \
  --key-file /opt/hy2/certs/server.key \
  --fullchain-file /opt/hy2/certs/server.crt
```

完成后，目录里应当能看到这两个文件：

- `/opt/hy2/certs/server.key`
- `/opt/hy2/certs/server.crt`

## 五、编写服务端配置

创建配置文件：

```bash
sudo tee /opt/hy2/config/config.yaml >/dev/null <<'EOF'
listen: :2443

tls:
  cert: /etc/hysteria/certs/server.crt
  key: /etc/hysteria/certs/server.key

auth:
  type: password
  password: "replace-with-a-strong-password"

masquerade:
  type: proxy
  proxy:
    url: https://www.cloudflare.com/

bandwidth:
  up: 30 mbps
  down: 100 mbps

quic:
  initStreamReceiveWindow: 8388608
  maxStreamReceiveWindow: 8388608
  initConnReceiveWindow: 20971520
  maxConnReceiveWindow: 20971520

sniff:
  enable: true
EOF
```

这里有几项尤其值得注意：

- `listen: :2443` 表示服务监听 `2443/udp`
- `auth.password` 一定要替换成自己的强密码
- `tls` 指向的是容器内挂载后的证书路径
- `bandwidth` 更像是给客户端的参考值，不是精确测速结果

如果你暂时不确定服务器带宽，先沿用上面的保守值即可，后续再调整。

## 六、编写 Docker Compose 文件

创建 `docker-compose.yml`：

```bash
sudo tee /opt/hy2/docker-compose.yml >/dev/null <<'EOF'
services:
  hy2:
    image: tobyxdd/hysteria:latest
    container_name: hy2
    restart: unless-stopped
    network_mode: host
    command: server -c /etc/hysteria/config.yaml
    volumes:
      - /opt/hy2/config/config.yaml:/etc/hysteria/config.yaml:ro
      - /opt/hy2/certs:/etc/hysteria/certs:ro
EOF
```

这里把容器放在 `host` 网络模式下，主要是为了少踩一点 UDP/QUIC 相关的坑。对第一次部署的人来说，这通常比自己反复排查端口映射更省事。

如果你更偏好显式端口映射，也可以改成下面这种写法：

```yaml
services:
  hy2:
    image: tobyxdd/hysteria:latest
    container_name: hy2
    restart: unless-stopped
    command: server -c /etc/hysteria/config.yaml
    ports:
      - "2443:2443/udp"
    volumes:
      - /opt/hy2/config/config.yaml:/etc/hysteria/config.yaml:ro
      - /opt/hy2/certs:/etc/hysteria/certs:ro
```

两种方式都能工作，但如果你只想先把服务稳定跑起来，本文仍建议优先用 `network_mode: host`。

## 七、启动服务并检查状态

进入目录后启动：

```bash
cd /opt/hy2
sudo docker compose up -d
```

然后检查状态：

```bash
sudo docker compose ps
```

查看日志：

```bash
sudo docker compose logs -f hy2
```

如果日志里没有明显报错，再继续检查端口监听。

## 八、确认 `2443/udp` 已放行

先在服务器上检查监听状态：

```bash
ss -lunp | grep 2443
```

能看到监听结果，说明服务至少已经在本机侧启动。

如果你启用了 UFW，还需要放行 UDP 端口：

```bash
sudo ufw allow 2443/udp
sudo ufw status
```

如果你用的是云平台安全组，也要同步确认：

- 允许 `2443/udp` 入站
- 没有被平台级防火墙拦截

很多人会只开 `2443/tcp`，这对 Hysteria 2 是不够的。这里要放的是 **UDP**。

## 九、客户端连接参数

只要客户端支持 Hysteria 2，通常都需要下面这些参数：

- 服务器地址：`hy2.example.com`
- 端口：`2443`
- 密码：服务端 `auth.password` 中设置的值
- SNI 或 Server Name：`hy2.example.com`
- TLS：开启
- 证书验证：开启

如果你使用的是正式证书，一般不要关闭证书验证。只有在你明确使用自签证书，并且知道这样做会带来什么后果时，才考虑跳过验证。

## 十、分享链接说明

不少客户端支持直接导入 Hysteria 2 的分享链接。一个常见示例如下：

```text
hysteria2://your-password@hy2.example.com:2443?sni=hy2.example.com#Example-HY2
```

这条链接可以拆成几部分理解：

- `hysteria2://`：协议类型
- `your-password`：服务端密码
- `hy2.example.com`：服务器域名
- `2443`：端口
- `sni=hy2.example.com`：TLS 的 SNI
- `#Example-HY2`：节点备注名

要特别分清两件事：

- 服务端配置文件是服务器上的 `config.yaml`
- 分享链接是给客户端导入节点用的 URI

这两者不是一回事，不要混用。

更稳妥的做法是同时保留两份信息：

- 一条可导入的分享链接
- 一组原始连接参数

这样即使某个客户端导入失败，你也还能手动填写。

## 十一、建议的检查顺序

部署完成后，可以按这个顺序排查：

### 1. 检查 DNS

```bash
dig hy2.example.com +short
```

确认返回的是你的服务器公网 IP。

### 2. 检查容器日志

```bash
cd /opt/hy2
sudo docker compose logs hy2
```

确认没有明显的证书、权限或配置错误。

### 3. 检查端口监听

```bash
ss -lunp | grep 2443
```

确认本机已经在监听 `2443/udp`。

### 4. 用客户端实际连接

观察这些结果：

- 是否能成功建立连接
- 延迟是否在合理范围内
- 是否能稳定访问外部网络

## 十二、几类常见问题

### 1. DNS 开成了橙云

这是最常见的问题之一。回到 Cloudflare 面板，把这条记录改成 **DNS only**，然后等待解析生效，再重新测试。

### 2. 只放行了 TCP，没有放行 UDP

Hysteria 2 依赖的是 UDP。请确认你放行的是 `2443/udp`，而不是只有 `2443/tcp`。

### 3. 证书申请失败

优先检查两件事：

- 域名是否已经正确解析到服务器
- `80/tcp` 是否在申请时被其他进程占用

### 4. 密码过弱

这是一个直接暴露在公网的服务。密码太短、太简单，都会增加风险。

## 收尾

如果你已经完成了 DNS、证书、Compose 和端口放行这几个步骤，这个节点通常就已经可以提供基础服务了。后续当然还可以继续做自动续签、监控、日志收集，或者补上特定客户端的截图与配置示例，但那是下一阶段的事。

先把它稳定跑起来，比一开始就把系统做得很复杂更重要。
