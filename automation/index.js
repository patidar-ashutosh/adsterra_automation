// automation/index.js
const randomUA = require('random-useragent');
const { chromium, firefox, webkit } = require('playwright');
const generateFingerprint = require('../utils/fingerprint');
const simulateHumanScroll = require('../utils/scroll');
const {
	log,
	getBrowserByName,
	getRandomBrowser,
	getRandomWaitTimes,
	updateProfileStatus,
	getProfileStatus,
	clearProfileLogs,
	updateGlobalCycleInfo
} = require('../utils/helpers');
const injectFingerprint = require('../utils/injectFingerprint');

const activeWindows = new Map();
let totalWindows = 0;
let completedWindows = 0;
let failedWindows = 0; // Track failed profiles
let successWindows = 0; // Track successful profiles
let isAutomationInProgress = false; // Track if automation is in progress
let currentCycle = 0; // Track current cycle
let profilesPerCycle = 0; // Track profiles per cycle

// Stop functionality variables
let shouldStop = false;
let activeBrowsers = [];

// Function to stop automation
function stopAutomation() {
	shouldStop = true;
	log('🛑 Stop automation requested...');
}

// Function to reset stop state
function resetStopState() {
	shouldStop = false;
	activeBrowsers = [];
}

// Function to get cycle-specific profile index
function getCycleSpecificIndex(globalIndex, cycle, profilesPerCycle) {
	return ((globalIndex - 1) % profilesPerCycle) + 1;
}

