import React from 'react';
import { Twitter, Facebook, Linkedin, Mail, Share2 } from 'lucide-react';

export const SocialShareButtons = ({ url, title, description }) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || '');
  
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
  };
  
  const handleShare = (platform) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400 mr-2">Share:</span>
      
      {navigator.share && (
        <button
          onClick={handleNativeShare}
          className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222] transition-colors"
          title="Share"
        >
          <Share2 className="w-4 h-4 text-gray-400" />
        </button>
      )}
      
      <button
        onClick={() => handleShare('twitter')}
        className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#1da1f2]/20 transition-colors"
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4 text-[#1da1f2]" />
      </button>
      
      <button
        onClick={() => handleShare('facebook')}
        className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#4267B2]/20 transition-colors"
        title="Share on Facebook"
      >
        <Facebook className="w-4 h-4 text-[#4267B2]" />
      </button>
      
      <button
        onClick={() => handleShare('linkedin')}
        className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#0A66C2]/20 transition-colors"
        title="Share on LinkedIn"
      >
        <Linkedin className="w-4 h-4 text-[#0A66C2]" />
      </button>
      
      <button
        onClick={() => handleShare('email')}
        className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-gray-500/20 transition-colors"
        title="Share via Email"
      >
        <Mail className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
};
