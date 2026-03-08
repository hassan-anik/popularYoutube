import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, ChevronDown, HelpCircle } from 'lucide-react';
import { useSEO, JsonLd } from '../../hooks/useSEO';
import { SITE_NAME, SITE_URL } from '../../utils/constants';
import { formatNumber } from '../../utils/format';

export const HomeSEO = () => {
  const currentYear = new Date().getFullYear();
  useSEO({
    title: `Most Subscribed YouTube Channels ${currentYear} - Live Rankings & Stats`,
    description: `#1 MrBeast (468M) vs #2 T-Series (310M) - Who is the second most subscribed YouTuber ${currentYear}? Live rankings of most subscribed YouTube channels updated in real-time for 197 countries.`,
    keywords: `most subscribed youtube channel ${currentYear}, second most subscribed youtuber ${currentYear}, most subscribed youtubers ${currentYear}, most subscribed youtube channel worldwide ${currentYear}, most popular youtubers worldwide ${currentYear}, mrbeast subscribers, t-series subscribers, youtube ranking ${currentYear}`,
    canonical: SITE_URL
  });
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": SITE_URL,
    "description": `Live rankings of the most subscribed YouTube channels in ${currentYear}. Track MrBeast, T-Series, Cocomelon and top YouTubers worldwide.`,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${SITE_URL}/countries`,
      "query-input": "required name=search_term_string"
    }
  };
  
  return <JsonLd data={schemaData} />;
};

export const CountrySEO = ({ country, channels }) => {
  const currentYear = new Date().getFullYear();
  const topChannel = channels?.[0];
  const channelCount = channels?.length || 0;
  
  const title = country ? `Most Subscribed YouTube Channels in ${country.name} ${currentYear} ${country.flag_emoji} Top ${channelCount} YouTubers` : "";
  const description = country ? `Top YouTubers in ${country.name} ${currentYear}: ${topChannel ? `#1 ${topChannel.title} (${formatNumber(topChannel.subscriber_count)} subs)` : 'See rankings'}. Live subscriber counts, growth stats & trending ${country.name} YouTube channels updated daily.` : "";
  const keywords = country ? `most subscribed youtube channels ${country.name.toLowerCase()} ${currentYear}, top youtubers ${country.name.toLowerCase()} ${currentYear}, trending youtube channels ${country.name.toLowerCase()}, popular youtubers ${country.name.toLowerCase()}, ${country.name.toLowerCase()} youtube rankings, best youtubers ${country.name.toLowerCase()} ${currentYear}` : "";
  const pageUrl = country ? `${SITE_URL}/country/${country.code}` : "";
  
  useSEO({
    title,
    description,
    keywords,
    canonical: pageUrl
  });
  
  if (!country) return null;
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Top YouTube Channels in ${country.name}`,
    "description": description,
    "url": pageUrl,
    "numberOfItems": channelCount,
    "itemListElement": channels?.slice(0, 10).map((channel, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "item": {
        "@type": "Organization",
        "name": channel.title,
        "url": `https://youtube.com/channel/${channel.channel_id}`,
        "description": `YouTube channel with ${formatNumber(channel.subscriber_count)} subscribers`,
        "image": channel.thumbnail_url
      }
    })) || []
  };

  return <JsonLd data={schemaData} />;
};

export const ChannelSEO = ({ channel }) => {
  const currentYear = new Date().getFullYear();
  const title = channel ? `${channel.title} YouTube Stats ${currentYear} - ${formatNumber(channel.subscriber_count)} Subscribers Live Count` : "";
  const description = channel ? `${channel.title} live subscriber count: ${formatNumber(channel.subscriber_count)} subs, ${formatNumber(channel.view_count)} views, ${channel.video_count} videos. Ranked #${channel.current_rank || '?'} in ${channel.country_name}. Real-time ${channel.title} YouTube stats ${currentYear}.` : "";
  const keywords = channel ? `${channel.title} youtube stats, ${channel.title} subscribers ${currentYear}, ${channel.title} subscriber count, ${channel.title} total views, ${channel.title} youtube channel, ${channel.country_name.toLowerCase()} youtuber` : "";
  const pageUrl = channel ? `${SITE_URL}/channel/${channel.channel_id}` : "";
  
  useSEO({
    title,
    description,
    keywords,
    canonical: pageUrl,
    ogType: "profile",
    ogImage: channel?.thumbnail_url
  });
  
  if (!channel) return null;
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": channel.title,
    "url": `https://youtube.com/channel/${channel.channel_id}`,
    "description": channel.description?.substring(0, 500) || `YouTube channel from ${channel.country_name}`,
    "image": channel.thumbnail_url,
    "sameAs": [
      `https://youtube.com/channel/${channel.channel_id}`
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": Math.min(5, Math.max(1, (channel.viral_score || 50) / 20)),
      "bestRating": 5,
      "worstRating": 1,
      "ratingCount": channel.subscriber_count || 1
    },
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/SubscribeAction",
        "userInteractionCount": channel.subscriber_count
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/WatchAction",
        "userInteractionCount": channel.view_count
      }
    ]
  };

  return <JsonLd data={schemaData} />;
};

