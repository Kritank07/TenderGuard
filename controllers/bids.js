const Bid = require('../models/Bid');
const Tender = require('../models/Tender');
const User = require('../models/User');
const aiSimulation = require('../utils/aiSimulation');

// @desc    Get bids for a tender
// @route   GET /api/tenders/:tenderId/bids
// @access  Private
exports.getBids = async (req, res) => {
    try {
        let query;

        if (req.user.role === 'admin') {
            query = Bid.find({ tender: req.params.tenderId }).populate({
                path: 'contractor',
                select: 'name email experience pastPerformance delayHistory'
            }).sort('-finalScore'); // sort by final score descending
        } else if (req.user.role === 'contractor') {
            query = Bid.find({ tender: req.params.tenderId, contractor: req.user.id });
        } else {
            // Public can only see winning bid or masked details, simplified for prototype:
            query = Bid.find({ tender: req.params.tenderId }).select('contractor finalScore riskLevel flags');
        }

        const bids = await query;

        res.status(200).json({
            success: true,
            count: bids.length,
            data: bids
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Submit a bid
// @route   POST /api/tenders/:tenderId/bids
// @access  Private (Contractor)
exports.createBid = async (req, res) => {
    try {
        req.body.tender = req.params.tenderId;
        req.body.contractor = req.user.id;
        
        // Coerce formData fields back to numbers
        if (req.body.quotedPrice) req.body.quotedPrice = Number(req.body.quotedPrice);
        if (req.body.timelineDays) req.body.timelineDays = Number(req.body.timelineDays);

        const tender = await Tender.findById(req.params.tenderId);

        if (!tender) {
            return res.status(404).json({ success: false, error: 'Tender not found' });
        }

        if (new Date(tender.deadline) < new Date()) {
            return res.status(400).json({ success: false, error: 'Tender deadline passed, cannot submit bid' });
        }

        // Process uploaded documents
        let docs = [];
        if (req.files && req.files.length > 0) {
            docs = req.files.map(file => ({
                name: file.filename,
                path: file.path,
                originalName: file.originalname
            }));
        }
        req.body.documents = docs;

        // Fetch user info for scoring
        const contractor = await User.findById(req.user.id);
        const allBids = await Bid.find({ tender: req.params.tenderId });

        // Run AI logic natively
        const fakeDocFlags = await aiSimulation.detectFakeDocuments(docs);
        const { isCartel, cartelFlags } = await aiSimulation.detectCartel(req.body, allBids);
        const { score, flags } = await aiSimulation.calculateRiskScore(req.body, allBids, contractor, tender.budget);

        req.body.fakeDocFlags = fakeDocFlags;
        req.body.cartelSuspicion = isCartel;
        req.body.riskScore = score;
        req.body.flags = [...flags, ...cartelFlags, ...fakeDocFlags];

        if (score > 70) {
            req.body.riskLevel = 'High';
        } else if (score > 30) {
            req.body.riskLevel = 'Medium';
        } else {
            req.body.riskLevel = 'Low';
        }

        // Create the bid initially
        let bid = await Bid.create(req.body);

        // Recalculate final score and update bid
        bid.finalScore = aiSimulation.calculateFinalScore(bid, tender, contractor);
        await bid.save();

        res.status(201).json({
            success: true,
            data: bid
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update a bid
// @route   PUT /api/bids/:id
// @access  Private (Contractor)
exports.updateBid = async (req, res) => {
    try {
        let bid = await Bid.findById(req.params.id);

        if (!bid) {
            return res.status(404).json({ success: false, error: 'Bid not found' });
        }

        // Make sure user is bid owner
        if (bid.contractor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized to update this bid' });
        }

        const tender = await Tender.findById(bid.tender);

        if (new Date(tender.deadline) < new Date()) {
            return res.status(400).json({ success: false, error: 'Tender deadline passed, cannot update bid' });
        }

        // Only allow updating certain fields
        if (req.body.quotedPrice) bid.quotedPrice = req.body.quotedPrice;
        if (req.body.timelineDays) bid.timelineDays = req.body.timelineDays;

        // Re-run AI logic if price/timeline changed
        if (req.body.quotedPrice || req.body.timelineDays) {
            const contractor = await User.findById(req.user.id);
            const allBids = await Bid.find({ tender: bid.tender });

            // We need a complete bid object for simulation
            const simulatedBidData = {
                ...bid.toObject(),
                quotedPrice: req.body.quotedPrice ? Number(req.body.quotedPrice) : bid.quotedPrice,
                timelineDays: req.body.timelineDays ? Number(req.body.timelineDays) : bid.timelineDays,
            };

            const { isCartel, cartelFlags } = await aiSimulation.detectCartel(simulatedBidData, allBids);
            const { score, flags } = await aiSimulation.calculateRiskScore(simulatedBidData, allBids, contractor, tender.budget);

            bid.cartelSuspicion = isCartel;
            bid.riskScore = score;

            // Retain fakeDocFlags as they aren't changing on text update
            bid.flags = [...flags, ...cartelFlags, ...(bid.fakeDocFlags || [])];

            if (score > 70) {
                bid.riskLevel = 'High';
            } else if (score > 30) {
                bid.riskLevel = 'Medium';
            } else {
                bid.riskLevel = 'Low';
            }

            bid.finalScore = aiSimulation.calculateFinalScore(bid, tender, contractor);
        }

        await bid.save();

        res.status(200).json({
            success: true,
            data: bid
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete a bid
// @route   DELETE /api/bids/:id
// @access  Private (Contractor)
exports.deleteBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.id);

        if (!bid) {
            return res.status(404).json({ success: false, error: 'Bid not found' });
        }

        // Make sure user is bid owner
        if (bid.contractor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized to delete this bid' });
        }

        const tender = await Tender.findById(bid.tender);

        if (new Date(tender.deadline) < new Date()) {
            return res.status(400).json({ success: false, error: 'Tender deadline passed, cannot delete bid' });
        }

        await bid.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
