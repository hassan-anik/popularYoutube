import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PlayCircle, Search, Heart, Menu } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { API } from '../../utils/constants';
import { formatNumber } from '../../utils/format';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(`${API}/channels?search=${encodeURIComponent(query)}&limit=5`);
      setSearchResults(response.data.channels || []);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleSelectResult = (channelId) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/channel/${channelId}`);
  };

  return (
    <header className="bg-[#0d0d0d] border-b border-[#1a1a1a] sticky top-0 z-50" data-testid="header">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">TopTube World Pro</span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-home">Home</Link>
            <Link to="/leaderboard" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-leaderboard">Leaderboard</Link>
            <Link to="/countries" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-countries">Countries</Link>
            <Link to="/trending" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-trending">Trending</Link>
            <Link to="/compare" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-compare">Compare</Link>
            <Link to="/blog" className="text-gray-300 hover:text-white transition-colors" data-testid="nav-blog">Blog</Link>
          </nav>
          
          {/* Search & Favorites */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/favorites" className="p-2 text-gray-300 dark:text-gray-300 hover:text-red-500 transition-colors" data-testid="nav-favorites">
              <Heart className="w-5 h-5" />
            </Link>
            <div className="relative">
              <button 
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-gray-300 dark:text-gray-300 hover:text-white transition-colors"
                data-testid="search-toggle"
              >
                <Search className="w-5 h-5" />
              </button>
              
              {/* Search Dropdown */}
              {searchOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg shadow-xl overflow-hidden z-50">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search channels..."
                    className="w-full bg-gray-50 dark:bg-[#0d0d0d] px-4 py-3 text-gray-900 dark:text-white focus:outline-none"
                    autoFocus
                    data-testid="global-search-input"
                  />
                  {searchResults.length > 0 && (
                    <div className="max-h-64 overflow-y-auto">
                      {searchResults.map(channel => (
                        <button
                          key={channel.channel_id}
                          onClick={() => handleSelectResult(channel.channel_id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors text-left"
                        >
                          <img src={channel.thumbnail_url} alt="" className="w-8 h-8 rounded-full" />
                          <div>
                            <div className="text-gray-900 dark:text-white text-sm font-medium">{channel.title}</div>
                            <div className="text-gray-500 text-xs">{formatNumber(channel.subscriber_count)} subs</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-[#1a1a1a]">
            <div className="flex flex-col gap-4">
              <Link to="/" className="text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link to="/leaderboard" className="text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Leaderboard</Link>
              <Link to="/countries" className="text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Countries</Link>
              <Link to="/trending" className="text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Trending</Link>
              <Link to="/compare" className="text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Compare</Link>
              <Link to="/favorites" className="text-gray-300 hover:text-white flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <Heart className="w-4 h-4" /> Favorites
              </Link>
              <Link to="/blog" className="text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
