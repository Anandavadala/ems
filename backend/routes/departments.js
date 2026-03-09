const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/departmentController');

router.get('/', auth, ctrl.getDepartments);
router.get('/org-chart', auth, ctrl.getOrgChart);
router.post('/', auth, role('owner','admin','hr'), ctrl.createDepartment);
router.put('/:id', auth, role('owner','admin','hr'), ctrl.updateDepartment);

module.exports = router;
