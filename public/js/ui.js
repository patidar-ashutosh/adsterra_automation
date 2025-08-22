// UI Management Functions
// =======================

// This file is kept for compatibility but most functions are now handled by app.js
// Only essential UI functions that don't conflict are kept here

// Function to update total profiles summary (used by automation.js)
function updateTotalProfilesSummary() {
	const urlCount = document.querySelectorAll('.website-url-input').length;
	const profilesPerWebsite = parseInt(document.getElementById('profilesAtOnce').value) || 3;
	const cycles = parseInt(document.getElementById('openCount').value) || 3;

	const totalWebsites = document.getElementById('totalWebsites');
	const profilesPerWebsiteEl = document.getElementById('profilesPerWebsite');
	const totalProfiles = document.getElementById('totalProfiles');
	const totalSessions = document.getElementById('totalSessions');

	if (totalWebsites) totalWebsites.textContent = urlCount;
	if (profilesPerWebsiteEl) profilesPerWebsiteEl.textContent = profilesPerWebsite;
	if (totalProfiles) totalProfiles.textContent = urlCount * profilesPerWebsite;
	if (totalSessions) totalSessions.textContent = urlCount * profilesPerWebsite * cycles;
}

// Function to handle wait time logic (used by automation.js)
function handleWaitTimeLogic() {
	const minWaitTime = document.getElementById('minWaitTime');
	const maxWaitTime = document.getElementById('maxWaitTime');

	if (minWaitTime && maxWaitTime) {
		minWaitTime.addEventListener('input', () => {
			const minValue = parseInt(minWaitTime.value) || 30;
			const maxValue = Math.min(minValue + 10, 230);

			maxWaitTime.disabled = false;
			maxWaitTime.min = minValue + 10;
			maxWaitTime.value = maxValue;
		});
	}
}
