import React, { lazy, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Edit, ExternalLink, FileText, Image, Plus, RefreshCw, Search, Settings, Trash2, X } from 'lucide-react';
import { API } from '../utils/constants';
import { formatDate, formatNumber, formatShortDate } from '../utils/format';

const BlogAdminPage = () => {
  const [searchParams] = useSearchParams();
  const adminKey = searchParams.get('key') || '';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Trending',
    image: '',
    status: 'draft',
    read_time: '5 min read'
  });

  const verifyAndFetchPosts = async (key) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/blog/posts?admin_key=${key}`);
      setPosts(response.data.posts);
      setIsAuthenticated(true);
      setMessage({ type: 'success', text: 'Authenticated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid admin key' });
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) {
      setInputKey(adminKey);
      verifyAndFetchPosts(adminKey);
    }
  }, [adminKey]);

  const handleLogin = (e) => {
    e.preventDefault();
    verifyAndFetchPosts(inputKey);
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: 'Trending',
      image: '',
      status: 'draft',
      read_time: '5 min read'
    });
    setEditingPost(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingPost) {
        await axios.put(`${API}/admin/blog/posts/${editingPost.id}?admin_key=${inputKey}`, formData);
        setMessage({ type: 'success', text: 'Post updated successfully!' });
      } else {
        await axios.post(`${API}/admin/blog/posts?admin_key=${inputKey}`, formData);
        setMessage({ type: 'success', text: 'Post created successfully!' });
      }
      resetForm();
      verifyAndFetchPosts(inputKey);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error saving post' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post) => {
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content || '',
      category: post.category,
      image: post.image || '',
      status: post.status,
      read_time: post.read_time
    });
    setEditingPost(post);
    setShowForm(true);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await axios.delete(`${API}/admin/blog/posts/${postId}?admin_key=${inputKey}`);
      setMessage({ type: 'success', text: 'Post deleted!' });
      verifyAndFetchPosts(inputKey);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting post' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="blog-admin-login">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
            <Settings className="w-6 h-6 text-red-500" />
            Blog Admin
          </h1>
          
          {message && (
            <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
              {message.text}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <label className="block text-[var(--text-muted)] text-sm mb-2">Admin Key</label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Enter admin key..."
              className="w-full bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-3 text-[var(--text-primary)] mb-4 focus:border-red-500 focus:outline-none"
              required
              data-testid="admin-key-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="blog-admin-page">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <Settings className="w-8 h-8 text-red-500" />
            Blog Admin
          </h1>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Post
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
            {message.text}
          </div>
        )}

        {/* Post Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-[var(--bg-page)]/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    {editingPost ? 'Edit Post' : 'Create New Post'}
                  </h2>
                  <button onClick={resetForm} className="text-[var(--text-dim)] hover:text-[var(--text-primary)]">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[var(--text-muted)] text-sm mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={handleTitleChange}
                      className="w-full bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-muted)] text-sm mb-1">Slug *</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[var(--text-muted)] text-sm mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
                      >
                        {BLOG_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[var(--text-muted)] text-sm mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[var(--text-muted)] text-sm mb-1">Read Time</label>
                      <input
                        type="text"
                        value={formData.read_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, read_time: e.target.value }))}
                        placeholder="5 min read"
                        className="w-full bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--text-muted)] text-sm mb-1">Image URL</label>
                      <input
                        type="url"
                        value={formData.image}
                        onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[var(--text-muted)] text-sm mb-1">Excerpt *</label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      rows={2}
                      className="w-full bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:border-red-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-muted)] text-sm mb-1">Content *</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      rows={12}
                      className="w-full bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:border-red-500 focus:outline-none font-mono text-sm"
                      placeholder="Write your blog post content here..."
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : (editingPost ? 'Update Post' : 'Create Post')}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 bg-[var(--border)] text-[var(--text-primary)] py-3 rounded-lg font-semibold hover:bg-[var(--border-hover)]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Posts List */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--bg-deep)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Post</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-dim)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--divide)]">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-[var(--text-dim)]">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    No blog posts yet. Create your first post!
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {post.image && (
                          <img src={post.image} alt="" loading="lazy" className="w-12 h-12 rounded object-cover" />
                        )}
                        <div>
                          <div className="font-medium text-[var(--text-primary)]">{post.title}</div>
                          <div className="text-xs text-[var(--text-dim)]">/blog/{post.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="bg-[var(--border)] text-[var(--text-secondary)] px-2 py-1 rounded text-xs">{post.category}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${post.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[var(--text-dim)] text-sm">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-[var(--text-dim)] hover:text-[var(--text-primary)]"
                          title="View"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-2 text-[var(--text-dim)] hover:text-blue-400"
                          title="Edit"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 text-[var(--text-dim)] hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Image Upload Help */}
        <div className="mt-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-[var(--text-primary)] font-semibold mb-2">Image Upload Tips</h3>
          <p className="text-[var(--text-dim)] text-sm mb-2">
            For blog post images, upload to a free image hosting service and paste the URL:
          </p>
          <div className="flex gap-4 text-sm">
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400">
              Unsplash (Free Photos)
            </a>
            <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400">
              Imgur
            </a>
            <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400">
              ImgBB
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin Page


const AdminPage = () => {
  const [stats, setStats] = useState(null);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, countriesRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/countries`)
      ]);
      setStats(statsRes.data);
      setCountries(countriesRes.data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const response = await axios.post(`${API}/admin/seed`);
      setMessage({ type: "success", text: response.data.message });
      fetchData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.detail || "Failed to seed" });
    } finally {
      setSeeding(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await axios.post(`${API}/admin/refresh-all`);
      setMessage({ type: "success", text: response.data.message });
      fetchData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.detail || "Failed to refresh" });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const response = await axios.get(`${API}/search/channels?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.results || []);
    } catch (error) {
      setMessage({ type: "error", text: "Search failed" });
    } finally {
      setSearching(false);
    }
  };

  const handleAddChannel = async (channelId) => {
    if (!selectedCountry) {
      setMessage({ type: "error", text: "Select a country first" });
      return;
    }
    try {
      await axios.post(`${API}/channels`, { channel_id: channelId, country_code: selectedCountry });
      setMessage({ type: "success", text: "Channel added!" });
      setSearchResults([]);
      fetchData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.detail || "Failed to add" });
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
    <div className="py-8" data-testid="admin-page">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Admin Dashboard</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${message.type === 'success' ? 'bg-green-900/30 border border-green-800 text-green-400' : 'bg-red-900/30 border border-red-800 text-red-400'}`}>
            {message.text}
            <button onClick={() => setMessage(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{stats?.total_countries || 0}</div>
            <div className="text-[var(--text-dim)] text-sm">Countries</div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{stats?.total_channels || 0}</div>
            <div className="text-[var(--text-dim)] text-sm">Channels</div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{formatNumber(stats?.total_stats_records || 0)}</div>
            <div className="text-[var(--text-dim)] text-sm">Data Points</div>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{stats?.last_update !== "Never" ? formatShortDate(stats?.last_update) : "Never"}</div>
            <div className="text-[var(--text-dim)] text-sm">Last Update</div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              data-testid="seed-btn"
            >
              {seeding && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              Seed Initial Data
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-[var(--border)] text-[var(--text-primary)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--border-hover)] disabled:opacity-50 flex items-center gap-2"
              data-testid="refresh-btn"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh All
            </button>
          </div>
        </div>

        {/* Add Channel */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Add Channel</h2>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-2 text-[var(--text-primary)]"
              data-testid="country-select"
            >
              <option value="">Select Country</option>
              {countries.map(c => (
                <option key={c.code} value={c.code}>{c.flag_emoji} {c.name}</option>
              ))}
            </select>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search YouTube channels..."
                className="flex-1 bg-[var(--bg-deep)] border border-[var(--border-hover)] rounded-lg px-4 py-2 text-[var(--text-primary)]"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                data-testid="search-input"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                data-testid="search-btn"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--divide)]">
              {searchResults.map(result => (
                <div key={result.channel_id} className="p-4 flex items-center gap-4">
                  <img src={result.thumbnail_url} alt="" loading="lazy" className="w-10 h-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--text-primary)] truncate">{result.title}</div>
                    <div className="text-xs text-[var(--text-dim)] truncate">{result.description}</div>
                  </div>
                  <button
                    onClick={() => handleAddChannel(result.channel_id)}
                    className="bg-[var(--border)] text-[var(--text-primary)] px-3 py-1 rounded text-sm hover:bg-[var(--border-hover)]"
                    data-testid={`add-${result.channel_id}`}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Countries Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <h2 className="font-bold text-[var(--text-primary)]">Countries Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-deep)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Country</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Channels</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-dim)] uppercase">Top Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--divide)]">
                {countries.map(country => (
                  <tr key={country.code} data-testid={`admin-country-${country.code}`}>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{country.flag_emoji} {country.name}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{country.channel_count}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{country.top_channel?.title || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};



export { BlogAdminPage };
export { AdminPage };
