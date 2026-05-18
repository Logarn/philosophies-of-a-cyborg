# Implementation Plan

## Summary

This plan turns the specs into buildable slices. The goal is to avoid a majestic
planning cathedral that nobody can live in. Each phase should produce a working
site increment, not just more documents wearing little management hats.

## Phase 1: Foundation

Deliver:

- Choose and scaffold the framework.
- Add content directories.
- Define typed content schemas.
- Add sample essay, note, link, and series content.
- Add base layout, routing, and metadata helpers.
- Document dev, build, and validation commands.

Acceptance:

- The app runs locally.
- Published sample content renders.
- Draft sample content is excluded from public routes.
- Build fails for invalid required frontmatter.

## Phase 2: Core Reading And IA

Deliver:

- Essay page template.
- Note page template.
- Link page template.
- /writing, /essays, /notes, /links, /archive.
- Topic and series data models.
- Topic and series pages.

Acceptance:

- A long essay is readable on mobile and desktop.
- Archive groups posts by year.
- Topic pages and series pages render from content metadata.
- Each content item has one canonical URL.

## Phase 3: Discovery

Deliver:

- Static search index.
- Search UI with type/topic filters.
- Related reading component.
- Previous/next navigation for series.

Acceptance:

- Search finds posts by title and summary/body text.
- Filters can combine type and topic.
- Related reading has deterministic output and manual override support.
- Search index excludes drafts.

## Phase 4: Visual System

Deliver:

- Final typography scale.
- Color tokens.
- Header and mobile navigation.
- Post list/card variants.
- Article components: callouts, code blocks, footnotes, table of contents.
- Light mode, and dark mode if included in V1.

Acceptance:

- No clipped text or overlapping UI at mobile and desktop widths.
- Code blocks do not widen the page.
- Article body remains the visual priority.
- Palette avoids one-note generic sludge.

## Phase 5: Publishing And Metadata

Deliver:

- RSS feed.
- Sitemap.
- Open Graph and Twitter metadata.
- Social image defaults.
- Content validation script.
- Basic deployment notes.

Acceptance:

- RSS and sitemap include published content only.
- Every public page has title and description metadata.
- Representative pages pass accessibility and performance checks.
- Deployment build is reproducible from a clean checkout.

## Phase 6: Future Hooks

Do not build these unless V1 is already solid:

- Newsletter integration.
- AI archive chat.
- Interactive essays.
- Audio/voice versions.
- Private editorial review UI.

These should be designed as extensions, not baked into the first foundation like
wet concrete around the ankles.

