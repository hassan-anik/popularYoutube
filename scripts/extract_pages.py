#!/usr/bin/env python3
"""Extract page components from App.js into separate files."""
import re
import os

APP_JS = '/app/frontend/src/App.js'

# Read App.js
with open(APP_JS, 'r') as f:
    lines = f.readlines()

# Component definitions with their line ranges (1-indexed)
COMPONENTS = {
    'HomePage': (1305, 1591),
    'LeaderboardPage': (1592, 1963),
    'Top100Page': (1964, 2186),
    'CountriesPage': (2188, 2297),
    'CountryPage': (2299, 2631),
    'ChannelPage': (2634, 3044),
    'TrendingPage': (3047, 3180),
    'RacePage': (3184, 3394),
    'MilestonePage': (3398, 3618),
    'CategoryListPage': (3633, 3751),
    'CategoryPage': (3753, 3942),
    'RisingStarsPage': (3946, 4123),
    'ComparePage': (4127, 4516),
    'AuthCallbackPage': (4520, 4571),
    'ChannelRequestPage': (4712, 4921),
    'PollsPage': (4925, 5096),
    'AlertsPage': (5100, 5508),
    'FavoritesPage': (5512, 5641),
    'BlogPage': (5642, 5838),
    'BlogPostPage': (5839, 6032),
    'CountryBlogPostPage': (6033, 6251),
    'BlogAdminPage': (6252, 6674),
    'AdminPage': (6675, 6912),
}

# Also extract CHANNEL_CATEGORIES constant and SUPPORTED_LANGUAGES
CONSTANTS = {
    'CHANNEL_CATEGORIES': (3620, 3632),
}

# Import mappings - what each symbol needs
REACT_HOOKS = {'useState', 'useEffect', 'useMemo', 'useRef', 'useCallback', 'Suspense', 'lazy', 'memo'}
REACT_ROUTER = {'Link', 'useParams', 'useNavigate', 'useLocation', 'useSearchParams'}
LUCIDE_ICONS = {
    'PlayCircle', 'Users', 'Eye', 'Zap', 'Trophy', 'TrendingUp', 'TrendingDown',
    'Flame', 'Star', 'Clock', 'BookOpen', 'BarChart3', 'Search', 'ChevronRight',
    'ChevronDown', 'ArrowUp', 'ArrowDown', 'ExternalLink', 'Heart', 'Share2',
    'Copy', 'X', 'Plus', 'Bell', 'Check', 'Send', 'Trash2', 'ThumbsUp',
    'LinkIcon', 'Vote', 'LogIn', 'LogOut', 'Minus', 'Globe', 'Menu', 'Calendar',
    'Home', 'HelpCircle', 'Filter', 'RefreshCw', 'Settings', 'Edit', 'Save',
    'FileText', 'Image', 'Tag', 'MoreVertical', 'AlertCircle'
}

COMMON_COMPONENTS = {
    'ViralBadge': ('ViralBadge', '../components/common'),
    'RankChange': ('RankChange', '../components/common'),
    'EstimatedLabel': ('EstimatedLabel', '../components/common'),
    'ChannelCard': ('ChannelCard', '../components/common'),
    'FavoriteButton': ('FavoriteButton', '../components/common'),
    'LiveIndicator': ('LiveIndicator', '../components/common'),
    'AnimatedCounter': ('AnimatedCounter', '../components/common'),
    'LastUpdatedIndicator': ('LastUpdatedIndicator', '../components/common'),
    'NewsletterSignup': ('NewsletterSignup', '../components/common'),
    'HorizontalAd': ('HorizontalAd', '../components/common'),
    'SidebarAd': ('SidebarAd', '../components/common'),
    'InFeedAd': ('InFeedAd', '../components/common'),
    'SocialShareButtons': ('SocialShareButtons', '../components/common'),
    'EmbedWidget': ('EmbedWidget', '../components/common'),
    'LoadingFallback': ('LoadingFallback', '../components/common'),
    'Header': ('Header', '../components/common'),
    'Footer': ('Footer', '../components/common'),
}

SEO_COMPONENTS = {
    'HomeSEO': ('HomeSEO', '../components/seo'),
    'CountrySEO': ('CountrySEO', '../components/seo'),
    'ChannelSEO': ('ChannelSEO', '../components/seo'),
    'LeaderboardSEO': ('LeaderboardSEO', '../components/seo'),
    'CountriesListSEO': ('CountriesListSEO', '../components/seo'),
    'TrendingSEO': ('TrendingSEO', '../components/seo'),
    'Top100SEO': ('Top100SEO', '../components/seo'),
    'Breadcrumb': ('Breadcrumb', '../components/seo'),
    'FAQSection': ('FAQSection', '../components/seo'),
    'CountrySlugRedirect': ('CountrySlugRedirect', '../components/seo'),
    'HreflangTags': ('HreflangTags', '../components/seo'),
}

