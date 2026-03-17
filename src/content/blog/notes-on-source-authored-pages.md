---
title: 关于源码编写页面的笔记
description: 首页和关于页保留在 Astro 组件里，而博客继续使用 Markdown。
pubDate: 2026-03-16
tags:
  - astro
  - architecture
---

有些页面更适合直接在组件层编写。

首页和关于页通常需要比 Markdown 文档更细的布局控制。那里更适合放定制结构、更强的视觉节奏，以及通往站内其他部分的链接。

博客不同。文章更适合更紧凑的写作流程，也更适合有 schema 约束的 frontmatter 模型，所以 Markdown 会是更合适的选择。
