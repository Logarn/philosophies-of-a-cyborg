# Reading Experience

## Summary

The reading experience is the flagship feature. Long-form pages must feel calm,
premium, and sharp: excellent typography, stable layout, strong rhythm, useful
metadata, and no visual nonsense stampeding across the sentence the reader is
trying to finish.

## Page Anatomy

Essay pages:

- Title.
- Dek/summary.
- Published and updated dates.
- Reading time.
- Topic chips.
- Optional series context.
- Optional table of contents.
- Article body.
- Footnotes/references.
- Related reading.
- Previous/next within series when relevant.

Notes:

- Smaller title treatment.
- Date and topics.
- Body optimized for shorter reading.
- Related links if relevant.

Link posts:

- External title and URL.
- Ositu Kengere's annotation.
- Source domain.
- Date and topics.

## Typography Requirements

- Comfortable measure for prose: roughly 65-78 characters per line.
- Distinct styles for headings, blockquotes, code, lists, footnotes, and callouts.
- Mobile typography must avoid cramped line height and oversized headings.
- No viewport-width font scaling.
- No text overlap under long titles, long URLs, or code blocks.

## Interaction Requirements

- Copy link to heading anchors.
- Keyboard-accessible focus states.
- Table of contents highlights current section when feasible.
- Code blocks support horizontal scrolling and optional copy.
- Footnotes are readable without disorienting jumps.

## Empty and Edge States

- Posts without hero images still look intentional.
- Very short notes do not look broken or underfilled.
- Very long essays remain navigable.
- Long words, URLs, and code do not break layout.

## Acceptance Criteria

- A 3,000-word essay is comfortable on mobile and desktop.
- Headings and paragraphs never overlap or overflow containers.
- Code blocks do not widen the page.
- The page remains useful with JavaScript disabled except progressive features.
- Lighthouse accessibility and performance are in the green for representative
  article pages.
