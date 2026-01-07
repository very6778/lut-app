import type { ReactNode } from 'react';

interface BottomPanelProps {
    lutSection: ReactNode;
    adjustmentsSection: ReactNode;
}

export function BottomPanel({ lutSection, adjustmentsSection }: BottomPanelProps) {
    return (
        <div className="bottom-panel">
            <div className="bottom-panel-section">
                {lutSection}
            </div>
            <div className="bottom-panel-section">
                {adjustmentsSection}
            </div>
        </div>
    );
}
