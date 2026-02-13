
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, UserProfile, ProjectTheme } from '../types';
import { DB, supabase } from '../services/supabaseClient'; // Import the Real Backend Service

// --- MOCK DATA CONSTANTS (Moved from App.tsx for Fallback) ---

const DEFAULT_THEME_MOCK: ProjectTheme = {
    name: 'Concrete Vault',
    wallpaper: 'https://images.unsplash.com/photo-1518112390430-f4ab02e9c2c8?q=80&w=2000&auto=format&fit=crop',
    brightness: 'dark',
    showGrain: true,
    pattern: 'lines'
};

const INITIAL_USER: UserProfile = {
    id: 'u1',
    name: 'Bogdan Nikitin',
    email: 'bogdan@nixtio.com',
    avatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=Bogdan&backgroundColor=0a0a0a&shape1Color=bef264&shape2Color=ffffff&shape3Color=52525b',
    role: '@Nixtio',
    subdomain: 'nashua',
    stripeConnect: {
        accountId: '',
        connected: false,
        displayName: '',
        chargesEnabled: false,
        payoutsEnabled: false,
    },
    paymentMethods: {
        venmo: 'bogdan-design',
        cashapp: '$bogdan_ui',
        zelle: 'bogdan@nixtio.com',
        bankInfo: 'Routing: 123456789\nAccount: 987654321'
    },
    agencySettings: {
        cname: '',
        cnameVerified: false,
        customSmtp: false,
        removeBranding: false,
        dataRetentionDays: 30,
        supportEmail: 'help@nixtio.com'
    },
    storageSettings: {
        provider: 'r2',
        endpoint: 'https://<ACCOUNT_ID>.r2.cloudflarestorage.com',
        bucket: 'truehandover-assets',
        accessKey: '', // Cleared for security
        secretKey: '', // Cleared for security
        accountId: ''
    }
};

