// Automation Control Functions
// =============================

// Track current cycle for UI updates
let currentCycle = 1; // Initialize to 1 to match backend

// Function to check automation status
async function checkStatus() {
	const statusDiv = document.getElementById('status');
	const progressFill = document.getElementById('progressFill');
	const progressText = document.getElementById('progressText');
	const cycleText = document.getElementById('cycleText');
	const completedText = document.getElementById('completedText');
	const failedText = document.getElementById('failedText');
	const successText = document.getElementById('successText');

	try {
		const response = await fetch('/automation-status');
		const data = await response.json();

		if (data.status === 'completed') {
			statusDiv.innerText = `Status: Automation completed ✅ (${data.completedWindows}/${
				data.totalWindows
			} profiles completed, ${data.successWindows || 0} successful, ${
				data.failedWindows || 0
			} failed across all cycles)`;
			setAutomationState(false);
		} else if (data.activeWindows > 0) {
			// Create status with only active window details
			let statusText = `Running: ${data.activeWindows} profiles`;

			// Add active window details in compact format
			if (data.activeWindowDetails && data.activeWindowDetails.length > 0) {
				const activeDetails = data.activeWindowDetails
					.map((w) => `P${w.windowIndex}(C${w.cycle},U${w.urlIndex || 1})`)
					.join(', ');

				// Update profile times in log headers
				updateProfileTimes(data.activeWindowDetails);
			}

			statusDiv.innerText = statusText;

			// Update progress bar
			progressFill.style.width = `${data.progress}%`;
			progressText.textContent = `Progress: ${data.progress}%`;
			cycleText.textContent = `Current Cycle: ${data.currentCycle || 1}`;
			completedText.textContent = `Completed: ${data.completedWindows}/${data.totalWindows}`;
			successText.textContent = `Success: ${data.successWindows || 0}`;
			failedText.textContent = `Failed: ${data.failedWindows || 0}`;

			setAutomationState(true);
		} else if (data.status === 'idle') {
			statusDiv.innerText = 'Status: Ready to start automation...';
			setAutomationState(false);
			currentCycle = 1; // Reset cycle counter to 1
		} else {
			statusDiv.innerText = 'Status: Preparing automation cycles...';
			setAutomationState(true);
		}

		setTimeout(checkStatus, 500);
	} catch (error) {
		console.error('Status check failed:', error);
		statusDiv.innerText = 'Status: Error checking status...';
	}
}

