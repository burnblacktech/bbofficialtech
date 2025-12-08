// =====================================================
// SEED HELP ARTICLES
// Creates initial help articles for the help center
// Usage: node src/scripts/seed-help-articles.js
// =====================================================

const { sequelize } = require('../config/database');
const { HelpArticle } = require('../models');
const enterpriseLogger = require('../utils/logger');

const helpArticles = [
  {
    title: 'How to File ITR-1 for Salaried Employees',
    snippet: 'Step-by-step guide to filing ITR-1 for salaried individuals with income from salary, house property, and other sources',
    content: `
      <h2>Introduction to ITR-1</h2>
      <p>ITR-1 (Sahaj) is the simplest income tax return form for individuals who have income from:</p>
      <ul>
        <li>Salary/Pension</li>
        <li>One house property</li>
        <li>Other sources (interest, dividends, etc.)</li>
      </ul>
      
      <h2>Who Can File ITR-1?</h2>
      <p>You can file ITR-1 if:</p>
      <ul>
        <li>Your total income does not exceed ₹50 lakh</li>
        <li>You have income only from salary, one house property, and other sources</li>
        <li>You are a resident individual</li>
      </ul>
      
      <h2>Step-by-Step Process</h2>
      <ol>
        <li>Gather all required documents (Form 16, bank statements, investment proofs)</li>
        <li>Log in to your account on the platform</li>
        <li>Select ITR-1 and the assessment year</li>
        <li>Fill in your personal details</li>
        <li>Enter salary income details from Form 16</li>
        <li>Declare house property income (if applicable)</li>
        <li>Enter other sources of income</li>
        <li>Claim deductions under Chapter VI-A</li>
        <li>Review and validate your return</li>
        <li>Submit and e-verify your return</li>
      </ol>
      
      <h2>Important Documents Required</h2>
      <ul>
        <li>Form 16 from employer</li>
        <li>Form 16A for TDS certificates</li>
        <li>Bank statements</li>
        <li>Investment proofs (LIC, PPF, ELSS, etc.)</li>
        <li>Home loan interest certificate (if applicable)</li>
      </ul>
      
      <h2>Common Mistakes to Avoid</h2>
      <ul>
        <li>Not reporting all sources of income</li>
        <li>Incorrect PAN or personal details</li>
        <li>Missing TDS details</li>
        <li>Not claiming eligible deductions</li>
        <li>Forgetting to e-verify the return</li>
      </ul>
    `,
    category: 'filing',
    tags: ['itr-1', 'salaried', 'filing', 'beginner'],
    published: true,
    publishedAt: new Date('2024-01-15'),
    readTime: 8,
  },
  {
    title: 'Understanding HRA Exemption Calculation',
    snippet: 'Learn how to calculate and claim House Rent Allowance (HRA) exemption correctly',
    content: `
      <h2>What is HRA?</h2>
      <p>House Rent Allowance (HRA) is a component of salary that helps employees pay rent. A portion of HRA is exempt from tax under Section 10(13A) of the Income Tax Act.</p>
      
      <h2>HRA Exemption Calculation</h2>
      <p>HRA exemption is the minimum of the following three amounts:</p>
      <ol>
        <li>Actual HRA received</li>
        <li>Actual rent paid minus 10% of basic salary</li>
        <li>50% of basic salary (for metro cities) or 40% (for non-metro cities)</li>
      </ol>
      
      <h2>Metro Cities</h2>
      <p>The following cities are considered metro for HRA calculation:</p>
      <ul>
        <li>Delhi</li>
        <li>Mumbai</li>
        <li>Kolkata</li>
        <li>Chennai</li>
      </ul>
      
      <h2>Example Calculation</h2>
      <p>Let's say:</p>
      <ul>
        <li>Basic Salary: ₹50,000/month</li>
        <li>HRA Received: ₹20,000/month</li>
        <li>Rent Paid: ₹15,000/month</li>
        <li>Location: Mumbai (metro)</li>
      </ul>
      <p>Calculation:</p>
      <ol>
        <li>Actual HRA: ₹20,000</li>
        <li>Rent - 10% of basic: ₹15,000 - ₹5,000 = ₹10,000</li>
        <li>50% of basic (metro): ₹25,000</li>
      </ol>
      <p>Exempt HRA = Minimum of above = ₹10,000/month</p>
      <p>Taxable HRA = ₹20,000 - ₹10,000 = ₹10,000/month</p>
      
      <h2>Important Points</h2>
      <ul>
        <li>You must actually pay rent to claim HRA exemption</li>
        <li>Rent receipts and rent agreement are required as proof</li>
        <li>If you own the house, HRA is fully taxable</li>
        <li>HRA exemption is available only if you receive HRA as part of salary</li>
      </ul>
    `,
    category: 'tax-deductions',
    tags: ['hra', 'exemption', 'salary', 'deduction'],
    published: true,
    publishedAt: new Date('2024-01-20'),
    readTime: 7,
  },
  {
    title: 'Section 80C Deductions: Complete Guide',
    snippet: 'Everything you need to know about Section 80C tax deductions and eligible investments',
    content: `
      <h2>What is Section 80C?</h2>
      <p>Section 80C of the Income Tax Act allows you to claim deductions up to ₹1.5 lakh per financial year on certain investments and expenses.</p>
      
      <h2>Eligible Investments Under Section 80C</h2>
      <ul>
        <li><strong>ELSS (Equity Linked Saving Scheme):</strong> Mutual funds with 3-year lock-in</li>
        <li><strong>PPF (Public Provident Fund):</strong> Long-term savings with tax benefits</li>
        <li><strong>NSC (National Savings Certificate):</strong> Government-backed investment</li>
        <li><strong>Tax-saving Fixed Deposits:</strong> Bank FDs with 5-year lock-in</li>
        <li><strong>Life Insurance Premium:</strong> Premium paid for life insurance policies</li>
        <li><strong>ULIP:</strong> Unit Linked Insurance Plans</li>
        <li><strong>Principal Repayment of Home Loan:</strong> Principal component of EMI</li>
        <li><strong>Sukanya Samriddhi Yojana:</strong> For girl child education</li>
        <li><strong>Senior Citizens Savings Scheme:</strong> For senior citizens</li>
      </ul>
      
      <h2>Eligible Expenses Under Section 80C</h2>
      <ul>
        <li>Tuition fees paid for children's education (up to 2 children)</li>
        <li>Principal repayment of home loan</li>
      </ul>
      
      <h2>Maximum Deduction</h2>
      <p>The maximum deduction under Section 80C is ₹1.5 lakh per financial year. This is a combined limit for all investments and expenses under this section.</p>
      
      <h2>Important Points</h2>
      <ul>
        <li>Investments must be made during the financial year (April 1 to March 31)</li>
        <li>Keep all investment proofs and receipts</li>
        <li>Some investments have lock-in periods</li>
        <li>ELSS has the shortest lock-in period (3 years)</li>
        <li>PPF has a 15-year lock-in period</li>
      </ul>
      
      <h2>How to Claim</h2>
      <ol>
        <li>Make eligible investments during the financial year</li>
        <li>Collect investment certificates and receipts</li>
        <li>While filing ITR, enter the investment amount in Section 80C</li>
        <li>Upload investment proofs if required</li>
      </ol>
    `,
    category: 'tax-deductions',
    tags: ['80c', 'deduction', 'investment', 'tax-saving'],
    published: true,
    publishedAt: new Date('2024-01-25'),
    readTime: 10,
  },
  {
    title: 'How to E-Verify Your Income Tax Return',
    snippet: 'Step-by-step guide to e-verifying your ITR using different methods',
    content: `
      <h2>What is E-Verification?</h2>
      <p>E-verification is the process of confirming your ITR submission electronically. Your return is considered filed only after e-verification.</p>
      
      <h2>Why E-Verify?</h2>
      <ul>
        <li>ITR is not considered filed until e-verified</li>
        <li>Required to process refunds</li>
        <li>Prevents penalties for non-filing</li>
        <li>Faster processing of return</li>
      </ul>
      
      <h2>Methods of E-Verification</h2>
      
      <h3>1. Aadhaar OTP</h3>
      <ol>
        <li>Log in to the e-filing portal</li>
        <li>Go to "My Account" → "E-Verify Return"</li>
        <li>Select the return to verify</li>
        <li>Choose "Aadhaar OTP" option</li>
        <li>Enter Aadhaar number and click "Generate OTP"</li>
        <li>Enter OTP received on registered mobile</li>
        <li>Click "Verify"</li>
      </ol>
      
      <h3>2. Net Banking</h3>
      <ol>
        <li>Log in to the e-filing portal</li>
        <li>Go to "E-Verify Return"</li>
        <li>Select "Net Banking" option</li>
        <li>Choose your bank</li>
        <li>Complete authentication through bank portal</li>
      </ol>
      
      <h3>3. Bank Account Number</h3>
      <ol>
        <li>Select "Bank Account Number" option</li>
        <li>Enter bank account number and IFSC</li>
        <li>Click "Continue"</li>
        <li>OTP will be sent to registered mobile/email</li>
        <li>Enter OTP to verify</li>
      </ol>
      
      <h3>4. Demat Account</h3>
      <p>If you have a Demat account, you can use it for e-verification.</p>
      
      <h2>Time Limit</h2>
      <p>You must e-verify your return within 120 days from the date of filing. If not verified within this period, the return is considered invalid.</p>
      
      <h2>Verification Status</h2>
      <p>After e-verification, you will receive a confirmation email. You can also check the status in "My Account" → "View Returns/Forms".</p>
      
      <h2>Common Issues</h2>
      <ul>
        <li>OTP not received: Check mobile number and try again</li>
        <li>Aadhaar not linked: Link Aadhaar with PAN first</li>
        <li>Bank account not pre-validated: Validate bank account in profile</li>
      </ul>
    `,
    category: 'filing',
    tags: ['e-verify', 'verification', 'itr', 'filing'],
    published: true,
    publishedAt: new Date('2024-02-01'),
    readTime: 6,
  },
  {
    title: 'Understanding TDS (Tax Deducted at Source)',
    snippet: 'Complete guide to TDS, how it works, and how to claim TDS credit in your ITR',
    content: `
      <h2>What is TDS?</h2>
      <p>Tax Deducted at Source (TDS) is a mechanism where tax is deducted by the payer at the time of making payment to the payee.</p>
      
      <h2>How TDS Works</h2>
      <ul>
        <li>Deducted at the time of payment</li>
        <li>Deposited to government by the deductor</li>
        <li>Reflected in Form 26AS</li>
        <li>Can be claimed as credit while filing ITR</li>
      </ul>
      
      <h2>Common TDS Scenarios</h2>
      
      <h3>Salary (Section 192)</h3>
      <p>Employer deducts TDS on salary based on estimated tax liability. Details are provided in Form 16.</p>
      
      <h3>Interest on Fixed Deposits (Section 194A)</h3>
      <p>Banks deduct TDS @ 10% if interest exceeds ₹40,000 (₹50,000 for senior citizens) in a financial year.</p>
      
      <h3>Rent (Section 194I)</h3>
      <p>TDS @ 10% is deducted if rent exceeds ₹2.4 lakh per year.</p>
      
      <h3>Professional Fees (Section 194J)</h3>
      <p>TDS @ 10% is deducted on professional fees exceeding ₹30,000.</p>
      
      <h2>Form 26AS</h2>
      <p>Form 26AS is a consolidated tax statement showing:</p>
      <ul>
        <li>All TDS deducted on your PAN</li>
        <li>Tax payments made by you</li>
        <li>Refunds received</li>
      </ul>
      <p>You can download Form 26AS from the e-filing portal.</p>
      
      <h2>Claiming TDS Credit</h2>
      <ol>
        <li>Download Form 26AS from e-filing portal</li>
        <li>Verify TDS details match with your records</li>
        <li>While filing ITR, enter TDS details from Form 26AS</li>
        <li>System will automatically calculate tax credit</li>
      </ol>
      
      <h2>Common Issues</h2>
      <ul>
        <li>TDS not reflecting in Form 26AS: Contact deductor to file TDS return</li>
        <li>Incorrect TDS: File correction return or contact deductor</li>
        <li>Missing TDS certificate: Request Form 16/16A from deductor</li>
      </ul>
    `,
    category: 'tax-basics',
    tags: ['tds', 'tax', 'form-26as', 'deduction'],
    published: true,
    publishedAt: new Date('2024-02-05'),
    readTime: 8,
  },
  {
    title: 'ITR Filing Deadline and Late Fees',
    snippet: 'Important dates, deadlines, and penalties for late filing of income tax returns',
    content: `
      <h2>ITR Filing Deadlines</h2>
      
      <h3>For Individuals (Not Requiring Audit)</h3>
      <p><strong>July 31</strong> of the assessment year is the normal due date for filing ITR.</p>
      <p>Example: For FY 2023-24 (AY 2024-25), the due date is July 31, 2024.</p>
      
      <h3>For Businesses Requiring Audit</h3>
      <p><strong>October 31</strong> of the assessment year is the due date.</p>
      
      <h3>Extended Deadlines</h3>
      <p>Sometimes, the government extends the deadline. Check the official notification for current year deadlines.</p>
      
      <h2>Late Filing Fees (Section 234F)</h2>
      <p>If you file your return after the due date, you may have to pay late fees:</p>
      <ul>
        <li><strong>If filed before December 31:</strong> ₹5,000</li>
        <li><strong>If filed after December 31:</strong> ₹10,000</li>
        <li><strong>If total income ≤ ₹5 lakh:</strong> Maximum ₹1,000</li>
      </ul>
      
      <h2>Interest on Late Filing</h2>
      <p>You may also be liable to pay interest under Section 234A if tax is due:</p>
      <ul>
        <li>Interest @ 1% per month on outstanding tax</li>
        <li>Calculated from due date to date of filing</li>
      </ul>
      
      <h2>Consequences of Not Filing</h2>
      <ul>
        <li>Penalty up to ₹10,000</li>
        <li>Interest on outstanding tax</li>
        <li>Prosecution in severe cases</li>
        <li>Loss of carry forward of losses</li>
        <li>Delay in refund processing</li>
      </ul>
      
      <h2>Best Practices</h2>
      <ul>
        <li>File your return before the due date</li>
        <li>Keep all documents ready in advance</li>
        <li>Start early to avoid last-minute rush</li>
        <li>E-verify immediately after filing</li>
      </ul>
    `,
    category: 'filing',
    tags: ['deadline', 'penalty', 'late-filing', 'due-date'],
    published: true,
    publishedAt: new Date('2024-02-10'),
    readTime: 5,
  },
];

