---
description: "Use when migrating, refactoring, or replacing component libraries (e.g., RSuite → custom components). Prevents common errors: duplicated code, unwrapped JSX, orphaned imports, incomplete replacements. Apply to ANY component migration or large refactor task."
applyTo: ["**/*.tsx", "**/*.ts", "**/*.jsx", "**/*.js"]
---

# Component Migration & Refactor Safety Rules

## Critical Safety Checks - MANDATORY

### 🔴 AFTER EVERY FILE EDIT - VERIFY

1. **Check for duplicated code**
   - Search for duplicate `export default` statements
   - Look for repeated JSX blocks (same component rendered twice)
   - Verify no old code remains after new code

2. **Validate JSX structure**
   - All JSX elements must be wrapped in a single parent
   - Use fragment `<>...</>` or wrapping `<div>` when needed
   - Check return statements have ONE root element

3. **Clean up imports**
   - Remove unused imports from replaced libraries
   - Add missing imports for new components
   - Run TypeScript validation to catch missing types

4. **Verify file completeness**
   - File must end with ONE `export default`
   - No orphaned closing tags (`</Component>`)
   - No orphaned code blocks after the final export

### ⚠️ Common Migration Errors - PREVENT

#### ❌ ERROR: Duplicated Code
```tsx
// BAD: Old code not fully removed
export default Component;
// ...old RSuite code still here...
<Panel>...</Panel>
export default Component; // ← DUPLICATE!
```

#### ✅ CORRECT: Clean Single Export
```tsx
// GOOD: Complete replacement, single export
export default Component;
// File ends here, no residual code
```

#### ❌ ERROR: Unwrapped Adjacent JSX
```tsx
// BAD: Multiple root elements
return (
  <div>First</div>
  <div>Second</div> // ← Not allowed!
);
```

#### ✅ CORRECT: Wrapped JSX
```tsx
// GOOD: Single root element
return (
  <>
    <div>First</div>
    <div>Second</div>
  </>
);
```

#### ❌ ERROR: Orphaned Imports
```tsx
// BAD: Importing replaced library
import { Panel, Button } from 'rsuite';
// ...but using custom components now
<div className="card">...</div>
<button className="btn">...</button>
```

#### ✅ CORRECT: Clean Imports
```tsx
// GOOD: Only needed imports
import React from 'react';
// No rsuite, using native HTML
```

## Migration Workflow - REQUIRED STEPS

### Phase 1: Before Editing
1. **Read complete file** (not just portions)
2. **Identify all imports** from library being replaced
3. **Map replacement strategy** for each component
4. **Note file length** to detect incomplete edits

### Phase 2: During Edit
1. **Replace components systematically** (top to bottom)
2. **Update imports immediately** as you replace
3. **Maintain code structure** (indentation, nesting)
4. **Preserve business logic** (handlers, state, effects)

### Phase 3: After Edit - CRITICAL VALIDATION
1. **Read the entire modified file** to verify completeness
2. **Search for duplicate exports**: `export default ComponentName`
3. **Check file ends cleanly** after final export
4. **Validate with TypeScript**: Run `get_errors` tool
5. **Verify no unused imports**: Check for import warnings

## Specific Library Migrations

### RSuite → Custom/Native HTML

**Components to replace**:
- `<Panel>` → `<div className="card">`
- `<Button>` → `<button className="btn">`
- `<Input>` → `<input className="input">`
- `<InputNumber>` → `<input type="number" className="input">`
- `<SelectPicker>` → `<select className="select">`
- `<DatePicker>` → `<input type="date/month" className="input">`
- `<Table>` + `Column` → `<table>` + HTML elements

**After replacement checklist**:
- [ ] No `import ... from 'rsuite'` remains
- [ ] No RSuite components in JSX
- [ ] All styled with existing CSS classes
- [ ] TypeScript compiles without errors
- [ ] File has exactly ONE `export default`

## Multi-File Refactors

When editing **multiple related files**:

1. **Edit ONE file at a time completely**
2. **Validate EACH file** before moving to next
3. **Don't assume** previous file pattern works for all
4. **Re-read each file** after editing to verify

## Error Recovery

If you create an error like duplicated code:

1. **Read the ENTIRE file** to see full state
2. **Identify ALL occurrences** of duplicated/broken code
3. **Replace the ENTIRE broken section** (not just patch)
4. **Include sufficient context** in oldString (5+ lines before/after)
5. **Validate immediately** after fix

## Tools to Use

### After EVERY component edit:
```typescript
// 1. Check TypeScript errors
get_errors({ filePaths: ["path/to/edited/file.tsx"] })

// 2. Search for duplicate exports (should be 1 match only)
grep_search({ 
  query: "export default ComponentName",
  includePattern: "path/to/edited/file.tsx"
})

// 3. Verify no RSuite imports remain
grep_search({ 
  query: "from 'rsuite'",
  includePattern: "path/to/edited/file.tsx"
})
```

## Success Criteria

A migration is complete when:

✅ Zero TypeScript errors  
✅ No unused imports  
✅ Exactly ONE `export default` per file  
✅ All JSX properly wrapped  
✅ No residual old library code  
✅ File ends cleanly after final export  
✅ Component renders without runtime errors  

## Red Flags - Stop and Fix

🚨 **STOP if you see**:
- Multiple `export default` in one file
- JSX error: "Adjacent JSX elements must be wrapped"
- Import from replaced library still present
- File doesn't end after export statement
- TypeScript errors in migrated file

**Then**: Read entire file, identify issue, fix completely, validate.

---

**Remember**: Migration errors compound. One incomplete replacement leads to cascading failures. Always validate each file completely before moving forward.
