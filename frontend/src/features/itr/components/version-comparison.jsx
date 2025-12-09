// =====================================================
// VERSION COMPARISON COMPONENT
// Compare two draft versions side by side
// =====================================================

import React, { useState } from 'react';
import { GitCompare, ArrowLeft, ArrowRight } from 'lucide-react';
import Button from '../../../components/common/Button';

const VersionComparison = ({ versions = [], onRestore }) => {
  const [version1, setVersion1] = useState(null);
  const [version2, setVersion2] = useState(null);
  const [comparison, setComparison] = useState(null);

  const handleCompare = () => {
    if (!version1 || !version2) {
      return;
    }

    const v1 = versions.find((v) => v.id === version1);
    const v2 = versions.find((v) => v.id === version2);

    if (!v1 || !v2) {
      return;
    }

    const diff = compareVersions(v1.draft_data || {}, v2.draft_data || {});
    setComparison(diff);
  };

  const compareVersions = (data1, data2) => {
    const differences = [];
    const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);

    allKeys.forEach((key) => {
      const val1 = data1[key];
      const val2 = data2[key];

      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        differences.push({
          field: key,
          version1: val1,
          version2: val2,
          type: typeof val1 !== typeof val2 ? 'type_change' : 'value_change',
        });
      }
    });

    return {
      version1: version1,
      version2: version2,
      differences,
      totalChanges: differences.length,
    };
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <GitCompare className="h-6 w-6 text-gold-600 mr-3" />
        <h3 className="text-heading-md text-gray-800">Compare Versions</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">
            Version 1
          </label>
          <select
            value={version1 || ''}
            onChange={(e) => setVersion1(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          >
            <option value="">Select version</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                Version {v.version} - {new Date(v.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-2">
            Version 2
          </label>
          <select
            value={version2 || ''}
            onChange={(e) => setVersion2(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          >
            <option value="">Select version</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                Version {v.version} - {new Date(v.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button onClick={handleCompare} disabled={!version1 || !version2} className="w-full mb-6">
        Compare Versions
      </Button>

      {comparison && (
        <div className="space-y-4">
          <div className="bg-info-50 border border-info-200 rounded-lg p-4">
            <p className="text-body-md font-semibold text-info-900">
              {comparison.totalChanges} difference(s) found
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-body-sm font-semibold text-gray-700 border border-gray-200">
                    Field
                  </th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold text-gray-700 border border-gray-200">
                    Version 1
                  </th>
                  <th className="px-4 py-3 text-left text-body-sm font-semibold text-gray-700 border border-gray-200">
                    Version 2
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.differences.map((diff, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border border-gray-200 font-medium text-gray-800">
                      {diff.field}
                    </td>
                    <td className="px-4 py-3 border border-gray-200">
                      <div className="bg-error-50 text-error-900 p-2 rounded text-body-sm font-mono">
                        {formatValue(diff.version1)}
                      </div>
                    </td>
                    <td className="px-4 py-3 border border-gray-200">
                      <div className="bg-success-50 text-success-900 p-2 rounded text-body-sm font-mono">
                        {formatValue(diff.version2)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionComparison;

