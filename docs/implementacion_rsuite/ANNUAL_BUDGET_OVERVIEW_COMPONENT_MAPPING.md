# Zapp Financial Atelier - Component Mapping Analysis

**Date**: April 5, 2026  
**Purpose**: Complete component mapping for Financial Atelier design system  
**Reference**: Design system mockup folder (`stitch_zapp_visual_style/`)  
**Architecture**: Tailwind-first, custom components, no UI library dependencies

> **📝 Important**: This project has decided to **NOT use RSuite or other UI libraries**.  
> See [ui-mapping-decisions-zapp.md](../ui-mapping-decisions-zapp.md) for full architectural decisions.

---

## Executive Summary

This document analyzes **THREE complete mockup views** and defines the component architecture needed:

### Mockup Views Analyzed:
1. **Inicio** (Home/Dashboard) - `inicio_estilo_unificado/code.html`
2. **Presupuesto > Resumen** (Budget Overview) - `presupuesto_resumen_consolidado/code.html`
3. **Actual > Gastos** (Actual Tracking) - `actual_estilo_unificado/code.html`

### Architecture Approach:
- **Tailwind-first**: 90%+ styling via Tailwind utilities
- **Custom Components**: Built from scratch, no UI library
- **Primitives → Composed**: Clear separation of atomic and composite components
- **High Reusability**: Shared patterns extracted into `<boltDestination>components/primitives/</boltDestination>` and `components/ui/`

### Key Finding:
**100% net-new component architecture** needed to match Financial Atelier design system.  
Current components are **legacy** and will be gradually phased out.

---

## Design System Foundation

From `financial_atelier/DESIGN.md`:

### Colors (Tailwind Config Extension)
```js
// tailwind.config.js - extend.colors
{
  primary: '#175ab1',        // Navy blue - primary actions
  secondary: '#4c5e82',      // Muted blue - secondary elements
  tertiary: '#904900',       // Warm orange - accents
  'navy-dark': '#002948',    // Dark sidebar background
  cream: '#FDFCF9',          // Page background (warm)
  // ... plus full Material Design 3 palette from mockups
}
```

### Typography
- **Font**: Inter (weights 300, 400, 500, 600, 700, 800, 900)
- **Loading**: Google Fonts CDN or self-hosted
- **Classes**: `font-headline`, `font-body`, `font-label` (all Inter)
- **Tabular Numbers**: `tabular-nums` for all financial data

### Spacing & Layout
- **Base unit**: 4px (Tailwind default rem scale)
- **Common gaps**: `gap-2` (8px), `gap-4` (16px), `gap-6` (24px), `gap-8` (32px)
- **Card padding**: `p-6` (24px), `p-8` (32px)
- **Page padding**: `p-8` (32px)

### Border Radius
- **Small**: `rounded-lg` (8px) - buttons, inputs, badges
- **Medium**: `rounded-xl` (12px) - medium buttons
- **Large**: `rounded-[24px]` (24px) - cards, panels
- **Extra Large**: `rounded-[32px]` (32px) - hero cards
- **Full**: `rounded-full` - avatars, circular icons

### Shadows
- **Subtle**: `shadow-sm` - standard cards
- **Medium**: `shadow-md` - hover states
- **Large**: `shadow-lg` - elevated modals, primary CTAs
- **Custom**: `shadow-blue-900/10` - colored shadows for key elements

### Material Icons
- **Library**: Material Symbols Outlined (Google Fonts)
- **Weight**: 400 default, 100-700 available
- **Fill**: 0 (outline) or 1 (filled) via `font-variation-settings`
- **Size**: `text-[18px]`, `text-[20px]`, `text-[24px]`

---

## Current Project Status

### 🔴 Legacy Components (To Phase Out)
- `components/Toast.tsx` - **DEPRECATED** (marked for removal)
- All components using inline styles or scattered CSS
- Components tightly coupled to old color scheme

### ⚠️ Current Architecture Issues
1. **No dark sidebar** matching mockup (`#002948`)
2. **No rounded cards** (24px-32px radius)
3. **No Material Icons** integration
4. **No Tailwind** comprehensive usage
5. **Inconsistent** spacing/typography across views

### ✅ Opportunities to Leverage
- Existing component structure in `components/` folder
- Layout patterns in `layout/`
- Component documentation standards already established
- Tailwind already installed (via CDN in mockups, should be in project)

---

## Component Architecture Design

### Layer 1: Primitives (`components/primitives/`)

Foundation-level, atomic components with **ZERO** business logic.

