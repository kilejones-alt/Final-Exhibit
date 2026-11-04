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
