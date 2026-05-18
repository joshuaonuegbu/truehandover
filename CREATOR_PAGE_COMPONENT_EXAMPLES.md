# CreatorPage V2 - Component Examples

## 1. Main Container Component

```typescript
// CreatorPageV2.tsx
import React, { useState, useCallback } from 'react';
import { ChevronLeft, Save } from 'lucide-react';
import { useCreatorForm } from './hooks/useCreatorForm';
import { usePreview } from './hooks/usePreview';
import { useDraftPersistence } from './hooks/useDraftPersistence';
import CreatorHeader from './components/CreatorHeader';
import CreatorTabs from './components/CreatorTabs';
import CreatorEditor from './components/CreatorEditor';
import CreatorPreview from './components/CreatorPreview';

interface CreatorPageV2Props {
  existingProject?: Project | null;
  onSave: (project: Project) => void;
  onBack: () => void;
  user?: UserProfile;
}

const CreatorPageV2: React.FC<CreatorPageV2Props> = ({
  existingProject,
  onSave,
  onBack,
  user
}) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'design' | 'assets' | 'payment' | 'advanced'>('basics');
  const { formState, updateField, validate, save, errors, isDirty } = useCreatorForm(existingProject);
  const { previewProject, previewTheme, deviceMode, isCollapsed, setPreviewTheme, setDeviceMode, setIsCollapsed } = usePreview(formState);
  const { restoreDraft, clearDraft } = useDraftPersistence(existingProject?.id || 'new', formState);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    const project = await save();
    clearDraft();
    onSave(project);
    onBack();
  }, [validate, save, clearDraft, onSave, onBack]);

  return (
    <div className="min-h-screen bg-white dark:bg-cosmic flex flex-col">
      {/* Header */}
      <CreatorHeader
        projectName={formState.project.name}
        isDirty={isDirty}
        onSave={handleSave}
        onBack={onBack}
        previewTheme={previewTheme}
        onThemeChange={setPreviewTheme}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Pane */}
        <div className="flex-1 overflow-y-auto">
          {/* Sticky Tabs */}
          <CreatorTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Tab Content */}
          <CreatorEditor
            activeTab={activeTab}
            formState={formState}
            onUpdate={updateField}
            errors={errors}
          />
        </div>

        {/* Preview Pane (Desktop) / Drawer (Mobile) */}
        <CreatorPreview
          project={previewProject}
          theme={previewTheme}
          deviceMode={deviceMode}
          isCollapsed={isCollapsed}
          onThemeChange={setPreviewTheme}
          onDeviceModeChange={setDeviceMode}
          onCollapsedChange={setIsCollapsed}
        />
      </div>
    </div>
  );
};

export default CreatorPageV2;
```

## 2. Header Component

```typescript
// CreatorHeader.tsx
import React from 'react';
import { ChevronLeft, Save, Sun, Moon, Monitor } from 'lucide-react';

interface CreatorHeaderProps {
  projectName: string;
  isDirty: boolean;
  onSave: () => void;
  onBack: () => void;
  previewTheme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

const CreatorHeader: React.FC<CreatorHeaderProps> = ({
  projectName,
  isDirty,
  onSave,
  onBack,
  previewTheme,
  onThemeChange
}) => {
  const cycleTheme = () => {
    if (previewTheme === 'system') onThemeChange('light');
    else if (previewTheme === 'light') onThemeChange('dark');
    else onThemeChange('system');
  };

  const themeIcon = previewTheme === 'light' ? Sun : previewTheme === 'dark' ? Moon : Monitor;
  const ThemeIcon = themeIcon;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-charcoal border-b border-zinc-200/50 dark:border-white/[0.06]">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold dark:text-white">
              {projectName || 'Untitled Project'}
            </h1>
            {isDirty && (
              <p className="text-xs text-zinc-500">Unsaved changes</p>
            )}
          </div>
        </div>

        {/* Right: Theme Toggle + Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={cycleTheme}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            title={`Theme: ${previewTheme}`}
          >
            <ThemeIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onSave}
            disabled={!isDirty}
            className="flex items-center gap-2 px-4 py-2 bg-lime-400 text-black hover:bg-lime-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    </header>
  );
};

export default CreatorHeader;
```

## 3. Tab Navigation Component

