# Homepage Editorial Experience: Future Update

This is a proposal for a future homepage design update, not an implementation plan with an agreed scope or a statement that the work is scheduled. It records the requested visual and interaction ideas alongside the current homepage behavior so future work can build on what is already in place.

## Current state

The homepage is data-driven: the featured story, latest stories, categories, and featured series come from published content rather than being fixed to particular article titles.

- **Featured story and story cards:** The featured story already has a visual area. It displays the story's hero image when available, or a colored text illustration using its hero text/title as a fallback. Latest-scene cards also have colored covers and display hero images when available. The opportunity is to make these visuals reliably editorial and topic-specific, rather than to add image containers from scratch.
- **Curiosity loop:** “BUT WHY?”, “ACCHA, AISA KYUN?” and “AB SCENE SAMAJH AAYA.” currently appear as static speech bubbles in the hero artwork.
- **Secondary CTA:** “Start with a question →” already links to `#topics`. The document-level smooth-scroll behavior is enabled.
- **Topics:** Six topic tiles are currently shown with published-story counts. This includes categories that can have a count of zero.
- **Section styling and type:** Sections use prominent borders, and the general interface uses an Arial/Helvetica sans-serif stack. Article prose uses Georgia.
- **Dark mode:** A theme toggle and persisted dark theme already exist. The site uses a charcoal background (`#191b21`) with warm off-white text (`#f4f0e8`), though some dark surfaces use a deeper near-black.
- **Newsletter:** The homepage already embeds an email input and Subscribe button in a single-line form, with success and error messages. This is not a missing feature.

## Future update ideas

### 1. Make visual storytelling a defining feature

- Commission or create a distinct editorial illustration, diagram, chart, or collage for the featured story. Give it enough prominence to sit alongside and complement the headline and summary. For *“Who Guards the Guardians?”*, for example, the visual could explain a relationship, process, or power structure rather than simply decorate the story.
- Give each latest-story card a topic-specific 16:9 image or abstract cover so readers can scan the subject before reading the title. Retain the existing image and fallback-cover behavior when editorial artwork is not available.
- Treat Vox and The Pudding as inspiration for clarity and visual explanation, not as templates to copy. Visuals should be accurate, purposeful, captioned or described where appropriate, and useful on small screens.

### 2. Turn the curiosity loop into a story preview

Explore replacing or augmenting the static speech bubbles with a small three-step preview of the publication's explainer approach:

1. **The question** — “BUT WHY?”
2. **The system behind it** — “ACCHA, AISA KYUN?”
3. **The visual takeaway** — “AB SCENE SAMAJH AAYA.”

The experience could use a step-slider or progress bar, but should communicate the sequence without requiring interaction. If interactive, make each step usable by keyboard and assistive technology, provide a visible active state, support reduced-motion preferences, and keep the interaction understandable on touch screens.

Keep “Explore the stories →” as the primary action. The existing “Start with a question →” destination is already purposeful; retain its topic-section target and verify that it remains discoverable and scrolls smoothly. A curated random deep-dive could be considered later as an alternative, not added alongside the current behavior without a clear reason.

### 3. Present active and upcoming topics intentionally

- Lead with topics that have published stories, currently including Systems, Economics, and Culture where their counts are nonzero.
- Avoid presenting a bare “0 stories” count as if it were useful navigation. Consider labeling empty categories “Upcoming” or “In the lab,” grouping them under a discreet “Future rabbit holes” disclosure, or offering a “Pitch a question” route if a question-submission workflow exists.
- Keep the story-count source tied to published content so topic visibility updates as the catalogue grows. Do not send readers to an empty destination without setting expectations.
- Decide whether upcoming topics should be hidden, disclosed, or accept pitches before implementation; each option has a different product and content-maintenance implication.

### 4. Refine hierarchy, dividers, type, and dark mode

- Consider reducing heavy section rules to 1px hairlines and using consistent grid lines to distinguish the featured story, latest scenes, and series area. Preserve sufficient contrast and avoid adding shadows or card chrome simply to create separation.
- Explore pairing a distinctive serif or geometric display face for the site title and story headlines with a highly legible sans-serif for body copy and metadata. Check font licensing, loading performance, language coverage, and fallback behavior before selecting a face.
- Keep the existing warm charcoal and off-white dark-mode direction. Review all surfaces and text—not just the page background—for consistency and contrast; in particular, assess whether the newsletter's deeper dark surface should remain distinct or align with the rest of the site.
- Treat the proposed `#121212`/`#161618` and `#EAEAEA` values as reference points, not required replacements for the palette already in place.

### 5. Preserve and polish the inline newsletter form

The homepage already has the requested one-step email input and Subscribe button. Do not replace it or add a second signup flow. In a future visual pass, refine its spacing, responsive behavior, focus treatment, and success/error feedback while preserving email validation and the existing submission flow.

## Suggested sequencing

1. Establish an editorial art direction and trial it on the featured story and a small set of latest cards.
2. Improve empty-topic presentation and decide whether question submissions are in scope.
3. Prototype the curiosity-loop preview and validate that it clarifies the editorial method without distracting from the hero.
4. Tune dividers and headline/body typography as one coherent design pass.
5. Review dark-mode surfaces, mobile layouts, keyboard use, contrast, and reduced-motion behavior across the updated homepage.
6. Preserve the current CTA destination and newsletter form unless a separate product decision changes either flow.

## Future acceptance checks

- Featured and latest-story visuals have a consistent editorial role, remain legible at narrow widths, and have appropriate alternative text or decorative-image treatment.
- Topic navigation does not foreground unexplained zero counts; any upcoming-topic or pitch destination clearly sets expectations.
- The curiosity sequence makes sense without animation or interaction and is accessible if interactive.
- Section separation and typography improve hierarchy without reducing readability or changing the publication's recognizable visual identity unintentionally.
- Dark and light themes retain readable contrast and consistent component states.
- The existing topic CTA still reaches the topic section, and the inline newsletter form still submits and communicates success or failure.
