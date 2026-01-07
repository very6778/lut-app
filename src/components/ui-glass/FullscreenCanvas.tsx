import { ReactNode } from 'react';

interface FullscreenCanvasProps {
    children: ReactNode;
}

export function FullscreenCanvas({ children }: FullscreenCanvasProps) {
    return (
        <div className="absolute inset-0 z-[0] flex items-center justify-center bg-black">
            {children}
        </div>
    );
}