// Function to handle form submission
async function handleFormSubmission(e) {
	e.preventDefault();

	// Validate all URLs first
	const invalidUrls = validateAllURLs();
	if (invalidUrls.length > 0) {
		const errorMessage = `Please fix the following invalid URLs:\n${invalidUrls
			.map((item) => `${item.index}. ${item.url}`)
			.join('\n')}`;
		alert(errorMessage);
		return;
	}

	// Validate wait times
	if (!validateWaitTimes()) {
		return;
	}

	const form = e.target;
	const formData = new FormData(form);
	const payload = Object.fromEntries(formData.entries());

	// Collect all URLs
	const urlInputs = document.querySelectorAll('.website-url-input');
	const urls = Array.from(urlInputs)
		.map((input) => input.value.trim())
		.filter((url) => url);

	// Validate that we have at least one URL
	if (urls.length === 0) {
		alert('Please enter at least one website URL');
		return;
	}

	// Show start confirmation popup
	const startContent = `
		<p style="margin-bottom: 20px; color: #ff9800; font-weight: 600;">Please review your automation settings:</p>
		<div class="data-item">
			<span class="data-label">Total Websites:</span>
			<span class="data-value">${urls.length}</span>
		</div>
		<div class="data-item">
			<span class="data-label">Website URLs:</span>
			<span class="data-value" style="max-width: 300px; word-break: break-all;">
				${urls.map((url, index) => `${index + 1}. ${url}`).join('<br>')}
			</span>
		</div>
		<div class="data-item">
			<span class="data-label">Browser:</span>
			<span class="data-value">${payload.browser}</span>
		</div>
		<div class="data-item">
			<span class="data-label">Cycles:</span>
			<span class="data-value">${payload.openCount}</span>
		</div>
		<div class="data-item">
			<span class="data-label">Profiles per Website:</span>
			<span class="data-value">${payload.profilesAtOnce}</span>
		</div>
		<div class="data-item">
			<span class="data-label">Loading Timeout:</span>
			<span class="data-value">${payload.timeout}s</span>
		</div>
		<div class="data-item">
			<span class="data-label">Session Duration:</span>
			<span class="data-value">${payload.minWaitTime}-${payload.maxWaitTime}s</span>
		</div>
		<p style="margin-top: 20px; color: #4caf50; font-weight: 600;">Total Profiles: ${
			urls.length * payload.profilesAtOnce
		}</p>
		<p style="margin-top: 10px; color: #2196f3; font-weight: 600;">Total Sessions: ${
			urls.length * payload.profilesAtOnce * payload.openCount
		}</p>
	`;

	showPopup('🚀 Start Website Automation', startContent, 'Start Automation');

	// Handle confirmation
	const popupConfirm = document.getElementById('popupConfirm');
	popupConfirm.onclick = async () => {
		hidePopup();

		// Get total profiles count and create log areas
		const totalProfiles = urls.length * parseInt(payload.profilesAtOnce);
		createProfileLogs(totalProfiles);

		// Immediately set automation state to prevent button flickering
		setAutomationState(true);
		const statusDiv = document.getElementById('status');
		statusDiv.innerText = 'Status: Starting automation...';

		try {
			// Prepare payload with URLs array
			const automationPayload = {
				...payload,
				websiteURLs: urls
			};

			const res = await fetch('/open-url', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(automationPayload)
			});

			const result = await res.json();

			if (result.success) {
				// Clear any existing logs and add initial messages
				clearAllProfileLogs();
				for (let i = 1; i <= totalProfiles; i++) {
					appendProfileLog(i, `🚀 Starting Profile ${i}`);
					appendProfileLog(i, `⏳ Waiting for automation to start...`);
				}
			} else {
				console.error(`Failed: ${result.error}`);
				// Reset state if automation failed to start
				setAutomationState(false);
				statusDiv.innerText = 'Status: Failed to start automation';
			}
		} catch (err) {
			console.error(`Error: ${err.message}`);
			// Reset state if there was an error
			setAutomationState(false);
			statusDiv.innerText = 'Status: Error starting automation';
		}
	};
}

// Function to handle stop automation
async function handleStopAutomation() {
	// Show stop confirmation popup
	const stopContent = `
		<p style="margin-bottom: 20px; color: #f44336; font-weight: 600;">⚠️ Are you sure you want to stop the automation?</p>
		<p style="color: #ff9800; margin-bottom: 15px;">This will:</p>
		<ul style="color: #ffffff; margin-left: 20px; margin-bottom: 20px;">
			<li>Close all running browser windows</li>
			<li>Stop all active profiles</li>
			<li>End the current automation cycle</li>
		</ul>
		<p style="color: #4caf50; font-weight: 600;">Any completed profiles will be preserved.</p>
	`;

	showPopup('🛑 Stop Automation', stopContent, 'Stop Automation', true);

	// Handle stop confirmation
	const popupConfirm = document.getElementById('popupConfirm');
	popupConfirm.onclick = async () => {
		hidePopup();

		try {
			const response = await fetch('/stop-automation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			const result = await response.json();

			if (result.success) {
				const statusDiv = document.getElementById('status');
				statusDiv.innerText = 'Status: Automation stopped';
				setAutomationState(false);
			} else {
				console.error(`Failed to stop automation: ${result.error}`);
			}
		} catch (err) {
			console.error(`Error stopping automation: ${err.message}`);
		}
	};
}

// Initialize automation controls
function initializeAutomation() {
	const form = document.getElementById('automationForm');
	const stopButton = document.getElementById('stopButton');

	// Form submission handler
	form.addEventListener('submit', handleFormSubmission);

	// Stop automation button handler
	stopButton.addEventListener('click', handleStopAutomation);

	// Start status checking
	checkStatus();

	// Connect to log stream when page loads
	connectToLogStream();
}
