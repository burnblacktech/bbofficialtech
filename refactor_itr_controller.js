const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'src', 'controllers', 'ITRController.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Define markers
const startMarker = 'async generateITR4JsonWithPipeline';
const endMarker = 'async downloadExportedJson';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find markers');
    console.error('Start found:', startIndex !== -1);
    console.error('End found:', endIndex !== -1);
    process.exit(1);
}

// Find the preceding comment for generateITR4... to delete that too
// Look backwards for "Helper: Generate ITR-4..."
// Or just cut from startIndex back to previous blank line?
// Let's cut from `  /**` before startMarker.
const commentStartSearch = content.lastIndexOf('/**', startIndex);
const actualStart = commentStartSearch !== -1 ? commentStartSearch : startIndex;

// Find the comment for downloadExportedJson to preserve it
// The endMarker is the function definition. 
// We want to stop BEFORE the comment for downloadExportedJson.
// "/**\n   * Download exported JSON file"
const endCommentSearch = content.lastIndexOf('/**', endIndex);
const actualEnd = endCommentSearch !== -1 ? endCommentSearch : endIndex;

console.log(`Replacing range: ${actualStart} to ${actualEnd}`);

// New Content
const newMethod = `  // =====================================================
  // EXPORT ITR
  // =====================================================

  /**
   * Export ITR data as government-compliant JSON
   * POST /api/itr/export
   */
  async exportITRJson(req, res) {
    try {
      const userId = req.user.userId;
      const { filingId } = req.body; 

      if (!filingId) {
        return validationErrorResponse(res, { filingId: 'filingId is required' });
      }

      const result = await itrExportService.export(userId, filingId, { role: req.user.role });
      
      return successResponse(res, result, 'ITR JSON exported successfully');
    } catch (error) {
       enterpriseLogger.error('exportITRJson failed', { error: error.message, userId: req.user?.userId });
       return error.statusCode ? errorResponse(res, error, error.statusCode) : errorResponse(res, error, 500);
    }
  }

`;

const newContent = content.slice(0, actualStart) + newMethod + content.slice(actualEnd);

// 2. Add Lock Comment
const header = `// CONTROLLER IS A ROUTER ONLY.
// ALL BUSINESS LOGIC LIVES IN SERVICES OR DOMAIN CORE.
// DO NOT ADD LOGIC HERE.

`;

// Insert after imports? Or at very top?
// File starts with `// =================...`
// scan for first line?
const finalContent = header + newContent;

fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('Successfully refactored ITRController.js');
