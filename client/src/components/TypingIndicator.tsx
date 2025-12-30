import React from 'react';
import { Loader2 } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-emerald-600 text-white">
        <Loader2 size={16} className="animate-spin" />
      </div>
      
      <div className="flex flex-col items-start">
        <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white border border-emerald-200 shadow-lg">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        
        <span className="text-xs text-gray-500 mt-1 px-1" dir="rtl">
          جاري الكتابة...
        </span>
      </div>
    </div>
  );
};
