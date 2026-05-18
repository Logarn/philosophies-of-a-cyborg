# Editorial Workflow

## Summary

Publishing should be boring in the best way: write content, set metadata, preview
locally, publish. No clicking through a CMS labyrinth. No fragile ritual where
one missing YAML field detonates the archive like a Victorian boiler.

## Authoring Format

Use file-based content for V1:

- Markdown or MDX files in a content directory.
- Frontmatter for metadata.
- Local validation before build.
- Git history as the editorial audit trail.

Recommended directories:

~~~text
content/
  essays/
  notes/
  links/
  series/
~~~

## Required Validation

The build should fail for:

- Missing title.
- Missing slug.
- Invalid status.
- Published post without `publishedAt`.
- Duplicate slug.
- Unknown topic.
- Series item missing order when assigned to a series.

The build should warn for:

- Missing summary.
- Missing social description.
- Very long title.
- Missing topic.
- Broken internal links.

## Editorial States

- `draft`: local only.
- `published`: visible publicly.
- `archived`: hidden from primary listings but URL remains stable.

## Preview Workflow

Commands should eventually support:

~~~bash
npm run dev
npm run validate:content
npm run build
~~~

## Acceptance Criteria

- Logarn can create a new post from a template in under a minute.
- Invalid frontmatter fails before deployment.
- Draft content cannot leak into public feeds or listings.
- A post can be updated while preserving canonical URL and showing updated date.

