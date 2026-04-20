export const UI_ACCENT = {
    dark: {
        solid: '#bef264',
        hover: '#d9f99d',
        glow: 'rgba(190, 242, 100, 0.5)',
    },
    light: {
        solid: '#a3e635',
        hover: '#84cc16',
        glow: 'rgba(163, 230, 53, 0.5)',
    },
} as const;

export const accentButtonClass = (isDarkMode: boolean) =>
    isDarkMode
        ? 'bg-[#bef264] hover:bg-[#d9f99d] text-zinc-950'
        : 'bg-[#a3e635] hover:bg-[#84cc16] text-zinc-950';

export const accentDotClass = (isDarkMode: boolean) =>
    isDarkMode ? 'bg-[#bef264]' : 'bg-[#a3e635]';

export const accentCssVars = (isDarkMode: boolean) => {
    const accent = isDarkMode ? UI_ACCENT.dark : UI_ACCENT.light;
    return {
        '--color-brand': accent.solid,
        '--color-brand-hover': accent.hover,
        '--color-brand-glow': accent.glow,
        '--color-blue-400': accent.solid,
        '--color-blue-500': accent.solid,
        '--color-blue-600': accent.solid,
        '--color-green-400': accent.solid,
        '--color-green-500': accent.solid,
        '--color-green-600': accent.solid,
    } as const;
};
