
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Monitor, Smartphone, Tablet, RotateCw, RefreshCw, Sun, Moon, Maximize2, ChevronLeft, Circle, RectangleHorizontal, Eye, EyeOff, Settings2, Signal, BatteryFull, Wifi } from 'lucide-react';
import { Project, FileAsset, UserProfile } from '../types';
import { playClick, playSuccess } from '../utils/sound';
import { ClientPreviewPage } from './ClientPreviewPage';
import { PaymentService } from '../api/mockBackend';

// --- DEVICE DEFINITIONS ---
const DEVICES = {
    tablet: { w: 820, h: 1180, name: 'iPad Air', bezelRadius: '2.5rem', bezelWidth: 8 },
    mobile: { w: 393, h: 852, name: 'iPhone 15 Pro', bezelRadius: '3.5rem', bezelWidth: 8 },
    foldable: { w: 717, h: 952, name: 'Galaxy Z Fold', bezelRadius: '1.5rem', bezelWidth: 6 },
};

type DeviceMode = 'desktop' | 'tablet' | 'mobile' | 'foldable';
type FrameOption = 'dynamicIsland' | 'cameraDot' | 'none';

// --- MOCK STATUS BAR COMPONENT ---
const MockStatusBar = ({ width, isDark, heightPx }: { width: number; isDark: boolean; heightPx: number }) => {
    const textColor = isDark ? 'text-white' : 'text-black';
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return (
        <div
            className={`absolute top-0 left-0 right-0 z-[65] flex items-center justify-between px-6 ${textColor} pointer-events-none`}
            style={{
                fontSize: width < 500 ? '12px' : '13px',
                fontWeight: 600,
                letterSpacing: '0.01em',
                height: `${heightPx}px`,
                // In light mode, the status bar should read as a "white" bar like iOS.
                backgroundColor: isDark ? 'transparent' : 'rgba(241,245,249,0.96)',
            }}
        >
            <span>{timeStr}</span>
            <div className="flex items-center gap-1.5" style={{ fontSize: width < 500 ? '10px' : '11px' }}>
                <Signal className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span className="font-bold tracking-wide">5G</span>
                <Wifi className="w-3.5 h-3.5" strokeWidth={2.5} />
                <BatteryFull className="w-4.5 h-3.5" strokeWidth={2.5} />
            </div>
        </div>
    );
};

interface ClientPreviewBizProps {
    project: Project;
    onBack: () => void;
    isDarkMode: boolean;
    themeMode?: 'light' | 'dark' | 'system';
    onToggleTheme: () => void;
    onSetThemeMode?: (mode: 'light' | 'dark' | 'system') => void;
    user?: UserProfile;
    isEmbedded?: boolean;
    allowSidebarCollapse?: boolean;
}

