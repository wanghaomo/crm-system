---
name: ghpages-deploy
description: 构建 GitHub Pages 可用的 dist 并部署到指定仓库的 gh-pages 分支。使用当用户要求打包上线到 GitHub Pages、部署 dist、或更新 GitHub Pages 站点时。不适用于普通 npm run build 或非 GitHub Pages 的静态部署。
---

# GitHub Pages 部署流程

本技能把当前项目打包成 GitHub Pages 可直接托管的静态产物，并推送到 `gh-pages` 分支。适用于这个 CRM 仓库（`https://github.com/wanghaomo/crm-system.git`）及任何同结构的 Vite 项目。

## 前置条件（进入本技能前先自查）

- 项目根目录存在 `.env.ghpages`，包含 `VITE_APP_BASE_URL=/<repo-name>/` 和 `VITE_USE_MOCK=true`
- `package.json` 有 `build:ghpages` 脚本（本质是 `vite build --mode ghpages`）
- 本机 Node 版本 ≥ 20.19 或 22.12；本仓库默认是 `~/.nvm/versions/node/v22.14.0/bin/node`
- GitHub 仓库路径形如 `https://github.com/<user>/<repo>.git`，且已开启 Pages（分支通常选 `gh-pages` + 根路径 `/`）

如果以上任何一条缺失，**先补齐**（创建 env 文件、加脚本、切 node、在 GitHub 开启 Pages）再执行下面步骤。

## 部署步骤（按顺序执行，每步都要验证）

### 1. 构建 dist

```bash
export PATH="$HOME/.nvm/versions/node/v22.14.0/bin:$PATH"
cd "<projectRoot>"
npm run build:ghpages
```

验证：
- `dist/index.html` 里 `<script src="/<repo-name>/js/...">` 和 `<link href="/<repo-name>/css/...">` 的路径前缀正确（不要是 `/js/...`，那就是没走 ghpages env）
- `dist/` 下存在 `images/` 目录和主 JS/CSS 文件，没有空壳产物

### 2. 本地校验（强烈推荐）

起一个静态服务器模拟 GitHub Pages 访问：

```bash
(cd dist && python3 -m http.server 8090 >/dev/null 2>&1 &)
sleep 1
curl -s -o /dev/null -w "root -> %{http_code}\n" "http://localhost:8090/<repo-name>/"
curl -s -o /dev/null -w "logo -> %{http_code}\n" "http://localhost:8090/<repo-name>/logo.png"
```

如果 `root` 不是 200，通常是 `VITE_APP_BASE_URL` 设错了，回去改 env 重打包。

### 3. 准备 gh-pages 推送目录

```bash
rm -rf /tmp/ghp-push
cp -R dist /tmp/ghp-push
touch /tmp/ghp-push/.nojekyll   # 防止 GitHub Pages 走 Jekyll 过滤
```

### 4. 推送 gh-pages 分支

**重要**：本仓库访问 GitHub 可能需要走代理，先探测一下能否直连：

```bash
curl -s -o /dev/null -w "%{http_code}\n" --max-time 5 "https://github.com"
```

- 如果返回 200，直接用系统 git
- 如果超时/失败，所有 git 命令前加 `HTTPS_PROXY=http://127.0.0.1:7897`

推送命令：

```bash
REPO_URL="https://github.com/<user>/<repo>.git"
BRANCH="gh-pages"
PROXY_PREFIX=""   # 如果需要代理则改为 HTTPS_PROXY=http://127.0.0.1:7897
COMMIT_MSG="build: GitHub Pages 静态产物 ($(date +%Y%m%d-%H%M%S))"

cd /tmp/ghp-push
$PROXY_PREFIX git init -b gh-pages 2>/dev/null || { git init; git symbolic-ref HEAD refs/heads/gh-pages; }
git add -A
git -c user.email="agent@local" -c user.name="Agent" commit -m "$COMMIT_MSG"
$PROXY_PREFIX git remote add origin "$REPO_URL"
$PROXY_PREFIX git push -f origin gh-pages
```

