// =====================================================
// ADMIN SETTINGS - SYSTEM CONFIGURATION
// Placeholder page for system settings (to be expanded in Phase 2)
// =====================================================

import { Card, CardHeader, CardTitle, CardContent, Typography } from '../../components/DesignSystem/DesignSystem';
import { PageTransition } from '../../components/DesignSystem/Animations';
import { Settings, AlertCircle } from 'lucide-react';

const AdminSettings = () => {
  return (
    <PageTransition className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Typography.H1 className="mb-2">System Settings</Typography.H1>
          <Typography.Body className="text-neutral-600">
            Configure platform settings and preferences
          </Typography.Body>
        </div>

        {/* Coming Soon Card */}
        <Card className="border-warning-200 bg-warning-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-warning-600" />
              <span>Settings Under Development</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Typography.Body className="text-neutral-700">
                System settings configuration is currently under development.
                This page will include:
              </Typography.Body>
              <ul className="list-disc list-inside space-y-2 text-neutral-600">
                <li>General application settings</li>
                <li>Tax configuration</li>
                <li>Integration settings</li>
                <li>Notification settings</li>
                <li>Security settings</li>
                <li>Feature flags</li>
              </ul>
              <Typography.Small className="text-neutral-500">
                Expected completion: Phase 2
              </Typography.Small>
            </div>
          </CardContent>
        </Card>

        {/* Settings Categories Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[
            { name: 'General Settings', icon: Settings },
            { name: 'Tax Configuration', icon: Settings },
            { name: 'Integrations', icon: Settings },
            { name: 'Notifications', icon: Settings },
            { name: 'Security', icon: Settings },
            { name: 'Feature Flags', icon: Settings },
          ].map((category, index) => (
            <Card key={index} className="opacity-50 cursor-not-allowed">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <category.icon className="w-6 h-6 text-neutral-400" />
                  <Typography.Small className="font-medium text-neutral-500">
                    {category.name}
                  </Typography.Small>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminSettings;

