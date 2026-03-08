require('dotenv').config();
const aiSimulation = require('./utils/aiSimulation');

async function testGemini() {
    console.log("Testing calculateRiskScore...");
    const bid = { quotedPrice: 90000 };
    const allBids = [{ quotedPrice: 110000 }, { quotedPrice: 115000 }];
    const contractorInfo = { delayHistory: 0, experience: 5 };
    const tenderBudget = 100000;
    
    const riskResult = await aiSimulation.calculateRiskScore(bid, allBids, contractorInfo, tenderBudget);
    console.log("Risk Score Result:", riskResult);
    
    console.log("\nTesting detectFakeDocuments...");
    const docs = [{ originalName: "dummy_doc.pdf" }, { originalName: "real_cert.pdf" }];
    const docResult = await aiSimulation.detectFakeDocuments(docs);
    console.log("Document Flags:", docResult);
    
    console.log("\nTesting detectCartel...");
    const cartelResult = await aiSimulation.detectCartel(bid, allBids);
    console.log("Cartel Result:", cartelResult);
}

testGemini().then(() => console.log("Done")).catch(console.error);
