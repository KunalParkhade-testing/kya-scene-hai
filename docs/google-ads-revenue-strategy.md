# Google Ads Revenue Strategy

## Purpose and status

This document explores how Kya Scene Hai? could earn display-ad revenue—primarily through Google AdSense—without interrupting or weakening the reading experience. It is a strategy proposal, not an implementation plan, an application for AdSense, or a promise of revenue.

The aim is for ads to be **visible as advertising, unobtrusive, and outside the reader's way**. Ads should never be blended into editorial content or made difficult to distinguish from it.

## Priority and sequencing

The immediate priority remains establishing the site's identity in Google Search: the correct publication name instead of “Vercel” and the intended site icon instead of a generic globe. Ad implementation will not fix or guarantee those search-result changes.

Recommended sequence:

1. Continue addressing and monitoring the Google site-name and favicon issue.
2. Build a steady body of original, useful articles and understand readership through privacy-conscious analytics.
3. Review Google's current AdSense eligibility, publisher, consent, and ad-format requirements for the site's location and audience.
4. Decide whether the likely revenue is worth the reader, performance, privacy, and maintenance costs.
5. If the decision is yes, apply and test a tightly controlled placement on a limited set of pages before expanding.

There is no need to add ads simply because they are technically possible. Google controls account approval and search-result display behavior, and ad revenue depends on many factors outside the site's control.

## Product principles

- **Reading comes first.** Never place an ad before the article title or in the article body.
- **Clearly label advertising.** A reader should not mistake a paid placement for reporting, a recommendation, or a story card.
- **No interruption.** Avoid pop-ups, interstitials, overlays, sticky/floating ads, auto-playing audio/video, and formats that take over the screen.
- **Protect editorial trust.** Ads and ad revenue must not influence article conclusions, sourcing, corrections, or topic selection.
- **Protect privacy.** Use only the data collection and ad personalization practices the publication can clearly explain and legally support.
- **Protect performance.** Ads must not cause major layout shifts, make pages substantially slower, or obscure content on mobile.
- **Keep access open.** Do not make essential explainers, sources, or corrections available only to paying readers.

## Proposed placement policy

### Article pages

Start with **at most one responsive display placement per article**, after the complete editorial experience: after the body and sources, and before optional related stories or a “Continue exploring” section. This puts the ad outside the reading flow and makes it less likely to interrupt a long explanation.

- Do not put ads above the headline, between paragraphs, inside the table of contents, among sources, or in the article hero.
- Do not insert ad slots into article body data or allow the editor to position ads as if they were content blocks.
- Give the slot a clear boundary and an “Advertisement” label where appropriate.
- If an ad does not load, collapse or gracefully handle the reserved space without leaving a large blank block.

### Archive and topic pages

Do not show ads in the first version of the archive or topic pages. If there is a strong reason to test them later, test one clearly separated placement between groups of story cards, never before the first story and never so frequently that it resembles editorial content.

### Other pages

- **Homepage:** Keep the homepage ad-free initially; it establishes the publication's identity and points readers into the work.
- **About, contact, correction, and policy pages:** Keep these ad-free.
- **Admin and API routes:** Never serve ads.

These are conservative starting rules, not ad-network defaults. Any expansion should be an explicit product decision based on reader experience and measured results.

## Formats to allow and avoid

### Consider

- A standard responsive display ad in the single, post-article position.
- A small number of clearly labeled placements that fit the existing visual style without imitating article cards.

### Avoid

- Auto ads that choose placements across the site without editorial control, at least during an initial test.
- Anchor, vignette, full-screen, pop-up, or interstitial formats.
- Sticky or floating formats that cover text or controls.
- Auto-playing video, audio, or animated creative likely to distract readers.
- Ad styling that copies the site's headline, card, byline, or source design.
- Excessively narrow targeting or third-party tracking that cannot be justified and explained.

Review the available controls and current Google policies before selecting formats; product names and controls may change.

## How a test could work

### Readiness checks

Before applying or adding ad code:

- Confirm the site has complete publication identity, contact, privacy, and editorial information appropriate to its operation.
- Review the current AdSense application and site-eligibility requirements; do not assume a particular traffic threshold or approval timeline.
- Review current Google Publisher Policies and AdSense terms, including prohibited content, invalid traffic, placement, and traffic-source rules.
- Decide what analytics and consent controls are needed for the actual audience locations and ad settings. Obtain qualified guidance if legal requirements are unclear.
- Decide how ad-related third-party scripts will be loaded, how failures are surfaced, and what changes are needed to security and performance controls.
- Ensure the publication can maintain ad disclosures, privacy disclosures, and any required publisher configuration files.

