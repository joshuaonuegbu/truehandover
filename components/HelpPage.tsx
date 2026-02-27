
import React, { useState } from 'react';
import {
    Search, ChevronDown, ChevronUp, ArrowLeft,
    CreditCard, FileText, Shield, User,
    MessageCircle, ExternalLink, HelpCircle,
    Layout, Lock, Zap, Box, LifeBuoy
} from 'lucide-react';
import { playClick } from '../utils/sound';
import { Card, GRADIENT_TEXT } from './Shared';

export default function HelpPage({ onBack }: { onBack: () => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [activeCategory, setActiveCategory] = useState<'all' | 'payments' | 'delivery' | 'client'>('all');

    const faqs = [
        {
            category: 'payments',
            q: "How do I get paid?",
            a: "TrueHandover integrates directly with Stripe Connect. When you link your bank account in Settings, client payments flow directly to you. We do not hold your funds in a wallet, ensuring faster payouts and reduced platform risk."
        },
        {
            category: 'payments',
            q: "Are there platform fees?",
            a: "We charge a flat monthly subscription for the software. We do not take a percentage of your project revenue. Standard Stripe processing fees (approx. 2.9% + 30¢) still apply to transactions."
        },
        {
            category: 'delivery',
            q: "What does the client see before paying?",
            a: "Clients receive a secure link to view watermarked, low-resolution previews of your assets. For documents (PDFs), they see the first page. For videos, they see a short clip. The high-resolution original files remain locked in the vault until payment is confirmed."
        },
        {
            category: 'delivery',
            q: "Can I use my own storage provider?",
            a: "Yes. On the Agency plan, you can connect your own AWS S3 bucket or Google Drive. TrueHandover acts as the gatekeeper, managing access permissions while the files reside on your own infrastructure."
        },
        {
            category: 'client',
            q: "Does my client need to create an account?",
            a: "No. We believe in zero-friction handovers. Your client accesses the project via a unique, secure link. They can review assets and make payments as a guest without signing up."
        },
        {
            category: 'payments',
            q: "What happens if a payment fails?",
            a: "The files remain locked. The client is notified immediately to try a different method. You will receive an alert, but your assets remain secure until a successful charge is verified by our system."
        },
        {
            category: 'delivery',
            q: "How does the Dispute Evidence Pack work?",
            a: "If a client attempts a chargeback claiming non-delivery, you can generate an Evidence Pack. This is a downloadable PDF containing timestamped access logs, IP addresses of the downloader, and file hash verifications to prove the service was fulfilled."
        }
    ];

    const filteredFaqs = faqs.filter(f =>
        (activeCategory === 'all' || f.category === activeCategory) &&
        (f.q.toLowerCase().includes(searchTerm.toLowerCase()) || f.a.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const toggleFaq = (index: number) => {
        playClick();
        setOpenIndex(openIndex === index ? null : index);
    };

    const CategoryButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => { playClick(); setActiveCategory(id); }}
            className={`
                flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all border
                ${activeCategory === id
                    ? 'bg-obsidian text-white border-obsidian dark:bg-white dark:text-black dark:border-white shadow-lg'
                    : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-200 dark:hover:border-white/20'
                }
            `}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    return (
        <div className="animate-slide-up relative z-10 max-w-5xl mx-auto pb-24 px-4 sm:px-6">

            {/* Minimalist Header */}
            <div className="flex flex-col items-center text-center py-16 space-y-6">
                <button
                    onClick={() => { playClick(); onBack(); }}
                    className="absolute top-0 left-0 p-3 rounded-full bg-white dark:bg-white/5 hover:bg-editorial dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/5 group"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:-translate-x-1 transition-transform" />
                </button>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-100 dark:bg-brand/10 text-brand-hover dark:text-brand text-[10px] font-bold uppercase tracking-widest mb-4">
                    <LifeBuoy className="w-3 h-3" /> TrueHandover Support
                </div>

                <h1 className="font-serif text-5xl md:text-6xl font-medium text-obsidian dark:text-white tracking-tight leading-[1.1]">
                    How can we <span className="italic text-brand dark:text-brand">help</span>?
                </h1>

                <p className="text-slate-500 dark:text-slate-400 text-lg max-w-lg mx-auto leading-relaxed">
                    Guides and documentation for secure asset delivery and payments.
                </p>

                {/* Elegant Search Bar */}
                <div className="w-full max-w-xl relative group mt-8">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-obsidian dark:group-focus-within:text-white transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-5 bg-white dark:bg-[#1a1a23] border border-slate-200 dark:border-white/10 rounded-2xl leading-5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500/20 focus:border-lime-500 transition-all shadow-xl shadow-slate-200/40 dark:shadow-none text-obsidian dark:text-white font-medium"
                        placeholder="Search for answers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap justify-center gap-3 mb-16">
                <CategoryButton id="all" label="All Topics" icon={Layout} />
                <CategoryButton id="payments" label="Payments" icon={CreditCard} />
                <CategoryButton id="delivery" label="Delivery" icon={Box} />
                <CategoryButton id="client" label="Client View" icon={User} />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Main FAQ Column */}
                <div className="lg:col-span-8 space-y-4">
                    {filteredFaqs.length > 0 ? (
                        filteredFaqs.map((faq, index) => (
                            <div
                                key={index}
                                className={`
                                    group rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer
                                    ${openIndex === index
                                        ? 'bg-white dark:bg-charcoal border-slate-200 dark:border-white/10 shadow-lg'
                                        : 'bg-white/50 dark:bg-white/5 border-transparent hover:bg-white dark:hover:bg-white/10 hover:border-slate-200 dark:hover:border-white/10'
                                    }
                                `}
                                onClick={() => toggleFaq(index)}
                            >
                                <div className="p-6 flex justify-between items-start gap-4">
                                    <h3 className={`font-serif text-lg font-medium leading-tight ${openIndex === index ? 'text-obsidian dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {faq.q}
                                    </h3>
                                    <div className={`mt-1 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                    </div>
                                </div>
                                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${openIndex === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                    <div className="overflow-hidden">
                                        <div className="px-6 pb-6 pt-0">
                                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                                                {faq.a}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 opacity-50">
                            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500 font-serif text-xl">No articles found.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Contact Card */}
                    <Card className="!p-8 bg-obsidian dark:bg-white text-white dark:text-obsidian">
                        <MessageCircle className="w-10 h-10 mb-6 text-lime-400 dark:text-brand" />
                        <h3 className="font-serif text-2xl mb-2">Need assistance?</h3>
                        <p className="text-sm opacity-80 mb-8 leading-relaxed">
                            Our support team is available Mon-Fri to help with transactions and disputes.
                        </p>
                        <button className="w-full py-4 bg-white/10 dark:bg-slate-200 dark:text-obsidian border border-white/20 dark:border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/20 dark:hover:bg-slate-200 transition-all">
                            Contact Support
                        </button>
                    </Card>

                    {/* Resources */}
                    <Card className="!p-6">
                        <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-6">Quick Links</h4>
                        <ul className="space-y-4">
                            {[
                                { label: 'Billing Settings', icon: CreditCard },
                                { label: 'Security Policy', icon: Lock },
                                { label: 'API Documentation', icon: FileText },
                            ].map((item, i) => (
                                <li key={i} className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 group-hover:text-brand dark:group-hover:text-brand transition-colors">
                                        <item.icon className="w-4 h-4" />
                                        <span className="font-medium text-sm">{item.label}</span>
                                    </div>
                                    <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
}
