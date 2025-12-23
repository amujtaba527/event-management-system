import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-slate-900 text-white shadow hover:bg-slate-900/80',
                secondary: 'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80',
                destructive: 'border-transparent bg-red-500 text-white shadow hover:bg-red-500/80',
                outline: 'text-foreground',
                success: 'border-transparent bg-green-500 text-white shadow hover:bg-green-600',
                warning: 'border-transparent bg-yellow-400 text-yellow-900 shadow hover:bg-yellow-500',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface BadgeProps
    extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
