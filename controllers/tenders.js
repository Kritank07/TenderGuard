const Tender = require('../models/Tender');

// @desc    Get all tenders
// @route   GET /api/tenders
// @access  Public
exports.getTenders = async (req, res) => {
    try {
        const tenders = await Tender.find().sort('-createdAt');
        res.status(200).json({
            success: true,
            count: tenders.length,
            data: tenders
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get single tender
// @route   GET /api/tenders/:id
// @access  Public
exports.getTender = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);

        if (!tender) {
            return res.status(404).json({ success: false, error: 'Tender not found' });
        }

        res.status(200).json({
            success: true,
            data: tender
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create new tender
// @route   POST /api/tenders
// @access  Private (Admin only)
exports.createTender = async (req, res) => {
    try {
        const tender = await Tender.create(req.body);

        res.status(201).json({
            success: true,
            data: tender
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update tender
// @route   PUT /api/tenders/:id
// @access  Private (Admin only)
exports.updateTender = async (req, res) => {
    try {
        let tender = await Tender.findById(req.params.id);

        if (!tender) {
            return res.status(404).json({ success: false, error: 'Tender not found' });
        }

        // Auto-lock if deadline passed handled on frontend/before update, but can enforce here
        if (new Date(tender.deadline) < new Date()) {
            return res.status(400).json({ success: false, error: 'Tender deadline passed, cannot edit' });
        }

        tender = await Tender.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: tender
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete tender
// @route   DELETE /api/tenders/:id
// @access  Private (Admin only)
exports.deleteTender = async (req, res) => {
    try {
        const tender = await Tender.findByIdAndDelete(req.params.id);

        if (!tender) {
            return res.status(404).json({ success: false, error: 'Tender not found' });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get tenders within a radius
// @route   GET /api/tenders/nearby
// @access  Public
exports.getNearbyTenders = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ success: false, error: 'Please provide lat and lng' });
        }

        // Default radius to 500 meters if not provided
        const maxDistance = radius ? parseInt(radius) : 500;
        
        // Fetch all active/open or awarded tenders that have a location with lat/lng
        const tenders = await Tender.find({
            status: { $in: ['open', 'awarded'] },
            'location.lat': { $exists: true },
            'location.lng': { $exists: true }
        });

        // Haversine formula to calculate distance
        const toRad = (value) => (value * Math.PI) / 180;
        const R = 6371e3; // Earth radius in meters

        const nearbyTenders = tenders.filter(tender => {
            const tLat = tender.location.lat;
            const tLng = tender.location.lng;

            const dLat = toRad(tLat - parseFloat(lat));
            const dLng = toRad(tLng - parseFloat(lng));

            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(toRad(parseFloat(lat))) * Math.cos(toRad(tLat)) *
                      Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            const distance = R * c;

            // Include distance in the object for frontend reference
            tender._doc.distance = Math.round(distance);

            return distance <= maxDistance;
        });

        // Sort by closest
        nearbyTenders.sort((a, b) => a._doc.distance - b._doc.distance);

        res.status(200).json({
            success: true,
            count: nearbyTenders.length,
            data: nearbyTenders
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

