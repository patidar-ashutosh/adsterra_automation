// Log and Profile Management Functions
// ===================================

// Profile log areas
let profileLogs = new Map();
let currentProfilesCount = 0;
let logUpdateInterval = null;
let currentCycleProfiles = 0; // Track profiles for current cycle
let eventSource = null; // SSE connection

// Function to connect to SSE for real-time logs
function connectToLogStream() {
	if (eventSource) {
		eventSource.close();
	}

	eventSource = new EventSource('/logs/stream');

	eventSource.onmessage = function (event) {
		try {
			const data = JSON.parse(event.data);

			if (data.type === 'log' && data.profileIndex) {
				// Immediately append log to the specific profile
				appendProfileLog(data.profileIndex, data.message);
			} else if (data.type === 'cycle_change') {
				// Handle cycle change - clear logs for new cycle
				console.log(`🔄 Cycle change detected: Cycle ${data.cycle}`);
				clearAllProfileLogs();
				// Update currentCycle from automation.js
				if (typeof currentCycle !== 'undefined') {
					currentCycle = data.cycle || 1;
				}

				// Cycle display is now handled by logsStatusCard in automation.js
			} else if (data.type === 'status_change' && data.profileIndex) {
				// Handle real-time status updates
				console.log(`📊 Status change: Profile ${data.profileIndex} -> ${data.status}`);
				let className = 'waiting';
				if (data.status === 'running') {
					className = 'running';
				} else if (data.status === 'completed') {
					className = 'completed';
				} else if (data.status === 'success') {
					className = 'success';
				} else if (data.status === 'failed') {
					className = 'error';
				}
				updateProfileStatus(data.profileIndex, data.status, className);
			}
		} catch (error) {
			console.error('Error parsing SSE data:', error);
		}
	};

	eventSource.onerror = function (error) {
		console.error('SSE connection error:', error);
		// Try to reconnect after 5 seconds
		setTimeout(connectToLogStream, 5000);
	};

	eventSource.onopen = function () {
		console.log('Connected to real-time log stream');
	};
}

// Function to disconnect from SSE
function disconnectFromLogStream() {
	if (eventSource) {
		eventSource.close();
		eventSource = null;
	}
}

// Function to create profile log areas for current cycle
function createProfileLogsForCycle(profilesCount, cycle) {
	console.log(`🔄 Creating profile logs for ${profilesCount} profiles, cycle ${cycle}`);

	const profileLogsContainer = document.getElementById('profileLogs');
	if (!profileLogsContainer) {
		console.error('❌ profileLogs container not found!');
		return;
	}

	profileLogsContainer.innerHTML = '';
	profileLogs.clear();
	currentProfilesCount = profilesCount;
	currentCycleProfiles = profilesCount;

	// Hide any preparation messages when cycle starts
	hideCyclePreparationMessage();

	// Only show cycle start message for cycles after the first one
	if (cycle > 1) {
		// Add cycle transition message
		const cycleMessage = document.createElement('div');
		cycleMessage.className = 'cycle-transition-message';
		cycleMessage.innerHTML = `
			<div class="cycle-transition-content">
				<div class="cycle-transition-icon">🔄</div>
				<div class="cycle-transition-text">
					<h4>Cycle ${cycle} Starting</h4>
					<p>Preparing ${profilesCount} profiles for automation...</p>
				</div>
			</div>
		`;
		profileLogsContainer.appendChild(cycleMessage);

		// Auto-remove cycle start message after 3 seconds
		setTimeout(() => {
			if (cycleMessage.parentNode) {
				cycleMessage.remove();
			}
		}, 3000);
	}

	for (let i = 1; i <= profilesCount; i++) {
		const logItem = document.createElement('div');
		logItem.className = 'profile-log-item';
		// Ensure logs are visible for new cycle with proper initial state
		logItem.style.opacity = '1';
		logItem.style.transform = 'translateY(0)';
		logItem.style.pointerEvents = 'auto';
		logItem.style.transition = 'all 0.5s ease';
		logItem.innerHTML = `
			<div class="profile-log-header">
				<div class="profile-log-title">Profile ${i} <span class="profile-time" id="profileTime${i}"></span></div>
				<div class="profile-log-status waiting" id="profileStatus${i}">Waiting</div>
			</div>
			<div class="profile-url-info" id="profileUrlInfo${i}">URL: Loading...</div>
			<textarea class="profile-log-area" id="profileLog${i}" readonly></textarea>
		`;
		profileLogsContainer.appendChild(logItem);

		// Store reference to log area
		const logArea = document.getElementById(`profileLog${i}`);
		if (logArea) {
			profileLogs.set(i, logArea);
			console.log(`✅ Profile ${i} log area created and stored`);
		} else {
			console.error(`❌ Failed to find log area for profile ${i}`);
		}
	}

	console.log(`✅ Created ${profilesCount} profile log areas`);
	console.log(`📊 Profile logs Map size: ${profileLogs.size}`);
}

