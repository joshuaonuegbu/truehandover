
// Mock Backend Services for TrueHandover

export const AuthService = {
    signIn: async (email: string, pass: string) => {

        // Simulate successful login
        return { success: true, data: { user: { id: 'mock-user-123', email } } };
    },
    signUp: async (email: string, pass: string, name: string) => {

        return { success: true };
    },
    signOut: async () => {

        return { success: true };
    },
};

export const ProjectService = {
    getProjects: async () => {

        return { success: true, data: [] };
    },
    createProject: async (data: any) => {

        return { 
            success: true, 
            data: { 
                id: 'proj_' + Math.random().toString(36).substr(2, 9), 
                ...data,
                client_link: `https://truehandover.com/preview/proj_${Math.random().toString(36).substr(2, 6)}`
            } 
        };
    },
    updateProject: async (id: string, data: any) => {

        return { success: true };
    },
    deleteProject: async (id: string) => {

        return { success: true };
    }
};

export const MilestoneService = {
    createMilestones: async (projectId: string, milestones: any[]) => {

        return { success: true };
    }
};

export const FileService = {
    uploadFile: async (file: File) => {

        return { success: true, url: URL.createObjectURL(file) };
    }
};
