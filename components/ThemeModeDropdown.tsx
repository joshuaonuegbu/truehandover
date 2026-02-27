import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Sun, Moon, Monitor, ChevronDown, Check } from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeModeDropdownProps = {
    themeMode: ThemeMode;
    onChange: (mode: ThemeMode) => void;
    isDarkMode: boolean;
    compact?: boolean;
    align?: 'left' | 'right';
    className?: string;
    buttonClassName?: string;
    menuClassName?: string;
    mobileLabel?: string;
};

const options: { mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'system', label: 'System', icon: Monitor },
];

const ThemeModeDropdown: React.FC<ThemeModeDropdownProps> = ({
    themeMode,
    onChange,
    isDarkMode,
    compact = false,
    align = 'right',
    className = '',
    buttonClassName = '',
    menuClassName = '',
    mobileLabel = 'Theme',
}) => {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 188 });
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const activeOption = useMemo(() => options.find((option) => option.mode === themeMode) || options[2], [themeMode]);
    const ActiveIcon = activeOption.icon;

    const updateMenuPosition = () => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const menuWidth = Math.max(176, Math.min(220, rect.width + 76));
        const viewportPadding = 8;
        const desiredLeft = align === 'left' ? rect.left : rect.right - menuWidth;
        const left = Math.min(
            Math.max(viewportPadding, desiredLeft),
            window.innerWidth - menuWidth - viewportPadding
        );
        const top = Math.min(rect.bottom + 8, window.innerHeight - 8);

        setPosition({ top, left, width: menuWidth });
    };

    useEffect(() => {
        if (!open) return;

        updateMenuPosition();

        const handleOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (triggerRef.current?.contains(target)) return;
            if (menuRef.current?.contains(target)) return;
            setOpen(false);
        };

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };

        const handleRelayout = () => updateMenuPosition();

        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('touchstart', handleOutside, { passive: true });
        document.addEventListener('keydown', handleKey);
        window.addEventListener('resize', handleRelayout);
        window.addEventListener('scroll', handleRelayout, true);

        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('touchstart', handleOutside);
            document.removeEventListener('keydown', handleKey);
            window.removeEventListener('resize', handleRelayout);
            window.removeEventListener('scroll', handleRelayout, true);
        };
    }, [open]);

    return (
        <div className={`relative ${className}`}>
            <button
                ref={triggerRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className={buttonClassName}
            >
                <ActiveIcon className="w-4 h-4" />
            </button>

            {open && ReactDOM.createPortal(
                <div
                    ref={menuRef}
                    role="menu"
                    className={`fixed z-[210] rounded-xl border shadow-2xl p-1.5 ${isDarkMode ? 'bg-[#161622] border-white/10' : 'bg-white border-slate-200'} ${menuClassName}`}
                    style={{ top: position.top, left: position.left, width: position.width }}
                >
                    {options.map((option) => {
                        const Icon = option.icon;
                        const isActive = option.mode === themeMode;

                        return (
                            <button
                                key={option.mode}
                                type="button"
                                role="menuitemradio"
                                aria-checked={isActive}
                                onClick={() => {
                                    onChange(option.mode);
                                    setOpen(false);
                                }}
                                className={`w-full h-10 px-3 rounded-lg flex items-center gap-2.5 text-left transition-all ${isActive
                                    ? (isDarkMode ? 'bg-white/12 text-white ring-1 ring-white/15' : 'bg-slate-100 text-slate-900 ring-1 ring-slate-200')
                                    : (isDarkMode ? 'text-slate-300 hover:bg-white/8 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                                    }`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span className="text-[11px] font-bold uppercase tracking-widest flex-1">{option.label}</span>
                                {isActive && <Check className="w-3.5 h-3.5" />}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </div>
    );
};

export default ThemeModeDropdown;
