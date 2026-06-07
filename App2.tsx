import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Folder, Settings, Plus, Search, Bell, ChevronDown, ChevronLeft,
  LayoutDashboard, Bookmark, ArrowRight, ArrowUpRight, Image as ImageIcon, FileText, File, MoreVertical,
  Activity, PieChart as ChartIcon, X, UploadCloud, FolderPlus, Download,
  ChevronRight, CheckCircle, AlertCircle, Clock, Filter,
  ShieldAlert, Eye, EyeOff, Copy, QrCode, Mail, HelpCircle, Trash2, Siren, LogOut, Lock, Unlock, Video, Music,
  Inbox, Calendar, Briefcase, Phone, MoreHorizontal, MessageCircle, Send, Package, Users, CreditCard, Link2, DollarSign
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type DisplaySerifFontId =
  | 'fraunces'
  | 'gambarino'
  | 'perplexity'
  | 'playfair-display'
  | 'oranienbaum'
  | 'libre-caslon-display'
  | 'libertinus-serif-display'
  | 'unna'
  | 'sf-covington'
  | 'sf-covington-sc'
  | 'luminary-serif'
  | 'san-de-more'
  | 'dihjauti'
  | 'inria-serif'
  | 'effloresce'
  | 'ascendant-serif'
  | 'avegas-royale'
  | 'liberation-serif'
  | 'linguistics-pro'
  | 'lavolta-swash'
  | 'roxale-story';

const DISPLAY_SERIF_STORAGE_KEY = 'sendational_display_serif_font';

const DISPLAY_SERIF_FONTS: Array<{ id: DisplaySerifFontId; label: string; stack: string }> = [
  { id: 'fraunces', label: 'Fraunces', stack: "'Fraunces', Georgia, serif" },
  { id: 'gambarino', label: 'Gambarino', stack: "'Gambarino', Georgia, serif" },
  { id: 'perplexity', label: 'Perplexity', stack: "'pplxSerif', Georgia, serif" },
  { id: 'playfair-display', label: 'Playfair Display', stack: "'Playfair Display', Georgia, serif" },
  { id: 'oranienbaum', label: 'Oranienbaum', stack: "'Oranienbaum', Georgia, serif" },
  { id: 'libre-caslon-display', label: 'Libre Caslon Display', stack: "'Libre Caslon Display', Georgia, serif" },
  { id: 'libertinus-serif-display', label: 'Libertinus Serif Display', stack: "'Libertinus Serif Display', Georgia, serif" },
  { id: 'unna', label: 'Unna', stack: "'Unna', Georgia, serif" },
  { id: 'sf-covington', label: 'SF Covington', stack: "'SF Covington', Georgia, serif" },
  { id: 'sf-covington-sc', label: 'Covington SC', stack: "'SF Covington SC', 'SF Covington', Georgia, serif" },
  { id: 'luminary-serif', label: 'Luminary Serif', stack: "'Luminary Serif', Georgia, serif" },
  { id: 'san-de-more', label: 'San de More', stack: "'San de More', Georgia, serif" },
  { id: 'dihjauti', label: 'Dihjauti', stack: "'Dihjauti', Georgia, serif" },
  { id: 'inria-serif', label: 'Inria Serif', stack: "'Inria Serif', Georgia, serif" },
  { id: 'effloresce', label: 'Effloresce', stack: "'Effloresce', Georgia, serif" },
  { id: 'ascendant-serif', label: 'Ascendant Serif', stack: "'Ascendant Serif - Personal Use', 'Ascendant Serif', Georgia, serif" },
  { id: 'avegas-royale', label: 'Avegas Royale', stack: "'Avegas Royale', Georgia, serif" },
  { id: 'liberation-serif', label: 'Liberation Serif', stack: "'Liberation Serif', 'Times New Roman', serif" },
  { id: 'linguistics-pro', label: 'Linguistics Pro', stack: "'Linguistics Pro', Georgia, serif" },
  { id: 'lavolta-swash', label: 'Lavolta Swash', stack: "'Lavolta Swash', 'Lavolta', Georgia, serif" },
  { id: 'roxale-story', label: 'Roxale Story', stack: "'Roxale Story', Georgia, serif" },
];

// --- MOCK DATA ---
const STORAGE_DATA = [
  { name: 'Documents', value: 68, color: '#d8c78c' },
  { name: 'Images', value: 55, color: '#3d4f8f' },
  { name: 'Videos', value: 62, color: '#90c29a' },
  { name: 'Free', value: 315, color: '#3f3131' },
];

interface ProjectFile {
  name: string;
  size: string;
  type: 'image' | 'video' | 'pdf' | 'archive' | 'audio' | 'generic';
  locked: boolean;
  previewUrl?: string;
}

interface ProjectClient {
  name: string;
  email?: string;
  avatar?: string;
}

interface Project {
  id: string;
  name: string;
  client: ProjectClient;
  status: 'Paid' | 'Draft' | 'Failed' | 'Pending' | 'Unpaid';
  amount: number;
  date: string;
  clientLink: string;
  files: ProjectFile[];
  accessConfig?: {
    viewCount?: number;
  };
  clientViewedAt?: string;
}

type WorkspaceTab = 'overview' | 'files' | 'messages' | 'activity' | 'notes' | 'storage' | 'billing';
type WorkspaceTargetTab = WorkspaceTab | 'client' | 'portal';

interface ActivityEventFile {
  name: string;
  size: string;
  type: string;
  previewUrl?: string;
  locked?: boolean;
}

interface ActivityEventSignee {
  name: string;
  status: 'Signed' | 'Pending';
}

interface ActivityEvent {
  id: string;
  dateGroup: string;
  type: 'financial' | 'access' | 'system';
  title: string;
  client: string;
  clientAvatar: string;
  description: string;
  time: string;
  amount?: string;
  isAmountPositive?: boolean;
  status?: string;
  isNew: boolean;
  icon: React.ElementType;
  details: {
    portalUrl?: string;
    ipAddress?: string;
    browser?: string;
    files?: ActivityEventFile[];
    paymentMethod?: string;
    transactionId?: string;
    receiptBreakdown?: { gross: string; fee: string; net: string };
    signees?: ActivityEventSignee[];
    paymentLink?: string;
    creationMetadata?: string;
  };
}

const ACTIVITY_LOG_EVENTS: ActivityEvent[] = [
  {
    id: 'evt-001',
    dateGroup: 'TODAY',
    type: 'access',
    title: 'Client Viewed',
    client: 'Acme Corp',
    clientAvatar: 'https://i.pravatar.cc/150?img=32',
    description: 'Delivery viewed by client',
    time: '16:12 PM',
    isNew: true,
    icon: Eye,
    details: {
      portalUrl: 'deliver.sendational.com/c/acme-brand-refresh',
      ipAddress: '192.168.1.44',
      browser: 'Safari on macOS',
      files: [
        { name: 'logo_final.png', size: '1.8 MB', type: 'image', previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60' },
        { name: 'colors.png', size: '12 KB', type: 'image', previewUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=200&auto=format&fit=crop&q=60' }
      ]
    }
  },
  {
    id: 'evt-002',
    dateGroup: 'TODAY',
    type: 'financial',
    title: 'Payment Settled',
    client: 'Startup Inc',
    clientAvatar: 'https://i.pravatar.cc/150?img=53',
    description: 'Website Redesign - Mono',
    time: '12:30 PM',
    amount: '+$5,000',
    isAmountPositive: true,
    status: 'Cleared',
    isNew: false,
    icon: CheckCircle,
    details: {
      paymentMethod: 'Stripe (Visa **** 4242)',
      transactionId: 'ch_3M52skF',
      receiptBreakdown: { gross: '$5,000.00', fee: '-$150.00', net: '$4,850.00' }
    }
  },
  {
    id: 'evt-003',
    dateGroup: 'TODAY',
    type: 'access',
    title: 'Delivery unlocked',
    client: 'Startup Inc',
    clientAvatar: 'https://i.pravatar.cc/150?img=53',
    description: 'Assets released to client',
    time: '12:30 PM',
    status: 'Unlocked',
    isNew: false,
    icon: Clock,
    details: {
      portalUrl: 'deliver.sendational.com/c/startup-marketing',
      files: [
        { name: 'cover_photo.jpg', size: '2.4 MB', type: 'image', previewUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&auto=format&fit=crop&q=60' }
      ]
    }
  },
  {
    id: 'evt-004',
    dateGroup: 'YESTERDAY',
    type: 'system',
    title: 'Files uploaded',
    client: 'GlobalTech',
    clientAvatar: 'https://i.pravatar.cc/150?img=11',
    description: 'UX research recordings & sheets',
    time: '17:45 PM',
    isNew: false,
    icon: UploadCloud,
    details: {
      files: [
        { name: 'interview_recording.mp4', size: '89 MB', type: 'video' },
        { name: 'survey_results.xlsx', size: '1.2 MB', type: 'generic' }
      ]
    }
  },
  {
    id: 'evt-005',
    dateGroup: 'NOV 14',
    type: 'system',
    title: 'Awaiting signature',
    client: 'Startup Inc',
    clientAvatar: 'https://i.pravatar.cc/150?img=53',
    description: 'Contract sent for e-signature',
    time: '10:15 AM',
    status: 'Pending',
    isNew: false,
    icon: AlertCircle,
    details: {
      files: [
        { name: 'Startup Inc Retainer.pdf', size: '1.4 MB', type: 'pdf' }
      ],
      signees: [
        { name: 'Jennifer Rass', status: 'Signed' },
        { name: 'Ambrose Heman', status: 'Pending' }
      ]
    }
  },
  {
    id: 'evt-006',
    dateGroup: 'OCT 31',
    type: 'financial',
    title: 'Invoice Pending',
    client: 'GlobalTech',
    clientAvatar: 'https://i.pravatar.cc/150?img=11',
    description: 'Invoice #INV-2026-004 sent',
    time: '14:20 PM',
    amount: '+$2,500',
    isAmountPositive: true,
    status: 'Pending',
    isNew: false,
    icon: FileText,
    details: {
      paymentLink: 'pay.sendational.com/i/globaltech-ux-phase2',
      receiptBreakdown: { gross: '$2,500.00', fee: '-$75.00', net: '$2,425.00' }
    }
  },
  {
    id: 'evt-007',
    dateGroup: 'OCT 12',
    type: 'system',
    title: 'Project created',
    client: 'Acme Corp',
    clientAvatar: 'https://i.pravatar.cc/150?img=32',
    description: 'Initial project setup & portal creation',
    time: '09:00 AM',
    isNew: false,
    icon: Plus,
    details: {
      creationMetadata: 'Portal link generated: deliver.sendational.com/c/acme-brand-refresh. Initial scope: Q3 Brand Identity Redesign.'
    }
  },
  {
    id: 'evt-008',
    dateGroup: 'SEP 28',
    type: 'financial',
    title: 'Payment Failed',
    client: 'Broken Co',
    clientAvatar: 'https://i.pravatar.cc/150?img=40',
    description: 'Card declined on Phase 1 invoice',
    time: '11:05 AM',
    amount: '+$1,500',
    isAmountPositive: false,
    status: 'Failed',
    isNew: false,
    icon: ShieldAlert,
    details: {
      paymentMethod: 'Credit Card (Mastercard **** 9830)',
      transactionId: 'txn_declined_broken',
      receiptBreakdown: { gross: '$1,500.00', fee: '$0.00', net: '$0.00' }
    }
  }
];

const PROJECTS: Project[] = [
  { 
    id: 'PRJ-001c89f2', 
    name: 'Brand Identity Redesign', 
    client: { 
      name: 'Acme Corp', 
      email: 'design@acme.corp',
      avatar: 'https://i.pravatar.cc/150?img=32'
    }, 
    status: 'Pending' as const, 
    amount: 12400, 
    date: 'Oct 12',
    clientLink: 'acme-brand-refresh',
    files: [
      { name: 'Brand Guide.pdf', size: '4.2 MB', type: 'pdf' as const, locked: true },
      { name: 'logo_final.png', size: '1.8 MB', type: 'image' as const, locked: false, previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60' },
      { name: 'typography_specs.pdf', size: '950 KB', type: 'pdf' as const, locked: true },
      { name: 'colors.png', size: '12 KB', type: 'image' as const, locked: false, previewUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=200&auto=format&fit=crop&q=60' },
      { name: 'social_templates.png', size: '124 MB', type: 'image' as const, locked: true, previewUrl: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=200&auto=format&fit=crop&q=60' }
    ],
    accessConfig: { viewCount: 14 },
    clientViewedAt: '2026-05-29'
  },
  { 
    id: 'PRJ-001c89f3', 
    name: 'Q1 Web Platform Launch', 
    client: { 
      name: 'Acme Corp', 
      email: 'design@acme.corp',
      avatar: 'https://i.pravatar.cc/150?img=32'
    }, 
    status: 'Paid' as const, 
    amount: 8500, 
    date: 'May 20',
    clientLink: 'acme-web-refresh',
    files: [
      { name: 'landing_layout.psd', size: '24 MB', type: 'image' as const, locked: false, previewUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=200&auto=format&fit=crop&q=60' },
      { name: 'seo_keyword_brief.pdf', size: '1.2 MB', type: 'pdf' as const, locked: false }
    ],
    accessConfig: { viewCount: 42 },
    clientViewedAt: '2026-05-22'
  },
  { 
    id: 'PRJ-002a7b8e', 
    name: 'UX Research & Testing', 
    client: { 
      name: 'GlobalTech', 
      email: 'ux@globaltech.com',
      avatar: 'https://i.pravatar.cc/150?img=11'
    }, 
    status: 'Draft' as const, 
    amount: 8200, 
    date: 'Oct 15',
    clientLink: 'globaltech-ux-phase2',
    files: [
      { name: 'interview_recording.mp4', size: '89 MB', type: 'video' as const, locked: false, previewUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
      { name: 'survey_results.xlsx', size: '1.2 MB', type: 'generic' as const, locked: false }
    ],
    accessConfig: { viewCount: 0 },
    clientViewedAt: undefined
  },
  { 
    id: 'PRJ-002a7b8f', 
    name: 'Strategic Dashboard Concept', 
    client: { 
      name: 'GlobalTech', 
      email: 'ux@globaltech.com',
      avatar: 'https://i.pravatar.cc/150?img=11'
    }, 
    status: 'Paid' as const, 
    amount: 16600, 
    date: 'Jun 12',
    clientLink: 'gt-strategy',
    files: [
      { name: 'strategy_deck.pdf', size: '3.1 MB', type: 'pdf' as const, locked: false },
      { name: 'architecture_layout.png', size: '4.8 MB', type: 'image' as const, locked: false, previewUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=200&auto=format&fit=crop&q=60' }
    ],
    accessConfig: { viewCount: 88 },
    clientViewedAt: '2026-06-15'
  },
  { 
    id: 'PRJ-003ff5b4', 
    name: 'Marketing Asset Pack', 
    client: { 
      name: 'Startup Inc', 
      email: 'press@startup.io',
      avatar: 'https://i.pravatar.cc/150?img=53'
    }, 
    status: 'Paid' as const, 
    amount: 4500, 
    date: 'Oct 02',
    clientLink: 'startup-marketing',
    files: [
      { name: 'cover_photo.jpg', size: '2.4 MB', type: 'image' as const, locked: false, previewUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&auto=format&fit=crop&q=60' }
    ],
    accessConfig: { viewCount: 3 },
    clientViewedAt: '2026-05-20'
  },
  { 
    id: 'PRJ-003ff5b5', 
    name: 'Product Pitch Assets', 
    client: { 
      name: 'Startup Inc', 
      email: 'press@startup.io',
      avatar: 'https://i.pravatar.cc/150?img=53'
    }, 
    status: 'Pending' as const, 
    amount: 3200, 
    date: 'Jul 04',
    clientLink: 'startup-pitch',
    files: [
      { name: 'pitch_deck_v2.pdf', size: '5.2 MB', type: 'pdf' as const, locked: true },
      { name: 'pricing_structure.xlsx', size: '340 KB', type: 'generic' as const, locked: false }
    ],
    accessConfig: { viewCount: 15 },
    clientViewedAt: '2026-07-06'
  },
  { 
    id: 'PRJ-001c89f4', 
    name: 'Corporate Video Reel', 
    client: { 
      name: 'Acme Corp', 
      email: 'design@acme.corp',
      avatar: 'https://i.pravatar.cc/150?img=32'
    }, 
    status: 'Paid' as const, 
    amount: 9800, 
    date: 'Oct 05',
    clientLink: 'acme-video-reel',
    files: [
      { name: 'Brand_Video_Draft.mp4', size: '85 MB', type: 'video' as const, locked: false },
      { name: 'storyboard_review.pdf', size: '3.4 MB', type: 'pdf' as const, locked: false }
    ],
    accessConfig: { viewCount: 22 },
    clientViewedAt: '2026-05-10'
  },
  { 
    id: 'PRJ-001c89f5', 
    name: 'Mobile App Prototype UI', 
    client: { 
      name: 'Acme Corp', 
      email: 'design@acme.corp',
      avatar: 'https://i.pravatar.cc/150?img=32'
    }, 
    status: 'Paid' as const, 
    amount: 14500, 
    date: 'Sep 18',
    clientLink: 'acme-mobile-app',
    files: [
      { name: 'mobile_layout.png', size: '2.4 MB', type: 'image' as const, locked: false, previewUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=200&auto=format&fit=crop&q=60' },
      { name: 'user_flows.pdf', size: '1.1 MB', type: 'pdf' as const, locked: false }
    ],
    accessConfig: { viewCount: 56 },
    clientViewedAt: '2026-05-20'
  },
  { 
    id: 'PRJ-001c89f6', 
    name: 'Q3 Newsletter & Social Assets', 
    client: { 
      name: 'Acme Corp', 
      email: 'design@acme.corp',
      avatar: 'https://i.pravatar.cc/150?img=32'
    }, 
    status: 'Paid' as const, 
    amount: 3500, 
    date: 'Aug 04',
    clientLink: 'acme-q3-assets',
    files: [
      { name: 'newsletter_v1.pdf', size: '800 KB', type: 'pdf' as const, locked: false },
      { name: 'social_banners.zip', size: '12 MB', type: 'archive' as const, locked: false }
    ],
    accessConfig: { viewCount: 19 },
    clientViewedAt: '2026-05-05'
  },
  { 
    id: 'PRJ-002a7b90', 
    name: 'Data Security Platform Design', 
    client: { 
      name: 'GlobalTech', 
      email: 'ux@globaltech.com',
      avatar: 'https://i.pravatar.cc/150?img=11'
    }, 
    status: 'Paid' as const, 
    amount: 22000, 
    date: 'Sep 10',
    clientLink: 'gt-security-design',
    files: [
      { name: 'security_flowchart.pdf', size: '2.1 MB', type: 'pdf' as const, locked: false },
      { name: 'encryption_specs.docx', size: '950 KB', type: 'generic' as const, locked: false }
    ],
    accessConfig: { viewCount: 110 },
    clientViewedAt: '2026-06-18'
  },
  { 
    id: 'PRJ-002a7b91', 
    name: 'Enterprise Brand Guidelines', 
    client: { 
      name: 'GlobalTech', 
      email: 'ux@globaltech.com',
      avatar: 'https://i.pravatar.cc/150?img=11'
    }, 
    status: 'Paid' as const, 
    amount: 18500, 
    date: 'Aug 22',
    clientLink: 'gt-brand-guide',
    files: [
      { name: 'gt_brandbook.pdf', size: '8.9 MB', type: 'pdf' as const, locked: false },
      { name: 'vector_logos.zip', size: '15 MB', type: 'archive' as const, locked: false }
    ],
    accessConfig: { viewCount: 95 },
    clientViewedAt: '2026-06-25'
  },
  { 
    id: 'PRJ-002a7b92', 
    name: 'Compliance Dashboard UX Audit', 
    client: { 
      name: 'GlobalTech', 
      email: 'ux@globaltech.com',
      avatar: 'https://i.pravatar.cc/150?img=11'
    }, 
    status: 'Paid' as const, 
    amount: 9400, 
    date: 'Jul 15',
    clientLink: 'gt-ux-compliance',
    files: [
      { name: 'ux_report_final.pdf', size: '4.6 MB', type: 'pdf' as const, locked: false }
    ],
    accessConfig: { viewCount: 34 },
    clientViewedAt: '2026-06-10'
  },
  { 
    id: 'PRJ-003ff5b6', 
    name: 'Pitch Deck Design v1', 
    client: { 
      name: 'Startup Inc', 
      email: 'press@startup.io',
      avatar: 'https://i.pravatar.cc/150?img=53'
    }, 
    status: 'Paid' as const, 
    amount: 2800, 
    date: 'Aug 12',
    clientLink: 'startup-pitch-v1',
    files: [
      { name: 'investor_deck_v1.pdf', size: '6.2 MB', type: 'pdf' as const, locked: false }
    ],
    accessConfig: { viewCount: 18 },
    clientViewedAt: '2026-05-15'
  },
  { 
    id: 'PRJ-003ff5b7', 
    name: 'Website Wireframing & Assets', 
    client: { 
      name: 'Startup Inc', 
      email: 'press@startup.io',
      avatar: 'https://i.pravatar.cc/150?img=53'
    }, 
    status: 'Paid' as const, 
    amount: 6200, 
    date: 'Jun 25',
    clientLink: 'startup-wireframes',
    files: [
      { name: 'wireframes.png', size: '1.8 MB', type: 'image' as const, locked: false, previewUrl: 'https://images.unsplash.com/photo-1541462608141-2f6fdc6d15ee?w=200&auto=format&fit=crop&q=60' },
      { name: 'copywriting_brief.pdf', size: '500 KB', type: 'pdf' as const, locked: false }
    ],
    accessConfig: { viewCount: 45 },
    clientViewedAt: '2026-05-28'
  },
  { 
    id: 'PRJ-003ff5b8', 
    name: 'Exhibition Banner Graphics', 
    client: { 
      name: 'Startup Inc', 
      email: 'press@startup.io',
      avatar: 'https://i.pravatar.cc/150?img=53'
    }, 
    status: 'Paid' as const, 
    amount: 4100, 
    date: 'May 10',
    clientLink: 'startup-banners',
    files: [
      { name: 'banner_designs.zip', size: '24 MB', type: 'archive' as const, locked: false }
    ],
    accessConfig: { viewCount: 12 },
    clientViewedAt: '2026-05-12'
  },
  { 
    id: 'PRJ-004d9a12', 
    name: 'Failed Project Example', 
    client: { 
      name: 'Broken Co', 
      email: 'billing@broken.co',
      avatar: 'https://i.pravatar.cc/150?img=40'
    }, 
    status: 'Failed' as const, 
    amount: 1500, 
    date: 'Sep 28',
    clientLink: 'broken-handoff',
    files: [
      { name: 'pitch_deck.pdf', size: '8.4 MB', type: 'pdf' as const, locked: true }
    ],
    accessConfig: { viewCount: 1 },
    clientViewedAt: '2026-05-18'
  }
];

interface BriefingEvent {
  id: number;
  date: string;
  time: string;
  relTime: string;
  title: string;
  client: string;
  clientName: string;
  projectId: string;
  icon: React.ElementType;
  isNew: boolean;
  targetTab: WorkspaceTab;
  detail: string;
  status: string;
  nextStep: string;
  actionLabel: string;
}

type StoredBriefingEvent = Omit<BriefingEvent, 'icon'> & { evidence?: string };

const BRIEFING_LOOKBACK_DAYS = 30;
const BRIEFING_MAX_VISIBLE_EVENTS = 25;
const BRIEFING_PRIORITY_TERMS = [
  'awaiting',
  'unverified',
  'failed',
  'overdue',
  'expiring',
  'expires',
  'not approved',
  'needs review',
  'revision requested',
  'signature',
  'invoice reminder',
  'manual payment',
  'payment link',
  'payment gate',
  'unlock',
  'risk',
  'pending',
  'open',
  'nudge',
];

const getBriefingEventAgeDays = (event: BriefingEvent) => {
  const rel = event.relTime.toLowerCase().trim();
  const label = event.date.toLowerCase().trim();

  if (rel === 'just now' || label === 'today' || /\d+\s*(m|min|minute|h|hr|hour)/.test(rel)) return 0;
  if (label === 'yesterday') return 1;

  const dayMatch = rel.match(/(\d+)\s*d/);
  if (dayMatch) return Number(dayMatch[1]);

  const weekMatch = rel.match(/(\d+)\s*w/);
  if (weekMatch) return Number(weekMatch[1]) * 7;

  const monthMatch = rel.match(/(\d+)\s*mo/);
  if (monthMatch) return Number(monthMatch[1]) * 30;

  return Number.POSITIVE_INFINITY;
};

const isBriefingPriorityException = (event: BriefingEvent) => {
  const searchable = [
    event.title,
    event.detail,
    event.status,
    event.nextStep,
    event.actionLabel,
  ].join(' ').toLowerCase();

  return BRIEFING_PRIORITY_TERMS.some((term) => searchable.includes(term));
};

type ClientMetadata = {
  email: string;
  poc: string;
  priority: 'VIP' | 'Retainer' | 'Standard';
  sentiment: 'Exceptional' | 'Good' | 'Neutral' | 'At Risk';
  sparklineHistory: number[];
  avatar?: string;
};

const BRIEFING_EVENTS: BriefingEvent[] = [
  { id: 1, date: 'TODAY', time: '10:45 AM', relTime: '2m ago', title: 'Project created', client: 'ACME CORP', clientName: 'Acme Corp', projectId: 'PRJ-001c89f2', icon: Plus, isNew: true, targetTab: 'overview', detail: 'Brand Identity Redesign is now active with a $3,200 budget and Sep 12 delivery target.', status: 'Workspace created; client-facing files are still locked.', nextStep: 'Add the first visible deliverables before sharing the portal.', actionLabel: 'Open project' },
  { id: 2, date: 'TODAY', time: '09:30 AM', relTime: '1h ago', title: 'Files uploaded', client: 'GLOBALTECH', clientName: 'GlobalTech', projectId: 'PRJ-002a7b8e', icon: UploadCloud, isNew: false, targetTab: 'files', detail: 'Phase 2 compliance assets were added to the GlobalTech portal queue.', status: '2 visible assets and 1 locked draft are waiting in Files & Portal.', nextStep: 'Review visibility before sending the compliance team an update.', actionLabel: 'Review files' },
  { id: 3, date: 'YESTERDAY', time: '04:15 PM', relTime: '18h ago', title: 'Client viewed', client: 'STARTUP INC', clientName: 'Startup Inc', projectId: 'PRJ-003ff5b4', icon: Clock, isNew: false, targetTab: 'activity', detail: 'Startup Inc opened the retainer portal after the latest draft visibility change.', status: '4 total portal visits are logged for this workspace.', nextStep: 'Check whether the view happened before or after the draft lock.', actionLabel: 'View activity' },
  { id: 4, date: '25 MAY', time: '11:00 AM', relTime: '11d ago', title: 'Payment received', client: 'ACME CORP', clientName: 'Acme Corp', projectId: 'PRJ-001c89f2', icon: CheckCircle, isNew: false, targetTab: 'billing', detail: 'A payment was recorded against the Acme Brand Identity Redesign balance.', status: 'Partial collection is recorded; remaining project value is still open.', nextStep: 'Confirm the next milestone before unlocking final assets.', actionLabel: 'Open billing' },
  { id: 5, date: '20 MAY', time: '02:30 PM', relTime: '16d ago', title: 'Awaiting signature', client: 'STARTUP INC', clientName: 'Startup Inc', projectId: 'PRJ-003ff5b4', icon: AlertCircle, isNew: false, targetTab: 'notes', detail: 'Startup Inc still needs signature confirmation before final files should be unlocked.', status: 'Contract confirmation and draft-lock checklist items remain open.', nextStep: 'Follow up on signature, then mark final file release as clear.', actionLabel: 'Open notes' },
  { id: 6, date: '19 MAY', time: '08:45 AM', relTime: '17d ago', title: 'Portal link copied', client: 'GLOBALTECH', clientName: 'GlobalTech', projectId: 'PRJ-002a7b8e', icon: Copy, isNew: false, targetTab: 'files', detail: 'The GlobalTech portal link was copied for sharing with their compliance team.', status: 'Portal access has 12 views with compliance assets visible.', nextStep: 'Verify the copied link points to the current portal state.', actionLabel: 'Open portal' },
  { id: 7, date: '18 MAY', time: '03:20 PM', relTime: '18d ago', title: 'Invoice reminder sent', client: 'ACME CORP', clientName: 'Acme Corp', projectId: 'PRJ-001c89f2', icon: Mail, isNew: false, targetTab: 'billing', detail: 'An invoice reminder was sent to Acme for the next delivery phase.', status: 'Stripe invoice and manual payment instructions are still open.', nextStep: 'Check payment status before the next client update.', actionLabel: 'Check invoice' },
  { id: 8, date: '17 MAY', time: '01:10 PM', relTime: '19d ago', title: 'Asset visibility changed', client: 'STARTUP INC', clientName: 'Startup Inc', projectId: 'PRJ-003ff5b4', icon: Eye, isNew: false, targetTab: 'files', detail: 'Startup Inc asset visibility changed after draft folders were locked for review.', status: 'Visible file count changed while final package remains restricted.', nextStep: 'Confirm the client can only see review-safe assets.', actionLabel: 'Check visibility' },
  { id: 9, date: '16 MAY', time: '10:15 AM', relTime: '20d ago', title: 'Client note updated', client: 'GLOBALTECH', clientName: 'GlobalTech', projectId: 'PRJ-002a7b8e', icon: FileText, isNew: false, targetTab: 'notes', detail: 'A private note was updated for GlobalTech compliance review preferences.', status: 'Notes mention Sarah Jenkins, phase 2 statements, and hidden audit files.', nextStep: 'Use the note before preparing the next delivery summary.', actionLabel: 'Open notes' },
  { id: 10, date: '15 MAY', time: '05:00 PM', relTime: '21d ago', title: 'Final files downloaded', client: 'ACME CORP', clientName: 'Acme Corp', projectId: 'PRJ-001c89f2', icon: File, isNew: false, targetTab: 'activity', detail: 'Acme downloaded a final file package from the portal.', status: 'Final package access is logged in activity history.', nextStep: 'Confirm the download happened after payment clearance.', actionLabel: 'View activity' },
  { id: 11, date: '14 MAY', time: '09:00 AM', relTime: '22d ago', title: 'Review comment added', client: 'STARTUP INC', clientName: 'Startup Inc', projectId: 'PRJ-003ff5b4', icon: Activity, isNew: false, targetTab: 'messages', detail: 'Startup Inc added review feedback that may need a response before the next draft.', status: 'Client feedback is tied to the current retainer folder.', nextStep: 'Reply or convert the comment into a priority item.', actionLabel: 'Open messages' },
  { id: 12, date: '13 MAY', time: '04:45 PM', relTime: '23d ago', title: 'Brief approved', client: 'GLOBALTECH', clientName: 'GlobalTech', projectId: 'PRJ-002a7b8e', icon: CheckCircle, isNew: false, targetTab: 'overview', detail: 'GlobalTech approved the current brief and the project can move into the next delivery stage.', status: 'Delivery health and portal activity are ready for review.', nextStep: 'Move the project into the next delivery milestone.', actionLabel: 'Open overview' },
  { id: 13, date: '12 MAY', time: '11:30 AM', relTime: '24d ago', title: 'Portal settings changed', client: 'ACME CORP', clientName: 'Acme Corp', projectId: 'PRJ-001c89f2', icon: Settings, isNew: false, targetTab: 'files', detail: 'Acme portal settings changed, likely affecting which deliverables the client can access.', status: 'Portal preview and lock state may no longer match the last share.', nextStep: 'Review current access before sending another link.', actionLabel: 'Review portal' },
  { id: 14, date: '11 MAY', time: '02:15 PM', relTime: '25d ago', title: 'Payment link copied', client: 'STARTUP INC', clientName: 'Startup Inc', projectId: 'PRJ-003ff5b4', icon: Copy, isNew: false, targetTab: 'billing', detail: 'A payment link was copied for Startup Inc retainer collection.', status: 'Payment link is ready, with off-platform instructions still visible.', nextStep: 'Send the link with a short retainer context note.', actionLabel: 'Open billing' },
  { id: 15, date: '10 MAY', time: '08:00 AM', relTime: '26d ago', title: 'Client folder archived', client: 'GLOBALTECH', clientName: 'GlobalTech', projectId: 'PRJ-002a7b8e', icon: Folder, isNew: false, targetTab: 'storage', detail: 'An older GlobalTech delivery folder was archived to reduce active workspace noise.', status: 'Archived files remain counted in storage usage.', nextStep: 'Check storage if the client asks for older delivery files.', actionLabel: 'Open storage' },
  { id: 16, date: '09 MAY', time: '03:10 PM', relTime: '27d ago', title: 'New priority added', client: 'ACME CORP', clientName: 'Acme Corp', projectId: 'PRJ-001c89f2', icon: Siren, isNew: false, targetTab: 'notes', detail: 'A priority was added for Acme before the next client review.', status: 'The follow-up is now part of the internal notes checklist.', nextStep: 'Resolve it before sending the next review package.', actionLabel: 'Open priority' },
  { id: 17, date: '08 MAY', time: '10:00 AM', relTime: '28d ago', title: 'Portal traffic spike', client: 'STARTUP INC', clientName: 'Startup Inc', projectId: 'PRJ-003ff5b4', icon: Activity, isNew: false, targetTab: 'activity', detail: 'Startup Inc had a higher-than-normal portal visit pattern.', status: 'Portal visits increased around the latest visibility change.', nextStep: 'Inspect whether repeated views came from the client team.', actionLabel: 'Inspect traffic' },
  { id: 18, date: '07 MAY', time: '01:40 PM', relTime: '29d ago', title: 'Delivery note saved', client: 'GLOBALTECH', clientName: 'GlobalTech', projectId: 'PRJ-002a7b8e', icon: FileText, isNew: false, targetTab: 'notes', detail: 'A delivery note was saved for GlobalTech delivery context.', status: 'Private notes include compliance constraints and delivery instructions.', nextStep: 'Use the saved note in the next client sync.', actionLabel: 'Open note' },
];

const appendBriefingNoteToClientNotes = (
  prev: Record<string, string>,
  clientName: string,
  noteText: string
) => {
  const trimmed = noteText.trim();
  const line = `- ${trimmed}`;
  const existing = prev[clientName]?.trim() ?? '';
  const nextValue = existing ? `${existing}\n\n${line}` : line;
  return { ...prev, [clientName]: nextValue };
};

const INITIAL_CLIENT_NOTES: Record<string, string> = {
  'Acme Corp': 'Preparing video campaign expansion for Q3. Key coordinator is Dave Connor. Prefers Slack alerts.\n\nAction items:\n- Finalize motion graphics drafts\n- Request feedback on colors asset portal\n- Keep final brand package hidden until payment confirmation\n- Add internal note about file naming conventions\n- Send reminder before Friday afternoon review\n\nClient preferences:\n- Short status notes are better than long emails\n- Wants one portal link for all campaign assets\n- Needs social templates grouped by channel',
  'Startup Inc': 'Retainer client since Jan. Uses hidden draft folders and payment gates for final deliverables.\n\nAction items:\n- Confirm final invoice amount before opening download access\n- Keep the pricing sheet hidden until coordinator approval\n- Add a note explaining what changed in the revised deck\n- Prepare alternate logo export sizes\n\nClient preferences:\n- Founder wants quick summaries\n- Marketing lead reviews files late afternoon\n- Keep archive packages separate from preview images',
  'GlobalTech': 'Enterprise project account. Review workflow goes through compliance team before director approval.\n\nAction items:\n- Upload phase 2 compliance statement\n- Confirm Sarah Jenkins has the active portal URL\n- Keep audit-sensitive files hidden until internal approval\n- Add delivery note for encryption spec changes\n\nClient preferences:\n- Compliance board needs concise change summaries\n- Director signs off only after team review\n- Avoid sending duplicate links',
};

const ENGAGEMENT_PULSE_CLIENTS = [
  {
    id: 1,
    name: 'Sarah Connor',
    clientName: 'Acme Corp',
    project: 'Brand Identity Redesign',
    avatar: 'https://i.pravatar.cc/150?img=32',
    isLive: true,
    insight: 'Viewed concepts 3 mins ago',
    sentiment: 'Highly engaged',
    actionLabel: 'Chat now',
    tone: 'positive' as const,
  },
  {
    id: 2,
    name: 'David Miller',
    clientName: 'GlobalTech',
    project: 'UX Research & Testing',
    avatar: 'https://i.pravatar.cc/150?img=11',
    isLive: false,
    insight: "Haven't opened agreement in 4 days",
    sentiment: 'Needs nudge',
    actionLabel: 'Send reminder',
    tone: 'warning' as const,
  },
  {
    id: 3,
    name: 'Emma Watson',
    clientName: 'Startup Inc',
    project: 'Marketing Asset Pack',
    avatar: 'https://i.pravatar.cc/150?img=53',
    isLive: true,
    insight: 'Downloaded pitch deck twice today',
    sentiment: 'Warming up',
    actionLabel: 'Review activity',
    tone: 'neutral' as const,
  },
];

/** @deprecated alias ï¿½ engagement pulse uses live flag only */
const RADAR_CLIENTS = ENGAGEMENT_PULSE_CLIENTS.map((c) => ({
  id: c.id,
  name: c.name,
  project: c.project,
  avatar: c.avatar,
  isLive: c.isLive,
  isIdle: !c.isLive,
}));

const PRIORITIES = [
  { id: 1, severity: 'AWAITING SIGNATURE', message: 'Acme Corp Agreement', icon: ShieldAlert, iconBg: 'bg-[#3d4f8f]/10 text-[#3d4f8f]', severityColor: 'text-[#3d4f8f]' },
  { id: 2, severity: 'AWAITING PAYMENT', message: 'Startup Inc Retainer', icon: Clock, iconBg: 'bg-[#d8c78c]/10 text-[#d8c78c]', severityColor: 'text-[#d8c78c]' },
  { id: 3, severity: 'PAYMENT CONFIRMED', message: 'GlobalTech Phase 1', icon: CheckCircle, iconBg: 'bg-[#90c29a]/10 text-[#90c29a]', severityColor: 'text-[#90c29a]' },
];

const AVATARS = [
  'https://i.pravatar.cc/150?img=47',
  'https://i.pravatar.cc/150?img=12',
  'https://i.pravatar.cc/150?img=5',
];

const Avatar = ({ src, className, initials }: { src?: string, className?: string, initials?: string }) => (
  <div className={cn("flex items-center justify-center bg-gray-200 rounded-full overflow-hidden border-2 border-white shrink-0", className)}>
    {src ? <img src={src} alt="Avatar" className="w-full h-full object-cover" /> : <span className="font-bold text-gray-500 text-[10px]">{initials}</span>}
  </div>
);

// --- LOGO COMPONENT ---
const Logo = ({ collapsed }: { collapsed: boolean }) => (
  <div className={cn("flex items-center text-white group cursor-pointer", collapsed ? "justify-center px-0 mb-8" : "justify-center gap-2.5 mb-10")}>
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      aria-hidden="true" 
      className={cn("transition-transform duration-500 ease-out group-hover:rotate-[12deg] text-white shrink-0", collapsed ? "w-[27px] h-[27px]" : "w-[30px] h-[30px]")}
    >
      <path
        d="M4 15C4 10.6 9.4 7 16 7C22.6 7 28 10.6 28 15"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <circle cx="12" cy="22" r="6" stroke="currentColor" strokeWidth={1.5} />
      {/* Right circle filled with white inside Sendational logo */}
      <circle cx="20" cy="22" r="6" fill="white" stroke="currentColor" strokeWidth={1.5} />
    </svg>
    {!collapsed && (
      <span className="font-fraunces font-medium text-[17.5px] leading-none tracking-tight text-white select-none">
        Sendational
      </span>
    )}
  </div>
);

const PriorityMark = () => (
  <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#191c20]">
    <Siren size={20} strokeWidth={1.9} aria-hidden="true" />
  </span>
);

const ANALYTICS_SLIDE_COUNT = 5;

// --- CYCLING ANALYTICS CARD ---
const CyclingAnalyticsCard = ({ 
  isReplying, 
  setIsReplying 
}: { 
  isReplying: boolean; 
  setIsReplying: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReplyClosing, setIsReplyClosing] = useState(false);
  const advanceLockedRef = useRef(false);

  useEffect(() => {
    if (isHovered || isReplying) return;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99) {
          if (!advanceLockedRef.current) {
            advanceLockedRef.current = true;
            setActiveSlide(s => s >= ANALYTICS_SLIDE_COUNT - 1 ? 0 : s + 1);
          }
          return 0;
        }
        if (prev < 5) {
          advanceLockedRef.current = false;
        }
        return prev + 1; // 1% every 100ms = 10s cycle
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isHovered, isReplying]);

  const closeReplyComposer = () => {
    setIsReplyClosing(true);
    window.setTimeout(() => {
      setIsReplyClosing(false);
      setIsReplying(false);
    }, 150);
  };

  const handleDotClick = (index: number) => {
    advanceLockedRef.current = false;
    setActiveSlide(index);
    setProgress(0);
    if (index !== 2) {
      setIsReplying(false);
    }
  };

  const slides = [
    // Slide 0: Monthly income (Minimalistic redesign inspired by gateway widgets)
    (
      <div className="h-full w-full flex flex-col p-6 pb-10 justify-between text-[#191c20] select-none relative bg-transparent">
        {/* Top Section */}
        <div className="relative z-10 flex items-start justify-between w-full gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#7eb098] shadow-3xs shrink-0">
              <DollarSign size={16} strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-[0.18em]">MONTHLY INCOME</span>
              <span className="text-[9px] font-sans font-medium text-gray-400 mt-0.5">Jun 1 ï¿½ Jun 30</span>
            </div>
          </div>
          
          {/* Next Payout Capsule Badge */}
          <div className="flex flex-col items-end text-right">
            <span className="text-[7.5px] font-sans font-extrabold uppercase tracking-[0.16em] text-gray-400">NEXT PAYOUT</span>
            <div className="flex items-center gap-1.5 mt-0.5 bg-gray-50/70 px-2 py-0.5 rounded-full border border-gray-150/50">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7eb098] animate-pulse"></span>
              <span className="text-[9.5px] font-sans font-bold text-gray-700">Jun 7</span>
            </div>
          </div>
        </div>

        {/* Main Income Figure - Inspired by gateway widgets with huge lightweight font */}
        <div className="relative z-10 my-auto py-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="font-sans font-extralight text-4xl sm:text-5xl xl:text-6xl text-[#191c20] leading-none tracking-wide tabular-nums select-all">
              $24,800.00
            </h2>
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#4aa67c] bg-[#4aa67c]/8 px-1.5 py-0.5 rounded-md select-none shrink-0">
              <ArrowUpRight size={10} strokeWidth={3} />
              +23%
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-medium font-sans mt-2 tracking-wide">
            Collected this month ï¿½ 23% over May target
          </p>
        </div>

        {/* Bottom Section - Minimal info columns */}
        <div className="relative z-10 border-t border-gray-100 pt-3.5 mt-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex flex-col">
              <span className="text-[7.5px] font-sans font-extrabold uppercase tracking-[0.16em] text-gray-400">OUTSTANDING</span>
              <span className="text-[11.5px] font-sans font-bold text-[#191c20] mt-0.5">$8.2k</span>
            </div>
            <div className="h-6 w-px bg-gray-100" />
            <div className="flex flex-col">
              <span className="text-[7.5px] font-sans font-extrabold uppercase tracking-[0.16em] text-gray-400">NEEDS FOLLOW-UP</span>
              <span className="text-[11.5px] font-sans font-bold text-[#ff3b30] mt-0.5">3 invoices</span>
            </div>
          </div>

          {/* Simple collection pace thin progress bar */}
          <div className="w-[32%] flex flex-col justify-end shrink-0">
            <div className="flex justify-between items-center text-[7.5px] font-sans font-extrabold uppercase tracking-[0.16em] text-gray-400 mb-1">
              <span>PACE</span>
              <span className="text-gray-700">74%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#7eb098] rounded-full" style={{ width: '74%' }} />
            </div>
          </div>
        </div>

        {/* Background decorative watermark coin - matching gateway widget watermark design */}
        <div className="absolute right-4 bottom-10 text-[#7eb098] opacity-5 pointer-events-none select-none">
          <DollarSign size={96} strokeWidth={1} />
        </div>
      </div>
    ),
    // Slide 1: Approval activity
    (
      <div className="h-full w-full flex flex-col p-6 pb-10 justify-between text-[#191c20]">
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="bg-[#ff3b30]/10 text-[#ff3b30] px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider font-sans">APPROVAL WATCH</span>
            <span className="text-[10px] font-bold text-gray-400 font-sans">2 MIN AGO</span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex -space-x-2">
              <Avatar src={AVATARS[0]} className="w-8 h-8 border-2 border-white" />
              <Avatar src={AVATARS[1]} className="w-8 h-8 border-2 border-white" />
            </div>
            <div>
              <h4 className="text-xs font-bold">Acme Corp Product Team</h4>
              <p className="text-[10px] text-gray-400 font-sans">REVIEWING NOW</p>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-600 leading-snug">
            Acme Corp viewed <span className="text-[#191c20] font-bold">Brand Identity Redesign</span> and left 3 comments that need a decision.
          </p>
        </div>

        <div>
          <button className="w-full py-2 bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors text-xs font-bold rounded-xl">
            Open approvals
          </button>
        </div>
      </div>
    ),
    // Slide 2: Latest feedback
    (
      <div className="h-full w-full text-[#191c20] relative overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex flex-col transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] border-r border-transparent p-4 sm:p-5 md:p-6 lg:p-8 pb-10",
            isReplying ? "w-1/2 border-gray-100" : "w-full"
          )}
        >
          <div className="flex justify-between items-center mb-3 gap-3">
            <span className="text-[10px] font-bold text-[#7eb098] uppercase tracking-[0.32em] font-sans">LATEST FEEDBACK</span>
            <span className="text-[10px] font-normal text-gray-400 font-sans shrink-0">12:17 PM</span>
          </div>
          <p
            className={cn(
              "font-fraunces font-normal not-italic text-gray-600 tracking-tight transition-all duration-500",
              isReplying
                ? "text-[clamp(0.75rem,1.45vw,0.95rem)] leading-snug line-clamp-6"
                : "text-[clamp(0.8rem,1.8vw,1.2rem)] leading-[1.45]"
            )}
          >
            "The main identity direction is approved. Can we tighten the social templates and resend the final package today?"
          </p>
          <div className="mt-auto border-t border-gray-100 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar src={AVATARS[2]} className="w-8 h-8 border border-gray-100" />
              <div className="min-w-0">
                 <p className="text-[12px] font-normal font-sans text-gray-600 truncate">Sarah from Acme Corp</p>
                 <p className="text-[9px] font-sans text-gray-400 uppercase tracking-[0.22em] truncate">Brand Identity Package</p>
              </div>
            </div>
            <div className={cn("flex shrink-0 flex-col items-end gap-1.5", !isReplying && "mb-[11px]")}>
              <button 
                onClick={(e) => { e.stopPropagation(); }}
                className="text-[10px] font-bold font-sans text-gray-400 hover:text-[#191c20] tracking-[0.24em] uppercase whitespace-nowrap"
              >
                Mark Resolved
              </button>
              {!isReplying && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsReplying(true); }}
                  className="text-[10px] font-bold font-sans uppercase tracking-[0.24em] text-white bg-[#191c20] hover:bg-black px-3 py-1.5 rounded-full flex items-center gap-2 transition-transform hover:scale-[1.02]"
                >
                  Reply <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {isReplying && (
          <div
            className={cn(
              "absolute top-0 bottom-0 right-0 w-1/2 flex flex-col overflow-hidden border-l border-gray-100 bg-white p-4 sm:p-5 md:p-6 lg:p-8 pb-6",
              isReplyClosing ? "reply-close" : "reply-open"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold font-sans text-gray-400 block tracking-[0.26em] uppercase">Your Reply</span>
              <button
                onClick={(e) => { e.stopPropagation(); closeReplyComposer(); }}
                className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-[#191c20] flex items-center justify-center transition-colors"
              >
                <X size={13} />
              </button>
            </div>
            <textarea 
              autoFocus
              placeholder="Type your reply..." 
              className="min-h-0 flex-1 w-full p-4 bg-[#f4f5f8] rounded-[2rem] text-[12px] outline-none focus:ring-2 focus:ring-[#7eb098]/30 border border-gray-100 resize-none font-medium text-[#191c20] placeholder-gray-400"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex shrink-0 gap-2 justify-end mt-3 bg-white">
              <button 
                onClick={(e) => { e.stopPropagation(); closeReplyComposer(); }}
                className="text-[10px] font-bold font-sans text-gray-400 hover:text-gray-600 px-2 py-1 uppercase tracking-[0.24em]"
              >
                Cancel
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); closeReplyComposer(); }}
                className="text-[10px] font-bold font-sans text-white bg-[#7eb098] px-3 py-1.5 rounded-full hover:bg-[#6da089] transition-colors uppercase tracking-[0.24em]"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    ),
    // Slide 3: Portal link watch
    (
      <div className="h-full w-full flex flex-col p-6 pb-10 items-center justify-center text-center text-[#191c20]">
        <div className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center text-[#7eb098] mb-3 border border-gray-100">
          <Activity size={22} />
        </div>
        <h4 className="text-[13px] font-bold mb-1.5">2 portals active now</h4>
        <p className="text-[11px] text-gray-400 max-w-[200px] mb-4 leading-snug">
          Acme Corp and Startup Inc are viewing private magic-link portals.
        </p>
        <button className="px-3 py-1.5 bg-[#191c20] hover:bg-black transition-colors text-white text-[11px] font-semibold rounded-lg shadow-sm">
          Open portal activity
        </button>
      </div>
    ),
    // Slide 4: Asset room
    (
      <div className="h-full w-full flex flex-col p-6 pb-10 justify-between text-[#191c20]">
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-sans">Asset Room</span>
            <span className="text-[10px] font-bold text-gray-400 font-sans">74% USED</span>
          </div>
          <h3 className="text-xl font-fraunces font-bold mb-2">185 GB of 250 GB in use</h3>
          <div className="w-full h-3 rounded-full bg-gray-100 flex overflow-hidden mb-4">
            <div className="bg-[#7eb098] h-full" style={{ width: '40%' }} />
            <div className="bg-[#484782] h-full" style={{ width: '20%' }} />
            <div className="bg-[#ff5b4f] h-full" style={{ width: '14%' }} />
          </div>
          <div className="flex gap-4 text-[10px] font-bold text-gray-400">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#7eb098]" /> Docs</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#484782]" /> Images</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff5b4f]" /> Videos</div>
          </div>
        </div>
        <div className="text-left">
          <a href="#storage" className="text-xs font-bold text-[#7eb098] hover:underline inline-flex items-center gap-1">
            Clean up assets <ArrowRight size={12} />
          </a>
        </div>
      </div>
    ),
  ];

  return (
    <div 
      className="relative w-full h-[292px] lg:h-[316px] bg-white rounded-[2rem] shadow-sm overflow-hidden flex flex-col group/carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Linear progress bar - only visible on hover */}
      <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden z-50 transition-opacity duration-300", isHovered ? "opacity-100" : "opacity-0")}>
        <div className="h-full bg-[#7eb098] transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {slides.map((slide, idx) => (
          <div 
            key={idx}
            className={cn(
              "absolute inset-0 w-full h-full transition-opacity duration-500 ease-out",
              idx === activeSlide 
                ? "opacity-100 z-20 pointer-events-auto" 
                : "opacity-0 z-10 pointer-events-none"
            )}
          >
            {slide}
          </div>
        ))}
      </div>

      {!isReplying && (
        <div className="absolute bottom-4 right-6 flex items-center gap-1.5 z-40 bg-white/70 backdrop-blur-xs px-2.5 py-1.5 rounded-full shadow-xs">
          {slides.map((_, idx) => (
            <button 
              key={idx} 
              onClick={(e) => { e.stopPropagation(); handleDotClick(idx); }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 bg-[#7eb098]",
                idx === activeSlide ? "w-4 opacity-100" : "w-1.5 opacity-40 hover:opacity-75"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- CLIENT ENGAGEMENT PULSE (expanded Live Client Radar) ---
const ClientEngagementPulse = ({
  isVertical,
  onAction,
}: {
  isVertical: boolean;
  onAction?: (client: typeof ENGAGEMENT_PULSE_CLIENTS[0]) => void;
}) => {
  const clients = ENGAGEMENT_PULSE_CLIENTS;
  const liveCount = clients.filter((c) => c.isLive).length;

  return (
    <div className={cn('flex flex-col w-full min-w-0 bg-transparent border-0', isVertical ? 'h-[292px] lg:h-[316px]' : '')}>
      <div className="px-4 pt-2 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#7eb098] animate-pulse" />
          <h4 className="font-fraunces font-medium text-[15px] text-[#191c20]">Client Engagement Pulse</h4>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 font-sans">
          {liveCount} live ï¿½ {clients.length} tracked
        </span>
      </div>

      {clients.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#a3a8b0]/40 rounded-2xl bg-white/30 p-6 text-center">
          <Activity size={18} className="text-gray-400 mb-2" />
          <h5 className="text-xs font-bold text-[#191c20] mb-0.5">Pulse scanning</h5>
          <p className="text-[10px] text-gray-500 max-w-[220px] leading-relaxed">
            Portal views and client activity will surface here as action items.
          </p>
        </div>
      ) : isVertical ? (
        <div className="flex-1 overflow-y-auto px-1 py-1 flex flex-col gap-3 min-h-0">
          {clients.map((client) => (
            <EngagementPulseCard key={client.id} client={client} onAction={onAction} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((client) => (
            <EngagementPulseCard key={client.id} client={client} onAction={onAction} />
          ))}
        </div>
      )}
    </div>
  );
};

const EngagementPulseCard = ({
  client,
  onAction,
}: {
  client: typeof ENGAGEMENT_PULSE_CLIENTS[0];
  onAction?: (client: typeof ENGAGEMENT_PULSE_CLIENTS[0]) => void;
}) => (
  <div className="bg-white rounded-2xl p-4 flex flex-col gap-3 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all duration-200 group">
    <div className="flex items-center gap-3 min-w-0">
      <div className="relative w-10 h-10 shrink-0">
        <img src={client.avatar} alt={client.name} className="w-full h-full rounded-full object-cover" />
        {client.isLive && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse z-20" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-[#191c20] truncate">{client.name}</p>
        <p className="text-[10px] text-gray-400 truncate">{client.project}</p>
      </div>
    </div>
    <p className="text-[11px] text-[#5b626a] leading-snug">
      <span className="font-semibold text-[#191c20]">{client.insight}</span>
      <span className="text-gray-400"> ï¿½ </span>
      <span
        className={cn(
          'font-bold',
          client.tone === 'positive' && 'text-[#7eb098]',
          client.tone === 'warning' && 'text-[#d8c78c]',
          client.tone === 'neutral' && 'text-gray-500'
        )}
      >
        {client.sentiment}
      </span>
    </p>
    <button
      type="button"
      onClick={() => onAction?.(client)}
      className="self-start inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-[#f4f5f8] px-3 py-1.5 text-[9px] font-sans font-extrabold uppercase tracking-wider text-[#191c20] transition-all hover:bg-[#191c20] hover:border-[#191c20] hover:text-white cursor-pointer"
    >
      {client.actionLabel}
      <ArrowUpRight size={10} strokeWidth={2.5} />
    </button>
  </div>
);

// --- PRIORITIES WIDGET ---
const PrioritiesWidget = ({ actions }: { actions: typeof PRIORITIES }) => {
  return (
    <div className="flex flex-col h-[292px] lg:h-[316px] bg-transparent border-0 w-full min-w-0">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <PriorityMark />
          <h3 className="font-fraunces text-[1.22rem] font-medium tracking-tight text-[#191c20]">Today</h3>
        </div>
        {actions.length > 0 && (
          <div className="bg-[#191c20] text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full font-sans shadow-xs">
            {actions.length} {actions.length === 1 ? 'Action' : 'Actions'}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto px-1 py-1">
        {actions.length > 0 ? (
          actions.map(action => (
            <div 
              key={action.id} 
              className="bg-white rounded-3xl p-4 flex items-center justify-between border border-gray-100 hover:border-gray-300 hover:shadow-md cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", action.iconBg)}>
                  <action.icon size={18} />
                </div>
                <div>
                  <p className={cn("text-[9px] font-bold uppercase tracking-wider   font-sans", action.severityColor)}>
                    {action.severity}
                  </p>
                  <p className="text-[14px] font-bold text-[#191c20]">{action.message}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-[#191c20] group-hover:translate-x-1 transition-all" />
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-[#a3a8b0]/40 rounded-3xl bg-white/30">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-2 border border-green-100">
              <CheckCircle size={20} />
            </div>
            <h5 className="text-sm font-bold text-[#191c20] mb-0.5">All Caught Up</h5>
            <p className="text-[10px] text-gray-500 max-w-[200px] leading-relaxed">
              No workflow blockers or actions require your attention.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const BriefingPreviewPortal = ({
  event,
  targetRect,
  clearTimer,
  hidePreview,
  onOpenEvent,
}: {
  event: BriefingEvent;
  targetRect: DOMRect;
  clearTimer: () => void;
  hidePreview: () => void;
  onOpenEvent: (event: BriefingEvent) => void;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);

  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const previewWidth = rect.width || 320;
    const previewHeight = rect.height || 260;
    const gap = 14;
    const canOpenLeft = targetRect.left > previewWidth + 28;
    const unclampedLeft = canOpenLeft ? targetRect.left - previewWidth - gap : targetRect.right + gap;
    const left = Math.min(Math.max(unclampedLeft, 16), window.innerWidth - previewWidth - 16);
    const centeredTop = targetRect.top + targetRect.height / 2 - previewHeight / 2;
    const top = Math.min(Math.max(centeredTop, 16), window.innerHeight - previewHeight - 16);
    setCoords({ top, left });
  }, [targetRect]);

  return (
    <div
      ref={ref}
      className={cn(
        "fixed z-[150000] w-[min(320px,calc(100vw-2rem))] animate-in fade-in zoom-in-95 duration-150 transition-opacity",
        coords ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={coords ? { top: coords.top, left: coords.left } : { top: targetRect.top, left: targetRect.left }}
      onMouseEnter={clearTimer}
      onMouseLeave={hidePreview}
    >
      <div className="rounded-[20px] border border-gray-200/90 bg-white/98 p-3.5 shadow-[0_22px_54px_-18px_rgba(25,28,32,0.32)] ring-1 ring-black/[0.02] backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13.5px] font-sans font-extrabold text-[#191c20] leading-snug">
              {event.title}
            </p>
            <p className="mt-1 text-[10px] font-sans font-bold uppercase tracking-wider text-gray-400">
              {event.client} - {event.date} - {event.time}
            </p>
          </div>
          <span className={cn(
            "shrink-0 rounded-full px-2 py-1 text-[9px] font-sans font-extrabold uppercase tracking-wider",
            event.isNew ? "bg-[#7eb098]/15 text-[#5b987d]" : "bg-gray-100 text-gray-500"
          )}>
            {event.isNew ? 'New' : event.relTime}
          </span>
        </div>

        <p className="mt-2.5 text-[12.5px] leading-relaxed text-gray-600">
          {event.detail}
        </p>

        <div className="mt-3 grid gap-2">
          <div className="rounded-xl bg-[#f4f5f8]/75 px-3 py-2">
            <span className="text-[8.5px] font-sans font-extrabold uppercase tracking-widest text-gray-400">Current status</span>
            <p className="mt-0.5 text-[12px] leading-relaxed text-gray-600">{event.status}</p>
          </div>
          <div className="rounded-xl border border-[#7eb098]/20 bg-[#7eb098]/7 px-3 py-2">
            <span className="text-[8.5px] font-sans font-extrabold uppercase tracking-widest text-[#6aa187]">Next step</span>
            <p className="mt-0.5 text-[12px] leading-relaxed text-gray-700">{event.nextStep}</p>
          </div>
        </div>

        {event.actionLabel && (
          <button
            type="button"
            onClick={() => onOpenEvent(event)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#191c20] px-3 py-1.5 text-[10px] font-sans font-extrabold uppercase tracking-wider text-white transition-colors hover:bg-black"
          >
            {event.actionLabel}
            <ArrowUpRight size={10} strokeWidth={2.8} />
          </button>
        )}
      </div>
    </div>
  );
};

// --- BRIEFING WIDGET COMPONENT ---
const BriefingWidget = ({ 
  onOpenEvent,
  briefingEvents,
  setBriefingEvents,
  clientMetadata,
  setClientMetadata,
  projectsList,
  setClientNotes,
  onBriefingNoteAdded,
  dismissedBriefingIds,
  onDismissBriefingEvent,
}: { 
  onOpenEvent: (event: BriefingEvent) => void;
  briefingEvents: BriefingEvent[];
  setBriefingEvents: React.Dispatch<React.SetStateAction<BriefingEvent[]>>;
  clientMetadata: Record<string, ClientMetadata>;
  setClientMetadata: React.Dispatch<React.SetStateAction<Record<string, ClientMetadata>>>;
  projectsList: Project[];
  setClientNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onBriefingNoteAdded: (clientName: string) => void;
  dismissedBriefingIds: number[];
  onDismissBriefingEvent: (eventId: number) => void;
}) => {
  type BriefingCategory = 'all' | 'files' | 'payments' | 'activity';
  const [category, setCategory] = React.useState<BriefingCategory>('all');
  const [hoveredEvent, setHoveredEvent] = React.useState<{ event: BriefingEvent; targetRect: DOMRect } | null>(null);
  const briefingHoverTimer = React.useRef<number | null>(null);

  // Note Composer state
  const [newNoteText, setNewNoteText] = React.useState('');
  const [noteClient, setNoteClient] = React.useState('');
  const [showNewClientInput, setShowNewClientInput] = React.useState(false);
  const [newClientName, setNewClientName] = React.useState('');
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [noteComposerWarning, setNoteComposerWarning] = React.useState<string | null>(null);

  // Dropdown filter state
  const [filterDropdownOpen, setFilterDropdownOpen] = React.useState(false);
  const [selectedClientFilter, setSelectedClientFilter] = React.useState('all');

  const clearBriefingHoverTimer = () => {
    if (briefingHoverTimer.current) {
      window.clearTimeout(briefingHoverTimer.current);
      briefingHoverTimer.current = null;
    }
  };

  const showBriefingPreview = (event: BriefingEvent, target: HTMLElement) => {
    if (typeof window === 'undefined') return;

    clearBriefingHoverTimer();
    const rect = target.getBoundingClientRect();
    setHoveredEvent({ event, targetRect: rect });
  };

  const hideBriefingPreview = () => {
    if (typeof window === 'undefined') return;

    clearBriefingHoverTimer();
    briefingHoverTimer.current = window.setTimeout(() => setHoveredEvent(null), 90);
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;

    let selectedClient = noteClient;
    if (noteClient === 'new') {
      const trimmedNewClient = newClientName.trim();
      if (!trimmedNewClient) {
        setNoteComposerWarning('Enter a client name before saving this note.');
        return;
      }
      selectedClient = trimmedNewClient;
      if (!clientMetadata[selectedClient]) {
        setClientMetadata((prev) => ({
          ...prev,
          [selectedClient]: {
            email: `${selectedClient.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.com`,
            poc: 'Primary Contact',
            priority: 'Standard' as const,
            sentiment: 'Neutral' as const,
            sparklineHistory: [0, 0, 0, 0, 0, 0],
            avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
          }
        }));
      }
    } else if (!selectedClient) {
      setNoteComposerWarning('Choose a client to assign this note to.');
      return;
    }

    setNoteComposerWarning(null);

    const clientProj = projectsList.find(p => p.client.name === selectedClient);
    const projectId = clientProj ? clientProj.id : `PRJ-${Math.random().toString(36).substring(2, 10)}`;
    const noteBody = newNoteText.trim();

    setClientNotes(prev => appendBriefingNoteToClientNotes(prev, selectedClient, noteBody));
    onBriefingNoteAdded(selectedClient);

    const newEvent: BriefingEvent = {
      id: Date.now(),
      date: 'TODAY',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relTime: 'Just now',
      title: 'Briefing note logged',
      client: selectedClient.toUpperCase(),
      clientName: selectedClient,
      projectId,
      icon: FileText,
      isNew: true,
      targetTab: 'notes',
      detail: noteBody,
      status: 'Saved to internal project notes.',
      nextStep: 'Review it before the next client sync.',
      actionLabel: 'Open notes'
    };

    setBriefingEvents(prev => [newEvent, ...prev]);
    setNewNoteText('');
    setNoteClient('');
    setNewClientName('');
    setShowNewClientInput(false);
  };

  const filteredEvents = React.useMemo(() => {
    const scopedBase = briefingEvents
      .filter(e => !dismissedBriefingIds.includes(e.id))
      .filter(e => selectedClientFilter === 'all' || e.clientName.toLowerCase() === selectedClientFilter.toLowerCase());

    const base = scopedBase
      .map((event, index) => ({
        event,
        index,
        ageDays: getBriefingEventAgeDays(event),
        isPriority: event.isNew || isBriefingPriorityException(event),
      }))
      .filter(({ ageDays, isPriority }) => ageDays <= BRIEFING_LOOKBACK_DAYS || isPriority)
      .sort((a, b) => {
        if (a.event.isNew !== b.event.isNew) return a.event.isNew ? -1 : 1;
        if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
        if (a.ageDays !== b.ageDays) return a.ageDays - b.ageDays;
        return a.index - b.index;
      })
      .slice(0, BRIEFING_MAX_VISIBLE_EVENTS)
      .map(({ event }) => event);

    if (category === 'files') {
      return base.filter(e => 
        e.title.toLowerCase().includes('file') || 
        e.title.toLowerCase().includes('upload') || 
        e.title.toLowerCase().includes('download') || 
        e.title.toLowerCase().includes('asset')
      );
    }
    if (category === 'payments') {
      return base.filter(e => 
        e.title.toLowerCase().includes('payment') || 
        e.title.toLowerCase().includes('invoice') || 
        e.title.toLowerCase().includes('paid') || 
        e.title.toLowerCase().includes('approved')
      );
    }
    if (category === 'activity') {
      return base.filter(e => 
        !e.title.toLowerCase().includes('file') && 
        !e.title.toLowerCase().includes('upload') && 
        !e.title.toLowerCase().includes('download') && 
        !e.title.toLowerCase().includes('payment') && 
        !e.title.toLowerCase().includes('invoice') && 
        !e.title.toLowerCase().includes('paid')
      );
    }
    return base;
  }, [category, briefingEvents, selectedClientFilter, dismissedBriefingIds]);

  const newCount = React.useMemo(() => {
    return filteredEvents.filter(e => e.isNew).length;
  }, [filteredEvents]);

  const categories: Array<{ id: BriefingCategory; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'files', label: 'Files' },
    { id: 'payments', label: 'Payments' },
    { id: 'activity', label: 'Activity' }
  ];

  return (
    <div className="briefing-widget relative flex h-full min-h-0 w-full min-w-0 overflow-hidden rounded-[28px] border border-gray-300/75 bg-white/30 backdrop-blur-xs shadow-md transition-all duration-500 select-none">
      {/* Cool-gray Left Sidebar Panel */}
      <div
        className="relative w-12 border-r border-gray-300/50 flex flex-col justify-between py-6 items-center shrink-0 overflow-hidden rounded-l-[27px]"
        style={{
          background: `linear-gradient(180deg, ${SENDATIONAL_SLIDEIN_STRIPE_COLORS[0]} 0%, ${SENDATIONAL_SLIDEIN_STRIPE_COLORS[0]} 33.333%, ${SENDATIONAL_SLIDEIN_STRIPE_COLORS[1]} 33.333%, ${SENDATIONAL_SLIDEIN_STRIPE_COLORS[1]} 66.666%, ${SENDATIONAL_SLIDEIN_STRIPE_COLORS[2]} 66.666%, ${SENDATIONAL_SLIDEIN_STRIPE_COLORS[2]} 100%)`,
        }}
      >
        {/* Top: clean FileText icon */}
        <FileText size={17} className="text-white/90 relative z-10" strokeWidth={2.2} />

        {/* Middle: rotated vertical label */}
        <div className="flex items-center justify-center -rotate-90 origin-center my-auto whitespace-nowrap relative z-10">
          <span className="text-[9.5px] font-sans font-bold text-white/90 tracking-[0.25em] uppercase">
            DAILY LOG
          </span>
        </div>

        {/* Bottom: statistics count */}
        <div className="flex flex-col items-center text-center relative z-10">
          <span className="font-sans font-extralight text-3xl text-white leading-none tracking-tighter select-all">{filteredEvents.length}</span>
          <span className="text-[8.5px] font-sans font-bold text-white/90 uppercase tracking-wide mt-1.5 whitespace-nowrap">
            {newCount} NEW
          </span>
        </div>

        {/* Separator spine dots overlay along the right border seam */}
        <div className="absolute right-[-4px] top-[22%] w-2 h-2 rounded-full bg-gray-300 border-2 border-white z-10"></div>
        <div className="absolute right-[-4px] top-[48%] w-2 h-2 rounded-full bg-gray-300 border-2 border-white z-10"></div>
        <div className="absolute right-[-4px] top-[74%] w-2 h-2 rounded-full bg-gray-300 border-2 border-white z-10"></div>
      </div>

      {/* Right Column: Timeline Content */}
      <div className="flex-1 flex flex-col min-h-0 bg-transparent p-4 sm:p-5 lg:p-6 relative overflow-hidden">
        {/* Header */}
        <div className="pb-3.5 flex items-start justify-between shrink-0">
          <div>
            <h2 className="font-fraunces text-[29px] font-normal leading-tight tracking-tight text-[#191c20] mt-1">
              Briefing
            </h2>
            <span className="text-[8.5px] font-sans font-bold tracking-[0.16em] text-gray-400 uppercase block mt-1.5">
              30d focus - {filteredEvents.length} updates - {newCount} new
            </span>
          </div>
          <div className="relative">
            <button 
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className={cn(
                "w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer shadow-3xs hover:scale-105 active:scale-95",
                selectedClientFilter !== 'all' 
                  ? "bg-[#7eb098] border-[#7eb098] text-white" 
                  : "bg-white border-gray-200 text-gray-400 hover:text-black hover:border-gray-300"
              )}
              title="Filter by Client"
            >
              <Filter size={14} />
            </button>
            {filterDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setFilterDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 text-left font-sans text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">Filter by Client</div>
                  <button
                    onClick={() => { setSelectedClientFilter('all'); setFilterDropdownOpen(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between cursor-pointer",
                      selectedClientFilter === 'all' ? "font-bold text-[#7eb098]" : "text-gray-700"
                    )}
                  >
                    All Clients
                  </button>
                  {Object.keys(clientMetadata).map(name => (
                    <button
                      key={name}
                      onClick={() => { setSelectedClientFilter(name); setFilterDropdownOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between cursor-pointer",
                        selectedClientFilter === name ? "font-bold text-[#7eb098]" : "text-gray-700"
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Category Capsule Filters */}
        <div className="flex gap-1.5 pb-4 select-none overflow-x-auto scrollbar-none shrink-0">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider transition-all duration-250 cursor-pointer shrink-0 border",
                category === cat.id
                  ? "bg-[#191c20] border-[#191c20] text-white shadow-xs"
                  : "bg-white/40 border-gray-200/50 text-gray-500 hover:bg-gray-100 hover:text-black"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Note Composer (Sleek Collapsible Pill) */}
        <div className="mb-4 bg-white/65 border border-[#8f969f]/30 rounded-xl p-2 text-left shadow-3xs shrink-0 select-none">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="Add daily log note..."
              className="flex-1 bg-transparent text-xs text-gray-850 outline-none placeholder-gray-400 font-sans font-semibold px-2 py-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (noteClient && noteClient !== 'new') {
                    handleAddNote();
                    setIsExpanded(false);
                  } else if (noteClient === 'new' && newClientName.trim()) {
                    handleAddNote();
                    setIsExpanded(false);
                  } else {
                    setIsExpanded(true);
                    setNoteComposerWarning(
                      noteClient === 'new' && !newClientName.trim()
                        ? 'Enter a client name before saving this note.'
                        : 'Choose a client to assign this note to.'
                    );
                  }
                }
              }}
            />
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "w-6.5 h-6.5 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 cursor-pointer shadow-3xs",
                isExpanded ? "bg-gray-200 text-gray-600 hover:bg-gray-300" : "bg-[#7eb098] hover:bg-[#6fa189] text-white"
              )}
              title={isExpanded ? "Collapse options" : "Expand assignment options"}
            >
              {isExpanded ? (
                <X size={12} strokeWidth={2.5} />
              ) : (
                <Plus size={12} strokeWidth={2.5} />
              )}
            </button>
          </div>

          {isExpanded && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-250">
              {noteComposerWarning && (
                <div className="flex items-start gap-2 rounded-lg border border-[#ff5b4f]/25 bg-[#ff5b4f]/8 px-3 py-2 text-[11px] font-sans font-semibold text-[#b42318]">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{noteComposerWarning}</span>
                </div>
              )}
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <select
                    value={noteClient}
                    onChange={(e) => {
                      setNoteClient(e.target.value);
                      setNoteComposerWarning(null);
                      if (e.target.value === 'new') {
                        setShowNewClientInput(true);
                      } else {
                        setShowNewClientInput(false);
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] outline-none focus:border-[#7eb098]/60 focus:bg-white transition-all cursor-pointer font-sans text-gray-750 font-semibold"
                  >
                    <option value="" disabled>Assign to client...</option>
                    {Object.keys(clientMetadata).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    <option value="new">+ New Client...</option>
                  </select>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    handleAddNote();
                    setIsExpanded(false);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#191c20] hover:bg-black text-white text-[10px] font-sans font-extrabold uppercase tracking-wider transition-colors cursor-pointer shadow-3xs"
                >
                  Add Note
                </button>
              </div>

              {showNewClientInput && (
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Enter new client name..."
                  className="w-full bg-gray-50 border border-gray-250 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#7eb098]/60 focus:bg-white transition-all font-sans text-gray-800 font-medium animate-in fade-in slide-in-from-top-1 duration-150"
                />
              )}
            </div>
          )}
        </div>

        {/* Scroll Area ï¿½ flex-1 + min-h-0 so long timelines scroll inside the sticky column */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="scrollbar-default-thin min-h-0 flex-1 overflow-y-auto overscroll-contain pl-1 pr-2 py-1">
            {filteredEvents.length > 0 ? (
              <div className="relative py-2 pb-10 flex flex-col gap-4">
                {/* Timeline Spine Line - Dashed design */}
                <div className="absolute top-2 bottom-6 w-px bg-transparent border-l border-dashed border-gray-200" style={{ left: '76px' }}></div>
                
                {/* Event Rows */}
                {filteredEvents.map((event) => (
                  <div key={event.id} className="grid grid-cols-[68px_16px_1fr] items-center gap-0 relative">
                    {/* Date/Time Labels Stacked */}
                    <div className="flex flex-col items-end text-right pr-2 shrink-0 select-none gap-1">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100/70 text-[8.5px] font-sans font-extrabold text-gray-500 tracking-wide leading-none">
                        {event.date}
                      </span>
                      <span className="text-[8px] font-mono text-gray-400 font-semibold leading-none">
                        {event.time}
                      </span>
                    </div>

                    {/* Timeline Node Point indicator */}
                    <div className="flex items-center justify-center z-15 shrink-0 select-none">
                      {event.isNew ? (
                        <div className="relative flex items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-[#7eb098]/30 opacity-75" />
                          <div className="relative w-2 h-2 rounded-full bg-[#7eb098] ring-4 ring-[#7eb098]/20 border border-[#7eb098]"></div>
                        </div>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 transition-all duration-350"></div>
                      )}
                    </div>

                    {/* Event Content Pill ï¿½ fixed size; full detail on hover preview */}
                    <div className="pl-3.5 relative group/pill">
                      <button
                        type="button"
                        onClick={() => onOpenEvent(event)}
                        onMouseEnter={(e) => showBriefingPreview(event, e.currentTarget)}
                        onMouseLeave={hideBriefingPreview}
                        onFocus={(e) => showBriefingPreview(event, e.currentTarget)}
                        onBlur={hideBriefingPreview}
                        className="briefing-timeline-pill group/card flex w-full items-center justify-between px-3 py-2 rounded-xl bg-white border border-gray-100/70 shadow-sm hover:shadow-md hover:border-[#7eb098]/40 hover:translate-x-1 transition-all duration-200 cursor-pointer text-left overflow-hidden"
                      >
                        <div className="flex items-center min-w-0 flex-1 pr-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100/70 flex items-center justify-center shrink-0 text-gray-500 group-hover/card:bg-[#f4f6f8] transition-colors mr-2.5">
                            <event.icon size={13} strokeWidth={2.2} />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[12.5px] font-bold text-gray-700 truncate leading-snug">{event.title}</span>
                            <span className="text-[9px] font-sans font-extrabold text-gray-400 uppercase tracking-wide mt-0.5 truncate">{event.client}</span>
                          </div>
                        </div>
                        <div className="w-5.5 h-5.5 rounded-full bg-gray-50/80 border border-gray-200/50 flex items-center justify-center text-gray-400 opacity-0 group-hover/card:opacity-100 group-hover/card:scale-105 group-hover/card:bg-[#191c20] group-hover/card:text-white transition-all duration-200 shrink-0 shadow-3xs">
                          <ArrowUpRight size={10} strokeWidth={3} />
                        </div>
                      </button>
                      <button
                        type="button"
                        title="Dismiss from briefing feed"
                        aria-label="Dismiss from briefing feed"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismissBriefingEvent(event.id);
                        }}
                        className="absolute -top-1.5 -right-0.5 z-20 flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 opacity-0 shadow-sm transition-all hover:border-[#ff5b4f]/40 hover:text-[#ff5b4f] group-hover/pill:opacity-100 cursor-pointer"
                      >
                        <X size={11} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-6 h-[220px] text-center border-2 border-dashed border-gray-100 rounded-xl bg-slate-50/20">
                <Clock size={24} className="text-gray-350 mb-2 animate-pulse" />
                <p className="text-sm font-fraunces italic text-gray-500">No updates to report</p>
                <p className="text-[10px] text-gray-400 mt-1 max-w-[160px] leading-relaxed">
                  Timeline empty. Adjust filters or trigger new client operations to see logs.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {hoveredEvent && typeof document !== 'undefined' && createPortal(
        <BriefingPreviewPortal
          event={hoveredEvent.event}
          targetRect={hoveredEvent.targetRect}
          clearTimer={clearBriefingHoverTimer}
          hidePreview={hideBriefingPreview}
          onOpenEvent={onOpenEvent}
        />,
        document.body
      )}
    </div>
  );
};

// --- VIEWS ---
const DashboardGreeting = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const hour = now.getHours();
  const greeting = hour < 12
    ? 'Good morning'
    : hour < 17
      ? 'Good afternoon'
      : 'Good evening';
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();
  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).toUpperCase();

  return (
    <div className="w-full max-w-none pt-0">
      <p className="mb-1.5 sm:mb-2 xl:mb-3 font-sans text-[8.5px] sm:text-[9px] xl:text-[10px] font-semibold uppercase tracking-[0.18em] xl:tracking-[0.22em] text-[#7b838c]">
        {dateLabel} - {timeLabel}
      </p>
      <h2 className="font-fraunces text-[1.95rem] sm:text-[2.25rem] md:text-[2.55rem] xl:text-6xl tracking-tight font-medium leading-[1.02] sm:leading-[1.05] xl:leading-[1.1] text-[#191c20] mb-2 sm:mb-3 xl:mb-4">
        {greeting},<br/>
        <span className="italic text-[#7eb098]">Jennifer</span>
      </h2>
      <p className="max-w-[560px] text-[#5b626a] text-[12px] sm:text-[13px] xl:text-[15px] leading-relaxed font-medium">
        You have 3 active deliverables and 2 new notifications today.
      </p>
    </div>
  );
};

const StorageOverviewPanel = ({
  projectsList,
  activeProject,
  clientName,
}: {
  projectsList: Project[];
  activeProject?: Project;
  clientName: string;
}) => {
  const clientProjects = projectsList.filter((project) => project.client.name === clientName);
  const clientFiles = clientProjects.flatMap((project) => project.files);
  const lockedFiles = clientFiles.filter((file) => file.locked).length;
  const unlockedFiles = clientFiles.length - lockedFiles;
  const totalStorageGb = STORAGE_DATA.reduce((sum, item) => sum + item.value, 0);
  const freeStorageGb = STORAGE_DATA.find((item) => item.name === 'Free')?.value ?? 0;
  const usedStorageGb = totalStorageGb - freeStorageGb;
  const usedStoragePct = Math.round((usedStorageGb / totalStorageGb) * 100);

  const parseFileSizeToMb = (size: string) => {
    const numeric = Number.parseFloat(size);
    if (Number.isNaN(numeric)) return 0;
    const normalized = size.toLowerCase();
    if (normalized.includes('gb')) return numeric * 1024;
    if (normalized.includes('kb')) return numeric / 1024;
    return numeric;
  };

  const formatStorage = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${Math.max(mb, 0).toFixed(1)} MB`;
  };

  const projectStorageRows = clientProjects.map((project) => {
    const projectMb = project.files.reduce((sum, file) => sum + parseFileSizeToMb(file.size), 0);
    const visibleFiles = project.files.filter((file) => !file.locked).length;
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      fileCount: project.files.length,
      visibleFiles,
      storage: formatStorage(projectMb),
      isActive: activeProject?.id === project.id,
    };
  });

  const typeSummary = [
    { label: 'Images', count: clientFiles.filter((file) => file.type === 'image').length, color: '#3d4f8f' },
    { label: 'Documents', count: clientFiles.filter((file) => file.type === 'pdf' || file.type === 'generic').length, color: '#d8c78c' },
    { label: 'Video/audio', count: clientFiles.filter((file) => file.type === 'video' || file.type === 'audio').length, color: '#90c29a' },
    { label: 'Archives', count: clientFiles.filter((file) => file.type === 'archive').length, color: '#403233' },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin text-left">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-5 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-3xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Storage</span>
              <h3 className="font-fraunces text-xl font-medium text-[#191c20] mt-1">Delivery storage</h3>
              <p className="text-[11px] text-gray-500 mt-1">Workspace capacity across client portal assets.</p>
            </div>
            <span className="rounded-full bg-[#7eb098]/10 px-2.5 py-1 text-[9px] font-sans font-extrabold uppercase tracking-wider text-[#5b987d]">
              {usedStoragePct}% used
            </span>
          </div>

          <div className="relative my-5 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={STORAGE_DATA} cx="50%" cy="50%" innerRadius={54} outerRadius={82} paddingAngle={1} dataKey="value" stroke="none">
                  {STORAGE_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-sans text-2xl font-extrabold tabular-nums text-[#191c20]">{usedStoragePct}%</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">allocated</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {STORAGE_DATA.map((item) => (
              <div key={item.name} className="rounded-2xl border border-gray-100 bg-[#fafbfc] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{item.name}</span>
                </div>
                <p className="font-sans text-[13px] font-extrabold text-[#191c20]">{item.value} GB</p>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-7 grid grid-cols-2 gap-3">
          {[
            { label: 'Client projects', value: String(clientProjects.length), sub: clientName },
            { label: 'Portal assets', value: String(clientFiles.length), sub: `${unlockedFiles} visible` },
            { label: 'Locked files', value: String(lockedFiles), sub: 'Payment or approval gated' },
            { label: 'Free capacity', value: `${freeStorageGb} GB`, sub: `${usedStorageGb} GB allocated` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[1.6rem] border border-gray-100 bg-white p-4 shadow-3xs">
              <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</span>
              <p className="mt-1 font-fraunces text-xl font-medium text-[#191c20]">{stat.value}</p>
              <p className="mt-0.5 text-[10px] text-gray-500">{stat.sub}</p>
            </div>
          ))}

          <div className="col-span-2 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-3xs">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Asset mix</span>
                <h4 className="mt-1 font-fraunces text-lg font-medium text-[#191c20]">Files by type</h4>
              </div>
              <Package size={17} className="text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {typeSummary.map((item) => (
                <div key={item.label} className="rounded-2xl bg-[#f4f5f8]/70 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{item.label}</span>
                  </div>
                  <p className="text-sm font-extrabold text-[#191c20]">{item.count} files</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-12 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-3xs">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Project folders</span>
              <h4 className="mt-1 font-fraunces text-lg font-medium text-[#191c20]">Storage by delivery folder</h4>
            </div>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-gray-500">
              {clientProjects.length} folders
            </span>
          </div>
          <div className="space-y-2">
            {projectStorageRows.length > 0 ? projectStorageRows.map((row) => (
              <div
                key={row.id}
                className={cn(
                  "grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-2xl border p-3 transition-colors",
                  row.isActive ? "border-[#7eb098]/35 bg-[#7eb098]/5" : "border-gray-100 bg-[#fafbfc] hover:bg-white"
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold text-[#191c20]">{row.name}</p>
                  <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                    {row.visibleFiles}/{row.fileCount} visible - {row.status}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-gray-500">{row.storage}</span>
                <span className={cn(
                  "rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-wider",
                  row.isActive ? "bg-[#7eb098]/15 text-[#5b987d]" : "bg-white text-gray-400"
                )}>
                  {row.isActive ? 'Open' : 'Idle'}
                </span>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[#fafbfc] p-8 text-center">
                <FolderPlus size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-bold text-gray-500">No storage yet for this client</p>
                <p className="mt-1 text-[10px] text-gray-400">Create a project or upload files to start tracking usage.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardView = ({ 
  isReplying,
  setIsReplying,
  setCurrentView,
  setActiveTab,
  setSelectedClientName,
  setSelectedProjectId,
  onOpenQuickDelivery,
  briefingEvents,
  setBriefingEvents,
  clientMetadata,
  setClientMetadata,
  projectsList,
  setClientNotes,
  onBriefingNoteAdded,
  dismissedBriefingIds,
  onDismissBriefingEvent,
}: { 
  isReplying: boolean; 
  setIsReplying: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentView: React.Dispatch<React.SetStateAction<string>>;
  setActiveTab: React.Dispatch<React.SetStateAction<WorkspaceTab>>;
  setSelectedClientName: React.Dispatch<React.SetStateAction<string>>;
  setSelectedProjectId: React.Dispatch<React.SetStateAction<string>>;
  onOpenQuickDelivery: () => void;
  briefingEvents: BriefingEvent[];
  setBriefingEvents: React.Dispatch<React.SetStateAction<BriefingEvent[]>>;
  clientMetadata: Record<string, ClientMetadata>;
  setClientMetadata: React.Dispatch<React.SetStateAction<Record<string, ClientMetadata>>>;
  projectsList: Project[];
  setClientNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onBriefingNoteAdded: (clientName: string) => void;
  dismissedBriefingIds: number[];
  onDismissBriefingEvent: (eventId: number) => void;
}) => {
  const openBriefingEvent = (event: BriefingEvent) => {
    setSelectedClientName(event.clientName);
    setSelectedProjectId(event.projectId);
    setActiveTab(event.targetTab);
    setCurrentView('Projects');
  };

  const openEngagementAction = (client: typeof ENGAGEMENT_PULSE_CLIENTS[0]) => {
    setSelectedClientName(client.clientName);
    const project = projectsList.find((p) => p.client.name === client.clientName);
    if (project) setSelectedProjectId(project.id);
    setActiveTab(client.actionLabel.toLowerCase().includes('chat') ? 'messages' : 'activity');
    setCurrentView('Projects');
  };

  return (
  <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 items-start w-full pb-10 sm:pb-14 xl:h-full xl:min-h-0 xl:overflow-hidden xl:pb-0">
    {/* Left column ï¿½ greeting, gateway widgets, then main dashboard stack */}
    <div className="w-full xl:flex-1 min-w-0 xl:h-full xl:min-h-0 xl:overflow-hidden">
    <div className="dashboard-main-scroll flex min-w-0 flex-col gap-6 sm:gap-8 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pb-8 xl:pr-5 xl:-mr-5">
      <DashboardGreeting />

      <div className="grid grid-cols-2 2xl:grid-cols-4 gap-2.5 sm:gap-3 xl:gap-3 w-full">
        <button type="button" onClick={onOpenQuickDelivery} className="h-[104px] sm:h-[112px] lg:h-[118px] xl:h-[128px] 2xl:h-[138px] rounded-[18px] sm:rounded-[20px] xl:rounded-[22px] border-[1.5px] border-dashed border-[#8f969f] flex flex-col items-center justify-center gap-2 sm:gap-2.5 text-[#7f8791] hover:bg-white hover:border-[#5b626a] hover:text-[#191c20] transition-colors cursor-pointer w-full">
          <Plus size={17} />
          <div className="text-center">
            <p className="font-fraunces text-[13px] sm:text-[14px] font-medium tracking-tight text-current">New Project</p>
            <p className="mt-1 font-sans text-[7px] sm:text-[7.5px] xl:text-[8px] font-bold uppercase tracking-[0.14em] sm:tracking-[0.16em] xl:tracking-[0.18em] text-[#9ba0a8]">Full Project Setup</p>
          </div>
        </button>

        {WORKFLOW_GATEWAYS.map((item) => (
          <button
            type="button"
            key={item.title}
            onClick={() => {
              setCurrentView(item.targetView);
              if (item.targetTab) setActiveTab(item.targetTab as WorkspaceTab);
            }}
            className="relative flex flex-col justify-between h-[104px] sm:h-[112px] lg:h-[118px] xl:h-[128px] 2xl:h-[138px] p-3.5 sm:p-4 bg-white/40 backdrop-blur-xs border-[1.5px] border-solid border-[#8f969f]/40 hover:border-[#5b626a]/60 hover:bg-white/60 text-left cursor-pointer hover:scale-[1.02] active:scale-100 transition-all duration-200 select-none w-full group shadow-3xs hover:shadow-2xs rounded-[18px] sm:rounded-[20px] xl:rounded-[22px]"
          >
            {/* Top row: gateway circle badge, count, and right icon container */}
            <div className="flex items-center justify-between w-full relative z-10">
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <GatewayCircleBadge item={item} />
                <span className="font-sans font-extralight text-4xl sm:text-5xl xl:text-6xl text-[#191c20] leading-none tracking-tighter tabular-nums select-all shrink-0">
                  {item.count}
                </span>
              </div>

              {/* Clean icon container in the top-right */}
              <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center transition-colors group-hover:bg-white shadow-3xs shrink-0 select-none">
                <item.Icon size={15} strokeWidth={2} style={{ color: item.color }} />
              </div>
            </div>

            {/* Bottom info */}
            <div className="relative z-10 select-none">
              <span className="block font-fraunces text-[13px] sm:text-[14px] font-semibold text-[#191c20] tracking-tight group-hover:text-[#7eb098] transition-colors leading-tight">
                {item.title}
              </span>
              <span className="block font-sans text-[8px] sm:text-[8.5px] font-bold text-gray-400 uppercase tracking-[0.12em] mt-1 truncate">
                {item.metric}
              </span>
            </div>
          </button>
        ))}
      </div>

        {/* Row 1: Carousel expands when the reply composer opens */}
        <div className="flex flex-col md:flex-row gap-6 items-stretch">
          <div className={cn("transition-all ease-[cubic-bezier(0.32,0.72,0,1)]", isReplying ? "md:w-full duration-500" : "md:w-1/2 duration-300")}>
            <CyclingAnalyticsCard isReplying={isReplying} setIsReplying={setIsReplying} />
          </div>

          {!isReplying && (
            <div className="md:w-1/2 transition-all duration-300">
              {/* Today (Surfaceless, fixed height) */}
              <PrioritiesWidget actions={PRIORITIES} />
            </div>
          )}
        </div>

        {/* Dynamic Row 2: Depends on Reply state */}
        {!isReplying ? (
          <ClientEngagementPulse isVertical={false} onAction={openEngagementAction} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <ClientEngagementPulse isVertical={true} onAction={openEngagementAction} />

            {/* Today */}
            <PrioritiesWidget actions={PRIORITIES} />
          </div>
        )}

        {/* Active Projects Overview */}
        <div className="bg-white rounded-[32px] p-7 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] flex flex-col mb-4">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-fraunces text-[1.22rem] font-medium tracking-tight text-[#191c20]">Active Projects</h3>
            <div className="flex gap-4">
                 <button className="text-xs font-bold text-[#191c20] border-b-2 border-[#191c20] pb-1">ALL</button>
                 <button className="text-xs font-bold text-gray-400 border-b-2 border-transparent hover:text-gray-600 pb-1">PENDING</button>
                 <button className="text-xs font-bold text-gray-400 border-b-2 border-transparent hover:text-gray-600 pb-1">PAID</button>
              </div>
           </div>
           <div className="flex flex-col pr-1 max-h-[250px] overflow-y-auto scrollbar-thin">
             {PROJECTS.slice(0, 6).map((proj, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
                   <div className="flex items-center gap-6">
                      <span className="text-xs font-bold text-gray-300 w-6">{i + 1}</span>
                      <Avatar src={proj.client.avatar || AVATARS[i % 3]} className="w-10 h-10 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                      <div>
                         <h4 className="text-sm font-bold text-[#191c20] group-hover:text-[#7eb098] transition-colors">{proj.name}</h4>
                         <p className="text-[11px] text-gray-500 font-medium">{proj.client.name}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-12">
                      <div className="flex flex-col text-right">
                         <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Value</span>
                         <span className="text-sm font-bold text-[#191c20]">${proj.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col text-right">
                         <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Due</span>
                         <span className="text-sm font-bold text-[#191c20]">{proj.date}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#191c20] group-hover:text-white transition-colors">
                         <ArrowRight size={16} />
                      </div>
                   </div>
                </div>
             ))}
           </div>
        </div>
    </div>
    </div>

    {/* Right column ï¿½ briefing flush under app header, full viewport height */}
    <div className="w-full xl:w-[35.36%] shrink-0 flex min-h-0 flex-col overflow-hidden h-[min(520px,62vh)] sm:h-[min(580px,68vh)] xl:h-full xl:min-h-0 xl:max-h-full">
      <BriefingWidget
        onOpenEvent={openBriefingEvent}
        briefingEvents={briefingEvents}
        setBriefingEvents={setBriefingEvents}
        clientMetadata={clientMetadata}
        setClientMetadata={setClientMetadata}
        projectsList={projectsList}
        setClientNotes={setClientNotes}
        onBriefingNoteAdded={onBriefingNoteAdded}
        dismissedBriefingIds={dismissedBriefingIds}
        onDismissBriefingEvent={onDismissBriefingEvent}
      />
    </div>
  </div>
  );
};

const WORKSPACE_CLIENT_COLLAPSED_KEY = 'sendational_workspace_clients_collapsed';
const WORKSPACE_INDEX_COLLAPSED_KEY = 'sendational_workspace_index_collapsed';

/** Delivery folder tabs ï¿½ active tab merges into content panel below */
const DeliveryFolderTabs = ({
  tabs,
  activeId,
  onSelect,
}: {
  tabs: Array<{ id: string; label: string; count?: number }>;
  activeId: string;
  onSelect: (id: string) => void;
}) => {
  const getTabIcon = (id: string) => {
    const icons: Record<string, React.ElementType> = {
      overview: LayoutDashboard,
      files: Folder,
      messages: MessageCircle,
      activity: Activity,
      notes: FileText,
      storage: Package,
      billing: CreditCard,
    };

    return icons[id] ?? Folder;
  };

  return (
  <div className="delivery-folder-tabs flex items-end gap-1.5 shrink-0 relative z-10 px-0.5">
    {tabs.map((tab) => {
      const isActive = activeId === tab.id;
      const TabIcon = getTabIcon(tab.id);
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(tab.id)}
          className={cn(
            'group flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] font-sans font-bold uppercase tracking-wider rounded-t-[14px] border-x border-t transition-all cursor-pointer shrink-0',
            isActive
              ? 'bg-white border-gray-200 border-b-white text-[#191c20] shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.06)] -mb-px pb-[11px] z-20'
              : 'bg-[#eef1f4] border-transparent text-gray-500 hover:bg-[#f4f5f8] hover:text-gray-700'
          )}
        >
          <TabIcon
            size={12}
            strokeWidth={2}
            className={cn('shrink-0', isActive ? 'text-[#7eb098]' : 'text-gray-400 group-hover:text-gray-500')}
          />
          <span>{tab.label}</span>
          {tab.count != null && tab.count > 0 && (
            <span
              className={cn(
                'min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[7px] font-bold',
                isActive ? 'bg-[#7eb098]/20 text-[#4a9070]' : 'bg-gray-200/80 text-gray-600'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
  );
};

/** Middle delivery column ï¿½ folder lip (title tab + meta shoulder) + full-width sheet */
const DeliveryFolder = ({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="delivery-file-folder">
    <div className="delivery-file-folder__head">
      <div className="delivery-file-folder__tab delivery-file-folder__tab--primary">
        <h1 className="delivery-file-folder__title font-fraunces text-2xl font-bold text-[#191c20]">
          {title}
        </h1>
      </div>
      {meta ? (
        <div className="delivery-file-folder__tab delivery-file-folder__tab--meta">
          <div className="delivery-file-folder__tab-meta-surface">{meta}</div>
        </div>
      ) : null}
    </div>
    <div className="delivery-file-folder__sheet">{children}</div>
  </div>
);

const getActionQueueTypeTag = (type: 'message' | 'approval' | 'payment' | 'portal' | 'system') => {
  const map: Record<ActionQueueItem['type'], { label: string; className: string }> = {
    message: { label: 'Chat', className: 'bg-gradient-to-r from-[#484782]/10 to-indigo-500/10 text-[#484782] border-indigo-100/50' },
    approval: { label: 'Approval', className: 'bg-gradient-to-r from-[#7eb098]/15 to-emerald-500/10 text-[#4a9070] border-emerald-100/50' },
    payment: { label: 'Payment', className: 'bg-gradient-to-r from-[#ff5b4f]/10 to-orange-500/10 text-[#ff5b4f] border-orange-100/50' },
    portal: { label: 'Portal', className: 'bg-gradient-to-r from-amber-50/60 to-yellow-50/40 text-amber-700 border-amber-100/60' },
    system: { label: 'System', className: 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border-gray-200' },
  };
  return map[type];
};

const parseEventHour = (timeStr: string): number => {
  const m = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!m) return 12;
  let h = parseInt(m[1], 10);
  const ampm = m[3]?.toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h;
};

const splitListItemClass = (selected: boolean) =>
  cn(
    'w-full text-left p-4 rounded-[20px] border transition-all duration-300 cursor-pointer flex flex-col gap-1 relative group active:scale-[0.98]',
    selected
      ? 'bg-gradient-to-br from-[#191c20] to-[#25282f] text-white border-transparent shadow-[0_12px_24px_-8px_rgba(25,28,32,0.3)]'
      : 'bg-white border-gray-100 hover:border-[#7eb098]/30 hover:bg-[#7eb098]/5 hover:shadow-[0_8px_16px_-6px_rgba(126,176,152,0.12)]'
  );

/** Full-height hub views (Action Queue, Calendar, Deliveries) ï¿½ flush to main canvas edges */
const MAIN_HUB_VIEW_HEIGHT = 'flex-1 min-h-[680px] h-[calc(100vh-108px)] max-h-[calc(100vh-108px)]';
const SENDATIONAL_SLIDEIN_STRIPE_COLORS = ['#7eb098', '#484782', '#ff5b4f'] as const;
const HUB_BOOKLET_SHELL =
  'flex flex-1 min-w-0 min-h-0 h-full overflow-hidden border-t border-gray-200/55 bg-white';
/** Reports: dossier layout ï¿½ category rail ï¿½ binder ï¿½ detail (matches Action Queue) */
const ReportsAnalyticsShell = ({
  main,
  context,
}: {
  main: React.ReactNode;
  context: React.ReactNode;
}) => (
  <div className={cn('readable-view flex flex-col w-full min-w-0 select-none text-left', MAIN_HUB_VIEW_HEIGHT)}>
    <div className={HUB_BOOKLET_SHELL}>
      <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden bg-white">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-5 lg:p-6 scrollbar-default-thin">{main}</div>
      </div>
      <div className="hidden lg:flex shrink-0">
        <SpiralBinderSpine />
      </div>
      <div className="w-[248px] xl:w-[268px] shrink-0 hidden lg:flex flex-col min-h-0 overflow-y-auto scrollbar-thin p-4 pt-5 border-l border-gray-100/80 bg-white">
        {context}
      </div>
    </div>
  </div>
);

/** Narrow spiral coil between calendar panels */
const SpiralBinderSpine = () => (
  <div className="w-[10px] shrink-0 relative bg-[#eceef0] border-x border-gray-200/50" aria-hidden>
    <div className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-gray-300/70" />
    <div className="absolute inset-y-3 left-0 right-0 flex flex-col justify-evenly items-center">
      {Array.from({ length: 11 }).map((_, i) => (
        <div key={i} className="flex items-center justify-center w-full h-[3px]">
          <span className="absolute left-[1px] w-[2px] h-[5px] rounded-[1px] bg-gray-500/20" />
          <span className="w-[7px] h-[3px] rounded-full border border-gray-400/35 bg-gradient-to-b from-[#f2f3f5] to-[#b8bec8] shadow-[0_1px_0_rgba(255,255,255,0.7)]" />
          <span className="absolute right-[1px] w-[2px] h-[5px] rounded-[1px] bg-gray-500/20" />
        </div>
      ))}
    </div>
  </div>
);

/** Right slide-in panel ï¿½ overlay (UI stays put); red spine on left edge */
const SendationalSlideIn = ({
  open,
  onClose,
  badge,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  badge: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) => {
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timers: number[] = [];

    if (open) {
      timers.push(window.setTimeout(() => {
        setMounted(true);
        setExiting(false);
      }, 0));
    } else if (mounted) {
      timers.push(window.setTimeout(() => setExiting(true), 0));
      timers.push(window.setTimeout(() => {
        setMounted(false);
        setExiting(false);
      }, 280));
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200000]" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-[#191c20]/12 border-0 cursor-pointer"
        onClick={onClose}
        aria-label="Close panel"
      />
      <div
        className={cn(
          'absolute top-0 right-0 h-full w-[min(400px,92vw)] flex min-w-0 rounded-l-[2rem] overflow-hidden bg-white shadow-[-20px_0_56px_-16px_rgba(25,28,32,0.22)] z-10',
          exiting ? 'animate-slide-in-panel-out' : 'animate-slide-in-panel-in'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sendational-slidein-stripe"
          style={{
            background: `linear-gradient(180deg, ${SENDATIONAL_SLIDEIN_STRIPE_COLORS[0]} 0%, ${SENDATIONAL_SLIDEIN_STRIPE_COLORS[0]} 33.333%, ${SENDATIONAL_SLIDEIN_STRIPE_COLORS[1]} 33.333%, ${SENDATIONAL_SLIDEIN_STRIPE_COLORS[1]} 66.666%, ${SENDATIONAL_SLIDEIN_STRIPE_COLORS[2]} 66.666%, ${SENDATIONAL_SLIDEIN_STRIPE_COLORS[2]} 100%)`,
          }}
          aria-hidden
        />
        <div className="relative flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-white">
          <div className="flex-1 min-h-0 overflow-y-auto p-8 pt-7 relative scrollbar-thin">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#f4f5f8] hover:bg-gray-200 text-gray-500 hover:text-[#191c20] flex items-center justify-center cursor-pointer transition-colors z-10"
              aria-label="Close"
            >
              <X size={15} />
            </button>
            <div className="text-left mb-6 pr-10 font-sans">
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{badge}</span>
              <h3 className="font-fraunces text-2xl font-bold text-[#191c20] mt-1 tracking-tight">{title}</h3>
              {description && <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">{description}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

/** Action Queue: delivery triage + shared booklet spine + detail page */
const InboxDossierLayout = ({
  list,
  detail,
}: {
  list: React.ReactNode;
  detail: React.ReactNode;
}) => (
  <div className={cn('readable-view flex flex-col select-none text-left', MAIN_HUB_VIEW_HEIGHT)}>
    <div className={HUB_BOOKLET_SHELL}>
      <div className="shrink-0 w-full lg:w-[340px] xl:w-[368px] p-5 flex flex-col min-h-0 h-full overflow-visible border-r border-gray-100/80 bg-white">
        {list}
      </div>
      <div className="hidden lg:flex shrink-0">
        <SpiralBinderSpine />
      </div>
      <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-white overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-5 lg:p-6 scrollbar-default-thin flex flex-col">{detail}</div>
      </div>
    </div>
  </div>
);

/** Calendar: triptych in one booklet ï¿½ spiral spines, no panel gaps */
const CalendarHubShell = ({
  leftRail,
  timeline,
  context,
}: {
  leftRail: React.ReactNode;
  timeline: React.ReactNode;
  context: React.ReactNode;
}) => (
  <div className={cn('readable-view flex flex-col', MAIN_HUB_VIEW_HEIGHT)}>
    <div className={HUB_BOOKLET_SHELL}>
      <div className="w-[248px] xl:w-[268px] shrink-0 p-4 hidden md:flex flex-col min-h-0 border-r border-gray-100/80">
        {leftRail}
      </div>
      <div className="hidden md:flex shrink-0">
        <SpiralBinderSpine />
      </div>
      <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto p-5 scrollbar-default-thin">{timeline}</div>
      </div>
      <div className="hidden xl:flex shrink-0">
        <SpiralBinderSpine />
      </div>
      <div className="w-[248px] xl:w-[280px] shrink-0 p-4 hidden xl:flex flex-col gap-2 min-h-0 overflow-y-auto scrollbar-thin border-l border-gray-100/80">
        {context}
      </div>
    </div>
  </div>
);

/** Deliveries CRM: booklet layout with spiral gaps ï¿½ same rhythm as Calendar */
const WorkspaceCrmShell = ({
  profileRail,
  workspace,
  contextRail,
  profileCollapsed = false,
}: {
  profileRail: React.ReactNode;
  workspace: React.ReactNode;
  contextRail: React.ReactNode;
  profileCollapsed?: boolean;
}) => (
  <div className={cn('readable-view flex flex-col w-full min-w-0', MAIN_HUB_VIEW_HEIGHT)}>
    <div className={HUB_BOOKLET_SHELL}>
      <div
        className={cn(
          'hidden lg:flex flex-col min-h-0 h-full overflow-hidden shrink-0 bg-white border-r border-gray-100/80 transition-all duration-300',
          profileCollapsed ? 'w-[72px] px-2 py-3' : 'w-[280px] p-4 pt-3'
        )}
      >
        {profileRail}
      </div>
      <div className="hidden lg:flex shrink-0">
        <SpiralBinderSpine />
      </div>
      <div className="flex-1 min-w-0 basis-0 flex flex-col min-h-0 h-full overflow-hidden bg-[#f4f5f8]">
        {workspace}
      </div>
      <div className="hidden xl:flex shrink-0">
        <SpiralBinderSpine />
      </div>
      <div className="w-[260px] xl:w-[280px] p-4 pt-3 hidden xl:flex flex-col gap-2 min-h-0 overflow-y-auto scrollbar-thin shrink-0 bg-white border-l border-gray-100/80">
        {contextRail}
      </div>
    </div>
  </div>
);

/** Maps legacy portal tab targets to the merged Files & portal workspace tab */
const resolveWorkspaceTab = (
  tab: WorkspaceTargetTab
): WorkspaceTab => {
  if (tab === 'portal') return 'files';
  if (tab === 'client') return 'notes';
  return tab;
};

const getPreviewImageUrl = (url: string) =>
  url
    .replace(/([?&])w=\d+/, '$1w=900')
    .replace(/([?&])q=\d+/, '$1q=80')
    .replace(/([?&])fit=crop/, '$1fit=max');

const ProjectAssetPreview = ({ file }: { file: ProjectFile }) => {
  const PreviewIcon = file.type === 'pdf'
    ? FileText
    : file.type === 'archive'
      ? Folder
      : file.type === 'video'
        ? Activity
        : File;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[22px] border border-gray-100 bg-white shadow-[0_22px_54px_-22px_rgba(25,28,32,0.42)]",
        file.type === 'image' ? "w-fit min-w-[220px] max-w-[min(520px,72vw)]" : "w-[min(440px,72vw)]"
      )}
    >
      {file.type === 'image' && file.previewUrl ? (
        <div className="flex max-h-[420px] items-center justify-center bg-white">
          <img src={getPreviewImageUrl(file.previewUrl)} alt="" className="block h-auto max-h-[420px] w-auto max-w-[min(520px,72vw)] object-contain" />
        </div>
      ) : file.type === 'video' && file.previewUrl ? (
        <div className="bg-[#191c20]">
          <video src={file.previewUrl} className="aspect-video w-full object-cover" autoPlay muted loop playsInline preload="metadata" />
        </div>
      ) : (
        <div className="flex h-[180px] w-full items-center justify-center bg-[#f4f5f8]">
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f4f5f8_0%,#ffffff_48%,#edf5f1_100%)]">
            <div className="flex flex-col items-center gap-3 text-center">
              <PreviewIcon size={34} className="text-[#7eb098]" strokeWidth={1.7} />
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {file.type} preview
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 p-3.5">
        <div className="min-w-0">
          <p className="truncate font-fraunces text-[14px] font-semibold leading-tight tracking-tight text-[#191c20]">{file.name}</p>
          <p className="mt-1 font-sans text-[9px] font-bold uppercase tracking-wider text-gray-400">{file.size}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#191c20] px-2 py-1 font-sans text-[8px] font-extrabold uppercase tracking-[0.18em] text-white">
          {file.type}
        </span>
      </div>
    </div>
  );
};

interface ReportsViewProps {
  showToast: (msg: string) => void;
  clientMetadata: Record<string, { email: string; poc: string; priority: string; sentiment: string; avatar?: string }>;
  clientFilter: string;
  onClientFilterChange: (client: string) => void;
}

type ReportTab = 'revenue' | 'portal' | 'approvals' | 'trust';

/** Reports surfaces â€” aligned with Projects / Action Queue detail panes */
const REPORT_STAT = 'rounded-[1.6rem] border border-gray-100 bg-white p-[17px] shadow-3xs';
const REPORT_STAT_DASHED = 'rounded-[1.6rem] border border-dashed border-gray-200 bg-white p-[17px]';
const REPORT_BLOCK = 'rounded-2xl border border-gray-100 bg-white p-[22px] shadow-3xs';
const REPORT_BLOCK_DASHED = 'rounded-2xl border border-dashed border-gray-200/80 bg-white p-[22px]';
const REPORT_ROW = 'rounded-xl border border-gray-100 bg-[#f4f5f8]/50 p-4';
const REPORT_DIVIDER = () => <div className="flex items-center gap-3 my-1"><div className="flex-1 border-t border-dashed border-gray-200" /><span className="text-[8px] font-bold uppercase tracking-[0.2em] text-gray-300">·</span><div className="flex-1 border-t border-dashed border-gray-200" /></div>;
const REPORT_LABEL = 'text-[9.5px] font-bold uppercase tracking-widest text-gray-400';
const REPORT_HINT = 'text-[11px] text-gray-500 mt-0.5';
const REPORT_VALUE = 'font-fraunces text-2xl font-medium text-[#191c20] tabular-nums';
const REPORT_SECTION = 'font-fraunces text-xl font-medium text-[#191c20]';

const reportFolderTabClass = (selected: boolean) =>
  cn(
    'group flex items-center gap-1.5 px-3.5 py-2.5 text-[10.5px] font-bold uppercase tracking-wider rounded-t-[14px] border-x border-t transition-all cursor-pointer shrink-0',
    selected
      ? 'bg-white border-gray-200 border-b-white text-[#191c20] shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.06)] -mb-px pb-[11px] z-20'
      : 'bg-[#eef1f4] border-transparent text-gray-500 hover:bg-[#f4f5f8] hover:text-gray-700'
  );

const REPORT_TAB_META: Record<
  ReportTab,
  { label: string; subtitle: string; title: string; icon: React.ReactNode }
> = {
  revenue: {
    label: 'Payment Gates',
    subtitle: 'Gates, payouts & channel split',
    title: 'Payment Gate Performance',
    icon: <DollarSign size={16} />,
  },
  portal: {
    label: 'Portal Activity',
    subtitle: 'Engagement, funnel & access log',
    title: 'Portal Activity & Conversion',
    icon: <Activity size={16} />,
  },
  approvals: {
    label: 'Approvals',
    subtitle: 'Revisions, sign-off & release cycles',
    title: 'Approval Workflows',
    icon: <CheckCircle size={16} />,
  },
  trust: {
    label: 'Evidence Packs',
    subtitle: 'Audit trails, link health & proof',
    title: 'Evidence Packs & Audit Trails',
    icon: <ShieldAlert size={16} />,
  },
};

// â”€â”€ Static data for new features â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface LatePayment {
  id: string;
  client: string;
  project: string;
  amount: string;
  method: 'Zelle' | 'Venmo' | 'Wire';
  daysOverdue: number;
  markedPaidBy: string; // "client marked paid X days ago"
}

const LATE_PAYMENTS: LatePayment[] = [
  { id: 'lp-1', client: 'Startup Inc', project: 'Retainer Asset Pack â€“ May', amount: '$3,825.00', method: 'Zelle', daysOverdue: 9, markedPaidBy: '9 days ago' },
  { id: 'lp-2', client: 'Acme Corp', project: 'Brand Identity Redesign â€“ Final', amount: '$2,400.00', method: 'Venmo', daysOverdue: 4, markedPaidBy: '4 days ago' },
  { id: 'lp-3', client: 'GlobalTech', project: 'Compliance UX Audit â€“ Phase 2', amount: '$5,200.00', method: 'Wire', daysOverdue: 1, markedPaidBy: '1 day ago' },
];

interface EarningsPipelineItem {
  id: string;
  client: string;
  project: string;
  amount: string;
  stage: 'awaiting-approval' | 'approved-unpaid' | 'marked-paid-verifying';
  expectedDate: string;
}

const EARNINGS_PIPELINE: EarningsPipelineItem[] = [
  { id: 'ep-1', client: 'Acme Corp', project: 'Q3 Campaign Motion Graphics', amount: '$4,800.00', stage: 'awaiting-approval', expectedDate: 'Jun 10' },
  { id: 'ep-2', client: 'Startup Inc', project: 'Retainer Asset Pack â€“ May', amount: '$3,825.00', stage: 'marked-paid-verifying', expectedDate: 'Today' },
  { id: 'ep-3', client: 'GlobalTech', project: 'Compliance UX Audit â€“ Phase 2', amount: '$5,200.00', stage: 'marked-paid-verifying', expectedDate: 'Today' },
  { id: 'ep-4', client: 'Acme Corp', project: 'Brand Identity Redesign â€“ Final', amount: '$2,400.00', stage: 'approved-unpaid', expectedDate: 'Jun 8' },
  { id: 'ep-5', client: 'GlobalTech', project: 'Security Gateway Integration', amount: '$7,100.00', stage: 'awaiting-approval', expectedDate: 'Jun 14' },
];

interface ClientRelationship {
  client: string;
  completedProjects: number;
  avgTimeToApprove: string; // e.g. "1.4d"
  avgPaySpeed: string;      // e.g. "3d"
  revisionPressure: number; // rounds per project (float)
  tier: 'Champion' | 'Reliable' | 'Slow Pay' | 'High-Friction';
}

const CLIENT_RELATIONSHIP_DATA: ClientRelationship[] = [
  { client: 'GlobalTech', completedProjects: 6, avgTimeToApprove: '0.9d', avgPaySpeed: '1d', revisionPressure: 1.2, tier: 'Champion' },
  { client: 'Acme Corp', completedProjects: 8, avgTimeToApprove: '2.1d', avgPaySpeed: '4d', revisionPressure: 2.8, tier: 'Reliable' },
  { client: 'Startup Inc', completedProjects: 4, avgTimeToApprove: '3.4d', avgPaySpeed: '11d', revisionPressure: 1.6, tier: 'Slow Pay' },
];

interface AtRiskRoom {
  id: string;
  client: string;
  project: string;
  amount: string;
  daysSilent: number;
  lastAction: string;
}

const AT_RISK_ROOMS: AtRiskRoom[] = [
  { id: 'ar-1', client: 'Acme Corp', project: 'Q3 Campaign Motion Graphics', amount: '$4,800.00', daysSilent: 12, lastAction: 'Client viewed Storyboard_v2 watermarked preview' },
  { id: 'ar-2', client: 'Startup Inc', project: 'Pitch Deck Redesign', amount: '$1,950.00', daysSilent: 6, lastAction: 'Portal opened via magic link â€” no feedback left' },
  { id: 'ar-3', client: 'GlobalTech', project: 'Security Gateway Integration', amount: '$7,100.00', daysSilent: 5, lastAction: 'Approval checklist partially completed (2/4 gates)' },
];

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const getLatePaymentAgeClass = (days: number) => {
  if (days >= 7) return 'bg-[#ff5b4f]/10 text-[#c0392b] border border-[#ff5b4f]/25';
  if (days >= 3) return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-[#7eb098]/10 text-[#2e7d55] border border-[#7eb098]/25';
};

const getPipelineStageMeta = (stage: EarningsPipelineItem['stage']) => {
  switch (stage) {
    case 'awaiting-approval': return { label: 'Awaiting Approval', color: 'text-gray-500 bg-gray-100 border-gray-200' };
    case 'approved-unpaid':   return { label: 'Approved â€” Unpaid', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    case 'marked-paid-verifying': return { label: 'Verifying Payment', color: 'text-[#484782] bg-[#484782]/8 border-[#484782]/20' };
  }
};

const getTierMeta = (tier: ClientRelationship['tier']) => {
  switch (tier) {
    case 'Champion':     return { color: 'text-[#2e7d55] bg-[#7eb098]/10 border-[#7eb098]/25', dot: '#7eb098' };
    case 'Reliable':     return { color: 'text-[#484782] bg-[#484782]/8 border-[#484782]/20', dot: '#484782' };
    case 'Slow Pay':     return { color: 'text-amber-700 bg-amber-50 border-amber-200', dot: '#d97706' };
    case 'High-Friction':return { color: 'text-[#c0392b] bg-[#ff5b4f]/10 border-[#ff5b4f]/25', dot: '#ff5b4f' };
  }
};

const getAtRiskUrgencyClass = (days: number) => {
  if (days >= 10) return 'text-[#c0392b] bg-[#ff5b4f]/10 border-[#ff5b4f]/25';
  if (days >= 5)  return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-gray-500 bg-gray-100 border-gray-200';
};

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ReportsView = ({ showToast, clientMetadata, clientFilter, onClientFilterChange }: ReportsViewProps) => {
  const [selectedReportTab, setSelectedReportTab] = useState<ReportTab>('trust');
  const [reportTimeframe, setReportTimeframe] = useState<'30d' | '90d' | 'ytd'>('30d');
  const [disputeClient, setDisputeClient] = useState<string>('Acme Corp');
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const clientPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clientPickerOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (clientPickerRef.current && !clientPickerRef.current.contains(e.target as Node)) {
        setClientPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [clientPickerOpen]);

  const clientOptions = ['all', ...Object.keys(clientMetadata)];
  const isClientScoped = clientFilter !== 'all';
  const scopedClientLabel = isClientScoped ? clientFilter : 'All clients';
  const clientScopeScale = isClientScoped
    ? 0.28 + (Math.abs(clientFilter.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 45) / 100
    : 1;
  const scaleCount = (n: number) => (isClientScoped ? Math.max(1, Math.round(n * clientScopeScale)) : n);
  const scaleMoney = (raw: string) => {
    if (!isClientScoped) return raw;
    const num = parseFloat(raw.replace(/[$,]/g, ''));
    if (Number.isNaN(num)) return raw;
    return `$${(num * clientScopeScale).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getRevenueData = () => {
    switch (reportTimeframe) {
      case '90d': return { total: '$68,200.00', stripe: '$45,800.00', manual: '$22,400.00', pending: '$14,600.00', growth: '+18%' };
      case 'ytd': return { total: '$184,500.00', stripe: '$124,100.00', manual: '$60,400.00', pending: '$18,200.00', growth: '+32%' };
      default:    return { total: '$24,800.00', stripe: '$16,600.00', manual: '$8,200.00', pending: '$8,200.00', growth: '+14%' };
    }
  };

  const getPortalData = () => {
    switch (reportTimeframe) {
      case '90d': return { views: 486, previews: 1240, releases: 182, comments: 94, approvals: 156 };
      case 'ytd': return { views: 1894, previews: 5210, releases: 642, comments: 412, approvals: 588 };
      default:    return { views: 142, previews: 389, releases: 47, comments: 28, approvals: 41 };
    }
  };

  const getFunnelData = () => {
    switch (reportTimeframe) {
      case '90d': return [
        { step: 'Preview link sent', count: 218, pct: 100 },
        { step: 'Portal opened', count: 186, pct: 85 },
        { step: 'Watermarked preview', count: 142, pct: 65 },
        { step: 'Pin-point feedback', count: 58, pct: 27 },
        { step: 'Approved deliverables', count: 124, pct: 57 },
        { step: 'Payment completed', count: 108, pct: 50 },
        { step: 'Clean files unlocked', count: 102, pct: 47 },
      ];
      case 'ytd': return [
        { step: 'Preview link sent', count: 812, pct: 100 },
        { step: 'Portal opened', count: 698, pct: 86 },
        { step: 'Watermarked preview', count: 542, pct: 67 },
        { step: 'Pin-point feedback', count: 198, pct: 24 },
        { step: 'Approved deliverables', count: 478, pct: 59 },
        { step: 'Payment completed', count: 412, pct: 51 },
        { step: 'Clean files unlocked', count: 398, pct: 49 },
      ];
      default: return [
        { step: 'Preview link sent', count: 62, pct: 100 },
        { step: 'Portal opened', count: 54, pct: 87 },
        { step: 'Watermarked preview', count: 41, pct: 66 },
        { step: 'Pin-point feedback', count: 14, pct: 23 },
        { step: 'Approved deliverables', count: 36, pct: 58 },
        { step: 'Payment completed', count: 31, pct: 50 },
        { step: 'Clean files unlocked', count: 29, pct: 47 },
      ];
    }
  };

  const rev = getRevenueData();
  const portal = getPortalData();
  const funnel = getFunnelData();
  const tabMeta = REPORT_TAB_META[selectedReportTab];

  const scopedRev = { ...rev, total: scaleMoney(rev.total), stripe: scaleMoney(rev.stripe), manual: scaleMoney(rev.manual), pending: scaleMoney(rev.pending) };
  const scopedPortal = { views: scaleCount(portal.views), previews: scaleCount(portal.previews), releases: scaleCount(portal.releases), comments: scaleCount(portal.comments), approvals: scaleCount(portal.approvals) };
  const scopedFunnel = funnel.map((stage) => ({ ...stage, count: scaleCount(stage.count) }));
  const disputeReadiness = isClientScoped ? Math.min(99, 88 + (clientFilter.length % 8)) : 94;
  const verifiedExternalLinks = isClientScoped ? scaleCount(21) : 21;
  const brokenExternalLinks = isClientScoped ? (clientFilter === 'GlobalTech' ? 1 : 0) : 1;

  // â”€â”€ Scoped new-feature data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const scopedLatePayments = LATE_PAYMENTS.filter(lp => !isClientScoped || lp.client === clientFilter);
  const latePaymentsLimboTotal = scopedLatePayments.reduce((sum, lp) => {
    const n = parseFloat(lp.amount.replace(/[$,]/g, ''));
    return sum + (Number.isNaN(n) ? 0 : n);
  }, 0);

  const scopedPipeline = EARNINGS_PIPELINE.filter(ep => !isClientScoped || ep.client === clientFilter);
  const pipelineTotalExpected = scopedPipeline.reduce((sum, ep) => {
    const n = parseFloat(ep.amount.replace(/[$,]/g, ''));
    return sum + (Number.isNaN(n) ? 0 : n);
  }, 0);

  const scopedRelationships = CLIENT_RELATIONSHIP_DATA.filter(cr => !isClientScoped || cr.client === clientFilter);
  const scopedAtRisk = AT_RISK_ROOMS.filter(ar => !isClientScoped || ar.client === clientFilter);

  const evidencePackHistory = [
    { client: 'Acme Corp', room: 'Brand Identity Redesign', exported: 'Today, 11:42 AM', reason: 'Client asked for delivery proof', status: 'Ready' },
    { client: 'GlobalTech', room: 'Compliance UX Audit', exported: 'Yesterday, 4:58 PM', reason: 'Compliance archive', status: 'Ready' },
    { client: 'Startup Inc', room: 'Retainer Asset Pack', exported: 'Jun 4, 9:20 AM', reason: 'Manual payment review', status: 'Review' },
  ].filter((row) => !isClientScoped || row.client === clientFilter);

  const riskFlags = [
    { label: 'Viewed but not approved', client: 'Acme Corp', detail: '3 watermarked previews opened without sign-off', severity: 'High' },
    { label: 'Manual payment unverified', client: 'Startup Inc', detail: '$3,825 marked paid by client, awaiting confirmation', severity: 'High' },
    { label: 'External file permission risk', client: 'GlobalTech', detail: 'One Drive folder expires before final download window', severity: 'Medium' },
  ].filter((flag) => !isClientScoped || flag.client === clientFilter);
  const openRiskFlags = riskFlags.length;

  const externalLinkHealth = [
    { provider: 'Google Drive', status: 'Healthy', detail: '12 linked files verified', tone: 'good' },
    { provider: 'Dropbox', status: 'Healthy', detail: '6 linked files verified', tone: 'good' },
    { provider: 'OneDrive', status: 'Needs review', detail: '1 expiring permission', tone: 'warn' },
  ];

  const unlockTimeline = [
    { step: 'Preview sent', value: String(scaleCount(62)), detail: 'Private magic links sent' },
    { step: 'Client opened', value: String(scaleCount(54)), detail: 'No account required sessions' },
    { step: 'Approved', value: String(scaleCount(36)), detail: 'Signed off deliverables' },
    { step: 'Paid', value: String(scaleCount(31)), detail: 'Stripe or verified manual' },
    { step: 'Unlocked', value: String(scaleCount(29)), detail: 'Clean files released' },
  ];

  const accessLogRows = [
    { client: 'Acme Corp', action: 'Viewed Storyboard_v2_watermarked.mp4', icon: Eye, ip: '198.42.12.90', time: 'Today 11:24 AM' },
    { client: 'GlobalTech', action: 'Approved Final Deliverables Package', icon: CheckCircle, ip: '204.18.2.190', time: 'Yesterday 4:50 PM' },
    { client: 'GlobalTech', action: 'Downloaded Final_Code_Delivery.zip', icon: Download, ip: '204.18.2.190', time: 'Yesterday 4:52 PM' },
    { client: 'Startup Inc', action: 'Opened Magic Portal Link', icon: Link2, ip: '72.190.41.8', time: 'Jun 4, 2:15 PM' },
  ].filter((row) => !isClientScoped || row.client === clientFilter);

  const proofChainChecklist = [
    { label: 'Magic link identity', detail: 'Client, link token, IP and timestamp captured', status: 'Captured' },
    { label: 'Watermarked preview', detail: 'Protected previews viewed before final unlock', status: 'Captured' },
    { label: 'Feedback trail', detail: 'Comments, revision requests and replies attached', status: 'Captured' },
    { label: 'Approval gate', detail: 'Final approval timestamp tied to the delivery room', status: 'Captured' },
    { label: 'Payment gate', detail: 'Stripe confirmation or manual verification logged', status: 'Review' },
    { label: 'Clean-file release', detail: 'Final download activity linked to approval and payment', status: 'Captured' },
  ];

  const disputeExportClient = clientFilter !== 'all' ? clientFilter : disputeClient;

  const tabStats: Record<ReportTab, { label: string; value: string; sub: string }[]> = {
    revenue: [
      { label: 'Gate cleared', value: scopedRev.total, sub: 'Released value' },
      { label: 'In limbo', value: `$${latePaymentsLimboTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'Unverified manual pays' },
      { label: 'Stripe gates', value: scopedRev.stripe, sub: 'Automated' },
      { label: 'Pipeline expected', value: `$${pipelineTotalExpected.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, sub: 'If all gates clear' },
    ],
    portal: [
      { label: 'Portal opens', value: String(scopedPortal.views), sub: 'Magic link sessions' },
      { label: 'Clean unlocks', value: String(scopedPortal.releases), sub: 'Files released' },
      { label: 'Approvals', value: String(scopedPortal.approvals), sub: 'Signed off' },
      { label: 'Funnel completion', value: `${scopedFunnel[scopedFunnel.length - 1].pct}%`, sub: 'Link to unlock' },
    ],
    approvals: [
      { label: 'Avg cycle', value: '1.8d', sub: 'Link to unlock' },
      { label: 'Revision rounds', value: '8', sub: 'Pin-point feedback' },
      { label: 'Resolved', value: '94%', sub: 'Loops closed' },
      { label: 'At-risk rooms', value: String(scopedAtRisk.length), sub: 'Gone quiet' },
    ],
    trust: [
      { label: 'Dispute ready', value: `${disputeReadiness}%`, sub: 'Proof captured' },
      { label: 'Risk flags', value: String(openRiskFlags), sub: 'Need review' },
      { label: 'Evidence packs', value: String(evidencePackHistory.length), sub: 'Exported' },
      { label: 'Link health', value: `${verifiedExternalLinks}/${verifiedExternalLinks + brokenExternalLinks}`, sub: 'Verified' },
    ],
  };

  // â”€â”€ Client picker & timeframe picker (unchanged) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const clientPicker = (
    <div ref={clientPickerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setClientPickerOpen((open) => !open)}
        className="flex items-center gap-2 rounded-2xl border border-gray-200/80 bg-white px-3 py-2 text-left shadow-[0_8px_22px_-18px_rgba(25,28,32,0.35)] hover:border-[#7eb098]/45 hover:bg-slate-50/50 transition-all cursor-pointer min-w-[168px]"
        aria-expanded={clientPickerOpen}
      >
        <span className="w-7 h-7 shrink-0 rounded-full bg-[#f4f5f8] border border-white shadow-sm flex items-center justify-center overflow-hidden">
          {isClientScoped && clientMetadata[clientFilter]?.avatar ? (
            <img src={clientMetadata[clientFilter].avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[8px] font-extrabold uppercase text-[#484782]">
              {isClientScoped ? clientFilter.slice(0, 2) : 'All'}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-extrabold text-[#191c20]">{scopedClientLabel}</span>
          <span className="block text-[8.5px] font-bold uppercase tracking-widest text-gray-400">
            {isClientScoped ? 'Client scope' : 'Workspace-wide'}
          </span>
        </span>
        <ChevronDown size={14} className={cn('shrink-0 text-gray-400 transition-transform', clientPickerOpen && 'rotate-180')} />
      </button>
      {clientPickerOpen && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[80] w-[min(280px,calc(100vw-2rem))] rounded-[1.25rem] border border-slate-100 bg-white p-1.5 shadow-[0_20px_48px_-16px_rgba(25,28,32,0.18)] ring-1 ring-black/[0.03]">
          <div className="max-h-[240px] overflow-y-auto scrollbar-thin space-y-1">
            {clientOptions.map((name) => {
              const isAll = name === 'all';
              const isSelected = clientFilter === name;
              const meta = isAll ? null : clientMetadata[name];
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => { onClientFilterChange(name); setClientPickerOpen(false); }}
                  className={cn('w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all cursor-pointer border border-transparent', isSelected ? 'bg-[#7eb098]/8 border-[#7eb098]/15 font-semibold' : 'hover:bg-slate-50 text-gray-700')}
                >
                  <span className="w-7 h-7 shrink-0 rounded-full bg-[#f4f5f8] border border-white flex items-center justify-center overflow-hidden">
                    {!isAll && meta?.avatar ? (
                      <img src={meta.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] font-extrabold uppercase text-[#484782]">{isAll ? 'All' : name.slice(0, 2)}</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] font-extrabold text-gray-800">
                    {isAll ? 'All clients' : name}
                  </span>
                  {isSelected ? <CheckCircle size={14} className="text-[#7eb098] shrink-0" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const timeframePicker = (
    <div className="flex flex-wrap gap-1.5 shrink-0">
      {(['30d', '90d', 'ytd'] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setReportTimeframe(t)}
          className={cn('px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer', reportTimeframe === t ? 'bg-[#191c20] text-white shadow-sm' : 'bg-[#f4f5f8] text-gray-500 hover:bg-gray-200')}
        >
          {t}
        </button>
      ))}
    </div>
  );

  const reportStatGrid = (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
      {tabStats[selectedReportTab].map((stat, idx) => (
        <div key={stat.label} className={idx % 2 === 1 ? REPORT_STAT_DASHED : REPORT_STAT}>
          <span className={REPORT_LABEL}>{stat.label}</span>
          <p className={cn(REPORT_VALUE, 'mt-1')}>{stat.value}</p>
          <p className={REPORT_HINT}>{stat.sub}</p>
        </div>
      ))}
    </div>
  );

  // ——— Context rail — now includes Network Effect tracker —————————————————————
  const reportContextRail = (
    <div className="flex flex-col gap-4 min-h-0 h-full">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Live snapshot</p>
        <p className="font-fraunces text-sm font-semibold text-[#191c20] mt-1">{scopedClientLabel}</p>
        <p className={REPORT_HINT}>{reportTimeframe} · {tabMeta.label}</p>
      </div>

      {/* Dispute readiness — dotted receipt-stub left accent */}
      <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f4f5f8]/40 p-4 relative overflow-hidden">
        {/* Dotted left accent strip */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] flex flex-col items-center justify-around py-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="block w-[3px] h-[3px] rounded-full bg-[#7eb098]/60" />
          ))}
        </div>
        <div className="pl-3">
          <p className={REPORT_LABEL}>Dispute readiness</p>
          <p className="font-fraunces text-3xl font-medium text-[#191c20] tabular-nums mt-1">{disputeReadiness}%</p>
          {/* Mini dotted progress rail */}
          <div className="flex gap-[3px] mt-2 mb-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <span
                key={i}
                className="block h-[3px] flex-1 rounded-full"
                style={{ backgroundColor: i < Math.round(disputeReadiness / 5) ? '#7eb098' : '#e2e6e9' }}
              />
            ))}
          </div>
          <p className={REPORT_HINT}>Proof captured for active rooms</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="space-y-2">
        {[
          { label: 'Manual verify queue', value: String(scopedLatePayments.length), hint: 'Unconfirmed payments' },
          { label: 'At-risk rooms', value: String(scopedAtRisk.length), hint: 'Gone quiet — nudge needed' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-100 bg-white p-3">
            <p className={REPORT_LABEL}>{item.label}</p>
            <p className="font-fraunces text-xl font-medium text-[#191c20] tabular-nums mt-0.5">{item.value}</p>
            <p className={REPORT_HINT}>{item.hint}</p>
          </div>
        ))}
      </div>

      {/* External link health */}
      <div>
        <p className={REPORT_LABEL}>External link health</p>
        <div className="flex justify-between text-[11px] font-medium text-gray-500 mt-2 mb-1.5">
          <span className="flex items-center gap-1"><Link2 size={11} /> Verified</span>
          <span className="font-fraunces tabular-nums text-[#191c20]">{verifiedExternalLinks}/{verifiedExternalLinks + brokenExternalLinks}</span>
        </div>
        <div className="h-1.5 rounded-full bg-[#eceef0] overflow-hidden">
          <div className="h-full bg-[#7eb098]/70 rounded-full" style={{ width: `${(verifiedExternalLinks / (verifiedExternalLinks + brokenExternalLinks)) * 100}%` }} />
        </div>
      </div>

      {/* ——— FEATURE 5: Network Effect Tracker ——— */}
      <div className="rounded-2xl border border-dashed border-[#484782]/25 bg-[#484782]/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-5 h-5 rounded-full bg-[#484782]/15 flex items-center justify-center">
            <ShieldAlert size={11} className="text-[#484782]" />
          </span>
          <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#484782]">Proof chain</p>
        </div>
        <p className="font-fraunces text-2xl font-medium text-[#191c20] tabular-nums">6 checkpoints</p>
        <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">Evidence readiness across identity, preview, feedback, approval, payment, and unlock events.</p>
        <div className="mt-3 pt-3 border-t border-[#484782]/10 flex items-center justify-between">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Gate coverage</span>
          <span className="font-fraunces text-sm font-semibold text-[#484782]">5/6 captured</span>
        </div>
        <p className="text-[9px] text-gray-400 mt-1">Payment verification is the only checkpoint needing review.</p>
      </div>

      {/* Actions */}
      <div className="mt-auto pt-2 space-y-2">
        <button
          type="button"
          onClick={() => showToast('Client delivery summary PDF queued for secure export.')}
          className="w-full py-2.5 text-[9px] font-bold uppercase tracking-wider rounded-xl bg-[#191c20] text-white hover:bg-black transition-colors cursor-pointer"
        >
          Summary PDF
        </button>
        <button
          type="button"
          onClick={() => showToast('Immutable evidence pack queued — you will receive a secure download link.')}
          className="w-full py-2.5 text-[9px] font-bold uppercase tracking-wider rounded-xl border border-gray-200 text-gray-600 hover:bg-[#f4f5f8] transition-colors cursor-pointer"
        >
          Evidence pack
        </button>
      </div>
    </div>
  );

  return (
    <ReportsAnalyticsShell
      context={reportContextRail}
      main={
        <>
          {/* Tab bar + filters */}
          <div className="flex flex-wrap items-end justify-between gap-3 mb-0 border-b border-gray-200/80">
            <div className="delivery-folder-tabs flex items-end gap-1.5 overflow-x-auto scrollbar-none pb-px flex-1 min-w-0">
              {(Object.keys(REPORT_TAB_META) as ReportTab[]).map((id) => {
                const metaDef = REPORT_TAB_META[id];
                const selected = selectedReportTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedReportTab(id)}
                    className={reportFolderTabClass(selected)}
                  >
                    <span className={cn('shrink-0', selected ? 'text-[#7eb098]' : 'text-gray-400 group-hover:text-gray-500')}>
                      {metaDef.icon}
                    </span>
                    <span>{metaDef.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2 pb-2 shrink-0">
              {clientPicker}
              {timeframePicker}
            </div>
          </div>

          {/* Tab content panel */}
          <div className="rounded-b-[1.25rem] rounded-tr-[1.25rem] border border-gray-200/80 border-t-0 bg-white p-5 lg:p-6 shadow-[0_8px_24px_-16px_rgba(25,28,32,0.12)]">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div>
                <h3 className="font-fraunces text-xl font-semibold text-[#191c20] tracking-tight">{tabMeta.title}</h3>
                <p className="text-[11px] text-gray-500 mt-1">
                  {tabMeta.subtitle}{isClientScoped ? ` · ${clientFilter}` : ''}
                </p>
              </div>
              <span className="rounded-full bg-[#f4f5f8] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-gray-500">
                {reportTimeframe}
              </span>
            </div>

            {/* Stat grid */}
            <div className="mb-6">{reportStatGrid}</div>

            {/* ——— PAYMENT GATES TAB ————————————————————————————————————————————— */}
            {selectedReportTab === 'revenue' && (
              <div className="space-y-5">

                {/* ——— FEATURE 1: Late Payment Radar ——— */}
                <div className={REPORT_BLOCK_DASHED}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <span className={REPORT_LABEL}>Late payment radar</span>
                      <h4 className={cn(REPORT_SECTION, 'mt-1')}>Manual payments awaiting verification</h4>
                      <p className="text-[11px] text-gray-500 mt-1">
                        These clients have marked their payment as sent — but you haven't confirmed it yet.
                      </p>
                    </div>
                    {latePaymentsLimboTotal > 0 && (
                      <div className="shrink-0 rounded-2xl border border-dashed border-[#ff5b4f]/40 bg-[#ff5b4f]/5 px-4 py-3 text-right">
                        <p className={REPORT_LABEL}>Money in limbo</p>
                        <p className="font-fraunces text-xl font-semibold text-[#c0392b] tabular-nums mt-0.5">
                          ${latePaymentsLimboTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Unconfirmed funds</p>
                      </div>
                    )}
                  </div>

                  {scopedLatePayments.length > 0 ? (
                    <div className="space-y-2.5">
                      {scopedLatePayments.map((lp) => (
                        <div key={lp.id} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-[#f4f5f8]/40 p-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Age badge */}
                            <div className={cn('shrink-0 rounded-xl px-2.5 py-1.5 text-center min-w-[52px] border', getLatePaymentAgeClass(lp.daysOverdue))}>
                              <p className="font-fraunces text-base font-semibold tabular-nums leading-none">{lp.daysOverdue}d</p>
                              <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5">overdue</p>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#191c20] text-[12px] truncate">{lp.client}</p>
                              <p className="text-[10px] text-gray-500 truncate mt-0.5">{lp.project}</p>
                              <p className="text-[9.5px] text-gray-400 mt-0.5">
                                <span className="font-bold">{lp.method}</span> · Client marked paid {lp.markedPaidBy}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-2">
                            <p className="font-fraunces text-base font-semibold text-[#191c20] tabular-nums">{lp.amount}</p>
                            <button
                              type="button"
                              onClick={() => showToast(`Payment reminder sent to ${lp.client} for ${lp.project}.`)}
                              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
                            >
                              <Send size={10} strokeWidth={2.5} /> Send reminder
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={cn(REPORT_ROW, 'text-center text-[11px] text-[#2e7d55] font-semibold')}>
                      ✓ No unverified manual payments in this scope — you're all clear.
                    </div>
                  )}
                </div>

                {/* ——— FEATURE 2: Earnings Forecast / Pipeline ——— */}
                <REPORT_DIVIDER />
                <div className={REPORT_BLOCK}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <span className={REPORT_LABEL}>Earnings forecast</span>
                      <h4 className={cn(REPORT_SECTION, 'mt-1')}>Active payment pipeline</h4>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Expected income from delivery rooms currently in progress.
                      </p>
                    </div>
                    <div className="shrink-0 rounded-2xl border border-dashed border-[#7eb098]/40 bg-[#7eb098]/5 px-4 py-3 text-right">
                      <p className={REPORT_LABEL}>Expected total</p>
                      <p className="font-fraunces text-xl font-semibold text-[#2e7d55] tabular-nums mt-0.5">
                        ${pipelineTotalExpected.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-[9px] text-gray-400 mt-0.5">If all gates clear</p>
                    </div>
                  </div>

                  {/* Pipeline stage legend */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      { stage: 'awaiting-approval' as const, label: 'Awaiting Approval' },
                      { stage: 'approved-unpaid' as const, label: 'Approved — Unpaid' },
                      { stage: 'marked-paid-verifying' as const, label: 'Verifying Payment' },
                    ].map(({ stage, label }) => {
                      const meta = getPipelineStageMeta(stage);
                      return (
                        <span key={stage} className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider', meta.color)}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {label}
                        </span>
                      );
                    })}
                  </div>

                  {scopedPipeline.length > 0 ? (
                    <div className="space-y-2">
                      {scopedPipeline.map((ep) => {
                        const stageMeta = getPipelineStageMeta(ep.stage);
                        return (
                          <div key={ep.id} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-[#f4f5f8]/40 p-3.5">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-[#191c20] text-[12px] truncate">{ep.client}</p>
                                <span className={cn('rounded-full border px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider shrink-0', stageMeta.color)}>
                                  {stageMeta.label}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-0.5 truncate">{ep.project}</p>
                              <p className="text-[9px] text-gray-400 mt-0.5">Expected: <span className="font-bold text-gray-600">{ep.expectedDate}</span></p>
                            </div>
                            <p className="font-fraunces text-base font-semibold text-[#191c20] tabular-nums shrink-0">{ep.amount}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={cn(REPORT_ROW, 'text-center text-[11px] text-gray-400')}>
                      No active pipeline items for this client scope.
                    </div>
                  )}
                </div>

                {/* Channel split (existing) */}
                <div className={REPORT_BLOCK}>
                  <span className={REPORT_LABEL}>Payment gate mix</span>
                  <h4 className={cn(REPORT_SECTION, 'mt-1 mb-4')}>Channel split</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold mb-1.5">
                        <span className="text-gray-500">Auto-gated — Stripe, card & ACH</span>
                        <span className="text-[#191c20] tabular-nums">67%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#f4f5f8] overflow-hidden">
                        <div className="bg-[#7eb098] h-full rounded-full" style={{ width: '67%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold mb-1.5">
                        <span className="text-gray-500">Manual verification — Zelle, Venmo & wire</span>
                        <span className="text-[#191c20] tabular-nums">33%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#f4f5f8] overflow-hidden">
                        <div className="bg-[#7eb098]/35 h-full rounded-full" style={{ width: '33%' }} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4 bg-gray-50/80 border border-gray-100 rounded-2xl p-4 text-[11px] text-gray-600">
                    <div>
                      <span className="text-gray-400 font-extrabold tracking-wider uppercase text-[9.5px]">Period growth: </span>
                      <span className="font-bold text-[#7eb098]">{scopedRev.growth}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-extrabold tracking-wider uppercase text-[9.5px]">Release policy: </span>
                      <span className="text-gray-800 font-bold">Files unlock after approval + payment only</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* â”€â”€â”€ PORTAL ACTIVITY TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {selectedReportTab === 'portal' && (
              <div className="space-y-4">
                {/* Delivery funnel (existing) */}
                <div className={REPORT_BLOCK}>
                  <span className={REPORT_LABEL}>Delivery funnel</span>
                  <h4 className={cn(REPORT_SECTION, 'mt-1 mb-1')}>Preview link to paid unlock</h4>
                  <p className="text-[11px] text-gray-500 mb-4">The Sendational finish line for every delivery room.</p>
                  <div className="space-y-2.5">
                    {scopedFunnel.map((stage) => (
                      <div key={stage.step} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-[11px] font-medium mb-1">
                            <span className="text-gray-500 truncate pr-2">{stage.step}</span>
                            <span className="text-[#191c20] tabular-nums shrink-0">{stage.count} â€” {stage.pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#f4f5f8] overflow-hidden">
                            <div className="h-full rounded-full bg-[#7eb098]" style={{ width: `${stage.pct}%`, opacity: 0.35 + (stage.pct / 100) * 0.65 }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={REPORT_STAT}>
                    <span className={REPORT_LABEL}>Biggest drop-off</span>
                    <p className="font-fraunces text-lg font-semibold text-[#191c20] mt-1">Preview to Feedback</p>
                    <p className={REPORT_HINT}>38% of viewers never leave comments</p>
                  </div>
                  <div className={REPORT_STAT}>
                    <span className={REPORT_LABEL}>Gate pass-through</span>
                    <p className={cn(REPORT_VALUE, 'mt-1')}>94%</p>
                    <p className={REPORT_HINT}>Approve and pay in same session</p>
                  </div>
                </div>

                {/* â”€â”€ FEATURE 3: Client Relationship Scores â”€â”€ */}
                <div className={REPORT_BLOCK}>
                  <div className="mb-4">
                    <span className={REPORT_LABEL}>Client insights</span>
                    <h4 className={cn(REPORT_SECTION, 'mt-1')}>Relationship scores per client</h4>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Based on completed projects, payment speed, approval velocity, and revision pressure across all delivery rooms.
                    </p>
                  </div>
                  {scopedRelationships.length > 0 ? (
                    <div className="space-y-3">
                      {scopedRelationships.map((cr) => {
                        const tierMeta = getTierMeta(cr.tier);
                        return (
                          <div key={cr.client} className="rounded-xl border border-gray-100 bg-[#f4f5f8]/40 p-4">
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {clientMetadata[cr.client]?.avatar && (
                                  <img src={clientMetadata[cr.client].avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-white shadow-sm shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="font-semibold text-[#191c20] text-[13px] truncate">{cr.client}</p>
                                  <p className="text-[9px] text-gray-400">{cr.completedProjects} completed projects</p>
                                </div>
                              </div>
                              <span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider', tierMeta.color)}>
                                {cr.tier}
                              </span>
                            </div>
                            {/* Stat micro-grid */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {[
                                { label: 'Avg approval', value: cr.avgTimeToApprove },
                                { label: 'Avg pay speed', value: cr.avgPaySpeed },
                                { label: 'Revisions/project', value: String(cr.revisionPressure) },
                              ].map((s) => (
                                <div key={s.label} className="rounded-lg border border-gray-100 bg-white px-2.5 py-2 text-center">
                                  <p className="text-[8px] font-bold uppercase tracking-wider text-gray-400">{s.label}</p>
                                  <p className="font-fraunces text-sm font-semibold text-[#191c20] mt-0.5 tabular-nums">{s.value}</p>
                                </div>
                              ))}
                            </div>
                            {/* Revision pressure bar */}
                            <div>
                              <div className="flex justify-between text-[9px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                                <span>Revision pressure</span>
                                <span className="tabular-nums">{cr.revisionPressure} rounds avg</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, (cr.revisionPressure / 5) * 100)}%`,
                                    backgroundColor: tierMeta.dot,
                                    opacity: 0.7,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={cn(REPORT_ROW, 'text-center text-[11px] text-gray-400')}>
                      No relationship data for this client scope.
                    </div>
                  )}
                </div>

                {/* Access log (existing) */}
                <div className={REPORT_BLOCK}>
                  <h4 className={cn(REPORT_SECTION, 'mb-4')}>Recent client access log</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                          <th className="pb-3 pl-2">Client</th>
                          <th className="pb-3">Action</th>
                          <th className="pb-3">IP</th>
                          <th className="pb-3 pr-2 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                        {accessLogRows.length > 0 ? accessLogRows.map((row) => {
                          const Icon = row.icon;
                          return (
                            <tr key={`${row.client}-${row.time}-${row.action}`}>
                              <td className="py-3 pl-2 font-bold text-[#191c20]">{row.client}</td>
                              <td className="py-3 flex items-center gap-1.5"><Icon size={12} className="text-gray-400" /> {row.action}</td>
                              <td className="py-3 font-mono text-[11px] text-gray-400">{row.ip}</td>
                              <td className="py-3 pr-2 text-right text-gray-400">{row.time}</td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan={4} className="py-8 text-center text-gray-400 text-[11px]">No access events for this client in this period.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* â”€â”€â”€ APPROVALS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {selectedReportTab === 'approvals' && (
              <div className="space-y-4">
                {/* Existing workflow breakdown */}
                <div className={REPORT_BLOCK}>
                  <span className={REPORT_LABEL}>Workflow breakdown</span>
                  <h4 className={cn(REPORT_SECTION, 'mt-1 mb-4')}>Approval cycles</h4>
                  <div className="space-y-2.5">
                    {[
                      { count: '1', title: 'Revision requested', detail: 'Acme Corp â€” Campaign assets need review', status: 'Active', tone: 'pending' as const },
                      { count: '14', title: 'Fully signed off', detail: 'Approved, paid, and released', status: 'Archived', tone: 'done' as const },
                      { count: '2', title: 'Awaiting first look', detail: 'Startup Inc â€” Room sent, not opened', status: 'Pending', tone: 'pending' as const },
                    ].map((row) => (
                      <div key={row.title} className={cn(REPORT_ROW, 'flex items-center justify-between gap-3')}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0', row.tone === 'done' ? 'bg-[#7eb098]/12 text-[#5f9b80] border border-[#7eb098]/20' : 'bg-white border border-gray-150/60 text-gray-500')}>
                            {row.count}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#191c20] text-[12px]">{row.title}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{row.detail}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-gray-500 bg-white border border-gray-150/60 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">{row.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* â”€â”€ FEATURE 4: At-Risk Delivery Rooms â”€â”€ */}
                <div className={REPORT_BLOCK}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <span className={REPORT_LABEL}>At-risk rooms</span>
                      <h4 className={cn(REPORT_SECTION, 'mt-1')}>Delivery rooms that have gone quiet</h4>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Clients who opened their portal but haven't approved, paid, or responded. A timely nudge often unsticks these.
                      </p>
                    </div>
                    {scopedAtRisk.length > 0 && (
                      <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                        {scopedAtRisk.length} rooms
                      </span>
                    )}
                  </div>

                  {scopedAtRisk.length > 0 ? (
                    <div className="space-y-2.5">
                      {scopedAtRisk.map((room) => (
                        <div key={room.id} className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-[#f4f5f8]/40 p-3.5">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Staleness badge */}
                            <div className={cn('shrink-0 rounded-xl px-2.5 py-1.5 text-center min-w-[48px] border', getAtRiskUrgencyClass(room.daysSilent))}>
                              <p className="font-fraunces text-base font-semibold tabular-nums leading-none">{room.daysSilent}d</p>
                              <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5">silent</p>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#191c20] text-[12px]">{room.client}</p>
                              <p className="text-[10px] text-gray-500 truncate mt-0.5">{room.project}</p>
                              <p className="text-[9.5px] text-gray-400 mt-1 leading-relaxed italic">
                                Last: {room.lastAction}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-2">
                            <p className="font-fraunces text-sm font-semibold text-[#191c20] tabular-nums">{room.amount}</p>
                            <button
                              type="button"
                              onClick={() => showToast(`Nudge sent to ${room.client} for "${room.project}" â€” follow-up queued.`)}
                              className="flex items-center gap-1.5 rounded-lg border border-[#484782]/25 bg-[#484782]/6 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#484782] hover:bg-[#484782]/12 transition-all cursor-pointer"
                            >
                              <Send size={10} strokeWidth={2.5} /> Send nudge
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={cn(REPORT_ROW, 'text-center text-[11px] text-[#2e7d55] font-semibold')}>
                      âœ“ No at-risk rooms â€” all active portals have recent activity.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* â”€â”€â”€ EVIDENCE PACKS TAB (existing, unchanged) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {selectedReportTab === 'trust' && (
              <div className="space-y-4">
                <div className={REPORT_BLOCK}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <span className={REPORT_LABEL}>Evidence packs</span>
                      <h4 className={cn(REPORT_SECTION, 'mt-1')}>Export history</h4>
                    </div>
                    <span className="rounded-full bg-[#7eb098]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#5b987d]">
                      {evidencePackHistory.length} packs
                    </span>
                  </div>
                  <div className="space-y-2">
                    {evidencePackHistory.length > 0 ? evidencePackHistory.map((row) => (
                      <div key={`${row.client}-${row.exported}`} className={cn(REPORT_ROW, 'flex items-center justify-between gap-3')}>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#191c20] text-[12px]">{row.client}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{row.room} â€” {row.reason}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider', row.status === 'Ready' ? 'bg-[#7eb098]/12 text-[#5f9b80]' : 'bg-amber-50 text-amber-700')}>
                            {row.status}
                          </span>
                          <p className="mt-1 text-[9px] font-semibold text-gray-400">{row.exported}</p>
                        </div>
                      </div>
                    )) : (
                      <div className={cn(REPORT_ROW, 'text-[11px] text-gray-500')}>No evidence packs exported for this client scope yet.</div>
                    )}
                  </div>
                </div>

                <div className={REPORT_BLOCK_DASHED}>
                  <span className={REPORT_LABEL}>Unlock timeline</span>
                  <h4 className={cn(REPORT_SECTION, 'mt-1 mb-4')}>Link to release</h4>
                  {/* Horizontal dotted connector flow */}
                  <div className="flex items-stretch gap-0 overflow-x-auto scrollbar-none">
                    {unlockTimeline.map((item, idx) => (
                      <React.Fragment key={item.step}>
                        <div className={cn(
                          'flex-1 min-w-[80px] rounded-xl p-3 text-center',
                          idx === unlockTimeline.length - 1
                            ? 'border border-[#7eb098]/30 bg-[#7eb098]/8'
                            : 'border border-dashed border-gray-200 bg-[#f4f5f8]/40'
                        )}>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400 block">{item.step}</span>
                          <p className={cn(REPORT_VALUE, 'text-lg mt-1')}>{item.value}</p>
                          <p className={REPORT_HINT}>{item.detail}</p>
                        </div>
                        {idx < unlockTimeline.length - 1 && (
                          <div className="flex items-center px-1 shrink-0">
                            <div className="flex items-center gap-[2px]">
                              {Array.from({ length: 3 }).map((_, di) => (
                                <span key={di} className="block w-[3px] h-[3px] rounded-full bg-gray-300" />
                              ))}
                              <span className="text-gray-300 text-[10px] leading-none ml-0.5">›</span>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className={REPORT_BLOCK}>
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div>
                      <span className={REPORT_LABEL}>Evidence completeness</span>
                      <h4 className={cn(REPORT_SECTION, 'mt-1')}>Proof-chain checklist</h4>
                      <p className="text-[12px] text-gray-500 mt-1">
                        The evidence pack should prove the full path from private preview to clean-file release.
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-dashed border-[#7eb098]/35 bg-[#7eb098]/8 px-3 py-1 text-[9.5px] font-bold uppercase tracking-wider text-[#5b987d]">
                      5/6 captured
                    </span>
                  </div>
                  <div className="relative grid gap-3 md:grid-cols-2">
                    <div className="pointer-events-none absolute left-[18px] top-4 bottom-4 hidden border-l border-dashed border-gray-200 md:block" />
                    {proofChainChecklist.map((item, idx) => (
                      <div key={item.label} className={cn(REPORT_ROW, 'relative flex items-start gap-3 bg-white/70')}>
                        <span className={cn(
                          'relative z-10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white shadow-3xs',
                          item.status === 'Captured' ? 'border-[#7eb098]/30 text-[#5f9b80]' : 'border-amber-200 text-amber-700'
                        )}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[13px] font-bold text-[#191c20]">{item.label}</p>
                            <span className={cn(
                              'rounded-full px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider',
                              item.status === 'Captured' ? 'bg-[#7eb098]/12 text-[#5f9b80]' : 'bg-amber-50 text-amber-700'
                            )}>
                              {item.status}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-gray-500">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className={REPORT_BLOCK}>
                    <h4 className={cn(REPORT_SECTION, 'mb-4')}>Risk flags</h4>
                    <div className="space-y-2">
                      {riskFlags.length > 0 ? riskFlags.map((flag) => (
                        <div key={`${flag.client}-${flag.label}`} className={cn(REPORT_ROW, 'flex items-start gap-3')}>
                          <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', flag.severity === 'High' ? 'bg-[#ff5b4f]/10 text-[#ff5b4f]' : 'bg-amber-50 text-amber-700')}>
                            <AlertCircle size={14} strokeWidth={2.4} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-[#191c20]">{flag.label}</p>
                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">{flag.client}</p>
                            <p className="mt-1 text-[10.5px] text-gray-500 leading-relaxed">{flag.detail}</p>
                          </div>
                        </div>
                      )) : (
                        <div className={cn(REPORT_ROW, 'text-[11px] text-gray-500')}>No active delivery risks in this scope.</div>
                      )}
                    </div>
                  </div>

                  <div className={REPORT_BLOCK}>
                    <h4 className={cn(REPORT_SECTION, 'mb-4')}>External link health</h4>
                    <div className="space-y-2">
                      {externalLinkHealth.map((row) => (
                        <div key={row.provider} className={cn(REPORT_ROW, 'flex items-center justify-between gap-3')}>
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', row.tone === 'good' ? 'bg-[#7eb098]/12 text-[#5f9b80]' : 'bg-amber-50 text-amber-700')}>
                              <Link2 size={14} strokeWidth={2.4} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-[12px] font-bold text-[#191c20] truncate">{row.provider}</p>
                              <p className="mt-0.5 text-[10px] text-gray-500">{row.detail}</p>
                            </div>
                          </div>
                          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider', row.tone === 'good' ? 'bg-[#7eb098]/12 text-[#5f9b80]' : 'bg-amber-50 text-amber-700')}>
                            {row.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={cn(REPORT_BLOCK, 'flex flex-col md:flex-row items-start md:items-center justify-between gap-6')}>
                  <div className="max-w-lg">
                    <span className={REPORT_LABEL}>Dispute evidence</span>
                    <h4 className={cn(REPORT_SECTION, 'mt-1')}>Immutable audit trails</h4>
                    <p className="text-[11.5px] text-gray-500 mt-2 leading-relaxed">
                      Every portal open, preview, feedback, approval, and payment is logged. Export packs for disputes or compliance.
                    </p>
                  </div>
                  <div className="shrink-0 w-full md:w-[220px] flex flex-col gap-3">
                    <label htmlFor="dispute-client-select" className={REPORT_LABEL}>Target client</label>
                    <select
                      id="dispute-client-select"
                      value={disputeExportClient}
                      onChange={(e) => setDisputeClient(e.target.value)}
                      className="bg-[#f4f5f8] border border-gray-100 text-[#191c20] rounded-xl px-3 py-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#7eb098]/50"
                    >
                      <option value="Acme Corp">Acme Corp</option>
                      <option value="Startup Inc">Startup Inc</option>
                      <option value="GlobalTech">GlobalTech</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => showToast(`Compiling immutable audit logs... Evidence pack exported securely for ${disputeExportClient}!`)}
                      className="w-full py-2.5 bg-[#191c20] hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Download size={12} strokeWidth={2.5} /> Export ZIP Pack
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      }
    />
  );
};

const generateRandomIndex = (length: number): number => {
  return Math.floor(Math.random() * length);
};

const generateFileId = (): string => {
  return `f-${Date.now()}`;
};

const generateProjectId = (): string => {
  return `PRJ-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
};

const generateUniqueId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

interface QuickDeliveryDraft {
  clientName: string;
  clientEmail: string;
  deliveryTitle: string;
  linkLabel: string;
  files: Array<{ name: string; size: string }>;
  paymentAmount?: string;
}

const inferProjectFileType = (fileName: string): ProjectFile['type'] => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
  if (['mp4', 'mov', 'webm'].includes(ext || '')) return 'video';
  if (['pdf'].includes(ext || '')) return 'pdf';
  if (['zip', 'rar', '7z'].includes(ext || '')) return 'archive';
  if (['mp3', 'wav', 'aac'].includes(ext || '')) return 'audio';
  return 'generic';
};
interface ActionQueueItem {
  id: string;
  client: string;
  projectId?: string;
  type: 'message' | 'approval' | 'payment' | 'portal' | 'system';
  title: string;
  description: string;
  time: string;
  urgency: 'High' | 'Medium' | 'Low';
  targetTab: WorkspaceTargetTab;
  actionText: string;
  status: 'Pending' | 'Resolved';
  // Redesign additions
  refId: string;
  replies?: Array<{ id: string; sender: 'user' | 'client'; text: string; time: string }>;
  approvalGates?: Array<{ id: string; name: string; checked: boolean }>;
  invoiceItems?: Array<{ id: string; desc: string; qty: number; price: number }>;
  portalLocked?: boolean;
  portalViews?: Array<{ id: string; date: string; ip: string; action: string }>;
}

interface ActionQueueViewProps {
  clientMetadata: Record<string, { email: string; poc: string; priority: string; sentiment: string; avatar?: string }>;
  setSelectedClientName: (name: string) => void;
  setSelectedProjectId: (id: string) => void;
  projectsList: Project[];
  setCurrentView: (view: string) => void;
  setActiveTab: React.Dispatch<React.SetStateAction<WorkspaceTab>>;
}

const INITIAL_ACTION_QUEUE_ITEMS: ActionQueueItem[] = [
  {
    id: 'inb-1',
    client: 'Acme Corp',
    projectId: 'PRJ-001c89f2',
    type: 'message',
    title: 'Typography Specs Feedback Needed',
    description: 'Dave Connor left feedback: "Colors look fantastic, but we need to ensure the typography specs are uploaded. Can you double check?"',
    time: '2 hours ago',
    urgency: 'High',
    targetTab: 'messages',
    actionText: 'Reply to Dave',
    status: 'Pending',
    refId: 'REF/INB-01',
    replies: [
      { id: 'rep-1', sender: 'client', text: 'Colors look fantastic, but we need to ensure the typography specs are uploaded. Can you double check?', time: '2 hours ago' }
    ]
  },
  {
    id: 'inb-2',
    client: 'GlobalTech',
    projectId: 'PRJ-002a7b8e',
    type: 'approval',
    title: 'Awaiting UX Research Sign-off',
    description: 'Survey results and interview recording uploaded. Awaiting compliance team review and Sarah Jenkins approval.',
    time: '1 day ago',
    urgency: 'Medium',
    targetTab: 'portal',
    actionText: 'Manage Portal Gates',
    status: 'Pending',
    refId: 'REF/INB-02',
    approvalGates: [
      { id: 'gate-1', name: 'Compliance Registry Review', checked: true },
      { id: 'gate-2', name: 'Sarah Jenkins Approval Node', checked: false },
      { id: 'gate-3', name: 'Accessibility Standard Audit Sign-off', checked: false }
    ]
  },
  {
    id: 'inb-3',
    client: 'Startup Inc',
    type: 'payment',
    title: 'Invoice Sent 7 Days Ago (Overdue)',
    description: 'Retainer payment reminder needed. Invoiced amount: $3,825. Follow up with Michael Chen.',
    time: '2 days ago',
    urgency: 'High',
    targetTab: 'billing',
    actionText: 'Send Invoice Reminder',
    status: 'Pending',
    refId: 'REF/INB-03',
    invoiceItems: [
      { id: 'inv-1', desc: 'Retainer Fee - Phase 1 Final Deliverable', qty: 1, price: 3500 },
      { id: 'inv-2', desc: 'Stripe Processing & Operations Fee', qty: 1, price: 325 }
    ]
  },
  {
    id: 'inb-4',
    client: 'Acme Corp',
    projectId: 'PRJ-001c89f2',
    type: 'portal',
    title: 'Client Viewed Files (No Approval)',
    description: 'Dave Connor viewed "logo_final.png" and "colors.png" on the portal 3 times but has not approved the delivery node.',
    time: '3 hours ago',
    urgency: 'Medium',
    targetTab: 'activity',
    actionText: 'View Activity Logs',
    status: 'Pending',
    refId: 'REF/INB-04',
    portalLocked: false,
    portalViews: [
      { id: 'pv-1', date: '3 hours ago', ip: '192.168.1.144', action: 'Viewed colors.png' },
      { id: 'pv-2', date: '4 hours ago', ip: '192.168.1.144', action: 'Viewed logo_final.png' }
    ]
  },
  {
    id: 'inb-5',
    client: 'Broken Co',
    type: 'portal',
    title: 'Expired Delivery Link Confusion',
    description: 'Unknown Manager clicked your deliverable path `/c/broken-recovery-link` which expired on Sep 28.',
    time: 'Yesterday',
    urgency: 'High',
    targetTab: 'client',
    actionText: 'Re-enable Link Node',
    status: 'Pending',
    refId: 'REF/INB-05',
    portalLocked: true,
    portalViews: [
      { id: 'pv-3', date: 'Yesterday', ip: '204.18.2.190', action: 'Link Access Denied (Expired Gateway Token)' }
    ]
  },
  {
    id: 'inb-6',
    client: 'Startup Inc',
    type: 'system',
    title: 'Draft Retainer Incomplete',
    description: 'Project created but deliverables files are still locked. Complete draft upload to notify Michael Chen.',
    time: '3 days ago',
    urgency: 'Low',
    targetTab: 'files',
    actionText: 'Upload Draft Files',
    status: 'Pending',
    refId: 'REF/INB-06'
  }
];

type GatewayCircleKind = 'trend' | 'gates' | 'live';

interface WorkflowGateway {
  eyebrow: string;
  count: string;
  title: string;
  metric: string;
  Icon: React.ElementType;
  color: string;
  targetView: string;
  targetTab: WorkspaceTargetTab | null;
  circleKind: GatewayCircleKind;
  trendType?: 'up' | 'down';
  trendText?: string;
  gateDone?: number;
  gateTotal?: number;
  liveCount?: number;
}

function buildWorkflowGateways(): WorkflowGateway[] {
  const pendingInbox = INITIAL_ACTION_QUEUE_ITEMS.filter((i) => i.status === 'Pending');
  const approvalItems = pendingInbox.filter((i) => i.type === 'approval');
  const gateTotal = approvalItems.reduce((sum, item) => sum + (item.approvalGates?.length ?? 0), 0);
  const gateDone = approvalItems.reduce(
    (sum, item) => sum + (item.approvalGates?.filter((g) => g.checked).length ?? 0),
    0
  );
  const gatesOpen = Math.max(gateTotal - gateDone, approvalItems.length);

  const unpaidProjects = PROJECTS.filter(
    (p) => p.status === 'Pending' || p.status === 'Unpaid' || p.status === 'Failed'
  );
  const unpaidTotal = unpaidProjects.reduce((sum, p) => sum + p.amount, 0);
  const overduePayments = pendingInbox.filter((i) => i.type === 'payment').length;

  const liveClients = RADAR_CLIENTS.filter((c) => c.isLive).length;
  const portalAlerts = pendingInbox.filter((i) => i.type === 'portal').length;

  const formatMoney = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : `$${n}`;

  return [
    {
      eyebrow: 'APPROVALS',
      circleKind: 'gates',
      gateDone,
      gateTotal: gateTotal || 1,
      count: String(gatesOpen),
      title: 'Approval Queue',
      metric:
        gateTotal > 0
          ? `${gateDone}/${gateTotal} gates cleared ï¿½ ${approvalItems.length} thread open`
          : `${approvalItems.length} pending review`,
      Icon: CheckCircle,
      color: '#7eb098',
      targetView: 'Action Queue',
      targetTab: null,
    },
    {
      eyebrow: 'PAYMENTS',
      circleKind: 'trend',
      trendType: 'up',
      trendText: '+24%',
      count: String(unpaidProjects.length),
      title: 'Payments',
      metric: `${formatMoney(unpaidTotal)} outstanding${overduePayments > 0 ? ` ï¿½ ${overduePayments} overdue` : ''}`,
      Icon: CreditCard,
      color: '#484782',
      targetView: 'Projects',
      targetTab: 'billing',
    },
    {
      eyebrow: 'PORTALS',
      circleKind: 'live',
      liveCount: liveClients,
      count: String(liveClients),
      title: 'Client Portals',
      metric: `${portalAlerts} portal alert${portalAlerts !== 1 ? 's' : ''} ï¿½ ${liveClients} live now`,
      Icon: Activity,
      color: '#5a6068',
      targetView: 'Projects',
      targetTab: 'files',
    },
  ];
}

const WORKFLOW_GATEWAYS = buildWorkflowGateways();

/** Circle badge ï¿½ trend % for payments; gate progress for approvals; live pulse for portals */
const GatewayCircleBadge = ({ item }: { item: WorkflowGateway }) => {
  const circleSize =
    'w-10 h-10 sm:w-11 sm:h-11 xl:w-12 xl:h-12 rounded-full bg-white border border-gray-100/80 shadow-[0_4px_12px_-4px_rgba(25,28,32,0.12)]';

  if (item.circleKind === 'trend') {
    return (
      <div className="relative shrink-0 select-none">
        <div
          className={cn(
            'absolute -top-1 -left-1 z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] border-white text-white shadow-xs',
            item.trendType === 'up' ? 'bg-[#7eb098]' : 'bg-[#ff5b4f]'
          )}
        >
          <ArrowUpRight
            size={10}
            strokeWidth={3}
            style={{ transform: item.trendType === 'down' ? 'rotate(90deg)' : 'none' }}
          />
        </div>
        <div className={cn(circleSize, 'flex items-center justify-center')}>
          <span className="font-sans text-[9px] sm:text-[10px] font-extrabold text-[#191c20]">{item.trendText}</span>
        </div>
      </div>
    );
  }

  if (item.circleKind === 'gates') {
    const done = item.gateDone ?? 0;
    const total = Math.max(item.gateTotal ?? 1, 1);
    const progress = Math.min(100, Math.round((done / total) * 100));
    const ringRadius = 15;
    const circumference = 2 * Math.PI * ringRadius;
    const dash = (progress / 100) * circumference;

    return (
      <div className={cn(circleSize, 'relative flex items-center justify-center shrink-0 select-none')}>
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36" aria-hidden>
          <circle cx="18" cy="18" r={ringRadius} fill="none" stroke="#eceef0" strokeWidth="2.75" />
          <circle
            cx="18"
            cy="18"
            r={ringRadius}
            fill="none"
            stroke="#7eb098"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <span className="relative font-sans text-[8.5px] sm:text-[9px] font-extrabold tabular-nums text-[#191c20]">
          {done}/{total}
        </span>
      </div>
    );
  }

  const live = item.liveCount ?? 0;
  return (
    <div className={cn(circleSize, 'relative flex items-center justify-center shrink-0 select-none')}>
      {live > 0 && (
        <>
          <span className="absolute inset-0 rounded-full border-2 border-[#7eb098]/20 animate-ping opacity-50" />
          <span className="absolute inset-[3px] rounded-full border border-[#7eb098]/35" />
        </>
      )}
      <span
        className={cn(
          'relative z-10 font-sans text-[11px] sm:text-[12px] font-extrabold tabular-nums leading-none',
          live > 0 ? 'text-[#7eb098]' : 'text-gray-400'
        )}
      >
        {live}
      </span>
    </div>
  );
};

const ActionQueueView = ({
  clientMetadata,
  setSelectedClientName,
  setSelectedProjectId,
  projectsList,
  setCurrentView,
  setActiveTab,
}: ActionQueueViewProps) => {
  const [inboxItems, setInboxItems] = useState<ActionQueueItem[]>(INITIAL_ACTION_QUEUE_ITEMS);
  const [activeCategory, setActiveCategory] = useState<'all' | 'message' | 'approval' | 'payment' | 'portal' | 'system'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string>('inb-1');
  const [replyInputText, setReplyInputText] = useState<string>('');
  const [isVerifyingStripe, setIsVerifyingStripe] = useState<boolean>(false);
  const [toastText, setToastText] = useState<string | null>(null);
  const [typingItemId, setTypingItemId] = useState<string | null>(null);
  const [focusedQuickClient, setFocusedQuickClient] = useState<string | null>(null);

  const activeItems = inboxItems.filter(item => {
    if (item.status === 'Resolved') return false;
    if (focusedQuickClient && item.client !== focusedQuickClient) return false;
    if (activeCategory === 'all') return true;
    return item.type === activeCategory;
  });

  // Keep selection valid
  const selectedItem = inboxItems.find(item => item.id === selectedItemId && item.status === 'Pending') || activeItems[0];
  const selectedTypingItemId = selectedItem?.id;
  const selectedTypingItemType = selectedItem?.type;
  const isClientTyping = selectedTypingItemType === 'message' && typingItemId === selectedTypingItemId;

  useEffect(() => {
    if (!selectedTypingItemId || selectedTypingItemType !== 'message') {
      return;
    }

    const showTimer = window.setTimeout(() => setTypingItemId(selectedTypingItemId), 0);
    const hideTimer = window.setTimeout(() => setTypingItemId(null), 1500);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [selectedTypingItemId, selectedTypingItemType]);

  const handleResolve = (id: string) => {
    setInboxItems(prev => prev.map(item => item.id === id ? { ...item, status: 'Resolved' as const } : item));
    const targetItem = inboxItems.find(item => item.id === id);
    if (targetItem) {
      setToastText(`"${targetItem.title}" marked as resolved.`);
      setTimeout(() => setToastText(null), 3000);
    }
  };

  const handleSendReply = () => {
    if (!replyInputText.trim() || !selectedItem) return;
    setInboxItems(prev => prev.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          replies: [
            ...(item.replies || []),
            { id: `rep-${Date.now()}`, sender: 'user', text: replyInputText, time: 'Just now' }
          ]
        };
      }
      return item;
    }));
    setReplyInputText('');
    setToastText("Reply dispatched securely to client.");
    setTimeout(() => setToastText(null), 3000);
  };

  const handleToggleGate = (gateId: string) => {
    if (!selectedItem) return;
    setInboxItems(prev => prev.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          approvalGates: (item.approvalGates || []).map(g => g.id === gateId ? { ...g, checked: !g.checked } : g)
        };
      }
      return item;
    }));
  };

  const handleProcessGates = () => {
    if (!selectedItem) return;
    const allChecked = selectedItem.approvalGates?.every(g => g.checked);
    if (allChecked) {
      handleResolve(selectedItem.id);
    } else {
      setToastText("All checklist gates must be signed off before release.");
      setTimeout(() => setToastText(null), 3000);
    }
  };

  const handleVerifyStripe = () => {
    if (!selectedItem) return;
    setIsVerifyingStripe(true);
    setTimeout(() => {
      setIsVerifyingStripe(false);
      handleResolve(selectedItem.id);
      setToastText("Retainer invoice verified successfully via Stripe.");
      setTimeout(() => setToastText(null), 3000);
    }, 1500);
  };

  const handleTogglePortalLock = () => {
    if (!selectedItem) return;
    const nextState = !selectedItem.portalLocked;
    setInboxItems(prev => prev.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          portalLocked: nextState,
          portalViews: [
            { id: `pv-${Date.now()}`, date: 'Just now', ip: '127.0.0.1 (Override)', action: nextState ? 'Magic Link LOCKED by Admin' : 'Magic Link UNLOCKED by Admin' },
            ...(item.portalViews || [])
          ]
        };
      }
      return item;
    }));
    setToastText(nextState ? "Portal magic link lock deployed." : "Portal magic link unlocked.");
    setTimeout(() => setToastText(null), 3000);
  };

  const getCategoryCount = (cat: 'all' | 'message' | 'approval' | 'payment' | 'portal' | 'system') => {
    return inboxItems.filter(item => {
      if (item.status === 'Resolved') return false;
      if (cat === 'all') return true;
      return item.type === cat;
    }).length;
  };

  const getUrgencyColor = (urgency: 'High' | 'Medium' | 'Low') => {
    switch (urgency) {
      case 'High': return 'bg-[#ff5b4f] text-white border-none';
      case 'Medium': return 'bg-[#484782] text-white border-none';
      default: return 'bg-[#7eb098] text-[#191c20] border-none';
    }
  };

  const quickClients = Array.from(
    new Map(
      activeItems.map((item) => [item.client, item])
    ).values()
  ).slice(0, 6);

  const inboxCategories: Array<{ id: typeof activeCategory; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'message', label: 'Chat' },
    { id: 'approval', label: 'Approvals' },
    { id: 'payment', label: 'Payments' },
    { id: 'portal', label: 'Portal' },
    { id: 'system', label: 'System' },
  ];

  return (
    <>
    <InboxDossierLayout
      list={
        <>
        <div className="mb-4 shrink-0 flex flex-col min-h-0 flex-1 overflow-visible">
          {/* Quick contacts ï¿½ clients with pending actions */}
          {quickClients.length > 0 && (
            <div className="shrink-0 mb-3 rounded-2xl bg-[#f4f5f8]/80 px-3 pt-3 pb-2 overflow-visible">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-0.5">Pending clients</p>
              <div className="flex gap-3 overflow-x-auto overflow-y-visible py-2 px-1 scrollbar-thin">
                {quickClients.map((item) => {
                  const meta = clientMetadata[item.client];
                  const avatar = meta?.avatar || `https://i.pravatar.cc/150?img=${Math.abs(item.client.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 70}`;
                  const isFocused = focusedQuickClient === item.client;
                  return (
                    <button
                      key={item.client}
                      type="button"
                      onClick={() => {
                        const nextFocus = isFocused ? null : item.client;
                        setFocusedQuickClient(nextFocus);
                        const pool = inboxItems.filter(
                          (i) => i.status === 'Pending' && (!nextFocus || i.client === nextFocus)
                        );
                        const first = pool.find((i) => i.client === item.client) || pool[0];
                        if (first) setSelectedItemId(first.id);
                      }}
                      className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group min-w-[52px]"
                    >
                      <div className={cn('relative p-0.5', isFocused && 'ring-2 ring-[#7eb098] rounded-full')}>
                        <img src={avatar} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" />
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#ff5b4f] ring-2 ring-white" />
                      </div>
                      <span className="text-[9px] font-sans font-bold text-gray-500 max-w-[64px] truncate group-hover:text-[#191c20] text-center leading-tight">
                        {item.client.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {focusedQuickClient && (
            <div className="shrink-0 mb-3 flex items-center justify-between gap-2 rounded-xl bg-[#7eb098]/10 border border-[#7eb098]/25 px-3 py-2">
              <span className="text-[10px] font-sans font-bold text-[#4a9070]">
                Showing <span className="text-[#191c20]">{focusedQuickClient}</span> only
              </span>
              <button
                type="button"
                onClick={() => setFocusedQuickClient(null)}
                className="text-[9px] font-bold uppercase tracking-wider text-gray-600 hover:text-[#191c20] cursor-pointer"
              >
                Show all
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h3 className="font-fraunces text-[1.35rem] font-medium tracking-tight text-[#191c20]">Delivery Queue</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
                {focusedQuickClient ? `${focusedQuickClient} ï¿½ pending` : 'Approval, payment & portal actions'}
              </p>
            </div>
            {activeItems.length > 0 && (
              <span className="bg-[#ff5b4f] text-white font-bold text-[10px] px-2.5 py-1 rounded-full font-sans">
                {activeItems.length}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4 shrink-0">
            {inboxCategories.map((cat) => {
              const count = getCategoryCount(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-[9px] font-sans font-bold uppercase tracking-wider transition-all cursor-pointer',
                    activeCategory === cat.id
                      ? 'bg-[#191c20] text-white shadow-sm'
                      : 'bg-[#f4f5f8] text-gray-500 hover:bg-gray-200'
                  )}
                >
                  {cat.label}{count > 0 ? ` (${count})` : ''}
                </button>
              );
            })}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
          {activeItems.length > 0 ? (
            activeItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const tag = getActionQueueTypeTag(item.type);

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={splitListItemClass(!!isSelected)}
                >
                  {isSelected && (
                    <div className="absolute top-4 left-0 w-1.5 h-8 rounded-r-md bg-[#7eb098]" />
                  )}
                  <div className="flex items-center justify-between gap-2 pl-2">
                    <span className={cn('font-fraunces text-[13px] font-semibold truncate', isSelected ? 'text-white' : 'text-[#191c20]')}>
                      {item.client}
                    </span>
                    <span className={cn('text-[9px] font-sans shrink-0', isSelected ? 'text-white/60' : 'text-gray-400')}>{item.time}</span>
                  </div>
                  <p className={cn('text-[11px] font-sans font-medium truncate pl-2', isSelected ? 'text-white/80' : 'text-gray-600')}>
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 pl-2">
                    <span className={cn(
                      'text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                      isSelected ? 'bg-white/15 text-white border-white/20' : tag.className
                    )}>
                      {tag.label}
                    </span>
                    <span className={cn('text-[9px] truncate', isSelected ? 'text-white/50' : 'text-gray-400')}>{item.refId}</span>
                    <span className={cn('ml-auto text-[8px] font-bold uppercase px-1.5 py-0.5 rounded', getUrgencyColor(item.urgency))}>
                      {item.urgency}
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-24 border border-dashed border-[#eceef0] rounded-2xl bg-slate-50/20">
              <CheckCircle size={20} className="mx-auto text-[#7eb098] opacity-70 mb-2" />
              <p className="text-[12px] font-sans font-bold text-gray-500">Delivery Queue Clear</p>
              <p className="text-[9.5px] text-gray-400 font-sans font-bold uppercase mt-0.5">No approval, payment, or portal blockers</p>
            </div>
          )}
          </div>
        </div>
        </>
      }
      detail={
        selectedItem ? (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-start justify-between gap-4 mb-5 shrink-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={cn('text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', getActionQueueTypeTag(selectedItem.type).className)}>
                    {getActionQueueTypeTag(selectedItem.type).label}
                  </span>
                  <span className={cn('px-2 py-0.5 rounded text-[8px] font-bold uppercase', getUrgencyColor(selectedItem.urgency))}>
                    {selectedItem.urgency}
                  </span>
                </div>
                <h3 className="font-fraunces text-2xl font-bold text-[#191c20] tracking-tight leading-tight">
                  {selectedItem.title}
                </h3>
                <p className="text-[11px] text-gray-500 font-sans font-bold mt-1">
                  {selectedItem.client} ï¿½ {selectedItem.time}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 gap-x-4 bg-gray-50/80 border border-gray-100 rounded-2xl p-4 text-[11px] font-sans text-gray-600 mb-6 shrink-0">
              <div>
                <span className="text-gray-400 font-extrabold tracking-wider uppercase text-[9.5px]">CLIENT:</span>{' '}
                <span className="font-fraunces text-gray-800 font-bold">{selectedItem.client}</span>
              </div>
              <div>
                <span className="text-gray-400 font-extrabold tracking-wider uppercase text-[9.5px]">SECTION:</span>{' '}
                <span className="text-gray-800 font-bold uppercase">{selectedItem.targetTab}</span>
              </div>
              <div>
                <span className="text-gray-400 font-extrabold tracking-wider uppercase text-[9.5px]">RECEIVED:</span>{' '}
                <span className="text-gray-800 font-bold">{selectedItem.time}</span>
              </div>
              <div>
                <span className="text-gray-400 font-extrabold tracking-wider uppercase text-[9.5px]">STATUS:</span>{' '}
                <span className={cn("font-bold uppercase", selectedItem.status === 'Resolved' ? "text-[#7eb098]" : "text-[#ff5b4f] animate-pulse")}>
                  {selectedItem.status}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-extrabold tracking-wider uppercase text-[9.5px]">CONTACT:</span>{' '}
                <span className="text-gray-800 font-bold">
                  {clientMetadata[selectedItem.client]?.poc || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-extrabold tracking-wider uppercase text-[9.5px]">PRIORITY / SENTIMENT:</span>{' '}
                <span className="text-gray-800 font-bold uppercase">
                  {clientMetadata[selectedItem.client]?.priority || 'STANDARD'} / {clientMetadata[selectedItem.client]?.sentiment || 'NEUTRAL'}
                </span>
              </div>
            </div>

            {/* Main Document Content */}
            <div className={cn('relative z-10 shrink-0', selectedItem.type === 'message' ? 'mb-4' : 'flex-1 min-h-0 mb-6')}>
              <h4 className="font-sans text-[9px] uppercase tracking-widest text-[#9ba0a8] font-bold mb-2">DELIVERY CONTEXT</h4>
              <p className="font-sans text-[13px] text-[#5b626a] leading-relaxed bg-white border border-[#f0f2f5] p-5 rounded-2xl shadow-3xs">
                {selectedItem.description}
              </p>
            </div>

            {selectedItem.type === 'message' ? (
              <div className="flex flex-col flex-1 min-h-0 border-t border-gray-200 pt-5 relative z-10">
                <div className="bg-white rounded-2xl p-5 flex flex-col flex-1 min-h-0 gap-4">
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 pt-4 pb-1 space-y-5 scrollbar-thin chat-thread">
                    {selectedItem.replies?.map(rep => {
                      const isUserReply = rep.sender === 'user';
                      const contactName = clientMetadata[selectedItem.client]?.poc || selectedItem.client;
                      return (
                        <div
                          key={rep.id}
                          className={cn("flex flex-col", isUserReply ? "ml-auto items-end max-w-[86%]" : "mr-auto items-start max-w-[78%]")}
                        >
                          <div className={cn('chat-bubble', isUserReply ? 'chat-bubble-user' : 'chat-bubble-client')}>
                            {rep.text}
                          </div>
                          <span className={cn('chat-meta mt-2 px-1', isUserReply ? 'text-right' : 'text-left')}>
                            {isUserReply ? 'You' : contactName} ï¿½ {rep.time}
                          </span>
                        </div>
                      );
                    })}
                    {isClientTyping && (
                      <div className="flex items-center gap-2 mr-auto bg-slate-50 px-4 py-3 rounded-2xl rounded-tl-none max-w-[80%] text-gray-400 text-[10.5px] font-sans animate-pulse">
                        <span className="font-semibold text-gray-500">{clientMetadata[selectedItem.client]?.poc || selectedItem.client} is typing</span>
                        <div className="flex gap-1 items-center pt-0.5">
                          <div className="w-1 h-1 rounded-full bg-[#484782] animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1 h-1 rounded-full bg-[#484782] animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1 h-1 rounded-full bg-[#484782] animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSendReply(); }}
                    className="flex gap-2 pt-3 border-t border-gray-100 shrink-0"
                  >
                    <input
                      type="text"
                      value={replyInputText}
                      onChange={(e) => setReplyInputText(e.target.value)}
                      placeholder={`Reply to ${clientMetadata[selectedItem.client]?.poc || selectedItem.client}...`}
                      className="flex-1 bg-slate-50 rounded-xl px-4 py-2.5 text-xs text-gray-800 outline-none placeholder-gray-400 font-sans font-medium focus:bg-white focus:ring-2 focus:ring-[#7eb098]/20"
                    />
                    <button
                      type="submit"
                      className="bg-[#191c20] hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-sans font-bold shrink-0 cursor-pointer"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            ) : (
            <div className="mt-auto border-t border-gray-200 pt-5 bg-transparent shrink-0 relative z-10">
              {selectedItem.type === 'approval' && (
                <div className="bg-slate-50 border border-gray-100 p-5 rounded-3xl shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] space-y-4">
                  {(() => {
                    const checkedCount = selectedItem.approvalGates?.filter(g => g.checked).length || 0;
                    const totalCount = selectedItem.approvalGates?.length || 0;
                    const percent = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
                    const allDone = checkedCount === totalCount;
                    return (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-1.5 font-sans">
                            <span className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-widest">SIGN-OFF REGISTRY ({checkedCount}/{totalCount})</span>
                            <span className="text-xs font-bold text-[#7eb098]">{Math.round(percent)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#7eb098] to-emerald-500 rounded-full transition-all duration-350" style={{ width: `${percent}%` }} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          {selectedItem.approvalGates?.map(gate => (
                            <label 
                              key={gate.id}
                              className={cn(
                                "flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border cursor-pointer select-none transition-all duration-200",
                                gate.checked 
                                  ? "bg-emerald-50/20 border-emerald-100 text-emerald-800" 
                                  : "bg-white border-gray-100 text-gray-700 hover:border-gray-200"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={gate.checked}
                                  onChange={() => handleToggleGate(gate.id)}
                                  className="w-4 h-4 accent-[#7eb098] cursor-pointer"
                                />
                                <span className={cn("text-xs font-sans font-semibold transition-colors", gate.checked ? "text-emerald-900" : "text-gray-700")}>{gate.name}</span>
                              </div>
                              {gate.checked && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
                            </label>
                          ))}
                        </div>
                        <button
                          onClick={handleProcessGates}
                          className={cn(
                            "w-full py-3 text-white text-[10.5px] font-sans font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm active:scale-98 text-center",
                            allDone ? "bg-[#191c20] hover:bg-black" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          )}
                        >
                          {allDone ? "SIGN-OFF & RELEASE DELIVERABLES" : `PENDING REGISTRY CLEARANCE (${checkedCount}/${totalCount})`}
                        </button>
                      </>
                    );
                  })()}
                </div>
              )}

              {selectedItem.type === 'payment' && (
                <div className="bg-white rounded-2xl p-6 space-y-4 font-sans relative overflow-hidden">
                  <div className="absolute right-6 top-5 select-none pointer-events-none opacity-20 transform rotate-12">
                    <QrCode size={40} className="text-[#191c20]" />
                  </div>
                  <div>
                    <span className="text-[9px] font-sans font-extrabold text-[#9ba0a8] uppercase tracking-widest block">PAYMENT GATE RECORD</span>
                    <h4 className="font-fraunces text-base font-bold text-[#191c20] mt-0.5">Retainer Invoice Breakdown</h4>
                  </div>
                  
                  {/* Connector lines */}
                  <div className="space-y-2.5 bg-slate-50/50 p-4 border border-gray-100 rounded-2xl">
                    {selectedItem.invoiceItems?.map(inv => (
                      <div key={inv.id} className="flex justify-between items-center text-xs font-sans text-gray-600">
                        <span className="font-medium">{inv.desc} <span className="text-gray-400 font-normal">x{inv.qty}</span></span>
                        <span className="font-sans font-bold text-[#191c20]">${inv.price.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-3 text-[13px] font-fraunces font-bold text-[#191c20]">
                      <span>Grand Total Due</span>
                      <span className="font-sans font-bold text-lg">${(3825).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[8px] font-sans font-extrabold text-gray-400 uppercase tracking-wider py-1 border-y border-slate-50">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> STRIPE INTEGRATED</span>
                    <span className="flex items-center gap-1.5">
                      <span className="font-sans font-bold">VISA</span>
                      <span className="font-sans font-bold">MC</span>
                      <span className="font-sans font-bold">AMEX</span>
                    </span>
                  </div>

                  <button
                    onClick={handleVerifyStripe}
                    disabled={isVerifyingStripe}
                    className={cn(
                      "w-full py-3.5 text-white text-[10px] font-sans font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-98",
                      isVerifyingStripe ? "bg-[#ff5b4f]" : "bg-[#484782] hover:bg-[#343362]"
                    )}
                  >
                    {isVerifyingStripe ? (
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                    ) : <Lock size={12} className="opacity-95" />}
                    {isVerifyingStripe ? "VERIFYING OPERATIONS..." : "VERIFY PAYMENT INSTANTLY"}
                  </button>
                </div>
              )}

              {selectedItem.type === 'portal' && (
                <div className="bg-white rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-widest block">SECURITY GATEWAY</span>
                      <h4 className="font-fraunces text-sm font-bold text-gray-800 mt-0.5">Magic Link Visibility</h4>
                    </div>
                    
                    {/* Toggle Switch */}
                    <div className="flex items-center gap-3">
                      <span className={cn("text-[9px] font-sans font-bold uppercase px-2 py-0.5 rounded-full border shadow-3xs flex items-center gap-1.5", selectedItem.portalLocked ? "bg-red-50 border-red-100 text-[#ff5b4f]" : "bg-emerald-50 border-emerald-100 text-emerald-700")}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", selectedItem.portalLocked ? "bg-red-500 animate-pulse" : "bg-emerald-500 animate-pulse")} />
                        {selectedItem.portalLocked ? 'Locked' : 'Active'}
                      </span>
                      <button
                        onClick={handleTogglePortalLock}
                        className={cn(
                          "relative w-12 h-6.5 rounded-full transition-colors cursor-pointer outline-none shadow-inner border border-transparent",
                          selectedItem.portalLocked ? "bg-[#ff5b4f] border-red-400" : "bg-[#7eb098] border-emerald-450"
                        )}
                        title={selectedItem.portalLocked ? "Unlock Delivery Node" : "Lock Delivery Node"}
                      >
                        <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-250 flex items-center justify-center text-[#191c20]", selectedItem.portalLocked ? "translate-x-5.5" : "translate-x-0")}>
                          {selectedItem.portalLocked ? <Lock size={10} strokeWidth={2.5} /> : <Unlock size={10} strokeWidth={2.5} />}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 border border-gray-100 rounded-2xl p-4 flex flex-col gap-2.5 text-xs text-gray-600 font-sans">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Magic Link Token:</span>
                      <code className="bg-slate-50 border border-gray-100 px-2 py-0.5 rounded text-[10px] select-all font-mono font-bold text-[#484782]">/c/{selectedItem.refId.replace('/', '-').toLowerCase()}</code>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Gateway Cipher:</span>
                      <span className="text-[10px] text-gray-500">AES-256 GCM Secure Signature</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-sans text-[8.5px] text-gray-400 font-extrabold block uppercase tracking-widest">REAL-TIME ACCESS LOGS</span>
                    <div className="max-h-[110px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {selectedItem.portalViews?.map((pv) => {
                        const locations = ["Chicago, US", "San Francisco, US", "Tokyo, JP", "Berlin, DE", "London, UK", "New York, US"];
                        const loc = locations[Math.abs(pv.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % locations.length];
                        return (
                          <div key={pv.id} className="text-[10px] font-sans text-gray-600 bg-white p-2.5 border border-gray-100 rounded-xl flex justify-between items-center shadow-3xs hover:border-gray-200 transition-colors">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800">{pv.action}</span>
                              <span className="text-gray-405 text-[8.5px] font-medium">{pv.ip} ï¿½ {loc}</span>
                            </div>
                            <span className="text-gray-400 text-[8.5px] font-semibold bg-slate-50 px-1.5 py-0.5 rounded shrink-0">{pv.date}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Reroute / Open Deliveries button */}
              <div className="flex gap-2.5 mt-5">
                <button
                  onClick={() => {
                    setSelectedClientName(selectedItem.client);
                    if (selectedItem.projectId) {
                      setSelectedProjectId(selectedItem.projectId);
                    } else {
                      const matchingProj = projectsList.find(p => p.client.name === selectedItem.client);
                      if (matchingProj) {
                        setSelectedProjectId(matchingProj.id);
                      } else {
                        setSelectedProjectId('');
                      }
                    }
                    setActiveTab(resolveWorkspaceTab(selectedItem.targetTab));
                    setCurrentView('Projects');
                  }}
                  className="flex-1 py-3 bg-[#191c20] hover:bg-black text-white text-[10px] font-sans font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-98 text-center"
                >
                  OPEN DELIVERY ROOM &rarr;
                </button>
                <button
                  onClick={() => handleResolve(selectedItem.id)}
                  className="px-5 py-3 bg-[#f4f5f8] hover:bg-gray-100 text-gray-500 hover:text-gray-700 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-98 text-center"
                >
                  RESOLVE
                </button>
              </div>
            </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[320px] text-center py-16">
            <CheckCircle size={32} className="text-[#7eb098] opacity-70 mb-3" />
            <h4 className="font-fraunces text-xl font-bold text-[#191c20] tracking-tight">Delivery Queue clear</h4>
            <p className="text-[11px] text-gray-400 font-sans mt-1">Select an item from the list</p>
          </div>
        )
      }
    />

      {toastText && (
        <div className="fixed bottom-6 right-6 bg-[#191c20] text-white px-5 py-3 rounded-2xl shadow-2xl z-[9999] text-[11px] font-bold tracking-wide uppercase font-sans animate-in slide-in-from-bottom-2 duration-300 flex items-center gap-2.5 border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-[#7eb098] animate-pulse" />
          {toastText}
        </div>
      )}
    </>
  );
};

interface CalendarEvent {
  id: string;
  client: string;
  projectId?: string;
  title: string;
  time: string;
  dateString: string; // ISO date string e.g. "2026-06-02"
  kind: 'delivery_due' | 'review_meeting' | 'client_followup' | 'invoice_due' | 'payment_expected' | 'portal_expiry' | 'signature_due' | 'scheduled_send' | 'internal_task';
  urgency: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Overdue' | 'Completed';
  nextAction: string;
  targetTab: WorkspaceTargetTab;
  notes?: string;
}

interface CalendarViewProps {
  projectsList: Project[];
  clientMetadata: Record<string, { email: string; poc: string; avatar?: string }>;
  setSelectedClientName: (name: string) => void;
  setSelectedProjectId: (id: string) => void;
  setCurrentView: (view: string) => void;
  setActiveTab: React.Dispatch<React.SetStateAction<WorkspaceTab>>;
}

const formatTimelineHour = (h: number) => {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
};

const CALENDAR_HOUR_PX = 48;
const CALENDAR_TIME_GUTTER_PX = 56;
const CALENDAR_NOW_GUTTER_PX = 52;
const CALENDAR_GRID_LEFT_PX = CALENDAR_TIME_GUTTER_PX + CALENDAR_NOW_GUTTER_PX;

type CalendarMilestoneSurface = { bg: string; ring: string; dot: string };

const getEventKindSurface = (kind: CalendarEvent['kind']): CalendarMilestoneSurface => {
  switch (kind) {
    case 'delivery_due':
      return { bg: 'bg-[#ff5b4f]/[0.07]', ring: 'ring-[#ff5b4f]/25', dot: '#ff5b4f' };
    case 'payment_expected':
      return { bg: 'bg-[#484782]/[0.07]', ring: 'ring-[#484782]/25', dot: '#484782' };
    case 'review_meeting':
      return { bg: 'bg-indigo-500/[0.07]', ring: 'ring-indigo-400/25', dot: '#6366f1' };
    case 'client_followup':
      return { bg: 'bg-sky-500/[0.07]', ring: 'ring-sky-400/25', dot: '#0ea5e9' };
    case 'portal_expiry':
      return { bg: 'bg-purple-500/[0.07]', ring: 'ring-purple-400/25', dot: '#a855f7' };
    case 'signature_due':
      return { bg: 'bg-amber-500/[0.07]', ring: 'ring-amber-400/25', dot: '#f59e0b' };
    default:
      return { bg: 'bg-[#7eb098]/[0.08]', ring: 'ring-[#7eb098]/25', dot: '#7eb098' };
  }
};

/** Parse milestone time strings like "2:30 PM" or "11:59 PM" into minutes from midnight */
const parseEventTimeToMinutes = (timeStr: string): number => {
  const normalized = timeStr.trim().toUpperCase();
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!match) return 9 * 60;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3];
  if (hours > 12 && meridiem) hours = hours % 12;
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return Math.min(24 * 60 - 1, Math.max(0, hours * 60 + minutes));
};

type CalendarEventIconProps = React.ComponentProps<typeof Calendar> & {
  kind: CalendarEvent['kind'];
};

const CalendarEventIcon = ({ kind, ...props }: CalendarEventIconProps) => {
  switch (kind) {
    case 'delivery_due':
      return <Package {...props} />;
    case 'review_meeting':
      return <Users {...props} />;
    case 'client_followup':
      return <Phone {...props} />;
    case 'invoice_due':
    case 'payment_expected':
      return <CreditCard {...props} />;
    case 'portal_expiry':
      return <Link2 {...props} />;
    case 'signature_due':
      return <FileText {...props} />;
    case 'scheduled_send':
      return <Send {...props} />;
    case 'internal_task':
      return <Briefcase {...props} />;
    default:
      return <Calendar {...props} />;
  }
};

const getEventChecklistSteps = (ev: CalendarEvent): Array<{ label: string; detail: string }> => {
  const templates: Partial<Record<CalendarEvent['kind'], string[]>> = {
    delivery_due: ['Upload deliverables', 'Verify portal visibility', 'Notify client POC'],
    review_meeting: ['Prepare review materials', 'Capture feedback', 'Log decisions in notes'],
    payment_expected: ['Confirm invoice status', 'Send payment reminder', 'Mark received in activity'],
    client_followup: ['Review open threads', 'Confirm next milestone', 'Update internal briefing'],
    portal_expiry: ['Check magic link status', 'Extend or reissue link', 'Alert client if needed'],
  };
  const labels = templates[ev.kind] ?? ['Review item', 'Update client workspace', 'Mark complete when done'];
  const detailSeed = ev.nextAction.replace(/\.$/, '');
  return labels.map((label, i) => ({
    label,
    detail: i === 0 ? detailSeed : i === 1 ? `Client: ${ev.client}` : 'Track in Deliveries ? Activity',
  }));
};

type HelpFaqEntry = { id: string; question: string; answer: string; tags: string[] };

/** Offline help ï¿½ keyword scoring, no LLM API calls */
const PLATFORM_HELP_FAQ: HelpFaqEntry[] = [
  { id: 'portal-lock', question: 'How do I hide files from the client portal?', answer: 'Open Deliveries ? Files & portal. Use the eye icon on each file row to lock (hide) or unlock. Locked files stay in your vault but are not visible on the client magic link.', tags: ['lock', 'hide', 'portal', 'eye', 'file', 'client', 'visibility'] },
  { id: 'portal-link', question: 'Where is the client portal link?', answer: 'In Deliveries, select a project and open Files & portal. Copy the magic link or launch the preview. The path looks like /c/your-project-slug.', tags: ['link', 'magic', 'url', 'portal', 'share', 'copy', 'client'] },
  { id: 'upload', question: 'How do I upload deliverables?', answer: 'Go to Deliveries ? Files & portal for the active project. Use the upload dropzone or click to browse. Uploads are encrypted at rest (AES-256 in the UI).', tags: ['upload', 'file', 'deliver', 'drop', 'assets', 'delivery'] },
  { id: 'inbox', question: 'What is the Action Queue for?', answer: 'Action Queue collects pending actions: client messages, approvals, payments, and portal alerts. Select an item to reply, verify payment, or jump to the right Deliveries tab.', tags: ['action', 'queue', 'pending', 'message', 'approval', 'action'] },
  { id: 'calendar', question: 'How does the calendar work?', answer: 'Calendar shows delivery dates by list, day, week, month, or year. Use Add delivery date for handoffs, reviews, payment gates, portal expiries, and follow-ups. Hover a row for a preview; click to edit or open the client workspace.', tags: ['calendar', 'schedule', 'milestone', 'day', 'timeline', 'meeting'] },
  { id: 'billing-stripe', question: 'How do Stripe invoices work here?', answer: 'Deliveries ? Billing lists Stripe invoices and open balances. Create an invoice or copy a pay link for the client. Off-platform methods (Zelle, Venmo, bank) are for your own messages ï¿½ mark manual payments in Activity.', tags: ['stripe', 'invoice', 'payment', 'billing', 'pay', 'link'] },
  { id: 'billing-manual', question: 'Can clients pay outside Stripe?', answer: 'Yes. Billing tab includes off-platform instructions you can copy into an email. Those payments do not auto-sync ï¿½ log them in Activity when confirmed.', tags: ['zelle', 'venmo', 'bank', 'manual', 'off-platform', 'payment'] },
  { id: 'messages', question: 'How do I chat with a client?', answer: 'Open Deliveries ? Messages for direct chat with the client POC. Action Queue message threads also let you reply inline before opening the full workspace.', tags: ['chat', 'message', 'reply', 'poc', 'client', 'communication'] },
  { id: 'notes', question: 'Where do internal briefing notes go?', answer: 'Deliveries ? Notes holds private coordination notes (not visible to clients). Calendar milestone cards also have an internal briefing memo per event.', tags: ['notes', 'briefing', 'memo', 'internal', 'private'] },
  { id: 'project-create', question: 'How do I create a new project?', answer: 'Use + New project in the deliveries workspace header, or Quick Delivery in the sidebar for a fast draft. Assign a client, due date, and scope before publishing the portal.', tags: ['project', 'create', 'new', 'delivery', 'quick'] },
  { id: 'client-add', question: 'How do I add a client?', answer: 'In the Deliveries directory, use Add client (or Manage on an existing client to edit POC, email, priority, and sentiment).', tags: ['client', 'add', 'directory', 'poc', 'manage'] },
  { id: 'quick-delivery', question: 'What is Quick Delivery?', answer: 'Quick Delivery is the sidebar drawer for drafting a delivery link, files, and optional payment gate without leaving your current view.', tags: ['quick', 'delivery', 'drawer', 'sidebar', 'draft'] },
  { id: 'activity', question: 'What appears in Activity?', answer: 'Deliveries ? Activity shows portal views, uploads, and payment events for the client. Use it as the audit trail alongside the timeline in Calendar.', tags: ['activity', 'log', 'audit', 'portal', 'views'] },
  { id: 'overview', question: 'What is on the Overview tab?', answer: 'Overview summarizes files, messages, billing, and shortcuts into other tabs for the active project ï¿½ a dashboard for that delivery folder.', tags: ['overview', 'summary', 'dashboard', 'shortcuts'] },
  { id: 'resolve-inbox', question: 'How do I clear an Action Queue item?', answer: 'Complete the required action (reply, approve gates, verify payment, etc.), then click Resolve. Use Go to Deliveries to finish work in the full workspace.', tags: ['resolve', 'clear', 'done', 'action', 'queue', 'complete'] },
  { id: 'approval', question: 'How do client approvals work?', answer: 'Approval Action Queue items include a sign-off registry. Check each gate, then release deliverables when all gates are complete.', tags: ['approval', 'sign', 'gate', 'registry', 'release'] },
  { id: 'storage', question: 'Where are files stored?', answer: 'The app is wired for delivery storage (S3 vault in Settings). Uploads in Deliveries attach to the project folder for that client.', tags: ['storage', 's3', 'vault', 'files', 'hosting'] },
  { id: 'pricing', question: 'Does this app call AI APIs?', answer: 'Help Chat on this page is fully offline: curated answers matched by keywords. No per-message AI billing ï¿½ expand the FAQ list as you add features.', tags: ['ai', 'cost', 'help', 'api', 'offline', 'faq'] },
];

const findHelpFaqAnswer = (query: string): HelpFaqEntry | null => {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const tokens = q.split(/\W+/).filter((t) => t.length > 1);
  let best: { entry: HelpFaqEntry; score: number } | null = null;
  for (const entry of PLATFORM_HELP_FAQ) {
    let score = 0;
    const hay = `${entry.question} ${entry.answer} ${entry.tags.join(' ')}`.toLowerCase();
    for (const token of tokens) {
      if (entry.tags.includes(token)) score += 4;
      if (entry.question.toLowerCase().includes(token)) score += 3;
      if (hay.includes(token)) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { entry, score };
  }
  return best?.entry ?? null;
};

const CalendarEventInnards = ({
  ev,
  getKindLabel,
  getKindColors,
  compact = false,
}: {
  ev: CalendarEvent;
  getKindLabel: (kind: string) => string;
  getKindColors: (kind: string) => string;
  compact?: boolean;
}) => {
  const steps = getEventChecklistSteps(ev);
  const surface = getEventKindSurface(ev.kind);
  if (compact) {
    return (
      <div className="text-left font-sans">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: surface.dot }} />
          <span className={cn('px-2 py-0.5 rounded-full text-[7px] font-bold uppercase', getKindColors(ev.kind))}>
            {getKindLabel(ev.kind)}
          </span>
        </div>
        <p className={cn('font-fraunces text-[13px] font-bold text-[#191c20] leading-snug', ev.status === 'Completed' && 'line-through text-gray-400')}>
          {ev.title}
        </p>
        <p className="text-[10px] text-gray-500 mt-1 font-bold">{ev.time} ï¿½ {ev.client}</p>
        <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">{ev.nextAction}</p>
      </div>
    );
  }
  return (
    <>
      <div className="flex items-start gap-2.5">
        <div className={cn('w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center shrink-0 ring-1', surface.bg, surface.ring)}>
          <CalendarEventIcon kind={ev.kind} size={15} className="text-[#484782]" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h5 className={cn('font-fraunces text-[14px] font-bold text-[#191c20] leading-snug pr-1', ev.status === 'Completed' && 'line-through text-gray-400')}>
              {ev.title}
            </h5>
            <span className={cn('px-2 py-0.5 rounded-full text-[7.5px] font-bold uppercase shrink-0', getKindColors(ev.kind))}>
              {getKindLabel(ev.kind)}
            </span>
          </div>
          <p className="text-[10px] font-sans font-bold text-gray-400 mt-1">{ev.time} ï¿½ {ev.client}</p>
        </div>
      </div>
      <p className="text-[11px] font-sans font-bold text-[#191c20] mt-3 leading-snug">{ev.nextAction}</p>
      <ul className="mt-2.5 space-y-1.5 border-t border-gray-50 pt-2.5">
        {steps.map((step) => (
          <li key={step.label} className="text-[10px] text-gray-500 leading-relaxed">
            <span className="font-bold text-gray-700">{step.label}</span>
            <span className="text-gray-400"> ï¿½ </span>
            {step.detail}
          </li>
        ))}
      </ul>
    </>
  );
};

const HelpChatPanel = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'help'; text: string }>>([
    {
      id: 'welcome',
      role: 'help',
      text: 'Help Chat is offline ï¿½ no AI fees. Pick a topic below or type a question about Sendational (portals, action queue, billing, calendar, files).',
    },
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const ask = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: trimmed }]);
    setInput('');
    const match = findHelpFaqAnswer(trimmed);
    const reply = match
      ? `${match.answer}\n\nMatched: ï¿½${match.question}ï¿½`
      : 'I could not match that exactly. Try words like portal, lock, invoice, action queue, upload, calendar, or notes ï¿½ or tap a suggested question below.';
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { id: `h-${Date.now()}`, role: 'help', text: reply }]);
    }, 280);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-20 right-6 z-[9000] w-[min(380px,calc(100vw-2rem))] flex flex-col rounded-[1.75rem] border border-gray-200/90 bg-white shadow-[0_24px_64px_-12px_rgba(25,28,32,0.28)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-[#fafbfc]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#7eb098]/15 flex items-center justify-center">
            <MessageCircle size={15} className="text-[#4a9070]" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-[#191c20]">Help Chat</p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Offline FAQ ï¿½ no API cost</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer text-gray-500">
          <X size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-gray-50 bg-white max-h-[88px] overflow-y-auto scrollbar-thin">
        {PLATFORM_HELP_FAQ.slice(0, 8).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => ask(f.question)}
            className="text-[8px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border border-gray-100 bg-[#f4f5f8] text-gray-600 hover:border-[#7eb098]/30 hover:text-[#191c20] cursor-pointer"
          >
            {f.tags[0]}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-[200px] max-h-[280px] overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
        {messages.map((m) => (
          <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <p className={cn(
              'text-[11px] leading-relaxed max-w-[92%] rounded-2xl px-3.5 py-2.5 whitespace-pre-wrap',
              m.role === 'user' ? 'bg-[#191c20] text-white' : 'bg-[#f4f5f8] text-gray-700 border border-gray-100'
            )}>
              {m.text}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); ask(input); }}
        className="flex gap-2 p-3 border-t border-gray-100 bg-white shrink-0"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about portals, billing, action queueï¿½"
          className="flex-1 text-[11px] rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-[#7eb098]/40 font-medium"
        />
        <button type="submit" className="w-10 h-10 rounded-xl bg-[#191c20] text-white flex items-center justify-center cursor-pointer shrink-0">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'ev-1',
    client: 'Acme Corp',
    projectId: 'PRJ-001c89f2',
    title: 'Brand identity files dispatch due',
    time: '12:00 PM',
    dateString: '2026-06-02',
    kind: 'delivery_due',
    urgency: 'High',
    status: 'Pending',
    nextAction: 'Upload typography_specs.pdf',
    targetTab: 'files'
  },
  {
    id: 'ev-2',
    client: 'Acme Corp',
    projectId: 'PRJ-001c89f2',
    title: 'Dave Connor Review Meeting',
    time: '2:30 PM',
    dateString: '2026-06-02',
    kind: 'review_meeting',
    urgency: 'Medium',
    status: 'Pending',
    nextAction: 'Awaiting video graphics review feedback',
    targetTab: 'messages'
  },
  {
    id: 'ev-3',
    client: 'Startup Inc',
    title: 'Michael Chen Retainer check-in',
    time: '11:00 AM',
    dateString: '2026-06-08',
    kind: 'client_followup',
    urgency: 'Medium',
    status: 'Pending',
    nextAction: 'Discuss contract terms and unlock draft xlsx',
    targetTab: 'messages'
  },
  {
    id: 'ev-4',
    client: 'GlobalTech',
    projectId: 'PRJ-002a7b8e',
    title: 'Compliance UX Report Review',
    time: '5:00 PM',
    dateString: '2026-06-12',
    kind: 'signature_due',
    urgency: 'High',
    status: 'Pending',
    nextAction: 'Collect sign-off on compliance deck',
    targetTab: 'portal'
  },
  {
    id: 'ev-5',
    client: 'GlobalTech',
    projectId: 'PRJ-002a7b8f',
    title: 'Phase 2 Retainer Invoice Payment',
    time: '12:00 AM',
    dateString: '2026-06-12',
    kind: 'payment_expected',
    urgency: 'High',
    status: 'Pending',
    nextAction: 'Verify Stripe gateway deposit',
    targetTab: 'billing'
  },
  {
    id: 'ev-6',
    client: 'Acme Corp',
    projectId: 'PRJ-001c89f3',
    title: 'Q1 Web Launch client handover',
    time: '9:00 AM',
    dateString: '2026-06-15',
    kind: 'scheduled_send',
    urgency: 'High',
    status: 'Pending',
    nextAction: 'Enable delivery portals link',
    targetTab: 'portal'
  },
  {
    id: 'ev-7',
    client: 'Startup Inc',
    title: 'Magic Link Node Expiry',
    time: '11:59 PM',
    dateString: '2026-06-22',
    kind: 'portal_expiry',
    urgency: 'Medium',
    status: 'Pending',
    nextAction: 'Review client access configuration',
    targetTab: 'activity'
  },
  {
    id: 'ev-8',
    client: 'Broken Co',
    title: 'Restore portal link mapping',
    time: '3:00 PM',
    dateString: '2026-06-28',
    kind: 'internal_task',
    urgency: 'Low',
    status: 'Pending',
    nextAction: 'Check client access tokens validity',
    targetTab: 'client'
  },
  {
    id: 'ev-9',
    client: 'Startup Inc',
    title: 'Independence Day Web Asset Check',
    time: '1:00 PM',
    dateString: '2026-07-04',
    kind: 'internal_task',
    urgency: 'Low',
    status: 'Pending',
    nextAction: 'Verify file lock configurations',
    targetTab: 'files'
  },
  {
    id: 'ev-10',
    client: 'Acme Corp',
    projectId: 'PRJ-001c89f2',
    title: 'Q2 Kickoff Alignment',
    time: '10:00 AM',
    dateString: '2026-05-25',
    kind: 'review_meeting',
    urgency: 'High',
    status: 'Completed',
    nextAction: 'None - Completed',
    targetTab: 'overview'
  }
];

const parseDateString = (dateStr: string): Date => {
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(2026, 5, 2);
};

const toDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const CalendarView = ({
  projectsList,
  clientMetadata,
  setSelectedClientName,
  setSelectedProjectId,
  setCurrentView,
  setActiveTab,
}: CalendarViewProps) => {
  const todayDateString = toDateString(new Date());
  const initialCalendarDate = parseDateString(todayDateString);
  const [selectedDayString, setSelectedDayString] = useState<string>(todayDateString);
  const [calendarMode, setCalendarMode] = useState<'list' | 'day' | 'week' | 'month' | 'year'>('list');
  const [calendarMoreModesOpen, setCalendarMoreModesOpen] = useState(false);
  const [monthIndex, setMonthIndex] = useState<number>(() => initialCalendarDate.getMonth());
  const [yearVal, setYearVal] = useState<number>(() => initialCalendarDate.getFullYear());
  const [weekScrollOffset, setWeekScrollOffset] = useState(0);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [toastText, setToastText] = useState<string | null>(null);

  const [eventNotesState, setEventNotesState] = useState<Record<string, string>>({});
  const [rescheduleDateMap, setRescheduleDateMap] = useState<Record<string, string>>({});
  const [rescheduleTimeMap, setRescheduleTimeMap] = useState<Record<string, string>>({});
  const [pinsCollapsed, setPinsCollapsed] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [calendarClientFilter, setCalendarClientFilter] = useState<string>('all');
  const [calendarClientPickerOpen, setCalendarClientPickerOpen] = useState<'rail' | 'context' | null>(null);
  const [calendarNow, setCalendarNow] = useState(() => new Date());
  const [hoverPreview, setHoverPreview] = useState<{ ev: CalendarEvent; top: number; left: number } | null>(null);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [addScheduleOpen, setAddScheduleOpen] = useState(false);
  const [newScheduleDraft, setNewScheduleDraft] = useState({
    title: '',
    client: '',
    dateString: todayDateString,
    time: '10:00 AM',
    kind: 'internal_task' as CalendarEvent['kind'],
    nextAction: 'Review and confirm',
  });
  const hoverHideTimer = useRef<number | null>(null);
  const calendarMoreModesRef = useRef<HTMLDivElement | null>(null);
  const calendarClientRailRef = useRef<HTMLDivElement | null>(null);
  const calendarClientContextRef = useRef<HTMLDivElement | null>(null);

  const CALENDAR_SCHEDULE_LABEL = 'delivery item';
  const CALENDAR_SCHEDULE_LABEL_PLURAL = 'delivery items';

  useEffect(() => {
    const timer = window.setInterval(() => setCalendarNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => {
    if (hoverHideTimer.current) window.clearTimeout(hoverHideTimer.current);
  }, []);

  useEffect(() => {
    if (!calendarMoreModesOpen && !calendarClientPickerOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (calendarMoreModesOpen && !calendarMoreModesRef.current?.contains(target)) {
        setCalendarMoreModesOpen(false);
      }

      const activeClientPickerRef = calendarClientPickerOpen === 'rail'
        ? calendarClientRailRef
        : calendarClientPickerOpen === 'context'
          ? calendarClientContextRef
          : null;

      if (activeClientPickerRef && !activeClientPickerRef.current?.contains(target)) {
        setCalendarClientPickerOpen(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [calendarMoreModesOpen, calendarClientPickerOpen]);

  const calendarClientOptions = Array.from(
    new Set([
      ...calendarEvents.map((ev) => ev.client),
      ...projectsList.map((p) => p.client.name),
    ])
  ).sort();

  const eventsForCalendar = calendarClientFilter === 'all'
    ? calendarEvents
    : calendarEvents.filter((ev) => ev.client === calendarClientFilter);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const syncViewToDate = (dateStr: string) => {
    const d = parseDateString(dateStr);
    setMonthIndex(d.getMonth());
    setYearVal(d.getFullYear());
  };

  const selectDay = (dateStr: string) => {
    setSelectedDayString(dateStr);
    syncViewToDate(dateStr);
  };

  const goToDayView = (dateStr: string, view: 'list' | 'day' = 'list') => {
    selectDay(dateStr);
    setCalendarMode(view);
  };

  const showMilestonePreview = (ev: CalendarEvent, rect: DOMRect) => {
    if (hoverHideTimer.current) window.clearTimeout(hoverHideTimer.current);
    const left = Math.min(Math.max(16, rect.left), window.innerWidth - 296);
    const top = Math.min(rect.bottom + 8, window.innerHeight - 200);
    setHoverPreview({ ev, top, left });
  };

  const scheduleHideMilestonePreview = () => {
    if (hoverHideTimer.current) window.clearTimeout(hoverHideTimer.current);
    hoverHideTimer.current = window.setTimeout(() => setHoverPreview(null), 120);
  };

  const openMilestoneEditor = (evId: string) => {
    setHoverPreview(null);
    setEditingMilestoneId(evId);
  };

  const openAddSchedule = () => {
    const defaultClient =
      calendarClientFilter !== 'all'
        ? calendarClientFilter
        : calendarClientOptions[0] ?? projectsList[0]?.client.name ?? '';
    setNewScheduleDraft({
      title: '',
      client: defaultClient,
      dateString: selectedDayString,
      time: '10:00 AM',
      kind: 'internal_task',
      nextAction: 'Review and confirm',
    });
    setAddScheduleOpen(true);
  };

  const handleAddScheduleEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newScheduleDraft.title.trim();
    const client = newScheduleDraft.client.trim();
    if (!title || !client) {
      setToastText('Add a title and client for this delivery item.');
      setTimeout(() => setToastText(null), 3000);
      return;
    }
    const newEv: CalendarEvent = {
      id: `ev-${Date.now()}`,
      client,
      title,
      time: newScheduleDraft.time.trim() || '10:00 AM',
      dateString: newScheduleDraft.dateString,
      kind: newScheduleDraft.kind,
      urgency: 'Medium',
      status: 'Pending',
      nextAction: newScheduleDraft.nextAction.trim() || 'Follow up in workspace',
      targetTab: 'overview',
    };
    setCalendarEvents((prev) => [...prev, newEv]);
    selectDay(newScheduleDraft.dateString);
    setCalendarMode('list');
    setAddScheduleOpen(false);
    setToastText('Added to your delivery schedule.');
    setTimeout(() => setToastText(null), 3000);
  };

  const calendarAddScheduleButton = (
    <button
      type="button"
      onClick={openAddSchedule}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#191c20] hover:bg-black text-white text-[9.5px] font-bold uppercase tracking-wider cursor-pointer shadow-sm shrink-0"
    >
      <Plus size={12} strokeWidth={2.5} />
      Add delivery date
    </button>
  );

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getStartOffset = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getDateString = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const getEventsForDate = (dateStr: string) => {
    return eventsForCalendar.filter(ev => ev.dateString === dateStr);
  };

  const getEventsInMonth = (year: number, month: number) =>
    eventsForCalendar.filter((ev) => {
      const d = parseDateString(ev.dateString);
      return d.getFullYear() === year && d.getMonth() === month;
    });

  const selectedDayEvents = getEventsForDate(selectedDayString);
  const monthEventCount = getEventsInMonth(yearVal, monthIndex).length;

  const handlePrevMonth = () => {
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYearVal(prev => prev - 1);
    } else {
      setMonthIndex(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYearVal(prev => prev + 1);
    } else {
      setMonthIndex(prev => prev + 1);
    }
  };

  const handleToday = () => {
    selectDay(todayDateString);
    setWeekScrollOffset(0);
  };

  const getWeekStart = (anchorDateStr: string, weekDelta = 0) => {
    const date = parseDateString(anchorDateStr);
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - date.getDay() + weekDelta * 7);
    return sunday;
  };

  const getWeekDays = (weekStart: Date) =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return toDateString(d);
    });

  const formatWeekRange = (weekStart: Date) => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${weekStart.toLocaleDateString('en-US', opts)} ï¿½ ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
  };

  const handleSaveNotes = (eventId: string, notesText: string) => {
    setCalendarEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        return { ...ev, notes: notesText };
      }
      return ev;
    }));
    setToastText('Briefing notes saved.');
    setTimeout(() => setToastText(null), 3000);
  };

  const handleReschedule = (eventId: string) => {
    const newDate = rescheduleDateMap[eventId];
    const newTime = rescheduleTimeMap[eventId];
    if (!newDate || !newTime) {
      setToastText("Please fill out both rescheduled fields.");
      setTimeout(() => setToastText(null), 3000);
      return;
    }
    setCalendarEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        return { ...ev, dateString: newDate, time: newTime };
      }
      return ev;
    }));
    selectDay(newDate);
      setToastText('Delivery schedule updated.');
    setTimeout(() => setToastText(null), 3000);
  };

  const handleToggleStatus = (eventId: string) => {
    setCalendarEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        const nextStatus = ev.status === 'Completed' ? 'Pending' : 'Completed';
        return { ...ev, status: nextStatus };
      }
      return ev;
    }));
  };

  const editingMilestone = editingMilestoneId
    ? calendarEvents.find((e) => e.id === editingMilestoneId) ?? null
    : null;

  const getEventKindLabel = (kind: string) => {
    return kind.replace(/_/g, ' ');
  };

  const getEventKindColors = (kind: string) => {
    switch (kind) {
      case 'delivery_due': return 'bg-amber-50 text-amber-700 border-amber-100/50 text-[8.5px] font-sans font-bold uppercase';
      case 'review_meeting': return 'bg-indigo-50 text-indigo-700 border-indigo-100/50 text-[8.5px] font-sans font-bold uppercase';
      case 'client_followup': return 'bg-sky-50 text-sky-700 border-sky-100/50 text-[8.5px] font-sans font-bold uppercase';
      case 'invoice_due': return 'bg-rose-50 text-rose-700 border-rose-100/50 text-[8.5px] font-sans font-bold uppercase';
      case 'payment_expected': return 'bg-emerald-50 text-emerald-700 border-[#7eb098]/20 text-[8.5px] font-sans font-bold uppercase';
      case 'portal_expiry': return 'bg-purple-50 text-purple-700 border-purple-100/50 text-[8.5px] font-sans font-bold uppercase';
      default: return 'bg-slate-50 text-slate-600 border-slate-100/50 text-[8.5px] font-sans font-bold uppercase';
    }
  };

  const getEventDotColor = (kind: string) => {
    switch (kind) {
      case 'delivery_due': return '#ff5b4f'; // orange
      case 'payment_expected': return '#484782'; // purple
      default: return '#7eb098'; // green
    }
  };

  const renderMilestoneRow = (ev: CalendarEvent, showDate = false) => {
    const surface = getEventKindSurface(ev.kind);
    return (
      <button
        key={ev.id}
        type="button"
        onClick={() => openMilestoneEditor(ev.id)}
        onMouseEnter={(e) => showMilestonePreview(ev, e.currentTarget.getBoundingClientRect())}
        onMouseLeave={scheduleHideMilestonePreview}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-gray-100 text-left cursor-pointer transition-all',
          'hover:shadow-[0_8px_24px_-10px_rgba(25,28,32,0.14)] hover:border-gray-200 ring-1 ring-transparent hover:ring-gray-100/80',
          surface.bg,
          ev.status === 'Completed' && 'opacity-60'
        )}
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-sm"
          style={{ backgroundColor: surface.dot }}
        />
        <span className={cn('w-9 h-9 rounded-xl border border-white/80 bg-white/90 flex items-center justify-center shrink-0 shadow-sm ring-1', surface.ring)}>
          <CalendarEventIcon kind={ev.kind} size={14} className="text-[#484782]" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block font-fraunces text-[13px] font-bold text-[#191c20] truncate', ev.status === 'Completed' && 'line-through text-gray-400')}>
            {ev.title}
          </span>
          <span className="block text-[10px] font-sans font-bold text-gray-500 mt-0.5 truncate">
            {showDate ? `${ev.dateString} ï¿½ ` : ''}{ev.time} ï¿½ {ev.client}
          </span>
        </span>
        <span className={cn('hidden sm:inline px-2 py-0.5 rounded-full text-[7px] font-bold uppercase shrink-0', getEventKindColors(ev.kind))}>
          {getEventKindLabel(ev.kind)}
        </span>
        <span className="text-[10px] font-bold text-gray-400 tabular-nums shrink-0">{ev.time}</span>
        <ChevronRight size={14} className="text-gray-300 shrink-0" />
      </button>
    );
  };

  const totalDays = getDaysInMonth(yearVal, monthIndex);
  const startOffset = getStartOffset(yearVal, monthIndex);
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const emptyCells = Array.from({ length: startOffset }, () => null);
  const calendarCells = [...emptyCells, ...daysArray];

  const handleRescheduleLocal = (evId: string) => {
    handleReschedule(evId);
    setToastText('Delivery schedule updated.');
    setTimeout(() => setToastText(null), 3000);
  };

  const sortedDayEvents = [...selectedDayEvents].sort(
    (a, b) => parseEventTimeToMinutes(a.time) - parseEventTimeToMinutes(b.time)
  );
  const upcomingPinned = [...eventsForCalendar]
    .filter((ev) => ev.status !== 'Completed')
    .sort((a, b) => a.dateString.localeCompare(b.dateString) || parseEventHour(a.time) - parseEventHour(b.time))
    .slice(0, 4);
  const timelineHours = Array.from({ length: 24 }, (_, i) => i);
  const dSelected = parseDateString(selectedDayString);
  const dateHeading = dSelected.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const completedToday = selectedDayEvents.filter((e) => e.status === 'Completed').length;
  const nextEvent = sortedDayEvents.find((e) => e.status !== 'Completed');
  const selectedCalendarClientLabel = calendarClientFilter === 'all' ? 'All clients' : calendarClientFilter;

  const renderCalendarClientPicker = (pickerId: 'rail' | 'context', compact = false) => {
    const isOpen = calendarClientPickerOpen === pickerId;
    const options = ['all', ...calendarClientOptions];

    return (
      <div ref={pickerId === 'rail' ? calendarClientRailRef : calendarClientContextRef} className="relative">
        <button
          type="button"
          onClick={() => setCalendarClientPickerOpen(isOpen ? null : pickerId)}
          className={cn(
            'w-full flex items-center justify-between gap-2 rounded-2xl border border-gray-200/80 bg-white text-left shadow-[0_8px_22px_-18px_rgba(25,28,32,0.45)] hover:border-[#7eb098]/45 hover:bg-slate-50/50 transition-all cursor-pointer',
            compact ? 'px-3 py-2.5' : 'px-3.5 py-3'
          )}
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className={cn('shrink-0 rounded-full bg-[#f4f5f8] border border-white shadow-sm flex items-center justify-center overflow-hidden', compact ? 'w-6 h-6' : 'w-7 h-7')}>
              {calendarClientFilter !== 'all' && clientMetadata[calendarClientFilter]?.avatar ? (
                <img src={clientMetadata[calendarClientFilter].avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[8px] font-sans font-extrabold uppercase text-[#484782]">
                  {calendarClientFilter === 'all' ? 'All' : selectedCalendarClientLabel.slice(0, 2)}
                </span>
              )}
            </span>
            <span className="min-w-0">
              <span className={cn('block truncate font-sans font-extrabold text-[#191c20]', compact ? 'text-[10.5px]' : 'text-[11px]')}>
                {selectedCalendarClientLabel}
              </span>
              <span className="block text-[8.5px] font-sans font-bold uppercase tracking-widest text-gray-400">
                {calendarClientFilter === 'all' ? `${calendarEvents.length} events` : `${eventsForCalendar.length} linked events`}
              </span>
            </span>
          </span>
          <ChevronDown size={14} className={cn('shrink-0 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
        </button>

        {isOpen && (
          <div className="dropdown-menu-surface absolute left-0 right-0 top-[calc(100%+8px)] z-[80] rounded-[1.5rem] border border-slate-100 bg-white/95 backdrop-blur-md p-1.5 shadow-[0_20px_48px_-16px_rgba(25,28,32,0.18)] ring-1 ring-black/[0.03]">
            <div className="max-h-[260px] overflow-y-auto overflow-x-hidden scrollbar-thin space-y-1">
              {options.map((name) => {
                const isAll = name === 'all';
                const isSelected = calendarClientFilter === name;
                const meta = isAll ? null : clientMetadata[name];
                const count = isAll ? calendarEvents.length : calendarEvents.filter((ev) => ev.client === name).length;
                const contact = meta?.poc || 'Primary POC';
                const defaultDetail = isAll
                  ? `${count} delivery events`
                  : `${contact} - ${count} ${count === 1 ? 'event' : 'events'}`;
                const hoverDetail = isAll
                  ? `${calendarClientOptions.length} clients - ${count} delivery events total`
                  : `${contact} - ${count} delivery events - ${meta?.email || 'No email saved'}`;

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setCalendarClientFilter(name);
                      setCalendarClientPickerOpen(null);
                    }}
                    className={cn(
                      'group w-full min-w-0 flex items-center rounded-xl px-3 py-2 text-left transition-all duration-200 cursor-pointer border border-transparent overflow-hidden',
                      isSelected 
                        ? 'bg-[#7eb098]/8 text-[#191c20] border-[#7eb098]/15 shadow-2xs font-semibold' 
                        : 'hover:bg-slate-50 text-gray-700 hover:scale-[1.01] active:scale-100'
                    )}
                  >
                    <span className="mr-3 w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-[#f4f5f8] to-[#eef0f4] border border-white shadow-sm flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:w-0 group-hover:mr-0 group-hover:opacity-0">
                      {!isAll && meta?.avatar ? (
                        <img src={meta.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] font-sans font-extrabold uppercase text-[#484782]">
                          {isAll ? 'All' : name.slice(0, 2)}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 overflow-hidden">
                      <span className="block truncate text-[11px] font-sans font-extrabold text-gray-800 leading-snug">{isAll ? 'All Clients' : name}</span>
                      <span className="relative block h-[10px] mt-0.5 overflow-hidden">
                        <span className="absolute inset-0 block truncate text-[8px] font-sans font-bold uppercase tracking-widest text-gray-400 transition-opacity duration-150 group-hover:opacity-0">
                          {defaultDetail}
                        </span>
                        <span className="absolute inset-0 block truncate text-[8px] font-sans font-bold uppercase tracking-widest text-[#5f6872] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          {hoverDetail}
                        </span>
                      </span>
                    </span>
                    {isSelected ? (
                      <CheckCircle size={14} className="text-[#7eb098] shrink-0 animate-in fade-in zoom-in-50 duration-200" />
                    ) : (
                      <span className="w-3.5 h-3.5 border border-gray-200 rounded-full shrink-0 group-hover:border-gray-300 transition-colors" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    <CalendarHubShell
      leftRail={
        <>
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={handlePrevMonth} className="w-7 h-7 rounded-lg bg-[#f4f5f8] flex items-center justify-center cursor-pointer"><ChevronLeft size={14} /></button>
            <span className="font-fraunces text-sm font-semibold text-[#191c20]">{monthNames[monthIndex]} {yearVal}</span>
            <button type="button" onClick={handleNextMonth} className="w-7 h-7 rounded-lg bg-[#f4f5f8] flex items-center justify-center cursor-pointer"><ChevronRight size={14} /></button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-[8px] font-bold text-gray-400 mb-1">
            {weekdays.map((wd) => <div key={wd}>{wd[0]}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-4">
            {calendarCells.map((dayNum, idx) => {
              if (dayNum === null) return <div key={`e-${idx}`} />;
              const ds = getDateString(yearVal, monthIndex, dayNum);
              const dayEvs = getEventsForDate(ds);
              const hasE = dayEvs.length > 0;
              const sel = selectedDayString === ds;
              const isToday = ds === todayDateString;
              return (
                <button 
                  key={dayNum} 
                  type="button" 
                  onClick={() => selectDay(ds)} 
                  className={cn(
                    'aspect-square rounded-lg text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105', 
                    sel 
                      ? 'bg-[#191c20] text-white shadow-sm' 
                      : isToday
                        ? 'bg-[#7eb098]/25 text-[#191c20] ring-2 ring-[#7eb098]/50'
                      : hasE 
                        ? 'bg-[#7eb098]/15 text-[#4a9070] hover:bg-[#7eb098]/25' 
                        : 'hover:bg-gray-50 text-gray-600'
                  )}
                >
                  <span>{dayNum}</span>
                  {hasE && (
                    <div className="flex gap-0.5 mt-0.5 justify-center w-full px-0.5">
                      {dayEvs.slice(0, 3).map((ev) => (
                        <span 
                          key={ev.id} 
                          className="w-1 h-1 rounded-full shrink-0" 
                          style={{ backgroundColor: getEventDotColor(ev.kind) }} 
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => setPinsCollapsed(!pinsCollapsed)} className="flex items-center justify-between w-full text-left mb-2 cursor-pointer">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Pinned deliveries</span>
            <ChevronRight size={12} className={cn('text-gray-400 transition-transform', !pinsCollapsed && 'rotate-90')} />
          </button>
          {!pinsCollapsed && (
            <div className="space-y-2 mb-4">
              {upcomingPinned.map((ev) => (
                <button key={ev.id} type="button" onClick={() => selectDay(ev.dateString)} className="w-full text-left p-2.5 rounded-xl border border-gray-100 bg-[#f4f5f8]/50 hover:bg-[#f4f5f8] cursor-pointer">
                  <p className="text-[10px] font-fraunces font-semibold text-[#191c20] truncate">{ev.title}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{ev.dateString} ï¿½ {ev.time}</p>
                </button>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Client</p>
            {renderCalendarClientPicker('rail', true)}
          </div>
          <button type="button" onClick={() => setFiltersCollapsed(!filtersCollapsed)} className="flex items-center justify-between w-full text-left cursor-pointer mt-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Delivery types</span>
            <ChevronRight size={12} className={cn('text-gray-400 transition-transform', !filtersCollapsed && 'rotate-90')} />
          </button>
          {!filtersCollapsed && (
            <div className="mt-2 space-y-1.5">
              {['delivery_due', 'review_meeting', 'payment_expected'].map((kind) => (
                <label key={kind} className="flex items-center gap-2 text-[10px] font-sans text-gray-600 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#7eb098] w-3.5 h-3.5" />
                  <span className="capitalize">{kind.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          )}
        </>
      }
      timeline={
        <>
          <div className="sticky top-0 z-[70] flex flex-wrap items-end justify-between gap-3 mb-6 shrink-0 bg-white pb-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Delivery schedule</p>
              <h2 className="font-fraunces text-[33px] font-bold text-[#191c20] tracking-tight mt-1">{dateHeading}</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {calendarAddScheduleButton}
              <button type="button" onClick={handleToday} className="text-[10px] font-bold uppercase text-[#7eb098] px-3 py-1.5 rounded-lg bg-[#7eb098]/10 cursor-pointer">Today</button>
              <div className="bg-[#eef1f4] p-1 rounded-xl flex items-center gap-0.5">
                {(['list', 'day', 'month'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setCalendarMode(mode);
                      setCalendarMoreModesOpen(false);
                    }}
                    className={cn('px-3 py-1.5 text-[9.5px] font-bold uppercase rounded-lg cursor-pointer', calendarMode === mode ? 'bg-white shadow-sm text-[#191c20]' : 'text-gray-400 hover:text-gray-600')}
                  >
                    {mode}
                  </button>
                ))}
                <div ref={calendarMoreModesRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setCalendarMoreModesOpen((open) => !open)}
                    className={cn(
                      'px-2.5 py-1.5 text-[9.5px] font-bold uppercase rounded-lg cursor-pointer flex items-center gap-1',
                      calendarMode === 'week' || calendarMode === 'year' ? 'bg-white shadow-sm text-[#191c20]' : 'text-gray-400 hover:text-gray-600'
                    )}
                    aria-expanded={calendarMoreModesOpen}
                  >
                    {calendarMode === 'week' || calendarMode === 'year' ? calendarMode : 'More'}
                    <ChevronDown size={11} className={cn('transition-transform', calendarMoreModesOpen && 'rotate-180')} />
                  </button>
                  {calendarMoreModesOpen && (
                    <div className="dropdown-menu-surface absolute right-0 top-[calc(100%+6px)] z-[90] w-28 rounded-xl bg-white border border-gray-100 shadow-[0_14px_32px_-18px_rgba(25,28,32,0.4)] p-1">
                      {(['week', 'year'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setCalendarMode(mode);
                            if (mode === 'week') setWeekScrollOffset(0);
                            setCalendarMoreModesOpen(false);
                          }}
                          className={cn('w-full text-left px-2.5 py-2 rounded-lg text-[9.5px] font-bold uppercase cursor-pointer', calendarMode === mode ? 'bg-[#7eb098]/12 text-[#4a9070]' : 'text-gray-500 hover:bg-slate-50')}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
          </div>
          </div>

          {calendarMode === 'list' && (
            <div className="pr-1 pb-8">
              <p className="sticky top-[88px] z-[60] bg-white py-2 -mt-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-3 px-0.5">
                {sortedDayEvents.length} {sortedDayEvents.length === 1 ? CALENDAR_SCHEDULE_LABEL : CALENDAR_SCHEDULE_LABEL_PLURAL} ï¿½ {dateHeading}
              </p>
              {selectedDayString === todayDateString && (
                <div className="flex items-center gap-2 mb-4 px-1 py-2 rounded-xl bg-[#ff5b4f]/[0.06] border border-[#ff5b4f]/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5b4f] shrink-0 shadow-[0_0_8px_rgba(255,91,79,0.5)]" />
                  <span className="text-[10px] font-bold text-[#191c20]">
                    Now ï¿½ {calendarNow.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <span className="text-[9px] font-bold uppercase text-gray-400 ml-auto">Today</span>
                </div>
              )}
              {sortedDayEvents.length > 0 ? (
                <div className="space-y-2">
                  {sortedDayEvents.map((ev) => renderMilestoneRow(ev))}
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl text-gray-400 text-[14px] font-sans font-medium space-y-4">
                  <p>No delivery items for this day.</p>
                  <div className="flex justify-center">{calendarAddScheduleButton}</div>
                </div>
              )}
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-4 px-1">
                Hover for delivery preview ï¿½ click to edit
              </p>
            </div>
          )}

          {calendarMode === 'day' && (() => {
            const timelineHeight = timelineHours.length * CALENDAR_HOUR_PX;
            const showNowLine = selectedDayString === todayDateString;
            const nowMinutes = calendarNow.getHours() * 60 + calendarNow.getMinutes();
            const nowTopPx = (nowMinutes / (24 * 60)) * timelineHeight;
            const nowTimeLabel = calendarNow.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

            return (
              <div className="relative min-h-[calc(100vh-220px)] overflow-visible pr-1 pb-8">
                <div className="relative pb-6" style={{ minHeight: timelineHeight }}>
                  <div
                    className="absolute top-0 bottom-0 right-0 pointer-events-none flex flex-col"
                    style={{ left: CALENDAR_GRID_LEFT_PX }}
                  >
                    {timelineHours.map((h) => (
                      <div key={h} className="relative h-12 border-b border-gray-100/70 shrink-0 w-full">
                        <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-gray-100/50" />
                        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-gray-100/60" />
                        <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-gray-100/50" />
                      </div>
                    ))}
                  </div>
                  <div
                    className="absolute left-0 top-0 bottom-0 flex flex-col pointer-events-none z-[1]"
                    style={{ width: CALENDAR_TIME_GUTTER_PX }}
                  >
                    {timelineHours.map((h) => (
                      <div
                        key={h}
                        className="h-12 text-[9px] font-sans font-bold text-gray-400 text-right pr-2.5 shrink-0 flex items-start justify-end pt-1 leading-none"
                      >
                        {formatTimelineHour(h)}
                      </div>
                    ))}
                  </div>
                  <div
                    className="absolute top-0 bottom-0 border-r border-gray-100/90 pointer-events-none z-[1]"
                    style={{ left: CALENDAR_TIME_GUTTER_PX, width: CALENDAR_NOW_GUTTER_PX }}
                  />
                  {showNowLine && (
                    <div
                      className="absolute z-20 pointer-events-none flex items-center"
                      style={{ top: nowTopPx, left: CALENDAR_TIME_GUTTER_PX, right: 0 }}
                    >
                      <span
                        className="shrink-0 flex items-center justify-center text-[9px] font-sans font-extrabold text-white bg-[#191c20] px-2.5 py-1 rounded-full shadow-[0_0_14px_rgba(255,91,79,0.5)] leading-tight tabular-nums"
                        style={{ width: CALENDAR_NOW_GUTTER_PX }}
                      >
                        {nowTimeLabel}
                      </span>
                      <div className="flex-1 border-t-2 border-dashed border-[#ff5b4f]/90" />
                      <span className="w-3 h-3 rounded-full bg-[#ff5b4f] shrink-0 shadow-[0_0_12px_rgba(255,91,79,0.65)] ring-2 ring-[#ff5b4f]/30" />
                    </div>
                  )}
                  {sortedDayEvents.length > 0 ? sortedDayEvents.map((ev) => {
                    const startMin = parseEventTimeToMinutes(ev.time);
                    const topPx = (startMin / (24 * 60)) * timelineHeight;
                    const heightPx = Math.max(104, (90 / (24 * 60)) * timelineHeight);
                    const surface = getEventKindSurface(ev.kind);
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => openMilestoneEditor(ev.id)}
                        onMouseEnter={(e) => {
                          if (hoverHideTimer.current) window.clearTimeout(hoverHideTimer.current);
                          const rect = e.currentTarget.getBoundingClientRect();
                          const left = Math.min(Math.max(16, rect.left), window.innerWidth - 296);
                          const top = Math.min(rect.bottom + 8, window.innerHeight - 200);
                          setHoverPreview({ ev, top, left });
                        }}
                        onMouseLeave={scheduleHideMilestonePreview}
                        className={cn(
                          'absolute z-10 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-[0_8px_24px_-8px_rgba(25,28,32,0.12)] transition-shadow overflow-hidden text-left cursor-pointer ring-1',
                          surface.bg,
                          surface.ring,
                          ev.status === 'Completed' && 'opacity-65'
                        )}
                        style={{
                          top: topPx,
                          left: CALENDAR_GRID_LEFT_PX + 8,
                          right: 10,
                          height: heightPx,
                        }}
                      >
                        <div className="p-3.5 h-full overflow-hidden pointer-events-none">
                          <CalendarEventInnards
                            ev={ev}
                            getKindLabel={getEventKindLabel}
                            getKindColors={getEventKindColors}
                          />
                        </div>
                      </button>
                    );
                  }) : (
                    <div
                      className="absolute text-center py-16 border border-dashed border-gray-200 rounded-2xl text-gray-400 text-[14px] font-sans font-medium bg-white/80"
                      style={{ left: CALENDAR_GRID_LEFT_PX + 8, right: 10, top: timelineHeight * 0.28 }}
                    >
                      No delivery items this day
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {calendarMode === 'week' && (() => {
            const weekStart = getWeekStart(selectedDayString, weekScrollOffset);
            const weekDays = getWeekDays(weekStart);
            return (
              <div className="flex flex-col min-h-[calc(100vh-220px)] pb-8">
                <div className="sticky top-[88px] z-[60] flex items-center justify-between mb-4 shrink-0 bg-white py-2 -mt-2">
                  <button type="button" onClick={() => setWeekScrollOffset((w) => w - 1)} className="w-8 h-8 rounded-lg bg-[#f4f5f8] hover:bg-gray-200 flex items-center justify-center cursor-pointer"><ChevronLeft size={14} /></button>
                  <p className="font-fraunces text-[15.5px] font-semibold text-[#191c20]">{formatWeekRange(weekStart)}</p>
                  <button type="button" onClick={() => setWeekScrollOffset((w) => w + 1)} className="w-8 h-8 rounded-lg bg-[#f4f5f8] hover:bg-gray-200 flex items-center justify-center cursor-pointer"><ChevronRight size={14} /></button>
                </div>
                <div className="grid grid-cols-7 gap-2 flex-1 min-h-[640px]">
                  {weekDays.map((dayStr) => {
                    const dayEvents = getEventsForDate(dayStr);
                    const isSelected = selectedDayString === dayStr;
                    const isToday = dayStr === todayDateString;
                    const d = parseDateString(dayStr);
                    return (
                      <button
                        key={dayStr}
                        type="button"
                        onClick={() => goToDayView(dayStr)}
                        className={cn(
                          'flex flex-col rounded-2xl border text-left min-h-[380px] overflow-hidden cursor-pointer transition-all',
                          isSelected ? 'border-[#7eb098] bg-[#7eb098]/5 shadow-sm ring-1 ring-[#7eb098]/25' : 'border-gray-100 bg-[#fafbfc] hover:border-gray-200',
                          isToday && !isSelected && 'ring-1 ring-[#7eb098]/30'
                        )}
                      >
                        <div className={cn('px-2 py-2.5 border-b text-center shrink-0', isSelected ? 'bg-[#7eb098]/15 border-[#7eb098]/20' : 'bg-white border-gray-100')}>
                          <span className="text-[8.8px] font-bold uppercase text-gray-400 block">{weekdays[d.getDay()]}</span>
                          <span className="font-fraunces text-[22px] font-bold text-[#191c20] leading-none">{d.getDate()}</span>
                        </div>
                        <div className="flex-1 p-1.5 space-y-1 overflow-y-auto scrollbar-thin">
                          {dayEvents.length > 0 ? dayEvents.map((ev) => (
                            <div key={ev.id} className="p-2 rounded-lg bg-white border border-gray-100 text-[9px]">
                              <p className="font-bold text-[#191c20] truncate">{ev.title}</p>
                              <p className="text-gray-400 mt-0.5">{ev.time}</p>
                            </div>
                          )) : (
                            <p className="text-[9px] text-gray-300 text-center py-6 font-bold uppercase">Clear</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {calendarMode === 'month' && (
              <div className="flex flex-col min-h-[min(640px,calc(100vh-300px))]">
              <div className="sticky top-[88px] z-[60] flex items-center justify-between mb-4 shrink-0 bg-white py-2 -mt-2">
                <button type="button" onClick={handlePrevMonth} className="w-8 h-8 rounded-lg bg-[#f4f5f8] flex items-center justify-center cursor-pointer"><ChevronLeft size={14} /></button>
                <h3 className="font-fraunces text-[22px] font-bold text-[#191c20]">{monthNames[monthIndex]} {yearVal}</h3>
                <button type="button" onClick={handleNextMonth} className="w-8 h-8 rounded-lg bg-[#f4f5f8] flex items-center justify-center cursor-pointer"><ChevronRight size={14} /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekdays.map((wd) => (
                  <div key={wd} className="text-center text-[10px] font-bold uppercase text-gray-400 py-1">{wd}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5 flex-1 auto-rows-fr min-h-[420px]">
                {calendarCells.map((dayNum, idx) => {
                  if (dayNum === null) return <div key={`e-${idx}`} className="min-h-[72px]" />;
                  const ds = getDateString(yearVal, monthIndex, dayNum);
                  const dayEvs = getEventsForDate(ds);
                  const sel = selectedDayString === ds;
                  const isToday = ds === todayDateString;
                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => goToDayView(ds)}
                      className={cn(
                        'min-h-[72px] rounded-xl border p-2 text-left flex flex-col cursor-pointer transition-all',
                        sel ? 'bg-[#191c20] border-[#191c20] text-white' : isToday ? 'bg-[#7eb098]/10 border-[#7eb098]/35' : 'bg-white border-gray-100 hover:border-gray-200'
                      )}
                    >
                      <span className={cn('text-[15.5px] font-fraunces font-bold', sel ? 'text-white' : 'text-[#191c20]')}>{dayNum}</span>
                      {dayEvs.length > 0 && (
                        <div className="mt-auto space-y-0.5">
                          {dayEvs.slice(0, 2).map((ev) => (
                            <p key={ev.id} className={cn('text-[7.7px] font-bold truncate leading-tight', sel ? 'text-white/80' : 'text-gray-500')}>{ev.title}</p>
                          ))}
                          {dayEvs.length > 2 && <p className={cn('text-[7.7px] font-bold', sel ? 'text-white/60' : 'text-gray-400')}>+{dayEvs.length - 2}</p>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {calendarMode === 'year' && (
              <div className="flex flex-col min-h-[min(640px,calc(100vh-300px))]">
              <div className="sticky top-[88px] z-[60] flex items-center justify-between mb-5 shrink-0 bg-white py-2 -mt-2">
                <button type="button" onClick={() => setYearVal((y) => y - 1)} className="w-8 h-8 rounded-lg bg-[#f4f5f8] flex items-center justify-center cursor-pointer"><ChevronLeft size={14} /></button>
                <h3 className="font-fraunces text-[26.5px] font-bold text-[#191c20]">{yearVal}</h3>
                <button type="button" onClick={() => setYearVal((y) => y + 1)} className="w-8 h-8 rounded-lg bg-[#f4f5f8] flex items-center justify-center cursor-pointer"><ChevronRight size={14} /></button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 overflow-y-auto scrollbar-default-thin pr-1">
                {monthNames.map((mName, mIdx) => {
                  const daysInM = getDaysInMonth(yearVal, mIdx);
                  const startO = getStartOffset(yearVal, mIdx);
                  const cells = [...Array(startO).fill(null), ...Array.from({ length: daysInM }, (_, i) => i + 1)];
                  const monthCount = getEventsInMonth(yearVal, mIdx).length;
                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => { setMonthIndex(mIdx); setCalendarMode('month'); selectDay(getDateString(yearVal, mIdx, Math.min(parseDateString(selectedDayString).getDate(), daysInM))); }}
                      className="p-4 bg-white border border-gray-100 hover:border-[#7eb098]/40 hover:shadow-md rounded-2xl text-left cursor-pointer transition-all min-h-[168px] flex flex-col"
                    >
                      <div className="flex justify-between items-baseline mb-3">
                        <h4 className="font-fraunces text-[15.5px] font-bold text-[#191c20]">{mName}</h4>
                        <span className="text-[10px] font-bold text-[#7eb098] bg-[#7eb098]/10 px-2 py-0.5 rounded-full">{monthCount}</span>
                      </div>
                      <div className="grid grid-cols-7 gap-0.5 flex-1">
                        {cells.map((dayNum, cellIdx) => {
                          if (dayNum === null) return <span key={cellIdx} className="aspect-square" />;
                          const ds = getDateString(yearVal, mIdx, dayNum);
                          const hasE = getEventsForDate(ds).length > 0;
                          const isToday = ds === todayDateString;
                          return (
                            <span
                              key={dayNum}
                              className={cn(
                                'aspect-square flex items-center justify-center text-[7.7px] font-bold rounded',
                                isToday ? 'bg-[#191c20] text-white' : hasE ? 'text-[#4a9070] bg-[#7eb098]/15' : 'text-gray-400'
                              )}
                            >
                              {dayNum}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      }
      context={
        <>
          <div className="p-4 rounded-2xl border border-gray-100 bg-white">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Client</p>
            {renderCalendarClientPicker('context')}
            {calendarClientFilter !== 'all' && clientMetadata[calendarClientFilter] && (
              <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-gray-100">
                <img
                  src={clientMetadata[calendarClientFilter].avatar || `https://i.pravatar.cc/150?img=${Math.abs(calendarClientFilter.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 70}`}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover border border-gray-100"
                />
                <div className="min-w-0">
                  <p className="font-fraunces text-sm font-semibold text-[#191c20] truncate">{calendarClientFilter}</p>
                  <p className="text-[10px] text-gray-500 truncate">{clientMetadata[calendarClientFilter].poc}</p>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-3xs font-sans">
            <p className="text-[9px] font-sans font-bold uppercase tracking-widest text-gray-400 mb-1">Today&apos;s load</p>
            <p className="font-fraunces text-2xl font-bold text-[#191c20]">{selectedDayEvents.length}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">delivery items today</p>
            <div className="mt-3.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#7eb098] to-emerald-500 rounded-full transition-all duration-350" 
                style={{ width: selectedDayEvents.length ? `${(completedToday / selectedDayEvents.length) * 100}%` : '0%' }} 
              />
            </div>
            <p className="text-[9.5px] font-bold text-[#7eb098] mt-1.5">{completedToday} completed</p>
          </div>
          {nextEvent && (
            <div className="p-4 rounded-2xl border border-[#7eb098]/40 bg-gradient-to-br from-[#7eb098]/8 to-transparent shadow-[0_0_20px_-4px_rgba(126,176,152,0.35)] font-sans">
              <span className="text-[9px] font-sans font-extrabold uppercase tracking-widest text-[#7eb098] bg-[#7eb098]/15 px-2 py-0.5 rounded border border-[#7eb098]/25 shadow-[0_0_8px_rgba(126,176,152,0.25)]">Up next</span>
              <p className="font-fraunces text-[14px] font-bold text-[#191c20] mt-3 leading-snug">{nextEvent.title}</p>
              <p className="text-[10.5px] text-gray-500 mt-1 font-semibold">{nextEvent.time} ï¿½ <span className="font-fraunces text-gray-700 font-bold">{nextEvent.client}</span></p>
              <button 
                type="button" 
                onClick={() => { 
                  setSelectedClientName(nextEvent.client); 
                  if (nextEvent.projectId) setSelectedProjectId(nextEvent.projectId); 
                  setCurrentView('Projects'); 
                }} 
                className="mt-3.5 w-full py-2.5 rounded-xl bg-[#484782] hover:bg-[#343362] text-white text-[9.5px] font-sans font-bold uppercase tracking-wider cursor-pointer transition-colors text-center block shadow-3xs"
              >
                Open workspace
              </button>
            </div>
          )}
          <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-3xs font-sans">
            <p className="text-[9px] font-sans font-bold uppercase tracking-widest text-gray-400 mb-1">This month</p>
            <p className="font-fraunces text-xl font-bold text-[#191c20]">{monthEventCount}</p>
            <p className="text-[10px] text-gray-500">delivery events this month</p>
          </div>
        </>
      }
    />

      {hoverPreview && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[150000] w-[min(288px,calc(100vw-2rem))] pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          style={{ top: hoverPreview.top, left: hoverPreview.left }}
        >
          <div className="rounded-2xl border border-gray-200/90 bg-white shadow-[0_18px_44px_-14px_rgba(25,28,32,0.28)] p-4">
            <CalendarEventInnards
              ev={hoverPreview.ev}
              getKindLabel={getEventKindLabel}
              getKindColors={getEventKindColors}
              compact
            />
            <p className="text-[8px] font-bold uppercase tracking-widest text-[#7eb098] mt-3">Click row to edit</p>
          </div>
        </div>,
        document.body
      )}

      <SendationalSlideIn
        open={addScheduleOpen}
        onClose={() => setAddScheduleOpen(false)}
        badge="Calendar"
        title="Add delivery date"
        description="Block a client delivery, review, payment gate, portal expiry, or follow-up."
      >
        <form onSubmit={handleAddScheduleEntry} className="space-y-4 text-left font-sans">
          <div>
            <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Title</label>
            <input
              required
              value={newScheduleDraft.title}
              onChange={(e) => setNewScheduleDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="e.g. Brand files due to client"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-medium outline-none focus:border-[#7eb098]/40"
            />
          </div>
          <div>
            <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Client</label>
            <select
              value={newScheduleDraft.client}
              onChange={(e) => setNewScheduleDraft((d) => ({ ...d, client: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold outline-none cursor-pointer"
            >
              {calendarClientOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Date</label>
              <input
                type="date"
                required
                value={newScheduleDraft.dateString}
                onChange={(e) => setNewScheduleDraft((d) => ({ ...d, dateString: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Time</label>
              <input
                value={newScheduleDraft.time}
                onChange={(e) => setNewScheduleDraft((d) => ({ ...d, time: e.target.value }))}
                placeholder="10:00 AM"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Type</label>
            <select
              value={newScheduleDraft.kind}
              onChange={(e) => setNewScheduleDraft((d) => ({ ...d, kind: e.target.value as CalendarEvent['kind'] }))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="delivery_due">Delivery due</option>
              <option value="review_meeting">Review meeting</option>
              <option value="client_followup">Client follow-up</option>
              <option value="payment_expected">Payment expected</option>
              <option value="internal_task">Internal task</option>
              <option value="portal_expiry">Portal expiry</option>
              <option value="signature_due">Signature due</option>
              <option value="scheduled_send">Scheduled send</option>
            </select>
          </div>
          <div>
            <label className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Next step</label>
            <input
              value={newScheduleDraft.nextAction}
              onChange={(e) => setNewScheduleDraft((d) => ({ ...d, nextAction: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs outline-none"
            />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-[#191c20] hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer">
            Add delivery date
          </button>
        </form>
      </SendationalSlideIn>

      <SendationalSlideIn
        open={!!editingMilestone}
        onClose={() => setEditingMilestoneId(null)}
        badge="Calendar"
        title={editingMilestone?.title ?? 'Schedule item'}
        description={editingMilestone ? `${editingMilestone.client} ï¿½ ${editingMilestone.dateString} ï¿½ ${editingMilestone.time}` : undefined}
      >
        {editingMilestone && (() => {
          const ev = editingMilestone;
          const notesText = eventNotesState[ev.id] ?? ev.notes ?? '';
          const targetDate = rescheduleDateMap[ev.id] ?? ev.dateString;
          const targetTime = rescheduleTimeMap[ev.id] ?? ev.time;
          const hasConflict = calendarEvents.some(
            (otherEv) => otherEv.id !== ev.id && otherEv.dateString === targetDate && otherEv.time.toLowerCase().replace(/\s/g, '') === targetTime.toLowerCase().replace(/\s/g, '')
          );
          return (
            <div className="space-y-4 text-left font-sans">
              <CalendarEventInnards
                ev={ev}
                getKindLabel={getEventKindLabel}
                getKindColors={getEventKindColors}
              />
              <div className="bg-[#f6f5f1] border border-[#e8e6dd] rounded-xl p-3.5">
                <span className="font-sans text-[8px] text-gray-400 font-bold block uppercase tracking-wider mb-1.5">Internal briefing memo</span>
                <textarea
                  value={notesText}
                  onChange={(e) => setEventNotesState((prev) => ({ ...prev, [ev.id]: e.target.value }))}
                  placeholder="Add briefing notes..."
                  className="w-full min-h-[4.5rem] max-h-36 text-xs font-sans text-gray-600 bg-transparent border-none outline-none resize-none overflow-y-auto scrollbar-thin placeholder-gray-400"
                />
                <div className="flex flex-wrap gap-1.5 mb-2 mt-1">
                  {['#critical', '#review', '#draft', '#billing'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const newText = notesText ? `${notesText} ${tag}` : tag;
                        setEventNotesState((prev) => ({ ...prev, [ev.id]: newText }));
                      }}
                      className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-gray-200 text-[8.5px] font-sans font-bold text-gray-500 cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end pt-1 border-t border-[#f0f2f5] mt-1">
                  <button
                    type="button"
                    onClick={() => handleSaveNotes(ev.id, notesText)}
                    className="px-3.5 py-1 bg-[#191c20] hover:bg-black text-white text-[8.5px] font-sans font-bold uppercase rounded-md cursor-pointer"
                  >
                    Save memo
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <span className="font-sans text-[8px] text-gray-400 font-bold block uppercase tracking-wider mb-2">Reschedule</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[7.5px] font-sans text-gray-400 font-bold uppercase">New date</label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setRescheduleDateMap((prev) => ({ ...prev, [ev.id]: e.target.value }))}
                      className="bg-white border border-gray-200 rounded-md px-2 py-1.5 text-[10.5px] outline-none font-sans font-medium text-gray-700 w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[7.5px] font-sans text-gray-400 font-bold uppercase">New time</label>
                    <input
                      type="text"
                      value={targetTime}
                      onChange={(e) => setRescheduleTimeMap((prev) => ({ ...prev, [ev.id]: e.target.value }))}
                      placeholder="e.g. 12:00 PM"
                      className="bg-white border border-gray-200 rounded-md px-2 py-1.5 text-[10.5px] outline-none font-sans font-medium text-gray-700 w-full"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  {hasConflict ? (
                    <span className="text-[9px] font-sans font-bold text-[#ff5b4f] flex items-center gap-1">
                      <ShieldAlert size={10} /> Conflict at this slot
                    </span>
                  ) : (
                    <span className="text-[9px] font-sans font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={10} /> Slot clear
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { handleRescheduleLocal(ev.id); setEditingMilestoneId(null); }}
                  className="w-full mt-2.5 py-2 bg-[#484782] hover:bg-[#343362] text-white text-[8.5px] font-sans font-bold uppercase rounded-lg cursor-pointer"
                >
                  Save new time
                </button>
              </div>
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-sans font-bold text-gray-500">
                  <input
                    type="checkbox"
                    checked={ev.status === 'Completed'}
                    onChange={() => handleToggleStatus(ev.id)}
                    className="w-4 h-4 accent-[#191c20]"
                  />
                  Completed
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClientName(ev.client);
                    if (ev.projectId) {
                      setSelectedProjectId(ev.projectId);
                    } else {
                      const matchingProj = projectsList.find((p) => p.client.name === ev.client);
                      setSelectedProjectId(matchingProj?.id ?? '');
                    }
                    setActiveTab(resolveWorkspaceTab(ev.targetTab));
                    setCurrentView('Projects');
                    setEditingMilestoneId(null);
                  }}
                  className="px-4 py-2 bg-[#191c20] hover:bg-black text-white text-[9.5px] font-sans font-bold uppercase rounded-xl cursor-pointer"
                >
                  Open workspace
                </button>
              </div>
            </div>
          );
        })()}
      </SendationalSlideIn>

      {toastText && (
        <div className="fixed bottom-6 right-6 bg-[#191c20] text-white px-5 py-3 rounded-2xl shadow-2xl z-[9999] text-[11px] font-bold tracking-wide uppercase font-sans animate-in slide-in-from-bottom-2 duration-300 flex items-center gap-2.5 border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-[#7eb098] animate-pulse" />
          {toastText}
        </div>
      )}
    </>
  );
};

interface WorkspaceViewProps {
  projectsList: Project[];
  setProjectsList: React.Dispatch<React.SetStateAction<Project[]>>;
  selectedProjectId: string;
  setSelectedProjectId: React.Dispatch<React.SetStateAction<string>>;
  selectedClientName: string;
  setSelectedClientName: React.Dispatch<React.SetStateAction<string>>;
  clientMetadata: Record<string, {
    email: string;
    poc: string;
    priority: 'VIP' | 'Retainer' | 'Standard';
    sentiment: 'Exceptional' | 'Good' | 'Neutral' | 'At Risk';
    sparklineHistory: number[];
    avatar?: string;
  }>;
  setClientMetadata: React.Dispatch<React.SetStateAction<Record<string, {
    email: string;
    poc: string;
    priority: 'VIP' | 'Retainer' | 'Standard';
    sentiment: 'Exceptional' | 'Good' | 'Neutral' | 'At Risk';
    sparklineHistory: number[];
    avatar?: string;
  }>>>;
  chatMessages: Record<string, Array<{ id: string; sender: 'user' | 'client'; text: string; time: string }>>;
  setChatMessages: React.Dispatch<React.SetStateAction<Record<string, Array<{ id: string; sender: 'user' | 'client'; text: string; time: string }>>>>;
  activeTab: WorkspaceTab;
  setActiveTab: React.Dispatch<React.SetStateAction<WorkspaceTab>>;
  clientNotes: Record<string, string>;
  setClientNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  notesHighlightClient: string | null;
  briefingEvents: BriefingEvent[];
}

const WorkspaceView = ({
  projectsList,
  setProjectsList,
  selectedProjectId,
  setSelectedProjectId,
  selectedClientName,
  setSelectedClientName,
  clientMetadata,
  setClientMetadata,
  chatMessages,
  setChatMessages,
  activeTab,
  setActiveTab,
  clientNotes,
  setClientNotes,
  notesHighlightClient,
  briefingEvents,
}: WorkspaceViewProps) => {
  // State for active live split editor mode
  
  // Search query for projects
  const [searchQuery, setSearchQuery] = useState('');

  // Rich notes editor state and parser
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const parseNotesToHtml = (text: string) => {
    if (!text) return <p className="text-gray-400 italic font-sans text-xs">Click here to add internal notes...</p>;
    const lines = text.split('\n');

    // Get briefing notes for this client
    const clientBriefingNotes = briefingEvents.filter(
      (e) => e.clientName.toLowerCase() === clientName.toLowerCase() && e.detail
    );

    return lines.map((line, idx) => {
      const trimmedLine = line.trim();
      
      // We check if this line contains any original briefing note detail as a substring.
      // If the user deleted even a letter, the substring check will fail (the tag goes away).
      // If they restore it, it will match again!
      // To prevent false positives on very short lines, we require briefing note details to be at least 3 characters.
      const matchingEvent = clientBriefingNotes.find((ev) => {
        const cleanDetail = ev.detail.trim();
        // Remove bullet prefixes from cleanDetail to match clean content if needed
        const rawContent = cleanDetail.replace(/^-\s+/, '').trim();
        if (rawContent.length < 3) return false;
        return trimmedLine.includes(rawContent);
      });

      if (matchingEvent) {
        return (
          <div
            key={idx}
            className="group/note-line relative my-2 px-3 py-2 rounded-xl bg-[#7eb098]/10 border-l-4 border-[#7eb098] text-[#1e3d30] font-sans font-semibold transition-all duration-300 hover:bg-[#7eb098]/15"
          >
            <span>{line}</span>
            {/* Small pulsing icon that shows up on hover */}
            <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/note-line:opacity-100 transition-opacity duration-250 flex items-center justify-center pointer-events-none z-30">
              {/* Date tooltip */}
              <span className="absolute right-6 bg-[#191c20] text-white text-[9px] font-sans px-2.5 py-1 rounded shadow-lg whitespace-nowrap opacity-0 group-hover/note-line:opacity-100 transition-opacity delay-100 pointer-events-none uppercase tracking-wider font-bold">
                {matchingEvent.date} ï¿½ {matchingEvent.time}
              </span>
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-[#7eb098]/40 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7eb098]" />
            </span>
          </div>
        );
      }

      return (
        <p key={idx} className="my-1 font-sans text-gray-750 min-h-[1.2em] whitespace-pre-wrap leading-relaxed">
          {line}
        </p>
      );
    });
  };
  
  const [collapsedClients, setCollapsedClients] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(WORKSPACE_CLIENT_COLLAPSED_KEY);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(WORKSPACE_CLIENT_COLLAPSED_KEY, JSON.stringify(collapsedClients));
    } catch {
      /* ignore */
    }
  }, [collapsedClients]);

  const [isIndexCollapsed, setIsIndexCollapsed] = useState(() => {
    try {
      return localStorage.getItem(WORKSPACE_INDEX_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(WORKSPACE_INDEX_COLLAPSED_KEY, isIndexCollapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [isIndexCollapsed]);
 

 
  // Toast notification
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };
 
  // Local file upload progress
  const [localUploadedFiles, setLocalUploadedFiles] = useState<Array<{ id: string; name: string; size: string; progress: number; speed?: string; eta?: string }>>([]);

  // Client Tasks local state
  const [clientTasks, setClientTasks] = useState<Record<string, Array<{ id: string; text: string; completed: boolean }>>>({
    'Acme Corp': [
      { id: 't-1', text: 'Upload revised style guidelines mockups', completed: true },
      { id: 't-2', text: 'Confirm client team has active portal URL', completed: false },
      { id: 't-3', text: 'Awaiting video trailer rendering upload', completed: false }
    ],
    'Startup Inc': [
      { id: 't-4', text: 'Lock draft folders for review pipeline', completed: true },
      { id: 't-5', text: 'Create draft retainer contract terms', completed: false }
    ],
    'GlobalTech': [
      { id: 't-6', text: 'Upload phase 2 compliance statement', completed: true },
      { id: 't-7', text: 'Verify compliance board coordinator review', completed: false }
    ],
    'Broken Co': [
      { id: 't-8', text: 'Initiate delivery recovery link checks', completed: false }
    ]
  });
 
  // Todo checklist text
  const [newTodoText, setNewTodoText] = useState('');
  const [typedMessage, setTypedMessage] = useState('');
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping, activeTab]);

  // Asset preview state
  const [hoveredAsset, setHoveredAsset] = useState<{
    file: ProjectFile;
    left: number;
    top: number;
    placement: 'above' | 'below';
  } | null>(null);

  const showAssetPreview = (file: ProjectFile, event: React.MouseEvent<HTMLElement>) => {
    const tileRect = event.currentTarget.getBoundingClientRect();
    const previewWidth = file.type === 'image'
      ? Math.min(520, window.innerWidth * 0.72)
      : Math.min(440, window.innerWidth * 0.72);
    const previewHeightHint = file.type === 'image' ? 440 : file.type === 'video' ? 280 : 240;
    const placement = tileRect.top > previewHeightHint + 24 ? 'above' : 'below';
    const centeredLeft = tileRect.left + tileRect.width / 2 - previewWidth / 2;
    const left = Math.min(
      Math.max(centeredLeft, 16),
      window.innerWidth - previewWidth - 16
    );
    const top = placement === 'above' ? tileRect.top - 12 : tileRect.bottom + 12;

    setHoveredAsset({ file, left, top, placement });
  };

  const hideAssetPreview = () => {
    setHoveredAsset(prev => prev ? null : prev);
  };

  // Creation & Editing Modals state
  const [modalOpen, setModalOpen] = useState<'project' | 'client' | 'edit_client' | null>(null);
  
  // Create Project inputs
  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('Acme Corp');
  const [newProjAmount, setNewProjAmount] = useState('');
  const [newProjDueDate, setNewProjDueDate] = useState('');
  const [newProjScope, setNewProjScope] = useState('');

  // Create Client inputs
  const [newCliName, setNewCliName] = useState('');
  const [newCliEmail, setNewCliEmail] = useState('');
  const [newCliPoc, setNewCliPoc] = useState('');
  const [newCliPriority, setNewCliPriority] = useState<'VIP' | 'Retainer' | 'Standard'>('Standard');
  const [newCliSentiment, setNewCliSentiment] = useState<'Exceptional' | 'Good' | 'Neutral' | 'At Risk'>('Good');
  const [newCliAvatar, setNewCliAvatar] = useState('https://i.pravatar.cc/150?img=32');

  // Edit Client inputs
  const [editCliName, setEditCliName] = useState('');
  const [editCliEmail, setEditCliEmail] = useState('');
  const [editCliPoc, setEditCliPoc] = useState('');
  const [editCliPriority, setEditCliPriority] = useState<'VIP' | 'Retainer' | 'Standard'>('Standard');
  const [editCliSentiment, setEditCliSentiment] = useState<'Exceptional' | 'Good' | 'Neutral' | 'At Risk'>('Good');
  const [editCliAvatar, setEditCliAvatar] = useState('');

  // Sub-tabs state inside Activity & Reports
  const [activitySubTab, setActivitySubTab] = useState<'timeline' | 'reports'>('timeline');

  // Avatar presets
  const AVATAR_PRESETS = [
    'https://i.pravatar.cc/150?img=32',
    'https://i.pravatar.cc/150?img=53',
    'https://i.pravatar.cc/150?img=11',
    'https://i.pravatar.cc/150?img=40',
    'https://i.pravatar.cc/150?img=47',
    'https://i.pravatar.cc/150?img=12',
    'https://i.pravatar.cc/150?img=25',
    'https://i.pravatar.cc/150?img=60'
  ];

  // Derived states
  const activeProject = projectsList.find(p => p.id === selectedProjectId);
  const clientName = selectedClientName;
  const clientMeta = clientMetadata[clientName] || {
    email: 'poc@client.com',
    poc: 'Direct Contact',
    priority: 'Standard' as const,
    sentiment: 'Good' as const,
    sparklineHistory: [4, 6, 8, 10, 8, 12],
    avatar: `https://i.pravatar.cc/150?img=${Math.abs(clientName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 70}`
  };

  // Helper actions
  const toggleFilePortalLock = (projectId: string, fileName: string) => {
    setProjectsList(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          files: p.files.map(f => f.name === fileName ? { ...f, locked: !f.locked } : f)
        };
      }
      return p;
    }));
    showToast("File portal visibility toggled!");
  };

  const handleDropzoneClick = () => {
    if (!activeProject) return;
    const mockFiles = [
      { name: 'social_campaign_banner.jpg', size: '2.8 MB', type: 'image' as const },
      { name: 'project_brief_v2.pdf', size: '1.4 MB', type: 'pdf' as const },
      { name: 'explainer_video_draft.mp4', size: '42 MB', type: 'video' as const },
      { name: 'logo_assets_export.zip', size: '8.5 MB', type: 'archive' as const }
    ];
    const targetFile = mockFiles[generateRandomIndex(mockFiles.length)];
    const fileId = generateFileId();
    
    // check if file already exists in project files
    if (activeProject.files.some(f => f.name === targetFile.name)) {
      showToast(`File ${targetFile.name} is already uploaded!`);
      return;
    }

    const newFile = { id: fileId, name: targetFile.name, size: targetFile.size, progress: 5, speed: '4.8 MB/s', eta: '4s' };
    setLocalUploadedFiles(prev => [...prev, newFile]);

    let currentProgress = 5;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 20) + 10;
      
      const speeds = ['4.8 MB/s', '5.2 MB/s', '4.4 MB/s', '5.7 MB/s'];
      const curSpeed = speeds[Math.floor(Math.random() * speeds.length)];
      const remS = Math.max(1, Math.round((100 - currentProgress) / 25));
      const curEta = `${remS}s`;

      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        showToast(`File ${targetFile.name} uploaded successfully to S3!`);
        
        // Add to project files
        setProjectsList(prev => prev.map(p => {
          if (p.id === activeProject.id) {
            const hasIt = p.files.some(f => f.name === targetFile.name);
            if (hasIt) return p;
            const newAsset: ProjectFile = {
              name: targetFile.name,
              size: targetFile.size,
              type: targetFile.type,
              locked: false,
              previewUrl: targetFile.type === 'image' ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60' : undefined
            };
            return {
              ...p,
              files: [...p.files, newAsset]
            };
          }
          return p;
        }));

        // Remove from progress bar
        setLocalUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      } else {
        setLocalUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress: currentProgress, speed: curSpeed, eta: curEta } : f));
      }
    }, 250);
  };

  const toggleClientTask = (clientId: string, taskId: string) => {
    setClientTasks(prev => {
      const list = prev[clientId] || [];
      const updated = list.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      return { ...prev, [clientId]: updated };
    });
    showToast("Checklist task updated!");
  };

  const handleAddTodo = (e: React.FormEvent, clientName: string) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    const newTodo = {
      id: `t-sq${Date.now()}`,
      text: newTodoText.trim(),
      completed: false
    };
    setClientTasks(prev => {
      const list = prev[clientName] || [];
      return { ...prev, [clientName]: [...list, newTodo] };
    });
    setNewTodoText('');
    showToast("Task added to checklist!");
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !clientName) return;

    const userMsg = {
      id: `m-usr-${Date.now()}`,
      sender: 'user' as const,
      text: typedMessage.trim(),
      time: 'Just now'
    };

    setChatMessages(prev => {
      const history = prev[clientName] || [];
      return { ...prev, [clientName]: [...history, userMsg] };
    });

    const userText = typedMessage.trim();
    setTypedMessage('');
    setIsTyping("Client is typing...");

    setTimeout(() => {
      setIsTyping(null);
      const botMsg = {
        id: `m-cli-${Date.now()}`,
        sender: 'client' as const,
        text: `Got your message regarding "${activeProject?.name || 'the delivery'}": "${userText.length > 30 ? userText.slice(0, 30) + '...' : userText}". Let me discuss this with our coordinator ${clientMeta.poc} and get back to you!`,
        time: 'Just now'
      };
      setChatMessages(prev => {
        const history = prev[clientName] || [];
        return { ...prev, [clientName]: [...history, botMsg] };
      });
      showToast("New message received!");
    }, 1800);
  };

  // Group projects by Client, starting with all clients in the clientMetadata state
  const clientGroups: Record<string, {
    client: { name: string; email: string; avatar: string };
    projects: Project[];
  }> = {};

  Object.keys(clientMetadata).forEach(name => {
    const meta = clientMetadata[name];
    clientGroups[name] = {
      client: {
        name: name,
        email: meta.email,
        avatar: meta.avatar || `https://i.pravatar.cc/150?img=${Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 70}`
      },
      projects: []
    };
  });

  projectsList.forEach(p => {
    const name = p.client.name;
    if (!clientGroups[name]) {
      clientGroups[name] = {
        client: {
          name: name,
          email: p.client.email || 'poc@client.com',
          avatar: p.client.avatar || `https://i.pravatar.cc/150?img=${Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 70}`
        },
        projects: []
      };
    }
    clientGroups[name].projects.push(p);
  });

  // Filter client groups and nested projects based on Search query
  const filteredGroups = Object.keys(clientGroups).reduce((acc, name) => {
    const group = clientGroups[name];
    const matchesSearch = group.projects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (searchQuery === '' || name.toLowerCase().includes(searchQuery.toLowerCase()) || matchesSearch.length > 0) {
      acc[name] = {
        ...group,
        projects: matchesSearch
      };
    }
    return acc;
  }, {} as typeof clientGroups);

  const toggleClientCollapse = (name: string) => {
    setCollapsedClients(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  // Toggle lock all files in active project
  const toggleLockAllFiles = () => {
    if (!activeProject) return;
    const allLocked = activeProject.files.every(f => f.locked);
    setProjectsList(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return {
          ...p,
          files: p.files.map(f => ({ ...f, locked: !allLocked }))
        };
      }
      return p;
    }));
    showToast(allLocked ? "All portal deliverables unlocked!" : "All portal deliverables locked!");
  };

  // Create Project handler
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) {
      showToast("Please enter a project name.");
      return;
    }
    const clientMetaDetails = clientMetadata[newProjClient];
    const newProject: Project = {
      id: generateProjectId(),
      name: newProjName.trim(),
      client: {
        name: newProjClient,
        email: clientMetaDetails?.email || 'poc@client.com',
        avatar: clientMetaDetails?.avatar || `https://i.pravatar.cc/150?img=${Math.abs(newProjClient.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 70}`
      },
      status: 'Draft',
      amount: newProjAmount ? parseFloat(newProjAmount) : 5000,
      date: newProjDueDate || 'Oct 30',
      clientLink: newProjName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      files: [],
      accessConfig: { viewCount: 0 }
    };

    setProjectsList(prev => [newProject, ...prev]);
    setSelectedClientName(newProjClient);
    setSelectedProjectId(newProject.id);

    if (newProjScope.trim()) {
      setClientNotes(prev => ({
        ...prev,
        [newProjClient]: (prev[newProjClient] ? prev[newProjClient] + '\n\n' : '') + `Project Scope brief:\n${newProjScope.trim()}`
      }));
    }

    setNewProjName('');
    setNewProjAmount('');
    setNewProjDueDate('');
    setNewProjScope('');
    setModalOpen(null);
    showToast(`New project "${newProject.name}" created under ${newProjClient}!`);
  };

  // Create Client handler
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCliName.trim()) {
      showToast("Please enter a client name.");
      return;
    }
    if (clientMetadata[newCliName.trim()]) {
      showToast("A client with this name already exists.");
      return;
    }

    setClientMetadata(prev => ({
      ...prev,
      [newCliName.trim()]: {
        email: newCliEmail.trim() || 'info@client.com',
        poc: newCliPoc.trim() || 'Direct Contact',
        priority: newCliPriority,
        sentiment: newCliSentiment,
        sparklineHistory: [8, 12, 10, 15, 14, 20],
        avatar: newCliAvatar
      }
    }));

    setClientNotes(prev => ({
      ...prev,
      [newCliName.trim()]: `Client profile created on ${new Date().toLocaleDateString()}.\n\nPoint of Contact: ${newCliPoc.trim() || 'Direct Contact'}\nEmail: ${newCliEmail.trim() || 'info@client.com'}`
    }));

    setClientTasks(prev => ({
      ...prev,
      [newCliName.trim()]: [
        { id: generateUniqueId('t'), text: 'Define project scope & goals', completed: false },
        { id: generateUniqueId('t'), text: 'Share portal link with client coordinator', completed: false }
      ]
    }));

    setChatMessages(prev => ({
      ...prev,
      [newCliName.trim()]: [
        { id: generateUniqueId('m-sys'), sender: 'client', text: `Hi! This is the client communication channel for ${newCliName.trim()}. Direct chat is now open.`, time: 'System initialization' }
      ]
    }));

    setSelectedClientName(newCliName.trim());
    setSelectedProjectId(''); // no projects yet
    
    setNewCliName('');
    setNewCliEmail('');
    setNewCliPoc('');
    setNewCliPriority('Standard');
    setNewCliSentiment('Good');
    setModalOpen(null);
    showToast(`New client "${newCliName.trim()}" registered!`);
  };

  // Edit Client handler
  const handleEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCliName.trim()) {
      showToast("Client name cannot be empty.");
      return;
    }

    const oldName = selectedClientName;
    const newName = editCliName.trim();

    setClientMetadata(prev => {
      const copy = { ...prev };
      const oldMeta = copy[oldName];
      delete copy[oldName];
      copy[newName] = {
        ...oldMeta,
        email: editCliEmail.trim(),
        poc: editCliPoc.trim(),
        priority: editCliPriority,
        sentiment: editCliSentiment,
        avatar: editCliAvatar
      };
      return copy;
    });

    setClientNotes(prev => {
      const copy = { ...prev };
      copy[newName] = copy[oldName] || '';
      if (oldName !== newName) delete copy[oldName];
      return copy;
    });

    setClientTasks(prev => {
      const copy = { ...prev };
      copy[newName] = copy[oldName] || [];
      if (oldName !== newName) delete copy[oldName];
      return copy;
    });

    setChatMessages(prev => {
      const copy = { ...prev };
      copy[newName] = copy[oldName] || [];
      if (oldName !== newName) delete copy[oldName];
      return copy;
    });

    setProjectsList(prev => prev.map(p => {
      if (p.client.name === oldName) {
        return {
          ...p,
          client: {
            ...p.client,
            name: newName,
            email: editCliEmail.trim(),
            avatar: editCliAvatar
          }
        };
      }
      return p;
    }));

    setSelectedClientName(newName);
    setModalOpen(null);
    showToast("Client details updated successfully!");
  };

  // Delete Client handler
  const handleDeleteClient = (nameToDelete: string) => {
    if (!window.confirm(`Are you sure you want to delete "${nameToDelete}" and all its associated projects? This cannot be undone.`)) {
      return;
    }

    setClientMetadata(prev => {
      const copy = { ...prev };
      delete copy[nameToDelete];
      return copy;
    });

    setProjectsList(prev => prev.filter(p => p.client.name !== nameToDelete));
    
    setClientNotes(prev => { const copy = { ...prev }; delete copy[nameToDelete]; return copy; });
    setClientTasks(prev => { const copy = { ...prev }; delete copy[nameToDelete]; return copy; });
    setChatMessages(prev => { const copy = { ...prev }; delete copy[nameToDelete]; return copy; });

    const remainingClients = Object.keys(clientMetadata).filter(c => c !== nameToDelete);
    if (remainingClients.length > 0) {
      setSelectedClientName(remainingClients[0]);
      const nextProj = projectsList.find(p => p.client.name === remainingClients[0]);
      setSelectedProjectId(nextProj?.id || '');
    } else {
      setSelectedClientName('');
      setSelectedProjectId('');
    }

    setModalOpen(null);
    showToast(`Client "${nameToDelete}" has been deleted.`);
  };

  const clientProfilePanel = clientName && clientMeta ? (
    <div className="p-4 rounded-2xl border border-[#e8e6dd]/90 bg-white/80 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Client profile</span>
        <button
          type="button"
          onClick={() => setModalOpen('edit_client')}
          className="w-7 h-7 rounded-full bg-[#f4f5f8] hover:bg-[#7eb098]/15 text-gray-600 flex items-center justify-center cursor-pointer"
          title="Edit client"
        >
          <MoreHorizontal size={13} />
        </button>
      </div>
      <div className="text-center mb-4">
        <img src={clientMeta.avatar || `https://i.pravatar.cc/150?img=${Math.abs(clientName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 70}`} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md mx-auto" />
        <h3 className="font-fraunces text-lg font-bold text-[#191c20] mt-2">{clientName}</h3>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{clientMeta.poc}</p>
      </div>
      <div className="flex justify-center gap-2 mb-4">
        <button type="button" onClick={() => setActiveTab('activity')} className="w-9 h-9 rounded-full bg-[#f4f5f8] hover:bg-[#7eb098]/15 text-gray-600 flex items-center justify-center cursor-pointer" title="Log activity"><Activity size={14} /></button>
        <button type="button" onClick={() => showToast(`Draft email queued for ${clientMeta.poc}!`)} className="w-9 h-9 rounded-full bg-[#f4f5f8] hover:bg-[#7eb098]/15 text-gray-600 flex items-center justify-center cursor-pointer" title="Email"><Mail size={14} /></button>
        <button type="button" onClick={() => showToast('Call queued via integrations')} className="w-9 h-9 rounded-full bg-[#f4f5f8] hover:bg-[#7eb098]/15 text-gray-600 flex items-center justify-center cursor-pointer" title="Call"><Phone size={14} /></button>
      </div>
      {activeProject && (
        <button type="button" onClick={() => window.open(`/c/${activeProject.clientLink}`, '_blank')} className="w-full py-2.5 rounded-xl bg-[#484782] hover:bg-[#343362] text-white text-[9px] font-bold uppercase tracking-wider cursor-pointer mb-3">
          Open client portal
        </button>
      )}
      <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-3">
        <span className="w-2 h-2 rounded-full bg-[#7eb098]" />
        Last activity - {clientMeta.sentiment || 'Active'}
      </div>
      <div className="space-y-2 text-[11px]">
        <div className="flex justify-between gap-2"><span className="text-gray-400 font-bold uppercase text-[9px]">Email</span><span className="text-[#191c20] font-medium truncate">{clientMeta.email}</span></div>
        <div className="flex justify-between gap-2"><span className="text-gray-400 font-bold uppercase text-[9px]">POC</span><span className="text-[#191c20] font-medium">{clientMeta.poc}</span></div>
        <div className="flex justify-between gap-2"><span className="text-gray-400 font-bold uppercase text-[9px]">Priority</span><span className="text-[#191c20] font-medium">{clientMeta.priority}</span></div>
      </div>
    </div>
  ) : null;

return (
    <>
    <WorkspaceCrmShell
      profileCollapsed={isIndexCollapsed}
      profileRail={
        <>
        <div className={cn('flex mb-3 shrink-0', isIndexCollapsed ? 'justify-center' : 'justify-between items-start')}>
          {!isIndexCollapsed && (
            <div>
              <h3 className="font-fraunces text-[1.22rem] font-medium tracking-tight text-[#191c20]">Directory</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">Clients & projects</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsIndexCollapsed((c) => !c)}
            className="w-8 h-8 rounded-full bg-[#f4f5f8] hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer"
            title={isIndexCollapsed ? 'Expand directory' : 'Collapse directory'}
          >
            <ChevronRight size={14} className={cn('transition-transform', isIndexCollapsed ? '' : 'rotate-180')} />
          </button>
        </div>
        {!isIndexCollapsed ? (
        <>
        {/* Search & Actions */}
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7eb098] transition-colors" size={13} />
            <input
              type="text"
              placeholder="Search directory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200/40 rounded-full pl-9 pr-3 py-2 text-[12px] font-sans font-bold outline-none focus:border-[#7eb098]/40 focus:ring-4 focus:ring-[#7eb098]/10 transition-all text-[#191c20]"
            />
          </div>
          <div className="flex gap-1.5 shrink-0 select-none">
            <button
              type="button"
              onClick={() => setModalOpen('client')}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all shadow-sm shrink-0 hover:scale-105 active:scale-95 duration-200 cursor-pointer"
              title="Add Client"
            >
              <FolderPlus size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setNewProjClient(selectedClientName || Object.keys(clientMetadata)[0] || 'Acme Corp');
                setModalOpen('project');
              }}
              className="w-9 h-9 rounded-full bg-[#191c20] hover:bg-[#7eb098] text-white flex items-center justify-center transition-all shadow-sm shrink-0 hover:scale-105 active:scale-95 duration-200 cursor-pointer"
              title="New Project"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* Directory List */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
          {Object.keys(filteredGroups).length > 0 ? (
            Object.keys(filteredGroups).map((name) => {
              const group = filteredGroups[name];
              const meta = clientMetadata[name];
              const priority = meta?.priority ?? 'Standard';
              const isClientCollapsed = collapsedClients[name] ?? true;
              const isSelected = name === selectedClientName;
              const groupTotal = group.projects.reduce((sum, p) => sum + p.amount, 0);

              return (
                <div
                  key={name}
                  className={cn(
                    "rounded-[20px] border transition-all duration-300 overflow-hidden",
                    isSelected
                      ? "border-gray-200 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.08)] bg-white"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  )}
                >
                  <div className="flex items-center justify-between p-3 relative">
                    {isSelected && (
                      <div className="absolute top-3 left-0 w-1 h-10 rounded-r-md bg-[#7eb098]" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          toggleClientCollapse(name);
                          return;
                        }
                        setSelectedClientName(name);
                        const firstProj = group.projects[0];
                        if (firstProj) {
                          setSelectedProjectId(firstProj.id);
                        } else {
                          setSelectedProjectId('');
                        }
                        setCollapsedClients((prev) => ({ ...prev, [name]: false }));
                      }}
                      className="flex items-center gap-3 text-left flex-1 min-w-0 pl-1 cursor-pointer"
                    >
                      <img
                        src={meta?.avatar || `https://i.pravatar.cc/150?img=${Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 70}`}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border border-[#eceef0] shadow-sm shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-fraunces text-[13px] font-semibold text-[#191c20] truncate leading-tight">
                            {name}
                          </h4>
                          <span className={cn(
                            "px-1.5 py-0.2 rounded-full text-[7.5px] font-sans font-extrabold uppercase tracking-widest shrink-0 border",
                            priority === 'VIP' ? "bg-red-50 text-red-500 border-red-100/50" :
                            priority === 'Retainer' ? "bg-emerald-50 text-[#7eb098] border border-[#7eb098]/20" :
                            "bg-slate-50 text-slate-400 border border-slate-100"
                          )}>
                            {priority}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-sans font-bold mt-0.5 truncate">{group.projects.length} projects ({groupTotal > 0 ? `$${groupTotal.toLocaleString()}` : '$0'})</p>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => toggleClientCollapse(name)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      <ChevronRight size={13} className={cn("transition-transform duration-250", !isClientCollapsed ? "rotate-90" : "")} />
                    </button>
                  </div>

                  {!isClientCollapsed && (
                    <div className="border-t border-dashed border-gray-100 bg-white/50 p-2 space-y-1">
                      {group.projects.map((proj) => {
                        const isProjSelected = proj.id === selectedProjectId;
                        return (
                          <button
                            key={proj.id}
                            onClick={() => {
                              setSelectedClientName(name);
                              setSelectedProjectId(proj.id);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-xl border text-[11.5px] font-sans transition-all duration-200 flex items-center justify-between cursor-pointer",
                              isProjSelected
                                ? "bg-white border-[#7eb098]/30 shadow-3xs font-bold text-[#191c20]"
                                : "bg-transparent border-transparent hover:bg-slate-50 text-gray-600"
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div className={cn("w-1.5 h-1.5 rounded-full", isProjSelected ? "bg-[#7eb098] animate-pulse" : "bg-gray-300")} />
                              <span className="truncate">{proj.name}</span>
                            </div>
                            <span className="text-[9px] text-gray-400 font-sans font-extrabold uppercase shrink-0 bg-slate-100/50 px-1.5 py-0.5 rounded border border-gray-200/20">
                              {proj.status}
                            </span>
                          </button>
                        );
                      })}
                      {group.projects.length === 0 && (
                        <div className="py-3 text-center">
                          <p className="text-[10px] text-gray-400 font-sans font-bold uppercase">No projects listed</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 border border-dashed border-[#eceef0] rounded-2xl bg-slate-50/20">
              <Folder size={20} className="mx-auto text-gray-300 mb-2" />
              <p className="text-[12px] font-sans font-bold text-gray-500">Directory Empty</p>
              <p className="text-[9.5px] text-gray-400 font-sans uppercase mt-0.5 font-bold">No matches found</p>
            </div>
          )}
        </div>
        </>
        ) : (
          <div className="flex flex-col items-center flex-1 min-h-0 w-full py-1">
            <div className="flex-1 flex flex-col items-center gap-2.5 overflow-y-auto scrollbar-thin w-full py-1">
              {Object.keys(filteredGroups).map((name) => {
                const meta = clientMetadata[name];
                const isSelected = name === selectedClientName;
                const group = filteredGroups[name];
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => {
                      setSelectedClientName(name);
                      const firstProj = group.projects[0];
                      if (firstProj) setSelectedProjectId(firstProj.id);
                      else setSelectedProjectId('');
                      setCollapsedClients((prev) => ({ ...prev, [name]: false }));
                    }}
                    className={cn(
                      'relative shrink-0 rounded-full transition-transform hover:scale-105 cursor-pointer',
                      isSelected && 'ring-2 ring-[#7eb098] ring-offset-2 ring-offset-white'
                    )}
                  >
                    <img
                      src={meta?.avatar || `https://i.pravatar.cc/150?img=${Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 70}`}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
        </>
      }
      workspace={
        clientName ? (
          <div className="flex flex-col h-full min-h-0 flex-1 w-full min-w-0 overflow-hidden select-none items-stretch pt-0 px-0">
            <DeliveryFolder
              title={activeProject ? activeProject.name : clientName}
              meta={
                activeProject ? (
                  <div className="delivery-file-folder__meta-inner">
                    <span className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-widest shrink-0">
                      Project ID: {activeProject.id}
                    </span>
                    <span className="bg-[#7eb098]/15 text-[#7eb098] border border-[#7eb098]/30 px-2 py-0.5 rounded-full text-[8.5px] font-sans font-bold tracking-wide uppercase shrink-0">
                      Active delivery
                    </span>
                    <span className="text-[11px] font-sans font-bold text-gray-800 bg-gray-50 border border-[#eceef0] px-3 py-1 rounded-xl shrink-0">
                      Project total: ${activeProject.amount.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-sans font-bold text-gray-800 bg-gray-50 border border-[#eceef0] px-3 py-1 rounded-xl flex items-center gap-1.5 shrink-0">
                      <Clock size={12} className="text-gray-400" /> Due {activeProject.date}
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 font-sans font-bold text-right w-full">
                    Client workspace
                  </p>
                )
              }
            >
            <div className="flex flex-1 min-h-0 flex-col min-w-0">
            <div className="pb-2 mb-0 shrink-0 text-left px-5 lg:px-6 pt-2.5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <p className="text-[11px] text-gray-500 font-sans font-bold min-w-0">
                  {clientName}{activeProject ? ` ï¿½ ${activeProject.status}` : ''}
                </p>

                <div className="flex items-center gap-2 shrink-0 select-none flex-wrap lg:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setNewProjName('');
                      setNewProjClient(clientName);
                      setNewProjAmount('');
                      setNewProjDueDate('');
                      setNewProjScope('');
                      setModalOpen('project');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#191c20] hover:bg-black text-white text-[10px] font-sans font-extrabold uppercase tracking-wider cursor-pointer transition-all shadow-sm"
                  >
                    <Plus size={12} strokeWidth={2.5} /> New project
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setEditCliName(clientName);
                      setEditCliEmail(clientMeta.email);
                      setEditCliPoc(clientMeta.poc);
                      setEditCliPriority(clientMeta.priority);
                      setEditCliSentiment(clientMeta.sentiment);
                      setEditCliAvatar(clientMeta.avatar || `https://i.pravatar.cc/150?img=${Math.abs(clientName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 70}`);
                      setModalOpen('edit_client');
                    }}
                    className="bg-white border border-[#eceef0] hover:bg-gray-50 text-gray-600 text-[10px] font-sans font-extrabold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
                    title="Manage Client Settings"
                  >
                    <Settings size={11} /> Manage
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Downloading briefing folder...')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#eceef0] bg-white hover:bg-gray-50 text-gray-600 text-[10px] font-sans font-extrabold cursor-pointer transition-all"
                  >
                    <FileText size={11} /> Download brief
                  </button>
                  <button 
                    type="button"
                    onClick={() => showToast(`Draft email queued for ${clientMeta.poc}!`)}
                    className="w-9 h-9 rounded-full border border-[#eceef0] bg-white hover:bg-gray-50 text-gray-600 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                    title="Email Contact"
                  >
                    <Mail size={13} strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            </div>

            <div className="shrink-0 px-3 lg:px-4">
            <DeliveryFolderTabs
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'files', label: 'Files & portal', count: activeProject?.files.length ?? 0 },
                { id: 'messages', label: 'Messages' },
                { id: 'activity', label: 'Activity' },
                { id: 'notes', label: 'Notes' },
                { id: 'storage', label: 'Storage' },
                { id: 'billing', label: 'Billing' },
              ]}
              activeId={activeTab}
              onSelect={(id) => setActiveTab(id as typeof activeTab)}
            />
            </div>

            <div className="flex-1 w-full min-w-0 border-t border-gray-100 p-5 lg:p-6 relative overflow-hidden select-none flex flex-col min-h-0 -mt-px z-0">
              
              {!activeProject && ['overview', 'files', 'billing'].includes(activeTab) ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none bg-white border border-transparent rounded-[2.2rem] min-h-0">
                  <FolderPlus size={44} className="text-gray-300 mb-3" />
                  <h3 className="font-fraunces font-semibold text-lg text-gray-700">No Active Projects</h3>
                  <p className="text-xs text-gray-400 mt-1.5 max-w-xs mb-4">Set up a project delivery folder for {selectedClientName} to access this tab.</p>
                  <button
                    onClick={() => {
                      setNewProjClient(selectedClientName);
                      setModalOpen('project');
                    }}
                    className="bg-[#191c20] hover:bg-black text-white text-[11px] font-extrabold px-5 py-2.5 rounded-full shadow-sm cursor-pointer transition-all hover:scale-103 active:scale-97 duration-200 uppercase tracking-widest font-sans"
                  >
                    + Create Project
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden select-none">
                    {activeTab === 'overview' && activeProject && (() => {
                      const unlocked = activeProject.files.filter((f) => !f.locked).length;
                      const totalFiles = activeProject.files.length;
                      const portalViews = activeProject.accessConfig?.viewCount ?? 0;
                      const recentActivity = ACTIVITY_LOG_EVENTS.filter((e) => e.client === clientName).slice(0, 4);
                      const msgCount = (chatMessages[clientName] || []).length;
                      const taskDone = (clientTasks[clientName] || []).filter((t) => t.completed).length;
                      const taskTotal = (clientTasks[clientName] || []).length;
                      const paidSoFar = Math.round(activeProject.amount * 0.45);
                      const clientProjects = projectsList.filter((project) => project.client.name === clientName);
                      const clientFiles = clientProjects.flatMap((project) => project.files);
                      const tabLinks = [
                        { id: 'files' as const, label: 'Files & portal', detail: `${unlocked}/${totalFiles} unlocked`, count: totalFiles },
                        { id: 'messages' as const, label: 'Messages', detail: `Chat with ${clientMeta.poc}`, count: msgCount },
                        { id: 'activity' as const, label: 'Activity', detail: 'Timeline & insights', count: recentActivity.length },
                        { id: 'notes' as const, label: 'Notes', detail: `${taskDone}/${taskTotal} steps done`, count: taskTotal },
                        { id: 'storage' as const, label: 'Storage', detail: `${clientProjects.length} folders`, count: clientFiles.length },
                        { id: 'billing' as const, label: 'Billing', detail: `$${paidSoFar.toLocaleString()} received`, count: 0 },
                      ];
                      return (
                        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 scrollbar-thin space-y-4 text-left">
                          <div className="rounded-2xl border border-gray-100 bg-[#f4f5f8]/60 p-4 flex flex-wrap items-center gap-4">
                            <img
                              src={clientMeta.avatar || `https://i.pravatar.cc/150?img=${Math.abs(clientName.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 70}`}
                              alt=""
                              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-fraunces text-lg font-bold text-[#191c20]">{clientName}</h3>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {clientMeta.poc} ï¿½ {clientMeta.email} ï¿½ {clientMeta.priority} ï¿½ {clientMeta.sentiment}
                              </p>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Project hub</span>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                              { label: 'Contract', value: `$${activeProject.amount.toLocaleString()}`, sub: activeProject.status },
                              { label: 'Due date', value: activeProject.date, sub: 'Delivery target' },
                              { label: 'Portal visits', value: String(portalViews), sub: 'Client opens' },
                              { label: 'Assets live', value: `${unlocked}/${totalFiles}`, sub: 'Unlocked in portal' },
                            ].map((stat) => (
                              <div key={stat.label} className="bg-[#f4f5f8] border border-gray-100 rounded-2xl p-4">
                                <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</span>
                                <p className="font-fraunces text-xl font-bold text-[#191c20] mt-1">{stat.value}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">{stat.sub}</p>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                            <div className="lg:col-span-7 bg-white border border-gray-100 rounded-[2rem] p-5 shadow-3xs">
                              <div className="flex items-start justify-between gap-3 mb-4">
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Delivery snapshot</span>
                                  <h3 className="font-fraunces text-lg font-bold text-[#191c20] mt-0.5">{activeProject.name}</h3>
                                  <p className="text-[11px] text-gray-500 mt-1">
                                    Client last opened portal <span className="font-bold text-[#191c20]">{activeProject.clientViewedAt || 'never'}</span>
                                  </p>
                                </div>
                                <span className={cn(
                                  'px-3 py-1 rounded-full text-[9px] font-bold uppercase border',
                                  activeProject.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                  activeProject.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                  'bg-indigo-50 text-indigo-700 border-indigo-100'
                                )}>
                                  {activeProject.status}
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                                  <span>Portal unlock progress</span>
                                  <span className="text-[#191c20]">{unlocked} of {totalFiles || 0} files</span>
                                </div>
                                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                  <div className="h-full bg-[#7eb098] transition-all" style={{ width: `${totalFiles ? (unlocked / totalFiles) * 100 : 0}%` }} />
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-5">
                                <button type="button" onClick={() => setActiveTab('files')} className="px-3 py-2 rounded-xl bg-[#191c20] text-white text-[9px] font-bold uppercase cursor-pointer">Manage files</button>
                                <button type="button" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/c/${activeProject.clientLink}`); showToast('Portal link copied'); }} className="px-3 py-2 rounded-xl border border-gray-200 text-[9px] font-bold uppercase cursor-pointer">Copy link</button>
                                <button type="button" onClick={toggleLockAllFiles} className="px-3 py-2 rounded-xl border border-gray-200 text-[9px] font-bold uppercase cursor-pointer">
                                  {activeProject.files.every((f) => f.locked) ? 'Unlock all' : 'Lock all'}
                                </button>
                              </div>
                            </div>

                            <div className="lg:col-span-5 bg-white border border-gray-100 rounded-[2rem] p-5 shadow-3xs flex flex-col">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Recent portal activity</span>
                              <div className="mt-3 space-y-2 flex-1">
                                {recentActivity.length > 0 ? recentActivity.map((ev) => (
                                  <div key={ev.id} className="p-3 rounded-xl border border-gray-100 bg-[#fafbfc]">
                                    <p className="text-[11px] font-bold text-[#191c20]">{ev.title}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{ev.time} ï¿½ {ev.description}</p>
                                  </div>
                                )) : (
                                  <p className="text-[11px] text-gray-400 py-6 text-center">No recent activity logged</p>
                                )}
                              </div>
                              <button type="button" onClick={() => setActiveTab('activity')} className="mt-3 text-[10px] font-bold text-[#7eb098] uppercase tracking-wider cursor-pointer text-left">
                                View full activity ?
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            {tabLinks.map((tab) => (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className="text-left p-3.5 rounded-2xl border border-gray-100 bg-white hover:border-[#7eb098]/35 hover:shadow-sm transition-all cursor-pointer"
                              >
                                <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{tab.label}</span>
                                <p className="text-[11px] font-bold text-[#191c20] mt-1 leading-snug">{tab.detail}</p>
                                {tab.count > 0 && (
                                  <span className="inline-block mt-1.5 text-[8px] font-bold bg-[#f4f5f8] text-gray-600 px-1.5 py-0.5 rounded-full">
                                    {tab.count} items
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {activeTab === 'files' && activeProject && (
                      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 scrollbar-thin">
                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 text-left items-start">
                        {/* Left: delivery assets */}
                        <div className="xl:col-span-7 flex flex-col gap-3 min-w-0 self-start w-full">
                          <div className="bg-white border border-gray-100 rounded-[2rem] p-4 shadow-3xs">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-wider">Upload deliverables</span>
                              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[8px] font-bold">AES-256</span>
                            </div>
                            <div
                              onClick={handleDropzoneClick}
                              className="border-2 border-dashed border-[#e4e7ec] hover:border-[#7eb098] hover:bg-[#7eb098]/5 rounded-2xl p-5 text-center cursor-pointer flex flex-col items-center justify-center gap-2 group/drop"
                            >
                              <UploadCloud size={22} className="text-gray-400 group-hover/drop:text-[#7eb098]" />
                              <p className="text-[12px] font-extrabold text-[#191c20]">Drop files or click to upload</p>
                            </div>
                            {localUploadedFiles.length > 0 && (
                              <div className="space-y-2 mt-3">
                                {localUploadedFiles.map(file => (
                                  <div key={file.id} className="p-3 bg-slate-50 rounded-xl border border-gray-100 text-[11px] font-sans">
                                    <div className="flex justify-between font-bold text-gray-700">
                                      <span className="truncate">{file.name}</span>
                                      <span className="text-[#7eb098]">{file.progress}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <span className="text-[11px] font-sans font-bold text-[#9ba0a8] uppercase tracking-widest pl-1">
                              Delivery assets ({activeProject.files.length})
                            </span>
                            {activeProject.files.length > 0 ? (
                              <div
                                onMouseLeave={hideAssetPreview}
                                className="space-y-2 bg-slate-50/50 p-3 border border-gray-100 rounded-[2rem] max-h-[min(420px,calc(100vh-420px))] overflow-y-auto scrollbar-thin"
                              >
                              {activeProject.files.map((file, fIdx) => {
                                const fileIcons = {
                                  pdf: FileText,
                                  image: ImageIcon,
                                  video: Video,
                                  archive: Folder,
                                  audio: Music,
                                  generic: FileText
                                };
                                const FileIcon = fileIcons[file.type] || fileIcons.generic;
                                return (
                                  <div 
                                    key={fIdx} 
                                    onMouseEnter={(event) => showAssetPreview(file, event)}
                                    className="border border-gray-100 rounded-xl p-3 flex items-center gap-3 transition-all duration-300 group/file select-none shadow-sm relative overflow-hidden bg-white cursor-pointer hover:shadow-md hover:bg-gray-50/80 shrink-0 h-auto"
                                  >
                                    <div className="w-8.5 h-8.5 rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-3xs bg-white border border-gray-100/50">
                                      {file.type === 'image' && file.previewUrl ? (
                                        <img src={file.previewUrl} alt="" className="w-full h-full object-cover animate-fade-in" />
                                      ) : (
                                        <FileIcon size={14} className="opacity-80" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1 text-left">
                                      <p className="text-[11px] font-sans font-bold text-gray-700 truncate leading-snug">{file.name}</p>
                                      <p className="text-[9px] font-sans font-extrabold text-gray-400 mt-0.5 uppercase tracking-wider">{file.size}</p>
                                    </div>
                                    <div className="flex gap-1.5 relative z-10 select-none">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleFilePortalLock(activeProject.id, file.name);
                                        }}
                                        className={cn(
                                          "w-7.5 h-7.5 rounded-full border flex items-center justify-center transition-all duration-250 shadow-3xs shrink-0 cursor-pointer hover:scale-105 active:scale-95",
                                          file.locked 
                                            ? "bg-amber-50/50 border-amber-100 text-amber-600 hover:bg-amber-50 hover:text-amber-700" 
                                            : "bg-emerald-50/50 border-emerald-100 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
                                        )}
                                        title={file.locked ? "Unlock File" : "Lock File"}
                                      >
                                        {file.locked ? <EyeOff size={11} strokeWidth={2.4} /> : <Eye size={11} strokeWidth={2.4} />}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setProjectsList(prev => prev.map(p => {
                                            if (p.id === activeProject.id) {
                                              return {
                                                ...p,
                                                files: p.files.filter(f => f.name !== file.name)
                                              };
                                            }
                                            return p;
                                          }));
                                          showToast("File removed from portal.");
                                        }}
                                        className="w-7.5 h-7.5 rounded-full border border-red-100 text-red-500 bg-red-50/20 flex items-center justify-center transition-all hover:bg-red-50 hover:text-red-650 cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                                        title="Delete File"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-10 text-center border border-dashed border-[#eceef0] bg-gray-50/20 rounded-[2rem] select-none">
                              <p className="text-xs text-gray-400 font-sans font-bold">No deliverables uploaded in this project</p>
                            </div>
                          )}
                          </div>
                        </div>

                        {/* Right: client portal */}
                        <div className="xl:col-span-5 flex flex-col gap-3 self-start w-full">
                          <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-3xs flex flex-col gap-4">
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Client portal</span>
                              <h4 className="font-fraunces font-bold text-lg text-[#191c20] mt-1">Delivery access</h4>
                              <p className="text-[11px] text-gray-500 mt-1">Preview exactly what your client sees when files are unlocked.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => window.open(`/c/${activeProject.clientLink}`, '_blank')}
                              className="w-full py-3.5 rounded-xl bg-[#484782] hover:bg-[#343362] text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Eye size={14} /> Launch client portal preview
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  window.open(`/c/${activeProject.clientLink}`, '_blank');
                                  showToast('Edit portal layout in client preview');
                                }}
                                className="py-2.5 rounded-xl border border-[#484782]/25 bg-[#484782]/5 hover:bg-[#484782]/10 text-[#484782] text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <LayoutDashboard size={12} /> Edit portal
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewProjName(activeProject.name);
                                  setNewProjClient(clientName);
                                  setNewProjAmount(String(activeProject.amount));
                                  setNewProjDueDate(activeProject.date);
                                  setNewProjScope('');
                                  setModalOpen('project');
                                }}
                                className="py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Settings size={12} /> Edit project
                              </button>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-gray-600 space-y-1.5">
                              <p><strong>Magic link:</strong> <code className="text-[#191c20] font-bold">/c/{activeProject.clientLink}</code></p>
                              <p><strong>Status:</strong> {activeProject.files.every(f => f.locked) ? <span className="text-[#ff5b4f] font-bold">Locked</span> : <span className="text-[#7eb098] font-bold">Active</span>}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/c/${activeProject.clientLink}`);
                                showToast('Project portal URL copied!');
                              }}
                              className="w-full py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Copy size={12} /> Copy portal link
                            </button>
                          </div>
                          <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-3xs flex flex-col items-center gap-3 text-center">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 w-full text-left">Mobile QR</span>
                            <div className="p-3 border border-gray-100 bg-slate-50 rounded-xl">
                              <QrCode size={72} className="text-gray-800 mx-auto" strokeWidth={1.2} />
                            </div>
                            <p className="text-[10px] text-gray-400">Scan for instant portal access on phone.</p>
                            <button
                              type="button"
                              onClick={() => showToast('Downloading QR Code asset pack...')}
                              className="text-[10px] font-bold text-[#484782] uppercase tracking-wider cursor-pointer"
                            >
                              Download print copy
                            </button>
                          </div>
                        </div>
                      </div>
                      </div>
                    )}

                    {activeTab === 'activity' && (
                      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 scrollbar-thin">
                        {/* SubTab Toggle */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-5 select-none text-left">
                          <div>
                            <span className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-widest">Delivery activity</span>
                            <h4 className="font-fraunces text-md font-bold leading-tight text-[#191c20] mt-0.5">Timeline & delivery insights</h4>
                          </div>
                          
                          <div className="bg-gray-50 p-0.5 rounded-xl flex border border-[#eceef0] shadow-3xs shrink-0 select-none">
                            <button
                              type="button"
                              onClick={() => setActivitySubTab('timeline')}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-[9px] font-sans font-extrabold uppercase tracking-wider cursor-pointer transition-all",
                                activitySubTab === 'timeline' 
                                  ? "bg-white text-gray-800 shadow-3xs" 
                                  : "text-gray-400 hover:text-gray-700"
                              )}
                            >
                              Timeline
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivitySubTab('reports')}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-[9px] font-sans font-extrabold uppercase tracking-wider cursor-pointer transition-all",
                                activitySubTab === 'reports' 
                                  ? "bg-white text-gray-800 shadow-3xs" 
                                  : "text-gray-400 hover:text-gray-700"
                              )}
                            >
                              Insights
                            </button>
                          </div>
                        </div>

                        {activitySubTab === 'timeline' ? (
                          <>
                            {ACTIVITY_LOG_EVENTS.filter(e => e.client === clientName).length > 0 ? (
                              <div className="space-y-6 relative pl-6 border-l-2 border-gray-100 ml-3 py-2 text-left">
                                {ACTIVITY_LOG_EVENTS.filter(e => e.client === clientName).map((event) => {
                                  const EventIcon = event.icon || Activity;
                                  const isAccess = event.type === 'access';
                                  const isFinancial = event.type === 'financial';
                                  const spineColor = isFinancial ? 'bg-[#7eb098]' : isAccess ? 'bg-[#e0cd94]' : 'bg-[#3d4f8f]';
                                  return (
                                    <div key={event.id} className="relative group/evt">
                                      <span className={cn(
                                        "absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-white flex items-center justify-center shadow-sm transition-transform duration-300 group-hover/evt:scale-110",
                                        spineColor
                                      )}>
                                        <EventIcon size={6} className="text-white" />
                                      </span>
                                      
                                      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-3xs flex flex-col gap-2.5 transition-all duration-300 hover:shadow-2xs">
                                        <div className="flex justify-between items-start font-sans">
                                          <div>
                                            <h5 className="text-[13px] font-fraunces font-bold text-gray-800">{event.title}</h5>
                                            <p className="text-[11px] text-gray-500 font-sans mt-0.5">{event.description}</p>
                                          </div>
                                          <div className="flex flex-col items-end text-right">
                                            <span className="text-[9px] font-sans font-bold text-gray-400">{event.time}</span>
                                            {event.amount && (
                                              <span className={cn("text-xs font-sans font-bold mt-0.5", event.isAmountPositive ? "text-emerald-600" : "text-gray-700")}>
                                                {event.amount}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {event.details && (
                                          <div className="text-[10px] bg-slate-50/50 border border-gray-50 rounded-xl p-3 text-gray-500 font-sans flex flex-col gap-1">
                                            {event.details.portalUrl && <p><strong className="text-gray-600 font-bold">Portal URL:</strong> {event.details.portalUrl}</p>}
                                            {event.details.browser && <p><strong className="text-gray-600 font-bold">Source:</strong> {event.details.browser} ({event.details.ipAddress})</p>}
                                            {event.details.paymentMethod && <p><strong className="text-gray-600">Method:</strong> {event.details.paymentMethod}</p>}
                                            {event.details.transactionId && <p><strong className="text-gray-600 font-bold">Transaction Ref:</strong> <code className="bg-white border border-gray-100 px-1 py-0.2 rounded font-sans font-bold text-[9px]">{event.details.transactionId}</code></p>}
                                            {event.details.files && event.details.files.length > 0 && (
                                              <p className="mt-1 flex items-center gap-1.5 wrap">
                                                <strong className="text-gray-600 font-bold">Files viewed:</strong>
                                                {event.details.files.map((f, fi) => (
                                                  <span key={fi} className="bg-white border border-gray-100 rounded px-1.5 py-0.5 text-[8.5px] font-sans font-bold text-gray-500 shadow-3xs">{f.name}</span>
                                                ))}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="p-8 text-center border border-dashed border-[#eceef0] bg-gray-50/20 rounded-[2rem] select-none">
                                <p className="text-xs text-gray-400 font-sans font-bold">No activity log entries found for this client</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="space-y-4 text-left font-sans">
                            {(() => {
                              const group = clientGroups[clientName];
                              const projects = group?.projects ?? [];
                              const totalFiles = projects.reduce((acc, p) => acc + p.files.length, 0);
                              const unlockedFiles = projects.reduce((acc, p) => acc + p.files.filter((f) => !f.locked).length, 0);
                              const paidProjects = projects.filter((p) => p.status === 'Paid').length;
                              const accessEvents = ACTIVITY_LOG_EVENTS.filter((e) => e.client === clientName && e.type === 'access').length;
                              const financialEvents = ACTIVITY_LOG_EVENTS.filter((e) => e.client === clientName && e.type === 'financial').length;
                              const monthLabels = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
                              const maxSpark = Math.max(...clientMeta.sparklineHistory, 1);

                              return (
                                <>
                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {[
                                      { label: 'Portal opens', value: clientMeta.sparklineHistory.reduce((a, b) => a + b, 0), hint: 'Last 6 periods' },
                                      { label: 'Files delivered', value: totalFiles, hint: `${unlockedFiles} unlocked` },
                                      { label: 'Paid projects', value: `${paidProjects}/${projects.length}`, hint: 'Billing cleared' },
                                      { label: 'Access events', value: accessEvents, hint: `${financialEvents} payments logged` },
                                    ].map((m) => (
                                      <div key={m.label} className="bg-[#f4f5f8] border border-gray-100 rounded-2xl p-4">
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{m.label}</span>
                                        <p className="font-fraunces text-2xl font-bold text-[#191c20] mt-1">{m.value}</p>
                                        <p className="text-[10px] text-gray-500">{m.hint}</p>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    <div className="bg-white border border-gray-100 rounded-2xl p-5">
                                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Portal engagement</span>
                                      <h5 className="font-fraunces text-base font-bold text-[#191c20] mt-1 mb-4">Visits by period</h5>
                                      <div className="flex items-end gap-2 h-36">
                                        {clientMeta.sparklineHistory.map((val, idx) => (
                                          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                            <div
                                              className="w-full rounded-t-lg bg-[#7eb098]/80 min-h-[4px] transition-all"
                                              style={{ height: `${(val / maxSpark) * 100}%` }}
                                              title={`${val} visits`}
                                            />
                                            <span className="text-[8px] font-bold text-gray-400">{monthLabels[idx]}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="bg-white border border-gray-100 rounded-2xl p-5">
                                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Per project</span>
                                      <h5 className="font-fraunces text-base font-bold text-[#191c20] mt-1 mb-3">Delivery health</h5>
                                      <div className="space-y-2.5">
                                        {projects.length > 0 ? projects.map((proj) => {
                                          const projUnlocked = proj.files.filter((f) => !f.locked).length;
                                          const pct = proj.files.length ? Math.round((projUnlocked / proj.files.length) * 100) : 0;
                                          return (
                                            <div key={proj.id} className="p-3 rounded-xl border border-gray-100 bg-[#fafbfc]">
                                              <div className="flex justify-between gap-2 mb-1.5">
                                                <p className="text-[11px] font-bold text-[#191c20] truncate">{proj.name}</p>
                                                <span className="text-[9px] font-bold text-gray-500 shrink-0">{proj.status}</span>
                                              </div>
                                              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                                <div className="h-full bg-[#7eb098]" style={{ width: `${pct}%` }} />
                                              </div>
                                              <p className="text-[9px] text-gray-400 mt-1">{projUnlocked}/{proj.files.length} assets visible ï¿½ ${proj.amount.toLocaleString()}</p>
                                            </div>
                                          );
                                        }) : (
                                          <p className="text-[11px] text-gray-400 text-center py-6">No projects to analyze</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-white border border-gray-100 rounded-2xl p-5">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Relationship</span>
                                    <div className="flex flex-wrap gap-4 mt-3 text-[11px]">
                                      <p><span className="text-gray-400">Sentiment</span> <span className="font-bold text-[#191c20] ml-1">{clientMeta.sentiment}</span></p>
                                      <p><span className="text-gray-400">Priority</span> <span className="font-bold text-[#191c20] ml-1">{clientMeta.priority}</span></p>
                                      <p><span className="text-gray-400">POC</span> <span className="font-bold text-[#191c20] ml-1">{clientMeta.poc}</span></p>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'storage' && (
                      <StorageOverviewPanel
                        projectsList={projectsList}
                        activeProject={activeProject}
                        clientName={clientName}
                      />
                    )}

                    {activeTab === 'notes' && (
                      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 text-left min-h-0 overflow-hidden">
                        <div className="lg:col-span-8 flex flex-col gap-3 min-h-0 overflow-hidden">
                          <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-[#9ba0a8]">Internal briefing</span>
                                <h4 className="font-fraunces text-xl font-bold text-[#191c20] mt-1">
                                  {activeProject ? `${activeProject.name} notes` : `${clientName} notes`}
                                </h4>
                                <p className="text-[11px] text-gray-500 mt-1 font-sans">
                                  Private coordination for {clientMeta.poc} ï¿½ not visible to clients.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => showToast('Project notes saved!')}
                                className="shrink-0 px-4 py-2 rounded-xl bg-[#191c20] hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                              >
                                Save notes
                              </button>
                            </div>
                            {isEditingNotes ? (
                              <textarea
                                autoFocus
                                value={clientNotes[clientName] || ''}
                                onChange={(e) => setClientNotes({ ...clientNotes, [clientName]: e.target.value })}
                                onBlur={() => {
                                  // Add a tiny delay to allow clicking the Save button without race conditions
                                  setTimeout(() => setIsEditingNotes(false), 200);
                                }}
                                placeholder="Scope changes, approval context, delivery instructions, follow-ups..."
                                className={cn(
                                  'flex-1 min-h-[160px] w-full rounded-2xl border border-gray-250 bg-white px-4 py-3 text-[14px] font-sans text-gray-700 leading-relaxed outline-none resize-none focus:border-[#7eb098]/40 focus:ring-2 focus:ring-[#7eb098]/15 overflow-y-auto scrollbar-thin',
                                  notesHighlightClient === clientName && 'animate-briefing-note-highlight'
                                )}
                              />
                            ) : (
                              <div
                                onClick={() => setIsEditingNotes(true)}
                                className={cn(
                                  'flex-1 min-h-[160px] w-full rounded-2xl border border-gray-200/80 bg-gray-50/15 hover:bg-gray-50/35 hover:border-gray-300 px-4 py-3 text-[14px] font-sans text-gray-700 leading-relaxed outline-none overflow-y-auto scrollbar-thin cursor-text transition-all duration-200 text-left',
                                  notesHighlightClient === clientName && 'animate-briefing-note-highlight'
                                )}
                                title="Click to edit notes"
                              >
                                <div className="space-y-1">
                                  {parseNotesToHtml(clientNotes[clientName] || '')}
                                </div>
                                <div className="text-[9px] text-gray-400 mt-6 select-none font-sans font-bold uppercase tracking-widest text-right cursor-pointer hover:text-gray-600 transition-colors">
                                  ? Click to Edit Notes
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="lg:col-span-4 flex flex-col gap-3 min-h-0">
                          <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-3xs shrink-0">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">At a glance</span>
                            <div className="mt-3 space-y-2 text-[11px] font-sans">
                              <p><span className="text-gray-400">POC</span> <span className="font-bold text-[#191c20]">{clientMeta.poc}</span></p>
                              <p><span className="text-gray-400">Sentiment</span> <span className="font-bold text-[#191c20]">{clientMeta.sentiment}</span></p>
                              <p><span className="text-gray-400">Priority</span> <span className="font-bold text-[#191c20]">{clientMeta.priority}</span></p>
                            </div>
                          </div>
                          <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-3xs flex flex-col gap-3 flex-1 min-h-0">
                            <div className="flex items-center justify-between shrink-0">
                              <div>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Checklist</span>
                                <h4 className="font-fraunces text-base font-bold text-[#191c20] mt-0.5">Deliverable steps</h4>
                              </div>
                              <span className="text-[9px] font-bold text-[#7eb098] bg-[#7eb098]/10 px-2 py-0.5 rounded-full">
                                {(clientTasks[clientName] || []).filter((t) => t.completed).length}/{(clientTasks[clientName] || []).length}
                              </span>
                            </div>
                            <div className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
                              {(clientTasks[clientName] || []).map((task) => (
                                <label key={task.id} className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={() => toggleClientTask(clientName, task.id)}
                                    className="mt-0.5 accent-[#7eb098] cursor-pointer"
                                  />
                                  <span className={cn('text-xs font-medium text-gray-700', task.completed && 'line-through text-gray-400')}>
                                    {task.text}
                                  </span>
                                </label>
                              ))}
                            </div>
                            <form onSubmit={(e) => handleAddTodo(e, clientName)} className="flex gap-2 pt-2 border-t border-gray-100">
                              <input
                                type="text"
                                placeholder="Add step..."
                                value={newTodoText}
                                onChange={(e) => setNewTodoText(e.target.value)}
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none"
                              />
                              <button type="submit" className="bg-[#191c20] text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer">
                                Add
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'billing' && activeProject && (() => {
                      const total = activeProject.amount;
                      const paidSoFar = Math.round(total * 0.45);
                      const waitingOnClient = Math.round(total * 0.15);
                      const stillOwed = total - paidSoFar;
                      const stripeInvoices = [
                        { id: 'inv-1', label: 'Phase 2 ï¿½ Wireframes', amount: Math.round(total * 0.25), status: 'Paid', date: 'May 3' },
                        { id: 'inv-2', label: 'Phase 3 ï¿½ Handover package', amount: waitingOnClient, status: 'Open', date: 'May 22' },
                      ];
                      return (
                        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 scrollbar-thin gap-4 text-left select-none font-sans">
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                            {[
                              { label: 'Project total', value: `$${total.toLocaleString()}` },
                              { label: 'Received', value: `$${paidSoFar.toLocaleString()}` },
                              { label: 'Open on Stripe', value: `$${waitingOnClient.toLocaleString()}` },
                              { label: 'Still to collect', value: `$${stillOwed.toLocaleString()}` },
                            ].map((s) => (
                              <div key={s.label} className="rounded-2xl border border-gray-100 bg-[#f4f5f8] p-4">
                                <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{s.label}</span>
                                <p className="font-fraunces text-xl font-bold text-[#191c20] mt-1">{s.value}</p>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
                            <div className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-3xs flex flex-col min-h-[280px]">
                              <div className="flex items-start justify-between gap-3 mb-4">
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Stripe</span>
                                  <h4 className="font-fraunces text-lg font-bold text-[#191c20] mt-0.5">Card & bank payments</h4>
                                  <p className="text-[11px] text-gray-500 mt-1">Send invoices and let {clientName} pay online.</p>
                                </div>
                                <span className="text-[9px] font-bold text-[#7eb098] bg-[#7eb098]/10 border border-[#7eb098]/25 px-2 py-1 rounded-full">Connected</span>
                              </div>
                              <ul className="space-y-2 flex-1 min-h-0 overflow-y-auto scrollbar-thin pr-1">
                                {stripeInvoices.map((inv) => (
                                  <li key={inv.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-[#fafbfc]">
                                    <div className="min-w-0">
                                      <p className="text-[12px] font-bold text-[#191c20] truncate">{inv.label}</p>
                                      <p className="text-[10px] text-gray-500">{inv.date}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="font-fraunces text-base font-bold text-[#191c20]">${inv.amount.toLocaleString()}</p>
                                      <span className={cn('text-[8px] font-bold uppercase', inv.status === 'Paid' ? 'text-[#5a8f76]' : 'text-amber-700')}>{inv.status}</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100 shrink-0">
                                <button type="button" onClick={() => showToast('Stripe invoice created')} className="px-3 py-2 rounded-xl bg-[#191c20] text-white text-[9px] font-bold uppercase cursor-pointer">New Stripe invoice</button>
                                <button type="button" onClick={() => showToast('Payment link copied')} className="px-3 py-2 rounded-xl border border-gray-200 text-[9px] font-bold uppercase cursor-pointer">Copy pay link</button>
                              </div>
                            </div>

                            <div className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-3xs flex flex-col min-h-[280px]">
                              <div className="mb-4">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Off-platform</span>
                                <h4 className="font-fraunces text-lg font-bold text-[#191c20] mt-0.5">Manual payment details</h4>
                                <p className="text-[11px] text-gray-500 mt-1">Share with {clientMeta.poc} when they pay outside Stripe.</p>
                              </div>
                              <div className="space-y-3 flex-1 text-[12px]">
                                {[
                                  { method: 'Zelle', detail: 'jennifer.rass@freelance.com' },
                                  { method: 'Venmo', detail: '@JenniferRassCreative' },
                                  { method: 'Bank transfer', detail: 'Chase ï¿½ï¿½ï¿½ï¿½4821 ï¿½ Routing 021000021' },
                                ].map((row) => (
                                  <div key={row.method} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-[#fafbfc]">
                                    <span className="font-bold text-[#191c20]">{row.method}</span>
                                    <code className="text-[10px] text-gray-600 bg-white border border-gray-100 px-2 py-0.5 rounded-lg">{row.detail}</code>
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] text-gray-500 mt-3 shrink-0">
                                Mark manual payments in Activity when the client confirms ï¿½ they will not auto-sync from Zelle or Venmo.
                              </p>
                              <button type="button" onClick={() => showToast('Manual payment instructions copied')} className="mt-3 w-full py-2.5 rounded-xl border border-gray-200 text-[9px] font-bold uppercase cursor-pointer shrink-0">
                                Copy all instructions for client
                              </button>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
                            <p className="text-[11px] text-gray-600 max-w-xl">
                              Client sees Stripe checkout when you send an invoice link. Off-platform methods are for your messages and brief only.
                            </p>
                            <button type="button" onClick={() => showToast('Payment reminder sent')} className="px-4 py-2 rounded-xl bg-[#191c20] text-white text-[10px] font-bold uppercase cursor-pointer">
                              Send payment reminder
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {activeTab === 'messages' && (
                      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white border border-gray-100 rounded-[2.2rem] p-6 shadow-3xs text-left">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3 shrink-0 select-none">
                          <div>
                            <h4 className="font-fraunces font-bold text-md text-gray-800">Direct Chat with {clientMeta.poc}</h4>
                            <p className="text-[10px] text-gray-405 font-sans mt-0.5">Chat Log</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7eb098] animate-pulse" />
                            <span className="text-[9px] font-sans font-bold text-gray-405 uppercase tracking-widest">Client Online</span>
                          </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 pt-4 pb-1 space-y-5 scrollbar-thin chat-thread">
                          {(chatMessages[clientName] || []).map((msg) => {
                            const isUser = msg.sender === 'user';
                            return (
                              <div key={msg.id} className={cn('flex flex-col', isUser ? 'ml-auto items-end max-w-[82%]' : 'mr-auto items-start max-w-[80%]')}>
                                <div className={cn('chat-bubble', isUser ? 'chat-bubble-user' : 'chat-bubble-client')}>
                                  {msg.text}
                                </div>
                                <span className={cn('chat-meta mt-2 px-1', isUser ? 'text-right' : 'text-left')}>
                                  {isUser ? 'You' : clientMeta.poc} ï¿½ {msg.time}
                                </span>
                              </div>
                            );
                          })}

                          {isTyping && (
                            <div className="flex items-center gap-2 max-w-[80%] text-gray-400 text-[10px] font-sans animate-pulse">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#e0cd94] animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-1.5 h-1.5 rounded-full bg-[#e0cd94] animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-1.5 h-1.5 rounded-full bg-[#e0cd94] animate-bounce" style={{ animationDelay: '300ms' }} />
                              <span>{isTyping}</span>
                            </div>
                          )}
                          <div ref={chatBottomRef} />
                        </div>

                        <form onSubmit={handleSendChatMessage} className="border-t border-gray-50 pt-4 mt-3 flex gap-2.5 shrink-0 select-none font-sans">
                          <input 
                            type="text" 
                            placeholder={`Message ${clientMeta.poc}...`} 
                            value={typedMessage}
                            onChange={(e) => setTypedMessage(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-100 hover:bg-slate-50/85 focus:bg-white rounded-xl px-4 py-2.5 text-xs text-gray-800 outline-none placeholder-gray-400 transition-all font-sans font-medium"
                          />
                          <button 
                            type="submit" 
                            className="bg-[#191c20] hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-sans font-bold transition-all shrink-0 cursor-pointer"
                          >
                            Send
                          </button>
                        </form>
                      </div>
                    )}

                </div>
              )}

              {/* Portal File preview popup overlays */}
              {hoveredAsset && typeof document !== 'undefined' && createPortal(
                <div
                  className={cn(
                    "pointer-events-none fixed z-[9999] animate-asset-preview-in transform-gpu will-change-transform",
                    hoveredAsset.placement === 'above' && "-translate-y-full"
                  )}
                  style={{ left: hoveredAsset.left, top: hoveredAsset.top }}
                >
                  <ProjectAssetPreview file={hoveredAsset.file} />
                </div>,
                document.body
              )}

            </div>
            </div>
            </DeliveryFolder>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16 min-h-[320px] select-none">
            <Folder size={48} className="text-gray-300 mb-3" />
            <h3 className="font-fraunces font-semibold text-lg text-gray-700">No client selected</h3>
            <p className="text-xs text-gray-400 mt-1.5 max-w-xs">Choose a client from the directory to open their project workspace.</p>
          </div>
        )
      }
      contextRail={
        clientName && clientMeta ? (
          <>
            {clientProfilePanel}
            {/* Freelancer Profile replacing Company */}
            <div className="p-4 rounded-2xl border border-gray-100 bg-white">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Freelancer Profile</p>
              <p className="font-fraunces text-sm font-semibold text-[#191c20]">Jennifer Raas</p>
              <p className="text-[10px] text-gray-500 mt-1 truncate">jennifer.raas@freelance.com</p>
              <div className="mt-2.5 pt-2 border-t border-gray-50 text-[10px] text-gray-500 space-y-1">
                <p><span className="font-bold text-[#191c20]">Zelle:</span> jennifer.raas@freelance.com</p>
                <p><span className="font-bold text-[#191c20]">Venmo:</span> @JenniferRaasCreative</p>
              </div>
            </div>

            {/* Recent Activity card */}
            <div className="p-4 rounded-2xl border border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Recent Activity</p>
                <button type="button" onClick={() => setActiveTab('activity')} className="text-[9px] font-bold text-[#7eb098] uppercase tracking-wider hover:underline cursor-pointer">View All</button>
              </div>
              <div className="space-y-2">
                {ACTIVITY_LOG_EVENTS.filter((e) => e.client === clientName).slice(0, 2).map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-xl border border-gray-50 bg-[#fafbfc]">
                    <p className="text-[10px] font-bold text-[#191c20] leading-snug">{ev.title}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{ev.time} ï¿½ {ev.description}</p>
                  </div>
                ))}
                {ACTIVITY_LOG_EVENTS.filter((e) => e.client === clientName).length === 0 && (
                  <p className="text-[10px] text-gray-400 py-2 text-center">No recent activity</p>
                )}
              </div>
            </div>

            {/* Active Projects card (Moved down) */}
            <div className="p-4 rounded-2xl border border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Active projects</p>
                <span className="text-[10px] font-bold text-[#484782]">{filteredGroups[clientName]?.projects.length ?? 0}</span>
              </div>
              <div className="space-y-2">
                {(filteredGroups[clientName]?.projects ?? []).slice(0, 4).map((proj) => (
                  <button key={proj.id} type="button" onClick={() => setSelectedProjectId(proj.id)} className={cn('w-full text-left p-3 rounded-xl border cursor-pointer transition-colors', selectedProjectId === proj.id ? 'border-[#7eb098]/40 bg-[#7eb098]/5' : 'border-gray-100 hover:border-gray-200')}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[8px] font-bold uppercase text-[#484782] bg-[#484782]/10 px-1.5 py-0.5 rounded">{proj.status}</span>
                      <span className="text-[10px] font-bold text-[#191c20]">${proj.amount.toLocaleString()}</span>
                    </div>
                    <p className="font-fraunces text-[12px] font-semibold text-[#191c20] truncate">{proj.name}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Due {proj.date}</p>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => { setNewProjClient(clientName); setModalOpen('project'); }} className="mt-3 w-full py-2 rounded-xl border border-dashed border-gray-200 text-[9px] font-bold uppercase text-gray-500 hover:border-[#7eb098]/40 hover:text-[#7eb098] cursor-pointer">
                + Create new project
              </button>
            </div>

            {activeProject && (
              <div className="p-4 rounded-2xl border border-[#7eb098]/20 bg-[#7eb098]/5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#7eb098] mb-1">Open balance</p>
                <p className="font-fraunces text-xl font-bold text-[#191c20]">${activeProject.status === 'Paid' ? '0' : activeProject.amount.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 mt-1">on {activeProject.name}</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-400 text-[11px]">Select a client to see deals & context</div>
        )
      }
    />

      <SendationalSlideIn
        open={modalOpen === 'project'}
        onClose={() => setModalOpen(null)}
        badge="Projects"
        title="Create Project"
        description="Setup a secure folder with client magic link visibility."
      >
            <form onSubmit={handleCreateProject} className="space-y-4 text-left font-sans">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Project Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Q3 Social Video Campaign"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:border-[#7eb098]/60 focus:ring-4 focus:ring-[#7eb098]/10 transition-all font-sans font-medium"
                />
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Select Client</label>
                  <select 
                    value={newProjClient}
                    onChange={(e) => setNewProjClient(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:border-[#7eb098]/60 transition-all cursor-pointer font-sans font-semibold"
                  >
                    {Object.keys(clientMetadata).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen('client')}
                  className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#7eb098] hover:text-emerald-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all h-9 flex items-center gap-1 cursor-pointer"
                  title="Add new client relationship"
                >
                  <Plus size={13} /> Client
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Contract Value ($)</label>
                  <input 
                    type="number"
                    placeholder="5000"
                    value={newProjAmount}
                    onChange={(e) => setNewProjAmount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:border-[#7eb098]/60 focus:ring-4 focus:ring-[#7eb098]/10 transition-all font-sans font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Due Date</label>
                  <input 
                    type="text"
                    placeholder="Oct 30"
                    value={newProjDueDate}
                    onChange={(e) => setNewProjDueDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:border-[#7eb098]/60 focus:ring-4 focus:ring-[#7eb098]/10 transition-all font-sans font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Scope Summary Briefing</label>
                <textarea 
                  placeholder="Notes about milestones, locking/unlocking conditions..."
                  value={newProjScope}
                  onChange={(e) => setNewProjScope(e.target.value)}
                  rows={4}
                  className="w-full min-h-[118px] bg-gray-50 border border-gray-200/60 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none resize-none focus:bg-white focus:border-[#7eb098]/60 focus:ring-4 focus:ring-[#7eb098]/10 transition-all font-sans font-medium"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(null)}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold py-3 rounded-xl cursor-pointer text-center font-sans border border-[#eceef0] transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-[#191c20] hover:bg-black text-white text-xs font-bold py-3 rounded-xl cursor-pointer text-center font-sans transition-transform hover:scale-102 active:scale-98"
                >
                  Launch Project
                </button>
              </div>
            </form>
      </SendationalSlideIn>

      <SendationalSlideIn
        open={modalOpen === 'client'}
        onClose={() => setModalOpen(null)}
        badge="Client profile"
        title="Add Client Profile"
        description="Setup communications coordinator, contact email, priority and satisfaction status."
      >
            <form onSubmit={handleCreateClient} className="space-y-4 text-left font-sans">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Company Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={newCliName}
                  onChange={(e) => setNewCliName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:border-[#7eb098]/60 focus:ring-4 focus:ring-[#7eb098]/10 transition-all font-sans font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">POC Coordinator Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Dave Connor"
                    value={newCliPoc}
                    onChange={(e) => setNewCliPoc(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:border-[#7eb098]/60 focus:ring-4 focus:ring-[#7eb098]/10 transition-all font-sans font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Primary Email</label>
                  <input 
                    type="email"
                    placeholder="e.g. acme@company.com"
                    value={newCliEmail}
                    onChange={(e) => setNewCliEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:border-[#7eb098]/60 focus:ring-4 focus:ring-[#7eb098]/10 transition-all font-sans font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 font-sans">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Priority Level</label>
                  <select 
                    value={newCliPriority}
                    onChange={(e) => setNewCliPriority(e.target.value as 'VIP' | 'Retainer' | 'Standard')}
                    className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:border-[#7eb098]/60 transition-all cursor-pointer font-sans font-semibold"
                  >
                    <option value="VIP">Enterprise VIP</option>
                    <option value="Retainer">Monthly Retainer</option>
                    <option value="Standard">Standard Client</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Sentiment status</label>
                  <select 
                    value={newCliSentiment}
                    onChange={(e) => setNewCliSentiment(e.target.value as 'Exceptional' | 'Good' | 'Neutral' | 'At Risk')}
                    className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:border-[#7eb098]/60 transition-all cursor-pointer font-sans font-semibold"
                  >
                    <option value="Exceptional">Exceptional</option>
                    <option value="Good">Good Vibe</option>
                    <option value="Neutral">Neutral</option>
                    <option value="At Risk">At Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-sans">Select Representative Avatar</label>
                <div className="flex flex-wrap gap-2.5">
                  {AVATAR_PRESETS.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewCliAvatar(src)}
                      className={cn(
                        "w-8.5 h-8.5 rounded-full overflow-hidden border-2 transition-all duration-200 shrink-0",
                        newCliAvatar === src ? "border-[#7eb098] scale-110 shadow-xs ring-4 ring-[#7eb098]/10" : "border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3 font-sans">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(null)}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold py-3 rounded-xl cursor-pointer text-center border border-[#eceef0] transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-[#191c20] hover:bg-black text-white text-xs font-bold py-3 rounded-xl cursor-pointer text-center transition-transform hover:scale-102 active:scale-98"
                >
                  Add Client
                </button>
              </div>
            </form>
      </SendationalSlideIn>

      <SendationalSlideIn
        open={modalOpen === 'edit_client'}
        onClose={() => setModalOpen(null)}
        badge="Management panel"
        title="Manage Client Settings"
        description="Update POC configurations, priority indicators, or delete client."
      >
            <form onSubmit={handleEditClient} className="space-y-4 text-left font-sans">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Company Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={editCliName}
                  onChange={(e) => setEditCliName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:border-[#7eb098]/60 focus:ring-4 focus:ring-[#7eb098]/10 transition-all font-sans font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 font-sans">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">POC Coordinator</label>
                  <input 
                    type="text"
                    placeholder="e.g. Dave Connor"
                    value={editCliPoc}
                    onChange={(e) => setEditCliPoc(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:border-[#7eb098]/60 focus:ring-4 focus:ring-[#7eb098]/10 transition-all font-sans font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Primary Email</label>
                  <input 
                    type="email"
                    placeholder="e.g. acme@company.com"
                    value={editCliEmail}
                    onChange={(e) => setEditCliEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:border-[#7eb098]/60 focus:ring-4 focus:ring-[#7eb098]/10 transition-all font-sans font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 font-sans">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Priority Level</label>
                  <select 
                    value={editCliPriority}
                    onChange={(e) => setEditCliPriority(e.target.value as 'VIP' | 'Retainer' | 'Standard')}
                    className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:border-[#7eb098]/60 transition-all cursor-pointer font-sans font-semibold"
                  >
                    <option value="VIP">Enterprise VIP</option>
                    <option value="Retainer">Monthly Retainer</option>
                    <option value="Standard">Standard Client</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Sentiment status</label>
                  <select 
                    value={editCliSentiment}
                    onChange={(e) => setEditCliSentiment(e.target.value as 'Exceptional' | 'Good' | 'Neutral' | 'At Risk')}
                    className="w-full bg-gray-50 border border-gray-200/60 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:border-[#7eb098]/60 transition-all cursor-pointer font-sans font-semibold"
                  >
                    <option value="Exceptional">Exceptional</option>
                    <option value="Good">Good Vibe</option>
                    <option value="Neutral">Neutral</option>
                    <option value="At Risk">At Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-sans">Select Avatar Representative</label>
                <div className="flex flex-wrap gap-2.5">
                  {AVATAR_PRESETS.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditCliAvatar(src)}
                      className={cn(
                        "w-8.5 h-8.5 rounded-full overflow-hidden border-2 transition-all duration-200 shrink-0",
                        editCliAvatar === src ? "border-[#7eb098] scale-110 shadow-xs ring-4 ring-[#7eb098]/10" : "border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2 font-sans">
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setModalOpen(null)}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold py-3 rounded-xl cursor-pointer text-center border border-[#eceef0] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-[#191c20] hover:bg-black text-white text-xs font-bold py-3 rounded-xl cursor-pointer text-center transition-transform hover:scale-102 active:scale-98"
                  >
                    Save Changes
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleDeleteClient(selectedClientName)}
                  className="w-full mt-2 border border-red-200 text-red-500 hover:bg-red-50 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Archive & Delete Client
                </button>
              </div>
            </form>
      </SendationalSlideIn>

      {/* Local view toast notification */}
      {toast && createPortal(
        <div className="fixed bottom-6 right-6 bg-[#191c20] text-white px-4 py-2.5 rounded-xl shadow-xl z-[200001] text-[10px] font-sans font-bold tracking-wide uppercase flex items-center gap-2 border border-white/10 animate-in slide-in-from-bottom-2 duration-300">
          <div className="w-1.5 h-1.5 rounded-full bg-[#7eb098] animate-pulse" />
          {toast}
        </div>,
        document.body
      )}

    </>
  );
};

const SettingSwitch = ({ checked = true }: { checked?: boolean }) => (
  <span
    className={cn(
      'relative inline-flex h-5.5 w-10 shrink-0 rounded-full border transition-colors',
      checked ? 'border-[#7eb098]/40 bg-[#7eb098]' : 'border-gray-200 bg-gray-100'
    )}
  >
    <span
      className={cn(
        'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
        checked ? 'translate-x-5' : 'translate-x-0.5'
      )}
    />
  </span>
);

const SettingRow = ({
  icon: Icon,
  title,
  detail,
  checked = true,
}: {
  icon: React.ElementType;
  title: string;
  detail: string;
  checked?: boolean;
}) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-3xs">
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-[#f4f5f8] text-gray-500">
        <Icon size={15} strokeWidth={2.3} />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-[#191c20]">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">{detail}</p>
      </div>
    </div>
    <SettingSwitch checked={checked} />
  </div>
);

const SettingsView = () => {
  type SettingsSection = 'profile' | 'delivery' | 'portal' | 'payments' | 'storage' | 'evidence' | 'notifications' | 'branding' | 'security';
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [storageMode, setStorageMode] = useState<'native' | 'byos' | 's3'>('byos');

  const sections: Array<{
    id: SettingsSection;
    label: string;
    sub: string;
    icon: React.ElementType;
    status: string;
  }> = [
    { id: 'profile', label: 'Profile', sub: 'Freelancer identity, photo, payout handles', icon: Users, status: 'Owner' },
    { id: 'delivery', label: 'Delivery', sub: 'Portal defaults, approval, unlock rules', icon: Package, status: 'Core' },
    { id: 'payments', label: 'Payments', sub: 'Stripe, manual verification, release rules', icon: CreditCard, status: '3 open' },
    { id: 'storage', label: 'Storage', sub: 'Native, BYOS cloud links, S3', icon: UploadCloud, status: 'BYOS' },
    { id: 'evidence', label: 'Evidence & Alerts', sub: 'Audit packs, security, reminders', icon: ShieldAlert, status: 'Enabled' },
  ];

  const currentSection = sections.find((section) => section.id === activeSection) ?? sections[0];
  const ActiveIcon = currentSection.icon;

  const settingPillClass = (selected: boolean) =>
    cn(
      'w-full rounded-[20px] border p-3.5 text-left transition-all duration-200 cursor-pointer group',
      selected
        ? 'border-transparent bg-[#191c20] text-white shadow-[0_14px_30px_-18px_rgba(25,28,32,0.75)]'
        : 'border-gray-100 bg-white hover:border-[#7eb098]/35 hover:bg-[#7eb098]/5'
    );

  const sectionCards: Record<SettingsSection, React.ReactNode> = {
    profile: (
      <>
        <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-4">
          <div className="rounded-[1.6rem] border border-gray-100 bg-white p-5 shadow-3xs">
            <span className="text-[9.5px] font-bold uppercase tracking-widest text-gray-400">Freelancer profile</span>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="relative">
                <Avatar src={AVATARS[0]} className="h-20 w-20 border-2 border-white shadow-sm" />
                <input id="freelancer-avatar-upload" type="file" accept="image/*" className="hidden" />
                <label
                  htmlFor="freelancer-avatar-upload"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white bg-[#191c20] text-white shadow-sm"
                  title="Change profile picture"
                >
                  <UploadCloud size={13} strokeWidth={2.5} />
                </label>
              </div>
              <div className="min-w-0">
                <h4 className="font-fraunces text-2xl font-semibold text-[#191c20]">Jennifer Rass</h4>
                <p className="text-[11px] font-semibold text-gray-500">jennifer.rass@freelance.com</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[#7eb098]">Primary workspace owner</p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.6rem] border border-dashed border-gray-200 bg-white p-5">
            <span className="text-[9.5px] font-bold uppercase tracking-widest text-gray-400">Portal identity</span>
            <h4 className="mt-2 font-fraunces text-xl font-semibold text-[#191c20]">Sendational Studio</h4>
            <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
              This is the identity clients see on delivery rooms, emails, evidence exports, and payment notes.
            </p>
            <div className="mt-3 flex gap-2">
              {SENDATIONAL_SLIDEIN_STRIPE_COLORS.map((color) => (
                <span key={color} className="h-7 w-7 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            ['Display name', 'Jennifer Rass'],
            ['Business / studio name', 'Sendational Studio'],
            ['Email', 'jennifer.rass@freelance.com'],
            ['Phone', '+1 (312) 555-0198'],
            ['Zelle', 'jennifer.rass@freelance.com'],
            ['Venmo', '@JenniferRaasCreative'],
          ].map(([label, value]) => (
            <label key={label} className="rounded-2xl border border-gray-100 bg-white p-4">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
              <input
                defaultValue={value}
                className="mt-2 w-full rounded-xl border border-gray-100 bg-[#f4f5f8] px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none focus:border-[#7eb098]/50 focus:bg-white"
              />
            </label>
          ))}
        </div>
        <SettingRow icon={Mail} title="Use branded sender identity" detail="Client emails use your workspace name and reply-to address." />
        <SettingRow icon={FileText} title="Include freelancer details on evidence PDFs" detail="Evidence exports include your business name, email, and payment verification handles." />
      </>
    ),
    delivery: (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-[1.6rem] border border-gray-100 bg-white p-5 shadow-3xs">
            <span className="text-[9.5px] font-bold uppercase tracking-widest text-gray-400">Default file visibility</span>
            <h4 className="mt-2 font-fraunces text-xl font-semibold text-[#191c20]">Preview-visible, finals locked</h4>
            <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
              New delivery rooms show protected previews while clean files stay locked by default.
            </p>
          </div>
          <div className="rounded-[1.6rem] border border-dashed border-[#7eb098]/35 bg-[#7eb098]/6 p-5">
            <span className="text-[9.5px] font-bold uppercase tracking-widest text-[#5b987d]">Portal expiry</span>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="number"
                defaultValue={30}
                min={1}
                className="w-24 rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm font-bold text-[#191c20] outline-none focus:border-[#7eb098]/60"
              />
              <span className="text-[12px] font-semibold text-gray-500">days after final unlock</span>
            </div>
          </div>
        </div>
        <SettingRow icon={CheckCircle} title="Require client approval before unlock" detail="Final files cannot be released until the client signs off on deliverables." />
        <SettingRow icon={CreditCard} title="Require payment clearance before unlock" detail="Approval alone is not enough; payment gates must clear or be manually verified." />
        <SettingRow icon={EyeOff} title="Keep drafts hidden from client portal" detail="Draft and internal files stay private unless explicitly marked visible." />
        <SettingRow icon={Eye} title="No-account client access" detail="Clients can preview, comment, approve, and pay from private magic links." />
        <SettingRow icon={ImageIcon} title="Watermark preview assets" detail="Apply visual protection to preview images, PDFs, and media files." />
        <SettingRow icon={QrCode} title="Mobile portal QR" detail="Generate a QR code for review sessions and printed handoff sheets." checked={false} />
        <SettingRow icon={Download} title="Send download receipt after clean-file access" detail="Log and email a clean-file download confirmation after final package access." />
      </>
    ),
    portal: (
      <>
        <SettingRow icon={Eye} title="No-account client access" detail="Clients can preview, comment, approve, and pay from private magic links." />
        <SettingRow icon={EyeOff} title="Protected previews by default" detail="New uploads enter as preview-safe until you mark final files visible." />
        <SettingRow icon={ImageIcon} title="Watermark preview assets" detail="Apply visual protection to preview images, PDFs, and media files." />
        <SettingRow icon={QrCode} title="Mobile portal QR" detail="Generate a QR code for review sessions and printed handoff sheets." checked={false} />
        <div className="rounded-2xl border border-dashed border-[#7eb098]/35 bg-[#7eb098]/6 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#5b987d]">Client footer attribution</p>
              <p className="mt-2 text-[12px] leading-relaxed text-gray-600">
                Keep the tasteful Sendational footer enabled unless the workspace is white-label.
              </p>
            </div>
            <SettingSwitch checked />
          </div>
        </div>
      </>
    ),
    payments: (
      <>
        <SettingRow icon={CreditCard} title="Stripe card and ACH gates" detail="Automatically unlock clean files after successful payment confirmation." />
        <SettingRow icon={DollarSign} title="Manual payment verification" detail="Let clients mark Zelle, Venmo, or wire payments as sent for freelancer review." />
        <SettingRow icon={Lock} title="Hold final files until approval and payment" detail="Require both approval and payment clearance before release." />
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-3xs">
          <p className="text-[9.5px] font-bold uppercase tracking-widest text-gray-400">Allowed manual methods</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Zelle', 'Venmo', 'Bank transfer', 'Cash/check'].map((method, idx) => (
              <span
                key={method}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider',
                  idx < 3 ? 'border-[#7eb098]/30 bg-[#7eb098]/8 text-[#5b987d]' : 'border-gray-200 bg-white text-gray-400'
                )}
              >
                {method}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Stripe status', 'Connected'],
            ['Manual queue', '3 pending'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
              <p className="mt-1 font-fraunces text-xl font-medium text-[#191c20]">{value}</p>
            </div>
          ))}
        </div>
      </>
    ),
    storage: (
      <>
        <div className="rounded-[1.6rem] border border-gray-100 bg-white p-5 shadow-3xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="text-[9.5px] font-bold uppercase tracking-widest text-gray-400">Storage mode</span>
              <h4 className="mt-2 font-fraunces text-xl font-semibold text-[#191c20]">Choose delivery file source</h4>
            </div>
            <span className="rounded-full border border-dashed border-[#7eb098]/35 bg-[#7eb098]/8 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[#5b987d]">
              {storageMode === 'native' ? 'Native vault' : storageMode === 'byos' ? 'BYOS cloud' : 'S3 bucket'}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { id: 'native' as const, label: 'Native storage', sub: 'Upload into Sendational vault', icon: Package },
              { id: 'byos' as const, label: 'Cloud BYOS', sub: 'Google Drive, Dropbox, OneDrive', icon: Link2 },
              { id: 's3' as const, label: 'S3 bucket', sub: 'Use your own AWS bucket', icon: UploadCloud },
            ].map((mode) => {
              const ModeIcon = mode.icon;
              const selected = storageMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setStorageMode(mode.id)}
                  className={cn(
                    'rounded-2xl border p-4 text-left transition-all cursor-pointer',
                    selected ? 'border-[#191c20] bg-[#191c20] text-white' : 'border-gray-100 bg-[#f4f5f8]/50 hover:bg-white hover:border-[#7eb098]/35'
                  )}
                >
                  <ModeIcon size={16} className={cn('mb-3', selected ? 'text-white' : 'text-gray-500')} />
                  <p className={cn('text-[12px] font-bold', selected ? 'text-white' : 'text-[#191c20]')}>{mode.label}</p>
                  <p className={cn('mt-1 text-[10px] leading-relaxed', selected ? 'text-white/60' : 'text-gray-500')}>{mode.sub}</p>
                </button>
              );
            })}
          </div>
        </div>

        {storageMode === 'native' && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-5">
            <p className="text-[9.5px] font-bold uppercase tracking-widest text-gray-400">Native vault allocation</p>
            <div className="mt-3 h-2 rounded-full bg-[#eceef0] overflow-hidden">
              <div className="h-full w-[42%] rounded-full bg-[#7eb098]" />
            </div>
            <p className="mt-2 text-[11px] text-gray-500">42 GB of 100 GB used across active delivery rooms.</p>
          </div>
        )}

        {storageMode === 'byos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {[
              ['Google Drive root folder', 'https://drive.google.com/drive/folders/sendational'],
              ['Dropbox team folder', 'https://dropbox.com/home/Client%20Deliveries'],
              ['OneDrive share base', 'https://onedrive.live.com/sendational-deliveries'],
            ].map(([label, value]) => (
              <label key={label} className="rounded-2xl border border-gray-100 bg-white p-4">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
                <input
                  defaultValue={value}
                  className="mt-2 w-full rounded-xl border border-gray-100 bg-[#f4f5f8] px-3 py-2 text-[11px] font-semibold text-gray-700 outline-none focus:border-[#7eb098]/50 focus:bg-white"
                />
              </label>
            ))}
          </div>
        )}

        {storageMode === 's3' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[
              ['Bucket name', 'sendational-client-deliveries'],
              ['Region', 'us-east-1'],
              ['Access key alias', 'snd-prod-delivery-user'],
              ['Signed URL expiry', '72 hours'],
            ].map(([label, value]) => (
              <label key={label} className="rounded-2xl border border-gray-100 bg-white p-4">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
                <input
                  defaultValue={value}
                  className="mt-2 w-full rounded-xl border border-gray-100 bg-[#f4f5f8] px-3 py-2 text-[11px] font-semibold text-gray-700 outline-none focus:border-[#7eb098]/50 focus:bg-white"
                />
              </label>
            ))}
          </div>
        )}

        <SettingRow icon={ShieldAlert} title="External permission checks" detail="Warn when linked file permissions expire before the final download window." />
      </>
    ),
    evidence: (
      <>
        <SettingRow icon={ShieldAlert} title="Auto-generate evidence pack after final unlock" detail="Create a dispute-ready archive when approval, payment, and download events complete." />
        <SettingRow icon={Activity} title="Include IP, device, and timestamp metadata" detail="Attach portal open, approval, and download metadata to evidence exports." />
        <SettingRow icon={MessageCircle} title="Include feedback and approval threads" detail="Bundle comments, revision requests, approvals, and freelancer replies." />
        <SettingRow icon={CreditCard} title="Include payment proof" detail="Attach Stripe confirmation or manual verification records to the pack." />
        <SettingRow icon={Bell} title="Briefing focus window" detail="Show the last 30 days plus unresolved priority exceptions on the dashboard." />
        <SettingRow icon={Clock} title="Client viewed but did not approve" detail="Create a briefing alert after 3 quiet days from a portal view." />
        <SettingRow icon={Lock} title="Require secure signed URLs for clean files" detail="Final downloads use short-lived access URLs after gates clear." />
        <SettingRow icon={Trash2} title="Archive without deleting evidence history" detail="Archive old rooms while preserving evidence pack exportability." />
        <div className="rounded-2xl border border-dashed border-[#484782]/25 bg-[#484782]/5 p-5">
          <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#484782]">Evidence retention</p>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="number"
              defaultValue={24}
              min={1}
              className="w-24 rounded-xl border border-[#484782]/15 bg-white px-3 py-2 text-sm font-bold text-[#191c20] outline-none focus:border-[#484782]/45"
            />
            <span className="text-[12px] font-semibold text-gray-600">months after project archive</span>
          </div>
        </div>
      </>
    ),
    notifications: (
      <>
        <SettingRow icon={Bell} title="Briefing focus window" detail="Show the last 30 days plus unresolved priority exceptions on the dashboard." />
        <SettingRow icon={Clock} title="Client viewed but did not approve" detail="Create a briefing alert after 3 quiet days from a portal view." />
        <SettingRow icon={DollarSign} title="Payment marked paid but unverified" detail="Escalate manual payment confirmations after 1 business day." />
        <SettingRow icon={Link2} title="Portal link expiring soon" detail="Warn before magic links or external file permissions expire." />
        <SettingRow icon={Send} title="Delivery summary emails" detail="Send concise client-facing status notes after major delivery events." checked={false} />
      </>
    ),
    branding: (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-[1.6rem] border border-gray-100 bg-white p-5 shadow-3xs">
            <span className="text-[9.5px] font-bold uppercase tracking-widest text-gray-400">Freelancer profile</span>
            <div className="mt-4 flex items-center gap-4">
              <Avatar src={AVATARS[0]} className="h-14 w-14 border-2 border-white shadow-sm" />
              <div>
                <h4 className="font-fraunces text-xl font-semibold text-[#191c20]">Jennifer Rass</h4>
                <p className="text-[11px] font-semibold text-gray-500">jennifer.rass@freelance.com</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[#7eb098]">Primary workspace owner</p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.6rem] border border-dashed border-gray-200 bg-white p-5">
            <span className="text-[9.5px] font-bold uppercase tracking-widest text-gray-400">Portal brand</span>
            <h4 className="mt-2 font-fraunces text-xl font-semibold text-[#191c20]">Sendational Studio</h4>
            <div className="mt-3 flex gap-2">
              {SENDATIONAL_SLIDEIN_STRIPE_COLORS.map((color) => (
                <span key={color} className="h-7 w-7 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
        </div>
        <SettingRow icon={Mail} title="Branded sender identity" detail="Use your workspace name and reply-to email in client delivery messages." />
        <SettingRow icon={FileText} title="Evidence PDF branding" detail="Attach logo, freelancer details, and delivery room metadata to exported packs." />
        <SettingRow icon={EyeOff} title="White-label portal mode" detail="Hide Sendational attribution on client portals for eligible plans." checked={false} />
      </>
    ),
    security: (
      <>
        <SettingRow icon={ShieldAlert} title="Immutable audit trail" detail="Log portal opens, approvals, feedback, payment events, and downloads." />
        <SettingRow icon={ImageIcon} title="Watermark previews" detail="Apply preview-safe protection to visible design and media files." />
        <SettingRow icon={Trash2} title="Archive without deleting evidence history" detail="Archive old rooms while preserving evidence pack exportability." />
        <SettingRow icon={Lock} title="Require secure signed URLs for clean files" detail="Final downloads use short-lived access URLs after gates clear." />
        <div className="rounded-2xl border border-dashed border-[#484782]/25 bg-[#484782]/5 p-5">
          <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#484782]">Evidence readiness</p>
          <p className="mt-2 text-[12px] leading-relaxed text-gray-600">
            Dispute packs remain exportable even when Briefing hides older dashboard notifications.
          </p>
        </div>
      </>
    ),
  };

  const storageModeLabel =
    storageMode === 'native' ? 'Native vault' : storageMode === 'byos' ? 'Cloud BYOS' : 'S3 bucket';
  const sectionStatusStrip = [
    { label: 'Client-facing', value: ['profile', 'delivery', 'portal', 'payments', 'branding'].includes(activeSection) ? 'Direct impact' : 'Configured' },
    { label: 'Evidence-aware', value: ['delivery', 'storage', 'evidence', 'security'].includes(activeSection) ? 'High' : 'On' },
    { label: 'Last saved', value: '2m ago' },
  ];

  return (
    <div className={cn('readable-view flex w-full min-w-0 flex-col select-none text-left', MAIN_HUB_VIEW_HEIGHT)}>
      <div className={HUB_BOOKLET_SHELL}>
        <div className="hidden lg:flex w-[308px] shrink-0 flex-col border-r border-gray-100/80 bg-white p-5">
          <div className="mb-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Settings index</p>
              <span className="rounded-full border border-dashed border-[#7eb098]/35 bg-[#7eb098]/8 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#5b987d]">
                {sections.length} sections
              </span>
            </div>
            <h2 className="mt-1 font-fraunces text-2xl font-semibold text-[#191c20]">Workspace Settings</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
              Configure your profile, portal rules, payments, storage, and evidence.
            </p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto scrollbar-thin pr-1">
            {sections.map((section) => {
              const SectionIcon = section.icon;
              const selected = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={settingPillClass(selected)}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
                      selected ? 'border-white/10 bg-white/10 text-white' : 'border-gray-100 bg-[#f4f5f8] text-gray-500'
                    )}>
                      <SectionIcon size={15} strokeWidth={2.4} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate text-[13px] font-bold', selected ? 'text-white' : 'text-[#191c20]')}>
                        {section.label}
                      </span>
                      <span className={cn('mt-0.5 block truncate text-[10.5px] font-medium', selected ? 'text-white/60' : 'text-gray-500')}>
                        {section.sub}
                      </span>
                    </span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider', selected ? 'bg-white/10 text-white/75' : 'bg-gray-100 text-gray-400')}>
                      {section.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden lg:flex shrink-0">
          <SpiralBinderSpine />
        </div>

        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 lg:p-6 scrollbar-default-thin">
            <div className="mb-4 flex gap-1.5 overflow-x-auto scrollbar-none lg:hidden">
              {sections.map((section) => {
                const SectionIcon = section.icon;
                const selected = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors',
                      selected
                        ? 'border-[#191c20] bg-[#191c20] text-white'
                        : 'border-gray-200 bg-white text-gray-500'
                    )}
                  >
                    <SectionIcon size={12} strokeWidth={2.4} />
                    {section.label}
                  </button>
                );
              })}
            </div>

            <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-[#f4f5f8] text-[#7eb098]">
                  <ActiveIcon size={18} strokeWidth={2.4} />
                </span>
                <div>
                  <p className="text-[9.5px] font-bold uppercase tracking-widest text-gray-400">Active section</p>
                  <h3 className="font-fraunces text-2xl font-semibold text-[#191c20]">{currentSection.label}</h3>
                  <p className="mt-0.5 text-[12px] text-gray-500">{currentSection.sub}</p>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-[#191c20] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-black transition-colors cursor-pointer"
              >
                <CheckCircle size={13} strokeWidth={2.5} />
                Save Changes
              </button>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {sectionStatusStrip.map((item, idx) => (
                <div
                  key={item.label}
                  className={cn(
                    'rounded-2xl bg-white p-3.5',
                    idx === 1 ? 'border border-dashed border-gray-200' : 'border border-gray-100'
                  )}
                >
                  <p className="text-[8.5px] font-bold uppercase tracking-widest text-gray-400">{item.label}</p>
                  <p className="mt-1 font-fraunces text-lg font-medium text-[#191c20]">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              {sectionCards[activeSection]}
            </div>
          </div>
        </div>

        <div className="hidden xl:flex shrink-0">
          <SpiralBinderSpine />
        </div>

        <div className="hidden xl:flex w-[268px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-gray-100/80 bg-white p-4 pt-5 scrollbar-thin">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Workspace health</p>
            <p className="mt-1 font-fraunces text-3xl font-medium text-[#191c20]">92%</p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">Core profile and handoff controls are configured for protected delivery.</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-dashed border-[#7eb098]/35 bg-[#7eb098]/6 p-4">
            <div className="absolute right-3 top-3 bottom-3 flex flex-col justify-between" aria-hidden>
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="h-1 w-1 rounded-full bg-[#7eb098]/45" />
              ))}
            </div>
            <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#5b987d]">Recommended next</p>
            <p className="mt-2 pr-5 text-[12px] font-bold text-[#191c20]">Review manual payment rules</p>
            <p className="mt-1 pr-5 text-[11px] leading-relaxed text-gray-500">Three payment confirmations are waiting for freelancer verification.</p>
          </div>
          <div className="space-y-2">
            {[
              ['Profile', 'Client-ready'],
              ['Evidence packs', 'Enabled'],
              ['Storage mode', storageModeLabel],
              ['Briefing window', '30 days'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-gray-100 bg-white p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                <p className="mt-0.5 font-fraunces text-lg font-medium text-[#191c20]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
// --- DELIVERY WIDGET (FULLY CONFIGURED) ---
const DeliveryWidget = ({ 
  primaryTab, 
  setPrimaryTab, 
  createTab, 
  setCreateTab, 
  onClose,
  onCreateDelivery,
  setCurrentView,
  briefingEvents
}: { 
  primaryTab: string; 
  setPrimaryTab: React.Dispatch<React.SetStateAction<string>>; 
  createTab: string; 
  setCreateTab: React.Dispatch<React.SetStateAction<string>>; 
  onClose: () => void;
  onCreateDelivery: (draft: QuickDeliveryDraft) => void;
  setCurrentView: (view: string) => void;
  briefingEvents: BriefingEvent[];
}) => {
  const [sendMode, setSendMode] = useState<'link' | 'email'>('link');
  const [stripeExpanded, setStripeExpanded] = useState(false);
  const [storageExpanded, setStorageExpanded] = useState(false);
  const [storageType, setStorageType] = useState<'native' | 'url' | 's3'>('native');
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [watermark, setWatermark] = useState(false);
  const [requireSignature, setRequireSignature] = useState(false);
  const [libraryEnabled, setLibraryEnabled] = useState(true);
  const [allowTips, setAllowTips] = useState(false);
  const [paymentGate, setPaymentGate] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('150.00');
  const [messageExpanded, setMessageExpanded] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [retentionDays, setRetentionDays] = useState('30');
  const [retentionOpen, setRetentionOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showQRFloating, setShowQRFloating] = useState(false);
  const deliveryMoreMenuRef = useRef<HTMLDivElement | null>(null);
  const retentionMenuRef = useRef<HTMLDivElement | null>(null);

  // Form states
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: string }>>([
    { name: 'Brand Guide.pdf', size: '4.2 MB' },
    { name: 'Assets Package.zip', size: '24.8 MB' }
  ]);

  const presetMessages = [
    { label: 'REVIEW', text: 'Hi {name}, here are the latest design concepts for your review.' },
    { label: 'INVOICE', text: 'Hi {name}, the assets are ready. Please review and complete payment to download.' },
    { label: 'FINAL', text: 'Hi {name}, here are the final deliverable files. Thank you!' }
  ];

  const fillPreset = (text: string) => {
    const name = clientName || 'Client';
    setMessageText(text.replace('{name}', name));
  };

  const getHeaderTitle = () => {
    if (isPublished) return 'Link ready';
    if (primaryTab === 'Current') return 'Current deliveries';
    if (primaryTab === 'Briefing') return 'Briefing';
    if (createTab === 'Quote') return 'Create quote';
    return 'Quick Delivery';
  };

  const handlePublish = () => {
    if (createTab === 'Project') {
      onCreateDelivery({
        clientName,
        clientEmail,
        deliveryTitle: projectTitle,
        linkLabel,
        files: uploadedFiles,
        paymentAmount: paymentGate ? paymentAmount : undefined
      });
    }
    setIsPublished(true);
  };

  const resetDelivery = () => {
    setIsPublished(false);
    setClientName('');
    setClientEmail('');
    setProjectTitle('');
    setLinkLabel('');
    setUploadedFiles([]);
    setShowQR(false);
  };

  useEffect(() => {
    if (!moreMenuOpen && !retentionOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (moreMenuOpen && !deliveryMoreMenuRef.current?.contains(target)) {
        setMoreMenuOpen(false);
      }

      if (retentionOpen && !retentionMenuRef.current?.contains(target)) {
        setRetentionOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [moreMenuOpen, retentionOpen]);

  return (
    <div className="relative w-full sm:w-[360px] h-full bg-white/95 backdrop-blur-2xl border-r border-gray-100 shadow-2xl z-50 flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="px-6 pt-4 pb-3 flex items-center justify-between border-b border-gray-100 shrink-0 relative">
        <div className="flex items-center gap-2">
          {/* SVG Logo (right circle fill is white) */}
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className="w-4 h-4 text-[#191c20] shrink-0">
            <path
              d="M4 15C4 10.6 9.4 7 16 7C22.6 7 28 10.6 28 15"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <circle cx="12" cy="22" r="6" stroke="currentColor" strokeWidth={1.5} />
            <circle cx="20" cy="22" r="6" fill="#7eb098" stroke="currentColor" strokeWidth={1.5} />
          </svg>
        </div>
        
        <h2 className="font-fraunces font-semibold text-base text-[#191c20]">{getHeaderTitle()}</h2>
        
        <div className="flex items-center gap-2">
          <div ref={deliveryMoreMenuRef} className="relative">
            <button 
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {/* Header options menu */}
            {moreMenuOpen && (
              <div className="dropdown-menu-surface absolute right-0 top-11 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-2 flex flex-col gap-1">
                <button onClick={() => { setAdvancedExpanded(prev => !prev); setMoreMenuOpen(false); }} className="text-left px-3 py-2 text-xs font-semibold hover:bg-gray-50 rounded-xl text-gray-700">
                  Toggle Advanced Options
                </button>
                <button onClick={() => { setMessageExpanded(prev => !prev); setMoreMenuOpen(false); }} className="text-left px-3 py-2 text-xs font-semibold hover:bg-gray-50 rounded-xl text-gray-700">
                  Toggle Message Box
                </button>
                <button onClick={() => setMoreMenuOpen(false)} className="text-left px-3 py-2 text-xs font-semibold hover:bg-gray-50 rounded-xl text-gray-700">
                  Open Full Studio
                </button>
                <button onClick={() => { resetDelivery(); setMoreMenuOpen(false); }} className="text-left px-3 py-2 text-xs font-semibold hover:bg-gray-50 rounded-xl text-[#ff3b30]">
                  Clear Draft
                </button>
              </div>
            )}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Primary tabs control */}
      <div className="px-6 py-4 shrink-0">
        <div className="bg-[#f4f5f8] p-1 rounded-2xl flex h-10 items-center justify-between">
          {['Create', 'Current', 'Briefing'].map(tab => (
            <button 
              key={tab} 
              onClick={() => { 
                setPrimaryTab(tab); 
                setIsPublished(false); 
              }}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-200", 
                primaryTab === tab ? "bg-white text-black shadow-xs" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main widget contents */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {primaryTab === 'Create' && !isPublished && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Create sub-tabs (Project / Quote) */}
            <div className="flex flex-col gap-1.5">
              <div className="bg-[#f4f5f8]/70 p-0.5 rounded-xl flex h-9 items-center justify-between">
                {['Project', 'Quote'].map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => setCreateTab(tab)}
                    className={cn(
                      "flex-1 py-1 text-xs font-semibold rounded-lg transition-all duration-100", 
                      createTab === tab ? "bg-white text-black shadow-xs" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {tab === 'Project' ? 'Delivery' : tab}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 font-medium px-1">
                {createTab === 'Project' ? 'Create a delivery workspace with files and portal settings' : 'Create Quote is for pricing drafts & invoice specs'}
              </p>
            </div>

            {createTab === 'Project' ? (
              // Create Project flow
              <div className="flex flex-col gap-5">
                
                {/* Upload controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#f4f5f8] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center text-[#7eb098] group-hover:scale-105 transition-transform">
                      <UploadCloud size={16} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-600">Add files</span>
                  </div>
                  <div className="bg-[#f4f5f8] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center text-[#484782] group-hover:scale-105 transition-transform">
                      <FolderPlus size={16} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-600">Add folders</span>
                  </div>
                </div>

                {/* Files List if uploadedFiles exists */}
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-col border-t border-gray-100 pt-4 gap-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      <span>Files</span>
                      <span>{uploadedFiles.length} files</span>
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-[144px] overflow-y-auto">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <File size={14} className="text-gray-400 shrink-0" />
                            <span className="text-xs font-semibold text-gray-700 truncate">{file.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-sans font-bold text-gray-400">{file.size}</span>
                            <button 
                              onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                              className="w-5 h-5 rounded-full hover:bg-[#ff3b30]/10 flex items-center justify-center text-[#ff3b30] transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Send Mode selector */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans">Send Mode</span>
                  <div className="flex flex-col gap-2">
                    <div 
                      onClick={() => setSendMode('link')}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        sendMode === 'link' ? "border-[#7eb098] bg-[#7eb098]/5" : "border-gray-100 hover:border-gray-200"
                      )}
                    >
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center shrink-0">
                        {sendMode === 'link' && <div className="w-2.5 h-2.5 bg-[#7eb098] rounded-full" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#191c20]">Create Link</p>
                        <p className="text-[9px] text-gray-400 font-medium">Deliver via sharing URL</p>
                      </div>
                    </div>
                    
                    <div 
                      onClick={() => setSendMode('email')}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        sendMode === 'email' ? "border-[#7eb098] bg-[#7eb098]/5" : "border-gray-100 hover:border-gray-200"
                      )}
                    >
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center shrink-0">
                        {sendMode === 'email' && <div className="w-2.5 h-2.5 bg-[#7eb098] rounded-full" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#191c20]">Send Email</p>
                        <p className="text-[9px] text-gray-400 font-medium">Deliver directly to inbox</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Core Fields */}
                <div className="flex flex-col gap-3">
                  {sendMode === 'email' ? (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans">Email to</label>
                        <span className="text-[9px] font-sans font-bold text-gray-400">0 of 10</span>
                      </div>
                      <input 
                        type="email" 
                        value={clientEmail} 
                        onChange={(e) => setClientEmail(e.target.value)} 
                        placeholder="client@company.com" 
                        className="w-full h-10 bg-[#f4f5f8]/50 border border-gray-200 rounded-xl px-3.5 text-xs outline-none focus:border-[#7eb098] transition-colors font-medium text-[#191c20]"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block font-sans">Link label</label>
                      <input 
                        type="text" 
                        value={linkLabel} 
                        onChange={(e) => setLinkLabel(e.target.value)} 
                        placeholder="e.g. Phase 2 Delivery" 
                        className="w-full h-10 bg-[#f4f5f8]/50 border border-gray-200 rounded-xl px-3.5 text-xs outline-none focus:border-[#7eb098] transition-colors font-medium text-[#191c20]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block font-sans">Client name</label>
                    <input 
                      type="text" 
                      value={clientName} 
                      onChange={(e) => setClientName(e.target.value)} 
                      placeholder="Sarah Connor" 
                      className="w-full h-10 bg-[#f4f5f8]/50 border border-gray-200 rounded-xl px-3.5 text-xs outline-none focus:border-[#7eb098] transition-colors font-medium text-[#191c20]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block font-sans">Delivery title</label>
                    <input 
                      type="text" 
                      value={projectTitle} 
                      onChange={(e) => setProjectTitle(e.target.value)} 
                      placeholder="Brand Identity Redesign" 
                      className="w-full h-10 bg-[#f4f5f8]/50 border border-gray-200 rounded-xl px-3.5 text-xs outline-none focus:border-[#7eb098] transition-colors font-medium text-[#191c20]"
                    />
                  </div>
                </div>

                {/* Stripe Expandable setup card */}
                <div className="flex flex-col border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300">
                  <div 
                    onClick={() => setStripeExpanded(!stripeExpanded)}
                    className="flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <LayoutDashboard size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#191c20]">Stripe Gateway</p>
                        <p className="text-[9px] text-gray-400 font-sans">NOT CONNECTED</p>
                      </div>
                    </div>
                    <ChevronDown size={14} className={cn("text-gray-400 transition-transform", stripeExpanded && "rotate-180")} />
                  </div>
                  {stripeExpanded && (
                    <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-3 animate-in fade-in duration-200">
                      <p className="text-[11px] text-gray-500 font-medium">
                        Connect Stripe to collect project payments, deposits, or checkout-gated folder deliveries.
                      </p>
                      <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 transition-colors text-white font-semibold text-xs rounded-xl shadow-xs">
                        Connect Stripe account
                      </button>
                    </div>
                  )}
                </div>

                {/* Storage Expandable setup card */}
                <div className="flex flex-col border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300">
                  <div 
                    onClick={() => setStorageExpanded(!storageExpanded)}
                    className="flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Bookmark size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#191c20]">Storage Configuration</p>
                        <p className="text-[9px] text-gray-400 font-sans">NATIVE AWS S3</p>
                      </div>
                    </div>
                    <ChevronDown size={14} className={cn("text-gray-400 transition-transform", storageExpanded && "rotate-180")} />
                  </div>
                  {storageExpanded && (
                    <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-3 animate-in fade-in duration-200">
                      <div className="bg-[#f4f5f8] p-0.5 rounded-lg flex h-8 items-center justify-between">
                        {(['native', 'url', 's3'] as const).map(mode => (
                          <button 
                            key={mode} 
                            onClick={() => setStorageType(mode)}
                            className={cn(
                              "flex-1 py-1 text-[10px] font-bold uppercase rounded transition-all", 
                              storageType === mode ? "bg-white text-black shadow-xs" : "text-gray-400 hover:text-gray-600"
                            )}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                      {storageType === 'url' && (
                        <input 
                          type="text" 
                          placeholder="Paste public delivery assets URL..." 
                          className="w-full h-8 bg-gray-50 border border-gray-200 rounded-lg px-2.5 text-[11px] outline-none focus:border-[#7eb098] font-medium"
                        />
                      )}
                      {storageType === 's3' && (
                        <div className="flex flex-col gap-2">
                          <input type="text" placeholder="Bucket name" className="w-full h-8 bg-gray-50 border border-gray-200 rounded-lg px-2.5 text-[11px] outline-none font-medium" />
                          <input type="text" placeholder="Endpoint URL" className="w-full h-8 bg-gray-50 border border-gray-200 rounded-lg px-2.5 text-[11px] outline-none font-medium" />
                        </div>
                      )}
                      <button className="w-full py-1.5 bg-[#191c20] hover:bg-black transition-colors text-white font-semibold text-[10px] rounded-lg shadow-xs">
                        Save Configuration
                      </button>
                    </div>
                  )}
                </div>

                {/* Access control */}
                <div className="flex flex-col border-t border-gray-100 pt-4 gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans">Access control</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['Public', '7 Days', 'Open Once'].map(opt => (
                      <button 
                        key={opt}
                        className="py-2.5 border border-gray-100 bg-gray-50 hover:bg-gray-100 rounded-xl text-[10px] font-bold text-gray-600 transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced View Options (Collapsible toggles) */}
                <div className="flex flex-col border-t border-gray-100 pt-4">
                  <div 
                    onClick={() => setAdvancedExpanded(!advancedExpanded)}
                    className="flex justify-between items-center cursor-pointer py-1"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans">Advanced View Options</span>
                    <ChevronDown size={14} className={cn("text-gray-400 transition-transform", advancedExpanded && "rotate-180")} />
                  </div>
                  {advancedExpanded && (
                    <div className="flex flex-col gap-3 pt-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-gray-700">Preview with watermark</p>
                          <p className="text-[9px] text-gray-400 font-medium">Protect image assets</p>
                        </div>
                        <button 
                          onClick={() => setWatermark(!watermark)}
                          className={cn("w-9 h-5 rounded-full relative transition-colors duration-200", watermark ? "bg-[#7eb098]" : "bg-gray-200")}
                        >
                          <div className={cn("w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-200", watermark ? "left-4.5" : "left-0.5")} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-gray-700">Require signature</p>
                          <p className="text-[9px] text-gray-400 font-medium">Agree to terms before unlock</p>
                        </div>
                        <button 
                          onClick={() => setRequireSignature(!requireSignature)}
                          className={cn("w-9 h-5 rounded-full relative transition-colors duration-200", requireSignature ? "bg-[#7eb098]" : "bg-gray-200")}
                        >
                          <div className={cn("w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-200", requireSignature ? "left-4.5" : "left-0.5")} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-gray-700">Client library enabled</p>
                          <p className="text-[9px] text-gray-400 font-medium">Save package history for client</p>
                        </div>
                        <button 
                          onClick={() => setLibraryEnabled(!libraryEnabled)}
                          className={cn("w-9 h-5 rounded-full relative transition-colors duration-200", libraryEnabled ? "bg-[#7eb098]" : "bg-gray-200")}
                        >
                          <div className={cn("w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-200", libraryEnabled ? "left-4.5" : "left-0.5")} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-gray-700">Allow tips</p>
                          <p className="text-[9px] text-gray-400 font-medium">Clients can add optional payouts</p>
                        </div>
                        <button 
                          onClick={() => setAllowTips(!allowTips)}
                          className={cn("w-9 h-5 rounded-full relative transition-colors duration-200", allowTips ? "bg-[#7eb098]" : "bg-gray-200")}
                        >
                          <div className={cn("w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-200", allowTips ? "left-4.5" : "left-0.5")} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment gate */}
                <div className="flex flex-col border-t border-gray-100 pt-4 gap-2">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                     <div className="flex items-center gap-2.5">
                       <LayoutDashboard size={14} className="text-purple-600" />
                       <span className="text-xs font-bold text-[#191c20]">Payment Gate</span>
                     </div>
                     <button 
                       onClick={() => setPaymentGate(!paymentGate)}
                       className={cn("w-9 h-5 rounded-full relative transition-colors duration-200", paymentGate ? "bg-[#7eb098]" : "bg-gray-200")}
                     >
                       <div className={cn("w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-200", paymentGate ? "left-4.5" : "left-0.5")} />
                     </button>
                  </div>
                  {paymentGate && (
                    <div className="flex items-center gap-2 bg-[#f4f5f8] rounded-xl px-3.5 py-1 text-xs border border-gray-200 animate-in slide-in-from-top-1 duration-200">
                      <span className="font-bold text-gray-400">$</span>
                      <input 
                        type="text" 
                        value={paymentAmount} 
                        onChange={(e) => setPaymentAmount(e.target.value)} 
                        placeholder="150.00" 
                        className="w-full h-8 bg-transparent outline-none font-semibold text-[#191c20]"
                      />
                    </div>
                  )}
                </div>

                {/* Client message (Collapsible presets) */}
                <div className="flex flex-col border-t border-gray-100 pt-4 gap-2">
                  <div 
                    onClick={() => setMessageExpanded(!messageExpanded)}
                    className="flex justify-between items-center cursor-pointer py-1"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans">Client message</span>
                    <ChevronDown size={14} className={cn("text-gray-400 transition-transform", messageExpanded && "rotate-180")} />
                  </div>
                  {messageExpanded && (
                    <div className="flex flex-col gap-2 pt-2 animate-in fade-in duration-200">
                      <textarea 
                        value={messageText} 
                        onChange={(e) => setMessageText(e.target.value)} 
                        placeholder="Write a custom delivery note to client..." 
                        className="w-full min-h-[96px] bg-[#f4f5f8]/50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-[#7eb098] resize-none font-medium text-[#191c20]"
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {presetMessages.map(msg => (
                          <button 
                            key={msg.label} 
                            onClick={() => fillPreset(msg.text)}
                            className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-full text-[9px] font-bold text-gray-500 uppercase font-sans transition-colors"
                          >
                            {msg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Retention / Action Row */}
                <div className="flex gap-2 items-center border-t border-gray-100 pt-4">
                  <div ref={retentionMenuRef} className="relative flex-1">
                    <button 
                      onClick={() => setRetentionOpen(!retentionOpen)}
                      className="w-full py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl text-[11px] font-bold text-gray-600 flex items-center justify-between px-3 transition-colors"
                    >
                      <span>Keep files for {retentionDays} days</span>
                      <ChevronDown size={12} className="text-gray-400" />
                    </button>

                    {/* Retention dropdown opening upward */}
                    {retentionOpen && (
                      <div className="dropdown-menu-surface absolute bottom-12 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-2 flex flex-col gap-1">
                        {['7', '30', '90', 'Unlimited'].map(day => (
                          <button 
                            key={day} 
                            onClick={() => { setRetentionDays(day); setRetentionOpen(false); }}
                            className={cn(
                              "text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-between",
                              retentionDays === day ? "bg-[#7eb098]/10 text-[#7eb098]" : "hover:bg-gray-50 text-gray-700"
                            )}
                          >
                            <span>{day === 'Unlimited' ? 'Keep forever' : `${day} days`}</span>
                            {retentionDays === day && <CheckCircle size={12} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-black hover:border-gray-300 transition-colors">
                    <HelpCircle size={16} />
                  </button>
                </div>

              </div>
            ) : (
              // Create Quote flow
              <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block font-sans">Quote Title</label>
                  <input type="text" placeholder="e.g. Branding Concept Mockups" className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs outline-none focus:border-[#7eb098]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block font-sans">Client name</label>
                  <input type="text" placeholder="Client Name" className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs outline-none focus:border-[#7eb098]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block font-sans">Client email</label>
                  <input type="email" placeholder="client@company.com" className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs outline-none focus:border-[#7eb098]" />
                </div>

                {/* Quick quote builder */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col gap-2">
                  <p className="text-xs font-bold text-gray-700 mb-1">Quote Line Items</p>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-xs font-medium text-gray-600">Design Retainer</span>
                    <span className="text-xs font-sans font-bold">$1,200</span>
                  </div>
                  <button className="py-2 bg-white border border-dashed border-gray-200 rounded-xl text-[10px] font-bold text-[#7eb098] hover:border-gray-400 transition-colors mt-2">
                    + Add Custom Line Item
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Link Ready view state after Publishing */}
        {primaryTab === 'Create' && isPublished && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <div className="bg-green-50/50 rounded-2xl p-5 border border-green-100 text-center flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <CheckCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-green-800">Delivery Link Created!</h4>
                <p className="text-[10px] text-green-600 font-medium mt-0.5">{projectTitle || 'Branding Concept'} is live</p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block font-sans">Client URL</label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-600">
                <span className="truncate flex-1 select-all">deliver.sendational.com/pk-308</span>
                <button className="text-[#7eb098] hover:text-black ml-2 transition-colors">
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 flex items-center justify-center gap-2 transition-colors">
                <Copy size={12} /> Copy link
              </button>
              <button className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 flex items-center justify-center gap-2 transition-colors">
                <Eye size={12} /> Open delivery
              </button>
              <button className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 flex items-center justify-center gap-2 transition-colors">
                <Mail size={12} /> Email
              </button>
              <button 
                onClick={() => setShowQR(!showQR)}
                className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 flex items-center justify-center gap-2 transition-colors"
              >
                <QrCode size={12} /> QR Code
              </button>
            </div>

            {/* QR Block */}
            {showQR && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col items-center gap-3 animate-in fade-in duration-200">
                <div className="w-28 h-28 bg-white border border-gray-100 rounded-lg flex items-center justify-center">
                  {/* Mock QR Code */}
                  <div className="grid grid-cols-4 gap-1 p-2">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className={cn("w-4 h-4 rounded-xs", (i * 3 + 2) % 4 === 0 ? "bg-black" : "bg-transparent")} />
                    ))}
                  </div>
                </div>
                <button className="text-[10px] font-bold text-[#7eb098] hover:underline uppercase tracking-wide font-sans">
                  Download QR Code
                </button>
              </div>
            )}

            <button 
              onClick={resetDelivery}
              className="w-full py-3 bg-[#191c20] hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition-colors mt-4"
            >
              New Delivery
            </button>
          </div>
        )}

        {/* Current deliveries tab */}
        {primaryTab === 'Current' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans">Recent Deliveries</span>
              <button className="text-[10px] font-bold text-[#7eb098] hover:underline uppercase font-sans">Open full</button>
            </div>
            <div className="flex flex-col gap-2.5">
              {QUICK_PROJECTS.map(proj => (
                <div key={proj.id} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl cursor-pointer transition-colors flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#191c20] truncate">{proj.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
                      <span>{proj.client}</span>
                      <span className="h-1 w-1 rounded-full bg-gray-300" />
                      <span>{proj.status}</span>
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Briefing tab */}
        {primaryTab === 'Briefing' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans">Recent Briefing</span>
              <button className="text-[10px] font-bold text-[#7eb098] hover:underline uppercase font-sans">Open full</button>
            </div>
            <div className="flex flex-col gap-2.5">
              {briefingEvents.slice(0, 6).map(event => (
                <div key={event.id} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl cursor-pointer transition-colors flex items-center gap-3">
                  <event.icon size={14} className="text-[#7eb098] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-700 truncate">{event.title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 font-sans text-[9px] text-gray-400">
                      <span>{event.client}</span>
                      <span className="h-1 w-1 rounded-full bg-gray-300" />
                      <span>{event.date}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed action footer */}
      {primaryTab === 'Create' && !isPublished && (
        <div className="p-6 border-t border-gray-100 bg-white shrink-0">
          <div className="flex gap-3">
            <button onClick={() => { setCurrentView('Projects'); onClose(); }} className="flex-1 py-3 bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-bold rounded-xl transition-colors">Projects</button>
            <button 
              onClick={handlePublish}
              className="flex-1 py-3 bg-[#85b99e] text-white hover:bg-opacity-95 text-xs font-bold rounded-xl transition-all shadow-md shadow-[#85b99e]/20"
            >
              Create Project
            </button>
          </div>
          <p className="text-center text-[10px] font-medium text-gray-400 mt-3 font-sans">
            DRAFT AUTOSAVES JUST NOW
          </p>
        </div>
      )}

      {/* Floating QR Toggle Button */}
      {isPublished && (
        <button 
          onClick={() => setShowQRFloating(!showQRFloating)}
          className="absolute bottom-4 right-4 z-40 bg-zinc-900 hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-md transition-all"
        >
          QR Panel
        </button>
      )}

      {/* Floating QR Popout inside widget */}
      {showQRFloating && (
        <div className="absolute bottom-14 right-4 w-[236px] bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl z-50 p-4 flex flex-col items-center gap-3 animate-in fade-in duration-200">
          <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center">
            {/* Mock QR Code */}
            <div className="grid grid-cols-4 gap-1 p-2 bg-white rounded border">
              {[...Array(16)].map((_, i) => (
                <div key={i} className={cn("w-3.5 h-3.5 rounded-xs", (i * 3 + 2) % 4 === 0 ? "bg-black" : "bg-transparent")} />
              ))}
            </div>
          </div>
          <div className="w-full flex flex-col gap-1.5 text-center">
            <button className="text-[10px] font-bold text-gray-500 hover:underline">Copy Link</button>
            <button className="text-[10px] font-bold text-gray-500 hover:underline">Copy Image</button>
            <button className="text-[10px] font-bold text-gray-500 hover:underline">Open Delivery</button>
          </div>
        </div>
      )}
    </div>
  );
};

const QUICK_PROJECTS = [
  { id: 1, name: 'Acme Brand Refresh', client: 'Acme Corp', status: 'In Review', date: 'Just now', live: true },
  { id: 2, name: 'Global UX Phase 2', client: 'GlobalTech', status: 'Pending Approval', date: '2 hrs ago', live: false },
];

// --- APP COMPONENT ---
const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [helpChatOpen, setHelpChatOpen] = useState(false);
  const [currentView, setCurrentView] = useState('Dashboard');
  const [reportsClientFilter, setReportsClientFilter] = useState<string>('all');
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const headerSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        headerSearchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const [activeTab, setActiveTab] = useState<WorkspaceTab>('files');
  const [displaySerifFontId, setDisplaySerifFontId] = useState<DisplaySerifFontId>(() => {
    if (typeof window === 'undefined') return 'perplexity';
    const saved = window.localStorage.getItem(DISPLAY_SERIF_STORAGE_KEY);
    return DISPLAY_SERIF_FONTS.some((font) => font.id === saved)
      ? (saved as DisplaySerifFontId)
      : 'perplexity';
  });
  const activeDisplaySerifFont = DISPLAY_SERIF_FONTS.find((font) => font.id === displaySerifFontId) ?? DISPLAY_SERIF_FONTS[2];

  useEffect(() => {
    document.documentElement.style.setProperty('--display-serif-font', activeDisplaySerifFont.stack);
    window.localStorage.setItem(DISPLAY_SERIF_STORAGE_KEY, activeDisplaySerifFont.id);
  }, [activeDisplaySerifFont]);

  // Shared workspace state
  const [projectsList, setProjectsList] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('sendational_projects_list');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error("Failed to load projects list", err);
    }
    return PROJECTS;
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sendational_projects_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed[0].id;
      }
    } catch (err) {
      console.error(err);
    }
    return PROJECTS[0]?.id || '';
  });

  const [selectedClientName, setSelectedClientName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sendational_projects_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed[0].client.name;
      }
    } catch (err) {
      console.error(err);
    }
    return PROJECTS[0]?.client.name || 'Acme Corp';
  });

  const INITIAL_CLIENT_METADATA = {
    'Acme Corp': { 
      email: 'acme@company.com', 
      poc: 'Dave Connor',
      priority: 'VIP' as const,
      sentiment: 'Exceptional' as const,
      sparklineHistory: [14, 18, 15, 24, 28, 38],
      avatar: 'https://i.pravatar.cc/150?img=32'
    },
    'Startup Inc': { 
      email: 'startup@company.com', 
      poc: 'Michael Chen',
      priority: 'Retainer' as const,
      sentiment: 'Good' as const,
      sparklineHistory: [5, 8, 6, 9, 12, 10],
      avatar: 'https://i.pravatar.cc/150?img=53'
    },
    'GlobalTech': { 
      email: 'globaltech@company.com', 
      poc: 'Sarah Jenkins',
      priority: 'VIP' as const,
      sentiment: 'Good' as const,
      sparklineHistory: [10, 15, 12, 18, 20, 25],
      avatar: 'https://i.pravatar.cc/150?img=11'
    },
    'Broken Co': { 
      email: 'broken@company.com', 
      poc: 'Unknown Manager',
      priority: 'Standard' as const,
      sentiment: 'At Risk' as const,
      sparklineHistory: [1, 2, 0, 1, 0, 1],
      avatar: 'https://i.pravatar.cc/150?img=40'
    }
  };

  const [clientMetadata, setClientMetadata] = useState<Record<string, ClientMetadata>>(() => {
    try {
      const saved = localStorage.getItem('sendational_client_metadata');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.error("Failed to load client metadata", err);
    }
    return INITIAL_CLIENT_METADATA;
  });

  const [briefingEvents, setBriefingEvents] = useState<BriefingEvent[]>(() => {
    try {
      const saved = localStorage.getItem('sendational_briefing_events');
      if (saved) {
        const parsed = JSON.parse(saved) as StoredBriefingEvent[];
        return parsed.map((e) => {
          let icon = FileText;
          if (e.title === 'Project created') icon = Plus;
          else if (e.title === 'Files uploaded') icon = UploadCloud;
          else if (e.title === 'Client viewed') icon = Clock;
          else if (e.title === 'Payment received') icon = CheckCircle;
          else if (e.title === 'Awaiting signature') icon = AlertCircle;
          else if (e.title === 'Portal link copied') icon = Copy;
          else if (e.title === 'Invoice reminder sent') icon = Mail;
          else if (e.title === 'Asset visibility changed') icon = Eye;
          else if (e.title === 'Client note updated' || e.title === 'Handoff note added' || e.title === 'Briefing note logged') icon = FileText;
          else if (e.title === 'Brief approved') icon = CheckCircle;
          else if (e.title === 'Portal settings changed') icon = Settings;
          else if (e.title === 'Payment link copied') icon = Copy;
          else if (e.title === 'Client folder archived') icon = Folder;
          else if (e.title === 'New priority added') icon = Siren;
          else if (e.title === 'Portal traffic spike' || e.title === 'Delivery note saved') icon = Activity;
          return {
            ...e,
            status: e.status ?? e.evidence ?? e.detail,
            nextStep: e.nextStep ?? 'Open the delivery workspace for the next action.',
            icon
          };
        });
      }
    } catch (err) {
      console.error("Failed to load briefing events", err);
    }
    return BRIEFING_EVENTS;
  });

  const [dismissedBriefingIds, setDismissedBriefingIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('sendational_dismissed_briefing_ids');
      if (saved) return JSON.parse(saved) as number[];
    } catch (err) {
      console.error('Failed to load dismissed briefing ids', err);
    }
    return [];
  });

  const [clientNotes, setClientNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('sendational_client_notes');
      if (saved) return JSON.parse(saved) as Record<string, string>;
    } catch (err) {
      console.error('Failed to load client notes', err);
    }
    return INITIAL_CLIENT_NOTES;
  });

  const [notesHighlightClient, setNotesHighlightClient] = useState<string | null>(null);
  const notesHighlightTimer = useRef<number | null>(null);

  const handleBriefingNoteAdded = (clientName: string) => {
    if (notesHighlightTimer.current) window.clearTimeout(notesHighlightTimer.current);
    setNotesHighlightClient(clientName);
    notesHighlightTimer.current = window.setTimeout(() => setNotesHighlightClient(null), 2600);
  };

  const handleDismissBriefingEvent = (eventId: number) => {
    setDismissedBriefingIds((prev) => (prev.includes(eventId) ? prev : [...prev, eventId]));
  };

  useEffect(() => {
    try {
      localStorage.setItem('sendational_dismissed_briefing_ids', JSON.stringify(dismissedBriefingIds));
    } catch (err) {
      console.error(err);
    }
  }, [dismissedBriefingIds]);

  useEffect(() => {
    try {
      localStorage.setItem('sendational_client_notes', JSON.stringify(clientNotes));
    } catch (err) {
      console.error(err);
    }
  }, [clientNotes]);

  useEffect(() => () => {
    if (notesHighlightTimer.current) window.clearTimeout(notesHighlightTimer.current);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sendational_projects_list', JSON.stringify(projectsList));
    } catch (err) {
      console.error(err);
    }
  }, [projectsList]);

  useEffect(() => {
    try {
      localStorage.setItem('sendational_client_metadata', JSON.stringify(clientMetadata));
    } catch (err) {
      console.error(err);
    }
  }, [clientMetadata]);

  const searchResults = React.useMemo(() => {
    const query = headerSearchQuery.toLowerCase().trim();
    if (!query) return [];

    const items: Array<{
      type: 'Page' | 'Client' | 'Project';
      label: string;
      sub: string;
      onSelect: () => void;
    }> = [];

    // Pages
    const pages = [
      { label: 'Dashboard', sub: 'Delivery blockers, live portals, and handoff health', onSelect: () => setCurrentView('Dashboard') },
      { label: 'Action Queue', sub: 'Approval, payment, and portal actions', onSelect: () => setCurrentView('Action Queue') },
      { label: 'Projects', sub: 'Delivery rooms, files, portals, and notes', onSelect: () => { setCurrentView('Projects'); setActiveTab('files'); } },
      { label: 'Calendar', sub: 'Delivery dates, reviews, payment gates, and portal windows', onSelect: () => setCurrentView('Calendar') },
      { label: 'Reports', sub: 'Evidence packs, audit trails, and delivery intelligence', onSelect: () => setCurrentView('Reports') },
    ];
    pages.forEach(p => {
      if (p.label.toLowerCase().includes(query) || p.sub.toLowerCase().includes(query)) {
        items.push({ type: 'Page', label: p.label, sub: p.sub, onSelect: p.onSelect });
      }
    });

    // Clients
    Object.keys(clientMetadata).forEach(name => {
      if (name.toLowerCase().includes(query)) {
        items.push({
          type: 'Client',
          label: name,
          sub: `Select client folder workspace`,
          onSelect: () => {
            setCurrentView('Projects');
            setSelectedClientName(name);
            setActiveTab('files');
          }
        });
      }
    });

    // Projects
    projectsList.forEach(proj => {
      if (proj.name.toLowerCase().includes(query) || proj.client.name.toLowerCase().includes(query)) {
        items.push({
          type: 'Project',
          label: proj.name,
          sub: `Client: ${proj.client.name} ï¿½ ${proj.status}`,
          onSelect: () => {
            setCurrentView('Projects');
            setSelectedClientName(proj.client.name);
            setSelectedProjectId(proj.id);
            setActiveTab('files');
          }
        });
      }
    });

    return items.slice(0, 5);
  }, [headerSearchQuery, clientMetadata, projectsList]);

  useEffect(() => {
    try {
      const serialized: StoredBriefingEvent[] = briefingEvents.map((event) => ({
        id: event.id,
        date: event.date,
        time: event.time,
        relTime: event.relTime,
        title: event.title,
        client: event.client,
        clientName: event.clientName,
        projectId: event.projectId,
        isNew: event.isNew,
        targetTab: event.targetTab,
        detail: event.detail,
        status: event.status,
        nextStep: event.nextStep,
        actionLabel: event.actionLabel,
      }));
      localStorage.setItem('sendational_briefing_events', JSON.stringify(serialized));
    } catch (err) {
      console.error(err);
    }
  }, [briefingEvents]);

  const [chatMessages, setChatMessages] = useState<Record<string, Array<{ id: string; sender: 'user' | 'client'; text: string; time: string }>>>({
    'Acme Corp': [
      { id: '1', sender: 'client', text: "Hey! Just viewed the Brand Guide. Colors look fantastic, but we need to ensure the typography specs are uploaded. Can you double check?", time: 'May 29, 2:14 PM' },
      { id: '2', sender: 'user', text: "Hi Dave! Yes, I just uploaded the typography_specs.pdf to the portal and locked the draft files. You should be able to see them now.", time: 'May 29, 2:30 PM' },
      { id: '3', sender: 'client', text: "Perfect, verified! We're waiting for the Q3 Newsletter assets now. Are they on track for next week?", time: 'Today, 10:15 AM' }
    ],
    'GlobalTech': [
      { id: '1', sender: 'client', text: "Hi, can you update us on the Compliance Dashboard UX audit status? Compliance board needs the PDF.", time: 'Jun 12, 11:05 AM' },
      { id: '2', sender: 'user', text: "Uploaded the compliance dashboard deck and ux_report_final.pdf to the S3 vault. Let me know if compliance needs any changes.", time: 'Jun 12, 11:22 AM' },
      { id: '3', sender: 'client', text: "Looking good, checking with the compliance coordinator now. Will sign off soon.", time: 'Today, 1:40 PM' }
    ],
    'Startup Inc': [
      { id: '1', sender: 'client', text: "Hi! We're preparing our pitch deck presentation. Can you unlock the pricing_structure.xlsx?", time: 'Jul 06, 9:02 AM' },
      { id: '2', sender: 'user', text: "Unlocking it now! Just did. Let me know if you need help with exhibition banner graphics too.", time: 'Jul 06, 9:15 AM' },
      { id: '3', sender: 'client', text: "Got it! Thanks for the quick response. Yes, banner graphics files would be great next week.", time: 'Today, 3:12 PM' }
    ],
    'Broken Co': [
      { id: '1', sender: 'client', text: "We need the deliverables link re-sent, current one seems expired.", time: 'Sep 28, 4:50 PM' }
    ]
  });
  
  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const createDeliveryFromQuickDraft = (draft: QuickDeliveryDraft) => {
    const client = draft.clientName.trim() || 'New Client';
    const title = draft.deliveryTitle.trim() || draft.linkLabel.trim() || 'New Delivery';
    const email = draft.clientEmail.trim() || clientMetadata[client]?.email || 'client@example.com';
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'new-delivery';
    const avatar = clientMetadata[client]?.avatar || `https://i.pravatar.cc/150?img=${Math.abs(client.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 70}`;
    const amount = draft.paymentAmount ? Number.parseFloat(draft.paymentAmount.replace(/[^0-9.]/g, '')) : 0;

    const newDelivery: Project = {
      id: generateProjectId(),
      name: title,
      client: { name: client, email, avatar },
      status: 'Draft',
      amount: Number.isFinite(amount) ? amount : 0,
      date: 'TBD',
      clientLink: slug,
      files: draft.files.map(file => ({
        name: file.name,
        size: file.size,
        type: inferProjectFileType(file.name),
        locked: true
      })),
      accessConfig: { viewCount: 0 }
    };

    setClientMetadata(prev => prev[client] ? prev : {
      ...prev,
      [client]: {
        email,
        poc: client,
        priority: 'Standard',
        sentiment: 'Good',
        sparklineHistory: [0, 1, 0, 2, 1, 2],
        avatar
      }
    });
    setChatMessages(prev => prev[client] ? prev : {
      ...prev,
      [client]: [{
        id: generateUniqueId('m-sys'),
        sender: 'client',
        text: `Delivery workspace created for ${title}.`,
        time: 'System initialization'
      }]
    });
    setProjectsList(prev => [newDelivery, ...prev]);
    setSelectedClientName(client);
    setSelectedProjectId(newDelivery.id);
    setCurrentView('Projects');
    setIsDeliveryOpen(false);
    showToast(`Project "${title}" created.`);
  };



  // Lifted Reply State from Carousel to drive layout transition
  const [isCarouselReplying, setIsCarouselReplying] = useState(false);

  const [primaryTab, setPrimaryTab] = useState('Create');
  const [createTab, setCreateTab] = useState('Project');

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Action Queue', icon: Inbox },
    { name: 'Projects', icon: Briefcase },
    { name: 'Calendar', icon: Calendar },
    { name: 'Reports', icon: ChartIcon },
    { name: 'Settings', icon: Settings }
  ];

  const VIEW_SUBTITLES: Record<string, string> = {
    'Action Queue': 'Triage approval, payment, portal, and client reply blockers.',
    Projects: 'Manage delivery rooms, protected files, client portals, and handoff notes.',
    Calendar: 'Plan delivery dates, reviews, payment gates, and portal windows.',
    Reports: 'Export evidence packs and inspect delivery audit intelligence.',
    Settings: 'Manage your brand, storage, payments, and workspace settings.',
  };

  return (
    <div className="h-screen w-screen bg-[#5b626a] flex font-sans overflow-hidden">
      
      {/* Collapsible Sidebar */}
      <aside className={cn(
        "flex flex-col shrink-0 text-[#9ba0a8] py-8 transition-all duration-300 ease-in-out relative z-10",
        isSidebarOpen ? "w-[196px]" : "w-[60px] items-center"
      )}>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-10 w-6 h-6 bg-white rounded-full flex items-center justify-center text-gray-500 shadow-md z-50 hover:scale-110 transition-transform"
        >
           <ChevronRight size={14} className={cn("transition-transform duration-300", isSidebarOpen ? "rotate-180" : "rotate-0")} />
        </button>

        <Logo collapsed={!isSidebarOpen} />

        <div className={cn("flex flex-col items-center mb-10 relative", isSidebarOpen ? "px-6" : "px-0")}>
          <div className="relative mb-3 z-10">
            {/* Grill grid pattern (6x6) offset to top-right behind profile photo */}
            {isSidebarOpen && (
              <svg width="48" height="48" viewBox="0 0 48 48" className="absolute left-[36px] -top-3 text-white/15 pointer-events-none z-0">
                <g fill="currentColor">
                  {/* Row 1 */}
                  <circle cx="2" cy="2" r="1.2" />
                  <circle cx="10" cy="2" r="1.2" />
                  <circle cx="18" cy="2" r="1.2" />
                  <circle cx="26" cy="2" r="1.2" />
                  <circle cx="34" cy="2" r="1.2" />
                  <circle cx="42" cy="2" r="1.2" />
                  {/* Row 2 */}
                  <circle cx="2" cy="10" r="1.2" />
                  <circle cx="10" cy="10" r="1.2" />
                  <circle cx="18" cy="10" r="1.2" />
                  <circle cx="26" cy="10" r="1.2" />
                  <circle cx="34" cy="10" r="1.2" />
                  <circle cx="42" cy="10" r="1.2" />
                  {/* Row 3 */}
                  <circle cx="2" cy="18" r="1.2" />
                  <circle cx="10" cy="18" r="1.2" />
                  <circle cx="18" cy="18" r="1.2" />
                  <circle cx="26" cy="18" r="1.2" />
                  <circle cx="34" cy="18" r="1.2" />
                  <circle cx="42" cy="18" r="1.2" />
                  {/* Row 4 */}
                  <circle cx="2" cy="26" r="1.2" />
                  <circle cx="10" cy="26" r="1.2" />
                  <circle cx="18" cy="26" r="1.2" />
                  <circle cx="26" cy="26" r="1.2" />
                  <circle cx="34" cy="26" r="1.2" />
                  <circle cx="42" cy="26" r="1.2" />
                  {/* Row 5 */}
                  <circle cx="2" cy="34" r="1.2" />
                  <circle cx="10" cy="34" r="1.2" />
                  <circle cx="18" cy="34" r="1.2" />
                  <circle cx="26" cy="34" r="1.2" />
                  <circle cx="34" cy="34" r="1.2" />
                  <circle cx="42" cy="34" r="1.2" />
                  {/* Row 6 */}
                  <circle cx="2" cy="42" r="1.2" />
                  <circle cx="10" cy="42" r="1.2" />
                  <circle cx="18" cy="42" r="1.2" />
                  <circle cx="26" cy="42" r="1.2" />
                  <circle cx="34" cy="42" r="1.2" />
                  <circle cx="42" cy="42" r="1.2" />
                </g>
              </svg>
            )}
            
            <img src={AVATARS[0]} alt="Profile" className={cn("rounded-full object-cover border-2 border-transparent transition-all duration-300 relative z-10", isSidebarOpen ? "w-[60px] h-[60px]" : "w-[44px] h-[44px]")} />
            {isSidebarOpen && (
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#1a1b1d] rounded-full flex items-center justify-center border-2 border-[#5b626a] text-white text-[10px] font-bold z-20">
                N
              </div>
            )}
          </div>
          {isSidebarOpen && <span className="text-white font-medium text-sm z-10 relative">Jennifer Rass</span>}
        </div>

        <nav className={cn("flex-1 space-y-1.5", isSidebarOpen ? "px-4" : "px-2 w-full")}>
          {navItems.map((item) => (
            <div 
              key={item.name}
              onClick={() => setCurrentView(item.name)}
              className={cn(
                "flex items-center py-3 font-medium cursor-pointer relative transition-colors duration-300 select-none",
                isSidebarOpen ? "gap-4 px-4 text-sm" : "justify-center px-0 text-xs w-full h-12",
                currentView === item.name ? "text-[#191c20]" : "text-[#9ba0a8] hover:text-white"
              )}
            >
              {currentView === item.name && (
                <>
                  <span className={cn(
                    "absolute inset-y-0 left-0 bg-[#f4f5f8] rounded-l-full z-0 origin-right animate-bubble-slide pointer-events-none",
                    isSidebarOpen ? "right-0 -mr-4" : "right-0 -mr-2"
                  )} />
                  <span className={cn(
                    "absolute right-0 bottom-full w-5 h-5 pointer-events-none overflow-hidden z-0 animate-fade-in",
                    isSidebarOpen ? "-mr-4" : "-mr-2"
                  )}>
                    <span className="absolute top-0 left-0 w-full h-full bg-transparent rounded-br-[20px] shadow-[10px_10px_0_10px_#f4f5f8]" />
                  </span>
                  <span className={cn(
                    "absolute right-0 top-full w-5 h-5 pointer-events-none overflow-hidden z-0 animate-fade-in",
                    isSidebarOpen ? "-mr-4" : "-mr-2"
                  )}>
                    <span className="absolute bottom-0 left-0 w-full h-full bg-transparent rounded-tr-[20px] shadow-[10px_-10px_0_10px_#f4f5f8]" />
                  </span>
                </>
              )}
              <item.icon size={18} className="shrink-0 relative z-10" />
              {isSidebarOpen && <span className="relative z-10 font-sans">{item.name}</span>}
            </div>
          ))}
        </nav>

        <div className={cn("mt-auto transition-all duration-300 flex flex-col gap-4 w-full", isSidebarOpen ? "px-4" : "px-2 items-center")}>
          {isSidebarOpen ? (
            <>
              <div
                className={cn(
                  "rounded-[24px] p-4 flex flex-col items-center text-center shadow-lg relative overflow-hidden group cursor-pointer w-full transition-all duration-300 border",
                  isDeliveryOpen
                    ? "bg-[#191c20] text-white border-white/10 shadow-[0_18px_36px_-24px_rgba(0,0,0,0.9)]"
                    : "bg-[#687079] text-[#cfd2d7] border-transparent"
                )}
                onClick={() => setIsDeliveryOpen(!isDeliveryOpen)}
              >
                <div className={cn("absolute inset-0 border-[1.5px] border-dashed rounded-[24px] m-1.5 z-0 pointer-events-none transition-colors", isDeliveryOpen ? "border-white/20" : "border-[#8d949c] group-hover:border-white/50")} />
                <div className="relative z-10 flex flex-col items-center pt-2 pb-1">
                  <h4 className={cn("font-medium text-sm mb-0.5", isDeliveryOpen ? "text-white" : "text-white")}>Quick Delivery</h4>
                  <p className={cn("text-[10px] mb-5 font-medium transition-colors duration-300", isDeliveryOpen ? "text-[#cfd2d7]" : "text-[#cfd2d7]")}>
                    {isDeliveryOpen ? 'Delivery drawer open' : 'Quickly create a project'}
                  </p>
                  <button type="button" className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-350", isDeliveryOpen ? "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/20 hover:scale-110" : "bg-white text-[#191c20] hover:scale-110")}>
                    {isDeliveryOpen ? <X size={16} /> : <Plus size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1 w-full border-t border-[#687079]/50 pt-3">
                <button 
                  type="button"
                  onClick={() => setHelpChatOpen((open) => !open)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold hover:text-white hover:bg-white/10 transition-all text-left w-full cursor-pointer",
                    helpChatOpen ? "text-white bg-white/10" : "text-[#cfd2d7]"
                  )}
                  aria-expanded={helpChatOpen}
                >
                  <MessageCircle size={15} /> {helpChatOpen ? 'Close Help' : 'Help Chat'}
                </button>
                <button 
                  onClick={() => showToast("Signing out...")}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#cfd2d7] hover:text-[#ff5b4f] hover:bg-red-500/10 transition-all text-left w-full cursor-pointer"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsDeliveryOpen(!isDeliveryOpen)}
                className={cn(
                  "w-12 h-12 rounded-[16px] flex items-center justify-center shadow-xl transition-all duration-300 shrink-0 cursor-pointer",
                  isDeliveryOpen ? "bg-[#191c20] text-white ring-1 ring-white/10 hover:bg-black hover:scale-105" : "bg-white text-[#191c20] hover:scale-105"
                )}
                title="Quick Delivery"
              >
                {isDeliveryOpen ? <X size={20} /> : <Plus size={20} />}
              </button>
              <div className="flex flex-col gap-2 items-center w-full border-t border-[#687079]/50 pt-3">
                <button 
                  type="button"
                  onClick={() => setHelpChatOpen((open) => !open)}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center hover:text-white hover:bg-white/10 transition-colors cursor-pointer",
                    helpChatOpen ? "text-white bg-white/10" : "text-[#cfd2d7]"
                  )}
                  title={helpChatOpen ? 'Close Help Chat' : 'Help Chat'}
                  aria-expanded={helpChatOpen}
                >
                  <MessageCircle size={16} />
                </button>
                <button 
                  onClick={() => showToast("Signing out...")}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[#cfd2d7] hover:text-[#ff5b4f] hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area - Curved left edge to merge with sidebar, no top/bottom/right margins */}
      <main className="flex-1 bg-[#f4f5f8] flex relative overflow-hidden isolate rounded-l-[2.5rem]">
        <div
          className={cn(
            "absolute top-0 left-0 h-full z-50 flex flex-col transition-transform duration-500 ease-out pointer-events-none",
            isDeliveryOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="pointer-events-auto h-full">
            <DeliveryWidget
              primaryTab={primaryTab}
              setPrimaryTab={setPrimaryTab}
              createTab={createTab}
              setCreateTab={setCreateTab}
              onClose={() => setIsDeliveryOpen(false)}
              onCreateDelivery={createDeliveryFromQuickDraft}
              setCurrentView={setCurrentView}
              briefingEvents={briefingEvents}
            />
          </div>
          {/* DELIVER+ edge pull tab removed ï¿½ open via sidebar Quick Delivery card only */}
        </div>

        <div className={cn(
          "flex-1 flex flex-col h-full w-full transition-all duration-500 ease-out",
          isDeliveryOpen ? "ml-[360px]" : "ml-0"
        )}>
          {/* Header */}
          <header className="px-4 sm:px-6 md:px-8 lg:px-11 pt-6 sm:pt-10 pb-4 sm:pb-6 flex items-center justify-between z-10 shrink-0">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-4">
                <h1 className="text-[26px] font-fraunces font-semibold text-[#191c20] tracking-tight">{currentView}</h1>
                {currentView === 'Dashboard' && <span className="bg-[#7eb098]/15 text-[#7eb098] border border-[#7eb098]/30 text-[9px] font-sans font-bold px-3 py-1 rounded-full tracking-wider uppercase animate-pulse">3 Active Portals</span>}
              </div>
              {currentView !== 'Dashboard' && VIEW_SUBTITLES[currentView] && (
                <p className="text-[#5b626a] text-xs font-medium font-sans leading-relaxed">{VIEW_SUBTITLES[currentView]}</p>
              )}
            </div>

            <div className="flex items-center gap-4 lg:gap-6">
              <div className="hidden xl:flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm border border-white/80">
                <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-[#9ba0a8]">Serif</span>
                <select
                  aria-label="Display serif font"
                  value={displaySerifFontId}
                  onChange={(e) => setDisplaySerifFontId(e.target.value as DisplaySerifFontId)}
                  className="max-w-[174px] bg-transparent text-[12px] font-fraunces font-semibold text-[#191c20] outline-none cursor-pointer"
                  style={{ fontFamily: activeDisplaySerifFont.stack }}
                >
                  {DISPLAY_SERIF_FONTS.map((font) => (
                    <option key={font.id} value={font.id}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hidden lg:flex items-center gap-3 text-[#9ba0a8] mr-4 relative">
                <Search size={18} strokeWidth={2.5} />
                <input
                  ref={headerSearchRef}
                  type="text"
                  value={headerSearchQuery}
                  onChange={(e) => setHeaderSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    // Delay to allow result selection clicks to resolve before losing focus
                    setTimeout(() => setIsSearchFocused(false), 200);
                  }}
                  placeholder="Search something..."
                  className="bg-transparent border-none outline-none text-[15px] w-48 text-[#191c20] placeholder-[#9ba0a8] font-medium"
                />
                
                {/* Elegant Command Bar Dropdown Overlay */}
                {isSearchFocused && (
                  <div className="absolute top-full right-0 mt-2.5 w-80 bg-white border border-gray-150 rounded-xl shadow-lg z-50 p-2 text-left font-sans text-xs animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="px-3 py-1.5 text-[9px] font-bold text-gray-405 uppercase tracking-widest border-b border-gray-50 flex items-center justify-between">
                      <span>Command Menu</span>
                      <span className="text-[8px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-mono font-normal">?K</span>
                    </div>
                    
                    <div className="mt-1 max-h-64 overflow-y-auto scrollbar-thin divide-y divide-gray-50">
                      {searchResults.length > 0 ? (
                        searchResults.map((item, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={item.onSelect}
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50/70 transition-colors flex items-center justify-between cursor-pointer group"
                          >
                            <div>
                              <p className="font-semibold text-gray-800 group-hover:text-[#7eb098] transition-colors">{item.label}</p>
                              <p className="text-[10px] text-gray-450 font-medium mt-0.5">{item.sub}</p>
                            </div>
                            <span className="text-[8.5px] font-sans font-extrabold uppercase tracking-wide text-[#484782] bg-[#484782]/10 px-1.5 py-0.5 rounded shrink-0">
                              {item.type}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-400">
                          {headerSearchQuery.trim() ? (
                            <p className="text-xs">No matching commands or pages</p>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-[10.5px] font-bold text-gray-500">Try typing to search:</p>
                              <p className="text-[9.5px] font-medium text-gray-400">"Dashboard", "Projects", client name, or project title</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button className="w-10 h-10 lg:w-11 lg:h-11 bg-white rounded-2xl flex items-center justify-center text-[#9ba0a8] hover:text-black transition-colors shadow-sm">
                <Bell size={18} />
              </button>
              <button className="hidden sm:flex w-11 h-11 bg-white rounded-2xl items-center justify-center text-[#9ba0a8] hover:text-black transition-colors shadow-sm">
                <ArrowRight size={18} />
              </button>
              <button className="bg-[#85b99e] text-white px-5 lg:px-6 py-2.5 lg:py-3 rounded-[14px] font-medium hover:bg-opacity-90 transition-opacity shadow-sm text-sm ml-2 shrink-0">
                Upgrade Plan
              </button>
            </div>
          </header>

          {/* Scrollable Content Routing */}
          <div
            key={currentView}
            className={cn(
              'flex-1 overflow-x-hidden flex flex-col animate-route-in min-h-0',
              ['Action Queue', 'Calendar', 'Projects', 'Reports', 'Settings'].includes(currentView)
                ? 'px-0 pb-0 overflow-hidden'
                : 'px-4 sm:px-6 md:px-8 lg:px-11 pb-4 sm:pb-5 overflow-y-auto xl:overflow-y-hidden',
              currentView === 'Dashboard' && 'px-4 sm:px-6 md:px-8 lg:px-11 pb-0 xl:overflow-hidden'
            )}
          >
            {currentView === 'Dashboard' && (
              <DashboardView 
                isReplying={isCarouselReplying}
                setIsReplying={setIsCarouselReplying}
                setCurrentView={setCurrentView}
                setActiveTab={setActiveTab}
                setSelectedClientName={setSelectedClientName}
                setSelectedProjectId={setSelectedProjectId}
                onOpenQuickDelivery={() => setIsDeliveryOpen(true)}
                briefingEvents={briefingEvents}
                setBriefingEvents={setBriefingEvents}
                clientMetadata={clientMetadata}
                setClientMetadata={setClientMetadata}
                projectsList={projectsList}
                setClientNotes={setClientNotes}
                onBriefingNoteAdded={handleBriefingNoteAdded}
                dismissedBriefingIds={dismissedBriefingIds}
                onDismissBriefingEvent={handleDismissBriefingEvent}
              />
            )}
            {currentView === 'Action Queue' && (
              <ActionQueueView
                clientMetadata={clientMetadata}
                setSelectedClientName={setSelectedClientName}
                setSelectedProjectId={setSelectedProjectId}
                projectsList={projectsList}
                setCurrentView={setCurrentView}
                setActiveTab={setActiveTab}
              />
            )}
            {currentView === 'Projects' && (
              <WorkspaceView
                projectsList={projectsList}
                setProjectsList={setProjectsList}
                selectedProjectId={selectedProjectId}
                setSelectedProjectId={setSelectedProjectId}
                selectedClientName={selectedClientName}
                setSelectedClientName={setSelectedClientName}
                clientMetadata={clientMetadata}
                setClientMetadata={setClientMetadata}
                chatMessages={chatMessages}
                setChatMessages={setChatMessages}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                clientNotes={clientNotes}
                setClientNotes={setClientNotes}
                notesHighlightClient={notesHighlightClient}
                briefingEvents={briefingEvents}
              />
            )}
            {currentView === 'Calendar' && (
              <CalendarView
                projectsList={projectsList}
                clientMetadata={clientMetadata}
                setSelectedClientName={setSelectedClientName}
                setSelectedProjectId={setSelectedProjectId}
                setCurrentView={setCurrentView}
                setActiveTab={setActiveTab}
              />
            )}
            {currentView === 'Reports' && (
              <ReportsView
                key="reports-evidence-first-v3"
                showToast={showToast}
                clientMetadata={clientMetadata}
                clientFilter={reportsClientFilter}
                onClientFilterChange={setReportsClientFilter}
              />
            )}
            {currentView === 'Settings' && <SettingsView />}
          </div>
        </div>

        {/* Global Toast */}
        <HelpChatPanel open={helpChatOpen} onClose={() => setHelpChatOpen(false)} />

        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-[#191c20] text-white px-5 py-3 rounded-2xl shadow-2xl z-[9999] text-[11px] font-bold tracking-wide uppercase font-sans animate-in slide-in-from-bottom-2 duration-300 flex items-center gap-2.5 border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-[#7eb098] animate-pulse" />
            {toastMessage}
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
