import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COUNTRY_SLUGS, SITE_URL } from '../../utils/constants';

// SEO-friendly country slug redirect component
export const CountrySlugRedirect = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const countryCode = COUNTRY_SLUGS[slug];
    if (countryCode) {
      navigate(`/country/${countryCode}`, { replace: true });
    } else {
      navigate('/countries', { replace: true });
    }
  }, [slug, navigate]);
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
};

// Hreflang tags for international SEO
export const HreflangTags = () => {
  useEffect(() => {
    // Remove existing hreflang tags
    document.querySelectorAll('link[hreflang]').forEach(el => el.remove());
    
    // Add hreflang tags
    const currentUrl = window.location.pathname;
    const fullUrl = `${SITE_URL}${currentUrl}`;
    
    // x-default
    const xDefault = document.createElement('link');
    xDefault.rel = 'alternate';
    xDefault.hreflang = 'x-default';
    xDefault.href = fullUrl;
    document.head.appendChild(xDefault);
    
    // English
    const enTag = document.createElement('link');
    enTag.rel = 'alternate';
    enTag.hreflang = 'en';
    enTag.href = fullUrl;
    document.head.appendChild(enTag);
    
    return () => {
      document.querySelectorAll('link[hreflang]').forEach(el => el.remove());
    };
  }, []);
  
  return null;
};
