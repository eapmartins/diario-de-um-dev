# Diário de um Dev

Blog pessoal sobre engenharia de software, publicado em [diariodeum.dev](https://diariodeum.dev). Construído com [Astro](https://astro.build).

## Desenvolvimento

```sh
npm install
npm run dev
```

| Comando           | Ação                                          |
| :----------------- | :--------------------------------------------- |
| `npm install`       | Instala as dependências                        |
| `npm run dev`       | Inicia o servidor local em `localhost:4321`    |
| `npm run build`     | Gera o build de produção em `./dist/`          |
| `npm run preview`   | Faz o preview local do build antes de publicar |

Posts do blog ficam em `src/content/posts/` como arquivos Markdown.

## Deploy

Publicado automaticamente no GitHub Pages a cada push em `main`, via `.github/workflows/deploy.yml`.
