import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'glass-card rounded-xl p-6 transition-all duration-300',
                className
            )}
            {...props}
        />
    )
);
Card.displayName = 'Card';

export { Card };
