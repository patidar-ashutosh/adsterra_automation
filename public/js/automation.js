// Automation Control Functions
// =============================

// Track current cycle for UI updates
let currentCycle = 1; // Initialize to 1 to match backend
let completionPopupShown = false; // Flag to prevent multiple completion popups

// Function to check automation status
async function checkStatus() {
	const logsCycleText = document.getElementById('logsCycleText');
	const logsProgressText = document.getElementById('logsProgressText');
	const logsCompletedText = document.getElementById('logsCompletedText');
	const logsFailedText = document.getElementById('logsFailedText');
	const logsSuccessText = document.getElementById('logsSuccessText');

	try {
		const response = await fetch('/automation-status');
		const data = await response.json();

		// Check for cycle change
		const newCycle = data.currentCycle || 1;
		if (newCycle !== currentCycle) {
			// Show cycle completion message for the previous cycle (only if it's not the first cycle)
			if (currentCycle > 1 && typeof showCycleCompletionMessage === 'function') {
				const completedProfiles = data.completedWindows || 0;
				const totalProfiles = data.totalWindows || 0;
				showCycleCompletionMessage(currentCycle, completedProfiles, totalProfiles);
			}

			// Show preparation message for new cycle (only if it's not the first cycle)
			if (newCycle > 1 && typeof showCyclePreparationMessage === 'function') {
				showCyclePreparationMessage(newCycle);
			}

			currentCycle = newCycle;
		}

		// Check if we're transitioning from waiting to running/preparing
		// This means the 5-second delay has ended and the cycle is starting
		if (data.status === 'running' || data.status === 'preparing') {
			// Hide any preparation messages immediately when cycle starts
			if (typeof hideCyclePreparationMessage === 'function') {
				hideCyclePreparationMessage();
			}
		}

		if (data.status === 'completed' && !completionPopupShown) {
			// Set flag to prevent multiple popups
			completionPopupShown = true;

			// Show completion popup first (like start/stop automation)
			const completionContent = `
				<p style="margin-bottom: 20px; color: #4caf50; font-weight: 600;">🎉 Automation Completed Successfully!</p>
				<div class="data-item">
					<span class="data-label">Total Profiles:</span>
					<span class="data-value">${data.totalWindows}</span>
				</div>
				<div class="data-item">
					<span class="data-label">Completed:</span>
					<span class="data-value">${data.completedWindows}</span>
				</div>
				<div class="data-item">
					<span class="data-label">Successful:</span>
					<span class="data-value">${data.successWindows || 0}</span>
				</div>
				<div class="data-item">
					<span class="data-label">Failed:</span>
					<span class="data-value">${data.failedWindows || 0}</span>
				</div>
				<div class="data-item">
					<span class="data-label">Total Cycles:</span>
					<span class="data-value">${data.totalCycles || 3}</span>
				</div>
				<p style="margin-top: 20px; color: #2196f3; font-weight: 600;">Redirecting to automation panel in 5 seconds...</p>
			`;

			// Use window.showPopup if available - with OK button for user control
			if (typeof window.showPopup === 'function') {
				// Show popup with OK button for user control
				window.showPopup('🎯 Automation Completed', completionContent, 'OK');

				// Set up OK button click handler
				setTimeout(() => {
					const popupConfirm = document.getElementById('popupConfirm');
					if (popupConfirm) {
						popupConfirm.onclick = () => {
							if (typeof window.hidePopup === 'function') {
								window.hidePopup();
							}
						};
					}
				}, 100);

				// Auto-hide popup after 5 seconds as fallback
				setTimeout(() => {
					if (typeof window.hidePopup === 'function') {
						window.hidePopup();
					}
				}, 5000);
			} else {
				// Fallback to alert
				alert(
					`Automation completed! ${data.completedWindows}/${
						data.totalWindows
					} profiles completed, ${data.successWindows || 0} successful, ${
						data.failedWindows || 0
					} failed across all cycles.`
				);
			}

			// Update logs status area with final values
			if (logsCycleText)
				logsCycleText.textContent = `${data.currentCycle || 1} / ${data.totalCycles || 3}`;
			if (logsProgressText) logsProgressText.textContent = `100%`;
			if (logsCompletedText)
				logsCompletedText.textContent = `${data.completedWindows}/${data.totalWindows}`;
			if (logsSuccessText) logsSuccessText.textContent = data.successWindows || 0;
			if (logsFailedText) logsFailedText.textContent = data.failedWindows || 0;

			// Update progress bar to 100%
			const progressBar = document.getElementById('logsProgressBar');
			if (progressBar) {
				progressBar.style.width = `100%`;
			}

			setAutomationState(false);

			// Wait 5 seconds then redirect back to automation panel (increased from 3s to 5s)
			setTimeout(() => {
				// Switch back to automation panel
				document.querySelectorAll('.panel').forEach((p) => p.classList.remove('show'));
				document.getElementById('panel-automation').classList.add('show');

				// Show automation summary section
				const automationSummarySection = document.querySelector(
					'.automation-config-section'
				);
				if (automationSummarySection) {
					automationSummarySection.style.display = 'flex';
				}

				// Show toolbar
				const toolbar = document.querySelector('.toolbar');
				if (toolbar) {
					toolbar.style.display = 'flex';
				}

				// Show automation navigation
				const automationNav = document.querySelector('[data-panel="automation"]');
				if (automationNav) {
					automationNav.style.display = 'flex';
					automationNav.classList.add('active');
				}

				// Hide logs navigation
				const logsNav = document.querySelector('[data-panel="logs"]');
				if (logsNav) {
					logsNav.style.display = 'none';
					logsNav.classList.remove('active');
				}

				// Reset automation state
				document.body.classList.remove('automation-running');
			}, 5000); // Increased to 5 seconds

			// Don't stop status checking - continue for real-time updates
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

			// Update logs status area with real-time values
			if (logsCycleText)
				logsCycleText.textContent = `${data.currentCycle || 1} / ${data.totalCycles || 3}`;
			if (logsProgressText) logsProgressText.textContent = `${data.progress || 0}%`;
			if (logsCompletedText)
				logsCompletedText.textContent = `${data.completedWindows}/${data.totalWindows}`;
			if (logsSuccessText) logsSuccessText.textContent = data.successWindows || 0;
			if (logsFailedText) logsFailedText.textContent = data.failedWindows || 0;

			// Update progress bar with real-time progress
			const progressBar = document.getElementById('logsProgressBar');
			if (progressBar) {
				progressBar.style.width = `${data.progress || 0}%`;
			}

			setAutomationState(true);
		} else if (data.status === 'idle') {
			setAutomationState(false);
			currentCycle = 1; // Reset cycle counter to 1
		} else if (data.status === 'waiting') {
			// We're in the 5-second delay between cycles
			// Show next cycle preparation message
			if (typeof showCyclePreparationMessage === 'function') {
				showCyclePreparationMessage(data.nextCycle || data.currentCycle + 1);
			}

			// Update logs status area even during waiting state
			if (data.completedWindows !== undefined && data.totalWindows !== undefined) {
				if (logsCycleText)
					logsCycleText.textContent = `${data.currentCycle || 1} / ${
						data.totalCycles || 3
					}`;
				if (logsProgressText) logsProgressText.textContent = `${data.progress || 0}%`;
				if (logsCompletedText)
					logsCompletedText.textContent = `${data.completedWindows}/${data.totalWindows}`;
				if (logsSuccessText) logsSuccessText.textContent = data.successWindows || 0;
				if (logsFailedText) logsFailedText.textContent = data.failedWindows || 0;

				// Update progress bar
				const progressBar = document.getElementById('logsProgressBar');
				if (progressBar) {
					progressBar.style.width = `${data.progress || 0}%`;
				}
			}

			setAutomationState(true);
		} else if (data.status === 'running' || data.status === 'preparing') {
			// Cycle has started or is preparing - hide any preparation messages
			if (typeof hideCyclePreparationMessage === 'function') {
				hideCyclePreparationMessage();
			}

			setAutomationState(true);

			// Update logs status values even when preparing for next cycle
			if (data.completedWindows !== undefined && data.totalWindows !== undefined) {
				if (logsCycleText)
					logsCycleText.textContent = `${data.currentCycle || 1} / ${
						data.totalCycles || 3
					}`;
				if (logsProgressText) logsProgressText.textContent = `${data.progress || 0}%`;
				if (logsCompletedText)
					logsCompletedText.textContent = `${data.completedWindows}/${data.totalWindows}`;
				if (logsSuccessText) logsSuccessText.textContent = data.successWindows || 0;
				if (logsFailedText) logsFailedText.textContent = data.failedWindows || 0;

				// Update progress bar
				const progressBar = document.getElementById('logsProgressBar');
				if (progressBar) {
					progressBar.style.width = `${data.progress || 0}%`;
				}
			}
		} else {
			// Other statuses
			setAutomationState(true);
		}

		// Continue checking status every 500ms for real-time updates
		setTimeout(checkStatus, 500);
	} catch (error) {
		console.error('Status check failed:', error);
		// Continue checking even if there's an error
		setTimeout(checkStatus, 500);
	}
}

