// =====================================================
// KNOWLEDGE BASE SERVICE
// Provides tax knowledge base content and search
// =====================================================

const enterpriseLogger = require('../../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class KnowledgeBaseService {
  constructor() {
    this.contentCache = null;
    this.contentPath = path.join(__dirname, '../../data/knowledge-base');
  }

  /**
   * Load knowledge base content
   */
  async loadContent() {
    if (this.contentCache) {
      return this.contentCache;
    }

    try {
      // Try to load from data directory
      const topicsPath = path.join(this.contentPath, 'topics.json');
      const sectionsPath = path.join(this.contentPath, 'sections.json');
      const itrGuidesPath = path.join(this.contentPath, 'itr-guides.json');
      const tipsPath = path.join(this.contentPath, 'tax-tips.json');

      const [topics, sections, itrGuides, tips] = await Promise.all([
        this.loadJSONFile(topicsPath),
        this.loadJSONFile(sectionsPath),
        this.loadJSONFile(itrGuidesPath),
        this.loadJSONFile(tipsPath),
      ]);

      this.contentCache = {
        topics: topics || this.getDefaultTopics(),
        sections: sections || this.getDefaultSections(),
        itrGuides: itrGuides || this.getDefaultITRGuides(),
        tips: tips || this.getDefaultTips(),
      };

      return this.contentCache;
    } catch (error) {
      enterpriseLogger.warn('Failed to load knowledge base from files, using defaults', {
        error: error.message,
      });
      // Return default content if files don't exist
      this.contentCache = {
        topics: this.getDefaultTopics(),
        sections: this.getDefaultSections(),
        itrGuides: this.getDefaultITRGuides(),
        tips: this.getDefaultTips(),
      };
      return this.contentCache;
    }
  }

  /**
   * Load JSON file safely
   */
  async loadJSONFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Search knowledge base
   */
  async search(query, options = {}) {
    try {
      const { category, section } = options;
      const content = await this.loadContent();
      const results = [];

      const searchText = query.toLowerCase();

      // Search topics
      if (!category || category === 'topics') {
        content.topics.forEach((topic) => {
          if (
            topic.title.toLowerCase().includes(searchText) ||
            topic.content.toLowerCase().includes(searchText) ||
            topic.keywords?.some((kw) => kw.toLowerCase().includes(searchText))
          ) {
            results.push({
              type: 'topic',
              id: topic.id,
              title: topic.title,
              summary: topic.summary,
              category: topic.category,
            });
          }
        });
      }

      // Search sections
      if (!category || category === 'sections') {
        content.sections.forEach((sec) => {
          if (
            (section && sec.id === section) ||
            sec.title.toLowerCase().includes(searchText) ||
            sec.explanation.toLowerCase().includes(searchText)
          ) {
            results.push({
              type: 'section',
              id: sec.id,
              title: sec.title,
              summary: sec.summary,
              section: sec.section,
            });
          }
        });
      }

      // Search ITR guides
      if (!category || category === 'itr-guides') {
        content.itrGuides.forEach((guide) => {
          if (
            guide.itrType.toLowerCase().includes(searchText) ||
            guide.content.toLowerCase().includes(searchText)
          ) {
            results.push({
              type: 'itr-guide',
              id: guide.id,
              title: guide.title,
              summary: guide.summary,
              itrType: guide.itrType,
            });
          }
        });
      }

      // Search tips
      if (!category || category === 'tips') {
        content.tips.forEach((tip) => {
          if (
            tip.title.toLowerCase().includes(searchText) ||
            tip.content.toLowerCase().includes(searchText) ||
            tip.category?.toLowerCase().includes(searchText)
          ) {
            results.push({
              type: 'tip',
              id: tip.id,
              title: tip.title,
              summary: tip.summary,
              category: tip.category,
            });
          }
        });
      }

      return results.slice(0, 20); // Limit to 20 results
    } catch (error) {
      enterpriseLogger.error('Search knowledge base failed', {
        error: error.message,
        query,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get topic by ID
   */
  async getTopic(topicId) {
    try {
      const content = await this.loadContent();
      return content.topics.find((topic) => topic.id === topicId) || null;
    } catch (error) {
      enterpriseLogger.error('Get topic failed', {
        error: error.message,
        topicId,
      });
      throw error;
    }
  }

  /**
   * Get section explanation
   */
  async getSectionExplanation(sectionId) {
    try {
      const content = await this.loadContent();
      return content.sections.find((section) => section.id === sectionId) || null;
    } catch (error) {
      enterpriseLogger.error('Get section explanation failed', {
        error: error.message,
        sectionId,
      });
      throw error;
    }
  }

  /**
   * Get default topics
   */
  getDefaultTopics() {
    return [
      {
        id: 'income-tax-basics',
        title: 'Income Tax Basics',
        category: 'basics',
        summary: 'Understanding the fundamentals of income tax in India',
        content: 'Income tax is a tax levied by the Government of India on the income earned by individuals and entities. The tax is calculated based on the income earned during a financial year (April 1 to March 31).',
        keywords: ['income tax', 'basics', 'fundamentals', 'taxation'],
      },
      {
        id: 'deductions',
        title: 'Tax Deductions',
        category: 'deductions',
        summary: 'Learn about various tax deductions available under the Income Tax Act',
        content: 'Tax deductions reduce your taxable income, thereby reducing your tax liability. Common deductions include Section 80C (up to ₹1.5L), Section 80D (health insurance), and HRA (House Rent Allowance).',
        keywords: ['deductions', '80C', '80D', 'HRA', 'tax savings'],
      },
      {
        id: 'itr-filing',
        title: 'ITR Filing Process',
        category: 'filing',
        summary: 'Step-by-step guide to filing your Income Tax Return',
        content: 'Filing ITR involves gathering documents, filling the appropriate ITR form, computing tax, e-verifying, and submitting. The process can be done online through the income tax portal.',
        keywords: ['ITR', 'filing', 'process', 'e-verification', 'submission'],
      },
    ];
  }

  /**
   * Get default sections
   */
  getDefaultSections() {
    return [
      {
        id: 'section-80c',
        section: '80C',
        title: 'Section 80C - Tax Deductions',
        summary: 'Deduction up to ₹1.5 lakhs for investments and expenses',
        explanation: 'Section 80C allows deduction of up to ₹1.5 lakhs from your taxable income for various investments and expenses including ELSS, PPF, life insurance, home loan principal, etc.',
        limit: 150000,
        eligibleItems: ['ELSS', 'PPF', 'Life Insurance', 'Home Loan Principal', 'NSC', 'Tax Saving FD'],
      },
      {
        id: 'section-80d',
        section: '80D',
        title: 'Section 80D - Health Insurance',
        summary: 'Deduction for health insurance premiums',
        explanation: 'Section 80D provides deduction for health insurance premiums paid for self, spouse, children, and parents. The limit is ₹25,000 for self/family and ₹50,000 for senior citizen parents.',
        limit: 25000,
        eligibleItems: ['Health Insurance Premium', 'Preventive Health Check-up'],
      },
      {
        id: 'section-24',
        section: '24',
        title: 'Section 24 - Home Loan Interest',
        summary: 'Deduction for home loan interest',
        explanation: 'Section 24 allows deduction of home loan interest up to ₹2 lakhs for self-occupied property. For let-out property, there is no limit on interest deduction.',
        limit: 200000,
        eligibleItems: ['Home Loan Interest'],
      },
    ];
  }

  /**
   * Get default ITR guides
   */
  getDefaultITRGuides() {
    return [
      {
        id: 'itr-1-guide',
        itrType: 'ITR-1',
        title: 'ITR-1 (Sahaj) Guide',
        summary: 'Guide for filing ITR-1 for salaried individuals',
        content: 'ITR-1 is for individuals having income from salary, one house property, and other sources (interest, etc.). Total income should not exceed ₹50 lakhs.',
      },
      {
        id: 'itr-2-guide',
        itrType: 'ITR-2',
        title: 'ITR-2 Guide',
        summary: 'Guide for filing ITR-2 for individuals and HUFs',
        content: 'ITR-2 is for individuals and HUFs not having income from business or profession. It includes income from salary, house property, capital gains, and other sources.',
      },
      {
        id: 'itr-3-guide',
        itrType: 'ITR-3',
        title: 'ITR-3 Guide',
        summary: 'Guide for filing ITR-3 for business/profession income',
        content: 'ITR-3 is for individuals and HUFs having income from business or profession. It requires P&L statement and balance sheet.',
      },
    ];
  }

  /**
   * Get default tax tips
   */
  getDefaultTips() {
    return [
      {
        id: 'tip-1',
        title: 'Invest Early in the Financial Year',
        category: 'planning',
        summary: 'Start investing at the beginning of the financial year',
        content: 'Investing early in the financial year (April) gives you more time for your investments to grow and helps in better tax planning throughout the year.',
      },
      {
        id: 'tip-2',
        title: 'Maximize Section 80C Benefits',
        category: 'deductions',
        summary: 'Utilize the full ₹1.5 lakh limit under Section 80C',
        content: 'Plan your investments to fully utilize the ₹1.5 lakh deduction limit under Section 80C. Consider a mix of ELSS, PPF, and life insurance based on your risk profile.',
      },
      {
        id: 'tip-3',
        title: 'Keep All Documents Ready',
        category: 'filing',
        summary: 'Maintain organized records of all tax-related documents',
        content: 'Keep all documents like Form 16, investment proofs, rent receipts, and bank statements organized throughout the year for easy ITR filing.',
      },
    ];
  }
}

module.exports = new KnowledgeBaseService();

