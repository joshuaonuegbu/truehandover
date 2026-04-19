import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { playClick } from '../utils/sound';

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectFieldTone = 'default' | 'charcoal' | 'slate' | 'minimal';

type SelectFieldProps = {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    tone?: SelectFieldTone;
    /** `sm` for compact toolbars (h-10, text-xs) */
    size?: 'sm' | 'md';
    buttonClassName?: string;
    listClassName?: string;
};

const toneButton: Record<SelectFieldTone, string> = {
    default:
        'bg-white dark:bg-[#1c1c24] border-zinc-200/80 dark:border-white/12 text-zinc-900 dark:text-zinc-50 hover:border-lime-500/40 dark:hover:border-lime-400/35',
    charcoal:
        'bg-white dark:bg-white/5 border-zinc-200/70 dark:border-white/10 text-zinc-900 dark:text-white hover:border-lime-500/40 dark:hover:border-lime-400/35',
    slate:
        'bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white hover:border-lime-500/40 dark:hover:border-lime-400/35',
    minimal:
        'bg-black/20 dark:bg-black/20 border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:border-lime-500/40 dark:hover:border-lime-400/35',
};

const toneList: Record<SelectFieldTone, string> = {
    default: 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/12',
    charcoal: 'bg-white dark:bg-[#14141a] border-zinc-200/80 dark:border-white/12',
    slate: 'bg-white dark:bg-[#151521] border-slate-200 dark:border-white/[0.08]',
    minimal: 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/12',
};

const toneItem: Record<SelectFieldTone, string> = {
    default: 'text-zinc-900 dark:text-zinc-100',
    charcoal: 'text-zinc-900 dark:text-zinc-50',
    slate: 'text-slate-900 dark:text-zinc-100',
    minimal: 'text-zinc-900 dark:text-zinc-100',
};

/** Theme-aware dropdown — lime focus ring, readable dark text, list matches surface (replaces native select where used). */
export function SelectField({
    value,
    onChange,
    options,
    placeholder = 'Select…',
    className = '',
    disabled,
    tone = 'default',
    size = 'md',
    buttonClassName = '',
    listClassName = '',
}: SelectFieldProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const listId = useId();

    const selected = options.find((o) => o.value === value);
    const display = selected?.label ?? placeholder;

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        if (open) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    const pick = (v: string, opt?: SelectOption) => {
        if (opt?.disabled) return;
        playClick();
        onChange(v);
        setOpen(false);
    };

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <button
                type="button"
                disabled={disabled}
                id={listId}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => {
                    if (disabled) return;
                    playClick();
                    setOpen((o) => !o);
                }}
                className={`w-full rounded-xl border px-3 pr-10 text-left font-medium flex items-center justify-between gap-2 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-lime-400/90 dark:focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8fafc] dark:focus-visible:ring-offset-[#0f0f15] ${size === 'sm' ? 'h-10 text-xs' : 'h-11 text-sm'} ${toneButton[tone]} ${buttonClassName}`}
            >
                <span className="truncate">{display}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 text-zinc-500 dark:text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <ul
                    role="listbox"
                    aria-labelledby={listId}
                    className={`absolute left-0 right-0 top-[calc(100%+4px)] z-[80] max-h-56 overflow-y-auto rounded-xl border py-1 shadow-xl shadow-black/10 dark:shadow-black/50 ${toneList[tone]} ${listClassName}`}
                >
                    {options.map((opt) => {
                        const active = opt.value === value;
                        return (
                            <li key={`${opt.value}-${opt.label}`} role="option" aria-selected={active}>
                                <button
                                    type="button"
                                    disabled={opt.disabled}
                                    onClick={() => pick(opt.value, opt)}
                                    className={`w-full px-3 text-left flex items-center justify-between gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${size === 'sm' ? 'py-2 text-xs' : 'py-2.5 text-sm'} ${
                                        active
                                            ? 'bg-lime-400/20 text-zinc-950 dark:text-white dark:bg-lime-400/15'
                                            : `${toneItem[tone]} hover:bg-zinc-100 dark:hover:bg-white/10`
                                    }`}
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {active && <Check className="w-4 h-4 shrink-0 text-lime-700 dark:text-lime-400" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
