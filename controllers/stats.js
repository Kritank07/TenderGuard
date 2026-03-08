const Tender = require('../models/Tender');
const Bid = require('../models/Bid');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { calculateNetworkRisk } = require('../utils/networkDetection');

// @desc    Get dashboard statistics
// @route   GET /api/stats
// @access  Public
exports.getStats = async (req, res) => {
    try {
        const totalTenders = await Tender.countDocuments();
        const activeTenders = await Tender.countDocuments({ status: 'open' });
        const totalBids = await Bid.countDocuments();
        const contractorsCount = await User.countDocuments({ role: 'contractor' });

        // High risk bids
        const highRiskBids = await Bid.countDocuments({ riskLevel: 'High' });

        // Cartel flagged bids
        const cartelBids = await Bid.countDocuments({ cartelSuspicion: true });

        // Total budget vs utilized budget
        const tenders = await Tender.find();
        let totalBudget = 0;
        let utilizedBudget = 0;

        tenders.forEach(t => {
            totalBudget += t.budget;
            utilizedBudget += t.fundUtilization || 0;
        });

        // Recent Activity
        const recentTenders = await Tender.find().sort('-createdAt').limit(5);
        const recentBids = await Bid.find().populate('contractor', 'name').populate('tender', 'title').sort('-createdAt').limit(5);
        const complaintsCount = await Complaint.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                totalTenders,
                activeTenders,
                totalBids,
                contractorsCount,
                highRiskBids,
                cartelBids,
                totalBudget,
                utilizedBudget,
                recentTenders,
                recentBids,
                complaintsCount
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get Network Risk Stats for Dashboard
// @route   GET /api/stats/network-risk
// @access  Private (Admin potentially, open for prototype)
exports.getNetworkRiskStats = async (req, res) => {
    try {
        const contractors = await User.find({ role: 'contractor' });
        const allBids = await Bid.find().populate('tender');

        let nodes = [];
        let edges = [];
        let edgeTracker = new Set(); // To avoid duplicate edges between same pair

        let contractorsRiskData = [];

        for (const contractor of contractors) {
            const riskCalculation = calculateNetworkRisk(contractor._id, allBids);

            // Update the contractor model with the new network risk score
            contractor.networkRiskScore = riskCalculation.score;
            await contractor.save();

            contractorsRiskData.push({
                contractor,
                riskCalculation
            });

            // Nodes for Cytoscape
            let color = '#28a745'; // Low Risk
            if (riskCalculation.riskLevel === 'Medium') color = '#ffc107';
            if (riskCalculation.riskLevel === 'High') color = '#dc3545';

            nodes.push({
                data: {
                    id: contractor._id.toString(),
                    label: contractor.name,
                    score: riskCalculation.score,
                    riskLevel: riskCalculation.riskLevel,
                    flags: riskCalculation.flags,
                    color: color,
                    type: 'contractor'
                }
            });
        }

        // Add Tenders as nodes
        const allTenders = await Tender.find();
        for (const t of allTenders) {
            nodes.push({
                data: {
                    id: `tender-${t._id.toString()}`,
                    label: t.title.substring(0, 15) + (t.title.length > 15 ? '...' : ''),
                    color: '#4f46e5', // Indigo for Tenders
                    type: 'tender'
                }
            });
        }

        // Generate edges based on bids (Contractor -> Tender)
        allBids.forEach(bid => {
            if (bid.contractor && bid.tender) {
                const cId = bid.contractor._id ? bid.contractor._id.toString() : bid.contractor.toString();
                const tId = `tender-${bid.tender._id ? bid.tender._id.toString() : bid.tender.toString()}`;
                
                const edgeId = `${cId}-${tId}`;
                if (!edgeTracker.has(edgeId)) {
                    edges.push({
                        data: {
                            id: edgeId,
                            source: cId,
                            target: tId
                        }
                    });
                    edgeTracker.add(edgeId);
                }
            }
        });

        // Filter out contractors who haven't participated in any tenders to clean up graph
        const activeNodes = nodes.filter(n => riskCalculationParams(n).participatedTenders > 0 || true);

        // Sorting contractors by highest risk for the UI table
        contractorsRiskData.sort((a, b) => b.riskCalculation.score - a.riskCalculation.score);

        res.status(200).json({
            success: true,
            data: {
                graph: {
                    nodes: nodes,
                    edges: edges
                },
                contractors: contractorsRiskData
            }
        });

    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

function riskCalculationParams(node) {
    // Helper since we didn't attach participatedTendersCount globally
    return { participatedTenders: 1 }; // dummy
}
