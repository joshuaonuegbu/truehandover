import React, { useState } from 'react';
import { 
    Trash2, RefreshCw, X, AlertTriangle, 
    FileText, Image as ImageIcon, Film, 
    FileArchive, LayoutGrid, List as ListIcon,
    Search, ArrowLeft, History, ArchiveRestore,
    AlertCircle, File, Clock, RotateCcw, Ban,
    Calendar, HardDrive
} from 'lucide-react';
import { playClick, playSuccess } from '../utils/sound';
import { GRADIENT_TEXT } from './Shared';

interface DeletedItem {
    id: string;
    name: string;
    type: 'project' | 'file';
    originalPath: string;
    deletedAt: string;
    daysLeft: number;
    size: string;
}

const MOCK_DELETED_ITEMS: DeletedItem[] = [
    { id: '1', name: 'Q3 Financials Draft', type: 'project', originalPath: '/', deletedAt: 'Oct 24', daysLeft: 28, size: '12 MB' },
    { id: '2', name: 'unused_logo_concept_v2.png', type: 'file', originalPath: 'Brand Identity / Files', deletedAt: 'Oct 21', daysLeft: 25, size: '4.2 MB' },
    { id: '3', name: 'Old Client Contract', type: 'file', originalPath: 'Website Redesign / Legal', deletedAt: 'Oct 14', daysLeft: 18, size: '156 KB' },
    { id: '4', name: 'Deprecated Assets', type: 'project', originalPath: '/', deletedAt: 'Oct 02', daysLeft: 5, size: '1.4 GB' },
    { id: '5', name: 'raw_footage_take_04.mp4', type: 'file', originalPath: 'Commercial / Raw', deletedAt: 'Sep 28', daysLeft: 2, size: '4.8 GB' },
];

