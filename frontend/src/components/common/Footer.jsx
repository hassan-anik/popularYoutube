import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { NewsletterSignup } from './Newsletter';

export const Footer = () => (
  <footer className="bg-[#0d0d0d] border-t border-[#1a1a1a] py-12 mt-16" data-testid="footer">
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">TopTube World Pro</span>
          </div>
          <p className="text-gray-500 text-sm">
            Track and analyze the most subscribed YouTube channels worldwide in real-time.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Rankings</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/top-100" className="text-gray-400 hover:text-white">Top 100 YouTubers</Link></li>
            <li><Link to="/leaderboard" className="text-gray-400 hover:text-white">Global Leaderboard</Link></li>
            <li><Link to="/trending" className="text-gray-400 hover:text-white">Fastest Growing</Link></li>
            <li><Link to="/countries" className="text-gray-400 hover:text-white">By Country</Link></li>
            <li><Link to="/compare" className="text-gray-400 hover:text-white">Compare Channels</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Popular Countries</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/country/US" className="text-gray-400 hover:text-white">United States</Link></li>
            <li><Link to="/country/IN" className="text-gray-400 hover:text-white">India</Link></li>
            <li><Link to="/country/BR" className="text-gray-400 hover:text-white">Brazil</Link></li>
            <li><Link to="/country/KR" className="text-gray-400 hover:text-white">South Korea</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/blog" className="text-gray-400 hover:text-white">Blog & Insights</Link></li>
            <li><Link to="/favorites" className="text-gray-400 hover:text-white">My Favorites</Link></li>
            <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
            <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
            <li><Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
            <li><Link to="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
          </ul>
        </div>
        
        {/* Newsletter Signup in Footer */}
        <div>
          <h4 className="font-semibold text-white mb-4">Newsletter</h4>
          <p className="text-gray-400 text-sm mb-3">Get weekly ranking updates</p>
          <NewsletterSignup compact={true} />
        </div>
      </div>
      <div className="border-t border-[#1a1a1a] mt-8 pt-8 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} TopTube World Pro. All rights reserved. Data sourced from YouTube Data API.
      </div>
    </div>
  </footer>
);