// Function to handle form submission
async function handleFormSubmission(e) {
	e.preventDefault();

	// Use comprehensive validation
	if (!validateForm()) {
		return;
	}

	// Get validated URLs from validation
	const urlValidation = validateAllURLs();
	const urls = urlValidation.validUrls;

	// Validate that we have at least one URL
	if (urls.length === 0) {
		alert('Please enter at least one valid website URL');
		return;
	}

	// Get form values directly from elements to ensure we have all data
	const browser = document.getElementById('browser')?.value || 'random';
	const profilesAtOnce = document.getElementById('profilesAtOnce')?.value || '3';
	const openCount = document.getElementById('openCount')?.value || '3';
	const timeout = document.getElementById('timeout')?.value || '45';
	const minWaitTime = document.getElementById('minWaitTime')?.value || '45';
	const maxWaitTime = document.getElementById('maxWaitTime')?.value || '55';
	const showBrowserWindows = document.getElementById('showBrowserWindows')?.checked ?? true;

	// Create payload with actual values
	const actualPayload = {
		browser,
		profilesAtOnce,
		openCount,
		timeout,
		minWaitTime,
		maxWaitTime,
		headless: !showBrowserWindows // Convert to headless boolean (inverted)
	};

	console.log('📋 Actual payload:', actualPayload);

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
			<span class="data-value">${browser}</span>
		</div>
		<div class="data-item">
			<span class="data-label">Browser Visibility:</span>
			<span class="data-value">${showBrowserWindows ? 'Visible' : 'Headless'}</span>
		</div>
		<div class="data-item">
			<span class="data-label">Cycles:</span>
			<span class="data-value">${openCount}</span>
		</div>
		<div class="data-item">
			<span class="data-label">Profiles per Website:</span>
			<span class="data-value">${profilesAtOnce}</span>
		</div>
		<div class="data-item">
			<span class="data-label">Loading Timeout:</span>
			<span class="data-value">${timeout}s</span>
		</div>
		<div class="data-item">
			<span class="data-label">Session Duration:</span>
			<span class="data-value">${minWaitTime}-${maxWaitTime}s</span>
		</div>
		<p style="margin-top: 20px; color: #4caf50; font-weight: 600;">Total Profiles: ${
			urls.length * parseInt(profilesAtOnce)
		}</p>
		<p style="margin-top: 10px; color: #2196f3; font-weight: 600;">Total Sessions: ${
			urls.length * parseInt(profilesAtOnce) * parseInt(openCount)
		}</p>
	`;

	// Use window.showPopup if available, otherwise fall back to alert
	if (typeof window.showPopup === 'function') {
		window.showPopup('🚀 Start Website Automation', startContent, 'Start Automation');

		// Wait a bit for the popup to be created, then set up the event handler
		setTimeout(() => {
			setupPopupConfirmation(urls, actualPayload);
		}, 100);
	} else {
		// Fallback to simple confirmation
		if (confirm('Start automation with these settings?')) {
			startAutomation(urls, actualPayload);
		}
	}
}

// Function to set up popup confirmation
function setupPopupConfirmation(urls, payload) {
	const popupConfirm = document.getElementById('popupConfirm');
	if (popupConfirm) {
		// Remove any existing event listeners
		const newButton = popupConfirm.cloneNode(true);
		popupConfirm.parentNode.replaceChild(newButton, popupConfirm);

		// Set up new event handler
		newButton.onclick = async () => {
			if (typeof window.hidePopup === 'function') {
				window.hidePopup();
			}
			await startAutomation(urls, payload);
		};
	} else {
		// If popup didn't work, start directly
		startAutomation(urls, payload);
	}
}

// Function to reset logs status values
function resetLogsStatusValues() {
	const logsCycleText = document.getElementById('logsCycleText');
	const logsProgressText = document.getElementById('logsProgressText');
	const logsCompletedText = document.getElementById('logsCompletedText');
	const logsSuccessText = document.getElementById('logsSuccessText');
	const logsFailedText = document.getElementById('logsFailedText');
	const logsProgressBar = document.getElementById('logsProgressBar');

	// Reset all status values to initial state
	if (logsCycleText) logsCycleText.textContent = '1';
	if (logsProgressText) logsProgressText.textContent = '0%';
	if (logsCompletedText) logsCompletedText.textContent = '0/0';
	if (logsSuccessText) logsSuccessText.textContent = '0';
	if (logsFailedText) logsFailedText.textContent = '0';
	if (logsProgressBar) logsProgressBar.style.width = '0%';
}

// Separate function to start automation
async function startAutomation(urls, payload) {
	// Get total profiles count and create log areas
	const totalProfiles = urls.length * parseInt(payload.profilesAtOnce);

	// Reset logs status values to clear any old automation data
	resetLogsStatusValues();

	// Reset cycle counter for new automation
	currentCycle = 1;

	// Reset completion flag for new automation
	completionPopupShown = false;

	try {
		createProfileLogs(totalProfiles);
	} catch (error) {
		console.error('❌ Error creating profile logs:', error);
	}

	// Immediately set automation state to prevent button flickering
	setAutomationState(true);

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
			try {
				clearAllProfileLogs();
				for (let i = 1; i <= totalProfiles; i++) {
					appendProfileLog(i, `🚀 Starting Profile ${i}`);
					appendProfileLog(i, `⏳ Waiting for automation to start...`);
				}
			} catch (error) {
				console.error('❌ Error updating profile logs:', error);
			}
		} else {
			console.error(`❌ Backend automation failed: ${result.error}`);
			// Reset state if automation failed to start
			setAutomationState(false);
		}
	} catch (err) {
		console.error(`❌ Network error starting automation: ${err.message}`);
		// Reset state if there was an error
		setAutomationState(false);
	}
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

	// Use window.showPopup if available, otherwise fall back to alert
	if (typeof window.showPopup === 'function') {
		window.showPopup('🛑 Stop Automation', stopContent, 'Stop Automation', true);
	} else {
		// Fallback to simple confirmation
		if (confirm('Are you sure you want to stop the automation?')) {
			await stopAutomation();
		}
		return;
	}

	// Handle stop confirmation
	const popupConfirm = document.getElementById('popupConfirm');
	if (popupConfirm) {
		popupConfirm.onclick = async () => {
			if (typeof window.hidePopup === 'function') {
				window.hidePopup();
			}
			await stopAutomation();
		};
	} else {
		// If popup didn't work, stop directly
		await stopAutomation();
	}
}

// Separate function to stop automation
async function stopAutomation() {
	try {
		const response = await fetch('/stop-automation', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' }
		});

		const result = await response.json();

		if (result.success) {
			setAutomationState(false);
		} else {
			console.error(`Failed to stop automation: ${result.error}`);
		}
	} catch (err) {
		console.error(`Error stopping automation: ${err.message}`);
	}
}

// Function to set automation state
function setAutomationState(isRunning) {
	const startButton = document.getElementById('startBtn');
	const automationNav = document.querySelector('[data-panel="automation"]');
	const logsNav = document.querySelector('[data-panel="logs"]');
	const toolbar = document.querySelector('.toolbar');
	const automationSection = document.getElementById('panel-automation');
	const logsStatusCard = document.getElementById('logsStatusCard');

	if (isRunning) {
		document.body.classList.add('automation-running');
		if (startButton) startButton.style.display = 'none';

		// Show the logs status area
		if (logsStatusCard) {
			logsStatusCard.style.display = 'block';
		}

		// Hide the toolbar when automation is running
		if (toolbar) {
			toolbar.style.display = 'none';
		}

		// Hide the automation summary section when automation is running
		const automationConfigSection = document.querySelector('.automation-config-section');
		if (automationConfigSection) {
			automationConfigSection.style.display = 'none';
		}

		// Hide the automation navigation link
		if (automationNav) {
			automationNav.style.display = 'none';
		}

		// Show logs panel and hide automation panel
		if (logsNav) logsNav.style.display = 'block';
		if (logsNav) logsNav.classList.add('active');

		// Switch to logs panel (only the status panel, not the entire automation section)
		document.querySelectorAll('.panel').forEach((p) => p.classList.remove('show'));
		document.getElementById('panel-logs').classList.add('show');

		if (typeof startLogUpdates === 'function') startLogUpdates();
		if (typeof connectToLogStream === 'function') connectToLogStream();
	} else {
		document.body.classList.remove('automation-running');
		if (startButton) startButton.style.display = 'block';

		// Hide the logs status area
		if (logsStatusCard) {
			logsStatusCard.style.display = 'none';
		}

		// Show the toolbar when automation is stopped
		if (toolbar) {
			toolbar.style.display = 'flex';
		}

		// Show the automation summary section when automation is stopped
		const automationConfigSection = document.querySelector('.automation-config-section');
		if (automationConfigSection) {
			automationConfigSection.style.display = 'flex';
		}

		// Show the automation navigation link
		if (automationNav) {
			automationNav.style.display = 'flex';
		}

		// Show automation panel and hide logs panel
		if (logsNav) logsNav.style.display = 'none';
		if (logsNav) logsNav.classList.remove('active');
		if (automationNav) automationNav.classList.add('active');

		// Switch to automation panel (only the status panel, not the entire automation section)
		document.querySelectorAll('.panel').forEach((p) => p.classList.remove('show'));
		document.getElementById('panel-automation').classList.add('show');

		if (typeof stopLogUpdates === 'function') stopLogUpdates();
		if (typeof disconnectFromLogStream === 'function') disconnectFromLogStream();
	}
}

// Initialize automation controls
function initializeAutomation() {
	const form = document.getElementById('automationForm');
	const startButton = document.getElementById('startBtn');
	const logsStopButton = document.getElementById('logsStopBtn');

	// Form submission handler
	if (form) {
		form.addEventListener('submit', handleFormSubmission);
	} else {
		console.error('❌ Form not found!');
	}

	// Start button click handler (since it's outside the form)
	if (startButton) {
		startButton.addEventListener('click', async (e) => {
			e.preventDefault();

			// Manually trigger form submission by calling handleFormSubmission directly
			if (form) {
				// Create a fake event object with the form as target
				const fakeEvent = {
					preventDefault: () => {},
					target: form
				};
				await handleFormSubmission(fakeEvent);
			} else {
				console.error('❌ Form not found for manual submission!');
			}
		});
	} else {
		console.error('❌ Start button not found!');
	}

	// Logs stop button handler
	if (logsStopButton) {
		logsStopButton.addEventListener('click', handleStopAutomation);
	} else {
		console.error('❌ Logs stop button not found!');
	}

	// Start status checking
	checkStatus();

	// Connect to log stream when page loads
	connectToLogStream();

	console.log('✅ Automation controls initialization complete');
}
