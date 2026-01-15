// =====================================================
// TAX FORM OCR SERVICE
// Extracts data from Form 16, 16A, and 16B
// =====================================================

const Tesseract = require('tesseract.js');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const enterpriseLogger = require('../../utils/logger');

class TaxFormOCRService {
    /**
     * Process tax document and extract structured data
     */
    async processForm(fileBuffer, fileName, formType) {
        let tempFilePath = null;

        try {
            const tempDir = os.tmpdir();
            const tempFileName = `tax-form-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(fileName)}`;
            tempFilePath = path.join(tempDir, tempFileName);

            await fs.writeFile(tempFilePath, fileBuffer);

            enterpriseLogger.info(`Starting ${formType} OCR`, { fileName });

            const ocrResult = await Tesseract.recognize(tempFilePath, 'eng');
            const text = ocrResult.data.text;

            let extractedData = {};
            switch (formType) {
                case 'FORM_16':
                    extractedData = this.parseForm16(text);
                    break;
                case 'FORM_16A':
                    extractedData = this.parseForm16A(text);
                    break;
                case 'FORM_16B':
                    extractedData = this.parseForm16B(text);
                    break;
                default:
                    throw new Error('Unsupported form type');
            }

            return {
                success: true,
                extractedData: {
                    ...extractedData,
                    rawText: text,
                },
                confidence: ocrResult.data.confidence / 100,
            };
        } catch (error) {
            enterpriseLogger.error(`${formType} OCR failed`, { fileName, error: error.message });
            throw error;
        } finally {
            if (tempFilePath && (await fs.pathExists(tempFilePath))) {
                await fs.remove(tempFilePath);
            }
        }
    }

    parseForm16(text) {
        const normalizedText = text.toUpperCase().replace(/\s+/g, ' ');

        return {
            employer: {
                name: this.extractPattern(normalizedText, [
                    /(?:NAME AND ADDRESS OF THE EMPLOYER|NAME OF THE EMPLOYER) ([A-Z0-9\s,.&]{3,100})/i,
                    /(?:EMPLOYER NAME) ([A-Z0-9\s,.&]{3,100})/i
                ]),
                tan: this.extractPattern(normalizedText, [
                    /(?:TAN OF THE DEDUCTOR|TAN) ([A-Z]{4}\d{5}[A-Z])/i,
                    /([A-Z]{4}\d{5}[A-Z])/
                ]),
                pan: this.extractPattern(normalizedText, [
                    /(?:PAN OF THE DEDUCTOR|EMPLOYER PAN) ([A-Z]{5}\d{4}[A-Z])/i
                ])
            },
            employee: {
                pan: this.extractPattern(normalizedText, [
                    /(?:PAN OF THE EMPLOYEE|PAN OF THE DEDUCTEE) ([A-Z]{5}\d{4}[A-Z])/i,
                    /(?:PAN) ([A-Z]{5}\d{4}[A-Z])/i
                ])
            },
            financial: {
                assessmentYear: this.extractPattern(normalizedText, [
                    /(?:ASSESSMENT YEAR) (\d{4}-\d{2})/i,
                    /(\d{4}-\d{2})/
                ]),
                grossSalary: this.parseAmount(this.extractPattern(normalizedText, [
                    /(?:GROSS SALARY|TOTAL AMOUNT OF SALARY) (?:RS[.]?\s*)?(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/i,
                    /(?:SECTION 17\(1\)) (?:RS[.]?\s*)?(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/i
                ])),
                standardDeduction: this.parseAmount(this.extractPattern(normalizedText, [
                    /(?:STANDARD DEDUCTION UNDER SECTION 16\(IA\)) (?:RS[.]?\s*)?(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/i
                ])),
                deductions80C: this.parseAmount(this.extractPattern(normalizedText, [
                    /(?:SECTION 80C) (?:RS[.]?\s*)?(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/i,
                    /(?:LIFE INSURANCE PREMIUM|EPF|PPF|ELSS) (?:RS[.]?\s*)?(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/i
                ])),
                deductions80D: this.parseAmount(this.extractPattern(normalizedText, [
                    /(?:SECTION 80D|HEALTH INSURANCE) (?:RS[.]?\s*)?(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/i
                ])),
                totalTaxableIncome: this.parseAmount(this.extractPattern(normalizedText, [
                    /(?:TOTAL INCOME) (?:RS[.]?\s*)?(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/i
                ])),
                totalTax: this.parseAmount(this.extractPattern(normalizedText, [
                    /(?:TAX ON TOTAL INCOME) (?:RS[.]?\s*)?(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/i
                ])),
                tds: this.parseAmount(this.extractPattern(normalizedText, [
                    /(?:TOTAL TAX DEDUCTED) (?:RS[.]?\s*)?(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/i,
                    /(?:TAX DEDUCTED AT SOURCE) (?:RS[.]?\s*)?(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/i
                ]))
            }
        };
    }

    parseForm16A(text) {
        const normalizedText = text.toUpperCase();
        return {
            payer: {
                name: this.extractPattern(normalizedText, [/(?:PAYER|DEDUCTOR)(?:\s+NAME)?[\s:]+([A-Z \t]{3,50})/i]),
                tan: this.extractPattern(normalizedText, [/(?:TAN)[\s:]*([A-Z]{4}\d{5}[A-Z])/i]),
            },
            financial: {
                amountPaid: this.parseAmount(this.extractPattern(normalizedText, [/(?:AMOUNT PAID|CREDITED)[\s:]*[₹]?[\s]*(\d{1,3}(?:[,\s]\d{2,3})*)/i])),
                tds: this.parseAmount(this.extractPattern(normalizedText, [/(?:TAX DEDUCTED)[\s:]*[₹]?[\s]*(\d{1,3}(?:[,\s]\d{2,3})*)/i])),
            }
        };
    }

    parseForm16B(text) {
        const normalizedText = text.toUpperCase();
        return {
            transferee: {
                name: this.extractPattern(normalizedText, [/(?:TRANSFEREE|BUYER)(?:\s+NAME)?[\s:]+([A-Z \t]{3,50})/i]),
            },
            financial: {
                consideration: this.parseAmount(this.extractPattern(normalizedText, [/(?:TOTAL CONSIDERATION)[\s:]*[₹]?[\s]*(\d{1,3}(?:[,\s]\d{2,3})*)/i])),
                tds: this.parseAmount(this.extractPattern(normalizedText, [/(?:TAX DEDUCTED)[\s:]*[₹]?[\s]*(\d{1,3}(?:[,\s]\d{2,3})*)/i])),
            }
        };
    }

    extractPattern(text, patterns) {
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) return match[1].trim();
        }
        return null;
    }

    parseAmount(amountText) {
        if (!amountText) return null;
        const cleaned = amountText.replace(/[₹,\s]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
    }
}

module.exports = new TaxFormOCRService();
