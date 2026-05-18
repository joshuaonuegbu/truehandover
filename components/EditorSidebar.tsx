import React, { ReactNode } from 'react';

/**
 * EditorSidebar Design System
 * 
 * A comprehensive set of components for building editor sidebars with:
 * - SectionGroup: Structural wrappers with vertical rhythm
 * - Tab Navigation: Modular, squarish button patterns with active/inactive states
 * - Consistent spacing and visual hierarchy
 */

// ─────────────────────────────────────────────────────────────────
// SECTION GROUP COMPONENTS
// ─────────────────────────────────────────────────────────────────

interface SectionGroupProps {
  children: ReactNode;
  className?: string;
}

/**
 * SectionGroup: Wrapper that establishes vertical rhythm and groups related controls
 */
export const SectionGroup: React.FC<SectionGroupProps> = ({ children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {children}
  </div>
);

interface SectionTitleProps {
  children: ReactNode;
  className?: string;
}

/**
 * SectionTitle: Bold uppercase title with trailing horizontal line
 * Uses text-sm font-sans font-bold uppercase tracking
 * Flanked by a flexible 1px trailing line (flex-1 bg-zinc-800/80)
 */
export const SectionTitle: React.FC<SectionTitleProps> = ({ children, className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <h3 className="text-sm font-sans font-bold uppercase tracking-wider whitespace-nowrap text-zinc-900 dark:text-zinc-100">
      {children}
    </h3>
    <div className="flex-1 h-px bg-zinc-200/80 dark:bg-zinc-800/80" />
  </div>
);

interface SectionDescriptionProps {
  children: ReactNode;
  className?: string;
}

/**
 * SectionDescription: Optional subtle text beneath the title
 */
export const SectionDescription: React.FC<SectionDescriptionProps> = ({ children, className = '' }) => (
  <p className={`text-xs text-zinc-500 ${className}`}>
    {children}
  </p>
);

interface SectionContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * SectionContent: Wraps inputs with consistent space-y-4 gaps
 */
export const SectionContent: React.FC<SectionContentProps> = ({ children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────
// TAB NAVIGATION COMPONENTS
// ─────────────────────────────────────────────────────────────────

interface TabNavProps {
  children: ReactNode;
  className?: string;
}

/**
 * TabNav: Container for tab buttons in a row layout
 */
export const TabNav: React.FC<TabNavProps> = ({ children, className = '' }) => (
  <div className={`flex gap-2 ${className}`}>
    {children}
  </div>
);

interface TabButtonProps {
  icon?: ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * TabButton: Modular, squarish button with stacked icon/text
 * 
 * Inactive State:
 * - Text/Icon combinations stacked vertically (flex-col, gap-1, py-1.5)
 * - Subdued colors
 * 
 * Active State:
 * - bg-black/30 (or a contrasting white in light mode)
 * - ring-1 ring-white/10 (or ring-1 ring-zinc-200 in light mode)
 * - Slight shadow
 * - Icon turns to primary accent color
 * - Text changes from medium to bold weight
 */
export const TabButton: React.FC<TabButtonProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
  className = '',
  disabled = false,
}) => {
  const baseClasses = 'relative flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl transition-all duration-300 ease-out overflow-hidden';
  
  const inactiveClasses = `
    text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/40 
    dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.04] 
    bg-transparent
  `;
  
  const activeClasses = `
    text-zinc-900 dark:text-white
    bg-white dark:bg-white/[0.08]
    ring-1 ring-zinc-200/80 dark:ring-white/10
    shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_rgba(190,242,100,0.06)]
  `;

  const iconClasses = isActive
    ? 'text-[#65a30d] dark:text-[#bef264] scale-105 transition-transform duration-300'
    : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors duration-200';

  const textWeightClasses = isActive ? 'font-bold' : 'font-semibold';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group
        ${baseClasses}
        ${isActive ? activeClasses : inactiveClasses}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {icon && (
        <div className={`flex items-center justify-center ${iconClasses}`}>
          {icon}
        </div>
      )}
      <span className={`text-[11px] ${textWeightClasses} leading-tight transition-colors duration-200`}>
        {label}
      </span>
      {isActive && (
        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#65a30d] dark:bg-[#bef264] shadow-[0_0_8px_rgba(190,242,100,0.8)] animate-pulse" />
      )}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────
// COMPOSITE PATTERNS
// ─────────────────────────────────────────────────────────────────

interface SectionWithTitleProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * SectionWithTitle: Convenience component combining title + description + content
 */
export const SectionWithTitle: React.FC<SectionWithTitleProps> = ({
  title,
  description,
  children,
  className = '',
}) => (
  <SectionGroup className={className}>
    <SectionTitle>{title}</SectionTitle>
    {description && <SectionDescription>{description}</SectionDescription>}
    <SectionContent>{children}</SectionContent>
  </SectionGroup>
);

interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveId?: string;
  onTabChange?: (id: string) => void;
  className?: string;
}

/**
 * Tabs: Complete tab component with navigation and content switching
 */
export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultActiveId,
  onTabChange,
  className = '',
}) => {
  const [activeId, setActiveId] = React.useState(defaultActiveId || items[0]?.id || '');

  const handleTabChange = (id: string) => {
    setActiveId(id);
    onTabChange?.(id);
  };

  const activeItem = items.find((item) => item.id === activeId);

  return (
    <div className={`space-y-4 ${className}`}>
      <TabNav>
        {items.map((item) => (
          <TabButton
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeId === item.id}
            onClick={() => handleTabChange(item.id)}
          />
        ))}
      </TabNav>
      {activeItem && (
        <div className="animate-fade-in">
          {activeItem.content}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// EXAMPLE USAGE COMPONENT
// ─────────────────────────────────────────────────────────────────

/**
 * EditorSidebarExample: Demonstrates the design system in action
 */
export const EditorSidebarExample: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('properties');

  return (
    <div className="w-80 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 p-6 space-y-8 overflow-y-auto">
      {/* Section 1: Properties */}
      <SectionWithTitle
        title="Properties"
        description="Configure element properties"
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Element name"
            className="w-full px-3 py-2 text-sm rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-500"
          />
          <input
            type="text"
            placeholder="CSS class"
            className="w-full px-3 py-2 text-sm rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-500"
          />
        </div>
      </SectionWithTitle>

      {/* Section 2: Tabs Example */}
      <SectionWithTitle
        title="Content"
        description="Switch between different content views"
      >
        <Tabs
          items={[
            {
              id: 'text',
              label: 'Text',
              icon: '📝',
              content: (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Text content editor
                </div>
              ),
            },
            {
              id: 'style',
              label: 'Style',
              icon: '🎨',
              content: (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Style configuration
                </div>
              ),
            },
            {
              id: 'layout',
              label: 'Layout',
              icon: '📐',
              content: (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Layout settings
                </div>
              ),
            },
          ]}
          defaultActiveId="text"
          onTabChange={setActiveTab}
        />
      </SectionWithTitle>

      {/* Section 3: Actions */}
      <SectionWithTitle
        title="Actions"
        description="Quick actions for this element"
      >
        <div className="space-y-2">
          <button className="w-full px-3 py-2 text-sm font-medium rounded-md bg-lime-400 dark:bg-lime-400 text-black hover:bg-lime-500 dark:hover:bg-lime-500 transition-colors">
            Apply
          </button>
          <button className="w-full px-3 py-2 text-sm font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            Reset
          </button>
        </div>
      </SectionWithTitle>
    </div>
  );
};
