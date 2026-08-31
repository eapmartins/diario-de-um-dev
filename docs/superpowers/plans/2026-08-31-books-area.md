# Área de Livros Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public "Livros" area to the blog — a content collection of books with reading status/rating, a `/livros/` listing grouped by status, a `/livro/<slug>/` detail page with running notes and comments, and a nav entry.

**Architecture:** New Astro content collection (`books`, same `glob` + Zod pattern as `posts`), a small `src/lib/books.ts` helper module mirroring `src/lib/posts.ts`, one new card component, two new pages, and a one-line nav config change. Book notes are just the collection entry's Markdown body — no new rendering pipeline, reuses the exact `render()`/`<Content />` path already used for posts.

**Tech Stack:** Astro 7 (content collections, `astro:assets` `<Image>`), Zod (via `astro/zod`), Tailwind v4 utility classes + scoped `<style>` blocks (existing component convention), TypeScript with the `@/*` → `./src/*` path alias.

**Spec:** `docs/superpowers/specs/2026-08-31-books-area-design.md`

## Global Constraints

- No test framework exists in this repo (`package.json` has no test runner, no `*.test.*`/`*.spec.*` files anywhere). Verification per task is `npm run build` (compiles and type-checks every `.astro` file and content-collection schema) plus, for pages, `npm run dev` and a manual check in the browser — this matches how the previous plan in this repo (`.superpowers/sdd/2026-08-28-monograph-theme-plan/`) was verified. Do not add a test framework as part of this plan.
- Follow existing conventions exactly: `@/*` path alias for all internal imports; Tailwind utility classes in markup + a scoped `<style>` block per `.astro` file for anything not expressible as a utility class (see `src/components/PostCard.astro`); only use CSS custom properties already defined in `src/styles/global.css` (`--border`, `--muted`, `--muted-foreground`, `--foreground`, `--accent`, `--card`, `--radius-sm`, `--radius-full`, `--font-display`) — do not invent new ones.
- All user-facing copy is Portuguese (pt-BR), matching the rest of the site.
- Reuse `formatDate` from `src/lib/posts.ts` for date formatting — do not duplicate it in `src/lib/books.ts`.
- Books are **not** added to site search (`/search-index.json` doesn't exist yet in this repo — pre-existing gap, out of scope per the spec).

---

### Task 1: `books` content collection, data helpers, and a verification fixture

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/lib/books.ts`
- Create: `src/content/books/exemplo-de-verificacao.md`

**Interfaces:**
- Produces: the `books` collection (consumed by every later task's `getCollection("books")`/`getStaticPaths()`); and from `src/lib/books.ts` — `type Book = CollectionEntry<"books">`, `type BookStatus`, `bookSlug(book: Book): string`, `bookHref(book: Book): string`, `statusLabel(status: BookStatus): string`, `groupByStatus(books: Book[]): { status: BookStatus; label: string; books: Book[] }[]`, `ratingStars(rating: number | undefined): string | undefined`.

- [ ] **Step 1: Add the `books` collection to `src/content.config.ts`**

Current full file:

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { categories } from "@/config/categories";

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

export const collections = { posts };
```

Replace it with:

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { categories } from "@/config/categories";

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
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      author: z.string(),
      status: z.enum(["quero-ler", "lendo", "lido"]),
      cover: z
        .object({
          src: image(),
          alt: z.string(),
        })
        .optional(),
      rating: z.number().min(1).max(5).optional(),
      startedDate: z.coerce.date().optional(),
      finishedDate: z.coerce.date().optional(),
    }),
});

export const collections = { posts, books };
```

(Only two changes: the new `books` const, and `posts` → `posts, books` in the exported `collections` object. The `posts` collection is untouched.)

- [ ] **Step 2: Create `src/lib/books.ts`**

```ts
import type { CollectionEntry } from "astro:content";

export type Book = CollectionEntry<"books">;
export type BookStatus = Book["data"]["status"];

export const bookSlug = (book: Book) => book.id.replace(/\/index$/, "");

export const bookHref = (book: Book) => `/livro/${bookSlug(book)}/`;

const statusLabels: Record<BookStatus, string> = {
  lendo: "Lendo",
  "quero-ler": "Quero ler",
  lido: "Lido",
};

export const statusLabel = (status: BookStatus) => statusLabels[status];

/** Display order for grouped listings. */
const statusOrder: BookStatus[] = ["lendo", "quero-ler", "lido"];

/**
 * Books grouped by status, in display order (Lendo, Quero ler, Lido).
 * Empty groups are dropped. "Lendo" sorts by startedDate desc, "Lido" by
 * finishedDate desc, "Quero ler" alphabetically (no natural date to sort by).
 */
