# Information Architecture

## Summary

The archive needs simple, durable structure: multiple content types, topic pages,
series pages, and chronological browsing. The IA should make the site feel broad
without making the user think they walked into a filing cabinet designed by a
sleep-deprived tax demon.

## Primary Routes

- `/` - home, latest work, featured essays, topic entry points.
- `/writing` - all public writing, filterable by type/topic.
- `/essays` - polished long-form pieces.
- `/notes` - shorter entries and fragments.
- `/links` - annotated links.
- `/series` - all series.
- `/series/[slug]` - ordered series landing page.
- `/topics` - topic index.
- `/topics/[slug]` - topic page with featured and chronological entries.
- `/archive` - dense chronological archive.
- `/about` - identity, intent, contact/social links.
- `/feed.xml` - RSS.

## Content Model

Each post should support:

- `title`
- `slug`
- `type`: `essay`, `note`, `link`, or `experiment`
- `summary`
- `publishedAt`
- `updatedAt`
- `status`: `draft`, `published`, `archived`
- `topics`
- `series`
- `seriesOrder`
- `canonicalUrl`
- `externalUrl` for link posts
- `heroImage` optional
- `socialImage` optional
- `readingTime`
- `featured`
- `description` for SEO/social metadata

## Navigation Model

Global navigation should be small:

- Writing
- Topics
- Series
- Archive
- About

Home page modules:

- Featured essay or current thesis.
- Latest essays.
- Latest notes.
- Topic clusters.
- Series in progress.

## Acceptance Criteria

- Every published item has exactly one canonical URL.
- Drafts are excluded from public listing, RSS, sitemap, and search index.
- Topic pages show title, description, featured entries, and latest entries.
- Series pages preserve explicit order, not only date order.
- Archive page is usable after hundreds of posts.