const INITIAL_PROJECTS: Project[] = [
    {
        id: 'p1',
        name: 'Brand Identity Package',
        description: 'Identity',
        client: { name: 'John Smith', email: 'alex@vertex.io', company: 'Vertex', avatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=JohnSmith&backgroundColor=18181b&shape1Color=3b82f6&shape2Color=93c5fd&shape3Color=1e3a8a' },
        amount: 2500,
        status: 'awaiting_payment',
        createdAt: '2023-09-30',
        dueDate: '2023-11-01',
        requiresSignature: true,
        clientLink: '#',
        type: 'brand',
        theme: DEFAULT_THEME_MOCK,
        milestones: [],
        files: [
            {
                id: 'f1',
                name: 'logo_final.png',
                size: '2.1 MB',
                type: 'image',
                locked: true,
                version: 1,
                uploadDate: '2023-10-28',
                tag: 'FINAL',
                previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=70',
                metadata: { resolution: '4096x4096', colorProfile: 'CMYK', dpi: 300, hash: '8f434346648f6b96df89dda901c5176b' }
            },
            {
                id: 'f2',
                name: 'brand_guide.pdf',
                size: '4.2 MB',
                type: 'pdf',
                locked: true,
                externalUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                version: 1,
                uploadDate: '2023-10-28',
                tag: 'DOCS',
                // Abstract, premium cover (no people)
                previewUrl: 'https://images.unsplash.com/photo-1533228876829-65c94e7b5025?auto=format&fit=crop&w=900&q=70',
                metadata: { pages: 24, resolution: 'Print Ready', hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6' }
            },
            {
                id: 'f3',
                name: 'social_media.zip',
                size: '12 MB',
                type: 'archive',
                locked: true,
                version: 1,
                uploadDate: '2023-10-28',
                tag: 'ASSETS',
                // Abstract, premium cover (no people)
                previewUrl: 'https://images.unsplash.com/photo-1621619856624-42fd193a0661?auto=format&fit=crop&w=900&q=70',
                metadata: { hash: 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0', software: 'Archive' }
            },
            {
                id: 'f6',
                name: 'logo_reveal.mp4',
                size: '18.4 MB',
                type: 'video',
                locked: true,
                externalUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
                version: 1,
                uploadDate: '2023-10-28',
                tag: 'VIDEO',
                previewUrl: 'https://images.unsplash.com/photo-1536514498073-50e69d39c6cf?auto=format&fit=crop&w=900&q=70',
                metadata: { duration: '00:30', resolution: '1080p', hash: 'vid_8f434346648f6b96df89dda901c5176b' }
            },
            {
                id: 'f7',
                name: 'brand_theme.mp3',
                size: '3.1 MB',
                type: 'audio',
                locked: true,
                externalUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
                version: 1,
                uploadDate: '2023-10-28',
                tag: 'AUDIO',
                previewUrl: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=900&q=70',
                metadata: { duration: '00:07', hash: 'aud_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6' }
            }
        ]
    },
    {
        id: 'p2',
        name: 'Website Redesign',
        description: 'UI Assets',
        client: { name: 'Sarah Chen', email: 'm@mono.io', company: 'Mono', avatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=SarahChen&backgroundColor=0f172a&shape1Color=f472b6&shape2Color=fbcfe8&shape3Color=831843' },
        amount: 5000,
        status: 'paid',
        createdAt: '2023-09-28',
        dueDate: '2023-10-15',
        requiresSignature: false,
        clientLink: '#',
        type: 'web',
        theme: DEFAULT_THEME_MOCK,
        clientViewedAt: '2023-10-01T14:30:00Z',
        milestones: [],
        files: [
            {
                id: 'f4',
                name: 'homepage.fig',
                size: '8.5 MB',
                type: 'design',
                locked: false,
                version: 1,
                uploadDate: '2023-10-28',
                tag: 'SOURCE',
                // Abstract, premium cover (no people)
                previewUrl: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=900&q=70',
                metadata: { software: 'Figma', hash: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8' }
            },
            {
                id: 'f5',
                name: 'website_demo.mp4',
                size: '45 MB',
                type: 'video',
                locked: false,
                externalUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
                version: 1,
                uploadDate: '2023-10-28',
                tag: 'DEMO',
                // Abstract, premium cover (no people)
                previewUrl: 'https://images.unsplash.com/photo-1536514498073-50e69d39c6cf?auto=format&fit=crop&w=900&q=70',
                metadata: { duration: '00:45', resolution: '1080p', hash: '5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u' }
            },
        ]
    },
    {
        id: 'p4',
        name: 'Q4 Financial Report',
        description: 'Financials',
        client: { name: 'Jin', email: 'j@corp.com', company: 'Corp', avatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=Jin&backgroundColor=171717&shape1Color=2dd4bf&shape2Color=ccfbf1&shape3Color=115e59' },
        amount: 1200,
        status: 'completed',
        createdAt: '2023-09-28',
        dueDate: '2023-10-01',
        requiresSignature: false,
        clientLink: '#',
        type: 'web',
        theme: DEFAULT_THEME_MOCK,
        milestones: [],
        files: []
    },
    {
        id: 'p5',
        name: 'Mobile App Prototype',
        description: 'UX Design',
        client: { name: 'Mike Ross', email: 'mike@pearson.com', company: 'Pearson', avatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=MikeRoss&backgroundColor=27272a&shape1Color=a78bfa&shape2Color=ddd6fe&shape3Color=5b21b6' },
        amount: 3500,
        status: 'draft',
        createdAt: '2023-10-05',
        dueDate: '2023-11-15',
        requiresSignature: true,
        clientLink: '#',
        type: 'web',
        theme: DEFAULT_THEME_MOCK,
        milestones: [],
        files: []
    }
];

// --- STORE CONTEXT ---

interface StoreContextType {
    projects: Project[];
    user: UserProfile;
    saveProject: (project: Project) => void;
    updateUser: (updates: Partial<UserProfile>) => void;
    deleteProject: (id: string) => void;
    resetStore: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Lazy initialization from LocalStorage
    const [projects, setProjects] = useState<Project[]>(() => {
        try {
            const stored = localStorage.getItem('th_projects');
            return stored ? JSON.parse(stored) : INITIAL_PROJECTS;
        } catch (e) {
            console.error("Failed to load projects", e);
            return INITIAL_PROJECTS;
        }
    });

    const [user, setUser] = useState<UserProfile>(() => {
        try {
            const stored = localStorage.getItem('th_user');
            return stored ? JSON.parse(stored) : INITIAL_USER;
        } catch (e) {
            console.error("Failed to load user", e);
            return INITIAL_USER;
        }
    });

    // --- SUPABASE SYNC LOGIC ---
    useEffect(() => {
        // If Supabase is connected, try to fetch real data
        const loadFromSupabase = async () => {
            if (supabase) {
                console.log("Supabase connected. Attempting to fetch user data...");
                const { data: dbUser } = await DB.getProfile(user.id);
                if (dbUser) {
                    console.log("Synced user from Supabase");
                    // In a real app, we would map DB columns to frontend types here
                }

                const { data: dbProjects } = await DB.getProjects();
                if (dbProjects && dbProjects.length > 0) {
                    console.log("Synced projects from Supabase");
                    // Map logic would go here
                }
            }
        };
        loadFromSupabase();
    }, []);

    // Persistence Effects
    useEffect(() => {
        localStorage.setItem('th_projects', JSON.stringify(projects));
    }, [projects]);

    useEffect(() => {
        localStorage.setItem('th_user', JSON.stringify(user));
    }, [user]);

    // Actions
    const saveProject = (updatedProject: Project) => {
        setProjects(prev => {
            const idx = prev.findIndex(pr => pr.id === updatedProject.id);
            if (idx >= 0) {
                const newArr = [...prev];
                newArr[idx] = updatedProject;
                return newArr;
            }
            return [updatedProject, ...prev]; // Add new projects to top
        });
    };

    const deleteProject = (id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
    };

    const updateUser = (updates: Partial<UserProfile>) => {
        setUser(prev => ({
            ...prev,
            ...updates
        }));
    };

    const resetStore = () => {
        setProjects(INITIAL_PROJECTS);
        setUser(INITIAL_USER);
        localStorage.removeItem('th_projects');
        localStorage.removeItem('th_user');
    };

    return (
        <StoreContext.Provider value={{ projects, user, saveProject, updateUser, deleteProject, resetStore }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};
