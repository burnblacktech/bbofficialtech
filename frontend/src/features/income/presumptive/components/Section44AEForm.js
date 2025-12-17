// =====================================================
// SECTION 44AE FORM COMPONENT
// Presumptive income for goods carriage business
// =====================================================

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Plus,
  Trash2,
  Info,
  AlertTriangle,
  HelpCircle,
  Calendar,
  IndianRupee,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { springs, variants } from '../../../../lib/motion';

// Vehicle types for 44AE
const VEHICLE_TYPES = [
  {
    id: 'heavy_goods',
    label: 'Heavy Goods Vehicle (above 12MT)',
    incomePerMonth: 1000, // per ton per month
    minTons: 12,
    description: 'Trucks with gross vehicle weight above 12 MT',
  },
  {
    id: 'light_goods',
    label: 'Other Goods Vehicle (up to 12MT)',
    incomePerMonth: 7500, // flat per vehicle per month
    maxTons: 12,
    description: 'Trucks/Tempos with gross vehicle weight up to 12 MT',
  },
];

// Max vehicles limit for 44AE
const MAX_VEHICLES = 10;

const Section44AEForm = ({
  data = {},
  onUpdate,
  filingId,
  readOnly = false,
}) => {
  // Initialize state
  const [hasGoodsCarriage, setHasGoodsCarriage] = useState(data?.hasGoodsCarriage ?? false);
  const [vehicles, setVehicles] = useState(data?.vehicles || []);

  // Calculate total presumptive income
  const totalPresumptiveIncome = useMemo(() => {
    return vehicles.reduce((sum, vehicle) => {
      const monthsOwned = vehicle.monthsOwned || 12;
      if (vehicle.type === 'heavy_goods') {
        // ₹1,000 per ton per month for heavy vehicles
        const tons = vehicle.gvw || 12;
        return sum + (1000 * tons * monthsOwned);
      } else {
        // ₹7,500 per vehicle per month for light vehicles
        return sum + (7500 * monthsOwned);
      }
    }, 0);
  }, [vehicles]);

  // Check if exceeds vehicle limit
  const exceedsVehicleLimit = vehicles.length >= MAX_VEHICLES;

  // Propagate changes to parent
  useEffect(() => {
    onUpdate?.({
      hasGoodsCarriage,
      vehicles,
      totalPresumptiveIncome,
      totalVehicles: vehicles.length,
    });
  }, [hasGoodsCarriage, vehicles, totalPresumptiveIncome, onUpdate]);

  const handleAddVehicle = () => {
    if (exceedsVehicleLimit) return;

    setVehicles([
      ...vehicles,
      {
        id: Date.now(),
        type: 'light_goods',
        registrationNo: '',
        gvw: 0,
        monthsOwned: 12,
        ownedOrLeased: 'owned',
      },
    ]);
  };

  const handleRemoveVehicle = (id) => {
    setVehicles(vehicles.filter((v) => v.id !== id));
  };

  const handleVehicleChange = (id, field, value) => {
    setVehicles(
      vehicles.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const calculateVehicleIncome = (vehicle) => {
    const monthsOwned = vehicle.monthsOwned || 12;
    if (vehicle.type === 'heavy_goods') {
      const tons = vehicle.gvw || 12;
      return 1000 * tons * monthsOwned;
    } else {
      return 7500 * monthsOwned;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-100 to-amber-50 flex items-center justify-center">
            <Truck className="w-5 h-5 text-gold-600" />
          </div>
          <div>
            <h3 className="text-heading-4 font-semibold text-slate-900">
              Section 44AE - Goods Carriage
            </h3>
            <p className="text-body-regular text-slate-500 mt-0.5">
              Presumptive income for plying, hiring, or leasing goods carriages
            </p>
          </div>
        </div>
      </div>

      {/* Goods Carriage Toggle */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasGoodsCarriage}
            onChange={(e) => setHasGoodsCarriage(e.target.checked)}
            disabled={readOnly}
            className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <span className="text-body-regular font-medium text-slate-700">
              I have income from goods carriage business
            </span>
            <p className="text-body-small text-slate-500 mt-0.5">
              Eligible if you own not more than 10 goods carriages
            </p>
          </div>
        </label>
      </div>

      {/* Vehicle Limit Warning */}
      {hasGoodsCarriage && exceedsVehicleLimit && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-error-50 rounded-xl border border-red-200 p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-body-regular font-medium text-red-800">
              44AE limit reached! You can only have up to {MAX_VEHICLES} vehicles.
            </p>
            <p className="text-body-small text-error-600 mt-1">
              If you own more than 10 vehicles, you cannot use presumptive taxation and must use ITR-3.
            </p>
          </div>
        </motion.div>
      )}

      {/* Vehicle Details */}
      <AnimatePresence>
        {hasGoodsCarriage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springs.gentle}
            className="space-y-4"
          >
            {/* Vehicle Entries */}
            {vehicles.length === 0 ? (
              <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center">
                <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-body-regular text-slate-600 mb-4">No vehicles added yet</p>
                <button
                  onClick={handleAddVehicle}
                  disabled={readOnly}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Vehicle
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {vehicles.map((vehicle, index) => (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl border-2 border-slate-200 p-5 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-body-small font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        Vehicle #{index + 1}
                      </span>
                      {!readOnly && (
                        <button
                          onClick={() => handleRemoveVehicle(vehicle.id)}
                          className="p-1.5 text-slate-400 hover:text-error-500 hover:bg-error-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Vehicle Type */}
                      <div>
                        <label className="block text-body-regular font-medium text-slate-700 mb-1.5">
                          Vehicle Type
                        </label>
                        <select
                          value={vehicle.type}
                          onChange={(e) => handleVehicleChange(vehicle.id, 'type', e.target.value)}
                          disabled={readOnly}
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all disabled:bg-slate-50"
                        >
                          {VEHICLE_TYPES.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Registration Number */}
                      <div>
                        <label className="block text-body-regular font-medium text-slate-700 mb-1.5">
                          Registration No.
                        </label>
                        <input
                          type="text"
                          value={vehicle.registrationNo || ''}
                          onChange={(e) => handleVehicleChange(vehicle.id, 'registrationNo', e.target.value.toUpperCase())}
                          disabled={readOnly}
                          placeholder="MH01AB1234"
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all uppercase disabled:bg-slate-50"
                        />
                      </div>

                      {/* GVW (for heavy vehicles) */}
                      {vehicle.type === 'heavy_goods' && (
                        <div>
                          <label className="block text-body-regular font-medium text-slate-700 mb-1.5">
                            GVW (Metric Tons)
                          </label>
                          <input
                            type="number"
                            value={vehicle.gvw || ''}
                            onChange={(e) => handleVehicleChange(vehicle.id, 'gvw', parseFloat(e.target.value) || 0)}
                            disabled={readOnly}
                            min={12}
                            placeholder="12"
                            className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all disabled:bg-slate-50"
                          />
                        </div>
                      )}

                      {/* Months Owned */}
                      <div>
                        <label className="block text-body-regular font-medium text-slate-700 mb-1.5">
                          <Calendar className="w-3.5 h-3.5 inline mr-1" />
                          Months Owned
                        </label>
                        <select
                          value={vehicle.monthsOwned}
                          onChange={(e) => handleVehicleChange(vehicle.id, 'monthsOwned', parseInt(e.target.value))}
                          disabled={readOnly}
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all disabled:bg-slate-50"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                            <option key={m} value={m}>
                              {m} month{m > 1 ? 's' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Ownership */}
                      <div>
                        <label className="block text-body-regular font-medium text-slate-700 mb-1.5">
                          Ownership
                        </label>
                        <select
                          value={vehicle.ownedOrLeased}
                          onChange={(e) => handleVehicleChange(vehicle.id, 'ownedOrLeased', e.target.value)}
                          disabled={readOnly}
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all disabled:bg-slate-50"
                        >
                          <option value="owned">Owned</option>
                          <option value="leased">Hired/Leased</option>
                        </select>
                      </div>
                    </div>

                    {/* Calculated Income */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-body-regular text-slate-600">
                        Presumptive Income for this vehicle:
                      </span>
                      <span className="text-body-large font-semibold text-primary-600">
                        {formatCurrency(calculateVehicleIncome(vehicle))}
                      </span>
                    </div>
                  </motion.div>
                ))}

                {/* Add More Button */}
                {!readOnly && !exceedsVehicleLimit && (
                  <button
                    onClick={handleAddVehicle}
                    className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-body-regular font-medium text-slate-600 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Vehicle ({vehicles.length}/{MAX_VEHICLES})
                  </button>
                )}
              </div>
            )}

            {/* Total Summary */}
            {vehicles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gold-50 to-amber-50 rounded-xl border border-gold-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-body-regular font-medium text-gold-800">
                      Total Presumptive Income (44AE)
                    </span>
                    <p className="text-body-small text-gold-600 mt-0.5">
                      {vehicles.length} vehicle{vehicles.length > 1 ? 's' : ''} • Based on ownership months
                    </p>
                  </div>
                  <span className="text-heading-3 font-bold text-gold-700 tabular-nums">
                    {formatCurrency(totalPresumptiveIncome)}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-body-regular text-blue-800">
                <p className="font-medium mb-1">Section 44AE Rates (FY 2024-25)</p>
                <ul className="text-body-small text-blue-700 space-y-1 list-disc list-inside">
                  <li>Heavy Goods Vehicle (&gt;12MT): ₹1,000 per ton of GVW per month</li>
                  <li>Other Goods Vehicle (≤12MT): ₹7,500 per vehicle per month</li>
                  <li>Maximum 10 vehicles allowed under this section</li>
                  <li>Income is calculated based on months owned during the year</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Section44AEForm;