export default function TrashPage({ onBack }: { onBack: () => void }) {
    const [items, setItems] = useState<DeletedItem[]>(MOCK_DELETED_ITEMS);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [searchTerm, setSearchTerm] = useState('');

    const handleRestore = (id: string) => {
        playSuccess();
        setItems(items.filter(i => i.id !== id));
    };

    const handleDeleteForever = (id: string) => {
        playClick(); 
        setItems(items.filter(i => i.id !== id));
    };

    const handleEmptyTrash = () => {
        if (confirm('Permanently erase all items? This cannot be undone.')) {
            playClick();
            setItems([]);
        }
    };

    const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const getIcon = (type: string, name: string) => {
        const className = "w-6 h-6 opacity-80 stroke-1";
        if (type === 'project') return <LayoutGrid className={className} />;
        if (name.endsWith('.png') || name.endsWith('.jpg')) return <ImageIcon className={className} />;
        if (name.endsWith('.mp4')) return <Film className={className} />;
        if (name.endsWith('.zip')) return <FileArchive className={className} />;
        return <FileText className={className} />;
    };

    const getProgressColor = (days: number) => {
        if (days > 20) return 'bg-emerald-500';
        if (days > 10) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-8 animate-slide-up relative z-10 w-full pb-24">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <button 
                        onClick={() => { playClick(); onBack(); }}
                        className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to Vault
                    </button>
                    <h2 className={`text-5xl font-sans tracking-tight font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-800 dark:from-white dark:via-zinc-200 dark:to-zinc-400`}>
                        Trash
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-base mt-2 flex items-center gap-2">
                        Review deleted items, restore what you need, or remove them permanently.
                    </p>
                </div>
                
                <div className="flex gap-4">
                     <button 
                        onClick={handleEmptyTrash}
                        disabled={items.length === 0}
                        className="h-12 px-6 rounded-xl border border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/5 hover:shadow-red-500/10"
                    >
                        <Trash2 className="w-4 h-4" />
                        Empty Trash
                    </button>
                </div>
            </div>

            {/* Premium Controls Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-[#1a1a23] p-1.5 rounded-2xl border border-zinc-200/50 dark:border-white/5 shadow-sm">
                <div className="relative w-full sm:flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-200 transition-colors" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search deleted files..." 
                        className="w-full h-11 pl-11 pr-4 rounded-xl bg-transparent text-sm focus:bg-zinc-50 dark:focus:bg-white/5 outline-none transition-all placeholder:text-zinc-400 text-zinc-900 dark:text-white font-medium" 
                    />
                </div>
                <div className="flex items-center gap-1 pr-1">
                    <div className="w-px h-6 bg-zinc-200 dark:bg-white/10 mx-2 hidden sm:block" />
                    <button 
                        onClick={() => setViewMode('grid')} 
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')} 
                        className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                    >
                        <ListIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {items.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center opacity-40">
                    <div className="w-24 h-24 rounded-3xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-6 ring-1 ring-zinc-200 dark:ring-white/10">
                        <Trash2 className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <p className="font-sans tracking-tight text-2xl text-zinc-900 dark:text-white mb-2">Trash is empty</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Everything is clean.</p>
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredItems.map(item => (
                                <div key={item.id} className="group relative bg-white dark:bg-[#1a1a23] border border-zinc-200/50 dark:border-white/5 rounded-[1.5rem] p-6 flex flex-col justify-between hover:border-zinc-200/50 dark:hover:border-white/20 transition-all hover:-translate-y-1 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] h-[300px]">
                                    
                                    {/* Icon & Details */}
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-3.5 bg-zinc-50 dark:bg-white/5 rounded-2xl text-zinc-600 dark:text-zinc-300 ring-1 ring-zinc-100 dark:ring-white/10 group-hover:scale-105 transition-transform duration-300">
                                                {getIcon(item.type, item.name)}
                                            </div>
                                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-zinc-100 dark:border-white/10 font-mono tracking-wide">
                                                {item.size}
                                            </span>
                                        </div>
                                        
                                        <h4 className="font-sans tracking-tight font-medium text-xl text-zinc-900 dark:text-white leading-tight mb-2 truncate" title={item.name}>{item.name}</h4>
                                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 truncate opacity-80 mb-6">{item.originalPath}</p>
                                        
                                        {/* Auto-delete Progress */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                                <span className={`${item.daysLeft <= 5 ? 'text-red-500' : 'text-zinc-500'}`}>Auto-delete</span>
                                                <span className="text-zinc-900 dark:text-white">{item.daysLeft} days left</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${getProgressColor(item.daysLeft)} transition-all duration-1000 ease-out`} 
                                                    style={{ width: `${(item.daysLeft / 30) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Overlay / Bottom Bar */}
                                    <div className="grid grid-cols-2 gap-3 pt-5 border-t border-zinc-100 dark:border-white/5 mt-auto">
                                        <button 
                                            onClick={() => handleRestore(item.id)}
                                            className="py-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group/restore"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 group-hover/restore:-rotate-180 transition-transform duration-500" /> Restore
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteForever(item.id)}
                                            className="py-2.5 rounded-xl border border-transparent hover:border-red-200 dark:hover:border-red-500/20 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-[10px] font-bold uppercase tracking-widest"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#1a1a23] border border-zinc-200/50 dark:border-white/5 rounded-[1.5rem] overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-50 dark:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Asset</th>
                                        <th className="px-6 py-4 font-bold hidden md:table-cell">Details</th>
                                        <th className="px-6 py-4 font-bold">Status</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-white/5 text-sm">
                                    {filteredItems.map(item => (
                                        <tr key={item.id} className="group hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 bg-zinc-100 dark:bg-white/5 rounded-xl text-zinc-500 dark:text-zinc-400">
                                                        {getIcon(item.type, item.name)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-zinc-900 dark:text-white text-base">{item.name}</div>
                                                        <div className="text-xs text-zinc-400 uppercase tracking-wider font-bold mt-0.5">{item.size}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 hidden md:table-cell">
                                                <div className="text-zinc-500 dark:text-zinc-400 text-xs font-mono">{item.originalPath}</div>
                                                <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mt-1">Deleted {item.deletedAt}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1.5 w-32">
                                                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                                                        <span className="text-zinc-400">Timer</span>
                                                        <span className={item.daysLeft <= 5 ? 'text-red-500' : 'text-zinc-600'}>{item.daysLeft}d left</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${getProgressColor(item.daysLeft)}`} 
                                                            style={{ width: `${(item.daysLeft / 30) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleRestore(item.id)}
                                                        className="h-9 px-4 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-widest transition-colors"
                                                    >
                                                        Restore
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteForever(item.id)}
                                                        className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors"
                                                        title="Delete Forever"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

