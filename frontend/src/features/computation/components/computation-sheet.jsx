// =====================================================
// COMPUTATION SHEET COMPONENT
// Detailed tax computation sheet with slab-wise breakdown
// =====================================================

import React from 'react';
import { FileText, Download, Printer } from 'lucide-react';
import { useTaxBreakdown } from '../hooks/use-tax-computation';
import Button from '../../../components/DesignSystem/components/Button';
import { useExportTaxComputationPDF } from '../../pdf-export/hooks/use-pdf-export';
import PDFExportButton from '../../pdf-export/components/pdf-export-button';

const ComputationSheet = ({ filingId, regime = 'old', taxComputation }) => {
  const { data: breakdown, isLoading } = useTaxBreakdown(filingId, regime);
  const exportTaxComputationPDF = useExportTaxComputationPDF();

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const slabBreakdown = breakdown?.slabBreakdown || taxComputation?.slabBreakdown || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="h-6 w-6 text-gold-600 mr-3" />
          <h3 className="text-heading-md text-gray-800">Detailed Computation Sheet</h3>
        </div>
        <div className="flex gap-2">
          <PDFExportButton
            onExport={() => {
              if (filingId) {
                exportTaxComputationPDF.mutate({
                  filingId,
                  filename: `tax-computation-${filingId}.pdf`,
                });
              }
            }}
            isLoading={exportTaxComputationPDF.isPending}
            disabled={!filingId}
            label="Download PDF"
            variant="outline"
            size="small"
          />
          <Button variant="ghost" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto"></div>
          <p className="text-body-md text-slate-600 mt-4">Calculating tax breakdown...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Income Summary */}
          <div>
            <h4 className="text-body-md font-semibold text-gray-800 mb-3">Income Summary</h4>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-body-md text-slate-600">Gross Total Income</span>
                <span className="text-body-md font-semibold text-gray-800">
                  {formatCurrency(taxComputation?.grossTotalIncome || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-md text-slate-600">Total Deductions</span>
                <span className="text-body-md font-semibold text-gray-800">
                  {formatCurrency(taxComputation?.totalDeductions || 0)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-body-md font-semibold text-gray-800">Taxable Income</span>
                <span className="text-body-md font-semibold text-gray-800">
                  {formatCurrency(taxComputation?.taxableIncome || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Slab-wise Tax Breakdown */}
          {slabBreakdown.length > 0 && (
            <div>
              <h4 className="text-body-md font-semibold text-gray-800 mb-3">
                Slab-wise Tax Calculation
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left p-3 text-body-sm font-semibold text-slate-700 border border-slate-200">
                        Income Slab
                      </th>
                      <th className="text-right p-3 text-body-sm font-semibold text-slate-700 border border-slate-200">
                        Taxable Amount
                      </th>
                      <th className="text-right p-3 text-body-sm font-semibold text-slate-700 border border-slate-200">
                        Tax Rate
                      </th>
                      <th className="text-right p-3 text-body-sm font-semibold text-slate-700 border border-slate-200">
                        Tax Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {slabBreakdown.map((slab, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="p-3 text-body-md text-slate-700 border border-slate-200">
                          {slab.slab}
                        </td>
                        <td className="p-3 text-body-md text-slate-700 text-right border border-slate-200">
                          {formatCurrency(slab.income || slab.taxableAmount)}
                        </td>
                        <td className="p-3 text-body-md text-slate-700 text-right border border-slate-200">
                          {slab.rate}%
                        </td>
                        <td className="p-3 text-body-md font-semibold text-gray-800 text-right border border-slate-200">
                          {formatCurrency(slab.tax)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gold-50">
                      <td
                        colSpan={3}
                        className="p-3 text-body-md font-semibold text-gray-800 border border-slate-200"
                      >
                        Total Tax on Income
                      </td>
                      <td className="p-3 text-body-md font-semibold text-gray-800 text-right border border-slate-200">
                        {formatCurrency(taxComputation?.tax || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Rebate and Relief */}
          <div>
            <h4 className="text-body-md font-semibold text-gray-800 mb-3">Rebates & Relief</h4>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              {taxComputation?.rebate87A?.applicable && (
                <div className="flex justify-between">
                  <span className="text-body-md text-slate-600">
                    Rebate u/s 87A (Max ₹12,500)
                  </span>
                  <span className="text-body-md font-semibold text-success-600">
                    -{formatCurrency(taxComputation.rebate87A.amount)}
                  </span>
                </div>
              )}
              {taxComputation?.relief89?.applicable && (
                <div className="flex justify-between">
                  <span className="text-body-md text-slate-600">Relief u/s 89</span>
                  <span className="text-body-md font-semibold text-success-600">
                    -{formatCurrency(taxComputation.relief89.amount)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cess and Final Tax */}
          <div>
            <h4 className="text-body-md font-semibold text-gray-800 mb-3">Final Tax Liability</h4>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-body-md text-slate-600">Tax on Income</span>
                <span className="text-body-md font-semibold text-gray-800">
                  {formatCurrency(taxComputation?.tax || 0)}
                </span>
              </div>
              {taxComputation?.rebate87A?.applicable && (
                <div className="flex justify-between">
                  <span className="text-body-md text-slate-600">Less: Rebate u/s 87A</span>
                  <span className="text-body-md text-gray-800">
                    -{formatCurrency(taxComputation.rebate87A.amount)}
                  </span>
                </div>
              )}
              {taxComputation?.relief89?.applicable && (
                <div className="flex justify-between">
                  <span className="text-body-md text-slate-600">Less: Relief u/s 89</span>
                  <span className="text-body-md text-gray-800">
                    -{formatCurrency(taxComputation.relief89.amount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-body-md text-slate-600">Education Cess (4%)</span>
                <span className="text-body-md font-semibold text-gray-800">
                  {formatCurrency(taxComputation?.cess || 0)}
                </span>
              </div>
              {taxComputation?.interest?.total > 0 && (
                <div className="flex justify-between">
                  <span className="text-body-md text-slate-600">Interest (234A/234B/234C)</span>
                  <span className="text-body-md font-semibold text-error-600">
                    +{formatCurrency(taxComputation.interest.total)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t-2 border-slate-300">
                <span className="text-body-lg font-semibold text-gray-800">Total Tax Liability</span>
                <span className="text-body-lg font-semibold text-gray-800">
                  {formatCurrency(taxComputation?.finalTax || taxComputation?.totalTax || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComputationSheet;

