import React from 'react';
import { BookOpen, Tag, ExternalLink } from 'lucide-react';

interface Reference {
  id: number;
  title: string;
  category: string;
  source?: string;
  tags?: string;
  relevanceScore?: number;
}

interface ReferencesDisplayProps {
  references: Reference[];
}

export const ReferencesDisplay: React.FC<ReferencesDisplayProps> = ({ references }) => {
  if (!references || references.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-emerald-100">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={16} className="text-emerald-600" />
        <span className="text-sm font-semibold text-emerald-700">
          المراجع المستخدمة ({references.length})
        </span>
      </div>
      
      <div className="space-y-2">
        {references.map((ref) => (
          <div
            key={ref.id}
            className="bg-emerald-50 rounded-lg p-3 hover:bg-emerald-100 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-800 mb-1">
                  {ref.title}
                </h4>
                
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  {ref.category && (
                    <span className="bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                      {ref.category}
                    </span>
                  )}
                  
                  {ref.source && (
                    <span className="flex items-center gap-1">
                      <ExternalLink size={12} />
                      {ref.source}
                    </span>
                  )}
                  
                  {ref.relevanceScore && ref.relevanceScore > 0 && (
                    <span className="text-emerald-700 font-medium">
                      الصلة: {Math.round(ref.relevanceScore * 10) / 10}
                    </span>
                  )}
                </div>
                
                {ref.tags && (
                  <div className="flex items-center gap-1 mt-1">
                    <Tag size={12} className="text-gray-500" />
                    <span className="text-xs text-gray-500">
                      {ref.tags.split(',').slice(0, 3).join(' • ')}
                    </span>
                  </div>
                )}
              </div>
              
              <a
                href={`/knowledge/${ref.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-800 transition-colors"
                title="عرض التفاصيل"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
