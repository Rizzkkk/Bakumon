# 0007 - No analytics, and therefore no cookies

- **Status**: accepted
- **Date**: 2026-09-17

## Context

`architecture.md` section 1 lists a `CookieBanner.jsx` and a `CookiePreferences.jsx` page,
and section 6 says "don't call any analytics before consent is given". Both assume
analytics will exist.

The site has no accounts, no sessions and no server-side state per visitor. The only
third-party thing on it is an outbound Discord link, which sets nothing.

## Decision

No analytics, no tracking pixels, no third-party embeds. The site sets **no cookies at
all**.

## Consequences

- No consent banner is legally required in most regimes, because a consent banner exists
  to gather consent for non-essential cookies and there are none. `CookieBanner.jsx` and
  `CookiePreferences.jsx` are **not built**, and the `/cookie-preferences` route from
  `architecture.md` section 6 is dropped.
- The privacy page can state plainly that nothing is collected, which is a much shorter
  and more honest page than one describing an analytics vendor.
- The API's request log records method, path, status and duration, and writes the query
  string only on 4xx/5xx. Logging an error to diagnose it is not tracking, but there is
  no reason to retain what every visitor searched for.
- **Adding analytics later falsifies the published privacy page.** It therefore needs a
  superseding ADR and a matching rewrite of that page in the same pass, not a quiet
  script tag.
