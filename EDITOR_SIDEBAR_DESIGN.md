# Editor Sidebar Design System

A comprehensive, reusable component library for building editor sidebars with consistent visual hierarchy, spacing, and interaction patterns.

## Overview

The design system consists of two main pattern groups:

1. **SectionGroup Components**: Structural wrappers that establish vertical rhythm and group related controls
2. **Tab Navigation Components**: Modular button patterns with distinct active/inactive states

## Design Principles

### Visual Hierarchy
- **Title**: `text-sm font-bold uppercase tracking` with trailing horizontal line
- **Description**: `text-xs text-zinc-500` subtle supporting text
- **Content**: Consistent `space-y-4` gaps between inputs

### Color Palette
- **Light Mode**: Zinc grays with white backgrounds
- **Dark Mode**: Zinc grays with charcoal backgrounds
- **Accent**: Lime-400 for active states and primary actions

### Spacing
- Section groups: `space-y-4` (1rem gaps)
- Tab buttons: `gap-2` between buttons
- Internal padding: `py-1.5 px-3` for tab buttons

---

## Components

### SectionGroup

**Purpose**: Wrapper that establishes vertical rhythm and groups related controls

```tsx
import { SectionGroup } from '@/components/EditorSidebar';

<SectionGroup>
  {/* Your content here */}
</SectionGroup>
```

**Props**:
- `children: ReactNode` - Content to wrap
- `className?: string` - Additional Tailwind classes

---

### SectionTitle

**Purpose**: Bold uppercase title with trailing horizontal line

```tsx
import { SectionTitle } from '@/components/EditorSidebar';

<SectionTitle>Properties</SectionTitle>
```

**Visual Details**:
- Font: `text-sm font-bold uppercase tracking-wider`
- Trailing line: `flex-1 h-px bg-zinc-200 dark:bg-zinc-800/80`
- Layout: Flexbox with items centered and gap-3

**Props**:
- `children: ReactNode` - Title text
- `className?: string` - Additional Tailwind classes

---

### SectionDescription

**Purpose**: Optional subtle text beneath the title

```tsx
import { SectionDescription } from '@/components/EditorSidebar';

<SectionDescription>Configure element properties</SectionDescription>
```

**Visual Details**:
- Font: `text-xs text-zinc-600 dark:text-zinc-500`
- Subtle and non-intrusive

**Props**:
- `children: ReactNode` - Description text
- `className?: string` - Additional Tailwind classes

---

### SectionContent

**Purpose**: Wraps inputs with consistent space-y-4 gaps

```tsx
import { SectionContent } from '@/components/EditorSidebar';

<SectionContent>
  <input type="text" placeholder="Name" />
  <input type="text" placeholder="Class" />
</SectionContent>
```

**Props**:
- `children: ReactNode` - Content to wrap
- `className?: string` - Additional Tailwind classes

---

### TabNav

**Purpose**: Container for tab buttons in a row layout

```tsx
import { TabNav, TabButton } from '@/components/EditorSidebar';

<TabNav>
  <TabButton label="Tab 1" isActive={true} />
  <TabButton label="Tab 2" isActive={false} />
</TabNav>
```

**Props**:
- `children: ReactNode` - Tab buttons
- `className?: string` - Additional Tailwind classes

---

### TabButton

**Purpose**: Modular, squarish button with stacked icon/text

#### Inactive State
- Text/Icon stacked vertically: `flex-col gap-1 py-1.5`
- Subdued colors: `text-zinc-600 dark:text-zinc-400`
- Transparent background

#### Active State
- Background: `bg-white/5 dark:bg-black/30`
- Border: `ring-1 ring-zinc-200/50 dark:ring-white/10`
- Shadow: `shadow-sm dark:shadow-lg`
- Icon color: `text-lime-400`
- Text weight: `font-bold` (vs `font-medium` inactive)

```tsx
import { TabButton } from '@/components/EditorSidebar';

<TabButton
  icon={<IconComponent />}
  label="Properties"
  isActive={true}
  onClick={() => handleTabChange('properties')}
/>
```

**Props**:
- `icon?: ReactNode` - Icon element (optional)
- `label: string` - Button label text
- `isActive?: boolean` - Whether button is active (default: false)
- `onClick?: () => void` - Click handler
- `className?: string` - Additional Tailwind classes
- `disabled?: boolean` - Whether button is disabled

---

## Composite Components

### SectionWithTitle

**Purpose**: Convenience component combining title + description + content

```tsx
import { SectionWithTitle } from '@/components/EditorSidebar';

<SectionWithTitle
  title="Properties"
  description="Configure element properties"
>
  <input type="text" placeholder="Name" />
  <input type="text" placeholder="Class" />
</SectionWithTitle>
```

