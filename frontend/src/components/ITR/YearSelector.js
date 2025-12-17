// =====================================================
// YEAR SELECTOR COMPONENT
// Financial year selector with belated return indicators
// =====================================================

import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import apiClient from '../../services/core/APIClient';

const YearSelector = ({ selectedYear, onYearChange, assessmentYear = '2024-25' }) => {
  const [availableYears, setAvailableYears] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableYears();
  }, []);

  const fetchAvailableYears = async () => {
    try {
      // For now, generate years client-side
      // In future, call backend API
      const currentYear = new Date().getFullYear();
      const years = [];

      // Generate last 5 years + current year
      for (let i = 5; i >= 0; i--) {
        const fyStart = currentYear - i;
        const fyEnd = fyStart + 1;
        const fy = `${fyStart}-${fyEnd.toString().slice(-2)}`;
        const ay = `${fyEnd}-${(fyEnd + 1).toString().slice(-2)}`;

        // Calculate if belated
        const dueDate = new Date(fyEnd, 6, 31); // July 31
        const isBelated = new Date() > dueDate;
        const daysRemaining = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));

        years.push({
          fy,
          assessmentYear: ay,
          isBelated,
          daysRemaining,
          dueDate: dueDate.toLocaleDateString('en-IN'),
        });
      }

      setAvailableYears(years);
    } catch (error) {
      // Fallback to hardcoded years
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let i = 2; i >= 0; i--) {
        const fyStart = currentYear - i;
        const fyEnd = fyStart + 1;
        years.push({
          fy: `${fyStart}-${fyEnd.toString().slice(-2)}`,
          assessmentYear: `${fyEnd}-${(fyEnd + 1).toString().slice(-2)}`,
          isBelated: i > 0,
          daysRemaining: null,
          dueDate: 'July 31',
        });
      }
      setAvailableYears(years);
    } finally {
      setLoading(false);
    }
  };

  const currentYearInfo = availableYears.find(y => y.fy === selectedYear) || availableYears[0];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-heading-4 font-semibold text-slate-900 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Financial Year
        </h3>
        {currentYearInfo?.isBelated && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-body-small font-medium bg-gold-100 text-gold-700">
            <AlertCircle className="w-3 h-3 mr-1" />
            Belated Return
          </span>
        )}
      </div>

      <div className="space-y-3">
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 text-body-regular font-medium"
        >
          {availableYears.map((year) => (
            <option key={year.fy} value={year.fy}>
              FY {year.fy} (AY {year.assessmentYear})
            </option>
          ))}
        </select>

        {currentYearInfo && (
          <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-body-regular">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Assessment Year:</span>
              <span className="font-semibold text-slate-900">{currentYearInfo.assessmentYear}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Due Date:</span>
              <span className="font-semibold text-slate-900">{currentYearInfo.dueDate}</span>
            </div>
            {currentYearInfo.isBelated ? (
              <div className="flex items-center justify-between text-gold-600">
                <span className="flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Belated Return
                </span>
                <span className="font-semibold">Late Fee: ₹5,000 - ₹10,000</span>
              </div>
            ) : currentYearInfo.daysRemaining !== null && (
              <div className="flex items-center justify-between text-green-600">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Days Remaining
                </span>
                <span className="font-semibold">{currentYearInfo.daysRemaining} days</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default YearSelector;

