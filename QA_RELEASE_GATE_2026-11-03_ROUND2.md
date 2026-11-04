# Three Eras — release gate (round 2, November 3, 2026)

This branch modifies no exhibition wording, artwork, homepage animation, soundtrack, page geometry, or film duration. Do not merge or publish without approval.

## Source fixes
- Replace the obsolete 138-second Deicide QA constant with a check that the actual curated scene total matches the film seek control's maximum. Currently both are 87.5 seconds across 14 scenes. This changes **only the checker**, not playback.
- Add `hreflang="en"` to existing English exhibition-room destinations in the Russian and Hebrew entrances. All visible link text stays in its approved original language.
- Add `tools/audit-locale-coverage.mjs` to report untranslated rooms and document the English fallback. Its `--strict` mode blocks certification of a fully trilingual release until real, approved translations exist.

## Release boundaries
- There are eight primary populated English exhibition routes with no equivalent Russian or Hebrew file (16 missing translated routes total). `gallery.html` and `overview.html` are redirects, not separate translated curatorial rooms.
- Do **not** fabricate translations, create pseudo-localized copies of English historical prose, or publish the 60 reserved blank future pages.
- Chromium mobile/touch viewport tests are simulations, **not** physical iPhone Safari or Android hardware certification.
- The standalone Deicide film's current 87.5 seconds are preserved; the older 138-second idea is not a mandate to retime all its archival cards.

The remainder of the quality review is recorded in companion local screenshots and browser reports; it is not evidence of editorial sign-off, full rights clearance, or final production release.


## Completed browser evidence (review branch)

- **102** Chromium rendered viewport checks over **17 routes**, at widths 320, 390, 768, 1024, 1440 and 1920: no reported missing assets, JavaScript exceptions or horizontal overflow.
- **51** additional Chromium layout checks for 360px, 412px and 844×390 landscape: no reported missing assets, JavaScript exceptions or horizontal overflow.
- **16** focused interaction checks cover opening image/title/background click-to-skip, music control independence, timeline desktop hover and phone taps, diagram presence and reduced motion.
- **56/56** independent GitHub Actions checks passed across real desktop browser engines **Chromium and WebKit**, at 390px and 1440px: [review run](https://github.com/kilejones-alt/Final-Exhibit/actions/runs/41746995431).
- An early WebKit Deicide screenshot captured the existing initial black fade. At 3.2 seconds, both WebKit and Chromium reported the stage at full opacity with the original artwork visible. No film timing, imagery or styling was altered.
- The browser tests are **simulated mobile profiles**, not physical-device iPhone Safari or Android certification. Do not describe them as real phone testing.
- A strict locale-coverage check must continue to **block claims of completed trilingual historical rooms**: eight main English rooms still have no approved Russian or Hebrew translations.

**Release decision:** The existing visual presentation is technically stable in the tested environments. This is an evidence-backed *review candidate*, not a public release authorization, an editorial-language approval, or a completed rights audit. Keep all changes on review until explicit approval.