async function seedHelpArticles() {
  try {
    enterpriseLogger.info('Starting help articles seed...');
    console.log('\n=== Seeding Help Articles ===\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    let created = 0;
    let skipped = 0;

    for (const articleData of helpArticles) {
      try {
        // Check if article with same title already exists
        const existing = await HelpArticle.findOne({
          where: { title: articleData.title },
        });

        if (existing) {
          console.log(`⏭️  Skipped: "${articleData.title}" (already exists)`);
          skipped++;
          continue;
        }

        // Create article
        const article = await HelpArticle.create({
          ...articleData,
          authorId: null, // Can be set to admin user ID if available
        });

        console.log(`✅ Created: "${article.title}"`);
        created++;
      } catch (error) {
        console.error(`❌ Failed to create "${articleData.title}":`, error.message);
        enterpriseLogger.error('Failed to seed help article', {
          title: articleData.title,
          error: error.message,
        });
      }
    }

    console.log(`\n=== Seed Summary ===`);
    console.log(`✅ Created: ${created}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📊 Total: ${helpArticles.length}\n`);

    enterpriseLogger.info('Help articles seed completed', { created, skipped });
    console.log('✅ Seeding completed successfully!\n');
    process.exit(0);
  } catch (error) {
    enterpriseLogger.error('Help articles seed failed', {
      error: error.message,
      stack: error.stack,
    });
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run seed
if (require.main === module) {
  seedHelpArticles();
}

module.exports = { seedHelpArticles };

