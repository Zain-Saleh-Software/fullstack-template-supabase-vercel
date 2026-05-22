# Accessibility Skill (Vercel + Supabase Stack)

**Description:** Patterns for implementing WCAG AA compliant, keyboard-navigable, screen-reader-friendly, and semantically correct UI components in Next.js with Tailwind CSS.
**Role:** The Executor

---

## 1. Semantic HTML

Use proper HTML elements. `<div>` is a last resort.

| Instead of | Use | Why |
|-----------|-----|-----|
| `<div onClick>` | `<button>` | Native keyboard support, ARIA role built in |
| `<div href>` | `<a>` | Native link behavior, right-click, open in new tab |
| `<div class="header">` | `<header>` | Landmark for screen readers |
| `<div class="nav">` | `<nav>` | Navigation landmark |
| `<div class="main">` | `<main>` | Main content landmark |
| `<div class="footer">` | `<footer>` | Footer landmark |
| `<div class="section">` | `<section>` | Section landmark (with aria-label or aria-labelledby) |
| `<br><br>` for spacing | CSS margin/padding | Semantic separation |

```tsx
// Bad
<div onClick={handleClick} className="cursor-pointer">Save</div>

// Good
<button onClick={handleClick}>Save</button>
```

---

## 2. ARIA Labels

Every interactive element MUST have an accessible name.

```tsx
// Icon buttons need aria-label
<button onClick={handleClose} aria-label="Close dialog">
  <XIcon />
</button>

// Navigation landmarks need labels
<nav aria-label="Main navigation">
  <ul>{/* nav items */}</ul>
</nav>

// Sections need labels
<section aria-labelledby="recent-activity-heading">
  <h2 id="recent-activity-heading">Recent Activity</h2>
</section>

// Form groups
<fieldset>
  <legend>Contact Method</legend>
  {/* radio group */}
</fieldset>
```

---

## 3. Keyboard Navigation

All interactive elements must be keyboard accessible.

### Focusability
- `<button>`, `<a href>`, `<input>`, `<select>`, `<textarea>` are natively focusable
- Custom interactive elements need `tabIndex={0}` and keyboard handlers
- Use `tabIndex={-1}` to programmatically focus without tab order

### Keyboard Event Handlers
```tsx
// Custom interactive element (avoid — use <button> instead)
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Custom Button
</div>
```

### Logical Tab Order
```tsx
// Tab order follows DOM order. Don't use positive tabIndex values.
// Good — natural DOM order
<form>
  <input name="email" />     {/* Tab 1 */}
  <input name="password" />  {/* Tab 2 */}
  <button type="submit" />   {/* Tab 3 */}
</form>
```

---

## 4. Focus Management

### Modal/Dialog
```tsx
import { useEffect, useRef } from 'react';

function Dialog({ isOpen, onClose, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      dialogRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Dialog title"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      {children}
    </div>
  );
}
```

### Route Change Focus
Next.js handles SPA navigation. For accessibility, move focus to the main content on route change:

```tsx
// In layout.tsx or a client wrapper
'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function RouteFocusHandler({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.focus();
  }, [pathname]);

  return <main ref={mainRef} tabIndex={-1}>{children}</main>;
}
```

---

## 5. Color Contrast (WCAG AA)

| Text Size | Minimum Ratio |
|-----------|--------------|
| Normal (<18px bold or <24px regular) | 4.5:1 |
| Large (≥18px bold or ≥24px regular) | 3:1 |

### Tailwind's Built-in Contrast

Tailwind v4 colors are designed for accessibility. Use the standard color scale:

```tsx
// Good — meets 4.5:1 on white background
<p className="text-gray-700 dark:text-gray-300">Body text</p>

// Bad — too low contrast
<p className="text-gray-300 dark:text-gray-600">Body text</p>

// Verify with Chrome DevTools → Accessibility → Contrast Ratio
```

---

## 6. Form Labels

Every input MUST have an associated label.

```tsx
// Explicit label — best practice
<label htmlFor="email">Email address</label>
<input id="email" type="email" name="email" />

// Implicit label — also acceptable
<label>
  Email address
  <input type="email" name="email" />
</label>

// aria-label — for inputs without visible labels
<input aria-label="Search" type="search" />

// aria-labelledby — references another element
<h2 id="search-heading">Search</h2>
<input aria-labelledby="search-heading" type="search" />

// Error messages tied to inputs
<input id="email" aria-describedby="email-error" />
<p id="email-error" className="text-red-600">Invalid email format</p>
```

---

## 7. Images

```tsx
import Image from 'next/image';

// Informative image — descriptive alt text
<Image src="/team-photo.jpg" alt="The engineering team at the 2024 company retreat" width={800} height={600} />

// Decorative image — empty alt
<Image src="/decorative-pattern.svg" alt="" width={100} height={100} />

// Complex image — use aria-describedby + description
<Image src="/chart.png" alt="Q4 Revenue Chart" aria-describedby="chart-desc" width={600} height={400} />
<p id="chart-desc">Revenue grew 25% in Q4, driven by enterprise sales and international expansion.</p>
```

---

## 8. Screen Reader Utilities (sr-only)

```css
/* In globals.css or use Tailwind's built-in */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

```tsx
// Skip to main content link
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-white">
  Skip to main content
</a>

// Visually hidden label
<button aria-label="Close dialog">
  <XIcon aria-hidden="true" />
  <span className="sr-only">Close</span>
</button>
```

---

## 9. Tables

Tables need proper structure for screen readers:

```tsx
<table>
  <caption className="sr-only">List of recent invoices with status</caption>
  <thead>
    <tr>
      <th scope="col">Invoice #</th>
      <th scope="col">Amount</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    {invoices.map(invoice => (
      <tr key={invoice.id}>
        <th scope="row">{invoice.number}</th>
        <td>{formatCurrency(invoice.amount)}</td>
        <td><StatusBadge status={invoice.status} /></td>
      </tr>
    ))}
  </tbody>
</table>
```

Key points:
- `<caption>` for table description
- `<th scope="col">` for column headers
- `<th scope="row">` for row headers
- `<thead>`, `<tbody>`, `<tfoot>` for structure

---

## 10. Error & Status Messages

```tsx
// Error alert
<div role="alert" className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
  <p>There was an error processing your request. Please try again.</p>
</div>

// Success message
<div role="status" className="p-3 bg-green-50 border border-green-200 rounded text-green-700">
  <p>Your changes have been saved.</p>
</div>

// Live region for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

---

## 11. Skip Navigation Link

Every page should have a "Skip to main content" link:

```tsx
// In root layout
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:p-4 focus:bg-blue-600 focus:text-white focus:rounded"
>
  Skip to main content
</a>

// Main content target
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

---

## 12. Motion & Animation

Respect `prefers-reduced-motion`:

```tsx
// In globals.css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Validation Checklist

- [ ] Semantic HTML used (button, nav, main, section, header, footer)
- [ ] All interactive elements have accessible names (aria-label or text content)
- [ ] All interactive elements keyboard accessible (Tab, Enter, Space)
- [ ] Focus managed for modals and dialogs
- [ ] Color contrast meets 4.5:1 (normal) or 3:1 (large)
- [ ] Every form input has an associated label
- [ ] All images have appropriate alt text
- [ ] Screen reader utilities (sr-only, aria-live) used where needed
- [ ] Tables have proper header structure
- [ ] Skip navigation link on every page
- [ ] No positive tabIndex values (use DOM order)
- [ ] Error/status messages use role="alert" or role="status"
