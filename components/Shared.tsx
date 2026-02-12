
import React from 'react';

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
                relative glass-panel rounded-3xl dark:rounded-[2.5rem]
                ${noPadding ? '' : 'p-6 md:p-8'} 
                ${hoverEffect ? 'hover:scale-[1.01] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] dark:hover:shadow-[#bef264]/5 hover:-translate-y-1 transition-all duration-300' : ''}
                dark:ring-1 dark:ring-white/5
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
        emerald: 'bg-lime-600 text-white shadow-lg shadow-lime-600/20 dark:bg-[#bef264] dark:text-black dark:shadow-[0_0_15px_rgba(190,242,100,0.4)]',
        lime: 'bg-lime-600 text-white shadow-lg shadow-lime-600/20 dark:bg-[#bef264] dark:text-black dark:shadow-[0_0_15px_rgba(190,242,100,0.4)]',
        orange: 'bg-[#fb923c] text-white shadow-[0_0_15px_rgba(251,146,60,0.4)]',
        white: 'bg-white text-black shadow-lg',
        gray: 'bg-slate-200 dark:bg-[#1E1F30] text-slate-600 dark:text-slate-300',
        black: 'bg-black text-white shadow-[0_0_15px_rgba(0,0,0,0.4)]'
    };
    return (
        <span className={`${colors[color === 'emerald' ? 'lime' : color]} px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md`}>
            {children}
        </span>
    );
};