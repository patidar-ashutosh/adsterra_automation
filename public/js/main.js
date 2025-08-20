// Main Initialization and Event Listeners
// =======================================

// Initialize popup event listeners
function initializePopups() {
	const popupClose = document.getElementById('popupClose');
	const popupCancel = document.getElementById('popupCancel');
	const popupOverlay = document.getElementById('popupOverlay');

	// Popup event listeners
	popupClose.addEventListener('click', hidePopup);
	popupCancel.addEventListener('click', hidePopup);
	popupOverlay.addEventListener('click', (e) => {
		if (e.target === popupOverlay) {
			hidePopup();
		}
	});
}

// Main initialization function
function initializeApp() {
	// Initialize popups
	initializePopups();

	// Initialize UI
	initializeUI();

	// Initialize automation
	initializeAutomation();

	console.log('🚀 Website Automation Package initialized successfully!');
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
	initializeApp();
});
