import type { ReactNode } from 'react';
import { Download, HelpCircle, Settings, Menu } from 'lucide-react';

interface TopBarProps {
    filename?: string;
    onExport: () => void;
    isExporting?: boolean;
}

export function TopBar({ filename, onExport, isExporting }: TopBarProps) {
    return (
        <header className="topbar">
            <div className="flex items-center gap-3">
                <button className="toolbar-btn lg:hidden">
                    <Menu size={18} />
                </button>
                <span className="topbar-title hidden sm:block">Color Grader</span>
            </div>

            {filename && (
                <span className="topbar-filename">{filename}</span>
            )}

            <div className="flex items-center gap-2">
                <button className="toolbar-btn hidden lg:flex" title="Help">
                    <HelpCircle size={18} />
                </button>
                <button className="toolbar-btn hidden lg:flex" title="Settings">
                    <Settings size={18} />
                </button>
                <button
                    className={`btn btn-primary ${isExporting ? 'opacity-50' : ''}`}
                    onClick={onExport}
                    disabled={isExporting}
                >
                    <Download size={16} />
                    <span className="hidden sm:inline">Export</span>
                </button>
            </div>
        </header>
    );
}

interface ProLayoutProps {
    children: ReactNode;
    leftToolbar?: ReactNode;
    rightPanel?: ReactNode;
    bottomPanel?: ReactNode;
    timeline?: ReactNode;
    filename?: string;
    onExport: () => void;
    isExporting?: boolean;
}

export function ProLayout({
    children,
    leftToolbar,
    rightPanel,
    bottomPanel,
    timeline,
    filename,
    onExport,
    isExporting,
}: ProLayoutProps) {
    return (
        <div className="h-full w-full flex flex-col bg-[var(--bg-l0)]">
            {/* Top Bar */}
            <TopBar filename={filename} onExport={onExport} isExporting={isExporting} />

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Toolbar */}
                {leftToolbar && (
                    <aside className="left-toolbar hidden lg:flex">
                        {leftToolbar}
                    </aside>
                )}

                {/* Center: Preview + Timeline */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Video Preview */}
                    <main className="flex-1 relative overflow-hidden">
                        {children}
                    </main>

                    {/* Timeline */}
                    {timeline}
                </div>

                {/* Right Panel */}
                {rightPanel && (
                    <aside className="right-panel hidden lg:flex">
                        {rightPanel}
                    </aside>
                )}
            </div>

            {/* Bottom Panel */}
            {bottomPanel}
        </div>
    );
}
