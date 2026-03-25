import React from 'react';

type BrandLogoProps = {
    className?: string;
    accentColor?: string;
    strokeWidth?: number;
};

const BrandLogo = ({ className = 'w-8 h-8', accentColor = '#a3e635', strokeWidth = 1.5 }: BrandLogoProps) => (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M4 15C6.13 9.5 10.75 6.75 14.13 10.13C15.25 11.25 15.63 12.63 16 12.63C16.38 12.63 16.75 11.25 17.88 10.13C21.25 6.75 25.88 9.5 28 15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        <circle cx="12" cy="22" r="6" stroke="currentColor" strokeWidth={strokeWidth} />
        <circle cx="20" cy="22" r="6" fill={accentColor} stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
);

export default BrandLogo;
