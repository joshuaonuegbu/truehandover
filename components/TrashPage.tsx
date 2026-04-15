import React, { useState, useMemo } from 'react';
import {
    Trash2, RotateCcw, Search, LayoutGrid, List as ListIcon,
    FileText, Image as ImageIcon, Film, FileArchive, FolderOpen,
    Clock, AlertTriangle, ChevronRight, X, Layers,
} from 'lucide-react';
import { playClick, playSuccess } from '../utils/sound';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getFileIcon(item: DeletedItem) {
    if (item.type === 'project') return <FolderOpen className="w-5 h-5" />;
    const ext = (item.ext || '').toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return <ImageIcon className="w-5 h-5" />;
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return <Film className="w-5 h-5" />;
    if (['zip', 'rar', '7z'].includes(ext)) return <FileArchive className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
}

function urgencyClass(days: number) {
    if (days <= 3) return { ring: 'ring-red-500/40', badge: 'bg-red-500/10 text-red-500 border-red-500/20', bar: 'bg-red-500', label: 'text-red-500', dot: 'bg-red-500 animate-pulse' };
    if (days <= 10) return { ring: 'ring-amber-500/30', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', bar: 'bg-amber-500', label: 'text-amber-500', dot: 'bg-amber-500' };
    return { ring: 'ring-zinc-200/50 dark:ring-white/[0.07]', badge: 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border-zinc-200/50 dark:border-white/10', bar: 'bg-emerald-500', label: 'text-zinc-500 dark:text-zinc-400', dot: 'bg-emerald-500' };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TrashPage({ onBack }: { onBack: () => void }) {
    const [items, setItems] = useState<DeletedItem[]>(MOCK_DELETED);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [confirmEmptyAll, setConfirmEmptyAll] = useState(false);

    const filtered = useMemo(() =>
        items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [items, searchTerm]
    );

    const totalSize = items.reduce((acc, i) => {
        const n = parseFloat(i.size);
        if (i.size.includes('GB')) return acc + n * 1024;
        if (i.size.includes('MB')) return acc + n;
        return acc + n / 1024;
    }, 0);
    const totalSizeLabel = totalSize >= 1024 ? `${(totalSize / 1024).toFixed(1)} GB` : `${totalSize.toFixed(0)} MB`;

    const handleRestore = (id: string) => {
        playSuccess();
        setItems(prev => prev.filter(i => i.id !== id));
    };
    const handleDeleteForever = (id: string) => {
        playClick();
        setItems(prev => prev.filter(i => i.id !== id));
        setConfirmId(null);
    };
    const handleEmptyAll = () => {
        playClick();
        setItems([]);
        setConfirmEmptyAll(false);
    };

    // ── Confirm overlay ──────────────────────────────────────────────────────
    const ConfirmOverlay = ({ id, name, onConfirm, onCancel }: { id: string; name: string; onConfirm: () => void; onCancel: () => void }) => (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-900/50 dark:bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative z-10 w-full max-w-sm bg-white dark:bg-[#1a1a23] border border-zinc-200/60 dark:border-white/10 rounded-2xl shadow-2xl p-6 animate-slide-up">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-sans font-bold text-lg text-zinc-900 dark:text-white mb-1 leading-tight">Delete forever?</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">"{name}"</span> will be permanently erased. This cannot be undone.
                </p>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border border-zinc-200/60 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-red-500 hover:bg-red-600 text-white transition-colors">
                        Delete Forever
                    </button>
                </div>
            </div>
        </div>
    );

    // ── Grid card ────────────────────────────────────────────────────────────
    const GridCard = ({ item }: { item: DeletedItem }) => {
        const u = urgencyClass(item.daysLeft);
        return (
            <div className={`group relative bg-white dark:bg-[#1c1c26] border rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/30 ring-1 ${u.ring} border-zinc-200/60 dark:border-white/[0.07]`}>
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-white/10">
                        {getFileIcon(item)}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${u.badge}`}>
                        {item.daysLeft}d left
                    </span>
                </div>

                {/* Name */}
                <div className="min-w-0">
                    <p className="font-sans font-semibold text-sm text-zinc-900 dark:text-white truncate leading-tight" title={item.name}>{item.name}</p>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mt-0.5 truncate">{item.originalPath}</p>
                </div>

                {/* Timer bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${u.dot}`} />
                            Auto-delete
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${u.label}`}>{item.size}</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full ${u.bar} transition-all duration-1000`} style={{ width: `${(item.daysLeft / 30) * 100}%` }} />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1 border-t border-zinc-100 dark:border-white/[0.06]">
                    <button
                        onClick={() => handleRestore(item.id)}
                        className="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-zinc-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 border border-zinc-200/50 dark:border-white/10 hover:border-blue-200 dark:hover:border-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                    >
                        <RotateCcw className="w-3 h-3" /> Restore
                    </button>
                    <button
                        onClick={() => { playClick(); setConfirmId(item.id); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-zinc-200/50 dark:border-white/10 hover:border-red-200 dark:hover:border-red-500/20 transition-all"
                        title="Delete forever"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    };

    // ── List row ─────────────────────────────────────────────────────────────
    const ListRow = ({ item, isLast }: { item: DeletedItem; isLast: boolean }) => {
        const u = urgencyClass(item.daysLeft);
        return (
            <div className={`group flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors ${!isLast ? 'border-b border-zinc-100 dark:border-white/[0.06]' : ''}`}>
                <div className="p-2 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 shrink-0 border border-zinc-200/50 dark:border-white/10">
                    {getFileIcon(item)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 truncate mt-0.5">{item.originalPath} · {item.size}</p>
                </div>
                {/* Timer */}
                <div className="hidden sm:flex flex-col items-end gap-1 w-28 shrink-0">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${u.label}`}>{item.daysLeft} days</span>
                    <div className="w-full h-1 rounded-full bg-zinc-100 dark:bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full ${u.bar}`} style={{ width: `${(item.daysLeft / 30) * 100}%` }} />
                    </div>
                </div>
                {/* Deleted date */}
                <div className="hidden md:flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-20 shrink-0">
                    <Clock className="w-3 h-3" /> {item.deletedAt}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => handleRestore(item.id)}
                        className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-transparent hover:border-blue-200 dark:hover:border-blue-500/20 transition-all flex items-center gap-1.5"
                    >
                        <RotateCcw className="w-3 h-3" /> Restore
                    </button>
                    <button
                        onClick={() => { playClick(); setConfirmId(item.id); }}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                        title="Delete forever"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            {/* Confirm delete single */}
            {confirmId && (() => {
                const item = items.find(i => i.id === confirmId)!;
                return <ConfirmOverlay id={confirmId} name={item?.name ?? ''} onConfirm={() => handleDeleteForever(confirmId)} onCancel={() => setConfirmId(null)} />;
            })()}

            {/* Confirm empty all */}
            {confirmEmptyAll && (
                <ConfirmOverlay id="all" name={`all ${items.length} items`} onConfirm={handleEmptyAll} onCancel={() => setConfirmEmptyAll(false)} />
            )}

            <div className="space-y-6 animate-slide-up relative z-10 pb-24 bg-transparent">

                {/* ── Page Header ── */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b border-zinc-200/50 dark:border-white/5 pb-8">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                            <span>Vault</span>
                            <span className="text-zinc-300 dark:text-zinc-600">·</span>
                            <span>Trash</span>
                        </div>
                        <h1 className="font-sans tracking-tight text-3xl md:text-5xl text-zinc-900 dark:text-white leading-[1.05] mb-2">
                            Trash
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-lg">
                            Items are permanently erased after 30 days. Restore anything you still need before the timer runs out.
                        </p>
                    </div>

                    {/* Stats + empty action */}
                    <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                        {items.length > 0 && (
                            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                <span className="flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5" />
                                    {items.length} item{items.length !== 1 ? 's' : ''}
                                </span>
                                <span className="w-px h-3.5 bg-zinc-200 dark:bg-white/10" />
                                <span>{totalSizeLabel} total</span>
                            </div>
                        )}
                        <button
                            onClick={() => { playClick(); if (items.length > 0) setConfirmEmptyAll(true); }}
                            disabled={items.length === 0}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-red-200 dark:border-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Empty Trash
                        </button>
                    </div>
                </div>

                {/* ── Toolbar ── */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-200 transition-colors pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search deleted items…"
                            className="w-full h-10 pl-11 pr-10 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-300 dark:focus:border-white/20 transition-colors font-medium"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 shrink-0">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                            title="List view"
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                            title="Grid view"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── Content ── */}
                {items.length === 0 ? (
                    <div className="py-32 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-[1.75rem] bg-zinc-100 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 flex items-center justify-center mb-6 shadow-sm">
                            <Trash2 className="w-8 h-8 text-zinc-300 dark:text-zinc-600 stroke-[1.5]" />
                        </div>
                        <h3 className="font-sans tracking-tight text-2xl text-zinc-900 dark:text-white mb-2">Trash is empty</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                            No deleted items here. Anything you remove from the vault will appear here for 30 days before permanent erasure.
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center opacity-60">
                        <Search className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-3" />
                        <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">No results for "{searchTerm}"</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map(item => <GridCard key={item.id} item={item} />)}
                    </div>
                ) : (
                    <div className="rounded-2xl overflow-hidden border border-zinc-200/60 dark:border-white/[0.07] bg-white dark:bg-[#1c1c26]">
                        {/* List header */}
                        <div className="flex items-center gap-4 px-5 py-3 bg-zinc-50 dark:bg-white/[0.03] border-b border-zinc-100 dark:border-white/[0.06]">
                            <div className="w-9" />
                            <span className="flex-1 text-[9px] font-black uppercase tracking-widest text-zinc-400">Asset</span>
                            <span className="hidden sm:block w-28 text-right text-[9px] font-black uppercase tracking-widest text-zinc-400">Timer</span>
                            <span className="hidden md:block w-20 text-[9px] font-black uppercase tracking-widest text-zinc-400">Deleted</span>
                            <div className="w-24" />
                        </div>
                        {filtered.map((item, i) => (
                            <ListRow key={item.id} item={item} isLast={i === filtered.length - 1} />
                        ))}
                    </div>
                )}

                {/* ── Urgency notice ── */}
                {items.some(i => i.daysLeft <= 3) && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-red-700 dark:text-red-300">
                            {items.filter(i => i.daysLeft <= 3).length} item{items.filter(i => i.daysLeft <= 3).length !== 1 ? 's' : ''} will be permanently deleted within 3 days. Restore them now if needed.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