// Function to process a single window
async function processWindow(
	windowIndex,
	browser,
	combinedURL,
	proxyURL,
	waitTime,
	cycle,
	timeout = 30,
	urlIndex = 1,
	profileNum = 1,
	originalUrl = ''
) {
	let browserInstance = null;
	let context = null;
	let page = null;
	let isCompleted = false; // Flag to prevent double completion
	const cycleSpecificIndex = getCycleSpecificIndex(windowIndex, cycle, profilesPerCycle);

	try {
		// Check if stop was requested before starting
		if (shouldStop) {
			log(
				`⏹️ Skipping Profile ${cycleSpecificIndex} (URL ${urlIndex}, Profile ${profileNum}) - automation stopped`,
				windowIndex
			);
			updateProfileStatus(windowIndex, 'failed');
			failedWindows++; // Increment failed count
			return;
		}

		log(
			`🚀 Opening Profile ${cycleSpecificIndex} (URL ${urlIndex}, Profile ${profileNum}, Cycle ${cycle})`,
			windowIndex
		);
		updateProfileStatus(windowIndex, 'waiting');

		// Select browser for this specific window
		const browserChoice = browser !== 'random' ? getBrowserByName(browser) : getRandomBrowser();
		if (!browserChoice) {
			log(`❌ Invalid browser selection for Profile ${cycleSpecificIndex}`, windowIndex);
			updateProfileStatus(windowIndex, 'failed');
			failedWindows++; // Increment failed count
			return;
		}

		log(
			`🌐 Using browser: ${browserChoice.name} for Profile ${cycleSpecificIndex} (URL ${urlIndex})`,
			windowIndex
		);

		const fingerprint = await generateFingerprint(proxyURL, browserChoice.name, 'desktop');
		const userAgent = fingerprint.userAgent;

		// Check if stop was requested before launching browser
		if (shouldStop) {
			log(
				`⏹️ Skipping Profile ${cycleSpecificIndex} (URL ${urlIndex}) - automation stopped`,
				windowIndex
			);
			updateProfileStatus(windowIndex, 'failed');
			failedWindows++; // Increment failed count
			return;
		}

		browserInstance = await browserChoice.launcher.launch({ headless: false });

		// Check if stop was requested after browser launch
		if (shouldStop) {
			log(
				`⏹️ Stopping Profile ${cycleSpecificIndex} (URL ${urlIndex}) - automation stopped`,
				windowIndex
			);
			try {
				await browserInstance.close();
			} catch (e) {
				log(`⚠️ Error closing browser: ${e.message}`, windowIndex);
			}
			updateProfileStatus(windowIndex, 'failed');
			failedWindows++; // Increment failed count
			return;
		}

		// Add to active browsers for stop functionality
		activeBrowsers.push(browserInstance);

		// Check if stop was requested before creating context
		if (shouldStop) {
			log(
				`⏹️ Stopping Profile ${cycleSpecificIndex} (URL ${urlIndex}) - automation stopped`,
				windowIndex
			);
			updateProfileStatus(windowIndex, 'failed');
			failedWindows++; // Increment failed count
			return;
		}

		context = await browserInstance.newContext({
			userAgent,
			viewport: fingerprint.screen,
			locale: fingerprint.browserLanguages[0],
			timezoneId: fingerprint.timezone,
			deviceScaleFactor: fingerprint.deviceScaleFactor || 1,
			isMobile: fingerprint.isMobile || false,
			hasTouch: fingerprint.hasTouch || false
		});

		// Check if stop was requested after context creation
		if (shouldStop) {
			log(
				`⏹️ Stopping Profile ${cycleSpecificIndex} (URL ${urlIndex}) - automation stopped`,
				windowIndex
			);
			updateProfileStatus(windowIndex, 'failed');
			failedWindows++; // Increment failed count
			return;
		}

		page = await context.newPage();

		// Check if stop was requested after page creation
		if (shouldStop) {
			log(
				`⏹️ Stopping Profile ${cycleSpecificIndex} (URL ${urlIndex}) - automation stopped`,
				windowIndex
			);
			updateProfileStatus(windowIndex, 'failed');
			failedWindows++; // Increment failed count
			return;
		}

		// Inject fingerprint scripts
		await injectFingerprint(page, fingerprint);

		// Navigate to the page with proper error handling
		try {
			// Check if stop was requested before starting navigation
			if (shouldStop) {
				log(
					`⏹️ Stopping Profile ${cycleSpecificIndex} (URL ${urlIndex}) - automation stopped`,
					windowIndex
				);
				updateProfileStatus(windowIndex, 'failed');
				failedWindows++; // Increment failed count
				return;
			}

			log(
				`🌐 Loading website for Profile ${cycleSpecificIndex} (URL ${urlIndex})...`,
				windowIndex
			);
			log(`🔗 Navigating to: ${combinedURL}`, windowIndex);

			// Navigate to the page with stop checking
			const navigationPromise = page.goto(combinedURL, {
				waitUntil: 'load',
				timeout: timeout * 1000 // Convert seconds to milliseconds
			});

			// Wait for navigation with stop checking
			try {
				await Promise.race([
					navigationPromise,
					new Promise((_, reject) => {
						// Check for stop every 500ms during navigation
						const checkStop = () => {
							if (shouldStop) {
								reject(new Error('STOP_REQUESTED'));
							} else {
								setTimeout(checkStop, 500);
							}
						};
						checkStop();
					})
				]);
			} catch (navError) {
				if (navError.message === 'STOP_REQUESTED') {
					log(
						`⏹️ Stopping Profile ${cycleSpecificIndex} (URL ${urlIndex}) - automation stopped`,
						windowIndex
					);
					updateProfileStatus(windowIndex, 'failed');
					failedWindows++; // Increment failed count
					return;
				}
				throw navError; // Re-throw other navigation errors
			}

			// Check if stop was requested after page load
			if (shouldStop) {
				log(
					`⏹️ Stopping Profile ${cycleSpecificIndex} (URL ${urlIndex}) - automation stopped`,
					windowIndex
				);
				updateProfileStatus(windowIndex, 'failed');
				failedWindows++; // Increment failed count
				return;
			}

			log(
				`🌐 Page loaded for Profile ${cycleSpecificIndex} (URL ${urlIndex}, Cycle ${cycle})`,
				windowIndex
			);
			updateProfileStatus(windowIndex, 'running');

			// 🎯 CRITICAL FIX: Start tracking AFTER page is loaded
			// Track this window ONLY after successful page load
			activeWindows.set(windowIndex, {
				browserInstance,
				startTime: Date.now(), // Timer starts NOW, after page load
				waitTime,
				cycle,
				urlIndex,
				profileNum,
				originalUrl
			});

			log(`⏱️ Wait timer started (${waitTime}s allocated)`, windowIndex);
		} catch (navError) {
			// Provide user-friendly error messages
			let errorMessage = navError.message;
			if (errorMessage.includes('Timeout') && errorMessage.includes('exceeded')) {
				errorMessage = `❌ The site is not loaded under ${timeout} seconds so the profile is closed.`;
			} else if (errorMessage.includes('net::ERR_')) {
				errorMessage = `❌ Network error: Unable to connect`;
			} else if (errorMessage.includes('ERR_NAME_NOT_RESOLVED')) {
				errorMessage = `❌ DNS error: Website address could not be resolved`;
			} else {
				errorMessage = `❌ Navigation failed: ${navError.message}`;
			}

			log(errorMessage, windowIndex);
			updateProfileStatus(windowIndex, 'failed');
			failedWindows++; // Increment failed count
			return;
		}

		log(`🕒 Time allocated: ${waitTime}s`, windowIndex);

		// Set up a strict timeout to close the profile when wait time expires
		const strictTimeoutId = setTimeout(async () => {
			if (page && !page.isClosed() && !isCompleted) {
				isCompleted = true; // Mark as completed to prevent double processing
				log(
					`⏰ Wait time (${waitTime}s) expired - force closing Profile ${cycleSpecificIndex} (URL ${urlIndex})`,
					windowIndex
				);
				updateProfileStatus(windowIndex, 'success'); // Mark as success since it completed its allocated time
				successWindows++; // Increment success count

				try {
					// Force close the page and browser
					if (page && !page.isClosed()) {
						await page.close();
					}
					if (context) {
						await context.close();
					}
					if (browserInstance) {
						await browserInstance.close();
						// Remove from active browsers
						const index = activeBrowsers.indexOf(browserInstance);
						if (index > -1) {
							activeBrowsers.splice(index, 1);
						}
					}

					// Remove from active windows and update completion count
					activeWindows.delete(windowIndex);
					completedWindows++;

					log(
						`✅ Profile ${cycleSpecificIndex} (URL ${urlIndex}, Cycle ${cycle}) completed by timeout (${completedWindows}/${totalWindows})`,
						windowIndex
					);
				} catch (timeoutCloseError) {
					log(
						`⚠️ Error during timeout cleanup: ${timeoutCloseError.message}`,
						windowIndex
					);
				}
			}
		}, waitTime * 1000); // Convert seconds to milliseconds

		let usableScrollTime = waitTime;
		if (usableScrollTime > 10) {
			log(`⏳ Waiting 5s before scroll...`, windowIndex);
			await page.waitForTimeout(5000);
			usableScrollTime -= 5;
		}

		// Only attempt scrolling if page is still available and not stopped
		if (page && !page.isClosed() && !shouldStop && !isCompleted) {
			// Pass the timeout control to scroll function
			await simulateHumanScroll(page, usableScrollTime, windowIndex, strictTimeoutId);
			await page.waitForTimeout(1000);
		}

		// Clear the timeout if we complete before time expires
		clearTimeout(strictTimeoutId);

		// Only log completion if we haven't been closed by timeout and not already completed
		if (page && !page.isClosed() && !isCompleted) {
			isCompleted = true; // Mark as completed to prevent double processing
			log(
				`✅ Profile ${cycleSpecificIndex} (URL ${urlIndex}, Cycle ${cycle}) completed (${
					completedWindows + 1
				}/${totalWindows})`,
				windowIndex
			);
			updateProfileStatus(windowIndex, 'success');
			successWindows++; // Increment success count
		}
	} catch (err) {
		// Only mark as failed if not already completed by timeout
		if (!isCompleted) {
			log(
				`❌ Error in Profile ${cycleSpecificIndex} (URL ${urlIndex}): ${err.message}`,
				windowIndex
			);
			updateProfileStatus(windowIndex, 'failed');
			failedWindows++; // Increment failed count
		}

		// Clear timeout on error
		if (typeof strictTimeoutId !== 'undefined') {
			clearTimeout(strictTimeoutId);
		}
	} finally {
		// Clear timeout in finally block to ensure it's always cleared
		if (typeof strictTimeoutId !== 'undefined') {
			clearTimeout(strictTimeoutId);
		}

		// Clean up resources
		try {
			if (page && !page.isClosed()) {
				await page.close();
			}
		} catch (closePageErr) {
			log(
				`⚠️ Failed to close page for Profile ${cycleSpecificIndex} (URL ${urlIndex}): ${closePageErr.message}`,
				windowIndex
			);
		}

		try {
			if (context) {
				await context.close();
			}
		} catch (closeContextErr) {
			log(`⚠️ Failed to close context: ${closeContextErr.message}`, windowIndex);
		}

		try {
			if (browserInstance) {
				await browserInstance.close();
				// Remove from active browsers
				const index = activeBrowsers.indexOf(browserInstance);
				if (index > -1) {
					activeBrowsers.splice(index, 1);
				}
			}
		} catch (closeBrowserErr) {
			log(`⚠️ Failed to close browser: ${closeBrowserErr.message}`, windowIndex);
		}

		// Remove from active windows
		activeWindows.delete(windowIndex);

		// Only increment completedWindows if not already completed by timeout
		if (!isCompleted) {
			completedWindows++;
		}
	}
}

