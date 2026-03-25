
import React, { useState } from 'react';
import {
    Search, ChevronDown,
    CreditCard, FileText, User,
    MessageCircle, ExternalLink, HelpCircle,
    Layout, Lock, Box, LifeBuoy
} from 'lucide-react';
import { playClick } from '../utils/sound';
import { Card } from './Shared';

export default function HelpPage({ onBack }: { onBack: () => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [activeCategory, setActiveCategory] = useState<'all' | 'payments' | 'delivery' | 'client'>('all');

    const faqs = [
        {
            category: 'payments',
            q: "How do I get paid?",
            a: "Heartflair integrates directly with Stripe Connect. When you link your bank account in Settings, client payments flow directly to you. We do not hold your funds in a wallet, ensuring faster payouts and reduced platform risk."
        },
        {
            category: 'client',
            q: "Does my client need to create an account?",
            a: "No. We believe in zero-friction projects. Your client accesses the project via a unique, secure link. They can review assets and make payments as a guest without signing up."
        },
        {
            category: 'payments',
            q: "Are there platform fees?",
            a: "We charge a flat monthly subscription for the software. We do not take a percentage of your project revenue. Standard Stripe processing fees (approx. 2.9% + 30Â¢) still apply to transactions."
        },
        {
            category: 'delivery',
            q: "What does the client see before paying?",
            a: "Clients receive a secure link to view watermarked, low-resolution previews of your assets. For documents (PDFs), they see the first page. For videos, they see a short clip. The high-resolution original files remain locked in the vault until payment is confirmed."
        },
        {
            category: 'delivery',
            q: "Can I use my own storage provider?",
            a: "Yes. On the Agency plan, you can connect your own AWS S3 bucket or Google Drive. Heartflair acts as the gatekeeper, managing access permissions while the files reside on your own infrastructure."
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
                    : 'bg-white dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border-zinc-200/50 dark:border-white/10 hover:border-zinc-200/50 dark:hover:border-white/20'
                }
            `}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    return (
        <div className="animate-slide-up relative z-10 pb-12">

            {/* Slide-in style header */}
            <div className="shrink-0 flex flex-col gap-5 border-b border-zinc-200/50 dark:border-white/5 pb-7">
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-3">
                            <LifeBuoy className="w-3 h-3" /> Heartflair Support
                        </div>
                        <h1 className="font-sans tracking-tight text-4xl md:text-5xl font-medium text-zinc-900 dark:text-white leading-[1.05]">
                            Help & <span className="text-blue-600 dark:text-blue-400">Documentation</span>
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-base mt-2">
                            Guides for secure asset delivery, payments, and client access.
                        </p>
                    </div>
                    <button
                        onClick={() => { playClick(); onBack(); }}
                        className="h-11 px-5 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors"
                    >
                        Back
                    </button>
                </div>

                {/* Search */}
                <div className="w-full max-w-2xl relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-obsidian dark:group-focus-within:text-white transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-[#1a1a23] border border-zinc-200/50 dark:border-white/10 rounded-2xl leading-5 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-zinc-900 dark:text-white font-medium"
                        placeholder="Search for answers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-3 mb-10 mt-8">
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
                                        ? 'bg-white dark:bg-charcoal border-zinc-200/50 dark:border-white/10 shadow-lg'
                                        : 'bg-white/50 dark:bg-white/5 border-transparent hover:bg-white dark:hover:bg-white/10 hover:border-zinc-200/50 dark:hover:border-white/10'
                                    }
                                `}
                                onClick={() => toggleFaq(index)}
                            >
                                <div className="p-6 flex justify-between items-start gap-4">
                                    <h3 className={`font-sans tracking-tight text-lg font-medium leading-tight ${openIndex === index ? 'text-obsidian dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                        {faq.q}
                                    </h3>
                                    <div className={`mt-1 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                                        <ChevronDown className="w-5 h-5 text-zinc-400" />
                                    </div>
                                </div>
                                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${openIndex === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                    <div className="overflow-hidden">
                                        <div className="px-6 pb-6 pt-0">
                                            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm">
                                                {faq.a}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 opacity-50">
                            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
                            <p className="text-zinc-500 dark:text-zinc-300 font-sans tracking-tight text-xl">No articles found.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Contact Card */}
                    <Card className="!p-8 bg-white dark:bg-charcoal text-zinc-900 dark:text-white">
                        <MessageCircle className="w-10 h-10 mb-6 text-blue-600 dark:text-brand" />
                        <h3 className="font-sans tracking-tight text-2xl mb-2">Need assistance?</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-200 mb-8 leading-relaxed">
                            Our support team is available Mon-Fri to help with transactions and disputes.
                        </p>
                        <button className="w-full py-4 bg-zinc-900 text-white dark:bg-white/95 dark:text-zinc-900 border border-zinc-200 dark:border-white/60 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-white transition-all">
                            Contact Support
                        </button>
                    </Card>

                    {/* Resources */}
                    <Card className="!p-6">
                        <h4 className="font-bold text-sm uppercase tracking-widest text-zinc-400 mb-6">Quick Links</h4>
                        <ul className="space-y-4">
                            {[
                                { label: 'Billing Settings', icon: CreditCard },
                                { label: 'Security Policy', icon: Lock },
                                { label: 'API Documentation', icon: FileText },
                            ].map((item, i) => (
                                <li key={i} className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300 group-hover:text-brand dark:group-hover:text-brand transition-colors">
                                        <item.icon className="w-4 h-4" />
                                        <span className="font-medium text-sm">{item.label}</span>
                                    </div>
                                    <ExternalLink className="w-3 h-3 text-zinc-300 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
}

