import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Globe,
  TrendingUp,
  Zap,
  BarChart3,
  Users,
  Eye,
  PlayCircle,
  CalendarDays,
  Flame,
  Clock,
  RefreshCw,
  HelpCircle,
  Check
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { API, SITE_URL } from '../utils/constants';

export const AboutPage = () => {
  useSEO({
    title: "About TopTube World Pro - YouTube Channel Rankings Platform",
    description: "Learn about TopTube World Pro, the leading platform for tracking and analyzing YouTube channel rankings across 197 countries worldwide.",
    keywords: "about TopTube World Pro, YouTube analytics platform, YouTube rankings website",
    canonical: `${SITE_URL}/about`
  });

  return (
    <div className="py-12" data-testid="about-page">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-8">About TopTube World Pro</h1>
        
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Our Mission</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              TopTube World Pro is dedicated to providing the most comprehensive and accurate YouTube channel 
              analytics platform. We track, rank, and predict the growth of the most subscribed YouTube channels 
              across 197 countries in real-time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">What We Offer</h2>
            <ul className="text-[var(--text-secondary)] space-y-3">
              <li className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <span><strong>Global Coverage:</strong> Track YouTube channels from every country in the world with localized rankings and insights.</span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <span><strong>Real-time Analytics:</strong> Get up-to-date subscriber counts, view statistics, and growth metrics refreshed automatically.</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                <span><strong>Viral Predictions:</strong> Our algorithm identifies channels that are "Exploding", "Rising Fast", "Stable", or "Slowing".</span>
              </li>
              <li className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                <span><strong>Historical Data:</strong> View growth charts and track how channels have performed over time.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Data Sources</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              All channel data is sourced directly from the official YouTube Data API v3, ensuring accuracy 
              and reliability. Our systems automatically refresh data every 6 hours and update rankings every 
              10 minutes to provide you with the most current information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Who Uses TopTube World Pro?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[var(--bg-deep)] rounded-lg p-4">
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">Content Creators</h3>
                <p className="text-[var(--text-muted)] text-sm">Track competitors and identify trends in your niche.</p>
              </div>
              <div className="bg-[var(--bg-deep)] rounded-lg p-4">
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">Marketing Professionals</h3>
                <p className="text-[var(--text-muted)] text-sm">Find influencers by country for targeted campaigns.</p>
              </div>
              <div className="bg-[var(--bg-deep)] rounded-lg p-4">
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">Data Analysts</h3>
                <p className="text-[var(--text-muted)] text-sm">Research YouTube trends and growth patterns.</p>
              </div>
              <div className="bg-[var(--bg-deep)] rounded-lg p-4">
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">YouTube Enthusiasts</h3>
                <p className="text-[var(--text-muted)] text-sm">Stay updated on your favorite creators' growth.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export const MethodologyPage = () => {
  useSEO({
    title: "Data Sources & Methodology - How We Track YouTube Rankings",
    description: "Learn how TopTube World Pro collects, calculates, and displays YouTube channel statistics. Understand our data sources, methodology, and the difference between official YouTube data and our estimates.",
    keywords: "YouTube analytics methodology, how YouTube stats work, YouTube subscriber tracking, YouTube data API, channel growth calculation",
    canonical: `${SITE_URL}/methodology`
  });

  return (
    <div className="py-12" data-testid="methodology-page">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Data Sources & Methodology</h1>
        <p className="text-[var(--text-muted)] mb-8">How TopTube World Pro tracks and analyzes YouTube channel statistics</p>
        
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 space-y-8">
          
          {/* Official YouTube Data */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <PlayCircle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Official YouTube Data</h2>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              TopTube World Pro uses the <strong>YouTube Data API v3</strong> to fetch publicly available channel statistics. 
              The following metrics come directly from YouTube and are displayed exactly as provided:
            </p>
            <div className="bg-[var(--bg-deep)] rounded-lg p-4">
              <ul className="text-[var(--text-secondary)] space-y-3">
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-[var(--text-primary)]">Subscriber Count</strong>
                    <p className="text-sm text-[var(--text-muted)]">The total number of subscribers as reported by YouTube. Note: YouTube may round this number for channels with over 1,000 subscribers.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-[var(--text-primary)]">Total Views</strong>
                    <p className="text-sm text-[var(--text-muted)]">The cumulative view count across all videos on the channel.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <PlayCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-[var(--text-primary)]">Video Count</strong>
                    <p className="text-sm text-[var(--text-muted)]">The total number of public videos uploaded to the channel.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CalendarDays className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-[var(--text-primary)]">Channel Creation Date</strong>
                    <p className="text-sm text-[var(--text-muted)]">When the YouTube channel was created.</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Estimated/Calculated Data */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Estimated Metrics <span className="text-yellow-500">*</span></h2>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <p className="text-yellow-200/90 text-sm">
                <strong>Important:</strong> The following metrics are independently calculated by TopTube World Pro based on our historical tracking data. 
                They are NOT provided by YouTube and should be considered estimates for informational purposes only.
              </p>
            </div>
            <div className="bg-[var(--bg-deep)] rounded-lg p-4">
              <ul className="text-[var(--text-secondary)] space-y-4">
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-[var(--text-primary)]">24-Hour Growth / Daily Subscriber Gain</strong>
                    <p className="text-sm text-[var(--text-muted)] mb-2">Calculated by comparing the current subscriber count to the count we recorded approximately 24 hours ago.</p>
                    <code className="text-xs bg-[var(--bg-hover)] px-2 py-1 rounded text-[var(--text-muted)]">Daily Gain = Current Subscribers - Subscribers 24h Ago</code>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-[var(--text-primary)]">7-Day / 30-Day Growth Percentage</strong>
                    <p className="text-sm text-[var(--text-muted)] mb-2">Calculated by comparing the current subscriber count to historical snapshots from 7 or 30 days ago.</p>
                    <code className="text-xs bg-[var(--bg-hover)] px-2 py-1 rounded text-[var(--text-muted)]">Growth % = ((Current - Previous) / Previous) × 100</code>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Flame className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-[var(--text-primary)]">Viral Status (Exploding, Rising Fast, Stable, Slowing)</strong>
                    <p className="text-sm text-[var(--text-muted)] mb-2">A categorical label based on our analysis of recent growth patterns:</p>
                    <ul className="text-xs text-[var(--text-dim)] space-y-1 ml-4">
                      <li><span className="text-red-400">Exploding</span>: Daily growth rate significantly above channel average</li>
                      <li><span className="text-green-400">Rising Fast</span>: Consistent above-average daily growth</li>
                      <li><span className="text-blue-400">Stable</span>: Normal growth within expected range</li>
                      <li><span className="text-yellow-400">Slowing</span>: Growth rate declining compared to recent average</li>
                    </ul>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-[var(--text-primary)]">Viral Score</strong>
                    <p className="text-sm text-[var(--text-muted)]">A numerical score (0-100) representing the channel's growth momentum based on multiple factors including daily gains, growth rate, and trend direction.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-[var(--text-primary)]">Overtake Predictions</strong>
                    <p className="text-sm text-[var(--text-muted)]">Estimates of when one channel might surpass another based on current growth rates. These are speculative projections, not guarantees.</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Data Collection Process */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">How We Collect Data</h2>
            </div>
            <div className="bg-[var(--bg-deep)] rounded-lg p-4">
              <ol className="text-[var(--text-secondary)] space-y-4 list-decimal list-inside">
                <li>
                  <strong className="text-[var(--text-primary)]">API Requests</strong>
                  <p className="text-sm text-[var(--text-muted)] ml-5">We make authorized requests to the YouTube Data API v3 to fetch channel statistics.</p>
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Data Storage</strong>
                  <p className="text-sm text-[var(--text-muted)] ml-5">Each data fetch is stored as a historical snapshot with a timestamp, allowing us to track changes over time.</p>
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Periodic Refresh</strong>
                  <p className="text-sm text-[var(--text-muted)] ml-5">Channel data is refreshed automatically every 6 hours. Rankings are recalculated every 10 minutes.</p>
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Growth Calculation</strong>
                  <p className="text-sm text-[var(--text-muted)] ml-5">Our system compares current data with historical snapshots to calculate growth metrics.</p>
                </li>
              </ol>
            </div>
          </section>

          {/* Accuracy & Limitations */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-orange-500" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Accuracy & Limitations</h2>
            </div>
            <div className="bg-[var(--bg-deep)] rounded-lg p-4">
              <ul className="text-[var(--text-secondary)] space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 mt-1">•</span>
                  <p><strong className="text-[var(--text-primary)]">YouTube Rounding:</strong> YouTube rounds subscriber counts for privacy. Channels with 1K-10K subscribers are rounded to the nearest 10; larger channels to nearest 100, 1K, 10K, etc.</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 mt-1">•</span>
                  <p><strong className="text-[var(--text-primary)]">Refresh Timing:</strong> Our data may be up to 6 hours behind real-time YouTube figures due to our refresh schedule.</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 mt-1">•</span>
                  <p><strong className="text-[var(--text-primary)]">Growth Estimates:</strong> Daily/weekly/monthly growth calculations depend on the availability of historical data. New channels may show "0" growth until sufficient data is collected.</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-500 mt-1">•</span>
                  <p><strong className="text-[var(--text-primary)]">Country Attribution:</strong> Channel country assignments are based on available metadata and may not always reflect the creator's actual location.</p>
                </li>
              </ul>
            </div>
          </section>

          {/* YouTube API Compliance */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">YouTube API Compliance</h2>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              TopTube World Pro operates in compliance with YouTube's API Terms of Service. By using our service:
            </p>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <ul className="text-[var(--text-secondary)] space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  You agree to the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline">YouTube Terms of Service</a>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  You acknowledge the <a href="http://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline">Google Privacy Policy</a>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  You understand that growth metrics marked with * are our estimates, not YouTube data
                </li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="border-t border-[var(--border)] pt-6">
            <p className="text-[var(--text-muted)] text-sm">
              Have questions about our methodology? <Link to="/contact" className="text-red-500 hover:text-red-400">Contact us</Link> and we'll be happy to explain further.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export const PrivacyPage = () => {
  useSEO({
    title: "Privacy Policy - TopTube World Pro",
    description: "Read our privacy policy to understand how TopTube World Pro collects, uses, and protects your data.",
    keywords: "privacy policy, data protection, TopTube World Pro privacy",
    canonical: `${SITE_URL}/privacy`
  });

  return (
    <div className="py-12" data-testid="privacy-page">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-8">Privacy Policy</h1>
        <p className="text-[var(--text-muted)] mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 space-y-8">
          {/* YouTube API Services Compliance Notice */}
          <section className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">YouTube API Services</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
              TopTube World Pro uses the YouTube API Services. By using our service, you are also agreeing to be bound by the Google Privacy Policy.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              <strong>Google Privacy Policy:</strong>{' '}
              <a href="http://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline">
                http://www.google.com/policies/privacy
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">1. Information We Collect</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              TopTube World Pro collects minimal information to provide our services:
            </p>
            <ul className="text-[var(--text-secondary)] list-disc list-inside space-y-2">
              <li><strong>Usage Data:</strong> We collect anonymous usage statistics such as pages visited, time spent on site, and general location (country level).</li>
              <li><strong>Cookies:</strong> We use essential cookies to ensure the website functions properly and analytics cookies to improve our services.</li>
              <li><strong>YouTube Data:</strong> All YouTube channel data displayed is publicly available information obtained through the official YouTube Data API.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">2. How We Use Your Information</h2>
            <ul className="text-[var(--text-secondary)] list-disc list-inside space-y-2">
              <li>To provide and maintain our service</li>
              <li>To analyze usage patterns and improve user experience</li>
              <li>To detect and prevent technical issues</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">3. Data Sharing</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We may share 
              anonymous, aggregated statistics with partners for analytical purposes. We use Google 
              Analytics to understand how visitors use our site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">4. Third-Party Services</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Our service integrates with third-party services including:
            </p>
            <ul className="text-[var(--text-secondary)] list-disc list-inside space-y-2 mt-2">
              <li><strong>YouTube Data API:</strong> To fetch publicly available channel statistics. Subject to <a href="http://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline">Google Privacy Policy</a></li>
              <li><strong>Google Analytics:</strong> To analyze website traffic and usage patterns</li>
              <li><strong>Google AdSense:</strong> To display relevant advertisements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">5. Cookies</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our website. You can 
              instruct your browser to refuse all cookies or indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">6. Data Security</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We implement appropriate security measures to protect against unauthorized access, alteration, 
              disclosure, or destruction of data. However, no method of transmission over the Internet is 
              100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">7. Your Rights</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              You have the right to access, correct, or delete any personal data we hold about you. 
              Contact us at anikhasan1100@gmail.com for any privacy-related requests.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">8. Changes to This Policy</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by 
              posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export const TermsPage = () => {
  useSEO({
    title: "Terms of Service - TopTube World Pro",
    description: "Read the terms and conditions for using TopTube World Pro's YouTube channel analytics platform.",
    keywords: "terms of service, terms and conditions, TopTube World Pro terms",
    canonical: `${SITE_URL}/terms`
  });

  return (
    <div className="py-12" data-testid="terms-page">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-8">Terms of Service</h1>
        <p className="text-[var(--text-muted)] mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 space-y-8">
          {/* YouTube Terms of Service Compliance Notice */}
          <section className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">YouTube Terms of Service</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
              TopTube World Pro uses the YouTube API Services. By using TopTube World Pro, you are agreeing to be bound by the YouTube Terms of Service.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              <strong>YouTube Terms of Service:</strong>{' '}
              <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline">
                https://www.youtube.com/t/terms
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">1. Acceptance of Terms</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              By accessing and using TopTube World Pro, you accept and agree to be bound by these Terms of 
              Service and the YouTube Terms of Service (<a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline">https://www.youtube.com/t/terms</a>). If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">2. Description of Service</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              TopTube World Pro provides YouTube channel analytics, rankings, and growth predictions. 
              Our service aggregates publicly available data from YouTube to provide insights about 
              channel performance across different countries.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">3. Use of Service</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">You agree to use our service only for lawful purposes. You may not:</p>
            <ul className="text-[var(--text-secondary)] list-disc list-inside space-y-2">
              <li>Use automated systems to scrape or extract data without permission</li>
              <li>Attempt to interfere with or disrupt the service</li>
              <li>Use the service for any illegal or unauthorized purpose</li>
              <li>Misrepresent your identity or affiliation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">4. Intellectual Property</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              The TopTube World Pro name, logo, and all related content are protected by intellectual 
              property laws. YouTube channel data and thumbnails remain the property of their respective 
              owners and YouTube.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">5. Data Disclaimer</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
              <strong>Important:</strong> Subscriber counts, view counts, and video counts are obtained from the YouTube Data API. 
              However, the following metrics are <strong>independently calculated by TopTube World Pro</strong> and are NOT provided by YouTube:
            </p>
            <ul className="text-[var(--text-secondary)] list-disc list-inside space-y-2">
              <li>Daily subscriber gains/losses (estimated from historical tracking)</li>
              <li>Growth percentages (7-day, 30-day growth rates)</li>
              <li>Viral status labels (Exploding, Rising Fast, Stable, Slowing)</li>
              <li>Growth predictions and overtake estimates</li>
            </ul>
            <p className="text-[var(--text-secondary)] leading-relaxed mt-3">
              These estimated metrics are provided for informational purposes only and may not reflect actual YouTube data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">6. Disclaimer of Warranties</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Our service is provided "as is" without warranties of any kind. We do not guarantee the 
              accuracy, completeness, or timeliness of the data displayed. YouTube channel statistics 
              may vary from official YouTube figures due to API limitations and refresh timing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">7. Limitation of Liability</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              TopTube World Pro shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages resulting from your use of or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">8. Third-Party Links</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Our service contains links to YouTube and other third-party websites. We are not responsible 
              for the content or practices of these external sites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">9. Changes to Terms</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the service after 
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">10. Contact</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              For questions about these Terms of Service, please contact us at anikhasan1100@gmail.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useSEO({
    title: "Contact Us - TopTube World Pro",
    description: "Get in touch with TopTube World Pro. Contact us for support, feedback, or business inquiries.",
    keywords: "contact TopTube World Pro, support, feedback, business inquiries",
    canonical: `${SITE_URL}/contact`
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API}/contact`, formData);
      if (response.data.status === 'success') {
        setSubmitted(true);
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Contact form error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12" data-testid="contact-page">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-8">Contact Us</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Send us a message</h2>
            
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Message Sent!</h3>
                <p className="text-[var(--text-muted)]">Thank you for reaching out. We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
                    placeholder="Your name"
                    data-testid="contact-name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
                    placeholder="your@email.com"
                    data-testid="contact-email"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-2">Subject</label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
                    data-testid="contact-subject"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="feedback">Feedback</option>
                    <option value="business">Business Inquiry</option>
                    <option value="data">Data Correction Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-2">Message</label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    rows={5}
                    className="w-full bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-red-500 focus:outline-none resize-none"
                    placeholder="How can we help you?"
                    data-testid="contact-message"
                  />
                </div>
                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="contact-submit"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">General Inquiries</h3>
              <p className="text-[var(--text-muted)] text-sm mb-2">For general questions and information:</p>
              <a href="mailto:anikhasan1100@gmail.com" className="text-red-500 hover:text-red-400">
                anikhasan1100@gmail.com
              </a>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Technical Support</h3>
              <p className="text-[var(--text-muted)] text-sm mb-2">Need help with the platform?</p>
              <a href="mailto:anikhasan1100@gmail.com" className="text-red-500 hover:text-red-400">
                anikhasan1100@gmail.com
              </a>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Business & Partnerships</h3>
              <p className="text-[var(--text-muted)] text-sm mb-2">For business opportunities:</p>
              <a href="mailto:anikhasan1100@gmail.com" className="text-red-500 hover:text-red-400">
                anikhasan1100@gmail.com
              </a>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Response Time</h3>
              <p className="text-[var(--text-muted)] text-sm">
                We typically respond to all inquiries within 24-48 business hours. For urgent matters, 
                please include "URGENT" in your subject line.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
