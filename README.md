# doriath

Personal website scaffolded with Astro, TypeScript, Astro content collections, and GitHub
Pages deployment.

## Local development

```bash
npm install
npm run dev
```

Useful scripts:

- `npm run dev` starts the local dev server.
- `npm run build` creates the production site in `dist/`.
- `npm run preview` serves the built output locally.

## Content model

- Source-authored pages live in `src/pages/`.
- Blog posts live in `src/content/blog/*.md`.
- The blog collection schema is defined in `src/content.config.ts`.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which installs dependencies, builds
the site, uploads `dist/`, and deploys to GitHub Pages.

The build defaults to the custom domain `https://jingo1.xyz`, and `public/CNAME` ensures the
generated output contains the `CNAME` file GitHub Pages expects.

If you want to build for the fallback GitHub Pages project URL instead of the custom domain,
set the repository variable `USE_CUSTOM_DOMAIN=false`. The Astro config will then build with
the correct project base path for `https://jeffery-zhang.github.io/doriath/`.

## GitHub and DNS notes

1. In GitHub, set `Settings -> Pages -> Source` to `GitHub Actions`.
2. In GitHub Pages custom domain settings, set the domain to `jingo1.xyz` and enable HTTPS.
3. In Cloudflare, point the apex domain to GitHub Pages and create `www` so it resolves to
   the same site. GitHub Pages will redirect `www.jingo1.xyz` to `jingo1.xyz` once both the
   DNS records and the custom domain are configured correctly.
