import { useEffect, useState } from 'react';

/** Brand chart / SVG stroke: light #a3e635, dark #bef264. */
export function useUiAccentHex(): '#a3e635' | '#bef264' {
    const [hex, setHex] = useState<'#a3e635' | '#bef264'>(() =>
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? '#bef264' : '#a3e635'
    );
    useEffect(() => {
        const root = document.documentElement;
        const sync = () => setHex(root.classList.contains('dark') ? '#bef264' : '#a3e635');
        sync();
        const mo = new MutationObserver(sync);
        mo.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => mo.disconnect();
    }, []);
    return hex;
}