export const groupByStatus = (books: Book[]) =>
  statusOrder
    .map((status) => ({
      status,
      label: statusLabel(status),
      books: books
        .filter((book) => book.data.status === status)
        .sort((a, b) => {
          if (status === "lendo") {
            return (b.data.startedDate?.getTime() ?? 0) - (a.data.startedDate?.getTime() ?? 0);
          }
          if (status === "lido") {
            return (b.data.finishedDate?.getTime() ?? 0) - (a.data.finishedDate?.getTime() ?? 0);
          }
          return a.data.title.localeCompare(b.data.title, "pt-BR");
        }),
    }))
    .filter((group) => group.books.length > 0);

/** "★★★★☆" for a 1-5 rating, or undefined if the book has no rating yet. */
export const ratingStars = (rating: number | undefined) =>
  rating === undefined ? undefined : "★".repeat(rating) + "☆".repeat(5 - rating);
```

- [ ] **Step 3: Create the verification fixture `src/content/books/exemplo-de-verificacao.md`**

This is a throwaway entry used to manually verify every later task in this plan (empty cover → placeholder path, multiple dated note sections in one file, "lendo" status). A note at the end of this plan reminds you to replace or delete it once everything is verified.

```markdown
---
title: "Livro de Teste (apagar depois de verificar)"
author: "Autor de Teste"
status: "lendo"
startedDate: 2026-08-20
---

## 2026-08-20

Comecei a ler hoje. Este parágrafo existe só pra confirmar que o corpo do
arquivo renderiza como markdown normal, igual a um post — **negrito**,
*itálico*, e uma lista:

- primeiro ponto
- segundo ponto

## 2026-08-25 — Capítulo 3

> Uma citação qualquer, pra confirmar que blockquotes também funcionam aqui.

Segunda anotação, adicionada depois da primeira, pra confirmar que várias
entradas datadas no mesmo arquivo aparecem em sequência.
```

- [ ] **Step 4: Verify**

```bash
cd /Users/eapmartins/dev/repositories/diario-de-um-dev
npm run build
```

Expected: build succeeds with no errors (no page references the `books` collection yet, so this only proves the schema and the fixture's frontmatter are both valid — a typo in `status`, or a bad date, would fail the build here).

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/lib/books.ts src/content/books/exemplo-de-verificacao.md
git commit -m "Add books content collection and data helpers"
```

---

### Task 2: `BookCard` component and the `/livros/` listing page

**Files:**
- Create: `src/components/BookCard.astro`
- Create: `src/pages/livros.astro`

**Interfaces:**
- Consumes: `Book`, `bookHref`, `ratingStars`, `groupByStatus` from `src/lib/books.ts` (Task 1, `groupByStatus`'s returned `label` already resolves through `statusLabel` internally — neither file here needs to import `statusLabel` directly); `visiblePosts` from `src/lib/posts.ts` (existing, needed only to satisfy `SiteHeader`'s `posts` prop); `SiteHeader`, `SiteFooter`, `BaseLayout` (existing components, unmodified).
- Produces: `BookCard.astro` (`Props: { book: Book }`), consumed by Task 2's own listing page only (no later task imports it directly, but the detail page in Task 3 duplicates its cover-rendering pattern intentionally — see that task).

- [ ] **Step 1: Create `src/components/BookCard.astro`**

```astro
---
import { Image } from "astro:assets";
import { bookHref, ratingStars, type Book } from "@/lib/books";

interface Props {
  book: Book;
}

const { book } = Astro.props;
const { title, author, status, rating, cover } = book.data;
const href = bookHref(book);
const stars = ratingStars(rating);
---

<article class="book-card">
  <a href={href} class="link-title">
    <div class="book-cover">
      {
        cover ? (
          <Image src={cover.src} alt={cover.alt} width={320} height={480} class="book-cover-img" />
        ) : (
          <div class="book-cover-placeholder" aria-hidden="true">
            <span>{title}</span>
          </div>
        )
      }
    </div>
    <p class="book-card-title link-title__text mt-3 font-semibold">{title}</p>
    <p class="book-card-author text-sm text-muted-foreground">{author}</p>
    {
      status === "lido" && stars && (
        <p class="book-card-rating mt-1" aria-label={`Nota: ${rating} de 5`}>
          {stars}
        </p>
      )
    }
  </a>
</article>

<style>
  .book-cover {
    aspect-ratio: 2 / 3;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--muted);
  }

  .book-cover-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .book-cover-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 1rem;
    text-align: center;
    color: var(--muted-foreground);
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .book-card-title {
    line-height: 1.3;
    text-wrap: balance;
  }

  .book-card-author {
    margin-top: 0.15rem;
  }

  .book-card-rating {
    color: var(--accent);
    letter-spacing: 0.05em;
  }
</style>
```

