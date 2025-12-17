// =====================================================
// ARTICLE CARD COMPONENT
// Reusable card component for displaying help articles
// =====================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, Eye, ThumbsUp } from 'lucide-react';

const ArticleCard = ({ article, showCategory = true, showStats = true }) => {
  const {
    id,
    title,
    snippet,
    category,
    readTime,
    views,
    helpfulCount,
    url,
    publishedDate,
  } = article;

  const articleUrl = url || `/help/articles/${id}`;

  return (
    <Link
      to={articleUrl}
      className="block bg-white rounded-xl border border-slate-200 p-6 hover:shadow-elevation-2 transition-shadow hover:border-gold-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {showCategory && category && (
            <span className="inline-block px-2 py-1 text-body-xs font-medium bg-gold-100 text-gold-700 rounded mb-2">
              {category}
            </span>
          )}
          <h3 className="text-heading-sm font-semibold text-slate-900 mb-2 line-clamp-2">{title}</h3>
          {snippet && (
            <p className="text-body-sm text-slate-600 line-clamp-2 mb-3">{snippet}</p>
          )}
        </div>
        <FileText className="h-6 w-6 text-slate-400 ml-4 flex-shrink-0" />
      </div>

      {showStats && (
        <div className="flex items-center gap-4 text-body-xs text-slate-500">
          {readTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{readTime} min read</span>
            </div>
          )}
          {views !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{views} views</span>
            </div>
          )}
          {helpfulCount !== undefined && (
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              <span>{helpfulCount} helpful</span>
            </div>
          )}
          {publishedDate && (
            <div className="ml-auto">
              {new Date(publishedDate).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          )}
        </div>
      )}
    </Link>
  );
};

export default ArticleCard;

