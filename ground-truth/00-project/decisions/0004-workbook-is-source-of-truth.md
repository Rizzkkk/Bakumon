# 0004 - The workbook is authoritative; scraped text is second-class

- **Status**: accepted
- **Date**: 2026-09-11

## Context

59% of items (548 of 932) have a blank description in the workbook, and 123 more are under
40 characters. The Cobblemon wiki can fill some of that gap.

But the workbook describes **this server**. The wiki describes the **mod**. Where they
disagree the workbook is right for our purposes, and a re-run of the miner must not be
able to overwrite it.

## Decision

- `items.description` holds the workbook value. Only the import writes it.
- `items.wiki_description` holds scraped text. Only the miner writes it.
- The two never merge in the database. Choosing what to display is the API's job, and the
  rule is: workbook value if present, scraped value otherwise, with the scraped case
  credited to the wiki in the UI.

## Consequences

- The miner is safely re-runnable. Losing scraped text costs one re-run; losing workbook
  text would need a re-import to recover.
- Both columns feed the search vector, so an item with only a scraped description is still
  findable.
- The UI must be able to show attribution per field, not just once in the footer, because
  a description sourced from the wiki is CC BY 4.0 content.
