// =====================================================
// INCOME BREAKDOWN COMPONENT
// Granular display of individual income entries
// =====================================================

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Globe, Briefcase, Users, TrendingUp } from 'lucide-react';

const IncomeBreakdown = ({ formData, selectedITR }) => {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatCurrency = (amount) => {
    return `₹${(parseFloat(amount) || 0).toLocaleString('en-IN')}`;
  };

  // Capital Gains Breakdown
  const renderCapitalGainsBreakdown = () => {
    const capitalGains = formData.income?.capitalGains;
    if (!capitalGains || (!capitalGains.stcgDetails?.length && !capitalGains.ltcgDetails?.length)) {
      return null;
    }

    const stcgTotal = (capitalGains.stcgDetails || []).reduce(
      (sum, entry) => sum + (parseFloat(entry.gainAmount) || 0),
      0,
    );
    const ltcgTotal = (capitalGains.ltcgDetails || []).reduce(
      (sum, entry) => sum + (parseFloat(entry.gainAmount) || 0),
      0,
    );

    return (
      <div className="border border-slate-200 rounded-xl p-4">
        <button
          onClick={() => toggleSection('capitalGains')}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-slate-900">Capital Gains</h4>
            <span className="text-body-regular text-slate-500">
              ({capitalGains.stcgDetails?.length || 0} STCG, {capitalGains.ltcgDetails?.length || 0} LTCG)
            </span>
          </div>
          <span className="font-semibold text-slate-900 mr-2">
            {formatCurrency(stcgTotal + ltcgTotal)}
          </span>
          {expandedSections.capitalGains ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </button>

        {expandedSections.capitalGains && (
          <div className="mt-4 space-y-4">
            {/* STCG Details */}
            {capitalGains.stcgDetails?.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-slate-700 mb-2">Short-term Capital Gains (STCG)</h5>
                <div className="space-y-2">
                  {capitalGains.stcgDetails.map((entry, index) => (
                    <div key={index} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-body-regular">
                        <div>
                          <span className="text-slate-600">Asset:</span>
                          <span className="ml-2 font-medium">{entry.assetType || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Sale Value:</span>
                          <span className="ml-2 font-medium">{formatCurrency(entry.saleValue)}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Purchase Value:</span>
                          <span className="ml-2 font-medium">{formatCurrency(entry.purchaseValue)}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Gain:</span>
                          <span className="ml-2 font-semibold text-green-600">{formatCurrency(entry.gainAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-slate-300 pt-2 flex justify-between">
                    <span className="font-medium text-slate-700">Total STCG:</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(stcgTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* LTCG Details */}
            {capitalGains.ltcgDetails?.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-slate-700 mb-2">Long-term Capital Gains (LTCG)</h5>
                <div className="space-y-2">
                  {capitalGains.ltcgDetails.map((entry, index) => (
                    <div key={index} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-body-regular">
                        <div>
                          <span className="text-slate-600">Asset:</span>
                          <span className="ml-2 font-medium">{entry.assetType || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Sale Value:</span>
                          <span className="ml-2 font-medium">{formatCurrency(entry.saleValue)}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Indexed Cost:</span>
                          <span className="ml-2 font-medium">{formatCurrency(entry.indexedCost)}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Gain:</span>
                          <span className="ml-2 font-semibold text-green-600">{formatCurrency(entry.gainAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-slate-300 pt-2 flex justify-between">
                    <span className="font-medium text-slate-700">Total LTCG:</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(ltcgTotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // House Property Breakdown
  const renderHousePropertyBreakdown = () => {
    const houseProperty = formData.income?.houseProperty;
    if (!houseProperty) return null;

    const properties = houseProperty.properties || (Array.isArray(houseProperty) ? houseProperty : []);
    if (properties.length === 0) return null;

    const totalIncome = properties.reduce((sum, prop) => {
      const rentalIncome = parseFloat(prop.annualRentalIncome) || 0;
      const municipalTaxes = parseFloat(prop.municipalTaxes) || 0;
      const interestOnLoan = parseFloat(prop.interestOnLoan) || 0;
      return sum + Math.max(0, rentalIncome - municipalTaxes - interestOnLoan);
    }, 0);

    return (
      <div className="border border-slate-200 rounded-xl p-4">
        <button
          onClick={() => toggleSection('houseProperty')}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-slate-900">House Property</h4>
            <span className="text-body-regular text-slate-500">({properties.length} {properties.length === 1 ? 'property' : 'properties'})</span>
          </div>
          <span className="font-semibold text-slate-900 mr-2">{formatCurrency(totalIncome)}</span>
          {expandedSections.houseProperty ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </button>

        {expandedSections.houseProperty && (
          <div className="mt-4 space-y-3">
            {properties.map((property, index) => {
              const rentalIncome = parseFloat(property.annualRentalIncome) || 0;
              const municipalTaxes = parseFloat(property.municipalTaxes) || 0;
              const interestOnLoan = parseFloat(property.interestOnLoan) || 0;
              const netIncome = Math.max(0, rentalIncome - municipalTaxes - interestOnLoan);

              return (
                <div key={index} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-slate-900">Property #{index + 1}</h5>
                    <span className="text-body-small px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {property.propertyType?.replace('_', ' ') || 'N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-body-regular">
                    <div>
                      <span className="text-slate-600">Rental Income:</span>
                      <span className="ml-2 font-medium">{formatCurrency(rentalIncome)}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Municipal Taxes:</span>
                      <span className="ml-2 font-medium">{formatCurrency(municipalTaxes)}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Interest on Loan:</span>
                      <span className="ml-2 font-medium">{formatCurrency(interestOnLoan)}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Net Income:</span>
                      <span className="ml-2 font-semibold text-green-600">{formatCurrency(netIncome)}</span>
                    </div>
                  </div>
                  {property.propertyAddress && (
                    <div className="mt-2 text-body-small text-slate-500">
                      <span className="font-medium">Address:</span> {property.propertyAddress}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Foreign Income Breakdown
  const renderForeignIncomeBreakdown = () => {
    const foreignIncome = formData.income?.foreignIncome;
    if (!foreignIncome?.foreignIncomeDetails?.length) return null;

    const totalIncome = foreignIncome.foreignIncomeDetails.reduce(
      (sum, entry) => sum + (parseFloat(entry.amountInr) || 0),
      0,
    );

    return (
      <div className="border border-slate-200 rounded-xl p-4">
        <button
          onClick={() => toggleSection('foreignIncome')}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-slate-900">Foreign Income</h4>
            <span className="text-body-regular text-slate-500">({foreignIncome.foreignIncomeDetails.length} {foreignIncome.foreignIncomeDetails.length === 1 ? 'entry' : 'entries'})</span>
          </div>
          <span className="font-semibold text-slate-900 mr-2">{formatCurrency(totalIncome)}</span>
          {expandedSections.foreignIncome ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </button>

        {expandedSections.foreignIncome && (
          <div className="mt-4 space-y-3">
            {foreignIncome.foreignIncomeDetails.map((entry, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-body-regular">
                  <div>
                    <span className="text-slate-600">Country:</span>
                    <span className="ml-2 font-medium">{entry.country || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Type:</span>
                    <span className="ml-2 font-medium">{entry.incomeType?.replace('_', ' ') || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Amount (INR):</span>
                    <span className="ml-2 font-medium">{formatCurrency(entry.amountInr)}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">DTAA:</span>
                    <span className={`ml-2 font-medium ${entry.dtaaApplicable ? 'text-green-600' : 'text-slate-500'}`}>
                      {entry.dtaaApplicable ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                {entry.amount > 0 && (
                  <div className="mt-2 text-body-small text-slate-500">
                    <span className="font-medium">Foreign Amount:</span> {entry.amount} @ {entry.exchangeRate || 1} = {formatCurrency(entry.amountInr)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Director/Partner Income Breakdown
  const renderDirectorPartnerBreakdown = () => {
    const directorPartner = formData.income?.directorPartner;
    if (!directorPartner) return null;

    const directorIncome = parseFloat(directorPartner.directorIncome) || 0;
    const partnerIncome = parseFloat(directorPartner.partnerIncome) || 0;
    const total = directorIncome + partnerIncome;

    if (total === 0) return null;

    return (
      <div className="border border-slate-200 rounded-xl p-4">
        <button
          onClick={() => toggleSection('directorPartner')}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-slate-900">Director/Partner Income</h4>
          </div>
          <span className="font-semibold text-slate-900 mr-2">{formatCurrency(total)}</span>
          {expandedSections.directorPartner ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </button>

        {expandedSections.directorPartner && (
          <div className="mt-4 space-y-2">
            {directorIncome > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">Director Income:</span>
                <span className="font-medium">{formatCurrency(directorIncome)}</span>
              </div>
            )}
            {partnerIncome > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">Partner Income:</span>
                <span className="font-medium">{formatCurrency(partnerIncome)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Other Income Breakdown
  const renderOtherIncomeBreakdown = () => {
    const otherIncome = formData.income?.otherIncome;
    if (!otherIncome || (typeof otherIncome === 'number' && otherIncome === 0)) return null;

    // If it's a number, just show it
    if (typeof otherIncome === 'number') {
      return (
        <div className="border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-slate-900">Other Income</h4>
            </div>
            <span className="font-semibold text-slate-900">{formatCurrency(otherIncome)}</span>
          </div>
        </div>
      );
    }

    // If it's an object with breakdown
    const interest = parseFloat(otherIncome.interest) || 0;
    const dividend = parseFloat(otherIncome.dividend) || 0;
    const winnings = parseFloat(otherIncome.winnings) || 0;
    const other = parseFloat(otherIncome.other) || 0;
    const total = interest + dividend + winnings + other;

    if (total === 0) return null;

    return (
      <div className="border border-slate-200 rounded-xl p-4">
        <button
          onClick={() => toggleSection('otherIncome')}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-slate-900">Other Income</h4>
          </div>
          <span className="font-semibold text-slate-900 mr-2">{formatCurrency(total)}</span>
          {expandedSections.otherIncome ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </button>

        {expandedSections.otherIncome && (
          <div className="mt-4 space-y-2">
            {interest > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">Interest Income:</span>
                <span className="font-medium">{formatCurrency(interest)}</span>
              </div>
            )}
            {dividend > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">Dividend Income:</span>
                <span className="font-medium">{formatCurrency(dividend)}</span>
              </div>
            )}
            {winnings > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">Winnings:</span>
                <span className="font-medium">{formatCurrency(winnings)}</span>
              </div>
            )}
            {other > 0 && (
              <div className="flex justify-between text-body-regular">
                <span className="text-slate-600">Other:</span>
                <span className="font-medium">{formatCurrency(other)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {renderCapitalGainsBreakdown()}
      {renderHousePropertyBreakdown()}
      {renderForeignIncomeBreakdown()}
      {renderDirectorPartnerBreakdown()}
      {renderOtherIncomeBreakdown()}
    </div>
  );
};

export default IncomeBreakdown;

