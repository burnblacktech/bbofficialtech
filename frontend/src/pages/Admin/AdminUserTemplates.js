// =====================================================
// ADMIN USER TEMPLATES PAGE
// Manages user templates with DesignSystem components
// =====================================================

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Typography, Button } from '../../components/DesignSystem/DesignSystem';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/DesignSystem/Animations';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  Eye,
  X,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { adminUsersService } from '../../features/admin/users/services/users.service';
import toast from 'react-hot-toast';

const AdminUserTemplates = () => {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    config: {
      role: 'END_USER',
      status: 'active',
      metadata: {},
    },
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await adminUsersService.getUserTemplates();
      setTemplates(data.data?.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    setProcessing(true);
    try {
      await adminUsersService.createUserTemplate(formData);
      toast.success('Template created successfully');
      setShowCreateModal(false);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Failed to create template:', error);
      toast.error(error.response?.data?.error || 'Failed to create template');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (templateId) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setProcessing(templateId);
    try {
      await adminUsersService.deleteUserTemplate(templateId);
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    } finally {
      setProcessing(null);
    }
  };

  const handleApply = async (templateId) => {
    // eslint-disable-next-line no-alert
    const userId = window.prompt('Enter user ID to apply template:');
    if (!userId) return;

    setProcessing(templateId);
    try {
      await adminUsersService.applyUserTemplate(templateId, userId);
      toast.success('Template applied successfully');
    } catch (error) {
      console.error('Failed to apply template:', error);
      toast.error(error.response?.data?.error || 'Failed to apply template');
    } finally {
      setProcessing(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      config: {
        role: 'END_USER',
        status: 'active',
        metadata: {},
      },
    });
    setSelectedTemplate(null);
  };

  const filteredTemplates = templates.filter((template) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        template.name?.toLowerCase().includes(searchLower) ||
        template.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Typography.H1 className="mb-2">User Templates</Typography.H1>
            <Typography.Body className="text-neutral-600">
              Create and manage user configuration templates for quick user setup
            </Typography.Body>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <Button variant="outline" onClick={loadTemplates}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Templates List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-neutral-400" />
                </div>
                <Typography.H3 className="mb-2">No templates found</Typography.H3>
                <Typography.Body className="text-neutral-600">
                  Create your first user template to get started.
                </Typography.Body>
              </div>
            ) : (
              <StaggerContainer className="divide-y divide-neutral-200">
                {filteredTemplates.map((template) => (
                  <StaggerItem key={template.id} className="p-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <Typography.Body className="font-medium">{template.name}</Typography.Body>
                        </div>
                        {template.description && (
                          <Typography.Small className="text-neutral-500 block mb-2">
                            {template.description}
                          </Typography.Small>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {template.config?.role && (
                            <span className="px-2 py-1 bg-info-100 text-info-700 text-xs rounded">
                              Role: {template.config.role}
                            </span>
                          )}
                          {template.config?.status && (
                            <span className="px-2 py-1 bg-success-100 text-success-700 text-xs rounded">
                              Status: {template.config.status}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowViewModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApply(template.id)}
                          disabled={processing === template.id}
                          className="text-success-600 border-success-300 hover:bg-success-50"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Apply
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          disabled={processing === template.id}
                          className="text-error-600 hover:bg-error-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Create Template</CardTitle>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Template Name <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Standard CA User"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe the template..."
                  />
                </div>
                <div className="border-t border-neutral-200 pt-4">
                  <Typography.Small className="font-medium text-neutral-700 mb-3 block">Configuration</Typography.Small>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Role</label>
                      <select
                        value={formData.config.role}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            config: { ...formData.config, role: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="END_USER">End User</option>
                        <option value="CA">CA</option>
                        <option value="CA_FIRM_ADMIN">CA Firm Admin</option>
                        <option value="PLATFORM_ADMIN">Platform Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
                      <select
                        value={formData.config.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            config: { ...formData.config, status: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!formData.name.trim() || processing}
                  >
                    {processing ? 'Creating...' : 'Create Template'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Template: {selectedTemplate.name}</CardTitle>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedTemplate(null);
                  }}
                  className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedTemplate.description && (
                    <div>
                      <Typography.Small className="font-medium text-neutral-700 mb-1 block">Description</Typography.Small>
                      <Typography.Body>{selectedTemplate.description}</Typography.Body>
                    </div>
                  )}
                  <div>
                    <Typography.Small className="font-medium text-neutral-700 mb-2 block">Configuration</Typography.Small>
                    <pre className="bg-neutral-50 p-4 rounded-lg text-sm overflow-x-auto">
                      {JSON.stringify(selectedTemplate.config || {}, null, 2)}
                    </pre>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowViewModal(false);
                        setSelectedTemplate(null);
                      }}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => handleApply(selectedTemplate.id)}
                      disabled={processing === selectedTemplate.id}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Apply Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminUserTemplates;

