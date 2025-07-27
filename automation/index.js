// automation/index.js
const randomUA = require('random-useragent');
const { chromium, firefox, webkit } = require('playwright');
const generateFingerprint = require('../utils/fingerprint');
const simulateHumanScroll = require('../utils/scroll');
const { log, getBrowserByName, getRandomBrowser, getRandomWaitTimes } = require('../utils/helpers');

const activeWindows = new Map();
let totalWindows = 0;
let completedWindows = 0;
let isAutomationInProgress = false; // Track if automation is in progress

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

// Function to process a single window
async function processWindow(
	windowIndex,
	browser,
	combinedURL,
	proxyURL,
	waitTime,
	cycle,
	timeout = 30
) {
	let browserInstance = null;
	let context = null;
	let page = null;

	try {
		// Check if stop was requested before starting
		if (shouldStop) {
			log(`⏹️ Skipping Profile ${windowIndex} - automation stopped`, windowIndex);
			return;
		}

		log(`🚀 Opening Profile ${windowIndex} (Cycle ${cycle})`, windowIndex);

		// Select browser for this specific window
		const browserChoice = browser !== 'random' ? getBrowserByName(browser) : getRandomBrowser();
		if (!browserChoice) {
			log(`❌ Invalid browser selection for Profile ${windowIndex}`, windowIndex);
			return;
		}

		log(`🌐 Using browser: ${browserChoice.name} for Profile ${windowIndex}`, windowIndex);

		const fingerprint = await generateFingerprint(proxyURL);
		const userAgent = randomUA.getRandom();

		// Check if stop was requested before launching browser
		if (shouldStop) {
			log(
				`⏹️ Skipping Profile ${windowIndex} - automation stopped before browser launch`,
				windowIndex
			);
			return;
		}

		browserInstance = await browserChoice.launcher.launch({ headless: false });

		// Check if stop was requested after browser launch
		if (shouldStop) {
			log(
				`⏹️ Stopping Profile ${windowIndex} - automation stopped after browser launch`,
				windowIndex
			);
			try {
				await browserInstance.close();
			} catch (e) {
				log(`⚠️ Error closing browser after launch: ${e.message}`, windowIndex);
			}
			return;
		}

		// Add to active browsers for stop functionality
		activeBrowsers.push(browserInstance);

		// Check if stop was requested before creating context
		if (shouldStop) {
			log(
				`⏹️ Stopping Profile ${windowIndex} - automation stopped before context creation`,
				windowIndex
			);
			return;
		}

		context = await browserInstance.newContext({
			userAgent,
			viewport: fingerprint.screen,
			locale: fingerprint.browserLanguages[0],
			timezoneId: fingerprint.timezone
		});

		// Check if stop was requested after context creation
		if (shouldStop) {
			log(
				`⏹️ Stopping Profile ${windowIndex} - automation stopped after context creation`,
				windowIndex
			);
			return;
		}

		page = await context.newPage();

		// Check if stop was requested after page creation
		if (shouldStop) {
			log(
				`⏹️ Stopping Profile ${windowIndex} - automation stopped after page creation`,
				windowIndex
			);
			return;
		}

		// Inject fingerprint scripts
		await page.addInitScript((langs) => {
			Object.defineProperty(navigator, 'languages', {
				get: () => langs
			});
		}, fingerprint.browserLanguages);

		await page.addInitScript(({ vendor, renderer }) => {
			const getParameterProxyHandler = {
				apply: function (target, ctx, args) {
					const param = args[0];
					if (param === 37445) return vendor;
					if (param === 37446) return renderer;
					return Reflect.apply(target, ctx, args);
				}
			};
			const canvas = document.createElement('canvas');
			const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
			if (gl) {
				const ext = gl.getExtension('WEBGL_debug_renderer_info');
				if (ext) {
					const originalGetParameter = gl.getParameter;
					gl.getParameter = new Proxy(originalGetParameter, getParameterProxyHandler);
				}
			}
		}, fingerprint.webGLMetadata);

		// Navigate to the page with proper error handling
		try {
			// Check if stop was requested before starting navigation
			if (shouldStop) {
				log(
					`⏹️ Stopping Profile ${windowIndex} before navigation - automation stopped`,
					windowIndex
				);
				return;
			}

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
						`⏹️ Stopping Profile ${windowIndex} during navigation - automation stopped`,
						windowIndex
					);
					return;
				}
				throw navError; // Re-throw other navigation errors
			}

			// Check if stop was requested after page load
			if (shouldStop) {
				log(
					`⏹️ Stopping Profile ${windowIndex} after navigation - automation stopped`,
					windowIndex
				);
				return;
			}

			log(`🌐 Page loaded for Profile ${windowIndex} (Cycle ${cycle})`, windowIndex);

			// Check if stop was requested after page load
			if (shouldStop) {
				log(`⏹️ Stopping Profile ${windowIndex} - automation stopped`, windowIndex);
				return;
			}

			// 🎯 CRITICAL FIX: Start tracking AFTER page is loaded
			// Track this window ONLY after successful page load
			activeWindows.set(windowIndex, {
				browserInstance,
				startTime: Date.now(), // Timer starts NOW, after page load
				waitTime,
				cycle
			});

			log(
				`⏱️ Wait timer started for Profile ${windowIndex} (${waitTime}s allocated)`,
				windowIndex
			);
		} catch (navError) {
			log(
				`⚠️ Navigation failed for Profile ${windowIndex}: ${navError.message}`,
				windowIndex
			);
			// Don't track this window if navigation failed
			return;
		}

		log(`🕒 Time allocated: ${waitTime}s`, windowIndex);

		let usableScrollTime = waitTime;
		if (usableScrollTime > 10) {
			log(`⏳ Waiting 5s before scroll...`, windowIndex);
			await page.waitForTimeout(5000);
			usableScrollTime -= 5;
		}

		// Only attempt scrolling if page is still available and not stopped
		if (page && !page.isClosed() && !shouldStop) {
			await simulateHumanScroll(page, usableScrollTime);
			await page.waitForTimeout(1000);
		}

		log(
			`✅ Profile ${windowIndex} (Cycle ${cycle}) completed (${
				completedWindows + 1
			}/${totalWindows})`,
			windowIndex
		);
	} catch (err) {
		log(`❌ Error in Profile ${windowIndex} (Cycle ${cycle}): ${err.message}`, windowIndex);
	} finally {
		// Clean up resources
		try {
			if (page && !page.isClosed()) {
				await page.close();
			}
		} catch (closePageErr) {
			log(
				`⚠️ Failed to close page for Profile ${windowIndex}: ${closePageErr.message}`,
				windowIndex
			);
		}

		try {
			if (context) {
				await context.close();
			}
		} catch (closeContextErr) {
			log(
				`⚠️ Failed to close context for Profile ${windowIndex}: ${closeContextErr.message}`,
				windowIndex
			);
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
			log(
				`⚠️ Failed to close browser for Profile ${windowIndex}: ${closeBrowserErr.message}`,
				windowIndex
			);
		}

		// Remove from active windows and update completion count
		activeWindows.delete(windowIndex);
		completedWindows++;
	}
}

