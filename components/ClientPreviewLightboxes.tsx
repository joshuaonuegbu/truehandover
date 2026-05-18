import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Download,
    FileText,
    Image as ImageIcon,
    Info,
    LayoutGrid,
    Minus,
    Monitor,
    MousePointer,
    Plus,
    Search,
    X,
} from 'lucide-react';
import { FileAsset } from '../types';
import { playClick } from '../utils/sound';

export type PortalLightboxVariant = 'default' | 'pro' | 'workstation' | 'canvas' | 'sheet';

type NonDefaultPortalLightboxVariant = Exclude<PortalLightboxVariant, 'default'>;

interface PortalStyleLightboxProps {
    variant: NonDefaultPortalLightboxVariant;
    file: FileAsset;
    allFiles: FileAsset[];
    currentIndex: number;
    isEmbedded?: boolean;
    isLocked: boolean;
    isDarkMode: boolean;
    revisions: any[];
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSelect: (index: number) => void;
    onSubmitRevision: (text: string, pin?: { x: number; y: number }) => void;
}

const inferMediaType = (file: FileAsset): 'image' | 'video' | 'audio' | 'other' => {
    const source = `${file.downloadUrl || file.externalUrl || file.previewUrl || ''}`.toLowerCase();
    const ext = source.split('?')[0].split('.').pop() || '';

    if (file.type === 'image' || file.type === 'design') return 'image';
    if (file.type === 'video' || ['mp4', 'mov', 'm4v', 'webm'].includes(ext)) return 'video';
    if (file.type === 'audio' || ['mp3', 'wav', 'm4a', 'ogg'].includes(ext)) return 'audio';
    return 'other';
};

const getPreviewSrc = (file: FileAsset): string | undefined => {
    if (file.locked) return file.previewUrl;
    return file.downloadUrl || file.externalUrl || file.previewUrl;
};

const getFileIcon = (file: FileAsset) => {
    const media = inferMediaType(file);
    if (media === 'image') return <ImageIcon className="w-12 h-12 opacity-50" />;
    if (media === 'video') return <Monitor className="w-12 h-12 opacity-50" />;
    if (media === 'audio') return <Monitor className="w-12 h-12 opacity-50" />;
    return <FileText className="w-12 h-12 opacity-50" />;
};

