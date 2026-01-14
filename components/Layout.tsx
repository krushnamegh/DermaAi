
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  onLogout?: () => void;
  showNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title, onLogout, showNav = true }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {showNav && (
        <nav className="sticky top-0 z-50 glass-panel border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white">
                <i className="fa-solid fa-stethoscope"></i>
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">DermaScan<span className="text-sky-500">AI</span></span>
            </div>
            {onLogout && (
              <button 
                onClick={onLogout}
                className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors flex items-center gap-2"
              >
                <span>Logout</span>
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
              </button>
            )}
          </div>
        </nav>
      )}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
