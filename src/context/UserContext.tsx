'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'admin' | 'seller' | 'scanner';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

interface UserContextType {
    user: User | null;
    loading: boolean;
    login: (userData: User) => void;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check localStorage on mount
        const storedUser = localStorage.getItem('brick_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse stored user', e);
                localStorage.removeItem('brick_user');
            }
        }
        setLoading(false);
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('brick_user', JSON.stringify(userData));
        // Redirect based on role
        if (userData.role === 'admin') router.push('/admin/dashboard');
        else if (userData.role === 'seller') router.push('/seller');
        else if (userData.role === 'scanner') router.push('/scanner');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('brick_user');
        router.push('/login');
    };

    return (
        <UserContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
