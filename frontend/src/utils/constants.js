// App constants

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;
export const API_URL = API;

export const SITE_NAME = "TopTube World Pro";
export const SITE_URL = process.env.REACT_APP_BACKEND_URL || "https://toptubeworldpro.com";

export const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// SEO-friendly country slugs
export const COUNTRY_SLUGS = {
  'united-states-youtubers': 'US', 'india-youtubers': 'IN', 'brazil-youtubers': 'BR',
  'mexico-youtubers': 'MX', 'russia-youtubers': 'RU', 'japan-youtubers': 'JP',
  'south-korea-youtubers': 'KR', 'united-kingdom-youtubers': 'GB', 'germany-youtubers': 'DE',
  'france-youtubers': 'FR', 'indonesia-youtubers': 'ID', 'philippines-youtubers': 'PH',
  'spain-youtubers': 'ES', 'italy-youtubers': 'IT', 'canada-youtubers': 'CA',
  'australia-youtubers': 'AU', 'argentina-youtubers': 'AR', 'colombia-youtubers': 'CO',
  'thailand-youtubers': 'TH', 'vietnam-youtubers': 'VN', 'turkey-youtubers': 'TR',
  'poland-youtubers': 'PL', 'netherlands-youtubers': 'NL', 'pakistan-youtubers': 'PK',
  'egypt-youtubers': 'EG', 'saudi-arabia-youtubers': 'SA', 'bangladesh-youtubers': 'BD',
  'china-youtubers': 'CN', 'taiwan-youtubers': 'TW', 'malaysia-youtubers': 'MY',
  'singapore-youtubers': 'SG', 'sweden-youtubers': 'SE', 'norway-youtubers': 'NO',
  'denmark-youtubers': 'DK', 'finland-youtubers': 'FI', 'portugal-youtubers': 'PT',
  'chile-youtubers': 'CL', 'peru-youtubers': 'PE', 'ukraine-youtubers': 'UA',
  'czech-republic-youtubers': 'CZ', 'romania-youtubers': 'RO', 'greece-youtubers': 'GR',
  'hungary-youtubers': 'HU', 'israel-youtubers': 'IL', 'uae-youtubers': 'AE',
  'south-africa-youtubers': 'ZA', 'nigeria-youtubers': 'NG', 'kenya-youtubers': 'KE',
  'morocco-youtubers': 'MA', 'new-zealand-youtubers': 'NZ', 'ireland-youtubers': 'IE',
  'austria-youtubers': 'AT', 'belgium-youtubers': 'BE', 'switzerland-youtubers': 'CH'
};

export const BLOG_CATEGORIES = ['Trending', 'Guide', 'Analysis', 'Case Study', 'Strategy', 'Gaming', 'News', 'Tips'];

export const FAVORITES_KEY = 'toptube_favorites';
export const THEME_KEY = 'toptube_theme';
