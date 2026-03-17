export const SITE_TITLE = "Jeffery Zhang";
export const SITE_DESCRIPTION =
  "一个用于写作、实验和长期留存笔记的个人站点。";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" });

export function formatDate(date: Date) {
  return dateFormatter.format(date);
}

export function withBase(path: string) {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const normalizedPath = path.replace(/^\/+/, "");
  return new URL(normalizedPath, `https://example.com${base}`).pathname;
}