# Grouping: which components go into which file
FILE_GROUPS = {
    'HomePage.jsx': ['HomePage'],
    'LeaderboardPage.jsx': ['LeaderboardPage'],
    'Top100Page.jsx': ['Top100Page'],
    'CountriesPage.jsx': ['CountriesPage'],
    'CountryPage.jsx': ['CountryPage'],
    'ChannelPage.jsx': ['ChannelPage'],
    'TrendingPage.jsx': ['TrendingPage'],
    'RaceMilestonePages.jsx': ['RacePage', 'MilestonePage'],
    'CategoryPages.jsx': ['CategoryListPage', 'CategoryPage'],
    'RisingStarsPage.jsx': ['RisingStarsPage'],
    'ComparePage.jsx': ['ComparePage'],
    'UserPages.jsx': ['AuthCallbackPage', 'ChannelRequestPage', 'PollsPage', 'AlertsPage', 'FavoritesPage'],
    'BlogPages.jsx': ['BlogPage', 'BlogPostPage', 'CountryBlogPostPage'],
    'AdminPages.jsx': ['BlogAdminPage', 'AdminPage'],
}

def extract_component(name):
    """Extract component code from App.js"""
    start, end = COMPONENTS[name]
    component_lines = lines[start-1:end]
    return ''.join(component_lines)

def find_used_symbols(code, symbol_set):
    """Find which symbols from a set are used in the code"""
    used = set()
    for symbol in symbol_set:
        # Use word boundary to avoid false matches
        if re.search(r'\b' + re.escape(symbol) + r'\b', code):
            used.add(symbol)
    return used

def generate_imports(code, component_names):
    """Generate import statements based on code analysis"""
    imports = []
    
    # React imports
    react_used = find_used_symbols(code, REACT_HOOKS)
    react_base = ['React']
    react_named = sorted(react_used)
    if react_named:
        imports.append(f"import React, {{ {', '.join(react_named)} }} from 'react';")
    else:
        imports.append("import React from 'react';")
    
    # React Router
    router_used = find_used_symbols(code, REACT_ROUTER)
    if router_used:
        imports.append(f"import {{ {', '.join(sorted(router_used))} }} from 'react-router-dom';")
    
    # Axios
    if 'axios' in code:
        imports.append("import axios from 'axios';")
    
    # i18next
    if 'useTranslation' in code:
        imports.append("import { useTranslation } from 'react-i18next';")
    
    # Recharts
    recharts_symbols = {'ResponsiveContainer', 'LineChart', 'Line', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'Legend', 'BarChart', 'Bar'}
    recharts_used = find_used_symbols(code, recharts_symbols)
    if recharts_used:
        imports.append(f"import {{ {', '.join(sorted(recharts_used))} }} from 'recharts';")
    
    # Lucide icons
    icons_used = find_used_symbols(code, LUCIDE_ICONS)
    if icons_used:
        imports.append(f"import {{ {', '.join(sorted(icons_used))} }} from 'lucide-react';")
    
    # Hooks
    if 'useSEO' in code or 'JsonLd' in code:
        hooks_used = []
        if 'useSEO' in code:
            hooks_used.append('useSEO')
        if 'JsonLd' in code:
            hooks_used.append('JsonLd')
        imports.append(f"import {{ {', '.join(hooks_used)} }} from '../hooks/useSEO';")
    
    if 'useFavorites' in code:
        imports.append("import { useFavorites } from '../hooks/useFavorites';")
    
    # Utils
    utils_used = []
    if 'API' in code and re.search(r'\bAPI\b', code):
        utils_used.append('API')
    if 'SITE_URL' in code:
        utils_used.append('SITE_URL')
    if 'SITE_NAME' in code:
        utils_used.append('SITE_NAME')
    if 'BACKEND_URL' in code:
        utils_used.append('BACKEND_URL')
    if 'SUPPORTED_LANGUAGES' in code:
        utils_used.append('SUPPORTED_LANGUAGES')
    if 'COUNTRY_SLUGS' in code:
        utils_used.append('COUNTRY_SLUGS')
    if utils_used:
        imports.append(f"import {{ {', '.join(sorted(utils_used))} }} from '../utils/constants';")
    
    format_used = []
    if 'formatNumber' in code:
        format_used.append('formatNumber')
    if 'formatShortDate' in code:
        format_used.append('formatShortDate')
    if 'formatDate' in code:
        format_used.append('formatDate')
    if format_used:
        imports.append(f"import {{ {', '.join(sorted(format_used))} }} from '../utils/format';")
    
    # Context
    if 'useAuth' in code:
        imports.append("import { useAuth } from '../context/AuthContext';")
    if 'useTheme' in code:
        imports.append("import { useTheme } from '../context/ThemeContext';")
    
    # Common components
    common_used = {}  # source -> [components]
    for symbol, (comp_name, source) in COMMON_COMPONENTS.items():
        if re.search(r'\b' + re.escape(symbol) + r'\b', code):
            # Don't import if this component is defined in this file
            if symbol not in component_names:
                common_used.setdefault(source, []).append(comp_name)
    
    for source, comps in sorted(common_used.items()):
        imports.append(f"import {{ {', '.join(sorted(set(comps)))} }} from '{source}';")
    
    # SEO components
    seo_used = {}
    for symbol, (comp_name, source) in SEO_COMPONENTS.items():
        if re.search(r'\b' + re.escape(symbol) + r'\b', code):
            if symbol not in component_names:
                seo_used.setdefault(source, []).append(comp_name)
    
    for source, comps in sorted(seo_used.items()):
        imports.append(f"import {{ {', '.join(sorted(set(comps)))} }} from '{source}';")
    
    # Lazy imports
    if 'LazyWorldMap' in code:
        imports.append("const LazyWorldMap = lazy(() => import('../components/LazyWorldMap'));")
    if 'LazyGrowthChart' in code:
        imports.append("const LazyGrowthChart = lazy(() => import('../components/GrowthChart'));")
    
    return '\n'.join(imports)

