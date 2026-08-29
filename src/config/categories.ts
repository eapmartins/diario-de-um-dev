/**
 * The site's categories. Every post belongs to exactly one of these.
 * Order matters: it is the order used on the categories index and in the
 * home sidebar.
 */
export const categories = [
  "Engenharia de Software",
  "Idiomas",
  "Side Projects",
  "Meta",
] as const;

export type Category = (typeof categories)[number];

export const categorySlug = (category: string) =>
  category
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

/** One line per category, shown on its archive page and in listings. */
export const categoryDescriptions: Record<Category, string> = {
  "Engenharia de Software": "Testes, depuração, arquitetura, e o dia a dia de construir software.",
  Idiomas: "Notas de estudo sobre aprender um novo idioma.",
  "Side Projects": "Projetos pessoais e experimentos fora do trabalho.",
  Meta: "Sobre este blog e como ele funciona.",
};
