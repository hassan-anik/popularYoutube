import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { JsonLd } from '../../hooks/useSEO';
import { SITE_URL } from '../../utils/constants';

export const Breadcrumb = ({ items }) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url ? `${SITE_URL}${item.url}` : undefined
    }))
  };

  return (
    <>
      <JsonLd data={schemaData} />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
          <li className="flex items-center">
            <Link 
              to="/" 
              className="hover:text-white transition-colors flex items-center gap-1"
              title="Go to homepage"
            >
              <Home className="w-4 h-4" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-gray-600" />
              {item.url ? (
                <Link 
                  to={item.url} 
                  className="hover:text-white transition-colors"
                  title={`Go to ${item.name}`}
                >
                  {item.name}
                </Link>
              ) : (
                <span className="text-white">{item.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};
