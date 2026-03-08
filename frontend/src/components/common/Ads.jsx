import React, { useRef, useEffect } from 'react';

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

export const HorizontalAd = () => (
  <div className="hidden md:block w-full bg-[#0d0d0d] border border-[#222] rounded-lg p-2 my-6">
    <div className="text-center text-xs text-gray-500 mb-1">Advertisement</div>
    <AdBanner format="horizontal" style={{ minHeight: '90px' }} />
  </div>
);

export const SidebarAd = () => (
  <div className="bg-[#0d0d0d] border border-[#222] rounded-lg p-2 sticky top-20">
    <div className="text-center text-xs text-gray-500 mb-1">Sponsored</div>
    <AdBanner format="rectangle" style={{ minHeight: '250px', width: '300px' }} />
  </div>
);

export const InFeedAd = ({ index }) => {
  if (index > 0 && index % 20 === 0) {
    return (
      <tr className="bg-[#0a0a0a] hidden md:table-row">
        <td colSpan="6" className="px-4 py-3">
          <div className="text-center text-xs text-gray-500 mb-1">Sponsored</div>
          <AdBanner format="fluid" style={{ minHeight: '60px' }} />
        </td>
      </tr>
    );
  }
  return null;
};
