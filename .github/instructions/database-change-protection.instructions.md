---
description: "Use when a task touches database schema, persistence, migrations, models, Prisma, SQL, or data structures. Forces review of the current data model before changing it, protects base tables, and prefers auxiliary tables over breaking core operational tables."
applyTo:
  - "**/prisma/**/*.prisma"
  - "**/prisma/**/*.sql"
  - "**/db/**/*.sql"
  - "**/src/**/*.ts"
  - "**/src/**/*.js"
  - "**/api/**/*.ts"
  - "**/api/**/*.js"
  - "**/server/**/*.ts"
  - "**/server/**/*.js"
  - "**/models/**/*.ts"
  - "**/models/**/*.js"
  - "**/repositories/**/*.ts"
  - "**/repositories/**/*.js"
  - "**/services/**/*.ts"
  - "**/services/**/*.js"
---

# Database Change Protection Rule (MANDATORY)

## 1. Check the model first

Before proposing or implementing any database change, ALWAYS inspect the current model and identify:

- base/core tables
- auxiliary/support tables
- existing relationships
- fields already used by UI, API, services, calculations, or integrations
- whether the requested need can be solved without modifying a base table

Do not assume the model. Read the real schema first.

---

## 2. Base tables are protected

Core operational tables are considered **protected**.

For this project, the intention is that the main model stays simple and stable, especially around:
- `Presupuesto`
- `Actual`

If a requested change could:
- alter the structure of a base table
- break compatibility with current views
- force migration of core data
- change the meaning of existing fields
- duplicate core logic in a conflicting way

then STOP and consult first.

You must not change protected tables directly unless the need truly cannot be solved another way.

---

## 3. Prefer auxiliary tables first

Before modifying a base table, evaluate whether the requirement can be solved with one of these patterns:

- auxiliary table linked by foreign key or logical key
- raw/import table
- staging table
- config table
- mapping table
- override table
- metadata table
- cache/materialized support structure
- derived/calculated table

Default decision:
- **new operational need around source, import, connector, traceability, metadata, or calculation = auxiliary table**
- **only change a base table if the operational model itself truly changed**

---

## 4. Mandatory impact check

If the task affects database structure, explicitly answer these questions before coding:

1. What base table(s) are touched?
2. What current flows depend on them?
3. Can this be solved with an auxiliary table instead?
4. What would break if the base table changes?
5. Is backward compatibility preserved?

If any answer suggests risk over core tables, do not implement blindly.

---

## 5. Escalation rule

If the change may break or reshape core/base tables, respond with a warning and ask for confirmation before proceeding.

Use this format:

- Current model affected:
- Risk detected:
- Why this may break a base table:
- Auxiliary-table alternative:
- Recommended option:

Then wait for confirmation.

---

## 6. Safe implementation principle

When implementation is allowed:

- preserve current base-table contracts
- avoid renaming or deleting core fields unless explicitly approved
- prefer additive changes over destructive changes
- isolate new logic in auxiliary structures
- keep migrations reversible where possible
- document the reason for the schema decision
- **ALWAYS update the ER diagram in `docs/DATABASE_MODEL.md` to reflect schema changes**

---

## 7. Documentation requirement

Any schema change (new table, new field, relationship modification, etc.) MUST be reflected in the Mermaid ER diagram located at `docs/DATABASE_MODEL.md`.

Steps:
1. Read the current diagram from `docs/DATABASE_MODEL.md`
2. Identify the affected entities
3. Update the Mermaid syntax to reflect the new schema
4. Ensure relationships are accurate
5. Maintain the existing diagram structure and formatting

If the change is significant, add a brief note in the document explaining the rationale.

---

## 8. Forbidden behavior

- Do not redesign the whole schema if the task is local
- Do not modify base tables just because it seems cleaner technically
- Do not merge source/raw/import concerns into core operational tables
- Do not assume a migration is safe without checking actual usage in repo
- Do not break `Presupuesto` / `Actual` model simplicity

---

## 9. Expected response style when DB is involved

Before coding, first return:

- files/schema reviewed
- base tables detected
- auxiliary tables detected
- decision: base table change vs auxiliary table
- risk note if applicable
- confirmation that `docs/DATABASE_MODEL.md` will be updated

Only then propose implementation.

---

## 10. Decision heuristic

Use this rule of thumb:

- If the feature changes **how the business operates in the main screens**, it may justify reviewing a base table.
- If the feature changes **how data is obtained, imported, traced, configured, or enriched**, solve it with auxiliary tables.

When in doubt, protect the base model and consult.
