# Zapp MVP User Stories

## Epic 1: Annual Budget

### Story 1.1: Create Annual Budget

As a user, I want to create a budget for a full year, so that I can understand my expected financial position month by month.

Acceptance criteria:
- Given a selected year, when I open the budget view, then I can see the 12 months of that year.
- Given income and expenses, when I enter monthly amounts, then the monthly and annual totals update.
- Given a category with no value, when the budget is displayed, then it should show zero instead of failing.

### Story 1.2: Manage Income

As a user, I want to define recurring and occasional income, so that my annual plan reflects the money I expect to receive.

Acceptance criteria:
- Given a recurring income, when I add it, then it appears across the relevant months.
- Given a one-time income or bonus, when I add it, then it appears only in its selected month or distribution.
- Given a change in income, when I update a month, then the yearly summary updates.

### Story 1.3: Manage Planned Expenses

As a user, I want to define planned expenses by category, so that I can see my expected commitments before spending.

Acceptance criteria:
- Given a planned expense, when I add it, then it appears in the annual budget.
- Given an expense that varies by month, when I edit one month, then only that month changes.
- Given a disabled category, when I view the budget, then it should not affect totals.

## Epic 2: Monthly Tracking

### Story 2.1: Track Actual Spending

As a user, I want to register actual monthly amounts, so that I can compare reality against my plan.

Acceptance criteria:
- Given a budget line, when I enter the actual amount, then the system saves it for that month.
- Given an actual amount, when it differs from the plan, then the difference is shown.
- Given a paid item, when I mark it as paid, then the monthly status updates.

### Story 2.2: Monthly Summary

As a user, I want to see each month's income, expenses, balance, and execution status, so that I know if I am on track.

Acceptance criteria:
- Given a month, when I open its summary, then I can see planned income, planned expenses, actual income, actual expenses, and balance.
- Given categories with differences, when I view the summary, then over-budget categories are easy to identify.

## Epic 3: Decision Support

### Story 3.1: Large Purchase Simulation

As a user, I want to simulate a large purchase, so that I can see its monthly impact before committing.

Acceptance criteria:
- Given a purchase amount and payment method, when I simulate it, then I can see the impact by month.
- Given a simulation that creates a negative month, when I review it, then the risky months are highlighted.
- Given a simulation, when I discard it, then it does not affect the real budget.

### Story 3.2: Income Distribution

As a user, I want recommendations for distributing income, so that I can decide how much to spend, save, or reserve.

Acceptance criteria:
- Given monthly income and commitments, when I view recommendations, then I can see available money after fixed expenses.
- Given savings goals, when income is available, then suggested savings are shown separately from spendable money.

## Epic 4: Automation Later

### Story 4.1: Import Transactions

As a user, I want to import or sync reliable transaction data, so that I reduce manual entry.

Acceptance criteria:
- Given imported data, when it is parsed, then I can preview it before saving.
- Given imported data with uncertain matches, when I review it, then I can correct categories before confirming.
- Given an import, when I cancel it, then no records are changed.