Requirements change, and obligations depend on geography, configuration, and audience. Verify them from current official Google documentation before launch; this document is not legal advice.

### Limited pilot

If the site is approved and ready:

1. Enable a single post-article placement on a small, representative set of published articles.
2. Keep automatic placements and all disruptive formats disabled.
3. Test narrow and wide screens, slow networks, blocked/unavailable ad responses, keyboard use, screen readers, and browser privacy settings.
4. Confirm the ad is clearly distinguished from editorial material and does not overlap or shift important controls.
5. Keep a simple way to disable ads without a code redeployment if practical.
6. Ask readers for feedback and compare the pilot against the ad-free experience before expanding.

### Expansion decision

Only consider adding an archive placement or increasing ad density if the pilot shows a meaningful benefit and does not harm the reading experience. Keep the no-ad policy for article bodies and overlays even if the pilot performs well.

## Revenue expectations and measurement

Do not assume AdSense will generate meaningful income at low traffic. Approval does not guarantee impressions or earnings, and actual revenue varies by audience, location, season, advertiser demand, viewability, content, and policy compliance.

A rough planning relationship is:

> Estimated ad revenue = eligible page views / 1,000 × realized page RPM

Use the site's actual eligible page views and actual reported RPM if available. Treat any forecast as uncertain, account for payment thresholds, currency, taxes, and service costs, and avoid using optimistic online examples as a budget.

Measure more than ad impressions and clicks:

- Revenue and page RPM, reviewed over a meaningful period.
- Article completion or another carefully chosen reading-quality signal.
- Core Web Vitals, especially layout stability and load performance.
- Reader feedback, complaints, and ad-related exits where measurement is privacy-appropriate.
- Ad fill and rendering errors, to ensure empty slots do not damage layout.

Clicks are not a success target to encourage. Never ask readers to click ads, click the site's own ads, generate artificial traffic, or use incentives that could produce invalid activity.

Set a removal or rollback condition before the pilot—for example, a material performance regression, repeated reader complaints, poor ad quality, or negligible revenue relative to the cost and distraction.

## Revenue and supporter plans

Google display ads can be one possible source of income for readers who do not contribute, but should not be the sole assumed business model. A voluntary supporter contribution may suit the publication better than adding more ad placements if the audience values the work.

If support plans are eventually offered:

- Keep core reporting, explainers, sources, and corrections open.
- Do not promise “ad-free” as a plan benefit until ads are actually deployed and the benefit can be reliably delivered.
- Consider whether supporters should see fewer or no ads, but make the rule clear and avoid using ads to punish free readers.
- Do not decide plan tiers or pricing as part of the initial ad pilot.

Ads, supporter options, and any future sponsorships should be treated as distinct revenue streams with clear disclosures. This strategy focuses on Google display ads; direct sponsorships are not the primary proposal here.

## Decisions still open

- Whether the site will apply for AdSense now or wait until readership and the Google Search identity issue are more settled.
- Whether the first pilot is limited to article endings or includes any later archive placement.
- Which ad personalization and consent settings are acceptable for the publication and its audience.
- Whether a future supporter plan would have a different ad experience.
- What performance, reader-feedback, and revenue thresholds justify continuing the pilot.

## Launch checklist

- [ ] Google Search site-name and favicon priority has been addressed or consciously deferred.
- [ ] Current AdSense eligibility and Google publisher policies have been checked.
- [ ] Privacy, consent, and disclosure requirements for the audience and ad configuration have been reviewed.
- [ ] Ad code is restricted to explicitly approved public routes and placements.
- [ ] Article body, title area, sources, homepage, About, admin, and API surfaces remain ad-free.
- [ ] Ads are labeled and visually distinct from editorial content.
- [ ] No overlays, interstitials, anchors, auto-play media, or uncontrolled automatic placements are enabled.
- [ ] Responsive layout, accessibility, performance, and failed-ad behavior have been tested.
- [ ] Revenue and reader-experience baselines and rollback criteria are defined.
- [ ] There is an owner for ongoing policy, creative-quality, privacy, and performance review.
