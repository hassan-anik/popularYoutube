// App constants

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;
export const API_URL = API;

export const SITE_NAME = "TopTube World Pro";
export const SITE_URL = process.env.REACT_APP_BACKEND_URL || "https://toptubeworldpro.com";

export const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// SEO-friendly country slugs
export const COUNTRY_SLUGS = {
  'india-youtubers': 'IN',
  'usa-youtubers': 'US',
  'brazil-youtubers': 'BR',
  'mexico-youtubers': 'MX',
  'russia-youtubers': 'RU',
  'japan-youtubers': 'JP',
  'south-korea-youtubers': 'KR',
  'uk-youtubers': 'GB',
  'germany-youtubers': 'DE',
  'france-youtubers': 'FR',
  'indonesia-youtubers': 'ID',
  'philippines-youtubers': 'PH'
};

export const BLOG_CATEGORIES = ['Trending', 'Guide', 'Analysis', 'Case Study', 'Strategy', 'Gaming', 'News', 'Tips'];

export const FAVORITES_KEY = 'toptube_favorites';
export const THEME_KEY = 'toptube_theme';
