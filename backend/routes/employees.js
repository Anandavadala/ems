const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/employeeController');

router.get('/stats/dashboard', auth, ctrl.getDashboardStats);
router.get('/export/csv', auth, role('owner','admin','hr','manager'), ctrl.exportCSV);
router.get('/', auth, ctrl.getAllEmployees);
router.get('/:id', auth, ctrl.getEmployee);
router.post('/', auth, role('owner','admin','hr'), ctrl.createEmployee);
router.put('/:id', auth, role('owner','admin','hr','manager'), ctrl.updateEmployee);
router.delete('/:id', auth, role('owner','admin'), ctrl.deleteEmployee);

module.exports = router;
