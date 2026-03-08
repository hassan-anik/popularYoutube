import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { PlayCircle, Search, Heart, Menu } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import { UserMenu } from './UserMenu';
import { API } from '../../utils/constants';
import { formatNumber } from '../../utils/format';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

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
    <header className="bg-[var(--bg-deep)] border-b border-[var(--border)] sticky top-0 z-50" data-testid="header">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-[var(--text-primary)]" />
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)] hidden sm:block">TopTube World Pro</span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" data-testid="nav-home">
              {t('common.home')}
            </Link>
            <Link to="/leaderboard" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" data-testid="nav-leaderboard">
              {t('common.leaderboard')}
            </Link>
            <Link to="/countries" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" data-testid="nav-countries">
              {t('common.countries')}
            </Link>
            <Link to="/trending" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" data-testid="nav-trending">
              {t('common.trending')}
            </Link>
            <Link to="/compare" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" data-testid="nav-compare">
              {t('common.compare')}
            </Link>
            <Link to="/blog" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" data-testid="nav-blog">
              {t('common.blog')}
            </Link>
          </nav>
          
          {/* Search & Favorites */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/favorites" className="p-2 text-[var(--text-secondary)] dark:text-[var(--text-secondary)] hover:text-red-500 transition-colors" data-testid="nav-favorites">
              <Heart className="w-5 h-5" />
            </Link>
            <div className="relative">
              <button 
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-[var(--text-secondary)] dark:text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                data-testid="search-toggle"
              >
                <Search className="w-5 h-5" />
              </button>
              
              {/* Search Dropdown */}
              {searchOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-[var(--bg-card)] border border-gray-200 dark:border-[var(--border-hover)] rounded-lg shadow-xl overflow-hidden z-50">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search channels..."
                    className="w-full bg-[var(--bg-input)] px-4 py-3 text-[var(--text-primary)] focus:outline-none"
                    autoFocus
                    data-testid="global-search-input"
                  />
                  {searchResults.length > 0 && (
                    <div className="max-h-64 overflow-y-auto">
                      {searchResults.map(channel => (
                        <button
                          key={channel.channel_id}
                          onClick={() => handleSelectResult(channel.channel_id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[var(--bg-hover)] transition-colors text-left"
                        >
                          <img src={channel.thumbnail_url} alt="" loading="lazy" className="w-8 h-8 rounded-full" />
                          <div>
                            <div className="text-[var(--text-primary)] text-sm font-medium">{channel.title}</div>
                            <div className="text-[var(--text-dim)] text-xs">{formatNumber(channel.subscriber_count)} subs</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Language Selector */}
            <LanguageSelector />

            {/* User Menu */}
            <UserMenu />

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-[var(--text-secondary)]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-[var(--border)]">
            <div className="flex flex-col gap-4">
              <Link to="/" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link to="/leaderboard" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => setMobileMenuOpen(false)}>Leaderboard</Link>
              <Link to="/countries" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => setMobileMenuOpen(false)}>Countries</Link>
              <Link to="/trending" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => setMobileMenuOpen(false)}>Trending</Link>
              <Link to="/compare" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => setMobileMenuOpen(false)}>Compare</Link>
              <Link to="/favorites" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <Heart className="w-4 h-4" /> Favorites
              </Link>
              <Link to="/blog" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
