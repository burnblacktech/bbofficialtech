import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit,
  Trash2,
  Upload,
  Eye,
} from 'lucide-react';

const SectionCard = ({
  id,
  title,
  status,
  summary,
  isExpanded,
  onToggle,
  data,
  onUpdate,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Status configuration
  const statusConfig = {
    complete: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      label: 'Complete',
    },
    // eslint-disable-next-line camelcase
    attention_needed: {
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      label: 'Attention Needed',
    },
    incomplete: {
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      label: 'Incomplete',
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.incomplete;
  const StatusIcon = currentStatus.icon;

  // Handle adding new items
  const handleAddItem = (type) => {
    console.log(`Adding new ${type} item to ${title}`);
    // This will be implemented based on the specific section
  };

  // Handle editing items
  const handleEditItem = (itemId) => {
    console.log(`Editing item ${itemId} in ${title}`);
    // This will be implemented based on the specific section
  };

  // Handle deleting items
  const handleDeleteItem = (itemId) => {
    console.log(`Deleting item ${itemId} from ${title}`);
    // This will be implemented based on the specific section
  };

  // Render section-specific content
  const renderSectionContent = () => {
    switch (id) {
      case 'personalInfo':
        return <PersonalInfoContent data={data} onUpdate={onUpdate} />;
      case 'incomeDetails':
        return <IncomeDetailsContent data={data} onUpdate={onUpdate} onAdd={handleAddItem} onEdit={handleEditItem} onDelete={handleDeleteItem} />;
      case 'deductions':
        return <DeductionsContent data={data} onUpdate={onUpdate} onAdd={handleAddItem} onEdit={handleEditItem} onDelete={handleDeleteItem} />;
      case 'taxesPaid':
        return <TaxesPaidContent data={data} onUpdate={onUpdate} onAdd={handleAddItem} onEdit={handleEditItem} onDelete={handleDeleteItem} />;
      default:
        return <div className="p-4 text-gray-500">Section content not implemented yet</div>;
    }
  };

  return (
    <motion.div
      layout
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Collapsed State - Clickable Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {/* Status Icon */}
          <div className={`p-2 rounded-full ${currentStatus.bgColor}`}>
            <StatusIcon className={`h-4 w-4 ${currentStatus.color}`} />
          </div>

          {/* Title and Summary */}
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{summary}</p>
          </div>
        </div>

        {/* Expand/Collapse Icon */}
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full ${currentStatus.bgColor} ${currentStatus.color}`}>
            {currentStatus.label}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded State - Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-gray-200"
          >
            {renderSectionContent()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Personal Information Content Component
const PersonalInfoContent = ({ data, onUpdate }) => {
  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={data?.fullName || ''}
            onChange={(e) => onUpdate({ fullName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
          <input
            type="text"
            value={data?.fatherName || ''}
            onChange={(e) => onUpdate({ fatherName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={data?.email || ''}
            onChange={(e) => onUpdate({ email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={data?.phone || ''}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <textarea
          value={`${data?.address?.line1 || ''}, ${data?.address?.line2 || ''}, ${data?.address?.city || ''}, ${data?.address?.state || ''} - ${data?.address?.pincode || ''}`}
          onChange={(e) => {
            // Parse address string back to object
            const addressParts = e.target.value.split(', ');
            onUpdate({
              address: {
                line1: addressParts[0] || '',
                line2: addressParts[1] || '',
                city: addressParts[2] || '',
                state: addressParts[3] || '',
                pincode: addressParts[4] || '',
              },
            });
          }}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

// Income Details Content Component
const IncomeDetailsContent = ({ data, onUpdate, onAdd, onEdit, onDelete }) => {
  return (
    <div className="p-6 space-y-6">
      {/* Salary Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-gray-900">Salary Income</h4>
          <button
            onClick={() => onAdd('salary')}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Salary</span>
          </button>
        </div>

        {data?.salary?.map((salary) => (
          <div key={salary.id} className="bg-gray-50 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">{salary.employerName}</h5>
                <p className="text-sm text-gray-600">₹{salary.grossSalary?.toLocaleString()} • TDS: ₹{salary.tds?.toLocaleString()}</p>
                {salary.form16Uploaded && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 mt-1">
                    <Upload className="h-3 w-3 mr-1" />
                    Form 16 Uploaded
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit(salary.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(salary.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Other Sources Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-gray-900">Other Sources</h4>
          <button
            onClick={() => onAdd('otherSource')}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Source</span>
          </button>
        </div>

        {data?.otherSources?.map((source) => (
          <div key={source.id} className="bg-gray-50 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">{source.source}</h5>
                <p className="text-sm text-gray-600">₹{source.amount?.toLocaleString()} • TDS: ₹{source.tds?.toLocaleString()}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit(source.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(source.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Deductions Content Component
const DeductionsContent = ({ data, onUpdate, onAdd, onEdit, onDelete }) => {
  return (
    <div className="p-6 space-y-6">
      {/* Section 80C */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-md font-semibold text-gray-900">Section 80C</h4>
            <p className="text-sm text-gray-600">Limit: ₹1,50,000 • Claimed: ₹{data?.section80C?.claimed?.toLocaleString() || 0}</p>
          </div>
          <button
            onClick={() => onAdd('80C')}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Investment</span>
          </button>
        </div>

        {data?.section80C?.items?.map((item) => (
          <div key={item.id} className="bg-gray-50 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">{item.description}</h5>
                <p className="text-sm text-gray-600">₹{item.amount?.toLocaleString() || 0}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit(item.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Other Deductions */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-4">Other Deductions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900">Section 80D (Health Insurance)</h5>
            <p className="text-sm text-gray-600">₹{data?.section80D?.claimed?.toLocaleString() || 0} / ₹25,000</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900">Section 80TTA (Savings Interest)</h5>
            <p className="text-sm text-gray-600">₹{data?.section80TTA?.claimed?.toLocaleString() || 0} / ₹10,000</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Taxes Paid Content Component
const TaxesPaidContent = ({ data, onUpdate, onAdd, onEdit, onDelete }) => {
  return (
    <div className="p-6 space-y-6">
      {/* TDS Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-gray-900">Tax Deducted at Source (TDS)</h4>
          <button
            onClick={() => onAdd('tds')}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add TDS</span>
          </button>
        </div>

        {data?.tds?.map((tds) => (
          <div key={tds.id} className="bg-gray-50 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">{tds.source}</h5>
                <p className="text-sm text-gray-600">Section {tds.section} • ₹{tds.amount?.toLocaleString()}</p>
                {tds.verified && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 mt-1">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified from Form 26AS
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit(tds.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(tds.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Advance Tax Section */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-4">Advance Tax</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">No advance tax payments recorded</p>
          <button
            onClick={() => onAdd('advanceTax')}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            + Add Advance Tax Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionCard;
