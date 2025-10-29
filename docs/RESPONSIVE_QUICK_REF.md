# Mobile Responsiveness Quick Reference

## 🎯 Quick Checklist Before Committing

- [ ] Tested on mobile viewport (375px width minimum)
- [ ] No text overflows containers
- [ ] Buttons are at least 44px tall
- [ ] No horizontal scrolling
- [ ] Touch targets are easily tappable

## 📐 Standard Breakpoints

```css
/* Mobile-first approach */
/* 0-767px: Mobile (default styles) */

@media (min-width: 768px) {
  /* Tablet and up */
}

@media (min-width: 968px) {
  /* Desktop and up */
}
```

## 🛠️ Essential Utility Classes

```html
<!-- Responsive visibility -->
<div class="mobile-only">Visible on mobile only</div>
<div class="desktop-only">Visible on desktop only</div>

<!-- Responsive container -->
<div class="container">Auto-centered with responsive padding</div>

<!-- Responsive grid -->
<div class="grid grid-md-2 grid-lg-3">
  <!-- Auto-responsive columns -->
</div>
```

## 🎨 Common Patterns

### Prevent Text Overflow

```css
.element {
  word-wrap: break-word;
  overflow-wrap: break-word;
}
```

### Responsive Grid

```css
.grid {
  display: grid;
  grid-template-columns: 1fr; /* Mobile: 1 column */
  gap: 1rem;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr); /* Tablet: 2 columns */
  }
}
```

### Touch-Friendly Buttons

```css
button {
  min-height: 44px; /* iOS minimum */
  padding: 0.75rem 1.5rem;
  white-space: normal; /* Allow wrapping */
}
```

### Stack on Mobile

```css
.layout {
  display: flex;
  flex-direction: column; /* Mobile: stacked */
  gap: 1rem;
}

@media (min-width: 768px) {
  .layout {
    flex-direction: row; /* Desktop: side-by-side */
  }
}
```

## 🚫 Common Mistakes to Avoid

| ❌ Don't                          | ✅ Do                                      |
| --------------------------------- | ------------------------------------------ |
| `width: 600px;`                   | `max-width: 600px; width: 100%;`           |
| `font-size: 14px;`                | `font-size: clamp(0.875rem, 1.5vw, 1rem);` |
| `white-space: nowrap;` on buttons | `white-space: normal;`                     |
| `padding: 2px 8px;` on buttons    | `padding: 0.75rem 1.5rem;`                 |
| Fixed widths                      | Flexible widths with max-width             |

## 📱 iOS-Specific

```css
/* Prevent zoom on input focus */
@media (max-width: 768px) {
  input,
  select,
  textarea {
    font-size: 16px; /* Must be 16px or larger */
  }
}

/* Safe area for notched devices */
.container {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

## 🧪 Quick Testing

### DevTools

1. Press F12 (Windows) or Cmd+Opt+I (Mac)
2. Press Ctrl+Shift+M (Windows) or Cmd+Shift+M (Mac) for device toolbar
3. Test these widths:
   - 375px (iPhone SE)
   - 390px (iPhone 12/13/14)
   - 768px (iPad)
   - 1200px (Desktop)

### Test URLs

```bash
# Local
http://localhost:5173/auth/login
http://localhost:5173/checkout
http://localhost:5173/cart
http://localhost:5173/admin/dashboard
```

## 📚 Full Documentation

For complete guidelines, see: `docs/RESPONSIVE_DESIGN.md`

## 💡 Pro Tips

1. **Mobile-first**: Write mobile styles first, then add desktop styles
2. **Use clamp()**: For fluid typography that scales smoothly
3. **Test early**: Check mobile view while developing, not at the end
4. **Real devices**: DevTools are helpful but test on actual devices when
   possible
5. **Touch targets**: Remember fingers are bigger than cursors (44px minimum)

## 🆘 Having Issues?

1. Check if text is wrapping: Add `word-wrap: break-word;`
2. Horizontal scroll: Add `overflow-x: hidden;` to parent
3. Tiny buttons: Set `min-height: 44px;`
4. Wrong layout: Use `flex-direction: column;` for mobile
5. Text too small: Use `clamp()` or minimum `16px` for inputs

---

**Remember**: Every component should work perfectly on mobile FIRST! 📱✨
