// =====================================================
// ADMIN KNOWLEDGE BASE PAGE
// Knowledge management with DesignSystem components
// =====================================================

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Typography, Button } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import Badge from '../../components/DesignSystem/components/Badge';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminKnowledgeBase = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAddArticle, setShowAddArticle] = useState(false);

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'filing', name: 'Filing Process' },
    { id: 'tips', name: 'Tips & Tricks' },
    { id: 'technical', name: 'Technical Support' },
    { id: 'billing', name: 'Billing & Payments' },
  ];

  // Fetch articles from API
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const params = {
          ...(categoryFilter !== 'all' && { category: categoryFilter }),
          ...(searchTerm && { q: searchTerm }),
        };

        const response = await api.get('/api/help/articles', { params });
        const articlesData = response.data?.data?.articles || response.data?.articles || [];

        // Transform API response to match component expectations
        const transformedArticles = articlesData.map(article => ({
          id: article.id,
          title: article.title,
          content: article.content || article.snippet,
          category: article.category,
          tags: article.tags || [],
          status: article.status || 'published',
          views: article.views || 0,
          helpful: article.helpful || article.helpfulCount || 0,
          createdBy: article.createdBy || article.author || 'Admin User',
          createdAt: article.createdAt || article.publishedDate,
          updatedAt: article.updatedAt || article.updatedAt || article.createdAt,
        }));

        setArticles(transformedArticles);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
        toast.error('Failed to load articles. Please try again.');
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [categoryFilter, searchTerm]);

  const filteredArticles = articles.filter((article) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!article.title.toLowerCase().includes(searchLower) &&
          !article.content.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    if (categoryFilter !== 'all' && article.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    if (status === 'published') {
      return <Badge variant="success">Published</Badge>;
    } else if (status === 'draft') {
      return <Badge variant="warning">Draft</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Typography.H1 className="mb-2">Knowledge Base</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Manage articles and documentation
            </Typography.Body>
          </div>
          <Button onClick={() => setShowAddArticle(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Article
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="updatedAt-desc">Recently Updated</option>
                <option value="createdAt-desc">Recently Created</option>
                <option value="views-desc">Most Viewed</option>
                <option value="helpful-desc">Most Helpful</option>
                <option value="title-asc">Title A-Z</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-neutral-400" />
              </div>
              <Typography.H3 className="mb-2">No articles found</Typography.H3>
              <Typography.Body className="text-neutral-600 mb-6">
                Get started by creating your first knowledge base article.
              </Typography.Body>
              <Button onClick={() => setShowAddArticle(true)}>
                Create Article
              </Button>
            </CardContent>
          </Card>
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <StaggerItem key={article.id}>
                <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <Typography.H3 className="line-clamp-2 mb-2">
                          {article.title}
                        </Typography.H3>
                        <Typography.Body className="text-neutral-600 line-clamp-3 mb-4">
                          {article.content}
                        </Typography.Body>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      {getStatusBadge(article.status)}
                      <Typography.Small className="text-neutral-500 capitalize">
                        {article.category}
                      </Typography.Small>
                    </div>

                    <div className="flex items-center justify-between text-sm text-neutral-500 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {article.views}
                        </div>
                        <div className="flex items-center">
                          <HelpCircle className="w-4 h-4 mr-1" />
                          {article.helpful}
                        </div>
                      </div>
                      <Typography.Small className="text-neutral-400">
                        {new Date(article.updatedAt).toLocaleDateString()}
                      </Typography.Small>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-200">
                      <div className="flex flex-wrap gap-1">
                        {article.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="inline-flex px-2 py-1 text-xs bg-neutral-100 text-neutral-600 rounded">
                            {tag}
                          </span>
                        ))}
                        {article.tags.length > 2 && (
                          <Typography.Small className="text-neutral-500">+{article.tags.length - 2}</Typography.Small>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-error-600 hover:text-error-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminKnowledgeBase;
