import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:scale-105 transition-all">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight block leading-none">SCCMS</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Smart Campus</span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          </div>
          
          <div className="h-8 w-px bg-slate-100"></div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none">{user.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
