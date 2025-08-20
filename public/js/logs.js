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

				// Update cycle display
				const cycleTextElement = document.getElementById('cycleText');
				if (cycleTextElement) {
					cycleTextElement.textContent = `Current Cycle: ${data.cycle}`;
				}
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
	const profileLogsGrid = document.getElementById('profileLogsGrid');
	profileLogsGrid.innerHTML = '';
	profileLogs.clear();
	currentProfilesCount = profilesCount;
	currentCycleProfiles = profilesCount;

	for (let i = 1; i <= profilesCount; i++) {
		const logItem = document.createElement('div');
		logItem.className = 'profile-log-item';
		logItem.innerHTML = `
			<div class="profile-log-header">
				<div class="profile-log-title">Profile ${i} <span class="profile-time" id="profileTime${i}"></span></div>
				<div class="profile-log-status waiting" id="profileStatus${i}">Waiting</div>
			</div>
			<div class="profile-url-info" id="profileUrlInfo${i}">URL: Loading...</div>
			<textarea class="profile-log-area" id="profileLog${i}" readonly></textarea>
		`;
		profileLogsGrid.appendChild(logItem);

		// Store reference to log area
		profileLogs.set(i, document.getElementById(`profileLog${i}`));
	}
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
	const logArea = profileLogs.get(profileIndex);
	if (logArea) {
		logArea.value += `${message}\n`;
		logArea.scrollTop = logArea.scrollHeight;
	}
}

// Function to clear all profile logs
function clearAllProfileLogs() {
	profileLogs.forEach((logArea) => {
		if (logArea) {
			logArea.value = '';
		}
	});

	// Clear URL info as well
	for (let i = 1; i <= currentProfilesCount; i++) {
		const urlInfoElement = document.getElementById(`profileUrlInfo${i}`);
		if (urlInfoElement) {
			urlInfoElement.textContent = 'URL: Loading...';
		}
	}
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

	// Clear all profile times first
	for (let i = 1; i <= currentProfilesCount; i++) {
		const timeElement = document.getElementById(`profileTime${i}`);
		const urlInfoElement = document.getElementById(`profileUrlInfo${i}`);
		if (timeElement) {
			timeElement.textContent = '';
		}
		if (urlInfoElement) {
			urlInfoElement.textContent = 'URL: Waiting...';
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
