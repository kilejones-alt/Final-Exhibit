# Final Exhibit

Official working repository for the exhibition website.

The root entrance uses the approved third mock-up: the existing 36-second image installation, the ending title “The Third Era” with “Exhibition” and “Enter Below,” a slowly drawn ENTER pill, and compact Russian, Hebrew, and music controls.

## Non-negotiable language rule

English, Russian, and Hebrew are developed together. A feature is not complete until the English root and the `/ru/` and `/he/` versions are updated and checked in the same release.

See [LANGUAGES.md](LANGUAGES.md).

## Binding production standard

**Hard rule:** [EXHIBITION_PAGE_RULES.md](EXHIBITION_PAGE_RULES.md) governs all future pages. Twenty reserved, visually blank exhibition slots (pages 03–22) exist in English, Russian and Hebrew. Run `node tools/validate-exhibit-pages.mjs` before merging. Do not publish a blank slot without explicit approval.
