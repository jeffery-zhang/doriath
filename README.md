# doriath

一个使用 Astro、TypeScript、Astro content collections 与 GitHub Pages 部署搭建的个人网站。

## 本地开发

```bash
npm install
npm run dev
```

常用脚本：

- `npm run dev` 启动本地开发服务器。
- `npm run build` 在 `dist/` 中生成生产构建。
- `npm run preview` 在本地预览构建结果。

## 内容结构

- 直接以源码编写的页面位于 `src/pages/`。
- 博客文章位于 `src/content/blog/*.md`。
- 博客集合的 schema 定义在 `src/content.config.ts`。

## 部署

推送到 `main` 会触发 `.github/workflows/deploy.yml`，安装依赖、构建站点、上传 `dist/`，并部署到 GitHub Pages。

构建默认使用自定义域名 `https://jingo1.xyz`，`public/CNAME` 会确保生成产物里包含 GitHub Pages 需要的 `CNAME` 文件。

如果你想使用 GitHub Pages 项目地址而不是自定义域名构建，请把仓库变量设为 `USE_CUSTOM_DOMAIN=false`。这样 Astro 配置就会为 `https://jeffery-zhang.github.io/doriath/` 使用正确的项目 base path。

## GitHub 与 DNS 说明

1. 在 GitHub 中，将 `Settings -> Pages -> Source` 设为 `GitHub Actions`。
2. 在 GitHub Pages 的自定义域设置中，把域名设为 `jingo1.xyz` 并启用 HTTPS。
3. 在 Cloudflare 中，把裸域指向 GitHub Pages，并创建 `www` 记录让它解析到同一站点。DNS 记录和自定义域都配置正确后，GitHub Pages 会把 `www.jingo1.xyz` 重定向到 `jingo1.xyz`。