```typescript
// CreatorTabs.tsx
import React from 'react';
import { FileText, Palette, Upload, CreditCard, Settings } from 'lucide-react';

type TabId = 'basics' | 'design' | 'assets' | 'payment' | 'advanced';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: Tab[] = [
  { id: 'basics', label: 'Basics', icon: FileText, description: 'Project & client info' },
  { id: 'design', label: 'Design', icon: Palette, description: 'Visual customization' },
  { id: 'assets', label: 'Assets', icon: Upload, description: 'Files & uploads' },
  { id: 'payment', label: 'Payment', icon: CreditCard, description: 'Payment methods' },
  { id: 'advanced', label: 'Advanced', icon: Settings, description: 'Power features' },
];

interface CreatorTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const CreatorTabs: React.FC<CreatorTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="sticky top-16 z-30 bg-white dark:bg-charcoal border-b border-zinc-200/50 dark:border-white/[0.06]">
      <div className="px-6 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap
                ${isActive
                  ? 'border-lime-400 text-lime-400 dark:text-lime-400'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CreatorTabs;
```

## 4. Section Card Wrapper

```typescript
// SectionCard.tsx
import React from 'react';

interface SectionCardProps {
  title: string;
  icon?: React.ElementType;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon: Icon,
  description,
  actions,
  children,
  className = ''
}) => {
  return (
    <div className={`
      bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06]
      p-6 lg:p-8 rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden relative group
      transition-all hover:shadow-md dark:hover:shadow-lg
      ${className}
    `}>
      {/* Grain texture */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[2rem] opacity-[0.04] dark:opacity-[0.04] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`
        }}
      />

      {/* Gradient blur background */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-[80px] pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        {(title || actions) && (
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="w-8 h-8 rounded-lg bg-lime-400/10 flex items-center justify-center text-lime-400">
                  <Icon className="w-4 h-4" />
                </div>
              )}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  {title}
                </h3>
                {description && (
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}

        {/* Body */}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SectionCard;
```

## 5. Form Input Component

```typescript
// FormInput.tsx
import React from 'react';

interface FormInputProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'password';
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  hint?: string;
  icon?: React.ElementType;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  disabled,
  required,
  hint,
  icon: Icon
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-900 dark:text-white">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-3 py-2.5 rounded-lg text-sm
            bg-white dark:bg-white/8
            border border-transparent focus:border-zinc-300 dark:focus:border-white/25
            outline-none text-zinc-900 dark:text-white
            placeholder:text-zinc-400 dark:placeholder:text-zinc-500
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
            ${Icon ? 'pl-9' : ''}
            ${error ? 'border-red-500 focus:border-red-500' : ''}
          `}
        />
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {hint && !error && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
    </div>
  );
};

export default FormInput;
```

## 6. Grid Selector Component (for wallpapers, patterns, avatars)

```typescript
// GridSelector.tsx
import React from 'react';
import { Check } from 'lucide-react';

interface GridItem {
  id: string;
  label: string;
  image?: string;
  icon?: React.ElementType;
  color?: string;
}

interface GridSelectorProps {
  items: GridItem[];
  selectedId: string;
  onChange: (id: string) => void;
  columns?: number;
  size?: 'sm' | 'md' | 'lg';
}

const GridSelector: React.FC<GridSelectorProps> = ({
  items,
  selectedId,
  onChange,
  columns = 3,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-16',
    md: 'h-24',
    lg: 'h-32'
  };

  return (
    <div className={`grid gap-3 grid-cols-${columns}`}>
      {items.map((item) => {
        const Icon = item.icon;
        const isSelected = selectedId === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`
              relative rounded-lg overflow-hidden transition-all group
              ${sizeClasses[size]}
              ${isSelected
                ? 'ring-2 ring-lime-400 shadow-lg shadow-lime-400/20'
                : 'ring-1 ring-zinc-200 dark:ring-white/10 hover:ring-lime-400/50'
              }
            `}
            title={item.label}
          >
            {/* Background */}
            {item.image ? (
              <img
                src={item.image}
                alt={item.label}
                className="w-full h-full object-cover"
              />
            ) : item.color ? (
              <div
                className="w-full h-full"
                style={{ backgroundColor: item.color }}
              />
            ) : Icon ? (
              <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-white/10">
                <Icon className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
              </div>
            ) : null}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

            {/* Checkmark */}
            {isSelected && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center">
                  <Check className="w-5 h-5 text-black" />
                </div>
              </div>
            )}

            {/* Label */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
              <p className="text-xs font-medium text-white truncate">{item.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default GridSelector;
```

## 7. Drag & Drop Upload Zone

```typescript
// DragDropZone.tsx
import React, { useRef, useState } from 'react';
import { Upload, File } from 'lucide-react';

interface DragDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
}

const DragDropZone: React.FC<DragDropZoneProps> = ({
  onFilesSelected,
  accept = '*',
  multiple = true,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    onFilesSelected(files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative p-8 rounded-xl border-2 border-dashed transition-all
        ${isDragging
          ? 'border-lime-400 bg-lime-400/5'
          : 'border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/5'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-lime-400/50'}
      `}
    >
      {/* Glassmorphic background */}
      <div className="absolute inset-0 rounded-xl backdrop-blur-sm pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-3 text-center">
        <div className="w-12 h-12 rounded-lg bg-lime-400/10 flex items-center justify-center">
          <Upload className="w-6 h-6 text-lime-400" />
        </div>

        <div>
          <p className="font-medium text-zinc-900 dark:text-white">
            Drop files here or click to upload
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Images, videos, PDFs, and documents supported
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        <button
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="px-4 py-2 bg-lime-400 text-black hover:bg-lime-500 disabled:opacity-50 rounded-lg font-medium text-sm transition-colors"
        >
          Select Files
        </button>
      </div>
    </div>
  );
};

