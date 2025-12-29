// =====================================================
// ITR-4 SCHEDULE BUILDERS
// Builders for ITR-4 specific presumptive schedules (BP only)
// =====================================================

const enterpriseLogger = require('../../utils/logger');

class ITR4ScheduleBuilders {
  /**
   * Build Schedule BP (Presumptive Business/Profession)
   * @param {object} sectionSnapshot - Section snapshot
   * @param {object} computationResult - Computation result (for validation)
   * @returns {object} Schedule BP structure with presumptive income
   */
  buildScheduleBP_Presumptive(sectionSnapshot, computationResult = {}) {
    const income = sectionSnapshot.income || {};
    const presumptiveBusiness = income.presumptiveBusiness || income.presumptive_business || {};
    const presumptiveProfessional = income.presumptiveProfessional || income.presumptive_professional || {};
    const goodsCarriage = income.goodsCarriage || sectionSnapshot.goodsCarriage || {};

    // Section 44AD: Business Presumptive Income
    let natOfBus44AD = 'NO';
    let totPresumpBusInc = 0;
    let grossTurnoverReceipts = 0;
    let section44ADDetails = null;

    if (presumptiveBusiness && (presumptiveBusiness.hasPresumptiveBusiness || presumptiveBusiness.presumptiveIncome > 0)) {
      natOfBus44AD = 'YES';
      grossTurnoverReceipts = parseFloat(presumptiveBusiness.grossReceipts || presumptiveBusiness.grossTurnover || 0);
      totPresumpBusInc = parseFloat(presumptiveBusiness.presumptiveIncome || 0);

      const isDigitalReceipts = presumptiveBusiness.isDigitalReceipts || presumptiveBusiness.digitalReceipts || false;

      // If presumptive income not provided, calculate it
      if (totPresumpBusInc === 0 && grossTurnoverReceipts > 0) {
        const presumptiveRate = parseFloat(presumptiveBusiness.presumptiveRate || 0.08);
        // 6% for digital receipts, 8% for non-digital
        const effectiveRate = isDigitalReceipts ? 0.06 : presumptiveRate;
        totPresumpBusInc = grossTurnoverReceipts * effectiveRate;
      }

      section44ADDetails = {
        NatureOfBusiness: presumptiveBusiness.businessType || presumptiveBusiness.business_type || '',
        GrossTurnoverReceipts: this.formatAmount(grossTurnoverReceipts),
        PresumptiveIncome: this.formatAmount(totPresumpBusInc),
        SectionCode: '44AD',
        IsDigitalReceipts: isDigitalReceipts ? 'YES' : 'NO',
        CashReceipts: this.formatAmount(presumptiveBusiness.cashReceipts || 0),
        NonCashReceipts: this.formatAmount(presumptiveBusiness.nonCashReceipts || 0),
      };
    }

    // Section 44ADA: Profession Presumptive Income
    let presumpProfDtls = null;
    let totPresumpProfInc = 0;

    if (presumptiveProfessional && (presumptiveProfessional.hasPresumptiveProfessional || presumptiveProfessional.presumptiveIncome > 0)) {
      const grossReceipts = parseFloat(presumptiveProfessional.grossReceipts || 0);
      totPresumpProfInc = parseFloat(presumptiveProfessional.presumptiveIncome || 0);

      // If presumptive income not provided, calculate it (50% of gross receipts)
      if (totPresumpProfInc === 0 && grossReceipts > 0) {
        totPresumpProfInc = grossReceipts * 0.5;
      }

      presumpProfDtls = {
        ProfessionType: presumptiveProfessional.professionType || presumptiveProfessional.profession_type || '',
        GrossReceipts: this.formatAmount(grossReceipts),
        PresumpProfInc: this.formatAmount(totPresumpProfInc),
        SectionCode: '44ADA',
      };
    }

    // Section 44AE: Goods Carriage Presumptive Income
    let section44AEDetails = null;

    if (goodsCarriage && (goodsCarriage.hasGoodsCarriage || (goodsCarriage.vehicles && goodsCarriage.vehicles.length > 0))) {
      const vehicles = goodsCarriage.vehicles || [];
      let totalPresumptiveIncome = parseFloat(goodsCarriage.totalPresumptiveIncome || 0);

      // If total not provided, calculate from vehicles
      if (totalPresumptiveIncome === 0 && vehicles.length > 0) {
        totalPresumptiveIncome = vehicles.reduce((sum, vehicle) => {
          const monthsOwned = parseFloat(vehicle.monthsOwned || 12);
          let vehicleIncome = 0;

          if (vehicle.type === 'heavy_goods' || vehicle.vehicleType === 'heavy_goods') {
            const tons = parseFloat(vehicle.gvw || vehicle.grossVehicleWeight || 12);
            vehicleIncome = 1000 * tons * monthsOwned;
          } else {
            vehicleIncome = 7500 * monthsOwned;
          }

          return sum + vehicleIncome;
        }, 0);
      }

      section44AEDetails = {
        HasGoodsCarriage: 'YES',
        Vehicles: vehicles.map(vehicle => ({
          VehicleType: vehicle.type === 'heavy_goods' ? 'Heavy Goods Vehicle' : 'Other Goods Vehicle',
          RegistrationNumber: vehicle.registrationNo || vehicle.registrationNumber || '',
          GrossVehicleWeight: this.formatAmount(vehicle.gvw || vehicle.grossVehicleWeight || 0),
          MonthsOwned: vehicle.monthsOwned || 12,
          OwnedOrLeased: vehicle.ownedOrLeased || 'owned',
          PresumptiveIncome: this.formatAmount(
            vehicle.type === 'heavy_goods' || vehicle.vehicleType === 'heavy_goods'
              ? 1000 * (vehicle.gvw || vehicle.grossVehicleWeight || 12) * (vehicle.monthsOwned || 12)
              : 7500 * (vehicle.monthsOwned || 12)
          ),
        })),
        TotalPresumptiveIncome: this.formatAmount(totalPresumptiveIncome),
        TotalVehicles: vehicles.length || 0,
      };
    }

    // Build PresumpIncDtls (aggregated)
    const presumpIncDtls = {
      TotPresumpBusInc: this.formatAmount(totPresumpBusInc),
      GrossTurnoverReceipts: this.formatAmount(grossTurnoverReceipts),
    };

    // Build complete Schedule BP
    const scheduleBP = {
      NatOfBus44AD: natOfBus44AD,
      PresumpIncDtls: presumpIncDtls,
    };

    // Add section-specific details if present
    if (section44ADDetails) {
      scheduleBP.Section44ADDetails = section44ADDetails;
    }

    if (presumpProfDtls) {
      scheduleBP.PresumpProfDtls = presumpProfDtls;
    }

    if (section44AEDetails) {
      scheduleBP.Section44AE = section44AEDetails;
    }

    return scheduleBP;
  }

  /**
   * Format amount as string with 2 decimal places
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted amount string
   */
  formatAmount(amount) {
    const numAmount = parseFloat(amount || 0);
    if (isNaN(numAmount)) {
      return '0.00';
    }
    return numAmount.toFixed(2);
  }
}

module.exports = new ITR4ScheduleBuilders();

