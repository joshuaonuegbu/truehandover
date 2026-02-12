
import React, { useState } from 'react';
import { 
    Trash2, RefreshCw, X, AlertTriangle, 
    FileText, Image as ImageIcon, Film, 
    FileArchive, LayoutGrid, List as ListIcon,
    Search, ArrowLeft, History, ArchiveRestore,
    AlertCircle, File, Clock, RotateCcw, Ban
} from 'lucide-react';
import { playClick, playSuccess } from '../utils/sound';
import { GRADIENT_TEXT } from './Shared'; // Utilizing the shared gradient constant if available, else locally defined below

interface DeletedItem {
    id: string;
    name: string;
    type: 'project' | 'file';
    originalPath: string;
    deletedAt: string;
    expiresIn: string; // "28 days"
    size: string;
}

const MOCK_DELETED_ITEMS: DeletedItem[] = [
    { id: '1', name: 'Q3 Financials Draft', type: 'project', originalPath: '/', deletedAt: 'Oct 24', expiresIn: '28 days', size: '12 MB' },
    { id: '2', name: 'unused_logo_concept_v2.png', type: 'file', originalPath: 'Brand Identity / Files', deletedAt: 'Oct 21', expiresIn: '25 days', size: '4.2 MB' },
    { id: '3', name: 'Old Client Contract', type: 'file', originalPath: 'Website Redesign / Legal', deletedAt: 'Oct 14', expiresIn: '18 days', size: '156 KB' },
    { id: '4', name: 'Deprecated Assets', type: 'project', originalPath: '/', deletedAt: 'Oct 02', expiresIn: '10 days', size: '1.4 GB' },
    { id: '5', name: 'raw_footage_take_04.mp4', type: 'file', originalPath: 'Commercial / Raw', deletedAt: 'Sep 28', expiresIn: '2 days', size: '4.8 GB' },
];

const LOCAL_GRADIENT_TEXT = "text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-600 to-slate-400 dark:from-white dark:via-slate-200 dark:to-slate-500";

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
        const className = "w-5 h-5 opacity-60";
        if (type === 'project') return <LayoutGrid className={className} />;
        if (name.endsWith('.png') || name.endsWith('.jpg')) return <ImageIcon className={className} />;
        if (name.endsWith('.mp4')) return <Film className={className} />;
        if (name.endsWith('.zip')) return <FileArchive className={className} />;
        return <FileText className={className} />;
    };

    return (
        <div className="space-y-8 animate-slide-up relative z-10 w-full pb-24">
            
            {/* Header Section - Matching App.tsx Header Language */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <button 
                            onClick={() => { playClick(); onBack(); }}
                            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back
                        </button>
                    </div>
                    <h2 className={`text-4xl font-serif font-medium tracking-tight ${LOCAL_GRADIENT_TEXT}`}>
                        <span className="text-red-600 dark:text-red-500">Deleted</span> Items
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-base mt-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Items are permanently removed after 30 days.
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={handleEmptyTrash}
                        disabled={items.length === 0}
                        className="h-12 px-6 rounded-xl border border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                    >
                        <Trash2 className="w-4 h-4" />
                        Empty Trash
                    </button>
                </div>
            </div>

            {/* Controls Bar - Matching Vault View Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/50 dark:bg-[#23232e] backdrop-blur-md p-2 rounded-2xl border border-slate-200 dark:border-white/5">
                <div className="relative w-full sm:flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search deleted files..." 
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-transparent text-sm focus:bg-white dark:focus:bg-white/5 outline-none transition-all placeholder:text-slate-500 text-slate-900 dark:text-white" 
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-px h-6 bg-slate-300 dark:bg-white/10 mx-2" />
                    <button 
                        onClick={() => setViewMode('grid')} 
                        className={`p-3 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/5'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')} 
                        className={`p-3 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/5'}`}
                    >
                        <ListIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {items.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center opacity-40">
                    <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6">
                        <RefreshCw className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="font-serif text-2xl text-slate-900 dark:text-white mb-2">Trash is empty</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Everything is clean.</p>
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredItems.map(item => (
                                <div key={item.id} className="group relative bg-white dark:bg-[#23232e] border border-slate-200 dark:border-white/5 rounded-[1.5rem] p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/20 transition-all hover:-translate-y-1 shadow-sm hover:shadow-lg h-[240px]">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-500 dark:text-slate-400">
                                                {getIcon(item.type, item.name)}
                                            </div>
                                            <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg border border-red-100 dark:border-red-500/20 uppercase tracking-wide">
                                                {item.expiresIn}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-base text-slate-900 dark:text-white leading-tight mb-2 truncate" title={item.name}>{item.name}</h4>
                                        <div className="space-y-1">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{item.size}</p>
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 truncate opacity-70">{item.originalPath}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-white/5 mt-auto">
                                        <button 
                                            onClick={() => handleRestore(item.id)}
                                            className="flex-1 py-2.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteForever(item.id)}
                                            className="w-10 flex items-center justify-center rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-500/30 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                            title="Delete Forever"
                                        >
                                            <Ban className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#23232e] border border-slate-200 dark:border-white/5 rounded-[1.5rem] overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Asset</th>
                                        <th className="px-6 py-4 font-bold hidden md:table-cell">Path</th>
                                        <th className="px-6 py-4 font-bold hidden sm:table-cell">Deleted</th>
                                        <th className="px-6 py-4 font-bold">Expires</th>
                                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                                    {filteredItems.map(item => (
                                        <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-500 dark:text-slate-400">
                                                        {getIcon(item.type, item.name)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                                                        <div className="text-xs text-slate-500 font-mono mt-0.5">{item.size}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell text-slate-500 font-mono text-xs">
                                                {item.originalPath}
                                            </td>
                                            <td className="px-6 py-4 hidden sm:table-cell text-slate-500 font-mono text-xs">
                                                {item.deletedAt}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-red-500 font-mono text-xs font-bold">{item.expiresIn}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleRestore(item.id)}
                                                        className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                                                        title="Restore"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteForever(item.id)}
                                                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
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
