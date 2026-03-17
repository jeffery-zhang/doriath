import { getCollection, type CollectionEntry } from "astro:content";

export type BlogPost = CollectionEntry<"blog">;

export async function getPublishedBlogPosts() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);

  return posts.sort(
    (left, right) => right.data.pubDate.valueOf() - left.data.pubDate.valueOf()
  );
}

