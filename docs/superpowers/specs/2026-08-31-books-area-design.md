# Área de Livros — Design

## Contexto

O blog (Astro 7, content collections com `glob` loader) hoje tem uma única
collection, `posts`, cada um um arquivo Markdown com frontmatter validado por
Zod (`src/content.config.ts`) e renderizado via `render()`/`<Content />`
(`src/pages/post/[slug].astro`).

O pedido: uma área nova, pública, para registrar livros que o autor está
lendo/leu, com notas de leitura — visitável como o resto do blog, com link no
menu principal.

## Decisões já tomadas (checkpoint com o usuário)

- Área pública, parte do blog (não um bloco à parte "privado").
- Cada livro tem várias anotações ao longo do tempo (não um texto único
  fechado).
- As anotações vivem **num único arquivo por livro** — não um arquivo por
  anotação.
- Metadados por livro: título, autor, status de leitura, capa, nota
  (avaliação), datas de início/término.
- Item novo no menu principal ("Livros"), URL própria (`/livros/`).
- Listagem em grade de capas, agrupada por status.

## Modelo de dados

Nova collection `books`, mesmo padrão de `posts`: um arquivo Markdown por
livro em `src/content/books/`, carregado com `glob({ pattern: "**/*.md", base:
"./src/content/books" })`.

Schema (`src/content.config.ts`):

```ts
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

Sem campo `draft` — livros só entram no repo quando o autor já quer publicá-los
(YAGNI: pode ser adicionado depois se a necessidade aparecer).

**Corpo do arquivo = as anotações.** Não existe um sub-sistema de "entradas"
separado: o corpo Markdown do arquivo do livro é renderizado exatamente como
o corpo de um post (mesmo `render()`, mesmos plugins remark/shiki, mesmos
estilos de `<mark>`/callout já usados nos posts). Convenção de autoria para
"múltiplas anotações ao longo do tempo": cada nova nota é introduzida com um
cabeçalho `## AAAA-MM-DD` (opcionalmente `## AAAA-MM-DD — título curto`), e o
autor vai acrescentando novos `##` no fim do arquivo conforme lê. Isso não
exige nenhum parsing novo — é markdown comum fluindo como um post.

## `src/lib/books.ts`

Espelha `src/lib/posts.ts`:

- `export type Book = CollectionEntry<"books">`
- `bookSlug(book)`, `bookHref(book)` → `/livro/<slug>/`
- `statusLabel(status)` → `"Quero ler" | "Lendo" | "Lido"` (pt-BR)
- `groupByStatus(books)` → `{ lendo: Book[], "quero-ler": Book[], lido: Book[] }`,
  cada grupo ordenado:
  - `lendo`: por `startedDate` desc (mais recente primeiro)
  - `lido`: por `finishedDate` desc
  - `quero-ler`: por `title` (alfabético, não há data natural)
- `ratingStars(rating)` → string/array pronta pra renderizar (ex.: `"★★★★☆"`)
  ou `undefined` se não houver nota
- `formatDate` é reaproveitado de `lib/posts.ts` (já genérico, sem acoplamento
  a `Post`)

## Páginas

- **`src/pages/livros.astro`** — grade de capas agrupada por status, mesma
  ordem de exibição: **Lendo → Quero ler → Lido**. Segue o padrão visual de
  `posts.astro`/`categories.astro` (mesmo `outer`/`canvas`, `SiteHeader`,
  `SiteFooter`). Cada seção de status é um heading (`section-title`) + grade
  de `BookCard`.
- **`src/pages/livro/[slug].astro`** — mesma estrutura de
  `src/pages/post/[slug].astro`: `getStaticPaths()` sobre a collection
  `books`, cabeçalho com capa, título, autor, badge de status, estrelas (se
  houver `rating`), datas formatadas, depois `<Content />` com as anotações,
  e por fim `<Comments />` no rodapé (reaproveitando o componente existente —
  o giscus já mapeia por `pathname`, então cada livro ganha sua própria
  discussão automaticamente, sem mudança no `Comments.astro`).

## Componente `BookCard.astro`

Novo componente (`src/components/BookCard.astro`), inspirado em
`PostCard.astro` mas focado em capa: imagem de capa (ou placeholder se
`cover` ausente), título, autor, e — quando `status === "lido"` — as
estrelas da nota. Link para `bookHref(book)`.

## Navegação

`src/config/site.ts`, array `navigation`, novo item:

```ts
{ label: "Livros", href: "/livros/" }
```

Adicionado entre "Arquivo" e "Categorias" (ou na posição que ficar melhor
visualmente — decisão de implementação, sem impacto arquitetural).

## Fora de escopo (YAGNI)

- **Busca incluindo livros.** Hoje `/search-index.json` não é gerado por
  nenhum endpoint do projeto — o `fetch` em `SiteHeader.astro` sempre cai no
  fallback inlineado (os 12 posts mais recentes, montados em
  `SiteHeader.astro` a partir de `visiblePosts`). Ou seja, a busca já não
  cobre todo o conteúdo hoje; isso é uma lacuna pré-existente, não introduzida
  por este trabalho. Incluir livros na busca exigiria primeiro construir um
  índice de verdade (que não existe), o que é um projeto à parte — fica de
  fora deste design.
- Filtro/paginação na listagem de livros.
- Campo `draft` em livros.
- Gêneros/tags de livros.
- RSS de livros.
- Qualquer edição de comentários/reações do giscus (limitação conhecida do
  próprio giscus, não relacionada a este trabalho).
