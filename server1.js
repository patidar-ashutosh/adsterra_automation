// State variables
let automationRunning = false;
let automationDone = true;
let currentWindow = 0;
let currentWaitTime = 0;
let currentWindowStart = 0;
let activityLogs = [];
let activeWindows = new Map(); // Track active window instances
let totalWindows = 0;
let completedWindows = 0;

app.post('/open-url', async (req, res) => {
	const { blogURL, ProxyURL, browser, openCount, profilesAtOnce } = req.body;

	automationRunning = true;
	automationDone = false;
	currentWindow = 0;
	currentWaitTime = 0;
	currentWindowStart = 0;
	activeWindows.clear();
	totalWindows = totalCycles * profilesPerCycle;
	completedWindows = 0;

	res.json({
		success: true,
		opened: combinedURL,
		browser: browser === 'random' ? 'random' : browser,
		totalCycles,
		profilesPerCycle,
		totalWindows,
		profilesAtOnce: profilesPerCycle
	});

	(async () => {
		for (let cycle = 1; cycle <= totalCycles; cycle++) {
			// log(`🔄 Starting Cycle ${cycle}/${totalCycles}`);

			// const waitTimes = getRandomWaitTimes(profilesPerCycle);
			const cyclePromises = [];

			for (let profile = 1; profile <= profilesPerCycle; profile++) {
				const windowIndex = (cycle - 1) * profilesPerCycle + profile;
				const promise = processWindow(
					windowIndex,
					browser,
					combinedURL,
					ProxyURL,
					waitTimes[profile - 1],
					cycle
				);
				cyclePromises.push(promise);
			}

			// Wait for all profiles in this cycle to complete
			log(`🚀 Opening ${profilesPerCycle} profiles for Cycle ${cycle}`);

			// await Promise.allSettled(cyclePromises);
		}

		// automationRunning = false;
		// automationDone = true;
		// currentWindow = 0;
		// currentWaitTime = 0;
		// currentWindowStart = 0;
		// activeWindows.clear();
	})();
});

app.get('/automation-status', (req, res) => {
	let status = {
		done: automationDone
	};

	// Add current window info if any are active
	if (activeWindows.size > 0) {
	}

	res.json(status);
});
