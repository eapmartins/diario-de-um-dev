import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { categories } from "@/config/categories";
import { bookStatuses } from "@/lib/books";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      excerpt: z.string(),
      category: z.enum(categories),
      date: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      cover: z
        .object({
          src: image(),
          alt: z.string(),
          creditName: z.string().optional(),
          creditUrl: z.url().optional(),
        })
        .optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const books = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/books" }),
  schema: () =>
    z.object({
      title: z.string(),
      author: z.string(),
      status: z.enum(bookStatuses),
      /** Remote cover URL (e.g. Open Library) — fetched by the visitor's browser, not bundled. */
      cover: z
        .object({
          src: z.url(),
          alt: z.string(),
        })
        .optional(),
      rating: z.number().int().min(1).max(5).optional(),
      startedDate: z.coerce.date().optional(),
      finishedDate: z.coerce.date().optional(),
    }),
});

export const collections = { posts, books };