async function runAutomation(config) {
	const {
		urls,
		originalUrls,
		url, // Keep for backward compatibility
		proxyURL,
		browser = 'random',
		openCount = 1,
		profilesAtOnce = 1,
		timeout = 30,
		minWaitTime = 45,
		maxWaitTime = 55
	} = config;

	// Handle both single URL (backward compatibility) and multiple URLs
	let targetUrls = urls || [];
	let originalTargetUrls = originalUrls || [];

	if (!targetUrls.length && url) {
		targetUrls = [url];
		originalTargetUrls = [url];
	}

	if (!targetUrls.length) {
		log('❌ No URLs provided for automation');
		return;
	}

	// Clear previous profile logs
	clearProfileLogs();

	const totalCycles = Math.max(1, Math.min(parseInt(openCount), 20));
	const profilesPerUrl = Math.max(1, Math.min(parseInt(profilesAtOnce), 10));
	const totalUrls = targetUrls.length;

	totalWindows = totalCycles * profilesPerUrl * totalUrls;
	completedWindows = 0;
	failedWindows = 0; // Reset failed count
	successWindows = 0; // Reset success count
	isAutomationInProgress = true; // Set automation as in progress
	currentCycle = 1; // Initialize current cycle to 1
	profilesPerCycle = profilesPerUrl * totalUrls; // Total profiles per cycle across all URLs
	updateGlobalCycleInfo(currentCycle, profilesPerCycle); // Update cycle info for logs

	// Reset stop state at the beginning
	resetStopState();

	log(
		`🚀 Starting automation with ${totalUrls} URLs, ${profilesPerUrl} profiles per URL, ${totalCycles} cycles`
	);
	log(`📊 Total profiles: ${profilesPerUrl * totalUrls}, Total windows: ${totalWindows}`);

	// Debug: Show URL construction
	log(`🔗 URL Configuration:`);
	log(`📡 Proxy URL: ${proxyURL || 'None'}`);
	targetUrls.forEach((url, index) => {
		const originalUrl = originalTargetUrls[index];
		let finalUrl = url;
		if (proxyURL && proxyURL.trim()) {
			// Ensure the proxy URL ends with proper separator
			let cleanProxyURL = proxyURL.trim();
			if (!cleanProxyURL.endsWith('=') && !cleanProxyURL.endsWith('&')) {
				cleanProxyURL = cleanProxyURL + '=';
			}
			finalUrl = cleanProxyURL + encodeURIComponent(url);
		}
		log(`  URL ${index + 1}: ${originalUrl} → ${finalUrl}`);
	});

	// Run automation cycles
	for (let cycle = 1; cycle <= totalCycles; cycle++) {
		currentCycle = cycle; // Update current cycle
		updateGlobalCycleInfo(currentCycle, profilesPerCycle); // Update cycle info for logs

		// Check if stop was requested before starting this cycle
		if (shouldStop) {
			log(`⏹️ Stopping automation - cycle ${cycle} cancelled`);
			break;
		}

		// Clear logs from previous cycle to start fresh
		clearProfileLogs();

		log(`🔄 Starting Cycle ${cycle}/${totalCycles}`);

		// Create promises for all profiles across all URLs in this cycle
		const waitTimes = getRandomWaitTimes(profilesPerUrl * totalUrls, minWaitTime, maxWaitTime);
		const promises = [];

		let profileIndex = 1;
		for (let urlIndex = 0; urlIndex < totalUrls; urlIndex++) {
			const currentUrl = targetUrls[urlIndex];
			const originalUrl = originalTargetUrls[urlIndex];

			// Construct the final URL with proxy if needed
			let finalUrl = currentUrl;
			if (proxyURL && proxyURL.trim()) {
				// If proxy URL is provided, combine it with the target URL
				// Ensure the proxy URL ends with proper separator
				let cleanProxyURL = proxyURL.trim();
				if (!cleanProxyURL.endsWith('=') && !cleanProxyURL.endsWith('&')) {
					cleanProxyURL = cleanProxyURL + '=';
				}
				finalUrl = cleanProxyURL + encodeURIComponent(currentUrl);
			}

			for (let profileNum = 1; profileNum <= profilesPerUrl; profileNum++) {
				const globalProfileIndex = (cycle - 1) * profilesPerUrl * totalUrls + profileIndex;
				const waitTime = waitTimes[profileIndex - 1];

				promises.push(
					processWindow(
						globalProfileIndex,
						browser,
						finalUrl, // Use the properly constructed final URL
						proxyURL,
						waitTime,
						cycle,
						timeout,
						urlIndex + 1,
						profileNum,
						originalUrl
					)
				);

				profileIndex++;
			}
		}

		await Promise.allSettled(promises);

		// Check if stop was requested after this cycle
		if (shouldStop) {
			log(`⏹️ Stopping automation after cycle ${cycle}`);
			break;
		}

		log(`✅ Cycle ${cycle} completed`);

		// Small delay between cycles (except for the last cycle)
		if (cycle < totalCycles && !shouldStop) {
			log(`🕔 Waiting 5s before Cycle ${cycle + 1}...`);
			await new Promise((r) => setTimeout(r, 5000));
		}
	}

	if (shouldStop) {
		log(`🛑 Automation stopped by user request`);
	} else {
		log(`🎉 All ${totalCycles} cycles completed successfully!`);
	}

	// Reset automation state to show start button
	activeWindows.clear();
	completedWindows = 0;
	failedWindows = 0; // Reset failed count
	successWindows = 0; // Reset success count
	totalWindows = 0;
	isAutomationInProgress = false; // Mark automation as completed
}

