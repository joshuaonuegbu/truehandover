# Visual Guide: Floating Delivery Widget

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Navigation Bar                           │
│                    (Sendational Logo, Menu, CTA)                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────────────────────────────┐
│                  │  │                                          │
│  FLOATING        │  │         HERO SECTION                     │
│  WIDGET          │  │                                          │
│  (Fixed Left)    │  │    "Deliver creative work..."            │
│                  │  │                                          │
│  ┌────────────┐  │  │    [Start for Free] [Watch Video]       │
│  │ Try it now │  │  │                                          │
│  │            │  │  └──────────────────────────────────────────┘
│  │ Storage:   │  │
│  │ [Local]    │  │  ┌──────────────────────────────────────────┐
│  │ [Cloud]    │  │  │                                          │
│  │            │  │  │      COMPARISON SECTION                  │
│  │ [Upload]   │  │  │                                          │
│  │            │  │  │   Old Way vs New Way                     │
│  │ Project    │  │  │                                          │
│  │ Client     │  │  └──────────────────────────────────────────┘
│  │ Email      │  │
│  │            │  │  ┌──────────────────────────────────────────┐
│  │ Quote      │  │  │                                          │
│  │ Builder    │  │  │         BENTO GRID                       │
│  │            │  │  │                                          │
│  │ [Sign Up]  │  │  │   Feature Cards                          │
│  └────────────┘  │  │                                          │
│                  │  └──────────────────────────────────────────┘
│  (Scrolls with  │
│   page)         │  ┌──────────────────────────────────────────┐
│                  │  │                                          │
└──────────────────┘  │         PRICING SECTION                  │
                      │                                          │
                      └──────────────────────────────────────────┘
```

## Widget Breakdown

```
┌─────────────────────────────────────┐
│  ┌─┐  Try it now                    │
│  │✓│  Quick delivery                │
│  └─┘  Build a delivery, see how it  │
│       works. Sign up to keep it.    │
├─────────────────────────────────────┤
│  STORAGE                            │
│  ┌──────────┐  ┌──────────┐        │
│  │ 💾 Local │  │ ☁️ Cloud │        │
│  └──────────┘  └──────────┘        │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │     📤 Choose files         │   │
│  │   From your device          │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ Project title               │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Client name                 │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Client email                │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  QUOTE BUILDER                      │
│  ┌─────────────────────────────┐   │
│  │ Description                 │   │
│  │ Qty | Rate | Total | [×]    │   │
│  └─────────────────────────────┘   │
│  [+ Line]          Subtotal: $0    │
│  [Apply] [Copy] [PDF] [Email]      │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │  💾 Sign up to keep it      │   │
│  └─────────────────────────────┘   │
│  Free to start • No credit card    │
└─────────────────────────────────────┘
```

## Responsive Behavior

### Desktop (≥1280px)
- Widget visible on left
- Main content has left padding
- Full experience

### Tablet/Mobile (<1280px)
- Widget hidden
- Main content full width
- Standard landing page experience

## Color Scheme

### Light Mode
- Widget background: White
- Borders: Zinc-200
- Text: Black/Zinc-900
- Accent: Lime-400

### Dark Mode
- Widget background: Charcoal (#323242)
- Borders: White/10
- Text: White/Zinc-100
- Accent: Lime-400

## Interactive States

### Storage Toggle
```
Inactive: White bg, zinc border, gray text
Active:   Black bg (light) / Lime bg (dark), bold text
```

### File Upload
```
Default: Dashed border, gray
Hover:   Lime border, lime background tint
Active:  Shows file count
```

### Sign Up Button
```
Default: Lime-400 bg, black text, shadow
Hover:   Lime-500 bg, scale up, larger shadow
```

## User Journey

1. **Land on page** → See widget immediately
2. **Choose storage** → Local or Cloud
3. **Upload files** → Visual feedback
4. **Fill details** → Project, client info
5. **Build quote** → Add line items
6. **Try features** → Copy, PDF, Email
7. **Sign up** → Convert to user
8. **Keep work** → Data persists

## Key Interactions

### Widget → Main App
```typescript
handleWidgetSignUp() {
  // Opens GetStartedModal
  // Can pre-fill with widget data
  // Smooth transition to full app
}
```

### Storage Selection
```typescript
setWidgetStorageType('local' | 'cloud')
// Updates UI
// Changes file picker behavior
// Shows appropriate messaging
```

### File Upload
```typescript
handleWidgetFilesChange(files)
// Stores files in state
// Updates button text
// Plays success sound
```

## Accessibility

- All buttons have proper labels
- Keyboard navigation supported
- Focus states visible
- Screen reader friendly
- Color contrast compliant

## Performance

- Widget only renders on large screens
- No impact on mobile performance
- Lazy loading of file data
- Efficient state management

## Future Enhancements

1. **Cloud Integration**
   - Google Drive picker
   - Dropbox chooser
   - OneDrive selector

2. **File Preview**
   - Thumbnail grid
   - File type icons
   - Size indicators

3. **Progress Tracking**
   - Step indicators
   - Completion percentage
   - Guided tour

4. **Persistence**
   - localStorage backup
   - Resume on return
   - Draft saving

5. **Analytics**
   - Track interactions
   - Conversion metrics
   - A/B testing
