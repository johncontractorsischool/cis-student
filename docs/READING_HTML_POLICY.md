# Reading content HTML policy

Reading course bodies are authored and stored by the Contractors Intelligence School backend. The web application treats that source as trusted editorial content, but still sanitizes every body on the server before returning it to the browser.

The allowlist is implemented in `src/lib/reading/normalize.ts` and follows these rules:

- Permit standard text, headings, lists, tables, figures, images, links, and embedded frames needed by existing course material.
- Permit only `http`, `https`, `mailto`, and `tel` URLs; images may also use data URLs.
- Remove scripts, form controls, event-handler attributes, and attributes not explicitly allowed.
- Restrict inline styles to a small formatting allowlist.
- Add `noopener noreferrer` to links that open a new tab.
- Add lazy loading and a sandbox to embedded frames.
- Add lazy loading to images.

This policy is intentionally applied in the authenticated server data layer. The reader renders only the resulting sanitized HTML and never exposes the API bearer token in course content URLs.
