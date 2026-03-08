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
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">YouTube Rankings by Country</h1>
          <p className="text-[var(--text-muted)] max-w-3xl">
            Explore the most subscribed YouTube channels across {countries.length} countries worldwide. 
            Each country page features detailed rankings, growth statistics, and insights into local YouTube markets.
          </p>
        </div>

        {/* Editorial Introduction */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">Global YouTube Coverage</h2>
          <div className="text-[var(--text-secondary)] text-sm space-y-3">
            <p>
              YouTube's reach spans every corner of the globe, with content creators building audiences in virtually every country. 
              Our country-by-country rankings provide insights into regional content preferences, top creators, and market dynamics.
            </p>
            <p>
              Each country profile includes subscriber counts sourced from the YouTube Data API, along with our calculated growth 
              metrics and trending indicators. Whether you're researching markets for content strategy, looking for regional 
              influencers, or simply curious about YouTube's global landscape, these rankings offer valuable insights.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[var(--border)]">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{countries.length}</div>
                <div className="text-xs text-[var(--text-dim)]">Countries Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{countries.reduce((sum, c) => sum + (c.channel_count || 0), 0).toLocaleString()}</div>
                <div className="text-xs text-[var(--text-dim)]">Total Channels</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)]">Daily</div>
                <div className="text-xs text-[var(--text-dim)]">Data Updates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)]">Free</div>
                <div className="text-xs text-[var(--text-dim)]">Access</div>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Browse All Countries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {countries.map(country => (
            <div
              key={country.code}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5 hover:border-[var(--border-hover)] cursor-pointer transition-colors"
              onClick={() => navigate(`/country/${country.code}`)}
              data-testid={`country-card-${country.code}`}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{country.flag_emoji}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--text-primary)] text-lg">{country.name}</h3>
                  <p className="text-[var(--text-dim)] text-sm">{country.channel_count} channels</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--text-dim)]" />
              </div>
              {country.top_channel && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-dim)] mb-2">Top Channel</p>
                  <div className="flex items-center gap-2">
                    <img src={country.top_channel.thumbnail_url || "https://via.placeholder.com/32"} alt="" loading="lazy" className="w-8 h-8 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[var(--text-primary)] truncate">{country.top_channel.title}</div>
                      <div className="text-xs text-[var(--text-dim)]">{formatNumber(country.top_channel.subscriber_count)} subs</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Comprehensive Countries Guide */}
        <section className="mt-12 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Understanding YouTube's Global Landscape: A Complete Guide</h2>
          
          <article className="space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">YouTube's Geographic Distribution of Creators</h3>
              <p className="mb-4">
                YouTube has evolved from a primarily American platform into a truly global phenomenon, with creators and audiences spanning every inhabited continent. The geographic distribution of successful YouTube channels tells a fascinating story about internet adoption, cultural content preferences, economic opportunity, and the universal appeal of video entertainment. Understanding this distribution helps creators identify market opportunities and helps viewers discover content from around the world.
              </p>
              <p className="mb-4">
                Our platform tracks YouTube channels from {countries.length} countries, providing a comprehensive view of the global creator ecosystem. While certain countries dominate the top of the leaderboard due to population size or early platform adoption, every region contributes unique voices and content styles to the YouTube community. The platform's algorithm doesn't discriminate by geography—compelling content can find audiences regardless of where it originates.
              </p>
              <p>
                The diversity of countries represented in YouTube's top channels reflects the platform's remarkable achievement in democratizing content distribution. A creator in Indonesia can reach viewers in Brazil. A music video from South Korea can top charts worldwide. This geographic fluidity has transformed entertainment from a localized industry into a global marketplace of attention and ideas.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Major YouTube Markets and Their Characteristics</h3>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">India: The Growth Engine</strong><br/>
                India represents YouTube's largest and most dynamic market, with more active users than any other country. The combination of a massive population (1.4 billion), widespread smartphone adoption, and affordable mobile data has created an enormous audience hungry for video content. Indian channels dominate multiple categories: T-Series leads in music, SET India and Sony SAB lead in entertainment, and numerous regional language channels serve India's diverse linguistic communities.
              </p>
              <p className="mb-4">
                The Indian YouTube ecosystem is unique in its linguistic diversity. While Hindi content has the broadest reach, successful channels operate in Tamil, Telugu, Bengali, Marathi, and dozens of other languages. This fragmentation creates opportunities for creators serving specific language communities while also enabling crossover hits that transcend linguistic boundaries. Bollywood music, in particular, attracts viewers regardless of language proficiency due to its visual and emotional appeal.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">United States: The Pioneer Market</strong><br/>
                As YouTube's country of origin, the United States maintains significant influence over platform culture and trends. American creators benefit from early adoption advantages, established creator networks, and access to capital for high-production content. The U.S. advertising market also offers higher CPM rates than most countries, making American channels more economically sustainable even with smaller audiences.
              </p>
              <p className="mb-4">
                American content tends to set trends that later spread globally. Format innovations, editing styles, and content categories often emerge from U.S. creators before being adapted by international counterparts. The English language also provides American creators with natural access to audiences in the UK, Canada, Australia, and English-speaking communities worldwide.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">South Korea: The Cultural Powerhouse</strong><br/>
                South Korea's outsized influence on YouTube reflects the broader success of Korean entertainment exports. K-pop groups like BTS (BANGTANTV) and BLACKPINK have built global fanbases that rival anything in Western entertainment. Korean content succeeds through exceptional production quality, strategic fan engagement, and organized international fan communities that drive coordinated viewing campaigns.
              </p>
              <p className="mb-4">
                The Korean entertainment industry's approach to YouTube is notably sophisticated. Labels like HYBE treat YouTube as a primary distribution and marketing channel rather than a secondary platform. Music video premieres on YouTube become global events, with fans organizing viewing parties across time zones. This level of strategic coordination has made Korean channels remarkably effective at converting casual viewers into dedicated subscribers.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Brazil: Latin America's Leader</strong><br/>
                Brazil leads the Latin American YouTube market, with Portuguese-language channels serving both Brazil's 215 million population and Portuguese-speaking communities in Portugal, Angola, Mozambique, and elsewhere. Brazilian channels span diverse categories, from music (Canal KondZilla pioneered funk music videos) to comedy, gaming, and education.
              </p>
              <p>
                The Brazilian creator ecosystem demonstrates how local content can achieve global relevance. While primarily serving Portuguese-speaking audiences, Brazilian music and entertainment often transcend language barriers through visual appeal and universal themes. The country's vibrant internet culture has produced distinctive content styles that influence creators throughout Latin America.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Emerging YouTube Markets</h3>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Southeast Asia: The Fastest Growing Region</strong><br/>
                Southeast Asian countries including Indonesia, Philippines, Thailand, Vietnam, and Malaysia represent YouTube's fastest-growing markets. These countries combine large populations, young demographics, high mobile internet usage, and enthusiastic adoption of digital entertainment. Indonesian channel Topper Guild's rapid rise in global rankings illustrates the region's growing influence.
              </p>
              <p className="mb-4">
                The Southeast Asian market benefits from favorable demographic trends. Young populations with high smartphone penetration create natural audiences for YouTube content. Local creators are increasingly sophisticated in their production quality and business strategies, competing effectively with international content. The region's economic growth also attracts advertising investment, improving monetization opportunities for local creators.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Middle East and North Africa</strong><br/>
                Arabic-speaking markets present significant opportunities for YouTube creators. Countries like Saudi Arabia, UAE, Egypt, and Morocco have substantial YouTube audiences, though the market remains less saturated than more established regions. Arabic content creators can reach audiences across 22 countries sharing the language, creating scale advantages similar to Spanish or Portuguese-language content.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Sub-Saharan Africa</strong><br/>
                Africa represents YouTube's next frontier. As internet access expands across the continent, African creators are building audiences in languages from Swahili to Yoruba to Amharic. Nigerian creators have achieved particular success, leveraging the country's large English-speaking population and vibrant entertainment industry. The continent's young, growing population suggests enormous future potential for YouTube adoption.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Content Preferences by Region</h3>
              <p className="mb-4">
                YouTube content preferences vary significantly by region, reflecting cultural values, entertainment traditions, and language considerations. Understanding these preferences helps creators target specific markets and helps viewers discover content aligned with their interests.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Music:</strong> Music content performs well globally, but preferences vary dramatically. Indian audiences favor Bollywood soundtracks and regional film music. Latin American markets embrace reggaeton, bachata, and regional Mexican music. K-pop has achieved remarkable global penetration despite the language barrier, demonstrating that production quality and visual appeal can transcend linguistic limitations.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Entertainment:</strong> Comedy and entertainment content is highly culturally specific. Humor that works in one market often fails in others due to different cultural references, comedic traditions, and social norms. However, physical comedy and reaction-based content can cross cultural boundaries more easily. Channels like MrBeast succeed globally partly because their content emphasizes visual spectacle over culturally-specific humor.
              </p>
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">Children's Content:</strong> Children's content is remarkably universal. Nursery rhymes, simple narratives, and colorful animations appeal to young viewers regardless of their country of origin. This explains why channels like Cocomelon, Vlad and Niki, and Like Nastya have built truly global audiences—children's developmental stages are universal even when cultural contexts differ.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Gaming:</strong> Gaming content benefits from the global nature of the gaming industry. Popular games are played worldwide, creating shared references that unite international audiences. Esports, walkthroughs, and Let's Play content can attract viewers regardless of the creator's nationality, though commentary language still matters for channels focused on personality over pure gameplay.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Economic Factors in YouTube Success</h3>
              <p className="mb-4">
                A country's economic profile significantly influences its YouTube ecosystem. Advertising rates vary dramatically by geography—CPM rates in the United States, UK, and Australia typically exceed those in developing markets by factors of 5-10x or more. This disparity affects which content strategies are viable in different markets and influences creator migration decisions.
              </p>
              <p className="mb-4">
                Creators in high-CPM countries can sustain themselves with smaller audiences, allowing for niche content strategies that would be economically unviable in lower-CPM markets. Conversely, creators in developing markets often need massive scale to generate meaningful advertising revenue, pushing them toward broadly popular content categories rather than specialized niches.
              </p>
              <p className="mb-4">
                Alternative monetization strategies help creators in lower-CPM markets overcome advertising limitations. Brand sponsorships, merchandise sales, and fan funding through platforms like Patreon or YouTube Memberships can supplement advertising revenue. Some creators specifically target diaspora audiences in wealthy countries, allowing them to combine high-CPM viewers with culturally specific content.
              </p>
              <p>
                Infrastructure also matters. Reliable high-speed internet enables consistent upload schedules and higher production quality. Access to production equipment, editing software, and professional services varies by country. Countries with established media industries (like India, South Korea, and the United States) provide ecosystems that support creator success beyond just audience availability.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">How We Compile Country Rankings</h3>
              <p className="mb-4">
                Our country-by-country rankings use official data from the YouTube Data API combined with our proprietary tracking and analysis systems. Each channel is assigned to a country based on its primary geographic association—typically the country where the creator is based or the primary market the channel serves. For multinational organizations or ambiguous cases, we use the country most closely associated with the channel's content and audience.
              </p>
              <p className="mb-4">
                Within each country page, channels are ranked by subscriber count, with additional metrics including daily subscriber gains, growth percentages, and viral status indicators. We also provide aggregate statistics for each country, including total tracked channels, combined subscriber counts, and trending analysis. This data helps users understand not just which individual channels lead each market, but also the overall size and dynamism of each country's YouTube ecosystem.
              </p>
              <p>
                Our coverage is comprehensive but not exhaustive. We prioritize tracking channels that have achieved significant scale or demonstrate rapid growth. Users can request additions through our channel request feature. Our goal is to provide the most complete picture of YouTube's global landscape while maintaining data quality and relevance.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Using Country Data for Research and Strategy</h3>
              <p className="mb-4">
                Our country rankings serve diverse use cases. Content creators can research potential markets, identifying countries with engaged audiences but limited competition in specific categories. Marketers and brands can identify influential creators in target markets for partnership opportunities. Researchers can study patterns in global content creation and consumption.
              </p>
              <p className="mb-4">
                For creators considering international expansion, our country data reveals which markets have audiences receptive to specific content types. A gaming creator might discover strong engagement in Brazil despite creating English content. A music channel might identify unexploited opportunities in Southeast Asia. The data enables informed decisions about subtitling investments, upload timing, and content localization.
              </p>
              <p className="mb-4">
                Brands seeking influencer partnerships can use country rankings to identify potential partners in specific markets. Rather than relying on generic global celebrity partnerships, brands can find locally relevant creators with authentic connections to target audiences. Our growth metrics help identify rising stars who offer partnership value before their rates increase with fame.
              </p>
              <p>
                Academic researchers studying digital media, platform economics, or cultural globalization can use our data as a resource for understanding how content crosses borders. The patterns in our country rankings reflect broader trends in cultural exchange, technology adoption, and economic development that extend far beyond YouTube itself.
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-dim)]">
                <em>Country data is sourced from the YouTube Data API and updated regularly. Channel-country associations reflect primary geographic affiliations. For methodology details, visit our dedicated Methodology page. To request additional countries or channels for tracking, use our Channel Request feature.</em>
              </p>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};



export { CountriesPage };
