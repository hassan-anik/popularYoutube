import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Code, Copy, Check, Settings, Eye, Palette, Maximize2, ChevronRight, ExternalLink } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { API, SITE_URL } from '../utils/constants';
import { formatNumber } from '../utils/format';
import { Breadcrumb } from '../components/seo';

// ==================== WIDGET BUILDER PAGE ====================

const WidgetPage = () => {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [embedCode, setEmbedCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Widget customization options
  const [theme, setTheme] = useState('dark');
  const [size, setSize] = useState('medium');
  const [showName, setShowName] = useState(true);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [showGrowth, setShowGrowth] = useState(true);
  const [animate, setAnimate] = useState(true);

  useSEO({
    title: "Live YouTube Subscriber Count Widget - Embed on Your Website | TopTube World Pro",
    description: "Create free embeddable live subscriber count widgets for any YouTube channel. Real-time updates, customizable themes, easy to embed on blogs, websites, and forums.",
    keywords: "youtube subscriber count widget, live subscriber widget, embed youtube stats, youtube subscriber counter, real-time subscriber count",
    canonical: `${SITE_URL}/widgets`
  });

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await axios.get(`${API}/widgets/channels?limit=50`);
        setChannels(response.data.channels || []);
      } catch (error) {
        console.error("Error fetching channels:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      generateEmbedCode();
    }
  }, [selectedChannel, theme, size, showName, showThumbnail, showGrowth, animate]);

  const generateEmbedCode = async () => {
    if (!selectedChannel) return;
    
    try {
      const response = await axios.get(
        `${API}/widgets/embed/${selectedChannel.channel_id}?theme=${theme}&size=${size}&show_name=${showName}&show_thumbnail=${showThumbnail}&show_growth=${showGrowth}&animate=${animate}`
      );
      setEmbedCode(response.data);
    } catch (error) {
      console.error("Error generating embed code:", error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredChannels = channels.filter(ch => 
    ch.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const previewUrl = selectedChannel 
    ? `${API}/widgets/live/${selectedChannel.channel_id}?theme=${theme}&size=${size}&show_name=${showName}&show_thumbnail=${showThumbnail}&show_growth=${showGrowth}&animate=${animate}`
    : null;

  return (
    <div className="py-8" data-testid="widget-page">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Live Subscriber Count Widget
          </h1>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
            Create free, customizable live subscriber count widgets for any YouTube channel.
            Embed on your website, blog, or forum with real-time updates.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Channel Selection & Preview */}
          <div className="space-y-6">
            {/* Channel Search */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-red-500" />
                1. Select a Channel
              </h2>
              
              <input
                type="text"
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-red-500 focus:outline-none mb-4"
                data-testid="widget-search"
              />
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : (
                  filteredChannels.map(channel => (
                    <div
                      key={channel.channel_id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedChannel?.channel_id === channel.channel_id
                          ? 'bg-red-500/20 border border-red-500/50'
                          : 'bg-[var(--bg-deep)] hover:bg-[var(--bg-hover)] border border-transparent'
                      }`}
                      onClick={() => setSelectedChannel(channel)}
                      data-testid={`widget-channel-${channel.channel_id}`}
                    >
                      <img
                        src={channel.thumbnail_url}
                        alt=""
                        className="w-10 h-10 rounded-full"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[var(--text-primary)] truncate">{channel.title}</div>
                        <div className="text-xs text-[var(--text-dim)]">{formatNumber(channel.subscriber_count)} subscribers</div>
                      </div>
                      {selectedChannel?.channel_id === channel.channel_id && (
                        <Check className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Preview */}
            {selectedChannel && (
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-green-500" />
                  Live Preview
                </h2>
                <div className={`rounded-lg overflow-hidden ${theme === 'transparent' ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4' : ''}`}>
                  <iframe
                    src={previewUrl}
                    width={size === 'small' ? 300 : size === 'large' ? 450 : 360}
                    height={size === 'small' ? 80 : size === 'large' ? 120 : 100}
                    frameBorder="0"
                    scrolling="no"
                    style={{ border: 'none' }}
                    title="Widget Preview"
                  />
                </div>
                <p className="text-xs text-[var(--text-dim)] mt-3">
                  Widget auto-refreshes every 60 seconds with live subscriber count
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Customization & Embed Code */}
          <div className="space-y-6">
            {/* Customization Options */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                2. Customize Widget
              </h2>
              
              <div className="space-y-4">
                {/* Theme Selection */}
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-2 flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Theme
                  </label>
                  <div className="flex gap-2">
                    {['dark', 'light', 'transparent'].map(t => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          theme === t
                            ? 'bg-red-500 text-white'
                            : 'bg-[var(--bg-deep)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-2 flex items-center gap-2">
                    <Maximize2 className="w-4 h-4" /> Size
                  </label>
                  <div className="flex gap-2">
                    {['small', 'medium', 'large'].map(s => (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          size === s
                            ? 'bg-red-500 text-white'
                            : 'bg-[var(--bg-deep)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle Options */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Show Name', value: showName, setter: setShowName },
                    { label: 'Show Thumbnail', value: showThumbnail, setter: setShowThumbnail },
                    { label: 'Show Growth', value: showGrowth, setter: setShowGrowth },
                    { label: 'Animate Count', value: animate, setter: setAnimate },
                  ].map(opt => (
                    <label key={opt.label} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={opt.value}
                        onChange={(e) => opt.setter(e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--border)] bg-[var(--bg-deep)] text-red-500 focus:ring-red-500"
                      />
                      <span className="text-sm text-[var(--text-secondary)]">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Embed Code */}
            {embedCode && (
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Code className="w-5 h-5 text-purple-500" />
                  3. Copy Embed Code
                </h2>
                
                {/* iFrame Code */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-[var(--text-muted)]">iFrame Embed (Recommended)</label>
                    <button
                      onClick={() => copyToClipboard(embedCode.embed_codes.iframe)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text-muted)] overflow-x-auto whitespace-pre-wrap">
                    {embedCode.embed_codes.iframe}
                  </pre>
                </div>

                {/* JavaScript SDK */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-[var(--text-muted)]">JavaScript SDK</label>
                    <button
                      onClick={() => copyToClipboard(embedCode.embed_codes.javascript)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400"
                    >
                      <Copy className="w-4 h-4" /> Copy
                    </button>
                  </div>
                  <pre className="bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text-muted)] overflow-x-auto whitespace-pre-wrap">
                    {embedCode.embed_codes.javascript}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comprehensive Guide Section */}
        <section className="mt-12 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Complete Guide to YouTube Subscriber Count Widgets</h2>
          
          <article className="space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">What Are Live Subscriber Count Widgets?</h3>
              <p className="mb-4">
                Live subscriber count widgets are embeddable components that display real-time subscriber statistics for YouTube channels. These widgets automatically update to show the current subscriber count, daily growth, and other key metrics without requiring any manual refresh. They're perfect for fan sites, creator portfolios, news articles, and any website that wants to showcase YouTube channel statistics.
              </p>
              <p className="mb-4">
                Our widgets pull data directly from the YouTube Data API through TopTube World Pro's tracking system. This ensures accuracy and reliability while providing additional metrics like daily subscriber gains that YouTube doesn't directly expose. The widgets refresh automatically every 60 seconds, keeping your embedded statistics current.
              </p>
              <p>
                Unlike static screenshots or manually updated numbers, live widgets ensure your visitors always see the most current information. This is particularly valuable during subscriber milestones, growth races, or any situation where real-time data matters.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">How to Use Our Widget Builder</h3>
              <p className="mb-4">
                Creating a custom widget for any YouTube channel takes just three simple steps:
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Step 1: Select a Channel</strong> - Use the search box to find the YouTube channel you want to feature. We track over 800 of the most subscribed channels globally. If you don't see a specific channel, you can request it to be added through our Channel Request page.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Step 2: Customize the Widget</strong> - Choose from three themes (dark, light, or transparent) to match your website's design. Select a size that fits your layout. Toggle options to show or hide channel names, thumbnails, and growth statistics. Enable or disable the animated count feature.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Step 3: Copy the Embed Code</strong> - Once you're satisfied with the preview, copy either the iFrame embed code or the JavaScript SDK code. Paste it into your website's HTML where you want the widget to appear. The widget will start working immediately.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Understanding Widget Options</h3>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Theme Options:</strong> We offer three themes to match different website designs. The Dark theme works best on dark backgrounds and modern websites. The Light theme is ideal for websites with white or light-colored backgrounds. The Transparent theme has no background, making it perfect for overlaying on images or custom backgrounds.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Size Options:</strong> Small widgets (300px wide) are perfect for sidebars and compact spaces. Medium widgets (360px) provide a balanced view suitable for most use cases. Large widgets (450px) are best for featured placements where you want maximum visibility.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Display Options:</strong> Show Name displays the channel's title. Show Thumbnail includes the channel's profile picture. Show Growth displays the daily subscriber gain (+X today). Animate Count creates a smooth animation when the count updates, making changes more noticeable to viewers.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Auto-Refresh:</strong> All widgets automatically refresh every 60 seconds to fetch the latest subscriber count. This happens seamlessly in the background without any user interaction required.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Common Use Cases for Subscriber Widgets</h3>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Fan Sites and Communities:</strong> Fan communities often want to showcase their favorite creator's growth. Widgets provide an engaging way to display real-time statistics that keep fans informed and invested in subscriber milestones.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">News Articles and Blog Posts:</strong> When writing about YouTube creators or covering subscriber races, embedding live widgets provides readers with current data rather than outdated screenshots. This improves article accuracy and engagement.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Creator Portfolios:</strong> Content creators can embed widgets for their own channels on personal websites, media kits, or partnership proposals. Live statistics demonstrate current reach more effectively than static numbers.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Comparison Displays:</strong> Embed multiple widgets side-by-side to create live subscriber race displays. This is popular during milestone races or when comparing channels in similar categories.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Stream Overlays:</strong> The transparent theme makes our widgets suitable for live stream overlays. Display subscriber counts during livestreams to celebrate milestones with your audience in real-time.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Technical Details for Developers</h3>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">iFrame Embedding:</strong> The recommended method uses an iFrame that loads our widget page directly. This is the simplest integration—just copy and paste the HTML code. The iFrame is sandboxed for security and requires no external dependencies.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">JavaScript SDK:</strong> For more control, use our JavaScript SDK. This creates a dynamic iFrame and supports programmatic configuration. The SDK loads asynchronously and doesn't block your page rendering.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Direct API Access:</strong> Developers who need raw data can use our JSON API endpoint (/api/widgets/data/CHANNEL_ID) which returns subscriber counts, growth metrics, and channel information in JSON format. This enables custom widget implementations.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Performance:</strong> Widgets are optimized for minimal bandwidth usage. The initial load is under 5KB, and refresh requests are under 1KB. We use aggressive caching and CDN delivery to ensure fast load times globally.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Data Accuracy and Updates</h3>
              <p className="mb-4">
                Widget data is sourced from the YouTube Data API through TopTube World Pro's tracking infrastructure. Subscriber counts reflect YouTube's publicly displayed numbers, which are rounded by YouTube for channels above certain thresholds.
              </p>
              <p className="mb-4">
                Our system updates channel data every 6 hours through batch API calls. Widget refresh (every 60 seconds) retrieves the most recent data from our database. This means widgets may occasionally be up to 6 hours behind YouTube's real-time count, though in practice the delay is usually much shorter.
              </p>
              <p>
                Daily subscriber gain ("today" growth) is calculated by comparing current counts to our historical snapshots from approximately 24 hours ago. This is an estimate by TopTube World Pro, not official YouTube data. Actual daily gains may vary.
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-dim)]">
                <em>Live subscriber count widgets are provided free of charge by TopTube World Pro. Widgets display data from the YouTube Data API. Daily growth statistics are independently calculated by TopTube World Pro. For questions about widget usage or custom implementations, please visit our Contact page.</em>
              </p>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export { WidgetPage };
