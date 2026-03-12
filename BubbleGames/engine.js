// 🔍 THE READER (Test Run Only)
async function testScriptRun() {
    try {
        const response = await fetch('main.bub');
        const script = await response.text();
        
        console.log("📜 SCRIPT DETECTED! Reading main.bub contents...");
        console.log("---------------------------------------");
        console.log(script); // This prints your commands
        console.log("---------------------------------------");
        console.log("✅ Connection Test: SUCCESS. The Brain can see the Soul.");
    } catch (error) {
        console.error("❌ Connection Test: FAILED. Check file names.");
    }
}

// Start the test
testScriptRun();