// Function to show cycle completion message
function showCycleCompletionMessage(cycle, completedProfiles, totalProfiles) {
	const profileLogsContainer = document.getElementById('profileLogs');
	if (!profileLogsContainer) return;

	// Create cycle completion message
	const completionMessage = document.createElement('div');
	completionMessage.className = 'cycle-completion-message';
	completionMessage.innerHTML = `
		<div class="cycle-completion-content">
			<div class="cycle-completion-icon">✅</div>
			<div class="cycle-completion-text">
				<h4>Cycle ${cycle} Completed!</h4>
				<p>${completedProfiles} out of ${totalProfiles} profiles completed successfully</p>
			</div>
		</div>
	`;

	// Insert at the top of the logs
	profileLogsContainer.insertBefore(completionMessage, profileLogsContainer.firstChild);

	// Auto-remove after 5 seconds
	setTimeout(() => {
		if (completionMessage.parentNode) {
			completionMessage.remove();
		}
	}, 5000);
}

// Function to show cycle preparation message
function showCyclePreparationMessage(nextCycle) {
	const profileLogsContainer = document.getElementById('profileLogs');
	if (!profileLogsContainer) return;

	// Remove any existing preparation messages first
	const existingPrepMessages = profileLogsContainer.querySelectorAll(
		'.cycle-preparation-message'
	);
	existingPrepMessages.forEach((msg) => msg.remove());

	// Create preparation message
	const prepMessage = document.createElement('div');
	prepMessage.className = 'cycle-preparation-message';
	prepMessage.id = 'cyclePrepMessage';
	prepMessage.innerHTML = `
		<div class="cycle-preparation-content">
			<div class="cycle-preparation-icon">⏳</div>
			<div class="cycle-preparation-text">
				<h4>Preparing Next Cycle</h4>
				<p>Setting up automation for Cycle ${nextCycle}...</p>
			</div>
		</div>
	`;

	// Insert at the top of the logs
	profileLogsContainer.insertBefore(prepMessage, profileLogsContainer.firstChild);

	// Hide all profile logs to create clean slate for new cycle
	// Use a more direct approach to ensure it works
	hideAllProfileLogsDirect();

	// Auto-remove after 6 seconds as a fallback (in case something goes wrong)
	// But ideally it will be hidden programmatically when the cycle starts
	setTimeout(() => {
		if (prepMessage.parentNode) {
			prepMessage.remove();
		}
	}, 6000);
}

// Function to hide all profile logs using direct DOM manipulation
function hideAllProfileLogsDirect() {
	console.log(`🙈 Hiding all profile logs for clean cycle transition`);

	// Hide all profile log items using direct style manipulation
	const profileLogItems = document.querySelectorAll('.profile-log-item');
	profileLogItems.forEach((item, index) => {
		item.style.opacity = '0';
		item.style.transform = 'translateY(20px)';
		item.style.pointerEvents = 'none';
		console.log(`✅ Hidden profile log ${index + 1} using direct style`);
	});
}

// Function to show all profile logs using direct DOM manipulation
function showAllProfileLogsDirect() {
	console.log(`👁️ Showing all profile logs for new cycle`);

	// Show all profile log items using direct style manipulation
	const profileLogItems = document.querySelectorAll('.profile-log-item');
	profileLogItems.forEach((item, index) => {
		item.style.opacity = '1';
		item.style.transform = 'translateY(0)';
		item.style.pointerEvents = 'auto';
		console.log(`✅ Shown profile log ${index + 1} using direct style`);
	});
}

