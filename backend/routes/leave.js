const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/leaveController');

router.get('/types', auth, ctrl.getLeaveTypes);
router.get('/requests', auth, ctrl.getLeaveRequests);
router.post('/request', auth, ctrl.createLeaveRequest);
router.put('/requests/:id/approve', auth, role('owner','admin','hr','manager'), ctrl.approveLeave);
router.get('/balance/:employeeId', auth, ctrl.getLeaveBalance);

module.exports = router;
