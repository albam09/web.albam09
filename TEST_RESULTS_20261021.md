# albam09 2026-10-21 v4 — Verification report

## Source
`albam09_full_20261021_v3.zip` plus narrow changes to 18 existing files and 4 new files. No prior tables, row data, auth secrets or Netlify settings modified.

## Tests executed
- JS syntax: all 30 site JS/Node scripts passed `node --check`.
- Menu: each `/explore/karaoke1/` through `/explore/karaoke8/` contains static `/bubble-alba/` link; detail page has link, too.
- Design: headless Chromium DOM render with CSS (without server navigation, which was blocked by execution environment) at 1440px and 390px. Both viewport widths have zero horizontal overflow.
- Kakao paste: secure renderer converts both `[image](https://item.kakaocdn.net/...)` and a bare Kakao CDN image URL to `img`, and HTML/script input is escaped. A Chromium DOM injection test passed.
- Build: mocked public Alba post + approved comment generated static HTML with image content and preserved explorer build process. Test passes; no actual Supabase production writes were performed.
- Existing `bubble-alba` post and explorer editing have no database-schema changes.

## Deployment/verification limitations
- Production credentials and sessions not available, so actual Supabase Storage upload permissions, comment approval, and live Netlify deployment must be checked after deployment.
- Headless Chromium local HTTP navigation was blocked with `ERR_BLOCKED_BY_ADMINISTRATOR`. DOM-based visual checks were performed instead.
- Third-party Kakao CDN can block remote image embedding or expire links. Image clipboard paste in authenticated authoring is more reliable; animated stickers pasted as files may lose animation depending on clipboard format.
- Guest comments accept image URL or Kakao image links and require moderation; binary file upload from anonymous users is deliberately disabled to prevent abuse.
