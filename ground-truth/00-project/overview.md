# Bakumon - project overview

## What this is

A public website for the Bakumon Minecraft server, which runs the Cobblemon mod. Two
things in one site:

- a **landing page** that explains the server and points people at Discord
- a **wiki** covering the Pokemon that spawn on this server and the items that exist in it

## Where the server details live

**Discord invite: https://discord.gg/MWGFKmw6pm**

That is the whole of the server contact information, deliberately. The landing page does
not publish a server address, Java/Bedrock support, Minecraft or Cobblemon versions, a
modpack link or join instructions - all of that lives in Discord, where it can change
without a site deploy going stale. Decided 2026-09-17.

The practical consequence for the landing page: the Discord CTA is its single call to
action, not one option among several.

## Why it is not just a copy of the Cobblemon wiki

The spawn data is **this server's configuration**, not the mod's defaults. The workbook
that backs the site describes how Bakumon has rebalanced spawning, and that is the thing
players cannot get anywhere else:

- an `ultra-rare` tier that the base mod does not have, covering selected starter lines,
  pseudo-legendary final evolutions and other deliberately scarce Pokemon
- legendaries removed from natural spawning entirely and moved to Pebble Spawn Events.
  The workbook records these as gated on 25 players online; that gate was turned off
  before launch and the workbook has not been re-exported - see `01-data/server-notes.md`
- third-party biomes in the spawn tables (`aether`, `the_bumblezone`, `biomesoplenty`,
  `byg`), which tells you the modpack this server runs

See `ground-truth/01-data/server-notes.md` for the server's own description of its tiers,
transcribed from the workbook.

## Scope

**In v1**: browsing and searching Pokemon spawns and items. No accounts, no login, no
user-generated content, no comments. That keeps the personal-data surface at essentially
nothing, which the legal pages then get to say honestly.

**Explicitly out**: anything requiring a user table.

## Current state

| Area | State |
|---|---|
| Workbook audit | built; regenerates the audit report, asserts nothing |
| Database schema and migration runner | built |
| Workbook import and validation | built, 26 of 26 checks passing |
| Asset mining | built |
| REST API | built, 58 smoke assertions passing; connects as a SELECT-only role |
| React frontend | done - landing, wiki, both legal pages (ADR 0009); needs screenshots |
| Deployment | not started; Postgres on the Hostinger VPS, ADR 0005 |

## Affiliation

Bakumon is not affiliated with Cobblemon, The Pokemon Company, Nintendo, or Mojang.
Artwork and text sourced from elsewhere carries attribution; see
`ground-truth/02-assets/attribution.md`.
