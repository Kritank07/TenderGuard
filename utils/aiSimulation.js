const { calculateTrustScore } = require('./trustScoring');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

exports.calculateRiskScore = async (bid, allBids, contractorInfo, tenderBudget) => {
    try {
        const prompt = `
        You are an AI assistant for a tendering platform. Your job is to analyze a submitted bid and assign a risk score from 0 to 100 (where 0 is no risk, 100 is extreme risk).
        
        Tender Budget: ${tenderBudget}
        Contractor Info: ${JSON.stringify(contractorInfo)}
        Target Bid: ${JSON.stringify(bid)}
        Other Bids for this Tender: ${JSON.stringify(allBids)}
        
        Please return a valid JSON object with the following structure:
        {
            "score": <number between 0 and 100>,
            "flags": ["<string describing a risk factor>", "<another string>"]
        }
        Do not output any markdown or formatting, just the raw JSON object.
        `;
        
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        const parsed = JSON.parse(responseText);
        
        return {
            score: Math.min(parsed.score || 0, 100),
            flags: parsed.flags || []
        };
    } catch (error) {
        console.error("Gemini calculateRiskScore error, falling back to basic logic:", error);
        let score = 0;
        let flags = ['AI risk analysis failed, using fallback logic'];
        if (bid.quotedPrice > tenderBudget) {
            score += 40;
            flags.push('Quoted price exceeds tender budget');
        }
        return { score, flags };
    }
};

exports.detectFakeDocuments = async (documents) => {
    try {
        if (!documents || documents.length === 0) return [];
        
        const prompt = `
        You are a document irregularity detection AI. Look at the following list of uploaded document metadata for a tender bid.
        Identify any suspicious file names (e.g. dummy, fake) or potential metadata anomalies.
        
        Documents: ${JSON.stringify(documents)}
        
        Return a valid JSON array of strings, where each string is a warning flag about a document. If none are found, return an empty array [].
        Do not output any markdown or formatting, just the raw JSON array.
        `;
        
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        const parsed = JSON.parse(responseText);
        
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Gemini detectFakeDocuments error, falling back to empty:", error);
        return [];
    }
};

exports.detectCartel = async (bid, allBids) => {
    try {
        if (!allBids || allBids.length === 0) return { isCartel: false, cartelFlags: [] };
        
        const prompt = `
        You are a cartel behavior detection AI for a tendering platform. Compare the newly submitted bid against the previous bids.
        Look for signs of collusion, such as prices suspiciously close (e.g., within 1%) or identical submission patterns.
        
        Newly Submitted Bid: ${JSON.stringify(bid)}
        All Bids on this Tender: ${JSON.stringify(allBids)}
        
        Return a valid JSON object with the following structure:
        {
            "isCartel": <boolean>,
            "cartelFlags": ["<string describing suspicious cartel-like behavior>"]
        }
        Do not output any markdown or formatting, just the raw JSON object.
        `;
        
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        const parsed = JSON.parse(responseText);
        
        return {
            isCartel: parsed.isCartel || false,
            cartelFlags: parsed.cartelFlags || []
        };
    } catch (error) {
        console.error("Gemini detectCartel error, falling back to false:", error);
        return { isCartel: false, cartelFlags: [] };
    }
};

exports.calculateFinalScore = (bid, tender, contractor) => {
    // 40% Price competitiveness, 60% Contractor Trust Score
    // For price, lower price = higher score (up to a limit, compared to budget)

    const priceRatio = bid.quotedPrice / tender.budget;
    let priceScore = 40 * (1 - (priceRatio - 0.5)); // simplistic logic
    if (priceScore > 40) priceScore = 40;
    if (priceScore < 0) priceScore = 0;

    // Calculate dynamic Trust Score for the contractor
    const trustScore = calculateTrustScore(contractor, bid.riskScore);

    // 60% of Final Score is based on Trust Score
    const trustScoreValue = 60 * (trustScore / 100);

    return (priceScore + trustScoreValue).toFixed(2);
};
