import React, { useState, useMemo } from 'react';
import {
    Trash2, RotateCcw, Search, LayoutGrid, List as ListIcon,
    FileText, Image as ImageIcon, Film, FileArchive, FolderOpen,
    Clock, AlertTriangle, X, Layers, ChevronLeft, HardDrive, Calendar,
} from 'lucide-react';
import { playClick, playSuccess } from '../utils/sound';

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;

interface DeletedItem {
    id: string;
    name: string;
    type: 'project' | 'file';
    originalPath: string;
    deletedAt: string;
    daysLeft: number;
    size: string;
    ext?: string;
}

const MOCK_DELETED: DeletedItem[] = [
    { id: '1', name: 'Q3 Financials Draft', type: 'project', originalPath: 'Projects root', deletedAt: 'Oct 24', daysLeft: 28, size: '12 MB' },
    { id: '2', name: 'unused_logo_concept_v2.png', type: 'file', originalPath: 'Brand Identity / Files', deletedAt: 'Oct 21', daysLeft: 25, size: '4.2 MB', ext: 'png' },
    { id: '3', name: 'Old Client Contract.pdf', type: 'file', originalPath: 'Website Redesign / Legal', deletedAt: 'Oct 14', daysLeft: 18, size: '156 KB', ext: 'pdf' },
    { id: '4', name: 'Deprecated Assets', type: 'project', originalPath: 'Projects root', deletedAt: 'Oct 02', daysLeft: 5, size: '1.4 GB' },
    { id: '5', name: 'raw_footage_take_04.mp4', type: 'file', originalPath: 'Commercial / Raw', deletedAt: 'Sep 28', daysLeft: 2, size: '4.8 GB', ext: 'mp4' },
];

function getFileIcon(item: DeletedItem) {
    if (item.type === 'project') return <FolderOpen className="h-5 w-5" />;
    const ext = (item.ext || '').toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return <ImageIcon className="h-5 w-5" />;
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return <Film className="h-5 w-5" />;
    if (['zip', 'rar', '7z'].includes(ext)) return <FileArchive className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
}

