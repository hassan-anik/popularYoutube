import { useEffect } from 'react';
import { SITE_NAME, SITE_URL } from '../utils/constants';

export const useSEO = ({ title, description, keywords, canonical, ogType = "website", ogImage = null }) => {
  useEffect(() => {
    document.title = title;
    
    const updateMeta = (name, content, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    const updateLink = (rel, href) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };
    
    if (description) updateMeta('description', description);
    if (keywords) updateMeta('keywords', keywords);
    if (canonical) updateLink('canonical', canonical);
    
    // Open Graph
    updateMeta('og:title', title, true);
    if (description) updateMeta('og:description', description, true);
    updateMeta('og:type', ogType, true);
    updateMeta('og:site_name', SITE_NAME, true);
    if (canonical) updateMeta('og:url', canonical, true);
    if (ogImage) updateMeta('og:image', ogImage, true);
    
    // Twitter Card
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    if (description) updateMeta('twitter:description', description);
    if (ogImage) updateMeta('twitter:image', ogImage);
    
  }, [title, description, keywords, canonical, ogType, ogImage]);
};

export const JsonLd = ({ data }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);
