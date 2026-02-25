import React, { useRef, useEffect } from 'react';

// AdSense Display Ad Component
export const AdBanner = ({ slot = "auto", format = "auto", style = {} }) => {
  const adRef = useRef(null);
  
  useEffect(() => {
    try {
      if (window.adsbygoogle && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);
  
  return (
    <div className="ad-container my-4" style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-3641870553510634"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};

// Horizontal Banner Ad (for between sections) - Hidden on mobile
export const HorizontalAd = () => (
  <div className="hidden md:block w-full bg-[#0d0d0d] border border-[#222] rounded-lg p-2 my-6">
    <div className="text-center text-xs text-gray-500 mb-1">Advertisement</div>
    <AdBanner format="horizontal" style={{ minHeight: '90px' }} />
  </div>
);

// Sidebar Ad for Channel pages
export const SidebarAd = () => (
  <div className="sticky top-4 bg-[#0d0d0d] border border-[#222] rounded-lg p-3">
    <div className="text-center text-xs text-gray-500 mb-2">Advertisement</div>
    <AdBanner format="rectangle" style={{ minHeight: '250px', minWidth: '300px' }} />
  </div>
);

// In-feed ad between leaderboard rows
export const InFeedAd = ({ index }) => {
  if (index % 10 !== 9) return null;
  
  return (
    <div className="col-span-full bg-[#0d0d0d] border border-[#222] rounded-lg p-3 my-2">
      <div className="text-center text-xs text-gray-500 mb-1">Sponsored</div>
      <AdBanner format="fluid" style={{ minHeight: '100px' }} />
    </div>
  );
};