const ClientPreviewBiz: React.FC<ClientPreviewBizProps> = ({
    project: initialProject,
    onBack,
    isDarkMode,
    onToggleTheme,
    onSetThemeMode,
    themeMode,
    user,
    isEmbedded = false,
    allowSidebarCollapse = false
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [project, setProject] = useState<Project>(initialProject);
    const [activeFilter, setActiveFilter] = useState<'all' | 'image' | 'doc' | 'video' | 'audio' | 'archive'>('all');

    // --- DEVICE MODE STATE ---
    const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [frameOption, setFrameOption] = useState<FrameOption>('dynamicIsland');
    const [showFrameSettings, setShowFrameSettings] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [scale, setScale] = useState(1);
    const [iframeRefreshKey, setIframeRefreshKey] = useState(0);
    const [iframeLoadedTick, setIframeLoadedTick] = useState(0);

    // --- TRANSITION STATE for smooth desktop <-> device switching ---
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [pendingMode, setPendingMode] = useState<DeviceMode | null>(null);
    const [isDesktopFadingIn, setIsDesktopFadingIn] = useState(false);
    const [iframeThemeIsDark, setIframeThemeIsDark] = useState<boolean | null>(null);

    // --- VIEWPORT DETECTION ---
    const [viewportClass, setViewportClass] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    useEffect(() => {
        const updateViewportClass = () => {
            const w = window.innerWidth;
            if (w < 640) setViewportClass('mobile');
            else if (w < 1024) setViewportClass('tablet');
            else setViewportClass('desktop');
        };
        updateViewportClass();
        window.addEventListener('resize', updateViewportClass);
        return () => window.removeEventListener('resize', updateViewportClass);
    }, []);

    // Derived Values
    const isLocked = project.status !== 'paid' && project.status !== 'completed';
    const isRawMode = searchParams.get('raw') === '1';
    const resolvedThemeMode: 'light' | 'dark' | 'system' = themeMode || 'system';
    const isDarkForStatusBar = resolvedThemeMode === 'dark' || (resolvedThemeMode === 'system' && isDarkMode);
    const statusBarIsDark = iframeThemeIsDark ?? isDarkForStatusBar;

    // State
    const [accessDenied, setAccessDenied] = useState(false);

    // Lightbox State Management
    const [internalLightboxIndex, setInternalLightboxIndex] = useState<number | null>(null);
    const assetParam = searchParams.get('asset');
    const parsedIndex = assetParam ? parseInt(assetParam, 10) : null;
    const lightboxIndex = isEmbedded
        ? internalLightboxIndex
        : (Number.isFinite(parsedIndex) ? parsedIndex : null);

    // Revisions Logic
    interface Revision { text: string; timestamp: Date; }
    const [revisions, setRevisions] = useState<Record<string, Revision[]>>({});

    // Sync state if prop changes (important for Creator Editor live preview)
    useEffect(() => { setProject(initialProject); }, [initialProject]);

    // Theme bridge: when the preview runs inside an iframe, its local theme toggles do not automatically
    // affect the outer simulator chrome. Listen for theme updates so the mock status bar always matches.
    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            const data = event.data as any;
            if (!data || typeof data.type !== 'string') return;

            // Child (iframe) -> parent: keep mock status bar in sync with the preview theme.
            if (data.type === 'TRUEHANDOVER_PREVIEW_THEME') {
                if (typeof data.isDarkMode !== 'boolean') return;
                setIframeThemeIsDark(data.isDarkMode);
                return;
            }

            // Parent (creator/editor) -> child: push live project edits into the canvas iframe so it stays in sync.
            if (data.type === 'TRUEHANDOVER_PREVIEW_SET_PROJECT') {
                if (!data.project) return;
                setProject(data.project as Project);
                return;
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    // If the canvas toggles theme/device, let the status bar follow the canvas immediately
    // (the iframe will re-report its theme after reload).
    useEffect(() => {
        setIframeThemeIsDark(null);
    }, [deviceMode, themeMode]);

    // Access Control Logic (One-Time Links)
    useEffect(() => {
        if (isEmbedded) { setAccessDenied(false); return; }
        const checkAccess = () => {
            if (project.accessConfig?.mode === 'one_time') {
                const viewedKey = `viewed_${project.id}`;
                const hasViewed = localStorage.getItem(viewedKey);
                if (hasViewed) { setAccessDenied(true); }
                else { localStorage.setItem(viewedKey, 'true'); }
            }
        };
        checkAccess();
    }, [project.id, project.accessConfig, isEmbedded]);

    // Lightbox handler
    const handleSetLightboxIndex = (index: number | null) => {
        if (isEmbedded) { setInternalLightboxIndex(index); return; }
        if (index !== null) {
            const isReplacing = searchParams.get('asset') !== null;
            // Preserve existing params (pt/pb/theme/device/etc) so the simulated safe-area + theming remain stable.
            const next = new URLSearchParams(searchParams);
            next.set('asset', index.toString());
            setSearchParams(next, { replace: isReplacing, state: location.state });
        } else {
            if (searchParams.get('asset')) { navigate(-1); }
        }
    };

    const handleSubmitRevision = (text: string) => {
        if (lightboxIndex === null) return;
        const fileId = filteredFiles[lightboxIndex].id;
        setRevisions(prev => ({ ...prev, [fileId]: [...(prev[fileId] || []), { text, timestamp: new Date() }] }));
        playSuccess();
    };

    const handleDeleteRevision = (index: number) => {
        if (lightboxIndex === null) return;
        const fileId = filteredFiles[lightboxIndex].id;
        playClick();
        setRevisions(prev => { const updated = [...(prev[fileId] || [])]; updated.splice(index, 1); return { ...prev, [fileId]: updated }; });
    };

    // --- PAYMENT & UNLOCK LOGIC ---
    const handlePaymentComplete = async (method?: any) => {
        if (isEmbedded) return;
        if (method === 'manual') { setProject(prev => ({ ...prev, status: 'payment_verification' })); playSuccess(); return; }
        if (project.status === 'payment_verification') {
            const result = await PaymentService.verifyManualPayment(project.id);
            if (result.success) { unlockProject(); }
        } else { unlockProject(); }
    };

    const unlockProject = () => {
        setProject(prev => ({
            ...prev, status: 'paid',
            files: prev.files.map(f => ({ ...f, locked: false, downloadUrl: f.externalUrl ? f.externalUrl : `https://vault-cdn.truehandover.com/secure/${f.id}?sig=${Math.random().toString(36).substring(7)}&exp=${Date.now() + 3600000}` }))
        }));
        playSuccess();
    }

    const handleRequestCorrection = (index: number) => { playClick(); handleSetLightboxIndex(index); };

    // Filter Logic
    const filteredFiles = project.files.filter(f => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'image') return f.type === 'image' || f.type === 'design';
        if (activeFilter === 'doc') return f.type === 'pdf';
        if (activeFilter === 'video') return f.type === 'video';
        if (activeFilter === 'audio') return f.type === 'audio';
        if (activeFilter === 'archive') return f.type === 'archive';
        return true;
    });

    // Theme construction with safe defaults
    const defaultTheme = {
        wallpaper: 'https://images.unsplash.com/photo-1487700160041-babef9c3cb55?q=80&w=2000&auto=format&fit=crop',
        name: 'Default', brightness: 'dark', pattern: 'lines', showGrain: true
    };
    const theme = { ...defaultTheme, ...(project.theme || {}) };
    if (project.theme?.showGrain !== undefined) theme.showGrain = project.theme.showGrain;

    // --- Smooth device mode switching ---
    const switchDevice = useCallback((newMode: DeviceMode) => {
        playClick();
        setShowFrameSettings(false); // Always retract frame options
        setIsDesktopFadingIn(false);

        if (deviceMode === 'desktop' && newMode !== 'desktop') {
            // Going from desktop to a simulated device — fade/scale in so it doesn't "pop" on.
            setIsTransitioning(true);
            setDeviceMode(newMode);
            if (newMode === 'foldable') setOrientation('landscape');
            else setOrientation('portrait');
            requestAnimationFrame(() => {
                setTimeout(() => setIsTransitioning(false), 30);
            });
        } else if (deviceMode !== 'desktop' && newMode === 'desktop') {
            // Going from simulated device back to desktop — animate out first
            setIsTransitioning(true);
            setPendingMode(newMode);
            setTimeout(() => {
                setDeviceMode(newMode);
                setOrientation('portrait');
                setIsTransitioning(false);
                setPendingMode(null);
                setIsDesktopFadingIn(true);
                setTimeout(() => setIsDesktopFadingIn(false), 450);
            }, 300);
        } else {
            // Switching between simulated devices
            setDeviceMode(newMode);
            if (newMode === 'foldable') setOrientation('landscape');
            else setOrientation('portrait');
        }
    }, [deviceMode]);

    // Simulator exit bridge: if the iframe requests an exit (e.g. via its Back button), return to desktop mode.
    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            const data = event.data as any;
            if (!data || data.type !== 'TRUEHANDOVER_SIM_EXIT') return;
            if (deviceMode !== 'desktop') switchDevice('desktop');
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [deviceMode, switchDevice]);

    // --- DEVICE CANVAS: Responsive Scaling ---
    useEffect(() => {
        if (deviceMode === 'desktop' || isRawMode) return;
        const device = DEVICES[deviceMode as keyof typeof DEVICES];
        if (!device) return;
        const frameW = orientation === 'portrait' ? device.w : device.h;
        const frameH = orientation === 'portrait' ? device.h : device.w;

        const updateScale = () => {
            if (!canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const s = Math.min((rect.width - 80) / frameW, (rect.height - 60) / frameH, 1);
            setScale(Math.max(s, 0.2));
        };

        updateScale();
        const ro = new ResizeObserver(updateScale);
        if (canvasRef.current) ro.observe(canvasRef.current);
        window.addEventListener('resize', updateScale);
        return () => { ro.disconnect(); window.removeEventListener('resize', updateScale); };
    }, [deviceMode, orientation, isRawMode]);

    // Construct iframe URL — include safe-area padding params
    const statusBarHeightPx =
        deviceMode === 'mobile' && orientation === 'portrait' ? 44 :
            deviceMode === 'mobile' && orientation === 'landscape' ? 24 :
                deviceMode === 'tablet' && orientation === 'portrait' ? 32 :
                    deviceMode === 'tablet' && orientation === 'landscape' ? 24 :
                        deviceMode === 'foldable' && orientation === 'portrait' ? 32 :
                            24;

    const iframeSrc = useMemo(() => {
        const base = window.location.origin + window.location.pathname;
        return `${base}#/preview/${project.id}?raw=1&theme=${themeMode || 'system'}&pt=${statusBarHeightPx}&pb=20&device=${deviceMode}`;
    }, [project.id, themeMode, deviceMode, statusBarHeightPx]);

    // Live-sync the canvas iframe with the current project data (important for Creator/editor embedded previews).
    useEffect(() => {
        if (deviceMode === 'desktop' || isRawMode || viewportClass === 'mobile') return;
        const target = iframeRef.current?.contentWindow;
        if (!target) return;
        target.postMessage({ type: 'TRUEHANDOVER_PREVIEW_SET_PROJECT', project }, window.location.origin);
    }, [deviceMode, orientation, iframeRefreshKey, iframeLoadedTick, project, isRawMode, viewportClass]);

    // --- RENDER: ClientPreviewPage (props bundle) ---
    const handlePreviewBack = useCallback(() => {
        // Inside the simulator iframe, "Back" should exit the simulation rather than navigating within the app.
        // This prevents creators from accidentally landing in /vault or other admin routes in the iframe.
        if (isRawMode) {
            try {
                window.parent.postMessage({ type: 'TRUEHANDOVER_SIM_EXIT' }, window.location.origin);
            } catch { }
            return;
        }
        onBack();
    }, [isRawMode, onBack]);

    const previewProps = {
        project, user, isDarkMode,
        themeMode: themeMode || 'system' as const,
        onToggleTheme, onBack: handlePreviewBack, isEmbedded, isLocked, lightboxIndex,
        setLightboxIndex: handleSetLightboxIndex, revisions,
        onPaymentComplete: handlePaymentComplete,
        handleSubmitRevision, handleDeleteRevision,
        activeFilter, setActiveFilter, theme, filteredFiles,
        handleRequestCorrection, accessDenied,
        refreshAccess: () => { localStorage.removeItem(`viewed_${project.id}`); window.location.reload(); },
        allowSidebarCollapse
    };

    // --- RAW MODE: Render component directly (used inside iframes) ---
    if (isRawMode) {
        return <ClientPreviewPage {...previewProps} />;
    }

    // --- VIEWPORT-AWARE DEVICE MODE RULES ---
    // Mobile viewport: no canvas at all, render page directly, hide device pill
    if (viewportClass === 'mobile') {
        return <ClientPreviewPage {...previewProps} />;
    }

    // --- DESKTOP MODE (direct render + floating pill) ---
    if (deviceMode === 'desktop' && !isTransitioning) {
        // Build available device options based on viewport class
        const deviceOptions: { mode: DeviceMode; icon: any; label: string }[] = [];
        if (viewportClass === 'desktop') {
            deviceOptions.push({ mode: 'desktop', icon: Monitor, label: 'Desktop' });
            deviceOptions.push({ mode: 'mobile', icon: Smartphone, label: 'Mobile' });
            deviceOptions.push({ mode: 'tablet', icon: Tablet, label: 'Tablet' });
        } else {
            // Real tablet viewport: "Tablet" should mean the real responsive view (not a simulated canvas).
            deviceOptions.push({ mode: 'mobile', icon: Smartphone, label: 'Mobile' });
            deviceOptions.push({ mode: 'desktop', icon: Tablet, label: 'Tablet' });
        }

        return (
            // Match the preview page background immediately to avoid a white flash between mode switches.
            <div className={`relative w-full h-full ${isDarkMode ? 'bg-[#0f0f15]' : 'bg-[#FDFDFD]'}`}>
                <ClientPreviewPage {...previewProps} />
                {/* Fade-out dark overlay to prevent a bright flash when returning from the simulator */}
                {isDesktopFadingIn && (
                    <div
                        className="absolute inset-0 z-[70] pointer-events-none bg-[#0f0f15] animate-fade-in"
                        style={{ animationDirection: 'reverse', animationDuration: '0.45s' }}
                    />
                )}
                {/* Floating Device Mode Switcher */}
                <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-1 bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <span className="px-2 text-[10px] font-bold uppercase tracking-widest text-white/50 select-none">
                        Preview
                    </span>
                    <div className="w-px h-6 bg-white/10 mx-0.5" />
                    {deviceOptions.map(({ mode, icon: Icon, label }) => (
                        <button key={mode} aria-label={label} title={label}
                            onClick={() => switchDevice(mode)}
                            className={`p-2.5 rounded-xl transition-all ${deviceMode === mode ? 'bg-white/15 text-white shadow-sm' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                        ><Icon className="w-4 h-4" /></button>
                    ))}
                </div>
            </div>
        );
    }

    // --- DEVICE CANVAS MODE (Tablet / Mobile / Foldable) ---
    const device = DEVICES[deviceMode as keyof typeof DEVICES] || DEVICES.mobile;
    const frameW = orientation === 'portrait' ? device.w : device.h;
    const frameH = orientation === 'portrait' ? device.h : device.w;

    const isMobile = deviceMode === 'mobile';
    const isPortrait = orientation === 'portrait';
    const isFoldable = deviceMode === 'foldable';

    // NOTE: Keep this as a plain derived value (not a hook). This component has early returns
    // (desktop/raw/mobile-viewport paths). A hook here would break hook ordering when switching modes.
    const deviceLabel =
        !isMobile
            ? device.name
            : frameOption === 'dynamicIsland'
                ? 'iPhone 15 Pro'
                : frameOption === 'cameraDot'
                    ? 'Samsung S25'
                    : 'Responsive';

    // Build available device options based on viewport class
    const canvasDeviceOptions: { mode: DeviceMode; icon: any; label: string }[] = [];
    if (viewportClass === 'desktop') {
        canvasDeviceOptions.push({ mode: 'desktop', icon: Monitor, label: 'Desktop' });
        canvasDeviceOptions.push({ mode: 'mobile', icon: Smartphone, label: 'Mobile' });
        canvasDeviceOptions.push({ mode: 'tablet', icon: Tablet, label: 'Tablet' });
        canvasDeviceOptions.push({ mode: 'foldable', icon: RectangleHorizontal, label: 'Foldable' });
    } else {
        // Real tablet viewport: allow exiting the simulator back to the real responsive view via the Tablet icon.
        canvasDeviceOptions.push({ mode: 'mobile', icon: Smartphone, label: 'Mobile' });
        canvasDeviceOptions.push({ mode: 'desktop', icon: Tablet, label: 'Tablet' });
        canvasDeviceOptions.push({ mode: 'foldable', icon: RectangleHorizontal, label: 'Foldable' });
    }

    return (
        <div className={`w-full ${isEmbedded ? 'h-full' : 'h-[100dvh]'} flex flex-col relative overflow-hidden select-none`}
            style={{ background: 'linear-gradient(145deg, #1a1a24 0%, #141420 30%, #0f0f1a 60%, #1a1a26 100%)' }}
        >
            {/* === CANVAS BACKGROUND TEXTURE === */}
            <div className="absolute inset-0 opacity-[0.35] pointer-events-none mix-blend-soft-light"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
            />
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_45%,_rgba(190,242,100,0.04)_0%,_transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.5)_100%)] pointer-events-none" />

            {/* Fade only the foreground UI during transitions to avoid flashing the page background */}
            <div className={`relative z-10 flex flex-col w-full h-full transition-all duration-300 ease-out ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>

            {/* === FLOATING TOOLBAR === */}
            <div className="relative z-50 flex items-center justify-center pt-4 pb-2 gap-2 px-4 shrink-0 flex-wrap">
                {/* Back button */}
                {!isEmbedded && (
                    <button onClick={() => { playClick(); switchDevice('desktop'); }}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80 transition-all backdrop-blur-xl shadow-sm"
                        title="Exit Preview"
                    ><ChevronLeft className="w-4 h-4" /></button>
                )}

                {/* Main toolbar pill */}
                <div className="flex items-center gap-1 bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                    {/* Device Switcher */}
                    {canvasDeviceOptions.map(({ mode, icon: Icon, label }) => (
                        <button key={mode} aria-label={label} title={label}
                            onClick={() => switchDevice(mode)}
                            className={`p-2.5 rounded-xl transition-all duration-200 ${deviceMode === mode
                                ? 'bg-white/15 text-white shadow-sm'
                                : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                                }`}
                        ><Icon className="w-4 h-4" /></button>
                    ))}

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    {/* Orientation Toggle */}
                    <button
                        onClick={() => { playClick(); setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait'); }}
                        className={`p-2.5 rounded-xl transition-all ${orientation === 'landscape' ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
                        title={isPortrait ? 'Switch to Landscape' : 'Switch to Portrait'}
                    >
                        <RotateCw className={`w-4 h-4 transition-transform duration-300 ${orientation === 'landscape' ? 'rotate-90' : ''}`} />
                    </button>

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    {/* Theme Toggle */}
                    {/* Theme toggles (canvas: Light/Dark only — no System mode) */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => { playClick(); onSetThemeMode?.('light'); }}
                            className={`p-2.5 rounded-xl transition-all ${!isDarkMode ? 'bg-white/15 text-white shadow-sm' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
                            title="Light Mode"
                            aria-label="Light Mode"
                        >
                            <Sun className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => { playClick(); onSetThemeMode?.('dark'); }}
                            className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-white/15 text-white shadow-sm' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
                            title="Dark Mode"
                            aria-label="Dark Mode"
                        >
                            <Moon className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Frame Options Toggle (mobile only) */}
                    {isMobile && (
                        <>
                            <div className="w-px h-6 bg-white/10 mx-1" />
                            <button onClick={() => { playClick(); setShowFrameSettings(p => !p); }}
                                className={`p-2.5 rounded-xl transition-all ${showFrameSettings ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
                                title="Frame Options"
                            ><Settings2 className="w-4 h-4" /></button>
                        </>
                    )}
                </div>

                {/* Device label pill */}
                <div className="px-4 py-2 bg-white/[0.04] rounded-full text-[10px] font-bold uppercase tracking-widest text-white/30 border border-white/[0.06] font-mono whitespace-nowrap shadow-sm">
                    {deviceLabel} · {frameW}×{frameH}
                </div>

                {/* Refresh button */}
                <button onClick={() => { playClick(); setIframeRefreshKey(k => k + 1); }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/30 hover:text-white/60 transition-all backdrop-blur-xl shadow-sm"
                    title="Refresh Preview"
                ><RefreshCw className="w-4 h-4" /></button>
            </div>

            {/* Frame Options Dropdown (mobile only) */}
            {showFrameSettings && isMobile && (
                <div className="relative z-50 flex justify-center -mt-1 mb-1 px-4 animate-fade-in">
                    <div className="flex items-center gap-1 bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] rounded-xl p-1 shadow-lg">
                        <button onClick={() => { playClick(); setFrameOption('dynamicIsland'); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${frameOption === 'dynamicIsland' ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'}`}
                        >Pill Island</button>
                        <button onClick={() => { playClick(); setFrameOption('cameraDot'); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${frameOption === 'cameraDot' ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'}`}
                        >Camera Dot</button>
                        <button onClick={() => { playClick(); setFrameOption('none'); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${frameOption === 'none' ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'}`}
                        >None</button>
                    </div>
                </div>
            )}

            {/* === DEVICE CANVAS AREA === */}
            <div ref={canvasRef} className="flex-1 flex items-center justify-center relative z-10 pb-4 px-4">
                {/* Canvas Disclaimer (bottom-right, Creator Preview styling) */}
                <div className="absolute bottom-6 right-6 z-[55] pointer-events-none select-none">
                    <div className="px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border bg-amber-500/10 border-amber-500/20 text-amber-400 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview: What Your Client Sees</span>
                    </div>
                </div>
                {/* Scaled device wrapper */}
                <div
                    className="relative transition-all duration-300 ease-out"
                    style={{ width: frameW * scale, height: frameH * scale }}
                >
                    <div
                        className="absolute top-0 left-0 origin-top-left transition-all duration-300 ease-out"
                        style={{ width: frameW, height: frameH, transform: `scale(${scale})` }}
                    >
                        {/* Device shadow */}
                        <div className="absolute inset-0 pointer-events-none" style={{
                            borderRadius: device.bezelRadius,
                            boxShadow: '0 30px 80px -15px rgba(0,0,0,0.6), 0 15px 40px -10px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03), inset 0 0 0 1px rgba(255,255,255,0.03)',
                        }} />

                        {/* Device bezel */}
                        <div className="absolute inset-0 overflow-hidden bg-[#0a0a0e]"
                            style={{ borderRadius: device.bezelRadius, border: `${device.bezelWidth}px solid #222230` }}
                        >
                            {/* === MOCK STATUS BAR === */}
                            <MockStatusBar width={frameW} isDark={statusBarIsDark} heightPx={statusBarHeightPx} />

                            {/* Pill-shaped Dynamic Island — mobile only, portrait only */}
                            {isMobile && isPortrait && frameOption === 'dynamicIsland' && (
                                <div className="absolute top-[12px] left-1/2 -translate-x-1/2 z-[66]">
                                    <div className="w-[120px] h-[34px] bg-[#0a0a0e] rounded-full shadow-[inset_0_0_4px_rgba(0,0,0,0.8)]" />
                                </div>
                            )}

                            {/* Camera Dot — mobile only, portrait only — BIGGER */}
                            {isMobile && isPortrait && frameOption === 'cameraDot' && (
                                <div className="absolute top-[14px] left-1/2 -translate-x-1/2 z-[66]">
                                    <div className="w-4 h-4 rounded-full bg-[#050508] ring-2 ring-[#1a1a20] shadow-[inset_0_1px_3px_rgba(255,255,255,0.05)]" />
                                </div>
                            )}

                            {/* Foldable crease — MORE VISIBLE with hinge effect */}
                            {isFoldable && isPortrait && (
                                <>
                                    <div className="absolute top-1/2 -translate-y-[1px] left-0 right-0 z-[60] pointer-events-none h-[3px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                    <div className="absolute top-1/2 translate-y-[2px] left-0 right-0 z-[60] pointer-events-none h-[1px] bg-gradient-to-r from-transparent via-black/40 to-transparent" />
                                </>
                            )}
                            {isFoldable && !isPortrait && (
                                <>
                                    <div className="absolute left-1/2 -translate-x-[1px] top-0 bottom-0 z-[60] pointer-events-none w-[3px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                                    <div className="absolute left-1/2 translate-x-[2px] top-0 bottom-0 z-[60] pointer-events-none w-[1px] bg-gradient-to-b from-transparent via-black/40 to-transparent" />
                                </>
                            )}

                            {/* Home indicator bar — mobile only, portrait */}
                            {isMobile && isPortrait && (
                                <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 z-[60] w-[120px] h-[4px] rounded-full bg-white/20" />
                            )}

                            {/* The iframe */}
                            <iframe
                                key={`${deviceMode}-${orientation}-${themeMode}-${iframeRefreshKey}`}
                                src={iframeSrc}
                                className="w-full h-full border-0"
                                title={`${deviceLabel} Preview`}
                                ref={iframeRef}
                                onLoad={() => setIframeLoadedTick(t => t + 1)}
                                style={{
                                    borderRadius: `calc(${device.bezelRadius} - ${device.bezelWidth}px)`,
                                    backgroundColor: isDarkMode ? '#0f0f15' : '#ffffff',
                                }}
                            />
                        </div>

                        {/* Side buttons — mobile */}
                        {isMobile && isPortrait && (
                            <>
                                <div className="absolute top-[110px] -right-[3px] w-[3px] h-[44px] rounded-full bg-[#222230]" />
                                <div className="absolute top-[100px] -left-[3px] w-[3px] h-[28px] rounded-full bg-[#222230]" />
                                <div className="absolute top-[138px] -left-[3px] w-[3px] h-[28px] rounded-full bg-[#222230]" />
                                <div className="absolute top-[72px] -left-[3px] w-[3px] h-[18px] rounded-full bg-[#222230]" />
                            </>
                        )}

                        {/* Side buttons — tablet */}
                        {deviceMode === 'tablet' && isPortrait && (
                            <>
                                <div className="absolute -top-[3px] right-[70px] h-[3px] w-[28px] rounded-full bg-[#222230]" />
                                <div className="absolute top-[80px] -right-[3px] w-[3px] h-[28px] rounded-full bg-[#222230]" />
                                <div className="absolute top-[118px] -right-[3px] w-[3px] h-[28px] rounded-full bg-[#222230]" />
                            </>
                        )}
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default ClientPreviewBiz;
