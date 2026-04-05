---
description: "Use when creating, modifying, or refactoring React/TypeScript UI components, Tailwind styling, component architecture, frontend design system work. Enforces Zapp Financial Atelier visual standards: NO RSuite, Tailwind-first, custom components, design tokens, Lovable/Stitch patterns."
applyTo: ["src/components/**/*.tsx", "src/components/**/*.ts", "**/*.tsx"]
---

# Zapp UI Architecture - Enforced Rules

**Full documentation**: [docs/ui-project-rule-zapp.md](../../docs/ui-project-rule-zapp.md)

## Critical Rules - BLOCKING

### ❌ NEVER Use

- **RSuite** (or any opinionated UI library: Material-UI, Ant Design, Chakra UI)
- **CSS modules** as default pattern (Tailwind-first)
- **Inline styles** except for dynamic values from props/state
- **Runtime CSS-in-JS** (emotion, styled-components)

### ✅ ALWAYS Use

- **Tailwind utilities** for 90%+ of styling
- **Existing components** from `src/components/` (search before creating)
- **TypeScript interfaces** for all props
- **Design tokens** from `tailwind.config.js`

## Component Discovery

**Before creating a component, search these locations**:

```
src/components/
├── primitives/    # Button, Input, Card, Badge (base atoms)
├── ui/            # MetricCard, DataTable, StatCard (composed)
└── [feature]/     # dashboard/, budget/, actual/ (feature-specific)
```

**Rule of 3**: Only create reusable component if used 3+ times OR is a base primitive.

## Code Patterns

### ✅ Correct: Tailwind-First

```tsx
// Clean, maintainable, responsive
function MetricCard({ value, label }: MetricCardProps) {
  return (
    <div className="p-6 bg-white rounded-[24px] shadow-sm">
      <span className="text-sm text-gray-600">{label}</span>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
    </div>
  );
}
```

### ❌ Incorrect: Multiple Anti-Patterns

```tsx
// DO NOT DO THIS - violates multiple rules
import { Panel } from 'rsuite'; // ❌ RSuite prohibited
import styles from './Card.module.css'; // ❌ CSS module as default

function BadCard() {
  return (
    <Panel style={{ padding: '24px' }}> {/* ❌ Inline styles */}
      <div className={styles.content}>...</div>
    </Panel>
  );
}
```

## Design Tokens (Required)

### Colors
- Primary: `#175ab1` → `text-primary`, `bg-primary`
- Background: `#FDFCF9` → `bg-cream`
- Sidebar: `#002948` → `bg-navy-dark`

### Spacing (4px grid)
- Use: `p-4`, `p-6`, `p-8`, `gap-6`, `gap-8`
- Avoid: `p-[17px]`, `gap-[13px]` (arbitrary values)

### Border Radius
- Inputs/badges: `rounded-lg` (8px)
- Buttons: `rounded-xl` (12px)
- Cards: `rounded-[24px]` or `rounded-[32px]`

## Component Structure Template

```tsx
import { ReactNode } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string; // For Tailwind extension
}

/**
 * Base button component with primary, secondary, and ghost variants.
 * Part of Zapp primitives layer.
 */
export function Button({ 
  variant = 'primary', 
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-secondary text-white hover:bg-secondary/90',
    ghost: 'bg-transparent text-primary hover:bg-primary/10',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`font-medium rounded-xl transition-all ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

## External Libraries

### ✅ Allowed: Headless Only

Use **only** when providing complex accessibility/logic:

- **Radix UI**: Dialogs, Dropdowns, Tooltips (headless)
- **Headless UI**: Transitions, Disclosure
- **TanStack Table**: Table logic (headless, no styled components)

**MUST wrap** with own component applying Zapp styles:

```tsx
// ✅ Correct: Wrapper with Zapp styles
import * as RadixDialog from '@radix-ui/react-dialog';

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <RadixDialog.Root open={isOpen} onOpenChange={onClose}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/50" />
        <RadixDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[24px] p-8 shadow-lg">
          <RadixDialog.Title className="text-2xl font-bold mb-4">
            {title}
          </RadixDialog.Title>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

// Use <Modal>, never Radix directly
```

## UX Visual Rules

1. **Actions look like actions**: Hover states, clear affordance, primary color
2. **Data looks like data**: Neutral colors, no hover, `tabular-nums` for numbers
3. **One primary action per view**: Only one `bg-primary` button visible
4. **Consistent patterns**: Same action = same appearance everywhere

## Pre-Submission Checklist

Before proposing component code:

- [ ] Searched `src/components/` for existing similar component
- [ ] Using Tailwind for 90%+ of styles
- [ ] NO RSuite or opinionated UI libraries
- [ ] TypeScript interface with JSDoc
- [ ] Responsive (works mobile/tablet/desktop)
- [ ] Accepts `className` prop for extension
- [ ] Uses design tokens from `tailwind.config.js`
- [ ] Component has single clear purpose
- [ ] Less than 200 lines (split if larger)

## Quick Reference Commands

Search for existing components:
```bash
# Find all components
fd -e tsx . src/components/

# Search for specific pattern (e.g., "Card")
rg "export.*Card" src/components/
```

## Error Recovery

**If code violates rules**:
1. Stop immediately
2. Reference this file or [docs/ui-project-rule-zapp.md](../../docs/ui-project-rule-zapp.md)
3. Propose compliant alternative
4. Explain why original violates architecture

---

**Remember**: This is not a suggestion—it's a **mandatory project rule**. All UI code must comply.
