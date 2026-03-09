const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/recruitmentController');

router.get('/jobs', auth, ctrl.getJobs);
router.post('/jobs', auth, role('owner','admin','hr'), ctrl.createJob);
router.get('/candidates', auth, ctrl.getCandidates);
router.post('/candidates', auth, role('owner','admin','hr'), ctrl.createCandidate);
router.put('/candidates/:id/stage', auth, role('owner','admin','hr'), ctrl.updateCandidateStage);
router.post('/candidates/:id/hire', auth, role('owner','admin','hr'), ctrl.hireCandidateAsEmployee);

module.exports = router;