def generate_exports(component_names):
    """Generate export statements"""
    exports = []
    for name in component_names:
        exports.append(f"export {{ {name} }};")
    return '\n'.join(exports)

def create_page_file(filename, component_names):
    """Create a page file with the given components"""
    # Extract all component code
    all_code = ''
    for name in component_names:
        all_code += extract_component(name) + '\n\n'
    
    # Check if CHANNEL_CATEGORIES is needed
    needs_categories = 'CHANNEL_CATEGORIES' in all_code
    if needs_categories:
        start, end = CONSTANTS['CHANNEL_CATEGORIES']
        categories_code = ''.join(lines[start-1:end])
        all_code = categories_code + '\n\n' + all_code
    
    # Generate imports
    import_block = generate_imports(all_code, component_names)
    
    # Generate exports
    export_block = generate_exports(component_names)
    
    # Combine
    file_content = import_block + '\n\n' + all_code + '\n' + export_block + '\n'
    
    # Write file
    filepath = f'/app/frontend/src/pages/{filename}'
    with open(filepath, 'w') as f:
        f.write(file_content)
    
    print(f"Created {filepath} ({len(file_content.splitlines())} lines)")
    return filepath

# Create all page files
created_files = []
for filename, components in FILE_GROUPS.items():
    filepath = create_page_file(filename, components)
    created_files.append(filepath)

print(f"\nCreated {len(created_files)} page files")

# Now generate the updated index.js
index_content = """// Static Pages (already extracted)
export { AboutPage, MethodologyPage, PrivacyPage, TermsPage, ContactPage } from './StaticPages';

// SEO Landing Pages (already extracted)
export {
  TopYouTubeChannelsPage,
  MostSubscribedYouTubeChannelsPage,
  YouTubeSubscriberRankingPage,
  TopYouTubeChannelsByCountryPage
} from './SEOLandingPages';

// Main Pages
export { HomePage } from './HomePage';
export { LeaderboardPage } from './LeaderboardPage';
export { Top100Page } from './Top100Page';
export { CountriesPage } from './CountriesPage';
export { CountryPage } from './CountryPage';
export { ChannelPage } from './ChannelPage';
export { TrendingPage } from './TrendingPage';
export { RacePage, MilestonePage } from './RaceMilestonePages';
export { CategoryListPage, CategoryPage } from './CategoryPages';
export { RisingStarsPage } from './RisingStarsPage';
export { ComparePage } from './ComparePage';
export { AuthCallbackPage, ChannelRequestPage, PollsPage, AlertsPage, FavoritesPage } from './UserPages';
export { BlogPage, BlogPostPage, CountryBlogPostPage } from './BlogPages';
export { BlogAdminPage, AdminPage } from './AdminPages';
"""

with open('/app/frontend/src/pages/index.js', 'w') as f:
    f.write(index_content)
print("Updated pages/index.js")
