import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const repository = process.env.GITHUB_REPOSITORY ?? "jeffery-zhang/doriath";
const [owner = "jeffery-zhang", repo = "doriath"] = repository.split("/");
const customDomain = process.env.CUSTOM_DOMAIN?.trim() || "jingo1.xyz";
const useCustomDomain = process.env.USE_CUSTOM_DOMAIN !== "false";
const isUserOrOrgPagesRepo = repo === `${owner}.github.io`;
const site = useCustomDomain
  ? `https://${customDomain}`
  : `https://${owner}.github.io`;
const base =
  useCustomDomain || isUserOrOrgPagesRepo ? undefined : `/${repo}`;

export default defineConfig({
  site,
  output: "static",
  trailingSlash: "always",
  integrations: [sitemap()],
  ...(base ? { base } : {})
});

