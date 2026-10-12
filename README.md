# alexprixman.github.io

Alex Prixman’s software engineering portfolio. A responsive, accessible static website featuring the complete techNotes application, professional experience, engineering capabilities, and a concise downloadable English résumé.

## Content

Professional experience and contact links are based on the current résumé. techNotes is one full-stack project across two repositories, with 22 API tests, 17 frontend tests and 12 desktop/mobile browser cases. The illustrative interface is labeled as sample data; project buttons lead to real source repositories.

## Technology

Semantic HTML, modern CSS and a small JavaScript module. The deployed site has no runtime packages, trackers, external fonts, databases or paid services. Navigation and project content remain usable without JavaScript. JavaScript adds mobile navigation, keyboard-accessible tabs, a persistent optional dark theme and clipboard feedback.

## Development and validation

Use Node.js 24:

```sh
npm ci
npm test
npm run build
npm run serve
```

Open http://127.0.0.1:4173. The build copies only deployable assets to `dist/`.

For browser checks:

```sh
npx playwright install --with-deps chromium
npm run test:e2e
```

Unit/DOM tests cover keyboard and mobile navigation, theme persistence, clipboard failures, project tabs, and link/asset integrity. Playwright checks desktop/mobile navigation, tabs, theme persistence, downloads, JavaScript-free rendering, broken assets and overflow. GitHub Actions runs the complete check sequence.

Initial verification: all 13 unit/DOM checks and the dependency audit pass. The résumé was rendered and visually inspected. The 16 desktop/mobile Playwright cases are included for CI but have not yet been executed: this build environment does not provide the supported website browser preview.

## Free GitHub Pages hosting

Create the public repository `alexprixman.github.io` in the AlexPrixman account and push this source to `main`. Under Settings → Pages, choose **Deploy from a branch**, branch **main**, folder **/(root)**. The root contains the complete static site; `.nojekyll` bypasses Jekyll. GitHub then publishes `https://alexprixman.github.io/`.

The validation workflow is independent of GitHub Pages’ own deployment workflow. No custom domain or purchase is required. `dist/` can also be served by any static host.

## Update the portfolio

- Edit sections and professional links in `index.html`.
- Adjust layout/theme in `styles.css`; interaction logic is in `main.js`.
- Replace `assets/alex-prixman-resume.pdf` when the résumé changes.
- Keep test counts factual; update them when the project’s suites change.
- Metadata, sitemap and social preview use the GitHub Pages URL.
