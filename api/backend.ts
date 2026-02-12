
// Mock Backend Services for TrueHandover

export const AuthService = {
    signIn: async (email: string, pass: string) => {
        console.log('TrueHandover: Mock Sign In', email);
        // Simulate successful login
        return { success: true, data: { user: { id: 'mock-user-123', email } } };
    },
    signUp: async (email: string, pass: string, name: string) => {
        console.log('TrueHandover: Mock Sign Up', email, name);
        return { success: true };
    },
    signOut: async () => {
        console.log('TrueHandover: Mock Sign Out');
        return { success: true };
    },
};

export const ProjectService = {
    getProjects: async () => {
        console.log('TrueHandover: Fetching projects');
        return { success: true, data: [] };
    },
    createProject: async (data: any) => {
        console.log('TrueHandover: Creating project', data);
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
        console.log('TrueHandover: Updating project', id, data);
        return { success: true };
    },
    deleteProject: async (id: string) => {
        console.log('TrueHandover: Deleting project', id);
        return { success: true };
    }
};

export const MilestoneService = {
    createMilestones: async (projectId: string, milestones: any[]) => {
        console.log('TrueHandover: Creating milestones for', projectId, milestones);
        return { success: true };
    }
};

export const FileService = {
    uploadFile: async (file: File) => {
        console.log('TrueHandover: Uploading file', file.name);
        return { success: true, url: URL.createObjectURL(file) };
    }
};
