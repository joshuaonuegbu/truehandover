
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const GRADIENT_TEXT = "text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-600 to-slate-400 dark:from-white dark:via-slate-200 dark:to-slate-500";

interface CardProps {
    children?: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    onClick?: () => void;
    hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = "", noPadding = false, onClick, hoverEffect = true }) => {
    return (
        <div
            onClick={onClick}
            className={`
                relative hf-surface bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] shadow-sm dark:shadow-md rounded-[2rem] overflow-hidden
                ${noPadding ? '' : 'p-6 md:p-8'} 
                ${hoverEffect ? 'hover:-translate-y-1 hover:shadow-md dark:hover:shadow-lg transition-all duration-300' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
};

interface BadgeProps {
    children?: React.ReactNode;
    color?: 'emerald' | 'orange' | 'white' | 'gray' | 'lime' | 'black';
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'lime' }) => {
    const colors = {
        emerald: 'bg-lime-400 text-white shadow-lg shadow-lime-400/20 dark:bg-[#bef264] dark:text-black dark:shadow-[0_0_15px_rgba(190, 242, 100,0.4)]',
        lime: 'bg-lime-400 text-white shadow-lg shadow-lime-400/20 dark:bg-[#bef264] dark:text-black dark:shadow-[0_0_15px_rgba(190, 242, 100,0.4)]',
        orange: 'bg-[#fb923c] text-white shadow-[0_0_15px_rgba(251,146,60,0.4)]',
        white: 'bg-white text-black shadow-lg',
        gray: 'bg-slate-200 dark:bg-[#1E1F30] text-slate-600 dark:text-slate-300',
        black: 'bg-gradient-to-b from-black to-slate-900 text-white shadow-[0_0_15px_rgba(0,0,0,0.4)]'
    };
    return (
        <span className={`${colors[color === 'emerald' ? 'lime' : color]} px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md`}>
            {children}
        </span>
    );
};

interface InlineErrorBannerProps {
    message: string;
    onDismiss?: () => void;
    className?: string;
}

export const InlineErrorBanner: React.FC<InlineErrorBannerProps> = ({ message, onDismiss, className = '' }) => {
    return (
        <div className={`w-full rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-3 flex items-start gap-3 ${className}`} role="alert" aria-live="polite">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-xs font-medium leading-relaxed flex-1">{message}</p>
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="shrink-0 p-1 rounded-full hover:bg-red-500/15 transition-colors"
                    aria-label="Dismiss error"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
};

interface WidgetProps {
    title?: React.ReactNode;
    titleIcon?: React.ElementType;
    titleClassName?: string;
    headerClassName?: string;
    actions?: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
    surfaceless?: boolean;
    compact?: boolean;
}

export const Widget: React.FC<WidgetProps> = ({ title, titleIcon: TitleIcon, titleClassName = '', headerClassName = 'px-6 pt-6 pb-3', actions, className = '', children, surfaceless = false, compact = false }) => {
    const innerPaddingClass = compact ? 'px-4 py-4' : 'px-4 pb-6';
    const headerPaddingClass = compact ? 'px-4 pt-4 pb-3' : headerClassName;

    if (surfaceless) {
        return (
            <div className={className}>
                {(title || actions) && (
                    <div className={`flex items-start justify-between ${headerPaddingClass}`}>
                        <div className="flex min-w-0 items-center gap-3">
                            {TitleIcon && <TitleIcon className="w-5 h-5 shrink-0 opacity-90" />}
                            {typeof title === 'string' ? <h3 className={titleClassName.trim() ? titleClassName : 'text-sm font-bold'}>{title}</h3> : title}
                        </div>
                        {actions && <div className="flex items-center gap-2">{actions}</div>}
                    </div>
                )}
                <div className={innerPaddingClass}>
                    {children}
                </div>
            </div>
        );
    }

    return (
        <Card noPadding={compact} className={className}>
            {(title || actions) && (
                <div className={`flex items-start justify-between ${headerPaddingClass}`}>
                    <div className="flex min-w-0 items-center gap-3">
                        {TitleIcon && <TitleIcon className="w-5 h-5 shrink-0 opacity-90" />}
                        {typeof title === 'string' ? <h3 className={titleClassName.trim() ? titleClassName : 'text-sm font-bold'}>{title}</h3> : title}
                    </div>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}
            <div className={innerPaddingClass}>
                {children}
            </div>
        </Card>
    );
};