// Function to hide cycle preparation message
function hideCyclePreparationMessage() {
	console.log(`🔧 hideCyclePreparationMessage called`);
	const prepMessage = document.getElementById('cyclePrepMessage');
	if (prepMessage && prepMessage.parentNode) {
		console.log(`✅ Removing preparation message`);
		prepMessage.remove();
	} else {
		console.log(`⚠️ No preparation message found to remove`);
	}

	// Small delay before showing logs for smooth transition
	setTimeout(() => {
		console.log(`⏰ Showing profile logs after delay`);
		// Show all profile logs for the new cycle
		showAllProfileLogsDirect();
	}, 300); // 300ms delay for smooth transition
}

// Function to create profile log areas (for initial setup)
function createProfileLogs(profilesCount) {
	createProfileLogsForCycle(profilesCount, 1);

	// Update URL info for each profile based on current URL configuration
	updateProfileUrlDistribution(profilesCount);
}

// Function to update profile URL distribution
function updateProfileUrlDistribution(profilesCount) {
	const urlInputs = document.querySelectorAll('.website-url-input');
	const urls = Array.from(urlInputs)
		.map((input) => input.value.trim())
		.filter((url) => url);
	const profilesPerUrl = parseInt(document.getElementById('profilesAtOnce').value) || 1;

	if (urls.length === 0) return;

	for (let i = 1; i <= profilesCount; i++) {
		const urlInfoElement = document.getElementById(`profileUrlInfo${i}`);
		if (urlInfoElement) {
			// Calculate which URL this profile will work on
			const urlIndex = Math.floor((i - 1) / profilesPerUrl) % urls.length;
			const url = urls[urlIndex];

			try {
				const urlObj = new URL(url);
				const domain = urlObj.hostname;
				urlInfoElement.textContent = `URL ${urlIndex + 1}: ${domain}`;
				urlInfoElement.title = url; // Full URL on hover
			} catch (e) {
				urlInfoElement.textContent = `URL ${urlIndex + 1}: ${url}`;
			}
		}
	}
}

// Function to append log to specific profile
function appendProfileLog(profileIndex, message) {
	console.log(`📝 Appending log to profile ${profileIndex}: ${message}`);

	const logArea = profileLogs.get(profileIndex);
	if (logArea) {
		logArea.value += `${message}\n`;
		logArea.scrollTop = logArea.scrollHeight;
		console.log(`✅ Log appended to profile ${profileIndex}`);
	} else {
		console.error(`❌ Log area not found for profile ${profileIndex}`);
	}
}

// Function to clear all profile logs
function clearAllProfileLogs() {
	console.log(`🧹 Clearing all profile logs (${profileLogs.size} profiles)`);

	profileLogs.forEach((logArea, index) => {
		if (logArea) {
			logArea.value = '';
			console.log(`✅ Cleared logs for profile ${index}`);
		} else {
			console.error(`❌ Log area not found for profile ${index}`);
		}
	});

	// Clear URL info for profiles that are not in final states
	for (let i = 1; i <= currentProfilesCount; i++) {
		const urlInfoElement = document.getElementById(`profileUrlInfo${i}`);
		const statusElement = document.getElementById(`profileStatus${i}`);

		if (urlInfoElement && statusElement) {
			const currentStatus = statusElement.textContent;
			// Only reset URL info if profile is not in a final state
			if (!['completed', 'success', 'failed', 'error'].includes(currentStatus)) {
				urlInfoElement.textContent = 'URL: Loading...';
			}
		}
	}

	console.log(`✅ All profile logs cleared`);
}

// Function to update profile status
function updateProfileStatus(profileIndex, status, className) {
	const statusElement = document.getElementById(`profileStatus${profileIndex}`);
	if (statusElement) {
		statusElement.textContent = status;
		statusElement.className = `profile-log-status ${className}`;
	}
}

