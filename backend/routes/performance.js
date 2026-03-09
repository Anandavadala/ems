const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/performanceController');

router.get('/', auth, ctrl.getReviews);
router.post('/', auth, role('owner','admin','hr','manager'), ctrl.createReview);
router.put('/:id/submit', auth, ctrl.submitSelfReview);
router.put('/:id/manager-review', auth, role('owner','admin','hr','manager'), ctrl.submitManagerReview);

module.exports = router;
