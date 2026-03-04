import React, { memo, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";
import { geoUrl } from '../utils/constants';

const LazyWorldMap = memo(({ mapData, onCountryClick }) => {
  // Create lookup maps by both country_code and country_name
  const countryDataMap = useMemo(() => {
    const map = {};
    mapData?.forEach(item => {
      map[item.country_code] = item;
    });
    return map;
  }, [mapData]);
  
  const countryNameMap = useMemo(() => {
    const map = {};
    mapData?.forEach(item => {
      const normalizedName = item.country_name?.toLowerCase().trim();
      map[normalizedName] = item;
    });
    return map;
  }, [mapData]);

  // Map of common name variations
  const nameVariations = useMemo(() => ({
    'united states of america': 'US',
    'united states': 'US',
    'usa': 'US',
    'united kingdom': 'GB',
    'uk': 'GB',
    'russia': 'RU',
    'russian federation': 'RU',
    'south korea': 'KR',
    'korea, republic of': 'KR',
    'republic of korea': 'KR',
    'north korea': 'KP',
    'vietnam': 'VN',
    'viet nam': 'VN',
    'czech republic': 'CZ',
    'czechia': 'CZ',
    'ivory coast': 'CI',
    "cote d'ivoire": 'CI',
    'democratic republic of the congo': 'CD',
    'dem. rep. congo': 'CD',
    'republic of the congo': 'CG',
    'congo': 'CG',
    'tanzania': 'TZ',
    'united republic of tanzania': 'TZ',
    'iran': 'IR',
    'islamic republic of iran': 'IR',
    'syria': 'SY',
    'syrian arab republic': 'SY',
    'venezuela': 'VE',
    'bolivia': 'BO',
    'laos': 'LA',
    'brunei': 'BN',
    'taiwan': 'TW',
    'palestine': 'PS',
    'myanmar': 'MM',
    'burma': 'MM',
  }), []);

  const getCountryData = (geo) => {
    const isoA2 = geo.properties?.ISO_A2;
    if (isoA2 && countryDataMap[isoA2]) {
      return { code: isoA2, data: countryDataMap[isoA2] };
    }
    
    const geoName = geo.properties?.name?.toLowerCase().trim();
    if (geoName) {
      if (countryNameMap[geoName]) {
        return { code: countryNameMap[geoName].country_code, data: countryNameMap[geoName] };
      }
      
      const mappedCode = nameVariations[geoName];
      if (mappedCode && countryDataMap[mappedCode]) {
        return { code: mappedCode, data: countryDataMap[mappedCode] };
      }
      
      for (const [normalizedName, item] of Object.entries(countryNameMap)) {
        if (normalizedName.includes(geoName) || geoName.includes(normalizedName)) {
          return { code: item.country_code, data: item };
        }
      }
    }
    
    return null;
  };

  return (
    <div className="bg-[#111] dark:bg-[#111] rounded-lg border border-[#222] overflow-hidden" data-testid="world-map">
      <ComposableMap projectionConfig={{ scale: 140 }} style={{ width: "100%", height: "350px" }}>
        <ZoomableGroup center={[0, 20]} zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryInfo = getCountryData(geo);
                const hasData = !!countryInfo;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => hasData && onCountryClick(countryInfo.code)}
                    style={{
                      default: {
                        fill: hasData ? "#1e40af" : "#e5e5e5",
                        stroke: "#999",
                        strokeWidth: 0.5,
                        outline: "none",
                        cursor: hasData ? "pointer" : "default"
                      },
                      hover: {
                        fill: hasData ? "#2563eb" : "#d4d4d4",
                        stroke: "#666",
                        strokeWidth: 0.5,
                        outline: "none"
                      },
                      pressed: { outline: "none" }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
});

export default LazyWorldMap;