- [ ] **Step 2: Create `src/pages/livros.astro`**

```astro
---
import { getCollection } from "astro:content";
import BookCard from "@/components/BookCard.astro";
import SiteFooter from "@/components/SiteFooter.astro";
import SiteHeader from "@/components/SiteHeader.astro";
import BaseLayout from "@/layouts/BaseLayout.astro";
import { groupByStatus } from "@/lib/books";
import { visiblePosts } from "@/lib/posts";

const allPosts = visiblePosts(await getCollection("posts"));
const books = await getCollection("books");
const groups = groupByStatus(books);
---

<BaseLayout
  title="Livros"
  description="Livros que estou lendo, já li, ou quero ler, com minhas anotações."
>
  <SiteHeader posts={allPosts} />
  <main id="content" class="outer">
    <div class="canvas">
      <header class="pagehead">
        <p class="eyebrow">Índice</p>
        <h1 class="pagehead-title">Livros</h1>
        <p class="pagehead-description">
          {books.length} {books.length === 1 ? "livro" : "livros"} registrados até agora.
        </p>
      </header>

      {
        groups.length > 0 ? (
          groups.map((group) => (
            <section class="mt-16 first:mt-0">
              <h2 class="section-title">{group.label}</h2>
              <div class="book-grid mt-6">
                {group.books.map((book) => (
                  <BookCard book={book} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <p class="text-muted-foreground">Nenhum livro registrado ainda.</p>
        )
      }
    </div>
  </main>
  <SiteFooter />
</BaseLayout>

<style>
  .book-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.75rem 1.5rem;
  }

  @media (min-width: 640px) {
    .book-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (min-width: 1024px) {
    .book-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
</style>
```

- [ ] **Step 3: Verify**

```bash
cd /Users/eapmartins/dev/repositories/diario-de-um-dev
npm run dev
```

Open `http://localhost:4321/livros/`. Expected:
- A "Lendo" section heading with one card: "Livro de Teste (apagar depois de verificar)" / "Autor de Teste".
- The card's cover area shows the muted placeholder box with the title text (since the fixture has no `cover`), not a broken image.
- No "Quero ler" or "Lido" sections render (both groups are empty and are dropped, not shown as empty headings).
- No console errors in the browser devtools.

Stop the dev server (Ctrl+C) once verified.

- [ ] **Step 4: Commit**

```bash
git add src/components/BookCard.astro src/pages/livros.astro
git commit -m "Add BookCard component and /livros/ listing page"
```

---

### Task 3: `/livro/<slug>/` detail page

**Files:**
- Create: `src/pages/livro/[slug].astro`

**Interfaces:**
- Consumes: `bookSlug`, `statusLabel`, `ratingStars`, `type Book` from `src/lib/books.ts` (Task 1); `formatDate`, `visiblePosts` from `src/lib/posts.ts` (existing); `Comments`, `SiteFooter`, `SiteHeader`, `BaseLayout` (existing, unmodified — `Comments.astro` takes no props and needs no changes, since giscus already maps discussions by `pathname`, so each book page gets its own discussion automatically).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Create `src/pages/livro/[slug].astro`**

