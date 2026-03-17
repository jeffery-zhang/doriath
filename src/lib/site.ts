export const SITE_TITLE = "Jeffery Zhang";
export const SITE_DESCRIPTION =
  "Personal site for writing, experiments, and durable notes about building on the web.";

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "long" });

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