// Function to update profile times based on active window details
function updateProfileTimes(activeWindowDetails) {
	if (!activeWindowDetails || activeWindowDetails.length === 0) return;

	// Clear all profile times first, but preserve URL info for completed profiles
	for (let i = 1; i <= currentProfilesCount; i++) {
		const timeElement = document.getElementById(`profileTime${i}`);
		const statusElement = document.getElementById(`profileStatus${i}`);

		if (timeElement) {
			timeElement.textContent = '';
		}

		// Only reset URL info to "Waiting..." if the profile is not in a final state
		const urlInfoElement = document.getElementById(`profileUrlInfo${i}`);
		if (urlInfoElement && statusElement) {
			const currentStatus = statusElement.textContent;
			// Don't change URL info if profile is already completed, success, or failed
			if (!['completed', 'success', 'failed', 'error'].includes(currentStatus)) {
				urlInfoElement.textContent = 'URL: Waiting...';
			}
		}
	}

	// Update times for active profiles
	activeWindowDetails.forEach((window) => {
		const cycleSpecificIndex = ((window.windowIndex - 1) % currentProfilesCount) + 1;
		const timeElement = document.getElementById(`profileTime${cycleSpecificIndex}`);
		const urlInfoElement = document.getElementById(`profileUrlInfo${cycleSpecificIndex}`);

		if (timeElement) {
			timeElement.textContent = `(${window.remaining}s left)`;
		}

		if (urlInfoElement && window.originalUrl) {
			// Extract domain from URL for cleaner display
			try {
				const url = new URL(window.originalUrl);
				const domain = url.hostname;
				urlInfoElement.textContent = `URL ${window.urlIndex}: ${domain}`;
				urlInfoElement.title = window.originalUrl; // Full URL on hover
			} catch (e) {
				urlInfoElement.textContent = `URL ${window.urlIndex}: ${window.originalUrl}`;
			}
		}
	});
}

// Function to fetch and update profile logs
async function updateProfileLogs() {
	if (currentProfilesCount === 0) return;

	try {
		const [logsResponse, statusResponse] = await Promise.all([
			fetch('/logs/profiles'),
			fetch('/automation-status')
		]);

		const logsData = await logsResponse.json();
		const statusData = await statusResponse.json();

		if (logsData.success && logsData.profileLogs) {
			// Check if we have cycle info and need to update profile areas
			if (
				logsData.currentCycle &&
				logsData.profilesPerCycle &&
				logsData.currentCycle !== (typeof currentCycle !== 'undefined' ? currentCycle : 1)
			) {
				// Clear logs when starting a new cycle
				clearAllProfileLogs();

				if (typeof currentCycle !== 'undefined') {
					currentCycle = logsData.currentCycle;
				}
				currentProfilesCount = logsData.profilesPerCycle;
				currentCycleProfiles = logsData.profilesPerCycle;
				createProfileLogsForCycle(logsData.profilesPerCycle, logsData.currentCycle);
			}

			for (let i = 1; i <= currentProfilesCount; i++) {
				const profileLog = logsData.profileLogs[i];
				if (profileLog) {
					const logArea = profileLogs.get(i);
					if (logArea) {
						logArea.value = profileLog;
						logArea.scrollTop = logArea.scrollHeight;
					}
				}
			}

			// Update profile statuses
			if (logsData.success && logsData.profileStatuses) {
				for (let i = 1; i <= currentProfilesCount; i++) {
					const status = logsData.profileStatuses[i];
					if (status) {
						let className = 'waiting';
						if (status === 'running') {
							className = 'running';
						} else if (status === 'completed') {
							className = 'completed';
						} else if (status === 'success') {
							className = 'success';
						} else if (status === 'failed') {
							className = 'error';
						}
						updateProfileStatus(i, status, className);
					}
				}
			}

			// Update profile times from status data
			if (statusData.activeWindowDetails && statusData.activeWindowDetails.length > 0) {
				updateProfileTimes(statusData.activeWindowDetails);
			}
		}
	} catch (error) {
		console.error('Failed to fetch profile logs:', error);
	}
}

// Function to start log updates
function startLogUpdates() {
	if (logUpdateInterval) {
		clearInterval(logUpdateInterval);
	}
	logUpdateInterval = setInterval(updateProfileLogs, 1000);
}

// Function to stop log updates
function stopLogUpdates() {
	if (logUpdateInterval) {
		clearInterval(logUpdateInterval);
		logUpdateInterval = null;
	}
}