export default DragDropZone;
```

## 8. Live Preview Component

```typescript
// CreatorPreview.tsx
import React from 'react';
import { ChevronLeft, ChevronRight, Smartphone, Tablet, Monitor, Maximize2 } from 'lucide-react';
import ClientPreviewBiz from './ClientPreviewBiz';

interface CreatorPreviewProps {
  project: Project;
  theme: 'light' | 'dark' | 'system';
  deviceMode: 'desktop' | 'tablet' | 'mobile' | 'foldable';
  isCollapsed: boolean;
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  onDeviceModeChange: (mode: 'desktop' | 'tablet' | 'mobile' | 'foldable') => void;
  onCollapsedChange: (collapsed: boolean) => void;
}

const DEVICE_SIZES = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
  foldable: { width: 540, height: 720 }
};

const CreatorPreview: React.FC<CreatorPreviewProps> = ({
  project,
  theme,
  deviceMode,
  isCollapsed,
  onThemeChange,
  onDeviceModeChange,
  onCollapsedChange
}) => {
  const size = DEVICE_SIZES[deviceMode];
  const aspectRatio = size.width / size.height;

  return (
    <div className={`
      hidden lg:flex flex-col bg-white dark:bg-charcoal border-l border-zinc-200/50 dark:border-white/[0.06]
      transition-all duration-300
      ${isCollapsed ? 'w-16' : 'w-[40%]'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200/50 dark:border-white/[0.06]">
        <h3 className={`text-sm font-bold dark:text-white ${isCollapsed ? 'hidden' : ''}`}>
          Live Preview
        </h3>
        <button
          onClick={() => onCollapsedChange(!isCollapsed)}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors"
        >
          {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Controls */}
          <div className="p-4 border-b border-zinc-200/50 dark:border-white/[0.06] space-y-3">
            {/* Device Mode */}
            <div className="flex gap-2">
              {(['desktop', 'tablet', 'mobile', 'foldable'] as const).map((mode) => {
                const Icon = mode === 'desktop' ? Monitor : mode === 'tablet' ? Tablet : Smartphone;
                return (
                  <button
                    key={mode}
                    onClick={() => onDeviceModeChange(mode)}
                    className={`
                      flex-1 p-2 rounded-lg text-xs font-medium transition-colors
                      ${deviceMode === mode
                        ? 'bg-lime-400 text-black'
                        : 'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/20'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 mx-auto" />
                  </button>
                );
              })}
            </div>

            {/* Theme Mode */}
            <div className="flex gap-2">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onThemeChange(t)}
                  className={`
                    flex-1 p-2 rounded-lg text-xs font-medium capitalize transition-colors
                    ${theme === t
                      ? 'bg-lime-400 text-black'
                      : 'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/20'
                    }
                  `}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Container */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-zinc-50 dark:bg-cosmic">
            <div
              className="bg-white dark:bg-charcoal rounded-lg shadow-lg overflow-hidden"
              style={{
                width: `${Math.min(size.width, 400)}px`,
                aspectRatio: aspectRatio
              }}
            >
              <ClientPreviewBiz
                project={project}
                themeMode={theme}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CreatorPreview;
```

---

## Implementation Notes

1. **State Management:** Use `useCreatorForm` hook for centralized form state
2. **Real-time Preview:** Debounce updates (300ms) to prevent excessive re-renders
3. **Accessibility:** All inputs have proper labels and ARIA attributes
4. **Mobile:** Use responsive classes to hide/show components
5. **Performance:** Memoize components to prevent unnecessary re-renders
6. **Styling:** Use Tailwind classes consistently with the design system

