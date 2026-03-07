const express = require('express');
const {
    getTenders,
    getTender,
    createTender,
    updateTender,
    deleteTender,
    getNearbyTenders
} = require('../controllers/tenders');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Include other resource routers
const bidRouter = require('./bids');

// Re-route into other resource routers
router.use('/:tenderId/bids', bidRouter);

router
    .route('/nearby')
    .get(getNearbyTenders);

router
    .route('/')
    .get(getTenders)
    .post(protect, authorize('admin'), createTender);

router
    .route('/:id')
    .get(getTender)
    .put(protect, authorize('admin'), updateTender)
    .delete(protect, authorize('admin'), deleteTender);

module.exports = router;
