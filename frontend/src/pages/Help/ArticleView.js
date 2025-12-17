// =====================================================
// ARTICLE VIEW PAGE
// Individual article view with content and feedback
// =====================================================

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, ThumbsDown, Share2, Clock, Eye, BookOpen } from 'lucide-react';
import { useArticleDetails, useSubmitArticleFeedback, useArticlesByCategory } from '../../features/help/hooks/use-help-search';
import ArticleCard from '../../components/Help/ArticleCard';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ArticleView = () => {
  const { articleId } = useParams();
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackHelpful, setFeedbackHelpful] = useState(null);

  const { data: articleData, isLoading, isError } = useArticleDetails(articleId);
  const submitFeedbackMutation = useSubmitArticleFeedback();

  const article = articleData?.data?.article;
  const relatedArticles = articleData?.data?.relatedArticles || [];

  const { data: categoryArticles } = useArticlesByCategory(article?.category, { page: 1, limit: 5 });

  const handleFeedback = (helpful) => {
    if (feedbackGiven) return;

    setFeedbackGiven(true);
    setFeedbackHelpful(helpful);

    submitFeedbackMutation.mutate({
      articleId,
      feedback: {
        helpful,
        comment: '',
      },
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        text: article?.snippet,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinner message="Loading article..." />
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-12 text-center">
            <h2 className="text-heading-lg text-slate-900 mb-2">Article Not Found</h2>
            <p className="text-body-md text-slate-600 mb-6">The article you're looking for doesn't exist.</p>
            <Link
              to="/help"
              className="inline-flex items-center px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Help Center
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/help"
          className="flex items-center text-body-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Help Center
        </Link>

        {/* Article Header */}
        <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {article.category && (
                <span className="inline-block px-3 py-1 text-body-xs font-medium bg-gold-100 text-gold-700 rounded-full mb-3">
                  {article.category}
                </span>
              )}
              <h1 className="text-heading-2xl text-slate-900 mb-4">{article.title}</h1>
              <div className="flex items-center gap-4 text-body-sm text-slate-500">
                {article.readTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{article.readTime} min read</span>
                  </div>
                )}
                {article.views !== undefined && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{article.views} views</span>
                  </div>
                )}
                {article.publishedDate && (
                  <span>
                    {new Date(article.publishedDate).toLocaleDateString('en-IN', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleShare}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              title="Share article"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Article Content */}
        <div className="bg-white rounded-xl shadow-elevation-1 border border-slate-200 p-8 mb-6">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content || article.body }}
          />

          {/* Feedback Section */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="text-heading-sm text-slate-900 mb-4">Was this article helpful?</h3>
            {!feedbackGiven ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleFeedback(true)}
                  className="flex items-center gap-2 px-4 py-2 text-body-sm text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Yes
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className="flex items-center gap-2 px-4 py-2 text-body-sm text-error-700 bg-error-50 border border-red-200 rounded-xl hover:bg-error-100"
                >
                  <ThumbsDown className="h-4 w-4" />
                  No
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-body-sm">
                {feedbackHelpful ? (
                  <span className="text-green-600 flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4" />
                    Thank you for your feedback!
                  </span>
                ) : (
                  <span className="text-error-600 flex items-center gap-2">
                    <ThumbsDown className="h-4 w-4" />
                    We'll work on improving this article.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Articles */}
        {(relatedArticles.length > 0 || (categoryArticles?.data?.articles?.length > 0)) && (
          <div className="mb-6">
            <h2 className="text-heading-xl text-slate-900 mb-6 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-gold-600" />
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedArticles.slice(0, 4).map((relatedArticle) => (
                <ArticleCard key={relatedArticle.id} article={relatedArticle} />
              ))}
              {categoryArticles?.data?.articles
                ?.filter((a) => a.id !== articleId)
                .slice(0, 4 - relatedArticles.length)
                .map((relatedArticle) => (
                  <ArticleCard key={relatedArticle.id} article={relatedArticle} />
                ))}
            </div>
          </div>
        )}

        {/* Still Need Help */}
        <div className="bg-gold-50 border border-gold-200 rounded-xl p-6">
          <h3 className="text-heading-md text-slate-900 mb-2">Still need help?</h3>
          <p className="text-body-sm text-slate-600 mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Link
            to="/help/contact"
            className="inline-flex items-center px-4 py-2 bg-gold-500 text-white rounded-xl hover:bg-gold-600 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ArticleView;

