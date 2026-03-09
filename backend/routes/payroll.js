const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/payrollController');

router.get('/', auth, role('owner','admin','hr'), ctrl.getPayroll);
router.post('/process', auth, role('owner','admin','hr'), ctrl.processPayroll);
router.get('/salary-structure', auth, role('owner','admin','hr'), ctrl.getSalaryStructure);
router.get('/salary-structure/:employeeId', auth, role('owner','admin','hr'), ctrl.getSalaryStructure);
router.post('/salary-structure', auth, role('owner','admin','hr'), ctrl.setSalaryStructure);

module.exports = router;
