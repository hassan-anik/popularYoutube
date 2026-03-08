import React, { lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronRight } from 'lucide-react';
import { API } from '../utils/constants';
import { formatNumber } from '../utils/format';
import { CountriesListSEO } from '../components/seo';

// Countries List Page
const CountriesPage = () => {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API}/countries`);
        setCountries(response.data || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-8" data-testid="countries-page">
      <CountriesListSEO totalCountries={countries.length} />
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">YouTube Rankings by Country</h1>
          <p className="text-gray-400 max-w-3xl">
            Explore the most subscribed YouTube channels across {countries.length} countries worldwide. 
            Each country page features detailed rankings, growth statistics, and insights into local YouTube markets.
          </p>
        </div>

        {/* Editorial Introduction */}
        <div className="bg-[#111] border border-[#222] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-3">Global YouTube Coverage</h2>
          <div className="text-gray-300 text-sm space-y-3">
            <p>
              YouTube's reach spans every corner of the globe, with content creators building audiences in virtually every country. 
              Our country-by-country rankings provide insights into regional content preferences, top creators, and market dynamics.
            </p>
            <p>
              Each country profile includes subscriber counts sourced from the YouTube Data API, along with our calculated growth 
              metrics and trending indicators. Whether you're researching markets for content strategy, looking for regional 
              influencers, or simply curious about YouTube's global landscape, these rankings offer valuable insights.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#222]">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{countries.length}</div>
                <div className="text-xs text-gray-500">Countries Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{countries.reduce((sum, c) => sum + (c.channel_count || 0), 0).toLocaleString()}</div>
                <div className="text-xs text-gray-500">Total Channels</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Daily</div>
                <div className="text-xs text-gray-500">Data Updates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Free</div>
                <div className="text-xs text-gray-500">Access</div>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-white mb-4">Browse All Countries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {countries.map(country => (
            <div
              key={country.code}
              className="bg-[#111] border border-[#222] rounded-lg p-5 hover:border-[#333] cursor-pointer transition-colors"
              onClick={() => navigate(`/country/${country.code}`)}
              data-testid={`country-card-${country.code}`}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{country.flag_emoji}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg">{country.name}</h3>
                  <p className="text-gray-500 text-sm">{country.channel_count} channels</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </div>
              {country.top_channel && (
                <div className="mt-4 pt-4 border-t border-[#222]">
                  <p className="text-xs text-gray-500 mb-2">Top Channel</p>
                  <div className="flex items-center gap-2">
                    <img src={country.top_channel.thumbnail_url || "https://via.placeholder.com/32"} alt="" loading="lazy" className="w-8 h-8 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{country.top_channel.title}</div>
                      <div className="text-xs text-gray-500">{formatNumber(country.top_channel.subscriber_count)} subs</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};



export { CountriesPage };
