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
        const normalizedText = text.toUpperCase();
        return {
            employer: {
                name: this.extractPattern(normalizedText, [/(?:EMPLOYER|NAME OF EMPLOYER)(?:\s+NAME)?[\s:]+([A-Z \t]{3,50})/i]),
                tan: this.extractPattern(normalizedText, [/(?:TAN|TAX DEDUCTION ACCOUNT NUMBER)[\s:]*([A-Z]{4}\d{5}[A-Z])/i]),
            },
            financial: {
                grossSalary: this.parseAmount(this.extractPattern(normalizedText, [/(?:GROSS SALARY|TOTAL EARNINGS)[\s:]*[₹]?[\s]*(\d{1,3}(?:[,\s]\d{2,3})*)/i])),
                tds: this.parseAmount(this.extractPattern(normalizedText, [/(?:TDS|TAX DEDUCTED)[\s:]*[₹]?[\s]*(\d{1,3}(?:[,\s]\d{2,3})*)/i])),
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
