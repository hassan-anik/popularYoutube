import React, { useState } from 'react';
import { Code, Copy, Check } from 'lucide-react';

export const EmbedWidget = ({ type, data }) => {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  
  const generateEmbedCode = () => {
    const baseUrl = process.env.REACT_APP_BACKEND_URL || 'https://toptubeworldpro.com';
    
    if (type === 'channel') {
      return `<iframe src="${baseUrl}/embed/channel/${data.channel_id}" width="300" height="200" frameborder="0" style="border-radius: 8px; overflow: hidden;"></iframe>`;
    }
    if (type === 'country') {
      return `<iframe src="${baseUrl}/embed/country/${data.code}" width="400" height="300" frameborder="0" style="border-radius: 8px; overflow: hidden;"></iframe>`;
    }
    return '';
  };
  
  const embedCode = generateEmbedCode();
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="mt-4">
      <button
        onClick={() => setShowCode(!showCode)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <Code className="w-4 h-4" />
        {showCode ? 'Hide' : 'Show'} Embed Code
      </button>
      
      {showCode && (
        <div className="mt-3 bg-[#0a0a0a] rounded-lg p-4 border border-[#222]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-gray-500">HTML Embed Code</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre-wrap break-all">
            {embedCode}
          </pre>
        </div>
      )}
    </div>
  );
};
