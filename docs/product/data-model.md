# Zapp MVP Data Model

This document describes the conceptual model first. Implementation details can be mapped to Prisma later.

## Core Entities

### BudgetYear

Represents a planning year.

Fields:
- `year`
- `createdAt`
- `updatedAt`

### Category

Represents a budget category such as income, fixed expense, service, subscription, debt, savings, or adjustment.

Fields:
- `id`
- `name`
- `type`
- `active`
- `order`

Possible types:
- `income`
- `expense`
- `debt`
- `service`
- `subscription`
- `savings`
- `adjustment`

### BudgetItem

Represents a planned line in the annual budget.

Fields:
- `id`
- `categoryId`
- `name`
- `recurrence`
- `active`
- `notes`

Possible recurrence values:
- `monthly`
- `one_time`
- `custom`

### BudgetAmount

Represents the planned amount for one item in one month.

Fields:
- `id`
- `budgetItemId`
- `year`
- `month`
- `plannedAmount`

### ActualEntry

Represents what really happened in one month.

Fields:
- `id`
- `budgetItemId`
- `year`
- `month`
- `actualAmount`
- `isPaid`
- `source`
- `notes`

Possible source values:
- `manual`
- `import`
- `automation`

### PurchaseSimulation

Represents a temporary what-if scenario.

Fields:
- `id`
- `name`
- `amount`
- `paymentType`
- `installments`
- `startMonth`
- `year`
- `createdAt`

## MVP Relationships

- A `Category` has many `BudgetItem`.
- A `BudgetItem` has many `BudgetAmount`.
- A `BudgetItem` has many `ActualEntry`.
- A `PurchaseSimulation` does not affect real budget totals unless explicitly converted into planned expenses.

## Design Notes

- Store monthly amounts as rows, not as 12 fixed columns, unless there is a strong reporting reason.
- Keep planned and actual values separate.
- Keep imports separate from confirmed actual entries until the user confirms them.
- Do not make automation the source of truth. The confirmed budget should be the source of truth.
