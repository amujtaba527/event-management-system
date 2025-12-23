'use client';

import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { User, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
    const { login } = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            login(data.user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            {/* Background Decor */}
            <div className="noise-bg absolute inset-0 z-0" />
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-sky-200/40 rounded-full blur-3xl opacity-50 animate-pulse-slow" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-slate-200/40 rounded-full blur-3xl opacity-50" />

            <Card className="w-full max-w-md relative z-10 glass-card border-white/40 shadow-2xl shadow-slate-200/50">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white mb-4 shadow-lg shadow-slate-900/20">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Brick School Events
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm">
                        Enter your credentials to access the portal
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="admin@brick.school"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        icon={<User className="w-4 h-4" />}
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        icon={<Lock className="w-4 h-4" />}
                    />

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center animate-shake">
                            <span className="mr-2">⚠️</span>
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full mt-2"
                        size="lg"
                        isLoading={loading}
                    >
                        Sign In <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </form>

                <div className="mt-8 text-center text-xs text-slate-400">
                    Protected by minimalist design & plain text passwords.
                </div>
            </Card>
        </div>
    );
}
