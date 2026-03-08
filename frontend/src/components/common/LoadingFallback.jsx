import React, { memo } from 'react';

export const LoadingFallback = memo(() => (
  <div className="flex items-center justify-center p-8">
    <div className="w-8 h-8 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
  </div>
));

export const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);