function urgencyClass(days: number) {
    if (days <= 3) return { bar: 'bg-red-500', label: 'text-red-600 dark:text-red-400', dot: 'bg-red-500 animate-pulse', chip: 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-500/15 border-red-200/60 dark:border-red-500/25', glow: 'bg-red-400/10' };
    if (days <= 10) return { bar: 'bg-amber-500', label: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', chip: 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15 border-amber-200/60 dark:border-amber-500/25', glow: 'bg-amber-400/10' };
    return { bar: 'bg-emerald-500', label: 'text-zinc-500 dark:text-zinc-400', dot: 'bg-emerald-500', chip: 'text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/10 border-zinc-200/60 dark:border-white/10', glow: 'bg-emerald-400/10' };
}

function shortId(id: string) {
    return id.length > 6 ? `${id.slice(0, 4)}…${id.slice(-2)}` : id;
}

export default function TrashPage({ onBack }: { onBack?: () => void }) {
    const [items, setItems] = useState<DeletedItem[]>(MOCK_DELETED);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [confirmEmptyAll, setConfirmEmptyAll] = useState(false);

    const filtered = useMemo(
        () => items.filter((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [items, searchTerm]
    );

    const totalSize = items.reduce((acc, i) => {
        const n = parseFloat(i.size);
        if (i.size.includes('GB')) return acc + n * 1024;
        if (i.size.includes('MB')) return acc + n;
        return acc + n / 1024;
    }, 0);
    const totalSizeLabel = totalSize >= 1024 ? `${(totalSize / 1024).toFixed(1)} GB` : `${totalSize.toFixed(0)} MB`;

    const projectCount = items.filter((i) => i.type === 'project').length;
    const fileCount = items.filter((i) => i.type === 'file').length;
    const urgentCount = items.filter((i) => i.daysLeft <= 3).length;

    const handleBack = () => {
        playClick();
        if (onBack) onBack();
        else window.history.back();
    };

    const handleRestore = (id: string) => {
        playSuccess();
        setItems((prev) => prev.filter((i) => i.id !== id));
    };
    const handleDeleteForever = (id: string) => {
        playClick();
        setItems((prev) => prev.filter((i) => i.id !== id));
        setConfirmId(null);
    };
    const handleEmptyAll = () => {
        playClick();
        setItems([]);
        setConfirmEmptyAll(false);
    };

    const ConfirmOverlay = ({ id, name, onConfirm, onCancel }: { id: string; name: string; onConfirm: () => void; onCancel: () => void }) => (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm dark:bg-black/60" onClick={onCancel} />
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#1a1a23] animate-slide-up">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="mb-1 font-sans text-lg font-bold leading-tight text-zinc-900 dark:text-white">Delete forever?</h3>
                <p className="mb-6 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">"{name}"</span> will be permanently erased. This cannot be undone.
                </p>
                <div className="flex gap-2">
                    <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-zinc-200/60 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/5">
                        Cancel
                    </button>
                    <button type="button" onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-red-600">
                        Delete Forever
                    </button>
                </div>
            </div>
        </div>
    );

    const GridCard = ({ item }: { item: DeletedItem }) => {
        const u = urgencyClass(item.daysLeft);
        const typeLabel = item.type === 'project' ? 'Project' : 'File asset';
        const extLabel = item.ext ? item.ext.toUpperCase() : item.type === 'project' ? 'PROJECT' : 'MIXED';
        const pct = Math.min(100, Math.round((item.daysLeft / 30) * 100));

        return (
            <div
                className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/50 bg-editorial shadow-sm transition-all duration-300 hover:border-zinc-200/80 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.04] dark:hover:border-white/10 dark:hover:shadow-lg"
            >
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.035] dark:opacity-[0.06]" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat' }} />
                <div className={`pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full blur-3xl ${u.glow}`} />

                <div className="relative z-10 flex flex-1 flex-col p-6 lg:p-7">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <span className="mb-2 block border-l-2 border-lime-400 pl-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:border-lime-400 dark:text-zinc-400">
                                {typeLabel}
                            </span>
                            <h3 className="line-clamp-2 font-sans text-lg font-semibold leading-snug tracking-tight text-obsidian dark:text-white" title={item.name}>
                                {item.name}
                            </h3>
                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400" title={item.originalPath}>
                                {item.originalPath}
                            </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                            <div className="rounded-xl bg-zinc-200/80 p-2.5 text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                                {getFileIcon(item)}
                            </div>
                            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${u.chip}`}>
                                {extLabel}
                            </span>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-left">
                        <div className="rounded-xl border border-zinc-200/50 bg-white/60 px-3 py-2.5 dark:border-white/[0.06] dark:bg-black/20">
                            <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                                <Calendar className="h-3 w-3" /> Removed
                            </div>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{item.deletedAt}</p>
                        </div>
                        <div className="rounded-xl border border-zinc-200/50 bg-white/60 px-3 py-2.5 dark:border-white/[0.06] dark:bg-black/20">
                            <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                                <HardDrive className="h-3 w-3" /> Size
                            </div>
                            <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-white">{item.size}</p>
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-zinc-200/40 bg-white/40 px-3 py-2.5 dark:border-white/[0.05] dark:bg-white/[0.03]">
                        <div className="mb-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                            <span className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 rounded-full ${u.dot}`} />
                                Retention window
                            </span>
                            <span className={u.label}>{item.daysLeft} days left</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-white/10">
                            <div className={`h-full rounded-full ${u.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                            Auto-purge after 30 days · ref <span className="font-mono text-zinc-600 dark:text-zinc-300">{shortId(item.id)}</span>
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex gap-2 border-t border-zinc-200/50 bg-white/50 px-5 py-4 dark:border-white/[0.06] dark:bg-black/10">
                    <button
                        type="button"
                        onClick={() => handleRestore(item.id)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200/60 bg-white py-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:border-lime-400/30 dark:hover:bg-lime-400/10 dark:hover:text-blue-300"
                    >
                        <RotateCcw className="h-3.5 w-3.5" /> Restore
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            playClick();
                            setConfirmId(item.id);
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200/60 text-zinc-400 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-white/10 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        title="Delete forever"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    };

    const ListRow = ({ item, isLast }: { item: DeletedItem; isLast: boolean }) => {
        const u = urgencyClass(item.daysLeft);
        return (
            <div
                className={`group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03] ${!isLast ? 'border-b border-zinc-100 dark:border-white/[0.06]' : ''}`}
            >
                <div className="shrink-0 rounded-lg border border-zinc-200/50 bg-zinc-100 p-2 text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                    {getFileIcon(item)}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{item.name}</p>
                    <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {item.originalPath} · {item.size} · {item.deletedAt}
                    </p>
                </div>
                <div className="hidden w-28 shrink-0 flex-col items-end gap-1 sm:flex">
                    <span className={`text-[9px] font-semibold uppercase tracking-widest ${u.label}`}>{item.daysLeft} days</span>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                        <div className={`h-full rounded-full ${u.bar}`} style={{ width: `${(item.daysLeft / 30) * 100}%` }} />
                    </div>
                </div>
                <div className="hidden w-20 shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400 md:flex">
                    <Clock className="h-3 w-3" /> {item.deletedAt}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => handleRestore(item.id)}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-transparent px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:text-zinc-400 dark:hover:border-lime-400/20 dark:hover:bg-lime-400/10 dark:hover:text-lime-400"
                    >
                        <RotateCcw className="h-3 w-3" /> Restore
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            playClick();
                            setConfirmId(item.id);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-300 transition-all hover:bg-red-50 hover:text-red-500 dark:text-zinc-600 dark:hover:bg-red-500/10"
                        title="Delete forever"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <>
            {confirmId && (() => {
                const item = items.find((i) => i.id === confirmId)!;
                return <ConfirmOverlay id={confirmId} name={item?.name ?? ''} onConfirm={() => handleDeleteForever(confirmId)} onCancel={() => setConfirmId(null)} />;
            })()}

            {confirmEmptyAll && (
                <ConfirmOverlay id="all" name={`all ${items.length} items`} onConfirm={handleEmptyAll} onCancel={() => setConfirmEmptyAll(false)} />
            )}

            <div className="relative z-10 w-full animate-slide-up space-y-5 pb-12">
                {/* Compact chrome — no banner card */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors mb-2.5"
                            title="Back"
                        >
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        <div className="min-w-0">
                            <h1 className="font-sans text-2xl font-medium tracking-tight text-zinc-900 dark:text-white sm:text-3xl">Trash</h1>
                            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                                Restorable for 30 days — then permanently removed.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {items.length > 0 && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200/60 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                                <Layers className="h-3.5 w-3.5 opacity-80" />
                                {items.length} items · {totalSizeLabel}
                                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                                {projectCount} proj · {fileCount} files
                                {urgentCount > 0 && (
                                    <>
                                        <span className="text-zinc-300 dark:text-zinc-600">·</span>
                                        <span className="text-amber-600 dark:text-amber-400">{urgentCount} urgent</span>
                                    </>
                                )}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                playClick();
                                if (items.length > 0) setConfirmEmptyAll(true);
                            }}
                            disabled={items.length === 0}
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200/80 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Empty all
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="group relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-200" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search deleted items…"
                            className="h-11 w-full rounded-2xl border border-zinc-200/60 bg-white pl-10 pr-10 text-sm font-medium text-zinc-900 shadow-sm placeholder:text-zinc-400 transition-colors focus:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-200/50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-white"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded-2xl border border-zinc-200/50 bg-zinc-100/80 p-1 dark:border-white/10 dark:bg-white/5">
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`rounded-xl p-2 transition-all ${viewMode === 'grid' ? 'bg-white text-zinc-900 shadow-sm dark:bg-white/10 dark:text-white' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                            title="Grid view"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`rounded-xl p-2 transition-all ${viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm dark:bg-white/10 dark:text-white' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                            title="List view"
                        >
                            <ListIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="relative overflow-hidden rounded-[2rem] border border-zinc-200/50 bg-white py-20 text-center shadow-sm dark:border-white/[0.06] dark:bg-charcoal dark:shadow-md">
                        <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat' }} />
                        <div className="relative z-10 flex flex-col items-center px-6">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200/50 bg-zinc-50 dark:border-white/10 dark:bg-white/5">
                                <Trash2 className="h-7 w-7 stroke-[1.5] text-zinc-400 dark:text-zinc-500" />
                            </div>
                            <h3 className="mb-1 font-sans text-lg tracking-tight text-zinc-900 dark:text-white">Nothing in trash</h3>
                            <p className="max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">Deleted projects and files appear here for 30 days.</p>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-zinc-200/50 py-14 text-center dark:border-white/10">
                        <Search className="mb-2 h-7 w-7 text-zinc-400" />
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No results for "{searchTerm}"</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {filtered.map((item) => (
                            <GridCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="relative overflow-hidden rounded-[2rem] border border-zinc-200/50 bg-white shadow-sm dark:border-white/[0.06] dark:bg-charcoal dark:shadow-md">
                        <div className="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat' }} />
                        <div className="relative z-10 flex items-center gap-4 border-b border-zinc-100 bg-zinc-50/90 px-5 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                            <div className="w-9" />
                            <span className="flex-1 text-[9px] font-semibold uppercase tracking-widest text-zinc-400">Asset</span>
                            <span className="hidden w-28 text-right text-[9px] font-semibold uppercase tracking-widest text-zinc-400 sm:block">Timer</span>
                            <span className="hidden w-20 text-[9px] font-semibold uppercase tracking-widest text-zinc-400 md:block">Deleted</span>
                            <div className="w-24" />
                        </div>
                        {filtered.map((item, i) => (
                            <ListRow key={item.id} item={item} isLast={i === filtered.length - 1} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