### 5. 推送源码到 main（可选）

如果用户也要求源码入库，在项目根目录：

```bash
cd "<projectRoot>"
# 确保 .gitignore 已排除 node_modules/ dist/ dist.zip .env.local 等
git init -b main 2>/dev/null || git init && git symbolic-ref HEAD refs/heads/main
git add -A
git -c user.email="agent@local" -c user.name="Agent" commit -m "feat: CRM 前端演示系统"
git remote add origin "$REPO_URL"
$PROXY_PREFIX git push -u -f origin main
```

### 6. GitHub Pages 设置（首次才需要）

通过 GitHub API 设置 Pages 源，避免 UI 操作：

```bash
REPO="https://api.github.com/repos/<user>/<repo>"
TOKEN="<your-github-pat>"   # 如果本地 credential helper 已配好就省掉 -H 里的 token

# 先探测 Pages 当前 source，避免误改
$PROXY_PREFIX curl -s -H "Authorization: token $TOKEN" "$REPO/pages" | head -5

# 设置为 gh-pages + /
$PROXY_PREFIX curl -s -X PUT -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source":{"branch":"gh-pages","path":"/"}}' \
  "$REPO/pages"

# 触发一次重建
LATEST_SHA=$($PROXY_PREFIX curl -s -H "Authorization: token $TOKEN" "$REPO/commits/gh-pages" | grep -oE '"sha":"[^"]+"' | head -1 | cut -d'"' -f4)
$PROXY_PREFIX curl -s -X POST -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -d "{\"build_type\":\"legacy\"}" \
  "$REPO/pages/builds"
```

### 7. 线上验证

**等 30–60 秒**让 Pages 构建，然后：

```bash
BASE="https://<user>.github.io/<repo>/"
$PROXY_PREFIX curl -s -o /dev/null -w "root -> %{http_code}\n" "$BASE"
$PROXY_PREFIX curl -s -o /dev/null -w "logo -> %{http_code}\n" "$BASE/logo.png"

# 从 index.html 里抠出主 JS 路径再测一次
JS=$($PROXY_PREFIX curl -s "$BASE" | grep -oE '/<repo>/js/index-[A-Za-z0-9_-]+\.js' | head -1)
$PROXY_PREFIX curl -s -o /dev/null -w "main js $JS -> %{http_code}\n" "$BASE$JS"
```

如果 root 是 200 但 main js 是 404，检查 `VITE_APP_BASE_URL` 是否多/少了尾部 `/`。

**打开浏览器最终确认**：访问 `https://<user>.github.io/<repo>/#/<system-code>/home/index`，看仪表盘和菜单是否正常渲染，控制台有没有关键错误。

## 常见故障速查

| 现象 | 原因 | 修复 |
|------|------|------|
| 页面空白 | base 路径错了，或者没走 ghpages env | 重设 `VITE_APP_BASE_URL=/<repo>/`，确认 `npm run build:ghpages` 产物里的路径前缀 |
| CSS 里 `url()` 还指向内网地址（如 `192.168.x.x`） | postcss-url 还在重写 URL | 从 `postcss.config.js` 移除 `postcssUrl` 插件 |
| JS 404 但 root 200 | 代理变量在 curl 里漏了 | 所有 curl/git 命令前加 `HTTPS_PROXY=http://127.0.0.1:7897` |
| `ReferenceError: CustomEvent is not defined` | 用 Node 16 跑了 Vite 8 | 切到 Node 22 (`nvm use 22`) |
| GitHub API 返回 404 | PAT 没 repo 权限或没登录 | 用 `git credential-osxkeychain` 或直接把 PAT 放 `-H` |

## 收尾

部署成功后**给用户一个简明汇报**，包含：
- 仓库地址（main + gh-pages 分支各自职责）
- 线上访问 URL
- 关键配置（`VITE_APP_BASE_URL`、`VITE_USE_MOCK`）
- 验证结果（root/js/logo 的 HTTP 状态码、仪表盘关键数字、控制台是否干净）
