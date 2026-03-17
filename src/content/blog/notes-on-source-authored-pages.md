---
title: Notes on Source-Authored Pages
description: Keeping homepage and about page content in Astro components while the blog stays in Markdown.
pubDate: 2026-03-16
tags:
  - astro
  - architecture
---

Some pages deserve direct authorship in the component layer.

The homepage and about page usually need richer layout control than a Markdown document
provides. They are the place for custom structure, stronger visual pacing, and links to the
rest of the site.

The blog is different. Posts benefit from a tighter authoring loop and a schema-backed
frontmatter model, which makes Markdown a better fit.

