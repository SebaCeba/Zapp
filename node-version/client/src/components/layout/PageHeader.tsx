import { ReactNode } from 'react';

interface HeaderProps {
  year?: number;
  onYearChange?: (year: number) => void;
  title?: string;
  tabs?: { label: string; active: boolean; onClick: () => void }[];
  actions?: ReactNode;
}

export function PageHeader({ year = 2024, title, tabs, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full flex justify-between items-center px-8 h-20 bg-cream/80 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* Year Selector */}
        <div className="relative group cursor-pointer flex items-center gap-2 bg-surface-container px-4 py-2 rounded-xl transition-all hover:bg-surface-container-high">
          <span className="text-xl font-bold text-navy-dark">{year}</span>
          <span className="material-symbols-outlined text-navy-dark text-sm">expand_more</span>
        </div>

        {/* Title or Tabs */}
        {title && (
          <>
            <div className="h-6 w-[1px] bg-outline-variant"></div>
            <h2 className="text-lg font-semibold text-secondary">{title}</h2>
          </>
        )}

        {tabs && tabs.length > 0 && (
          <>
            <div className="h-6 w-[1px] bg-outline-variant"></div>
            <div className="flex gap-6">
              {tabs.map((tab, idx) => (
                <button
                  key={idx}
                  onClick={tab.onClick}
                  className={`py-6 font-medium transition-colors ${
                    tab.active
                      ? 'text-navy-dark border-b-2 border-navy-dark font-bold'
                      : 'text-secondary hover:text-navy-dark'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {actions}
        
        <button className="p-2.5 text-slate-500 hover:bg-surface-container-high rounded-xl transition-all relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full border-2 border-cream"></span>
        </button>
        
        <button className="p-2.5 text-slate-500 hover:bg-surface-container-high rounded-xl transition-all">
          <span className="material-symbols-outlined">settings</span>
        </button>
        
        <div className="ml-2 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
          MV
        </div>
      </div>
    </header>
  );
}