**Props**:
- `title: string` - Section title
- `description?: string` - Optional description
- `children: ReactNode` - Section content
- `className?: string` - Additional Tailwind classes

---

### Tabs

**Purpose**: Complete tab component with navigation and content switching

```tsx
import { Tabs } from '@/components/EditorSidebar';

<Tabs
  items={[
    {
      id: 'text',
      label: 'Text',
      icon: '📝',
      content: <TextEditor />,
    },
    {
      id: 'style',
      label: 'Style',
      icon: '🎨',
      content: <StyleEditor />,
    },
  ]}
  defaultActiveId="text"
  onTabChange={(id) => console.log('Tab changed to:', id)}
/>
```

**Props**:
- `items: TabItem[]` - Array of tab items
  - `id: string` - Unique identifier
  - `label: string` - Display label
  - `icon?: ReactNode` - Optional icon
  - `content: ReactNode` - Tab content
- `defaultActiveId?: string` - Initial active tab (default: first item)
- `onTabChange?: (id: string) => void` - Callback when tab changes
- `className?: string` - Additional Tailwind classes

---

## Usage Examples

### Basic Editor Sidebar

```tsx
import {
  SectionWithTitle,
  TabNav,
  TabButton,
  SectionContent,
} from '@/components/EditorSidebar';

export const MyEditorSidebar = () => {
  const [activeTab, setActiveTab] = useState('properties');

  return (
    <div className="w-80 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 p-6 space-y-8">
      {/* Properties Section */}
      <SectionWithTitle
        title="Properties"
        description="Configure element properties"
      >
        <input
          type="text"
          placeholder="Element name"
          className="w-full px-3 py-2 text-sm rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        />
      </SectionWithTitle>

      {/* Tab Navigation */}
      <SectionWithTitle title="Content">
        <TabNav>
          <TabButton
            label="Text"
            isActive={activeTab === 'text'}
            onClick={() => setActiveTab('text')}
          />
          <TabButton
            label="Style"
            isActive={activeTab === 'style'}
            onClick={() => setActiveTab('style')}
          />
        </TabNav>
      </SectionWithTitle>
    </div>
  );
};
```

### With Icons

```tsx
import { Tabs } from '@/components/EditorSidebar';
import { Type, Palette, Layout } from 'lucide-react';

<Tabs
  items={[
    {
      id: 'text',
      label: 'Text',
      icon: <Type size={16} />,
      content: <TextPanel />,
    },
    {
      id: 'style',
      label: 'Style',
      icon: <Palette size={16} />,
      content: <StylePanel />,
    },
    {
      id: 'layout',
      label: 'Layout',
      icon: <Layout size={16} />,
      content: <LayoutPanel />,
    },
  ]}
/>
```

### Nested Sections

```tsx
import { SectionGroup, SectionWithTitle } from '@/components/EditorSidebar';

<SectionGroup>
  <SectionWithTitle title="Appearance">
    {/* Appearance controls */}
  </SectionWithTitle>

  <SectionWithTitle title="Spacing">
    {/* Spacing controls */}
  </SectionWithTitle>

  <SectionWithTitle title="Advanced">
    {/* Advanced controls */}
  </SectionWithTitle>
</SectionGroup>
```

---

## Styling Integration

All components use Tailwind CSS v4 with the project's custom theme:

- **Brand Color**: `lime-400` (primary accent)
- **Dark Mode**: Class-based with `.dark` selector
- **Fonts**: DM Sans, Hanken Grotesk, etc. (via `font-sans`)
- **Animations**: `animate-fade-in` for tab content transitions

### Custom Input Styling

For consistent input styling within sections:

```tsx
<input
  type="text"
  placeholder="Placeholder text"
  className="w-full px-3 py-2 text-sm rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-400/50"
/>
```

---

## Accessibility

- Tab buttons use semantic `<button>` elements
- Proper `disabled` state support
- Clear visual distinction between active/inactive states
- Sufficient color contrast in both light and dark modes
- Icon + text combinations for clarity

---

## Dark Mode Support

All components include full dark mode support via Tailwind's `.dark` class:

```tsx
// Light mode
<div className="bg-white text-zinc-900">

// Dark mode
<div className="dark:bg-zinc-950 dark:text-zinc-100">
```

---

## Performance Considerations

- Components use React.FC for type safety
- Tab content uses `animate-fade-in` for smooth transitions
- Minimal re-renders through proper state management
- No external dependencies beyond React and Tailwind

---

## Future Enhancements

Potential additions to the design system:

- Collapsible sections with expand/collapse animations
- Drag-and-drop reordering of sections
- Keyboard navigation for tabs (arrow keys)
- Tooltip support for truncated labels
- Custom color themes
- Responsive breakpoints for mobile editors