export const LeaderboardSEO = ({ channels, totalChannels }) => {
  const currentYear = new Date().getFullYear();
  const title = `Top 100 Most Subscribed YouTube Channels (Live Leaderboard ${currentYear})`;
  const description = `Discover the most subscribed YouTube channels in the world. Live ranking of the top ${totalChannels || 100} YouTube creators based on subscriber count and popularity. Updated every 10 minutes.`;
  const pageUrl = `${SITE_URL}/leaderboard`;
  
  useSEO({
    title,
    description,
    keywords: `most subscribed youtube channels, top youtube channels, youtube subscriber leaderboard, youtube channel ranking, most subscribed youtubers ${currentYear}, youtube rankings ${currentYear}, top youtubers worldwide, mrbeast subscribers, t-series subscribers`,
    canonical: pageUrl
  });
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Most Subscribed YouTube Channels ${currentYear}`,
    "description": description,
    "url": pageUrl,
    "numberOfItems": channels?.length || totalChannels || 100,
    "itemListOrder": "https://schema.org/ItemListOrderDescending",
    "itemListElement": (channels || []).slice(0, 100).map((channel, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": channel.title || channel.name,
      "url": `https://youtube.com/channel/${channel.channel_id}`,
      "item": {
        "@type": "Organization",
        "name": channel.title || channel.name,
        "url": `https://youtube.com/channel/${channel.channel_id}`,
        "description": `YouTube channel with ${formatNumber(channel.subscriber_count)} subscribers`,
        "image": channel.thumbnail_url,
        "interactionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/SubscribeAction",
          "userInteractionCount": channel.subscriber_count
        }
      }
    }))
  };
  
  return <JsonLd data={schemaData} />;
};

export const CountriesListSEO = ({ totalCountries }) => {
  const currentYear = new Date().getFullYear();
  const title = `YouTube Rankings by Country ${currentYear} - Top YouTubers in ${totalCountries || 197} Countries`;
  const description = `Find top YouTubers in any country ${currentYear}. Browse YouTube channel rankings for ${totalCountries || 197} countries - India, USA, Brazil, Indonesia & more. Live subscriber counts.`;
  const pageUrl = `${SITE_URL}/countries`;
  
  useSEO({
    title,
    description,
    keywords: "YouTube by country, YouTubers by country, top channels by country, YouTube rankings countries, international YouTubers, YouTube statistics by country",
    canonical: pageUrl
  });
  
  return null;
};

export const TrendingSEO = () => {
  const currentYear = new Date().getFullYear();
  useSEO({
    title: `Fastest Growing YouTube Channels ${currentYear} - Trending YouTubers Right Now`,
    description: `See which YouTubers are exploding in ${currentYear}! Live tracking of the fastest growing YouTube channels right now. Daily subscriber gains, viral predictions & growth rates updated hourly.`,
    keywords: `fastest growing youtube channels ${currentYear}, fastest growing youtubers ${currentYear}, trending youtube channels ${currentYear}, fastest growing youtube channels right now ${currentYear}, viral youtube channels, rising youtubers ${currentYear}`,
    canonical: `${SITE_URL}/trending`
  });
  
  return null;
};

export const Top100SEO = ({ channels }) => {
  const year = new Date().getFullYear();
  const title = `Top 100 Most Subscribed YouTube Channels ${year} - Complete List`;
  const description = `Official ${year} ranking: #1 ${channels?.[0]?.title || 'MrBeast'} (${formatNumber(channels?.[0]?.subscriber_count || 0)}), #2 T-Series, #3 Cocomelon. Full list of 100 most subscribed YouTubers with live subscriber counts.`;
  
  useSEO({
    title,
    description,
    keywords: `top 100 youtube channels ${year}, most subscribed youtube channels ${year}, most subscribed youtubers ${year}, top 100 youtubers ${year}, biggest youtube channels, youtube rankings ${year}`,
    canonical: `${SITE_URL}/top-100`
  });
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Top 100 Most Subscribed YouTube Channels ${year}`,
    "description": description,
    "url": `${SITE_URL}/top-100`,
    "numberOfItems": 100,
    "itemListElement": channels?.slice(0, 100).map((channel, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "item": {
        "@type": "Organization",
        "name": channel.title,
        "url": `https://youtube.com/channel/${channel.channel_id}`,
        "description": `#${idx + 1} most subscribed YouTube channel with ${formatNumber(channel.subscriber_count)} subscribers`,
        "image": channel.thumbnail_url
      }
    })) || []
  };
  
  return <JsonLd data={schemaData} />;
};

export const Breadcrumb = ({ items }) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, idx) => {
      const isLastItem = idx === items.length - 1;
      const listItem = {
        "@type": "ListItem",
        "position": idx + 1,
        "name": item.label
      };
      if (!isLastItem && item.href) {
        listItem.item = `${SITE_URL}${item.href}`;
      } else if (!isLastItem) {
        listItem.item = SITE_URL;
      }
      return listItem;
    })
  };

  return (
    <>
      <JsonLd data={schemaData} />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-sm text-gray-400">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2">
              {idx > 0 && <ChevronRight className="w-3 h-3" />}
              {item.href ? (
                <Link 
                  to={item.href} 
                  className="hover:text-white transition-colors"
                  title={item.label}
                >
                  {idx === 0 && <Home className="w-4 h-4 inline mr-1" />}
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-300">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

const FAQSchema = ({ faqs }) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
  return <JsonLd data={schemaData} />;
};

export const FAQSection = ({ faqs, title = "Frequently Asked Questions" }) => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="bg-[#111] border border-[#222] rounded-lg p-6" data-testid="faq-section">
      <FAQSchema faqs={faqs} />
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-red-500" />
        {title}
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <div key={idx} className="border border-[#222] rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1a1a1a] transition-colors"
              aria-expanded={openIndex === idx}
            >
              <span className="font-medium text-white pr-4">{faq.question}</span>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`} />
            </button>
            {openIndex === idx && (
              <div className="px-4 pb-4 text-gray-400 text-sm leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
