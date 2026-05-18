# Discovery And Navigation

## Summary

Discovery should help readers follow ideas across time. The site needs search,
topic browsing, related reading, and series navigation without turning every page
into a dashboard control panel from hell.

## Search

V1 search should support:

- Title search.
- Summary/body search.
- Topic filtering.
- Type filtering.
- Keyboard-friendly input.
- Empty state and no-results state.

Implementation can start with a static generated search index. Server search can
come later if the archive outgrows static search.

## Related Reading

Related reading can be computed from:

- Shared topics.
- Same series.
- Explicit frontmatter references.
- Recency fallback.

Manual overrides should be supported because taste beats algorithm soup.

## Archive

The archive page should prioritize scanning:

- Group by year.
- Show date, type, title, and short topic list.
- Keep density high but readable.

## Topic Pages

Topic pages should include:

- Topic name.
- Short description.
- Featured entries.
- Latest entries.
- Related topics.

## Acceptance Criteria

- A reader can find an older essay by keyword.
- A reader can move from an essay to its topic and series.
- A reader can scan the full archive without pagination for the first reasonable
  archive size.
- Search and filtering remain fast on mobile.

