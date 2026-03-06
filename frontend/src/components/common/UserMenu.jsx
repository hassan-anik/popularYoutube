import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Heart, Plus, Vote, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserMenu = () => {
  const { user, isAuthenticated, login, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return <div className="w-8 h-8 bg-[#222] rounded-full animate-pulse"></div>;
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={login}
        className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden md:inline">Sign In</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-[#222] transition-colors"
      >
        {user?.picture ? (
          <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-12 w-56 bg-[#111] border border-[#333] rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-[#333]">
              <p className="font-medium text-white truncate">{user?.name}</p>
              <p className="text-gray-500 text-sm truncate">{user?.email}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => { navigate('/favorites'); setMenuOpen(false); }}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#222] flex items-center gap-2"
              >
                <Heart className="w-4 h-4" /> My Favorites
              </button>
              <button
                onClick={() => { navigate('/request-channel'); setMenuOpen(false); }}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#222] flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Request Channel
              </button>
              <button
                onClick={() => { navigate('/polls'); setMenuOpen(false); }}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#222] flex items-center gap-2"
              >
                <Vote className="w-4 h-4" /> Prediction Polls
              </button>
              <button
                onClick={() => { navigate('/alerts'); setMenuOpen(false); }}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#222] flex items-center gap-2"
              >
                <Bell className="w-4 h-4" /> My Alerts
              </button>
            </div>
            <div className="border-t border-[#333] py-1">
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#222] flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