// Function to stop all active browsers
async function stopAllBrowsers() {
	log(`🛑 Closing ${activeBrowsers.length} active browsers...`);

	const closePromises = activeBrowsers.map(async (browser, index) => {
		try {
			// Try to close gracefully first
			await Promise.race([
				browser.close(),
				new Promise((resolve) => setTimeout(resolve, 3000)) // 3 second timeout
			]);
			log(`✅ Browser ${index + 1} closed successfully`);
		} catch (e) {
			log(`⚠️ Error closing browser ${index + 1}: ${e.message}`);
			// Try force kill if graceful close fails
			try {
				await browser.kill();
				log(`🔨 Browser ${index + 1} force killed`);
			} catch (killError) {
				log(`❌ Failed to force kill browser ${index + 1}: ${killError.message}`);
			}
		}
	});

	// Wait for all browsers to close with a maximum timeout
	await Promise.race([
		Promise.allSettled(closePromises),
		new Promise((resolve) => setTimeout(resolve, 10000)) // 10 second total timeout
	]);

	activeBrowsers = [];
	log(`🛑 All browsers closed. Active browsers: ${activeBrowsers.length}`);
}

function getStatus() {
	const activeWindowDetails = Array.from(activeWindows.entries()).map(([windowIndex, data]) => {
		const elapsed = (Date.now() - data.startTime) / 1000;
		const remaining = Math.max(0, Math.ceil(data.waitTime - elapsed));
		return {
			windowIndex,
			elapsed: Math.round(elapsed),
			remaining,
			waitTime: data.waitTime,
			cycle: data.cycle,
			urlIndex: data.urlIndex || 1,
			profileNum: data.profileNum || 1,
			originalUrl: data.originalUrl || ''
		};
	});

	return {
		totalWindows,
		completedWindows,
		failedWindows, // Add failedWindows to the status
		successWindows, // Add successWindows to the status
		activeWindows: activeWindows.size,
		progress: totalWindows > 0 ? Math.round((completedWindows / totalWindows) * 100) : 0,
		activeWindowDetails,
		status: isAutomationInProgress
			? activeWindows.size > 0
				? 'running'
				: 'preparing'
			: completedWindows > 0
			? 'completed'
			: 'idle',
		shouldStop,
		currentCycle,
		profilesPerCycle
	};
}

module.exports = { runAutomation, getStatus, stopAutomation, stopAllBrowsers };
