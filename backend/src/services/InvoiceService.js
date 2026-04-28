/**
 * InvoiceService — GST-compliant invoice data + PDF generation
 *
 * Invoice number format: BB-YYMM-NNNNN (e.g., BB-2526-00001)
 * GST: CGST 9% + SGST 9% = 18% total
 * SAC code: 998313 (tax preparation services)
 */

const PDFDocument = require('pdfkit');
const enterpriseLogger = require('../utils/logger');

const BURNBLACK_GSTIN = process.env.BURNBLACK_GSTIN || '29AABCB1234F1Z5';
const SAC_CODE = '998313';

class InvoiceService {
  /**
   * Build invoice data object and store in Order.metadata.
   * Called when order transitions to 'paid'.
   * @param {object} order - Order model instance
   * @param {object} user - User model instance
   * @param {object} filing - ITRFiling model instance (optional)
   */
  static async buildInvoiceData(order, user, filing) {
    const baseAmount = order.amount - order.discount;
    const cgstRate = 9;
    const sgstRate = 9;
    const cgstAmount = Math.round(baseAmount * cgstRate / 100);
    const sgstAmount = Math.round(baseAmount * sgstRate / 100);
    const totalGst = cgstAmount + sgstAmount;

    const invoiceData = {
      invoiceNumber: order.invoiceNumber,
      invoiceDate: order.paidAt || new Date().toISOString(),
      buyerName: user?.fullName || user?.name || 'Customer',
      buyerPan: filing?.taxpayerPan || user?.pan || '',
      sellerGstin: BURNBLACK_GSTIN,
      sacCode: SAC_CODE,
      baseAmount: order.amount,
      discount: order.discount || 0,
      netAmount: baseAmount,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      totalGst,
      totalAmount: order.totalAmount,
      couponCode: order.couponCode || null,
      planName: order.planId || '',
      paymentMethod: 'razorpay',
      assessmentYear: filing?.assessmentYear || '',
    };

    // Store in order metadata
    const metadata = order.metadata || {};
    metadata.invoice = invoiceData;
    order.metadata = metadata;
    order.changed('metadata', true);
    await order.save();

    return invoiceData;
  }

  /**
   * Generate PDF from invoice data using PDFKit.
   * @param {object} order - Order model instance with metadata.invoice
   * @returns {Buffer} PDF buffer
   */
  static async generatePDF(order) {
    const invoice = order.metadata?.invoice;
    if (!invoice) {
      throw new Error('No invoice data found for this order');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('BurnBlack', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('Tax Filing Platform', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
      doc.moveDown();

      // Invoice details
      doc.fontSize(10).font('Helvetica');
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
      doc.text(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`);
      doc.text(`GSTIN: ${invoice.sellerGstin}`);
      doc.text(`SAC Code: ${invoice.sacCode}`);
      doc.moveDown();

      // Buyer details
      doc.font('Helvetica-Bold').text('Bill To:');
      doc.font('Helvetica');
      doc.text(`Name: ${invoice.buyerName}`);
      if (invoice.buyerPan) doc.text(`PAN: ${invoice.buyerPan}`);
      if (invoice.assessmentYear) doc.text(`Assessment Year: ${invoice.assessmentYear}`);
      doc.moveDown();

      // Line items
      doc.font('Helvetica-Bold').text('Description', 50, doc.y, { continued: true, width: 250 });
      doc.text('Amount (₹)', { align: 'right' });
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.3);

      doc.font('Helvetica');
      const planLabel = invoice.planName ? `${invoice.planName} Plan — ITR Filing` : 'ITR Filing Service';
      doc.text(planLabel, 50, doc.y, { continued: true, width: 250 });
      doc.text(InvoiceService._fmtPaise(invoice.baseAmount), { align: 'right' });

      if (invoice.discount > 0) {
        doc.text(`Discount${invoice.couponCode ? ` (${invoice.couponCode})` : ''}`, 50, doc.y, { continued: true, width: 250 });
        doc.text(`-${InvoiceService._fmtPaise(invoice.discount)}`, { align: 'right' });
      }

      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.3);

      // GST breakdown
      doc.text(`Subtotal`, 50, doc.y, { continued: true, width: 250 });
      doc.text(InvoiceService._fmtPaise(invoice.netAmount), { align: 'right' });

      doc.text(`CGST @ ${invoice.cgstRate}%`, 50, doc.y, { continued: true, width: 250 });
      doc.text(InvoiceService._fmtPaise(invoice.cgstAmount), { align: 'right' });

      doc.text(`SGST @ ${invoice.sgstRate}%`, 50, doc.y, { continued: true, width: 250 });
      doc.text(InvoiceService._fmtPaise(invoice.sgstAmount), { align: 'right' });

      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.3);

      // Total
      doc.font('Helvetica-Bold');
      doc.text('Total', 50, doc.y, { continued: true, width: 250 });
      doc.text(InvoiceService._fmtPaise(invoice.totalAmount), { align: 'right' });
      doc.moveDown();

      // Footer
      doc.font('Helvetica').fontSize(8);
      doc.text('Payment Method: Razorpay', 50, doc.y);
      doc.text('This is a computer-generated invoice and does not require a signature.', 50, doc.y + 12);

      doc.end();
    });
  }

  static _fmtPaise(paise) {
    return `₹${(Number(paise) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }
}

module.exports = InvoiceService;
