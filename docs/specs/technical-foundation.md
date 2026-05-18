# Technical Foundation

## Summary

The technical foundation should optimize for fast static delivery, excellent
content ergonomics, and future extensibility. The first implementation should be
boring where boring is good: typed content, predictable routes, automated checks,
and deployment that does not require sacrificing a goat to a YAML file.

## Recommended Stack

Use a modern static-capable framework. Strong candidates:

- Astro for content-heavy publishing with islands.
- Next.js if richer app features are expected soon.

Recommendation for V1: **Astro** unless there is a known reason to need a
heavier React app from day one.

## Required Capabilities

- File-based Markdown/MDX content.
- Typed frontmatter schema.
- Static route generation.
- RSS feed.
- Sitemap.
- Open Graph metadata.
- Generated search index.
- Syntax highlighting.
- Image optimization.
- Content validation in CI/build.

## Performance Targets

- Static article pages.
- Minimal client JavaScript on prose pages.
- Stable layout with explicit image dimensions.
- No render-blocking decorative payloads.

## Accessibility Targets

- Semantic headings.
- Keyboard navigation.
- Visible focus states.
- Sufficient contrast.
- Reduced-motion respect for any animation.
- Screen-reader sensible labels for nav/search controls.

## Future Extensions

Do not build these in V1, but avoid blocking them:

- AI archive chat.
- Newsletter integration.
- Public notes graph.
- Interactive essays.
- Private drafts/review workflow.
- Voice/audio versions.

## Acceptance Criteria

- `dev`, `build`, and content validation commands are documented.
- A representative article page is statically generated.
- RSS and sitemap include published content only.
- Search index excludes drafts.
- CI can catch content schema errors before deploy.

