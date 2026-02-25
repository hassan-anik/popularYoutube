import React, { useState } from 'react';
import axios from 'axios';
import { Send, Check, Mail } from 'lucide-react';
import { API } from '../../utils/constants';

export const NewsletterSignup = ({ compact = false }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    try {
      await axios.post(`${API}/newsletter/subscribe`, { email });
      setStatus('success');
      setMessage('Thanks for subscribing!');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Subscription failed');
    }
  };
  
  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-sm focus:border-red-500 focus:outline-none"
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? '...' : status === 'success' ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    );
  }
  
  return (
    <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-xl p-6 border border-red-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-500/20 rounded-lg">
          <Mail className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h3 className="font-bold text-white">Stay Updated</h3>
          <p className="text-sm text-gray-400">Get weekly insights on YouTube trends</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:border-red-500 focus:outline-none"
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            'Subscribing...'
          ) : status === 'success' ? (
            <>
              <Check className="w-5 h-5" /> Subscribed!
            </>
          ) : (
            <>
              Subscribe <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
      
      {message && (
        <p className={`mt-3 text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
};
