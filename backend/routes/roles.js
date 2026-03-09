const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/rolesController');

router.get('/', auth, ctrl.getRolesWithUsers);
router.post('/assign', auth, role('owner','admin'), ctrl.assignRole);
router.put('/remove', auth, role('owner','admin'), ctrl.removeFromRole);

module.exports = router;
