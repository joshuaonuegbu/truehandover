const fs = require('fs');

let content = fs.readFileSync('components/CreatorPage.tsx', 'utf8');

// Width update
content = content.replace(/w-\[21\.25%\] min-w-\[288px\]/g, 'w-[25%] lg:w-[28%] min-w-[340px] max-w-[480px]');

// We remove the old hf-surface and inject the noise and glow at the start.
const regex = /<div className="hf-surface bg-white dark:bg-charcoal border border-zinc-200\/50 dark:border-white\/\[0\.06\] p-5 rounded-\[2rem\] shadow-sm dark:shadow-md overflow-hidden(?: relative)?">/g;

const safeReplacement = `<div className="hf-surface bg-white dark:bg-charcoal border border-zinc-200/50 dark:border-white/[0.06] p-6 lg:p-8 rounded-[2rem] shadow-sm dark:shadow-md overflow-hidden relative group transition-all">
                        <div className="absolute inset-0 pointer-events-none rounded-[2rem] opacity-[0.04] dark:opacity-[0.04] z-0" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat' }} />
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-300/10 dark:bg-brand/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-blue-300/20 dark:group-hover:bg-brand/10 transition-colors duration-500 z-0" />`;

content = content.replace(regex, safeReplacement);

// Make sure the inner elements like `relative z-10` exist, OR they just sit there natively (which works perfectly fine for bg/glow since they're absolute + z-0 + pointer-events-none)
// One note: inside "Layout Selector", the code already had `<div className="relative z-10">` manually added. That's totally fine.

fs.writeFileSync('components/CreatorPage.tsx', content);

console.log('CreatorPage updated successfully');
