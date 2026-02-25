import { useState, useCallback } from 'react';
import { FAVORITES_KEY } from '../utils/constants';

const getFavorites = () => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const saveFavorites = (favorites) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState(getFavorites);

  const addFavorite = useCallback((channel) => {
    setFavorites(prev => {
      if (prev.find(f => f.channel_id === channel.channel_id)) return prev;
      const updated = [...prev, channel];
      saveFavorites(updated);
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((channelId) => {
    setFavorites(prev => {
      const updated = prev.filter(f => f.channel_id !== channelId);
      saveFavorites(updated);
      return updated;
    });
  }, []);

  const isFavorite = useCallback((channelId) => {
    return favorites.some(f => f.channel_id === channelId);
  }, [favorites]);

  const toggleFavorite = useCallback((channel) => {
    if (isFavorite(channel.channel_id)) {
      removeFavorite(channel.channel_id);
    } else {
      addFavorite(channel);
    }
  }, [isFavorite, removeFavorite, addFavorite]);

  return { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite };
};
