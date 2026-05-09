/**
 * Family Routes — Multi-PAN family member management
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const FamilyService = require('../services/family/FamilyService');
const TaxBrainService = require('../services/tax/TaxBrainService');

router.get('/members', authenticateToken, authorize(['END_USER']), async (req, res, next) => {
  try {
    const members = await FamilyService.listMembers(req.user.userId);
    res.json({ success: true, data: members });
  } catch (err) { next(err); }
});

router.post('/members', authenticateToken, authorize(['END_USER']), async (req, res, next) => {
  try {
    const { pan, relationship, name, dob } = req.body;
    const member = await FamilyService.addMember(req.user.userId, { pan, relationship, name, dob });
    res.status(201).json({ success: true, data: member });
  } catch (err) { next(err); }
});

router.put('/members/:id', authenticateToken, authorize(['END_USER']), async (req, res, next) => {
  try {
    const { name, relationship, dob } = req.body;
    const member = await FamilyService.updateMember(req.user.userId, req.params.id, { name, relationship, dob });
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
});

router.delete('/members/:id', authenticateToken, authorize(['END_USER']), async (req, res, next) => {
  try {
    await FamilyService.removeMember(req.user.userId, req.params.id);
    res.json({ success: true, message: 'Family member removed' });
  } catch (err) { next(err); }
});

router.post('/members/:id/switch', authenticateToken, authorize(['END_USER']), async (req, res, next) => {
  try {
    const context = await FamilyService.getMemberContext(req.user.userId, req.params.id);
    res.json({ success: true, data: context });
  } catch (err) { next(err); }
});

router.get('/pack-eligibility', authenticateToken, authorize(['END_USER']), async (req, res, next) => {
  try {
    const result = await FamilyService.checkFamilyPackEligibility(req.user.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/optimization/:ay', authenticateToken, authorize(['END_USER']), async (req, res, next) => {
  try {
    const whispers = await TaxBrainService.analyzeFamilyOptimization(req.user.userId, req.params.ay);
    res.json({ success: true, data: whispers });
  } catch (err) { next(err); }
});

module.exports = router;
