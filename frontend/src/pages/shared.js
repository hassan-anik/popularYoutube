// Shared page dependencies - import these in page components
import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense, memo } from "react";
import { Link, useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';

// Re-export React hooks
export { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense, memo };
export { Link, useParams, useNavigate, useSearchParams, useLocation };
export { axios };
export { ReactMarkdown, remarkGfm };
export { useTranslation };

// Import from utils
export { API, API_URL, BACKEND_URL, SITE_NAME, SITE_URL, geoUrl, COUNTRY_SLUGS, BLOG_CATEGORIES, FAVORITES_KEY, THEME_KEY } from '../utils/constants';
export { formatNumber, formatDate, formatShortDate } from '../utils/format';

// Import hooks
export { useSEO, JsonLd } from '../hooks/useSEO';
export { useFavorites } from '../hooks/useFavorites';

// Import contexts
export { useTheme } from '../context/ThemeContext';
export { useAuth } from '../context/AuthContext';

// Lucide icons commonly used in pages
export {
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  Users,
  Eye,
  PlayCircle,
  RefreshCw,
  Search,
  ChevronRight,
  Crown,
  Flame,
  Zap,
  BarChart3,
  Settings,
  ArrowUp,
  ArrowDown,
  X,
  Menu,
  ExternalLink,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Send,
  MessageCircle,
  Heart,
  Star,
  Clock,
  Code,
  Copy,
  Check,
  Plus,
  Trash2,
  BookOpen,
  FileText,
  CalendarDays,
  Bookmark,
  Download,
  Sun,
  Moon,
  Home,
  ChevronDown,
  Trophy,
  HelpCircle,
  LogIn,
  LogOut,
  User,
  Vote,
  ThumbsUp,
  LinkIcon,
  Bell
} from "lucide-react";
