import type { CollectionEntry } from "astro:content";

/**
 * Single source of truth for reading statuses, in display order (Lendo,
 * Quero ler, Lido). Also imported by `content.config.ts` for the Zod
 * schema, so a status can't be added to one without the other.
 */
export const bookStatuses = ["lendo", "quero-ler", "lido"] as const;

export type Book = CollectionEntry<"books">;
export type BookStatus = (typeof bookStatuses)[number];

export const bookSlug = (book: Book) => book.id.replace(/\/index$/, "");

export const bookHref = (book: Book) => `/livro/${bookSlug(book)}/`;

const statusLabels: Record<BookStatus, string> = {
  lendo: "Lendo",
  "quero-ler": "Quero ler",
  lido: "Lido",
};

export const statusLabel = (status: BookStatus) => statusLabels[status];

/**
 * Books grouped by status, in display order (Lendo, Quero ler, Lido).
 * Empty groups are dropped. "Lendo" sorts by startedDate desc (most
 * recently started first), "Lido" by finishedDate asc (oldest finish
 * first), "Quero ler" alphabetically (no natural date to sort by).
 */
export const groupByStatus = (books: Book[]) =>
  bookStatuses
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
            return (a.data.finishedDate?.getTime() ?? 0) - (b.data.finishedDate?.getTime() ?? 0);
          }
          return a.data.title.localeCompare(b.data.title, "pt-BR");
        }),
    }))
    .filter((group) => group.books.length > 0);

/** "★★★★☆" for a 1-5 rating, or undefined if the book has no rating yet. */
export const ratingStars = (rating: number | undefined) =>
  rating === undefined ? undefined : "★".repeat(rating) + "☆".repeat(5 - rating);
