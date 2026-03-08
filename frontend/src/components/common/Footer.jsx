import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { NewsletterSignup } from './Newsletter';

export const Footer = () => (
  <footer className="bg-[var(--bg-deep)] border-t border-[var(--border)] py-12 mt-16" data-testid="footer">
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-[var(--text-primary)]" />
            </div>
            <span className="font-bold text-[var(--text-primary)]">TopTube World Pro</span>
          </div>
          <p className="text-[var(--text-dim)] text-sm">
            Track and analyze the most subscribed YouTube channels worldwide in real-time.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-[var(--text-primary)] mb-4">Rankings</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/top-100" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">Top 100 YouTubers</Link></li>
            <li><Link to="/leaderboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">Global Leaderboard</Link></li>
            <li><Link to="/trending" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">Fastest Growing</Link></li>
            <li><Link to="/countries" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">By Country</Link></li>
            <li><Link to="/compare" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">Compare Channels</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-[var(--text-primary)] mb-4">Popular Countries</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/country/US" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">United States</Link></li>
            <li><Link to="/country/IN" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">India</Link></li>
            <li><Link to="/country/BR" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">Brazil</Link></li>
            <li><Link to="/country/KR" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">South Korea</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-[var(--text-primary)] mb-4">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/blog" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">Blog & Insights</Link></li>
            <li><Link to="/favorites" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">My Favorites</Link></li>
            <li><Link to="/about" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">About Us</Link></li>
            <li><Link to="/contact" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">Contact</Link></li>
            <li><Link to="/privacy" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">Privacy Policy</Link></li>
            <li><Link to="/terms" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">Terms of Service</Link></li>
          </ul>
        </div>
        
        {/* Newsletter Signup in Footer */}
        <div>
          <h4 className="font-semibold text-[var(--text-primary)] mb-4">Newsletter</h4>
          <p className="text-[var(--text-muted)] text-sm mb-3">Get weekly ranking updates</p>
          <NewsletterSignup compact={true} />
        </div>
      </div>
      <div className="border-t border-[var(--border)] mt-8 pt-8 text-center text-[var(--text-dim)] text-sm">
        © {new Date().getFullYear()} TopTube World Pro. All rights reserved. Data sourced from YouTube Data API.
      </div>
    </div>
  </footer>
);
