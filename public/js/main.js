// Main Initialization and Event Listeners
// =======================================

// Main initialization function
function initializeApp() {
	// Initialize automation
	initializeAutomation();

	console.log('🚀 GhostOps Automation System initialized successfully!');
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
	initializeApp();
});