```astro
---
import { getCollection, render } from "astro:content";
import { Image } from "astro:assets";
import Comments from "@/components/Comments.astro";
import SiteFooter from "@/components/SiteFooter.astro";
import SiteHeader from "@/components/SiteHeader.astro";
import BaseLayout from "@/layouts/BaseLayout.astro";
import { bookSlug, ratingStars, statusLabel, type Book } from "@/lib/books";
import { formatDate, visiblePosts } from "@/lib/posts";

export async function getStaticPaths() {
  const books = await getCollection("books");

  return books.map((book) => ({
    params: { slug: bookSlug(book) },
    props: { book },
  }));
}

interface Props {
  book: Book;
}

const { book } = Astro.props;
const { Content } = await render(book);
const { title, author, status, rating, startedDate, finishedDate, cover } = book.data;
const allPosts = visiblePosts(await getCollection("posts"));
const stars = ratingStars(rating);
const description = `Minhas anotações de leitura sobre ${title}, de ${author}.`;
---

<BaseLayout title={title} description={description} type="article">
  <SiteHeader posts={allPosts} />
  <main id="content" class="outer">
    <article class="canvas">
      <header class="pagehead book-pagehead">
        <div class="book-pagehead-cover">
          {
            cover ? (
              <Image src={cover.src} alt={cover.alt} width={240} height={360} class="book-cover-img" />
            ) : (
              <div class="book-cover-placeholder" aria-hidden="true">
                <span>{title}</span>
              </div>
            )
          }
        </div>
        <div class="book-pagehead-info">
          <p class="eyebrow">{author}</p>
          <h1 class="pagehead-title">{title}</h1>
          <p class="meta mt-5">
            <span class="pill">{statusLabel(status)}</span>
            {stars && <span aria-label={`Nota: ${rating} de 5`}>{stars}</span>}
            {startedDate && <span>Início: {formatDate(startedDate, "long")}</span>}
            {finishedDate && <span>Fim: {formatDate(finishedDate, "long")}</span>}
          </p>
        </div>
      </header>

      <div class="prose">
        <Content />
      </div>
    </article>

    <div class="canvas mt-16">
      <Comments />
    </div>
  </main>
  <SiteFooter />
</BaseLayout>

<style>
  .book-pagehead {
    display: flex;
    flex-wrap: wrap;
    gap: 1.75rem;
    align-items: flex-start;
  }

  .book-pagehead-cover {
    width: 9rem;
    aspect-ratio: 2 / 3;
    flex: 0 0 auto;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--muted);
  }

  .book-cover-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .book-cover-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 0.75rem;
    text-align: center;
    color: var(--muted-foreground);
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 600;
  }

  .book-pagehead-info {
    flex: 1 1 16rem;
    min-width: 0;
  }
</style>
```

- [ ] **Step 2: Verify**

```bash
cd /Users/eapmartins/dev/repositories/diario-de-um-dev
npm run dev
```

Open `http://localhost:4321/livro/exemplo-de-verificacao/`. Expected:
- Placeholder cover box on the left, title/author/status pill on the right (no rating or "Fim" shown — the fixture has neither `rating` nor `finishedDate`; "Início: 20 de agosto de 2026" does show).
- Below that, both `##` sections from the fixture render as headings with their paragraphs, list, and blockquote formatted the same way a post's body would be (same typography as `/post/...` pages).
- Scrolling down, the giscus comment widget loads (same as on post pages) — this confirms `<Comments />` works unmodified on a non-`/post/` path.
- No console errors.

Stop the dev server once verified.

- [ ] **Step 3: Commit**

```bash
git add src/pages/livro/
git commit -m "Add book detail page at /livro/<slug>/"
```

---

### Task 4: Navigation entry

**Files:**
- Modify: `src/config/site.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed by other tasks — this is the last task.

- [ ] **Step 1: Add "Livros" to the `navigation` array**

Current:

```ts
export const navigation = [
  { label: "Arquivo", href: "/posts/" },
  { label: "Categorias", href: "/categories/" },
  { label: "Sobre", href: "/about/" },
];
```

Replace with:

```ts
export const navigation = [
  { label: "Arquivo", href: "/posts/" },
  { label: "Livros", href: "/livros/" },
  { label: "Categorias", href: "/categories/" },
  { label: "Sobre", href: "/about/" },
];
```

- [ ] **Step 2: Verify**

```bash
cd /Users/eapmartins/dev/repositories/diario-de-um-dev
npm run dev
```

Open `http://localhost:4321/`. Expected:
- Desktop header nav now reads "Arquivo · Livros · Categorias · Sobre", in that order.
- Clicking "Livros" navigates to `/livros/` and the link shows as the active/current page (`SiteHeader`'s existing `isCurrentPath` logic already handles this generically — no changes needed there).
- Shrink the window below the `md` breakpoint (or use devtools device mode) and open the mobile menu (hamburger icon) — "Livros" appears there too, in the same order, and also navigates correctly.

Stop the dev server once verified.

- [ ] **Step 3: Final full-project build**

```bash
cd /Users/eapmartins/dev/repositories/diario-de-um-dev
npm run build
```

Expected: build succeeds, and the output logs a static page generated for `/livros/index.html` and `/livro/exemplo-de-verificacao/index.html` alongside the existing post/category pages.

- [ ] **Step 4: Commit**

```bash
git add src/config/site.ts
git commit -m "Add Livros entry to site navigation"
```

---

## After this plan

`src/content/books/exemplo-de-verificacao.md` (Task 1) is a placeholder used only to verify Tasks 1–4 render correctly. It is **not** deleted or replaced by any task above — that's a manual step for you, once you've confirmed everything looks right: either delete the file, or edit it in place to become your first real book entry (same frontmatter shape, just replace the values and notes).
