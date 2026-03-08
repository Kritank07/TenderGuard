const User = require('../models/User');

// @desc    Synchronize Auth0 user with local database
// @route   POST /api/auth/sync
// @access  Private (Needs valid Auth0 Token)
exports.sync = async (req, res) => {
    try {
        const auth0Id = req.auth.payload.sub;
        
        // Extract email and name from request body
        const { email, name } = req.body;
        
        if (!auth0Id) {
            return res.status(400).json({ success: false, error: 'No Auth0 ID found in token payload' });
        }

        let user = await User.findOne({ auth0Id });

        if (!user) {
            // Also check by email to map existing users
            if (email) {
                user = await User.findOne({ email });
            }
            
            if (user) {
                user.auth0Id = auth0Id;
                await user.save();
            } else {
                // Create new user
                user = await User.create({
                    auth0Id,
                    email: email || `${auth0Id}@placeholder.com`,
                    name: name || 'Citizen'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        console.error('Sync Error:', err);
        res.status(500).json({ success: false, error: 'Server Error during user sync' });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user
    });
};
