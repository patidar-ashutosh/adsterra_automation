// automation/index.js
const randomUA = require('random-useragent');
const { chromium, firefox, webkit } = require('playwright');
const generateFingerprint = require('../utils/fingerprint');
const simulateHumanScroll = require('../utils/scroll');
const { log, getBrowserByName, getRandomBrowser, getRandomWaitTimes } = require('../utils/helpers');

const activeWindows = new Map();
let totalWindows = 0;
let completedWindows = 0;

// Function to process a single window
async function processWindow(windowIndex, browser, combinedURL, proxyURL, waitTime, cycle) {
	let browserInstance = null;
	let context = null;
	let page = null;

	try {
		log(`🚀 Opening Profile ${windowIndex} (Cycle ${cycle})`);

		// Select browser for this specific window
		const browserChoice = browser !== 'random' ? getBrowserByName(browser) : getRandomBrowser();
		if (!browserChoice) {
			log(`❌ Invalid browser selection for Profile ${windowIndex}`);
			return;
		}

		log(`🌐 Using browser: ${browserChoice.name} for Profile ${windowIndex}`);

		const fingerprint = await generateFingerprint(proxyURL);
		const userAgent = randomUA.getRandom();

		browserInstance = await browserChoice.launcher.launch({ headless: false });
		context = await browserInstance.newContext({
			userAgent,
			viewport: fingerprint.screen,
			locale: fingerprint.browserLanguages[0],
			timezoneId: fingerprint.timezone
		});
		page = await context.newPage();

		// Track this window
		activeWindows.set(windowIndex, {
			browserInstance,
			startTime: Date.now(),
			waitTime,
			cycle
		});

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
			await page.goto(combinedURL, {
				waitUntil: 'load',
				timeout: 30000 // 30 second timeout
			});
			log(`🌐 Page loaded for Profile ${windowIndex} (Cycle ${cycle})`);
		} catch (navError) {
			log(`⚠️ Navigation failed for Profile ${windowIndex}: ${navError.message}`);
			// Continue with the process even if navigation fails
		}

		log(`🕒 Time allocated: ${waitTime}s`);

		let usableScrollTime = waitTime;
		if (usableScrollTime > 10) {
			log(`⏳ Waiting 5s before scroll...`);
			await page.waitForTimeout(5000);
			usableScrollTime -= 5;
		}

		// Only attempt scrolling if page is still available
		if (page && !page.isClosed()) {
			await simulateHumanScroll(page, usableScrollTime);
			await page.waitForTimeout(1000);
		}

		log(
			`✅ Profile ${windowIndex} (Cycle ${cycle}) completed (${
				completedWindows + 1
			}/${totalWindows})`
		);
	} catch (err) {
		log(`❌ Error in Profile ${windowIndex} (Cycle ${cycle}): ${err.message}`);
	} finally {
		// Clean up resources
		try {
			if (page && !page.isClosed()) {
				await page.close();
			}
		} catch (closePageErr) {
			log(`⚠️ Failed to close page for Profile ${windowIndex}: ${closePageErr.message}`);
		}

		try {
			if (context) {
				await context.close();
			}
		} catch (closeContextErr) {
			log(
				`⚠️ Failed to close context for Profile ${windowIndex}: ${closeContextErr.message}`
			);
		}

		try {
			if (browserInstance) {
				await browserInstance.close();
			}
		} catch (closeBrowserErr) {
			log(
				`⚠️ Failed to close browser for Profile ${windowIndex}: ${closeBrowserErr.message}`
			);
		}

		// Remove from active windows and update completion count
		activeWindows.delete(windowIndex);
		completedWindows++;
	}
}

async function runAutomation(config) {
	const { url, proxyURL, browser = 'random', openCount = 1, profilesAtOnce = 1 } = config;

	const totalCycles = Math.max(1, Math.min(parseInt(openCount), 20));
	const profilesPerCycle = Math.max(1, Math.min(parseInt(profilesAtOnce), 10));

	totalWindows = totalCycles * profilesPerCycle;
	completedWindows = 0;

	// Run automation cycles
	for (let cycle = 1; cycle <= totalCycles; cycle++) {
		log(`🔄 Starting Cycle ${cycle}/${totalCycles}`);

		// Create promises for all profiles in this cycle
		const waitTimes = getRandomWaitTimes(profilesPerCycle);

		const promises = Array.from({ length: profilesPerCycle }, (_, i) =>
			processWindow(
				(cycle - 1) * profilesPerCycle + i + 1,
				browser,
				url,
				proxyURL,
				waitTimes[i],
				cycle
			)
		);

		await Promise.allSettled(promises);
		log(`✅ Cycle ${cycle} completed`);

		// Small delay between cycles (except for the last cycle)
		if (cycle < totalCycles) {
			log(`🕔 Waiting 5s before Cycle ${cycle + 1}...`);
			await new Promise((r) => setTimeout(r, 5000));
		}
	}

	log(`🎉 All ${totalCycles} cycles completed successfully!`);
}

function getStatus() {
	const activeWindowDetails = Array.from(activeWindows.entries()).map(([windowIndex, data]) => {
		const elapsed = (Date.now() - data.startTime) / 1000;
		const remaining = Math.max(0, Math.ceil(data.waitTime - elapsed));
		return {
			windowIndex,
			elapsed: Math.round(elapsed),
			remaining,
			waitTime: data.waitTime
		};
	});

	return {
		totalWindows,
		completedWindows,
		activeWindows: activeWindows.size,
		progress: totalWindows > 0 ? Math.round((completedWindows / totalWindows) * 100) : 0,
		activeWindowDetails
	};
}

module.exports = { runAutomation, getStatus };