async function runAutomation(config) {
	const {
		url,
		proxyURL,
		browser = 'random',
		openCount = 1,
		profilesAtOnce = 1,
		timeout = 30,
		minWaitTime = 45,
		maxWaitTime = 55
	} = config;

	const totalCycles = Math.max(1, Math.min(parseInt(openCount), 20));
	const profilesPerCycle = Math.max(1, Math.min(parseInt(profilesAtOnce), 10));

	totalWindows = totalCycles * profilesPerCycle;
	completedWindows = 0;
	isAutomationInProgress = true; // Set automation as in progress

	// Reset stop state at the beginning
	resetStopState();

	// Run automation cycles
	for (let cycle = 1; cycle <= totalCycles; cycle++) {
		// Check if stop was requested before starting this cycle
		if (shouldStop) {
			log(`⏹️ Stopping automation - cycle ${cycle} cancelled`);
			break;
		}

		log(`🔄 Starting Cycle ${cycle}/${totalCycles}`);

		// Create promises for all profiles in this cycle
		const waitTimes = getRandomWaitTimes(profilesPerCycle, minWaitTime, maxWaitTime);

		const promises = Array.from({ length: profilesPerCycle }, (_, i) =>
			processWindow(
				(cycle - 1) * profilesPerCycle + i + 1,
				browser,
				url,
				proxyURL,
				waitTimes[i],
				cycle,
				timeout
			)
		);

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
			cycle: data.cycle
		};
	});

	return {
		totalWindows,
		completedWindows,
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
		shouldStop
	};
}

module.exports = { runAutomation, getStatus, stopAutomation, stopAllBrowsers };
