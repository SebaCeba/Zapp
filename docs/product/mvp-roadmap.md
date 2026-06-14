# Zapp MVP Roadmap

## Phase 0: Product Foundation

Goal: Agree on what Zapp is before rewriting code.

Deliverables:
- Product definition
- User stories
- Conceptual data model
- MVP scope

Done when:
- The first version can be described clearly in one paragraph.
- The first user flow is known.
- The first data model is stable enough to implement.

## Phase 1: Manual Annual Budget

Goal: Build the core manual planning workflow.

Scope:
- Select year.
- Create categories.
- Create budget items.
- Enter planned amounts by month.
- Show monthly and annual totals.

Out of scope:
- Gmail sync.
- Tenpo automation.
- Advanced charts.
- Multi-user auth.

Done when:
- The user can create a full annual budget manually.
- The system shows monthly income, expenses, balance, and annual totals.

## Phase 2: Monthly Actual Tracking

Goal: Compare planned budget against real execution.

Scope:
- Enter actual amounts.
- Mark items as paid.
- Show planned vs actual by month.
- Show category differences.

Done when:
- The user can answer: "How did this month go compared with the plan?"

## Phase 3: Decision Support

Goal: Help decide before spending.

Scope:
- Large purchase simulation.
- Monthly impact view.
- Warning for months with negative balance.
- Simple income distribution suggestions.

Done when:
- The user can evaluate a purchase before making it.

## Phase 4: Automation

Goal: Reduce manual entry after the manual workflow is reliable.

Scope:
- Import preview.
- Confirm before saving.
- Source tracking.
- Category matching.

Done when:
- Imported data can be reviewed and confirmed without corrupting the budget.

## Recommended First Build Slice

Build only this first:

1. Categories
2. Budget items
3. Planned monthly amounts
4. Annual budget table
5. Monthly summary

This should become the stable foundation before reintroducing Tenpo, Gmail, or mortgage-specific modules.
