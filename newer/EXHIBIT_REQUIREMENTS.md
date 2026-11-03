# Exhibition requirements

These instructions govern the official exhibit. Preserve the separate StopAZ teaser.

1. Reuse the existing photographic animation, its images and choreography. Do not generate imagery.
2. The official landing page has the animation and a small Enter pill only: no logo or top-right controls.
3. Preserve the current title wording. Keep the final title legible without redesigning the animation.
4. The animation is prominent. Center the small pill in the space between the animation container and the bottom of the first viewport.
5. Draw the pill outline visibly and slowly, then reveal Enter. Keep it available after its first appearance.
6. Reveal sentences with a slow landing movement as visitors scroll. Preserve every word, punctuation mark and link.
7. Images, cards, charts and controls lift and subtly brighten on pointer interaction. Images zoom for five to six seconds without washing out.
8. Lines and diagrams visibly form as their section enters view. Keep motion efficient and provide readable reduced-motion content.
9. Design for small phones, iPhone, Android and Samsung phones, tablets, laptops and desktops, including touch and keyboard use.
10. Use restrained black, white and grayscale, carefully set typography, generous but purposeful space, and readable contrast.
11. Optimize loading, metadata, canonical URLs, sharing images, browser icons and touch icons. Metadata must accurately describe the visible exhibit.
12. Build Russian and Hebrew mirrors alongside every page, preserving images, structure and motion, with correct Hebrew direction. Use approved human translations; do not silently invent exhibition copy.
13. Save completed changes to GitHub Final-Exhibit as work proceeds and retain version history. Verify each publication.
14. Do not add AI-written exhibition text or change approved human wording.

## Verification and remaining work — 2026-10-23

Corrected inherited animation scale for phone layouts, sentence-level scroll triggers, normalized SVG drawing lengths and competing hover/reveal rules. Reviewed responsive browser previews at phone and tablet widths and the existing desktop layout. This is browser viewport testing, not physical iPhone or Samsung hardware testing.

Russian and Hebrew landing pages exist. Full internal translated mirrors remain incomplete; approved translations have not been located for the full exhibit. Existing formatted paragraphs retain paragraph-level reveals when sentence splitting would alter inline markup.

Social artwork uses only the existing photographs and existing title; the favicon is a simple typographic three-stroke mark. No AI imagery was generated.

## Future-page hard rule

[EXHIBITION_PAGE_RULES.md](EXHIBITION_PAGE_RULES.md) is mandatory for all subsequent pages. Pages 03–22 are blank numbered shells in English, Russian and Hebrew. Keep their shared styles/scripts and pass `node tools/validate-exhibit-pages.mjs`; publishing, editorial changes, and translation approval are separate gates.
