import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
                    // Variants
                    variant === 'primary' && 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] active:scale-95 shadow-lg shadow-slate-900/20',
                    variant === 'secondary' && 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md active:scale-95',
                    variant === 'outline' && 'border-2 border-slate-200 bg-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                    variant === 'ghost' && 'bg-transparent text-slate-600 hover:bg-slate-100/50 hover:text-slate-900',
                    variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20 hover:scale-[1.02] active:scale-95',

                    // Sizes
                    size === 'sm' && 'h-9 px-3 text-sm',
                    size === 'md' && 'h-11 px-6 text-base',
                    size === 'lg' && 'h-14 px-8 text-lg',
                    size === 'icon' && 'h-10 w-10 p-2',
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';

export { Button };
