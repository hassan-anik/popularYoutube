import React, { lazy, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { ArrowUp, Bell, Check, Heart, LinkIcon, LogIn, Plus, Search, Send, ThumbsUp, Trash2, TrendingUp, Trophy, Vote, X, Zap } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { useFavorites } from '../hooks/useFavorites';
import { API, SITE_URL } from '../utils/constants';
import { formatNumber } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { FavoriteButton, Header } from '../components/common';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);
  const { setUser, setIsAuthenticated, checkAuth } = useAuth();

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = location.hash;
      const sessionId = hash.split('session_id=')[1]?.split('&')[0];
      
      if (!sessionId) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.post(`${API}/auth/session`, 
          { session_id: sessionId },
          { withCredentials: true }
        );
        
        if (response.data.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
          // Clear the hash and redirect to home
          navigate('/', { replace: true, state: { user: response.data.user } });
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/');
      }
    };

    processAuth();
  }, [location.hash, navigate, setUser, setIsAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[var(--text-muted)]">Signing you in...</p>
      </div>
    </div>
  );
};


const ChannelRequestPage = () => {
  const { isAuthenticated, login } = useAuth();
  const [formData, setFormData] = useState({
    channel_url: '',
    channel_name: '',
    country_code: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requests, setRequests] = useState([]);
  const [countries, setCountries] = useState([]);

  useSEO({
    title: "Request a Channel - TopTube World Pro",
    description: "Submit a YouTube channel to be tracked on TopTube World Pro. Help us expand our database with channels from your country.",
    canonical: `${SITE_URL}/request-channel`
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [requestsRes, countriesRes] = await Promise.all([
          axios.get(`${API}/channel-requests?limit=10`),
          axios.get(`${API}/countries`)
        ]);
        setRequests(requestsRes.data.requests || []);
        setCountries(countriesRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post(`${API}/channel-requests`, formData, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setSubmitted(true);
        setFormData({ channel_url: '', channel_name: '', country_code: '', reason: '' });
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (requestId) => {
    if (!isAuthenticated) {
      login();
      return;
    }

    try {
      await axios.post(`${API}/channel-requests/${requestId}/vote`, {}, {
        withCredentials: true
      });
      // Refresh requests
      const response = await axios.get(`${API}/channel-requests?limit=10`);
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  return (
    <div className="py-8" data-testid="channel-request-page">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Plus className="w-10 h-10 text-green-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">Request a Channel</h1>
          </div>
          <p className="text-[var(--text-muted)]">Help us expand our database! Submit channels you'd like us to track.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Submit Form */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-green-500" />
              Submit a Channel
            </h2>

            {submitted ? (
              <div className="text-center py-8">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Request Submitted!</h3>
                <p className="text-[var(--text-muted)] mb-4">We'll review your request and add the channel if it meets our criteria.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[var(--text-muted)] text-sm mb-1">Channel URL *</label>
                  <input
                    type="url"
                    required
                    value={formData.channel_url}
                    onChange={(e) => setFormData({ ...formData, channel_url: e.target.value })}
                    placeholder="https://youtube.com/@channelname"
                    className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg text-[var(--text-primary)] focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] text-sm mb-1">Channel Name (optional)</label>
                  <input
                    type="text"
                    value={formData.channel_name}
                    onChange={(e) => setFormData({ ...formData, channel_name: e.target.value })}
                    placeholder="MrBeast"
                    className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg text-[var(--text-primary)] focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] text-sm mb-1">Country</label>
                  <select
                    value={formData.country_code}
                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                    className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg text-[var(--text-primary)] focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Select country...</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>{c.flag_emoji} {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] text-sm mb-1">Why should we track this channel?</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="This channel is growing fast and represents..."
                    rows={3}
                    className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg text-[var(--text-primary)] focus:border-green-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-[var(--text-primary)] font-medium rounded-lg flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Request
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Popular Requests */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-yellow-500" />
              Popular Requests
            </h2>
            <p className="text-[var(--text-dim)] text-sm mb-4">Vote for channels you want us to add!</p>

            {requests.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-dim)]">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No pending requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(req => (
                  <div key={req.request_id} className="bg-[var(--bg-deep)] rounded-lg p-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text-primary)] font-medium truncate">{req.channel_name || req.channel_url}</p>
                      <p className="text-[var(--text-dim)] text-sm truncate">{req.channel_url}</p>
                    </div>
                    <button
                      onClick={() => handleVote(req.request_id)}
                      className="flex items-center gap-1 px-3 py-1 bg-[var(--border)] hover:bg-[var(--border-hover)] rounded-lg text-sm ml-2"
                    >
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                      <span className="text-[var(--text-primary)]">{req.votes || 0}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


const PollsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votedPolls, setVotedPolls] = useState(new Set());

  useSEO({
    title: "Prediction Polls - Who Will Gain More Subscribers? | TopTube World Pro",
    description: "Vote in YouTube channel prediction polls! Guess which channels will gain more subscribers this month and see how your predictions compare.",
    keywords: "youtube predictions, subscriber predictions, channel polls, who will gain more subscribers",
    canonical: `${SITE_URL}/polls`
  });

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await axios.get(`${API}/polls?status=active`);
        setPolls(response.data.polls || []);
      } catch (error) {
        console.error('Error fetching polls:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPolls();
  }, []);

  const handleVote = async (pollId, choice) => {
    if (!isAuthenticated) {
      login();
      return;
    }

    try {
      await axios.post(`${API}/polls/${pollId}/vote`, { choice }, {
        withCredentials: true
      });
      setVotedPolls(prev => new Set([...prev, pollId]));
      // Refresh polls
      const response = await axios.get(`${API}/polls?status=active`);
      setPolls(response.data.polls || []);
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="polls-page">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Vote className="w-10 h-10 text-purple-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">Prediction Polls</h1>
          </div>
          <p className="text-[var(--text-muted)]">Vote on which YouTube channels will perform better!</p>
          {!isAuthenticated && (
            <button
              onClick={login}
              className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg inline-flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign in to vote
            </button>
          )}
        </div>

        {polls.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg">
            <Vote className="w-12 h-12 text-[var(--text-dim)] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Active Polls</h2>
            <p className="text-[var(--text-dim)]">Check back soon for new prediction polls!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {polls.map(poll => (
              <div key={poll.poll_id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-[var(--border)]">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">{poll.question}</h2>
                  <p className="text-[var(--text-dim)] text-sm">
                    Ends: {new Date(poll.end_date).toLocaleDateString()} • {poll.total_votes} votes
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 p-4">
                  {/* Option A */}
                  <div
                    className={`bg-[var(--bg-deep)] rounded-lg p-4 cursor-pointer border-2 transition-colors ${
                      votedPolls.has(poll.poll_id) ? 'border-[var(--border-hover)] cursor-default' : 'border-transparent hover:border-purple-500/50'
                    }`}
                    onClick={() => !votedPolls.has(poll.poll_id) && handleVote(poll.poll_id, 'a')}
                  >
                    {poll.channel_a && (
                      <div className="flex items-center gap-3 mb-3">
                        <img src={poll.channel_a.thumbnail_url} alt="" className="w-12 h-12 rounded-full" />
                        <div>
                          <h3 className="font-semibold text-[var(--text-primary)]">{poll.channel_a.title}</h3>
                          <p className="text-[var(--text-dim)] text-sm">{formatNumber(poll.channel_a.subscriber_count)} subs</p>
                        </div>
                      </div>
                    )}
                    <div className="relative h-8 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-purple-500 rounded-full transition-all"
                        style={{ width: `${poll.percent_a}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[var(--text-primary)] font-bold text-sm">
                        {poll.percent_a}%
                      </span>
                    </div>
                    <p className="text-center text-[var(--text-dim)] text-sm mt-2">{poll.votes_a || 0} votes</p>
                  </div>

                  {/* Option B */}
                  <div
                    className={`bg-[var(--bg-deep)] rounded-lg p-4 cursor-pointer border-2 transition-colors ${
                      votedPolls.has(poll.poll_id) ? 'border-[var(--border-hover)] cursor-default' : 'border-transparent hover:border-pink-500/50'
                    }`}
                    onClick={() => !votedPolls.has(poll.poll_id) && handleVote(poll.poll_id, 'b')}
                  >
                    {poll.channel_b && (
                      <div className="flex items-center gap-3 mb-3">
                        <img src={poll.channel_b.thumbnail_url} alt="" className="w-12 h-12 rounded-full" />
                        <div>
                          <h3 className="font-semibold text-[var(--text-primary)]">{poll.channel_b.title}</h3>
                          <p className="text-[var(--text-dim)] text-sm">{formatNumber(poll.channel_b.subscriber_count)} subs</p>
                        </div>
                      </div>
                    )}
                    <div className="relative h-8 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-pink-500 rounded-full transition-all"
                        style={{ width: `${poll.percent_b}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[var(--text-primary)] font-bold text-sm">
                        {poll.percent_b}%
                      </span>
                    </div>
                    <p className="text-center text-[var(--text-dim)] text-sm mt-2">{poll.votes_b || 0} votes</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SEO Content */}
        <div className="mt-12 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">About Prediction Polls</h2>
          <div className="text-[var(--text-muted)] space-y-3 text-sm">
            <p>
              Test your YouTube knowledge with our prediction polls! Vote on which channels you think will 
              perform better - whether it's gaining more subscribers, reaching a milestone first, or growing faster.
            </p>
            <p>
              New polls are added regularly based on upcoming YouTube milestones and trending channel rivalries.
              Sign in to vote and track your prediction accuracy!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


const AlertsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, login, user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [alertType, setAlertType] = useState('milestone');
  const [threshold, setThreshold] = useState('');
  const [creating, setCreating] = useState(false);

  useSEO({
    title: "Notification Alerts - TopTube World Pro",
    description: "Set up custom alerts to get notified when your favorite YouTube channels reach milestones or experience significant growth.",
    canonical: `${SITE_URL}/alerts`
  });

  const fetchAlerts = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    try {
      const [alertsRes, triggeredRes] = await Promise.all([
        axios.get(`${API}/user/alerts`, { withCredentials: true }),
        axios.get(`${API}/user/alerts/check`, { withCredentials: true })
      ]);
      setAlerts(alertsRes.data.alerts || []);
      setTriggeredAlerts(triggeredRes.data.triggered_alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [isAuthenticated]);

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
      console.error('Search error:', error);
    }
  };

  const handleCreateAlert = async () => {
    if (!selectedChannel) return;
    
    setCreating(true);
    try {
      await axios.post(`${API}/user/alerts`, {
        channel_id: selectedChannel.channel_id,
        alert_type: alertType,
        threshold: threshold ? parseInt(threshold) : null,
        notify_email: true
      }, { withCredentials: true });
      
      setShowCreateModal(false);
      setSelectedChannel(null);
      setSearchQuery('');
      setThreshold('');
      fetchAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await axios.delete(`${API}/user/alerts/${alertId}`, { withCredentials: true });
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const handleToggleAlert = async (alertId, enabled) => {
    try {
      await axios.put(`${API}/user/alerts/${alertId}`, { enabled: !enabled }, { withCredentials: true });
      fetchAlerts();
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const getAlertTypeInfo = (type) => {
    switch (type) {
      case 'milestone':
        return { icon: <Trophy className="w-5 h-5 text-yellow-500" />, label: t('alerts.milestone'), color: 'yellow' };
      case 'daily_gain':
        return { icon: <TrendingUp className="w-5 h-5 text-green-500" />, label: t('alerts.dailyGain'), color: 'green' };
      case 'rank_change':
        return { icon: <ArrowUp className="w-5 h-5 text-blue-500" />, label: t('alerts.rankChange'), color: 'blue' };
      default:
        return { icon: <Bell className="w-5 h-5 text-[var(--text-dim)]" />, label: type, color: 'gray' };
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="py-12" data-testid="alerts-page">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Bell className="w-16 h-16 text-[var(--text-dim)] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">{t('alerts.title')}</h1>
          <p className="text-[var(--text-muted)] mb-8">{t('alerts.subtitle')}</p>
          <button
            onClick={login}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg inline-flex items-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            {t('common.signIn')} to Create Alerts
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="alerts-page">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              <Bell className="w-8 h-8 text-yellow-500" />
              {t('alerts.title')}
            </h1>
            <p className="text-[var(--text-muted)] mt-1">{t('alerts.subtitle')}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('alerts.createAlert')}
          </button>
        </div>

        {/* Triggered Alerts Banner */}
        {triggeredAlerts.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-green-500" />
              <h2 className="font-bold text-[var(--text-primary)]">{triggeredAlerts.length} Alert(s) Triggered!</h2>
            </div>
            <div className="space-y-2">
              {triggeredAlerts.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-[var(--bg-card)] rounded-lg p-3">
                  <img src={item.channel?.thumbnail_url} alt="" className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <p className="text-[var(--text-primary)] font-medium">{item.channel?.title}</p>
                    <p className="text-green-400 text-sm">{item.reason}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/channel/${item.alert.channel_id}`)}
                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm"
                  >
                    View Channel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alert Types Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { type: 'milestone', icon: <Trophy className="w-6 h-6" />, count: alerts.filter(a => a.alert_type === 'milestone').length },
            { type: 'daily_gain', icon: <TrendingUp className="w-6 h-6" />, count: alerts.filter(a => a.alert_type === 'daily_gain').length },
            { type: 'rank_change', icon: <ArrowUp className="w-6 h-6" />, count: alerts.filter(a => a.alert_type === 'rank_change').length }
          ].map(item => (
            <div key={item.type} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                item.type === 'milestone' ? 'bg-yellow-500/20 text-yellow-500' :
                item.type === 'daily_gain' ? 'bg-green-500/20 text-green-500' :
                'bg-blue-500/20 text-blue-500'
              }`}>
                {item.icon}
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{item.count}</div>
              <div className="text-[var(--text-dim)] text-sm">{getAlertTypeInfo(item.type).label}</div>
            </div>
          ))}
        </div>

        {/* Alerts List */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)]">
            <h2 className="font-bold text-[var(--text-primary)]">{t('alerts.myAlerts')} ({alerts.length})</h2>
          </div>
          
          {alerts.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-[var(--text-dim)] mx-auto mb-4" />
              <p className="text-[var(--text-muted)]">{t('alerts.noAlerts')}</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('alerts.createAlert')}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--divide)]">
              {alerts.map(alert => {
                const typeInfo = getAlertTypeInfo(alert.alert_type);
                return (
                  <div key={alert.alert_id} className="p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${typeInfo.color}-500/20`}>
                      {typeInfo.icon}
                    </div>
                    
                    {alert.channel && (
                      <img 
                        src={alert.channel.thumbnail_url} 
                        alt="" 
                        className="w-12 h-12 rounded-full cursor-pointer"
                        onClick={() => navigate(`/channel/${alert.channel_id}`)}
                      />
                    )}
                    
                    <div className="flex-1">
                      <p className="text-[var(--text-primary)] font-medium">{alert.channel?.title || alert.channel_id}</p>
                      <p className="text-[var(--text-dim)] text-sm">
                        {typeInfo.label} • Threshold: {formatNumber(alert.threshold)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleAlert(alert.alert_id, alert.enabled)}
                        className={`px-3 py-1 rounded text-sm ${
                          alert.enabled 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-[var(--text-muted)]'
                        }`}
                      >
                        {alert.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button
                        onClick={() => handleDeleteAlert(alert.alert_id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded"
                        title={t('alerts.deleteAlert')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Alert Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-[var(--bg-page)]/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-hover)] rounded-xl w-full max-w-md">
              <div className="p-4 border-b border-[var(--border-hover)] flex items-center justify-between">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('alerts.createAlert')}</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Channel Search */}
                <div>
                  <label className="block text-[var(--text-muted)] text-sm mb-1">{t('common.channel')}</label>
                  {selectedChannel ? (
                    <div className="flex items-center gap-3 bg-[var(--bg-deep)] rounded-lg p-3">
                      <img src={selectedChannel.thumbnail_url} alt="" className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <p className="text-[var(--text-primary)] font-medium">{selectedChannel.title}</p>
                        <p className="text-[var(--text-dim)] text-sm">{formatNumber(selectedChannel.subscriber_count)} {t('common.subs')}</p>
                      </div>
                      <button onClick={() => setSelectedChannel(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder={t('leaderboard.searchPlaceholder')}
                        className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
                      />
                      {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-hover)] border border-[var(--border-hover)] rounded-lg overflow-hidden z-10">
                          {searchResults.map(ch => (
                            <div
                              key={ch.channel_id}
                              className="flex items-center gap-3 p-3 hover:bg-[var(--border)] cursor-pointer"
                              onClick={() => {
                                setSelectedChannel(ch);
                                setSearchResults([]);
                                setSearchQuery('');
                              }}
                            >
                              <img src={ch.thumbnail_url} alt="" className="w-8 h-8 rounded-full" />
                              <div>
                                <p className="text-[var(--text-primary)] text-sm">{ch.title}</p>
                                <p className="text-[var(--text-dim)] text-xs">{formatNumber(ch.subscriber_count)} {t('common.subs')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Alert Type */}
                <div>
                  <label className="block text-[var(--text-muted)] text-sm mb-1">{t('alerts.alertTypes')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['milestone', 'daily_gain', 'rank_change'].map(type => {
                      const info = getAlertTypeInfo(type);
                      return (
                        <button
                          key={type}
                          onClick={() => setAlertType(type)}
                          className={`p-3 rounded-lg border text-center transition-colors ${
                            alertType === type 
                              ? 'border-red-500 bg-red-500/10' 
                              : 'border-[var(--border-hover)] hover:border-[#444]'
                          }`}
                        >
                          <div className="flex justify-center mb-1">{info.icon}</div>
                          <div className="text-xs text-[var(--text-muted)]">{info.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Threshold */}
                <div>
                  <label className="block text-[var(--text-muted)] text-sm mb-1">
                    Threshold {alertType === 'milestone' ? '(Target Subscribers)' : alertType === 'daily_gain' ? '(Min Daily Gain)' : '(Rank Change)'}
                  </label>
                  <input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder={alertType === 'milestone' ? '100000000' : alertType === 'daily_gain' ? '100000' : '1'}
                    className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
                  />
                  <p className="text-[var(--text-dim)] text-xs mt-1">Leave empty for automatic default</p>
                </div>
              </div>
              
              <div className="p-4 border-t border-[var(--border-hover)] flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-[var(--border)] hover:bg-[var(--border-hover)] text-[var(--text-primary)] rounded-lg"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleCreateAlert}
                  disabled={!selectedChannel || creating}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-[var(--text-primary)] rounded-lg flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      {t('alerts.createAlert')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


const FavoritesPage = () => {
  const navigate = useNavigate();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [channelDetails, setChannelDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "My Favorites - TopTube World Pro",
    description: "Your saved favorite YouTube channels for quick access and tracking.",
    keywords: "favorite YouTube channels, saved channels, YouTube watchlist",
    canonical: `${SITE_URL}/favorites`
  });

  useEffect(() => {
    const fetchDetails = async () => {
      if (favorites.length === 0) {
        setChannelDetails([]);
        setLoading(false);
        return;
      }
      
      try {
        const promises = favorites.map(f => axios.get(`${API}/channels/${f.channel_id}`).catch(() => null));
        const responses = await Promise.all(promises);
        const details = responses.filter(r => r?.data).map(r => r.data);
        setChannelDetails(details);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [favorites]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="favorites-page">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            My Favorites
          </h1>
          <p className="text-[var(--text-dim)]">Your saved channels for quick access</p>
        </div>

        {channelDetails.length === 0 ? (
          <div className="text-center py-16 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg">
            <Bookmark className="w-16 h-16 text-[var(--text-dim)] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No favorites yet</h2>
            <p className="text-[var(--text-dim)] mb-6">Click the heart icon on any channel to save it here</p>
            <Link to="/leaderboard" className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700">
              Browse Channels
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channelDetails.map((channel, idx) => (
              <div 
                key={channel.channel_id}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--border-hover)] transition-colors cursor-pointer"
                onClick={() => navigate(`/channel/${channel.channel_id}`)}
                data-testid={`favorite-card-${idx}`}
              >
                <div className="flex items-start gap-4">
                  <img 
                    src={channel.thumbnail_url || "https://via.placeholder.com/64"} 
                    alt={channel.title}
                    className="w-16 h-16 rounded-full"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--text-primary)] truncate">{channel.title}</h3>
                    <p className="text-[var(--text-dim)] text-sm">{channel.country_name}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-lg font-bold text-[var(--text-primary)]">{formatNumber(channel.subscriber_count)}</span>
                      <span className="text-green-400 text-sm">+{formatNumber(channel.daily_subscriber_gain || 0)}</span>
                    </div>
                  </div>
                  <FavoriteButton 
                    channel={channel}
                    isFavorite={isFavorite(channel.channel_id)}
                    onToggle={toggleFavorite}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== BLOG PAGE ====================

// Default blog posts (fallback if no posts in database)
const defaultBlogPosts = [
  {
    id: '1',
    slug: 'top-10-rising-youtubers-2025',
    title: 'Top 10 Rising YouTubers to Watch in 2025',
    excerpt: 'Discover the fastest-growing YouTube channels that are set to dominate the platform this year.',
    category: 'Trending',
    created_at: '2025-01-15',
    read_time: '5 min read',
    image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&auto=format&fit=crop&q=60',
    status: 'published'
  },
  {
    id: '2',
    slug: 'how-youtube-algorithm-works-2025',
    title: 'How the YouTube Algorithm Works in 2025',
    excerpt: 'An in-depth analysis of YouTube\'s recommendation system and how creators can leverage it.',
    category: 'Guide',
    created_at: '2025-01-10',
    read_time: '8 min read',
    image: 'https://images.unsplash.com/photo-1633114128174-2f8aa49759b0?w=800&auto=format&fit=crop&q=60',
    status: 'published'
  }
];




export { AuthCallbackPage };
export { ChannelRequestPage };
export { PollsPage };
export { AlertsPage };
export { FavoritesPage };
