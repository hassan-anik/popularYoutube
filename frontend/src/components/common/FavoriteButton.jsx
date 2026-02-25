import React from 'react';
import { Heart } from 'lucide-react';

export const FavoriteButton = ({ channel, isFavorite, onToggle, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle(channel);
      }}
      className={`p-2 rounded-full transition-all duration-300 ${
        isFavorite 
          ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' 
          : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
      }`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      data-testid="favorite-button"
    >
      <Heart className={`${sizeClasses[size]} ${isFavorite ? 'fill-current' : ''}`} />
    </button>
  );
};
