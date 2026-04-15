import React from 'react';

type BrandLogoProps = {
    className?: string;
    accentColor?: string;
    strokeWidth?: number;
};

const BrandLogo = ({ className = 'w-8 h-8', accentColor = 'var(--color-brand)', strokeWidth = 1.5 }: BrandLogoProps) => (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M4 15C4 10.6 9.4 7 16 7C22.6 7 28 10.6 28 15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        <circle cx="12" cy="22" r="6" stroke="currentColor" strokeWidth={strokeWidth} />
        <circle cx="20" cy="22" r="6" fill={accentColor} stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
);

export default BrandLogo;
