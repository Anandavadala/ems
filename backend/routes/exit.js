const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/exitController');

router.get('/', auth, role('owner','admin','hr'), ctrl.getExitRecords);
router.post('/resign', auth, role('owner','admin','hr'), ctrl.submitResignation);
router.put('/:id/clearance', auth, role('owner','admin','hr'), ctrl.updateClearance);
router.put('/:id/settlement', auth, role('owner','admin','hr'), ctrl.updateSettlement);

module.exports = router;
