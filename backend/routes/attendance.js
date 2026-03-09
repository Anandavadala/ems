const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/attendanceController');

router.get('/', auth, ctrl.getAttendance);
router.post('/punch-in', auth, ctrl.punchIn);
router.post('/punch-out', auth, ctrl.punchOut);
router.post('/manual', auth, role('owner','admin','hr','manager'), ctrl.manualEntry);

module.exports = router;
