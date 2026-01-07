import { ReactNode } from 'react';

interface GlassLayoutProps {
    children: ReactNode;
}

export function GlassLayout({ children }: GlassLayoutProps) {
    return (
        <div className="fixed inset-0 bg-black text-white overflow-hidden font-sans select-none">
            {/* Ambient Noise / Grain (Optional, adds cinematic feel) */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none z-[1]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />

            {children}
        </div>
    );
}