#### 1.1 Button
**File**: `components/primitives/Button.tsx`

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'  | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  // ... standard button props
}
```

**Use Cases**: All buttons across app  
**Styling**: Tailwind classes only  
**Variants**:
- `primary`: `bg-primary text-white hover:bg-primary/90`
- `secondary`: `bg-surface-container text-secondary`
- `ghost`: `bg-transparent text-primary hover:bg-surface-container`

---

#### 1.2 Card
**File**: `components/primitives/Card.tsx`

```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}
```

**Default Styles**:
```tsx
className="bg-white rounded-[24px] shadow-sm border border-[#F1EFE9]"
```

**Composition**:
- `<Card>`: Base container
- `<CardHeader>`: Optional header section
- `<CardContent>`: Main content area
- `<CardFooter>`: Optional footer

---

#### 1.3 Badge
**File**: `components/primitives/Badge.tsx`

```tsx
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
}
```

**Examples**:
- `TARGET`: Emerald variant
- `BUDGETED`: Tertiary variant
- `ESTABLE`: Success variant
- `CRÍTICO`:Error variant

---

#### 1.4 Avatar
**File**: `components/primitives/Avatar.tsx`

```tsx
interface AvatarProps {
  src?: string;
  alt: string;
  fallback?: string; // initials if no image
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Use Cases**: User profile in sidebar, transaction items

---

#### 1.5 Icon
**File**: `components/primitives/Icon.tsx`

```tsx
interface IconProps {
  name: string; // Material Symbol name
  filled?: boolean;
  size?: number | string;
  className?: string;
}
```

**Implementation**: Wraps Material Symbols Outlined  
**Examples**: `payments`, `trending_up`, `shopping_bag`, `home`

---

#### 1.6 Input
**File**: `components/primitives/Input.tsx`

```tsx
interface InputProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'search';
  placeholder?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  // ... standard input props
}
```

**Variants**:
- Standard input
- Search input (with search icon)
- Number input (for amounts)

---

#### 1.7 Select
**File**: `components/primitives/Select.tsx`

```tsx
interface SelectProps {
  options: { label: string; value: string | number }[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
}
```

**Styling**: Tailwind native `<select>` or headless UI (React Aria, Radix)

---

### Layer 2: UI Components (`components/ui/`)

Composed from primitives, reusable across features.

#### 2.1 MetricCard
**File**: `components/ui/MetricCard.tsx`

**Composition**:
```tsx
<Card className="p-6">
  <div className="flex justify-between items-start mb-4">
    <Icon className="p-3 bg-primary/10 rounded-2xl" />
    <Badge variant="primary">TARGET</Badge>
  </div>
  <p className="text-sm font-medium text-slate-500">Annual Income</p>
  <h3 className="text-2xl font-black">{value}</h3>
  {subtitle && <TrendIndicator />}
  {footer}
</Card>
```

**Props**:
```tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: string; // Material Icon name
  iconBgColor?: string;
  badge?: { label: string; variant: string };
  trend?: { value: string; direction: 'up' | 'down' };
  footer?: React.ReactNode;
}
```

**Use Cases**:
- Annual Income card (Presupuesto)
- Net Worth card (Inicio)
- Account summary cards (Inicio)

---

#### 2.2 StatsGrid
**File**: `components/ui/StatsGrid.tsx`

**Purpose**: Responsive grid container for MetricCards

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
  {/* MetricCards here */}
</div>
```

**Not a component**: Just a pattern  
**Or make it**: Wrapper for consistent spacing

---

#### 2.3 ProgressBar
**File**: `components/ui/ProgressBar.tsx`

```tsx
interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**Default**:
```tsx
<div className="w-full h-1.5 bg-surface-container rounded-full">
  <div className="h-full bg-primary rounded-full" style={{width: `${value}%`}} />
</div>
```

---

#### 2.4 DataTable
**File**: `components/ui/DataTable.tsx`

**Purpose**: Reusable table structure with Tailwind styling

```tsx
interface DataTableProps {
  columns: Column[];
  data: any[];
  stickyHeader?: boolean;
  onRowClick?: (row: any) => void;
}
```

**Styling**:
- Header: `bg-surface-container/30`
- Rows: `hover:bg-surface-container-low`
- Borders: Subtle via `divide-y`

**Use Cases**:
- Monthly Breakdown table (Presupuesto)
- Transactions table (Actual)
- Any tabular data

---

#### 2.5 CategoryBadge
**File**: `components/ui/CategoryBadge.tsx`

**Purpose**: Colored badge with icon for categories

```tsx
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700">
  <Icon name="shopping_bag" size="14px" />
  SHOPPING
</span>
```

**Props**:
```tsx
interface CategoryBadgeProps {
  category: string;
  icon: string;
  color: 'blue' | 'amber' | 'purple' | 'emerald' | 'red';
}
```

---

#### 2.6 StatusBadge
**File**: `components/ui/StatusBadge.tsx`

**Purpose**: Transaction/item status indicator

```tsx
<Badge variant="success">
  <Icon name="check_circle" size="14px" />
  Cleared
</Badge>
```

**Variants**: `Cleared`, `Pending`, `Error`, `Estable`, `Crítico`

---

#### 2.7 TrendIndicator
**File**: `components/ui/TrendIndicator.tsx`

```tsx
interface TrendIndicatorProps {
  value: string; // "+4.2%" or "-2.1%"
  direction: 'up' | 'down';
  label?: string;
}
```

**Example**:
```tsx
<div className="flex items-center gap-2 text-emerald-600">
  <Icon name="trending_up" />
  <span className="font-semibold">+4.2% vs 2025</span>
</div>
```

---

#### 2.8 ActivityItem
**File**: `components/ui/ActivityItem.tsx`

**Purpose**: Transaction/activity list item (Inicio, Actual)

```tsx
<div className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl">
  <Avatar icon="shopping_bag" variant="default" />
  <div className="flex-1">
    <p className="font-bold">Apple Store</p>
    <p className="text-xs text-slate-400">Electronics • Today</p>
  </div>
  <p className="font-black">-$129.00</p>
</div>
```

---

#### 2.9 QuickActionButton
**File**: `components/ui/QuickActionButton.tsx`

**Purpose**: Icon button grid items (Inicio view)

```tsx
<button className="flex flex-col items-center gap-3 bg-white p-6 rounded-3xl hover:bg-slate-50 group">
  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110">
    <Icon name="add_card" />
  </div>
  <span className="text-xs font-bold">Add Expense</span>
</button>
```

---

#### 2.10 AccountSummaryCard
**File**: `components/ui/AccountSummaryCard.tsx`

**Purpose**: Small inline account display (Inicio bottom)

```tsx
<div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm">
  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
    <Icon name="credit_card" className="text-primary" />
  </div>
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase">Visa Platinum</p>
    <p className="text-sm font-bold">$2,450.00</p>
  </div>
</div>
```

---

### Layer 3: Layout Components (`layout/`)

#### 3.1 DarkSidebar
**File**: `layout/DarkSidebar.tsx`

**Purpose**: Navy sidebar with navigation (replaces current Sidebar)

**Key Features**:
- Dark navy background: `bg-[#002948]`
- White text: `text-white`
- Material Icons integration
- Expandable menu items
- User profile section at bottom
- Settings/logout links

**Structure**:
```tsx
<aside className="fixed left-0 top-0 h-screen w-64 bg-[#002948] text-white p-4">
  <Logo />
  <Navigation items={menuConfig} />
  <UserProfile />
</aside>
```

**NOT** using any UI library - pure Tailwind + custom logic

---

#### 3.2 TopNav
**File**: `layout/TopNav.tsx`

**Purpose**: Sticky top navigation bar

**Features**:
- Year selector dropdown
- Tab navigation (Actual/History)
- Search bar
- Notifications icon (with badge)
- Settings icon
- User avatar

**Example**:
```tsx
<header className="sticky top-0 z-40 bg-cream/80 backdrop-blur-md flex justify-between items-center px-8 h-20">
  <LeftSection>
    <YearSelector />
    <TabNav />
  </LeftSection>
  <RightSection>
    <SearchInput />
    <IconButton icon="notifications" badge={true} />
    <IconButton icon="settings" />
    <Avatar />
  </RightSection>
</header>
```

---

#### 3.3 AppLayout
**File**: `layout/AppLayout.tsx`

**Purpose**: Root layout combining sidebar + top nav + content

```tsx
<div className="flex min-h-screen bg-cream">
  <DarkSidebar />
  <main className="ml-64 flex-1">
    <TopNav />
    <div className="p-8 max-w-7xl mx-auto">
      {children}
    </div>
  </main>
</div>
```

**Replaces**: Current `MainLayout.tsx`

---

### Layer 4: Feature Components (`components/[feature]/`)

#### 4.1 Presupuesto (Budget) Components

**`components/presupuesto/BudgetTrajectoryChart.tsx`**
- Monthly bar chart visualization
- Planned vs Actual comparison
- Tailwind-based bars (no charting library initially)

**`components/presupuesto/MonthlyBreakdownTable.tsx`**
- Category rows with month columns
- Uses DataTable primitive
- Custom footer with totals

**`components/presupuesto/BudgetSummaryCards.tsx`**
- Grid of 4 MetricCards
- Specific to Presupuesto view

---

#### 4.2 Actual (Tracking) Components

**`components/actual/TransactionList.tsx`**
- List of recent transactions
- Uses ActivityItem component
- Paginated

**`components/actual/TransactionFilters.tsx`**
- Search + filter controls
- Date range, category selection

**`components/actual/MonthSummaryPanel.tsx`**
- Budget usage panel
- Progress bars per category
- "Projected Savings" + "Daily Average"

---

#### 4.3 Inicio (Dashboard) Components

**`components/dashboard/NetWorthHero.tsx`**
- Large gradient card with net worth
- Trend indicator
- Background decoration icon

**`components/dashboard/QuickActionsGrid.tsx`**
- 2x2 grid of action buttons
- Uses QuickActionButton component

**`components/dashboard/CurrentMonthSummary.tsx`**
- Category progress bars
- Monthly stats

**`components/dashboard/RecentActivityList.tsx`**
- Recent transactions
- Uses ActivityItem component

**`components/dashboard/AccountHighlights.tsx`**
- Bottom row of account cards
- Uses AccountSummaryCard

---

## Complete Component Mapping by Mockup

### Mockup 1: Inicio (Dashboard)

| UI Element | Component | Location | Status |
|------------|-----------|----------|--------|
| Dark sidebar | `DarkSidebar` | `layout/` | 🆕 NEW |
| Top nav bar | `TopNav` | `layout/` | 🆕 NEW |
| Year selector | `Select` primitive | `primitives/` | 🆕 NEW |
| Net Worth hero | `NetWorthHero` | `dashboard/` | 🆕 NEW |
| Quick actions grid | `QuickActionsGrid` | `dashboard/` | 🆕 NEW |
| Quick action button | `QuickActionButton` | `ui/` | 🆕 NEW |
| Month summary panel | `CurrentMonthSummary` | `dashboard/` | 🆕 NEW |
| Progress bars | `ProgressBar` | `ui/` | 🆕 NEW |
| Recent activity list | `RecentActivityList` | `dashboard/` | 🆕 NEW |
| Activity item | `ActivityItem` | `ui/` | 🆕 NEW |
| Account highlights | `AccountSummaryCard` | `ui/` | 🆕 NEW |
| FAB button | `Button` primitive | `primitives/` | 🆕 NEW |

**Total New Components**: 8 primitives, 6 UI, 5 feature = **19 components**

---

### Mockup 2: Presupuesto > Resumen (Budget Overview)

| UI Element | Component | Location | Status |
|------------|-----------|----------|--------|
| Dark sidebar | `DarkSidebar` | `layout/` | ✅ REUSE |
| Top nav bar | `TopNav` | `layout/` | ✅ REUSE |
| Year selector | `Select` primitive | `primitives/` | ✅ REUSE |
| Page title | Inline heading | - | ⚠️ PATTERN |
| Summary cards grid | `StatsGrid` | - | ⚠️ PATTERN |
| Metric card | `MetricCard` | `ui/` | 🆕 NEW |
| Badge | `Badge` primitive | `primitives/` | 🆕 NEW |
| Icon | `Icon` primitive | `primitives/` | 🆕 NEW |
| Trend indicator | `TrendIndicator` | `ui/` | 🆕 NEW |
| Progress bar | `ProgressBar` | `ui/` | ✅ REUSE |
| Chart panel | `Card` primitive | `primitives/` | 🆕 NEW |
| Budget chart | `BudgetTrajectoryChart` | `presupuesto/` | 🆕 NEW |
| Chart legend | Inline flexbox | - | ⚠️ PATTERN |
| Data table | `DataTable` | `ui/` | 🆕 NEW |
| Category badge | `CategoryBadge` | `ui/` | 🆕 NEW |
| Status badge | `StatusBadge` | `ui/` | 🆕 NEW |
| Export button | `Button` primitive | `primitives/` | ✅ REUSE |

**Total New Components**: 6 primitives, 6 UI, 1 feature = **13 components**  
**Reused**: 4 components

---

### Mockup 3: Actual > Gastos (Actual Tracking)

| UI Element | Component | Location | Status |
|------------|-----------|----------|--------|
| Dark sidebar | `DarkSidebar` | `layout/` | ✅ REUSE |
| Top nav bar | `TopNav` | `layout/` | ✅ REUSE |
| Tab navigation | `TabNav` subcomponent | `layout/TopNav` | 🆕 NEW |
| Search input | `Input` primitive | `primitives/` | ✅ REUSE |
| Status panel | `Card` with custom content | `primitives/` | ✅ REUSE |
| Progress bar | `ProgressBar` | `ui/` | ✅ REUSE |
| CTA button | `Button` primitive | `primitives/` | ✅ REUSE |
| Transactions table | `DataTable` | `ui/` | ✅ REUSE |
| Category badge | `CategoryBadge` | `ui/` | ✅ REUSE |
| Status badge | `StatusBadge` | `ui/` | ✅ REUSE |
| Action menu button | `Button` variant | `primitives/` | ✅ REUSE |
| Pagination | Custom pagination | - | 🆕 NEW |
| Analytics cards | `MetricCard` | `ui/` | ✅ REUSE |
| Image overlay card | `Card` with image | `primitives/` | ✅ REUSE |

**Total New Components**: 2 new  
**Reused**: 12 components

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
**Goal**: Build the primitive layer

1. ✅ Setup Tailwind config with design tokens
2. ✅ Add Inter font + Material Icons
3. ✅ Create primitives:
   - `Button`
   - `Card` (+ Header/Content/Footer)
   - `Badge`
   - `Icon`
   - `Avatar`
   - `Input`
   - `Select`

**Deliverable**: Storybook/docs for all primitives

---

### Phase 2: Layout (Week 2)
**Goal**: Build app shell

4. ✅ `DarkSidebar` with navigation
5. ✅ `TopNav` with all features
6. ✅ `AppLayout` composition
7. ✅ Update routing to use new layout

**Deliverable**: One page (e.g., blank Inicio) running with new layout

---

### Phase 3: UI Components (Week 3)
**Goal**: Build reusable UI layer

8. ✅ `MetricCard`
9. ✅ `ProgressBar`
10. ✅ `DataTable`
11. ✅ `CategoryBadge`
12. ✅ `StatusBadge`
13. ✅ `TrendIndicator`
14. ✅ `ActivityItem`
15. ✅ `QuickActionButton`
16. ✅ `AccountSummaryCard`

**Deliverable**: Storybook/docs for UI components

---

### Phase 4: Feature Pages (Week 4-6)
**Goal**: Implement mockup pages

17. ✅ **Inicio (Dashboard)** page
    - NetWorthHero
    - QuickActionsGrid
    - CurrentMonthSummary
    - RecentActivityList
    - AccountHighlights

18. ✅ **Presupuesto > Resumen** page
    - BudgetTrajectoryChart
    - MonthlyBreakdownTable
    - Summary cards grid

19. ✅ **Actual > Gastos** page
    - TransactionList
    - MonthSummaryPanel
    - Filters

**Deliverable**: 3 fully functional pages matching mockups

---

### Phase 5: Migration (Ongoing)
**Goal**: Phase out legacy components

20. ⚠️ Identify other pages using old components
21. ⚠️ Migrate incrementally
22. ⚠️ Remove deprecated components once unused
23. ⚠️ Remove old CSS files
24. ⚠️ Update documentation

---

## Component Documentation Requirements

Per `component-documentation.instructions.md`, these components **REQUIRE** README.md:

### Primitives (all require docs)
- ✅ Button
- ✅ Card
- ✅ Badge
- ✅ Icon
- ✅ Avatar
- ✅ Input
- ✅ Select

### UI Components (all require docs)
- ✅ MetricCard
- ✅ ProgressBar
- ✅ DataTable
- ✅ CategoryBadge
- ✅ StatusBadge
- ✅ TrendIndicator
- ✅ ActivityItem
- ✅ QuickActionButton
- ✅ AccountSummaryCard

### Layout Components
- ✅ DarkSidebar
- ✅ TopNav
- ✅ AppLayout

**Template**: Follow structure in component-documentation.instructions.md

---

## Tailwind Configuration

### Required Extensions

```js
// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Financial Atelier palette
        primary: '#175ab1',
        'primary-dark': '#004591',
        secondary: '#4c5e82',
        tertiary: '#904900',
        'navy-dark': '#002948',
        cream: '#FDFCF9',
        
        // Surfaces
        'surface-container': '#ecedf5',
        'surface-container-low': '#f2f3fb',
        'surface-container-high': '#e7e8f0',
        'surface-container-highest': '#e1e2ea',
        
        // Semantic
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '24px',
        'card-lg': '32px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

---

## File Structure

### Proposed Organization

```
node-version/client/src/
├── components/
│   ├── primitives/              # 🆕 Atomic building blocks
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── README.md
│   │   ├── Card/
│   │   │   ├── Card.tsx
│   │   │   ├── CardHeader.tsx
│   │   │   ├── CardContent.tsx
│   │   │   ├── CardFooter.tsx
│   │   │   └── README.md
│   │   ├── Badge/
│   │   ├── Icon/
│   │   ├── Avatar/
│   │   ├── Input/
│   │   └── Select/
│   │
│   ├── ui/                      # 🆕 Reusable composed components
│   │   ├── MetricCard/
│   │   │   ├── MetricCard.tsx
│   │   │   └── README.md
│   │   ├── ProgressBar/
│   │   ├── DataTable/
│   │   ├── CategoryBadge/
│   │   ├── StatusBadge/
│   │   ├── TrendIndicator/
│   │   ├── ActivityItem/
│   │   ├── QuickActionButton/
│   │   └── AccountSummaryCard/
│   │
│   ├── dashboard/               # 🆕 Dashboard-specific
│   │   ├── NetWorthHero.tsx
│   │   ├── QuickActionsGrid.tsx
│   │   ├── CurrentMonthSummary.tsx
│   │   ├── RecentActivityList.tsx
│   │   └── AccountHighlights.tsx
│   │
│   ├── presupuesto/            # 🆕 Budget-specific
│   │   ├── BudgetTrajectoryChart.tsx
│   │   ├── MonthlyBreakdownTable.tsx
│   │   └── BudgetSummaryCards.tsx
│   │
│   ├── actual/                 # ⚠️ Refactor existing
│   │   ├── TransactionList.tsx
│   │   ├── TransactionFilters.tsx
│   │   └── MonthSummaryPanel.tsx
│   │
│   ├── common/                 # ⚠️ Legacy (phase out)
│   │   └── (old components)
│   │
│   └── [DEPRECATED]/           # 🔴 Move deprecated here
│       └── Toast.tsx           # To be removed
│
├── layout/
│   ├── DarkSidebar.tsx         # 🆕 Replaces Sidebar
│   ├── TopNav.tsx              # 🆕 New
│   └── AppLayout.tsx           # 🆕 Replaces MainLayout
│
├── pages/
│   ├── Inicio.tsx              # ⚠️ Complete rebuild
│   ├── PresupuestoResumen.tsx  # 🆕 New page
│   └── ActualGastos.tsx        # ⚠️ Rebuild with new components
│
└── styles/
    └── (minimal - Tailwind handles most)
```

---

## Anti-Patterns to Avoid

### ❌ DO NOT

1. **Use any UI library** (no MUI, Ant Design, Chakra, etc.)
   - Exception: Headless UI for accessibility if needed (Radix, React Aria)

2. **Create CSS modules** for component styling
   - Use Tailwind utilities
   - Custom CSS only for complex animations

3. **Mix inline styles** with Tailwind
   - Pick one: Tailwind classes

4. **Create mega-components** with 20+ props
   - Keep components focused
   - Use composition

5. **Hardcode colors/spacing**
   - Use Tailwind theme values
   - `bg-primary` not `bg-[#175ab1]` (except custom values)

6. **Copy-paste component code**
   - Extract reusable patterns

7. **Skip documentation**
   - All primitives and UI components need README.md

---

## Success Criteria

### ✅ Done When:

1. **Visual Match**: Pages look identical to mockups
2. **No UI Library**: Zero dependencies on component libraries
3. **Tailwind-First**: 90%+ styling via Tailwind
4. **Fully Documented**: All components have README.md
5. **Reusable**: New features can compose from existing components
6. **Consistent**: Same patterns used across all views
7. **Maintainable**: Team can understand and extend easily
8. **Performant**: Bundle size doesn't bloat
9. **Accessible**: Components meet WCAG standards
10. **Responsive**: Works on mobile, tablet, desktop

---

## Migration Strategy: Legacy → New

### Step-by-Step Process

1. **Freeze Legacy** - No new features in old system
2. **Build New in Parallel** - Create new components/pages
3. **Prove It Works** - Ship one page with new system
4. **Incremental Swap** - Migrate page by page
5. **Remove Old Code** - Delete when usage = 0

### Example: Migrating Sidebar

**Before**:
```tsx
// components/Sidebar.tsx (RSuite-based)
import { Sidenav, Nav } from 'rsuite';
```

**After**:
```tsx
// layout/DarkSidebar.tsx (Tailwind-based)
<aside className="fixed left-0 top-0 h-screen w-64 bg-[#002948] text-white p-4">
  {/* Custom navigation */}
</aside>
```

**Migration**:
1. Build `DarkSidebar.tsx` from scratch
2. Test in isolation
3. Update `AppLayout` to use `DarkSidebar`
4. Roll out to pages one by one
5. Delete old `Sidebar.tsx` when unused

---

## Next Steps

### Immediate Actions (This Week)

1. ✅ **Review this document** with team
2. ✅ **Set up Tailwind** config with design tokens
3. ✅ **Add Inter font** and Material Icons
4. ✅ **Create first primitive**: `Button.tsx`
5. ✅ **Document Button** with README.md
6. ✅ **Create Storybook/demo** page for primitives

### Next Week

7. ✅ Complete all 7 primitives
8. ✅ Build `DarkSidebar` and `TopNav`
9. ✅ Create `AppLayout`
10. ✅ Test one page with new layout

### Weeks 3-4

11. ✅ Build UI components layer
12. ✅ Implement Inicio page
13. ✅ Implement Presupuesto Resumen page

### Month 2+

14. ✅ Implement Actual Gastos page
15. ⚠️ Migrate remaining pages
16. ⚠️ Remove legacy components
17. ⚠️ Update documentation

---

## References

- **Design System**: [ui-mapping-decisions-zapp.md](../ui-mapping-decisions-zapp.md)
- **Mockups**: `stitch_zapp_visual_style/` folder
- **Component Lifecycle**: `.vscode/prompts/component-lifecycle.instructions.md`
- **Documentation Standards**: `.vscode/prompts/component-documentation.instructions.md`
- **Tailwind Docs**: https://tailwindcss.com/docs

---

**Document Status**: ✅ Ready for Implementation  
**Last Updated**: April 5, 2026  
**Next Review**: After Phase 1 completion
  - Current tables use RSuite Table component
  - Consider if monthly columns can be a reusable pattern
  - Mockup shows sticky header - check if RSuite Table supports this

#### 5.2 **Sticky Table Header** ⚠️ PATTERN
- **Current**: Scroll UX improvements exist (see docs/changes/)
- **Mockup**: Sticky table header
- **Action**: Use CSS `position: sticky` or RSuite Table sticky props
- **Not a component**: CSS pattern

---

### 6. Content Sections

#### 6.1 **Info Panel / Callout Card** 🆕 CREATE NEW
- **Current**: RSuite Panel, Message exist
- **Mockup**: Yellow "Annual Savings Strategy" panel with icon + text + CTA
- **Action**: CREATE reusable CalloutCard component
- **Proposed Location**: `components/ui/CalloutCard.tsx`
- **Props**:
  ```typescript
  interface CalloutCardProps {
    title: string;
    description: string;
    variant?: 'info' | 'warning' | 'success' | 'error';
    icon?: ReactNode;
    actions?: ReactNode;
    backgroundColor?: string; // for custom colors like mockup's yellow
  }
  ```
- **Reusability**: HIGH - tips, warnings, strategy sections
- **Notes**: Similar to GmailSyncStatusBanner but for custom content sections

#### 6.2 **Stat Badge / KPI Badge** 🆕 CREATE NEW
- **Current**: Does not exist
- **Mockup**: "82%" badge in Annual Savings Strategy panel
- **Action**: CREATE small StatBadge component
- **Proposed Location**: `components/ui/StatBadge.tsx` or `components/base/Badge.tsx`
- **Props**:
  ```typescript
  interface StatBadgeProps {
    value: string | number;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'primary' | 'success';
  }
  ```
- **Reusability**: MEDIUM - KPIs, highlights
- **Note**: Could extend RSuite Badge component

---

## Proposed Component Tree for Annual Budget Overview Page

```
<MainLayout showTopNav={true}>
  <Breadcrumb items={[{label: 'Ledger'}, {label: 'Annual Budget Overview'}]} />
  
  <PageTitleSection 
    title="Annual Budget Overview"
    inlineActions={<YearSelector year={2026} onChange={...} />}
    actions={<Button>Export CSV</Button>}
  />

  {/* Metrics Grid - not a component, just layout */}
  <div className="grid grid-4">
    <MetricCard 
      title="Annual Income"
      value="$142,500.00"
      subtitle="+4.2% from 2025"
      accentColor="primary"
    />
    <MetricCard 
      title="Planned Expenses"
      value="$84,200.00"
      subtitle="59.1% of total income"
      accentColor="neutral"
    />
    <MetricCard 
      title="Projected Savings"
      value="$58,300.00"
      subtitle="High performance projected"
      variant="success"
      accentColor="tertiary"
    />
    <MetricCard 
      title="Savings Rate"
      value="40.9%"
      variant="primary"
      footer={<ProgressBar value={40.9} />}
    />
  </div>

  {/* Chart Section */}
  <Panel 
    header="Budget Trajectory"
    extra={<ChartLegend items={[...]} />}
  >
    <BudgetComparisonChart data={monthlyData} />
  </Panel>

  {/* Table Section */}
  <Panel header="Monthly Breakdown" extra={<Button>Export CSV</Button>}>
    <AnnualBudgetTable data={categoryData} />
  </Panel>

  {/* Strategy Section */}
  <div className="grid grid-2">
    <CalloutCard
      title="Annual Savings Strategy"
      description="Based on your 2026 projections..."
      variant="warning"
      backgroundColor="#FFF4E6"
      actions={<Button>Export CSV</Button>}
    />
    <MetricCard
      title="Wealth Score Progress"
      value="82%"
      subtitle="Your fiscal discipline is in the top 5% of Zapp users."
    />
  </div>
</MainLayout>
```

---

## Component Creation Priority

### Phase 1: Critical Reusable Components (Create First)
1. **MetricCard** (`components/ui/MetricCard.tsx`)
   - **Why**: Used 5+ times, high reusability across dashboards
   - **Complexity**: Low-Medium
   - **Dependencies**: None (RSuite Panel optional)

2. **TopNavBar** (`layout/TopNavBar.tsx`)
   - **Why**: Layout foundation, will be used across all pages
   - **Complexity**: Medium
   - **Dependencies**: None

3. **Breadcrumb** (`components/ui/Breadcrumb.tsx`)
   - **Why**: Navigation standard across app
   - **Complexity**: Low
   - **Dependencies**: None

### Phase 2: Feature Components (Create After Phase 1)
4. **BudgetComparisonChart** (`components/ui/BudgetComparisonChart.tsx` or `components/presupuesto/`)
   - **Why**: Depends on design decisions (use CategoryBarChart vs new)
   - **Complexity**: Medium-High
   - **Dependencies**: Charting library decision

5. **CalloutCard** (`components/ui/CalloutCard.tsx`)
   - **Why**: Nice-to-have, can use RSuite Message as interim
   - **Complexity**: Low-Medium
   - **Dependencies**: MetricCard (similar patterns)

6. **AnnualBudgetTable** (inline in page or `components/presupuesto/`)
   - **Why**: Specific to this page, extract if reuse emerges
   - **Complexity**: Medium
   - **Dependencies**: RSuite Table

### Phase 3: Enhancements (Optional)
7. **ChartLegend** (`components/ui/ChartLegend.tsx`)
   - **Why**: Can inline for now, extract if used 3+ places
   - **Complexity**: Low

8. **StatBadge** (`components/ui/StatBadge.tsx`)
   - **Why**: Can use RSuite Badge or inline for now
   - **Complexity**: Low

---

## Reusable vs Feature-Specific Guidance

### ✅ Should Be Reusable (components/ui/ or components/base/)
- **MetricCard** - dashboards, summaries, KPIs (any feature)
- **Breadcrumb** - navigation (any page)
- **CalloutCard** - tips, warnings, highlights (any feature)
- **TopNavBar** - layout (all pages)
- **ChartLegend** - any chart visualization
- **StatBadge** - KPIs, metrics

### ⚠️ Evaluate for Reusability (start feature-specific, extract if needed)
- **BudgetComparisonChart** - if only used in budget pages → `components/presupuesto/`
- **AnnualBudgetTable** - if pattern appears 3+ times → extract to `components/ui/`

### ❌ Keep Feature-Specific (components/presupuesto/ or inline)
- **YearSelector** (inline use of RSuite SelectPicker)
- **Export CSV button** (inline Button)
- Page-specific logic and data handling

---

## Existing Component Adaptations Needed

### 1. **Sidebar.tsx** - Visual Refinements
- Current: Functional but basic styling
- Mockup: Polished with better spacing, icons, dark mode support
- **Action**: Refine CSS, keep component structure
- **Breaking**: No - visual only

### 2. **PageTitleSection.tsx** - Add Inline Actions
- Current: Title + description + actions (right-aligned)
- Mockup: Title + inline year selector (next to title) + actions
- **Action**: Add optional `inlineActions` prop
- **Breaking**: No - additive change

### 3. **MainLayout.tsx** - Optional Top Nav
- Current: Sidebar + content only
- Mockup: TopNav + Sidebar + content
- **Action**: Add optional `showTopNav` and `topNavProps`
- **Breaking**: No - additive change

---

## Design System Alignment

### From DESIGN.md:
- **Primary Color**: `#3e76cf` → Update CSS var `--primary` or keep current `#2563eb`?
- **Secondary Color**: `#65779c` → Add as new CSS var `--secondary`
- **Tertiary Color**: `#a65500` → Add as new CSS var `--tertiary`
- **Neutral Color**: `#75777e` → Add as new CSS var `--neutral`
- **Font**: Inter → Currently using system fonts, consider switching
- **Roundedness**: 2 (moderate) → Current uses 6px/8px border-radius (aligned)
- **Spacing**: 2 (normal) → Current spacing seems aligned

### Recommendations:
1. **Extend** `index.css` with mockup color tokens:
   ```css
   :root {
     /* Existing */
     --primary: #2563eb; /* or update to #3e76cf */
     
     /* Add from mockup */
     --secondary: #65779c;
     --tertiary: #a65500;
     --neutral: #75777e;
   }
   ```

2. **Font Migration**: Consider adding Inter font (currently using system fonts)
   - Low priority - system fonts are production-grade
   - Can add as enhancement later

---

## Anti-Patterns to Avoid

### ❌ DO NOT:
1. **Copy the entire mockup HTML inline** - Refactor into components
2. **Create generic "Table" component** - Wait for 3+ similar use cases
3. **Hardcode mockup colors** - Use CSS variables from design system
4. **Create page-specific components in `/components/ui/`** - Keep feature-specific in `components/presupuesto/`
5. **Duplicate existing patterns** - Reuse YearMonthPicker, not create YearSelector variant
6. **Create components for single-use inline elements** - Breadcrumb = yes (multi-use), "Export CSV button" = no (inline)

### ✅ DO:
1. **Extract reusable patterns** after seeing duplication
2. **Compose from RSuite** where possible (Panel, Button, Table, etc.)
3. **Use CSS variables** for theming
4. **Start feature-specific** → extract when 3+ uses emerge
5. **Document new components** per component-documentation.instructions.md

---

## Next Steps

### Immediate Actions:
1. ✅ **Review this document** - Validate component decisions
2. 🔲 **Create Phase 1 components** - MetricCard, TopNavBar, Breadcrumb
3. 🔲 **Extend existing components** - PageTitleSection, MainLayout
4. 🔲 **Build page structure** - Annual Budget Overview page using new components
5. 🔲 **Refine Sidebar** - Apply mockup visual polish

### Implementation Order:
```
Day 1: Foundation
- MetricCard component
- Breadcrumb component
- Extend PageTitleSection

Day 2: Layout
- TopNavBar component
- Update MainLayout
- Refine Sidebar visuals

Day 3: Page Assembly
- Create AnnualBudgetOverview page
- Integrate components
- Implement table

Day 4: Visualizations & Polish
- BudgetComparisonChart (or adapt CategoryBarChart)
- CalloutCard component
- Final styling and responsive behavior
```

---

## Questions for Clarification

1. **Color Scheme**: Use mockup colors (`#3e76cf`) or keep current (`#2563eb`)?
2. **Charting Library**: Prefer custom SVG, Chart.js, Recharts, or other?
3. **Breadcrumb Navigation**: Implement now or defer (not in current app)?
4. **TopNavBar**: Implement globally or only for this page initially?
5. **Table Implementation**: Use RSuite Table or custom implementation?

---

## Component Documentation Checklist

Per `component-documentation.instructions.md`, the following components **REQUIRE** README.md:

- ✅ MetricCard (components/ui/)
- ✅ Breadcrumb (components/ui/)
- ✅ TopNavBar (layout/)
- ✅ CalloutCard (components/ui/)
- ✅ BudgetComparisonChart (if in components/ui/)
- ✅ ChartLegend (if in components/ui/)

**Template**: See component-documentation.instructions.md for README structure.

---

## Appendix: File Locations Reference

### Current Structure:
```
node-version/client/src/
├── components/
│   ├── common/
│   │   ├── YearMonthPicker.tsx
│   │   └── GmailSyncStatusBanner.tsx
│   ├── actual/
│   │   ├── ActualConsolidatedTable.tsx
│   │   ├── CategoryBarChart.tsx
│   │   └── ...
│   ├── utilities/
│   ├── ui/                          # ⚠️ Currently empty - target for new reusables
│   ├── Sidebar.tsx
│   └── ...
├── layout/
│   ├── MainLayout.tsx
│   └── PageTitleSection.tsx
├── pages/
│   └── ...
└── theme/
    └── rsuite-variables.ts
```

### Proposed New Structure:
```
node-version/client/src/
├── components/
│   ├── base/                        # 🆕 Primitive components (if needed)
│   │   └── Badge.tsx (optional)
│   ├── ui/                          # 🆕 Reusable UI components
│   │   ├── MetricCard.tsx           # 🆕 CREATE
│   │   ├── Breadcrumb.tsx           # 🆕 CREATE
│   │   ├── CalloutCard.tsx          # 🆕 CREATE
│   │   ├── ChartLegend.tsx          # 🆕 CREATE (optional)
│   │   └── README.md                # 🆕 Overview of ui/ components
│   ├── presupuesto/                 # 🆕 Budget-specific components
│   │   ├── AnnualBudgetTable.tsx    # 🆕 CREATE
│   │   └── BudgetComparisonChart.tsx # 🆕 CREATE (if not in ui/)
│   └── ...
├── layout/
│   ├── TopNavBar.tsx                # 🆕 CREATE
│   ├── MainLayout.tsx               # ⚠️ EXTEND
│   └── PageTitleSection.tsx         # ⚠️ EXTEND
└── pages/
    └── AnnualBudgetOverview.tsx     # 🆕 CREATE
```

---

**Document Status**: ✅ Ready for Review  
**Next Action**: Validate decisions → Begin Phase 1 implementation