const AssetStage = ({ file, isLocked, className = '' }: { file: FileAsset; isLocked: boolean; className?: string }) => {
    const mediaType = inferMediaType(file);
    const src = getPreviewSrc(file);

    if (!src) {
        return (
            <div className={`w-full h-full flex items-center justify-center bg-black/10 ${className}`}>
                {getFileIcon(file)}
            </div>
        );
    }

    if (mediaType === 'video' && !isLocked) {
        return <video src={src} className={`w-full h-full object-contain ${className}`} controls playsInline />;
    }

    if (mediaType === 'audio' && !isLocked) {
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center gap-4 ${className}`}>
                {getFileIcon(file)}
                <audio src={src} controls className="w-[min(90%,520px)]" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={file.name}
            className={`w-full h-full object-contain ${className}`}
        />
    );
};

export const PortalStyleLightbox: React.FC<PortalStyleLightboxProps> = ({
    variant,
    file,
    allFiles,
    currentIndex,
    isEmbedded = false,
    isLocked,
    isDarkMode,
    revisions,
    onClose,
    onNext,
    onPrev,
    onSelect,
    onSubmitRevision,
}) => {
    const [showPanel, setShowPanel] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [revisionText, setRevisionText] = useState('');
    const [loupeOn, setLoupeOn] = useState(false);
    const [loupePos, setLoupePos] = useState({ x: 0, y: 0 });

    const src = useMemo(() => getPreviewSrc(file), [file]);
    const revisionCount = Array.isArray(revisions) ? revisions.length : 0;

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'ArrowRight') onNext();
            if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
            if (e.key === '-' || e.key === '_') setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)));
            if (e.key === '0') setZoom(1);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose, onNext, onPrev]);

    const submitRevision = () => {
        const text = revisionText.trim();
        if (!text) return;
        onSubmitRevision(text);
        setRevisionText('');
        playClick();
    };

    const navButtons = (
        <>
            <button
                type="button"
                onClick={() => {
                    playClick();
                    onPrev();
                }}
                className="w-11 h-11 rounded-full bg-black/35 hover:bg-black/40 text-white border border-white/10 flex items-center justify-center"
                aria-label="Previous asset"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button
                type="button"
                onClick={() => {
                    playClick();
                    onNext();
                }}
                className="w-11 h-11 rounded-full bg-black/35 hover:bg-black/40 text-white border border-white/10 flex items-center justify-center"
                aria-label="Next asset"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </>
    );

    const overlayBase = isEmbedded ? 'absolute inset-0 z-[520]' : 'fixed inset-0 z-[520]';

    if (variant === 'pro') {
        return (
            <div className={`${overlayBase} bg-black/55 backdrop-blur-xl text-white flex flex-col`}>
                <div className="h-14 border-b border-white/10 bg-[#121212]/80 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <button type="button" onClick={onClose} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center" aria-label="Close">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{file.name}</p>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-400">{currentIndex + 1} / {allFiles.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowPanel((v) => !v)}
                            className={`px-3 h-9 rounded-lg text-[10px] font-bold uppercase tracking-wider ${showPanel ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/15'}`}
                        >
                            <Info className="w-3.5 h-3.5 inline-block mr-1" /> Panel
                        </button>
                        {!isLocked && src && (
                            <a href={src} target="_blank" rel="noreferrer" className="px-3 h-9 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-lime-500 hover:bg-lime-400 flex items-center gap-1.5">
                                <Download className="w-3.5 h-3.5" /> Download
                            </a>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-h-0 flex">
                    <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">{navButtons.props.children[0]}</div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">{navButtons.props.children[1]}</div>

                        <div style={{ transform: `scale(${zoom})` }} className="transition-transform duration-200 max-w-full max-h-full">
                            <AssetStage file={file} isLocked={isLocked} />
                        </div>

                        {isLocked && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                                Protected Preview
                            </div>
                        )}

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-2 rounded-full bg-black/40 border border-white/10 flex items-center gap-2">
                            <button type="button" onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))} className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                            <span className="text-xs font-mono w-11 text-center">{Math.round(zoom * 100)}%</span>
                            <button type="button" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                        </div>
                    </div>

                    {showPanel && (
                        <aside className="w-80 border-l border-white/10 bg-[#101014] p-5 space-y-4 overflow-y-auto">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Metadata</p>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between"><span className="text-zinc-400">Type</span><span className="uppercase">{file.type}</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-400">Size</span><span>{file.size}</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-400">Version</span><span>v{file.version}</span></div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Revisions ({revisionCount})</p>
                                <textarea
                                    value={revisionText}
                                    onChange={(e) => setRevisionText(e.target.value)}
                                    placeholder="Add revision note"
                                    className="w-full h-24 rounded-xl bg-white/5 border border-white/10 p-3 text-xs resize-none outline-none"
                                />
                                <button type="button" onClick={submitRevision} className="mt-2 w-full h-9 rounded-xl bg-white text-black text-[10px] font-bold uppercase tracking-widest">Submit Note</button>
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        );
    }

    if (variant === 'workstation') {
        return (
            <div className={`${overlayBase} bg-[#2d2e45] text-white flex overflow-hidden`}>
                <div className="flex-1 flex flex-col">
                    <div className="h-12 border-b border-white/10 bg-[#252638] px-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center" aria-label="Close">
                                <X className="w-4 h-4" />
                            </button>
                            <p className="text-xs font-mono truncate">{file.name}</p>
                        </div>
                        <span className="text-[10px] px-2 py-1 rounded border border-[#bef264]/30 text-[#bef264] uppercase tracking-widest font-bold">Workstation</span>
                    </div>

                    <div className="flex-1 min-h-0 relative flex items-center justify-center p-8 bg-[#323242]">
                        <AssetStage file={file} isLocked={isLocked} className="max-h-[80vh]" />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">{navButtons.props.children[0]}</div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">{navButtons.props.children[1]}</div>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-2xl bg-[#1d1e2d]/90 border border-white/10 flex gap-2">
                            {allFiles.map((asset, i) => (
                                <button
                                    key={asset.id}
                                    type="button"
                                    onClick={() => onSelect(i)}
                                    className={`w-10 h-10 rounded-lg overflow-hidden border-2 ${i === currentIndex ? 'border-[#bef264]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    {asset.previewUrl ? <img src={asset.previewUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black/30" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <aside className="w-80 border-l border-white/10 bg-[#252638] p-5 space-y-5 overflow-y-auto">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Inspector</p>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between"><span className="text-zinc-400">Dimensions</span><span>{file.metadata?.resolution || 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-400">Size</span><span>{file.size}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-400">Locked</span><span>{isLocked ? 'Yes' : 'No'}</span></div>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Quick Revision</p>
                        <textarea
                            value={revisionText}
                            onChange={(e) => setRevisionText(e.target.value)}
                            placeholder="What needs to change?"
                            className="w-full h-28 rounded-xl bg-white/5 border border-white/10 p-3 text-xs resize-none outline-none"
                        />
                        <button type="button" onClick={submitRevision} className="mt-2 w-full h-10 rounded-xl bg-[#bef264] text-zinc-900 text-[10px] font-bold uppercase tracking-widest">Send Feedback</button>
                    </div>
                </aside>
            </div>
        );
    }

    if (variant === 'canvas') {
        return (
            <div className={`${overlayBase} bg-white/25 dark:bg-black/35 backdrop-blur-2xl flex flex-col`}>
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #777 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="absolute top-5 left-5 z-30 flex items-center gap-2">
                    <button type="button" onClick={onClose} className={`w-11 h-11 rounded-xl border flex items-center justify-center ${isDarkMode ? 'bg-[#1b1b28] text-white border-white/10' : 'bg-white text-zinc-800 border-zinc-200'}`}>
                        <X className="w-5 h-5" />
                    </button>
                    <div className={`px-4 h-11 rounded-xl border flex items-center text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'bg-[#1b1b28] text-zinc-200 border-white/10' : 'bg-white text-zinc-700 border-zinc-200'}`}>
                        Canvas Mode
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-14">
                    <div className={`relative p-3 rounded-xl shadow-2xl rotate-1 hover:rotate-0 transition-transform ${isDarkMode ? 'bg-[#1d1d2b]' : 'bg-white'}`}>
                        <AssetStage file={file} isLocked={isLocked} className="max-h-[70vh] rounded-lg" />
                        {revisionCount > 0 && (
                            <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
                                {revisionCount}
                            </div>
                        )}
                    </div>
                </div>

                {showPanel && (
                    <div className={`absolute right-5 bottom-24 w-[min(92vw,360px)] rounded-2xl border p-4 shadow-xl ${isDarkMode ? 'bg-[#141420]/95 border-white/10 text-white' : 'bg-white/95 border-zinc-200 text-zinc-900'}`}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Revision Request</p>
                        <textarea
                            value={revisionText}
                            onChange={(e) => setRevisionText(e.target.value)}
                            placeholder="Describe the change needed"
                            className={`w-full h-24 rounded-xl border p-3 text-xs resize-none outline-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}
                        />
                        <div className="mt-2 flex items-center justify-end gap-2">
                            <button type="button" onClick={() => setShowPanel(false)} className="px-3 h-9 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-zinc-500/20">Hide</button>
                            <button type="button" onClick={submitRevision} className="px-4 h-9 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-rose-500 text-white">Send</button>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-2 py-2 rounded-full bg-black/40 border border-white/10">
                    <button type="button" onClick={onPrev} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white"><ChevronLeft className="w-5 h-5" /></button>
                    <button type="button" onClick={() => setShowPanel((v) => !v)} className={`px-5 h-10 rounded-full text-[10px] font-bold uppercase tracking-wider ${showPanel ? 'bg-rose-500 text-white' : 'bg-white/10 text-white'}`}>
                        <MousePointer className="w-3.5 h-3.5 inline-block mr-1" /> Fix
                    </button>
                    <button type="button" onClick={onNext} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white"><ChevronRight className="w-5 h-5" /></button>
                </div>
            </div>
        );
    }

    return (
        <div className={`${overlayBase} bg-white/30 dark:bg-black/35 backdrop-blur-2xl flex flex-col`}>
            <div className={`h-14 border-b px-4 flex items-center justify-between ${isDarkMode ? 'bg-[#141422]/90 border-white/10 text-white' : 'bg-white/95 border-zinc-200 text-zinc-900'}`}>
                <div className="flex items-center gap-3 min-w-0">
                    <button type="button" onClick={onClose} className="w-9 h-9 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-bold uppercase tracking-wider">Contact Sheet</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setLoupeOn((v) => !v)}
                        className={`h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${loupeOn ? 'bg-[#bef264] text-zinc-900 border-[#bef264]' : (isDarkMode ? 'border-white/10 text-zinc-300 hover:bg-white/10' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100')}`}
                    >
                        <Search className="w-3.5 h-3.5 inline-block mr-1" /> Lens
                    </button>
                    <span className="text-[11px] font-mono opacity-70">{currentIndex + 1}/{allFiles.length}</span>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
                <div
                    className="flex-1 min-h-[55vh] relative p-6 md:p-8 flex items-center justify-center overflow-hidden"
                    onMouseMove={(e) => {
                        if (!loupeOn) return;
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        setLoupePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                >
                    <div className="relative w-full h-full flex items-center justify-center">
                        <AssetStage file={file} isLocked={isLocked} className="max-h-[80vh]" />
                        <div className="absolute left-1 md:left-3 top-1/2 -translate-y-1/2">{navButtons.props.children[0]}</div>
                        <div className="absolute right-1 md:right-3 top-1/2 -translate-y-1/2">{navButtons.props.children[1]}</div>

                        {loupeOn && src && (
                            <div
                                className="absolute w-44 h-44 rounded-full border-4 border-white shadow-2xl pointer-events-none"
                                style={{
                                    left: loupePos.x - 88,
                                    top: loupePos.y - 88,
                                    backgroundImage: `url(${src})`,
                                    backgroundSize: '320%',
                                    backgroundPosition: `${(loupePos.x / Math.max(1, (window.innerWidth * 0.62))) * 100}% ${(loupePos.y / Math.max(1, window.innerHeight)) * 100}%`,
                                }}
                            />
                        )}
                    </div>
                </div>

                <aside className={`h-40 md:h-full md:w-80 border-t md:border-t-0 md:border-l p-3 overflow-y-auto ${isDarkMode ? 'bg-[#171724] border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
                    <div className="grid grid-cols-4 md:grid-cols-2 gap-2.5">
                        {allFiles.map((asset, i) => (
                            <button
                                key={asset.id}
                                type="button"
                                onClick={() => onSelect(i)}
                                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${i === currentIndex ? 'border-[#bef264] ring-2 ring-[#bef264]/30' : (isDarkMode ? 'border-white/10 hover:border-white/30' : 'border-zinc-200 hover:border-zinc-400')}`}
                            >
                                {asset.previewUrl ? <img src={asset.previewUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black/10 flex items-center justify-center"><LayoutGrid className="w-4 h-4 opacity-60" /></div>}
                            </button>
                        ))}
                    </div>

                    <div className={`mt-3 p-3 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Asset Status</p>
                            {isLocked ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Locked</span>
                            ) : (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-green-500 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Unlocked</span>
                            )}
                        </div>
                        <p className="text-xs truncate">{file.name}</p>
                    </div>
                </aside>
            </div>
        </div>
    );
};
