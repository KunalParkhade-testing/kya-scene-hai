# Archive, Crawl, and Editorial Studio Improvements

## Overview

This change set addresses several maintenance and correctness issues found during a project review. It preserves original publication dates when an existing story is edited, avoids starting an additional Supabase auth request inside an auth-state callback, reports sitemap data failures, adds paging to growing story lists, and makes the configured lint command work with the installed Next.js and ESLint versions.

No database migration or environment-variable change is required.

## Changes

### Editorial publication dates

- Existing stories load their stored `published_at` into the editor.
- Saving an already published story retains that date instead of making the edit appear to be a new publication.
- A story first published from draft receives the current timestamp.
- Saving as draft or archived keeps the existing publication timestamp if the story had one. New drafts remain without a publication date.

### Supabase auth-state handling

- The auth-state listener uses the session supplied by Supabase to update the displayed user.
- Editorial content loading is deferred until after the auth callback returns; the callback no longer invokes an auth request through `getUser()`.
- Initial signed-in content loading continues to happen when the auth event supplies the session.
- Errors returned by the article/category list queries are shown in the editorial studio rather than silently presenting empty lists.

### Sitemap reliability

- The sitemap is generated dynamically because it reads request-backed Supabase cookies.
- Published article URLs are read in stable batches of 1,000, avoiding the Data API's default row limit as the archive grows.
- Article `lastModified` continues to use the stored `updated_at` or `published_at`; static page timestamps are not fabricated.
- A query or generation failure is logged, and the sitemap still includes its static routes and any article routes collected before the failure.

### Archive and topic pagination

- `/articles` and `/topics` display up to 20 stories per page.
- Both lists default to newest-first and offer an oldest-first sort control.
- The database applies the topic filter and pagination before returning rows; it no longer needs to fetch the entire published archive to filter topics in application memory.
- Stable secondary slug ordering prevents stories with the same publication timestamp from shifting unpredictably between pages.
- Previous/next navigation appears when there is more than one page.
- Topic filters and the selected sort order are preserved when navigating between pages; changing the sort starts at page 1.
- Canonical and Open Graph URLs reflect page, topic, and non-default sort parameters.
- Requests for pages beyond the current result set redirect to the last valid page (or the unpaged route when there are no results).

### Lint and related code-quality fixes

- `npm run lint` now calls ESLint directly and uses the Next.js Core Web Vitals and TypeScript flat configs.
- Existing lint errors encountered while enabling the command were corrected, including unescaped apostrophes, internal anchors that should use Next.js `Link`, unsafe `any` content-block handling, and a render-time mutable accumulator in code highlighting.
- Article and editorial-studio images use Next.js `Image` with explicit dimensions. They remain unoptimized because article image URLs can be entered from external sources, while the existing styling, lazy loading, and accepted URL behavior are preserved.
- The unused CodeMirror node-view parameter was removed.

## Visual changes to check

1. **Archive:** Open `/articles`. The existing title, story-card design, and footer should remain; when there are more than 20 published stories, a pager appears below the cards. Use **Older stories** and **Newer stories** to check navigation.
2. **Topic filter:** Open `/topics`, choose a topic chip, and verify only stories in that topic are shown. With more than 20 stories in that topic, the pager should keep the selected topic while moving between pages.
3. **Sort order:** On both list pages, change the control to **Oldest first** and apply. Confirm stories are ordered from oldest to newest, the URL includes `sort=oldest`, and the page resets to 1. Switch back to **Newest first** and confirm newest-first is restored.
4. **Topic + sort:** On `/topics`, select a topic, choose **Oldest first**, then page forward/back if pagination is available. The topic and sort order should persist.
5. **End-of-list behavior:** Request an out-of-range URL such as `/articles?page=999` or `/topics?topic=systems&page=999`. It should redirect to the last valid page.
6. **Editorial Studio:** Edit a published story, change a field, save it, and confirm its published date remains unchanged in storage. Change a draft to published and confirm it receives a publication date. Check the visible success/error message if editorial data fails to load.
7. **Error and navigation links:** Check the header and global error screen links navigate normally using app routing.

The pager is intentionally absent when there are 20 or fewer matching stories. In that case, validate it with a test dataset containing more than 20 published articles.

## Validation performed

- `npm run build` — passed.
- `npm run lint` — passed with no warnings.
- Production-server smoke checks — `/articles`, `/topics`, topic-filtered pages, and `/sitemap.xml` returned HTTP 200; out-of-range pagination returned redirects.
- `git diff --check` — passed.
