export const siteConfig = {
  /** Wordmark shown in the header and footer. */
  name: "Diário de um Dev",
  tagline: "Notas do dia a dia como desenvolvedor",
  title: "Diário de um Dev",
  description:
    "Diário sobre o dia a dia como desenvolvedor: engenharia de software, aprendizado de idiomas, side projects e o que mais aparecer pelo caminho.",
  siteUrl: "https://diariodeum.dev",
  /** Only used for JSON-LD publisher metadata — there is no per-post author. */
  authorName: "Diário de um Dev",
  language: "pt-BR",
  dateLocale: "pt-BR",
  locale: "pt_BR",
  // No dedicated Open Graph image yet — falls back to the site favicon.
  socialImage: "/favicon.svg",
  /** Seed text for the /about/ page. */
  about:
    "Um diário sobre o dia a dia como engenheiro de software. Além do lado técnico, você também vai encontrar aprendizados sobre idiomas, eventualmente side projects, e outras coisas que forem surgindo pelo caminho.",
};

/** Header navigation. Renders in the desktop header and the mobile menu. */
export const navigation = [
  { label: "Arquivo", href: "/posts/" },
  { label: "Categorias", href: "/categories/" },
  { label: "Sobre", href: "/about/" },
];
