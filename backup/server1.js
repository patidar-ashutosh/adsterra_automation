const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { chromium, firefox, webkit } = require('playwright');
const randomUA = require('random-useragent');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = 3000;

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

// Logging utility
function log(msg) {
	const timestamp = new Date().toLocaleTimeString();
	const fullMsg = `[${timestamp}] ${msg}`;
	console.log(fullMsg);
	activityLogs.push(fullMsg);
	if (activityLogs.length > 1000) activityLogs.shift(); // keep log size small
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from same folder
app.use(express.static(path.join(__dirname)));

function shuffleArray(arr) {
	return arr
		.map((a) => [Math.random(), a])
		.sort((a, b) => a[0] - b[0])
		.map((a) => a[1]);
}

async function generateFingerprint(proxyURL = '') {
	const screenWidths = [1920, 1366, 1440, 1536, 1600];
	const screenHeights = [1080, 768, 900, 864, 900];
	const languages = [
		['en-US', 'en'],
		['fr-FR', 'fr'],
		['de-DE', 'de'],
		['hi-IN', 'hi']
	];
	const fonts = ['Arial', 'Verdana', 'Tahoma', 'Times New Roman', 'Courier New'];

	let timezone = 'UTC';
	try {
		const ip = proxyURL.replace(/^http(s)?:\/\//, '').split(':')[0];
		const geoRes = await axios.get(`http://ip-api.com/json/${ip}`);
		if (geoRes.data && geoRes.data.timezone) {
			timezone = geoRes.data.timezone;
		}
	} catch (err) {
		console.warn('⚠️ Failed to fetch timezone from IP:', err.message);
	}

	return {
		screen: {
			width: screenWidths[Math.floor(Math.random() * screenWidths.length)],
			height: screenHeights[Math.floor(Math.random() * screenHeights.length)]
		},
		browserLanguages: languages[Math.floor(Math.random() * languages.length)],
		timezone,
		fonts: shuffleArray(fonts).slice(0, 3),
		canvasFingerprint: crypto.randomBytes(16).toString('hex'),
		webGLMetadata: {
			vendor: 'NVIDIA Corporation',
			renderer: 'NVIDIA GeForce RTX 4090'
		}
	};
}

// Serve log UI
app.get('/', (req, res) => {
	res.send(`
        <html>
        <head>
            <title>Automation Logs</title>
            <style>
                body { font-family: monospace; background: #111; color: #0f0; padding: 20px; }
                textarea { width: 100%; height: 90vh; background: #000; color: #0f0; border: none; padding: 10px; resize: none; }
            </style>
        </head>
        <body>
            <h2>🧠 Automation Activity Logs</h2>
            <textarea id="logBox" readonly></textarea>
            <script>
                async function updateLogs() {
                    const res = await fetch('/logs');
                    const text = await res.text();
                    document.getElementById('logBox').value = text;
                }
                updateLogs();
                setInterval(updateLogs, 3000);
            </script>
        </body>
        </html>
    `);
});

// Logs endpoint
app.get('/logs', (req, res) => {
	res.setHeader('Content-Type', 'text/plain');
	res.send(activityLogs.join('\n'));
});

function getRandomBrowser() {
	const browsers = [
		{ name: 'chromium', launcher: chromium },
		{ name: 'firefox', launcher: firefox },
		{ name: 'webkit', launcher: webkit }
	];
	return browsers[Math.floor(Math.random() * browsers.length)];
}

function getBrowserByName(name) {
	if (name === 'chromium') return { name: 'chromium', launcher: chromium };
	if (name === 'firefox') return { name: 'firefox', launcher: firefox };
	if (name === 'webkit') return { name: 'webkit', launcher: webkit };
	return null;
}

function getRandomWaitTimes(count, min = 45, max = 55) {
	return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

function getSegmentDurations(totalTime, parts) {
	const base = totalTime / parts;
	return Array.from({ length: parts }, () => {
		const variation = Math.random() * 0.4 - 0.2;
		return Math.max(3, Math.floor(base + base * variation));
	});
}

// New human-like scroll simulation
async function simulateHumanScroll(page, totalDuration = 20) {
	const actions = [];
	let remainingTime = totalDuration;

	// Simulate human exploring only part of the page
	const maxScrollDepth = Math.random() * 0.2 + 0.5; // 50% to 70%

	while (remainingTime > 2) {
		const direction = Math.random() > 0.3 ? 'down' : 'up';
		const pause = 2 + Math.random(); // 2–3 seconds pause

		// Smaller scroll ranges for slower feel
		const scrollStart = Math.random() * 0.05; // small offset
		const scrollSize =
			direction === 'down'
				? Math.random() * 0.06 + 0.02 // 2% to 8%
				: Math.random() * 0.03 + 0.01; // 1% to 4%

		const percent =
			direction === 'down'
				? [scrollStart, Math.min(scrollStart + scrollSize, maxScrollDepth)]
				: [scrollStart, scrollStart + scrollSize];

		const duration = 1 + Math.random(); // 1–2 seconds duration

		actions.push({ direction, duration, pause, percent });
		remainingTime -= duration + pause;
	}

	for (const action of actions) {
		log(
			`🔁 Scrolling ${action.direction} for ${action.duration.toFixed(
				1
			)}s after ${action.pause.toFixed(1)}s pause`
		);
		await page.waitForTimeout(action.pause * 1000);

		await page.evaluate(async ({ direction, duration, percent }) => {
			const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
			const currentY = window.scrollY;

			const scrollDistance = scrollHeight * (percent[1] - percent[0]);
			const startY = currentY;
			const endY =
				direction === 'down'
					? Math.min(scrollHeight, startY + scrollDistance)
					: Math.max(0, startY - scrollDistance);

			const steps = 60 * duration;

			for (let i = 0; i <= steps; i++) {
				const y = startY + (endY - startY) * (i / steps);
				window.scrollTo(0, y);
				await new Promise((r) => setTimeout(r, (duration * 1000) / steps));
			}
		}, action);

		if (Math.random() < 0.4) {
			const x = Math.floor(Math.random() * 800) + 100;
			const y = Math.floor(Math.random() * 500) + 100;
			await page.mouse.move(x, y, { steps: 10 });
			log(`🖱️ Moved mouse to (${x}, ${y})`);
		}

		if (Math.random() < 0.15) {
			await page.keyboard.down('Control');
			await page.keyboard.press('KeyF');
			await page.keyboard.up('Control');
			log(`🔎 Simulated Ctrl+F (Find) action`);
		}

		if (Math.random() < 0.3) {
			const pauseTime = 500 + Math.floor(Math.random() * 1500);
			log(`😴 Extra pause for ${(pauseTime / 1000).toFixed(1)}s`);
			await page.waitForTimeout(pauseTime);
		}
	}

	// Step: Visit all elements with `.ads` class
	log('🧭 Searching for .ads elements...');
	await page.evaluate(() => window.scrollTo(0, 0)); // Go to top before visiting ads
	await page.waitForTimeout(1000); // Optional short pause

	const adHandles = await page.$$('.ads');

	if (adHandles.length) {
		log(`🎯 Found ${adHandles.length} .ads elements. Visiting each...`);
		for (const [i, handle] of adHandles.entries()) {
			try {
				await handle.evaluate((el) => {
					el.scrollIntoView({ behavior: 'smooth', block: 'center' });
				});

				// Random mouse move near the ad
				if (Math.random() < 0.6) {
					const box = await handle.boundingBox();
					if (box) {
						const x = box.x + box.width / 2 + (Math.random() * 30 - 15);
						const y = box.y + box.height / 2 + (Math.random() * 30 - 15);
						await page.mouse.move(x, y, { steps: 10 });
						log(`🖱️ Hovered near .ads element #${i + 1}`);
					}
				}

				const pause = 2000 + Math.random() * 1000; // 2–3 seconds
				log(`⏸️ Pausing on .ads element #${i + 1} for ${(pause / 1000).toFixed(1)}s`);
				await page.waitForTimeout(pause);
			} catch (e) {
				log(`⚠️ Failed to visit .ads element #${i + 1}: ${e.message}`);
			}
		}
	} else {
		log('❌ No .ads elements found on the page.');
	}
}

app.post('/open-url', async (req, res) => {
	const { blogURL, ProxyURL, browser, openCount, profilesAtOnce } = req.body;

	if (!blogURL || !ProxyURL) {
		return res.status(400).json({ error: 'Missing blogURL or ProxyURL' });
	}

	// const combinedURL = ProxyURL + encodeURIComponent(blogURL);
	const combinedURL = 'https://apkmody.com/';
	const totalCycles = Math.max(1, Math.min(parseInt(openCount) || 1, 20));
	const profilesPerCycle = Math.max(1, Math.min(parseInt(profilesAtOnce) || 1, 10));

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
		// Run automation cycles
		for (let cycle = 1; cycle <= totalCycles; cycle++) {
			log(`🔄 Starting Cycle ${cycle}/${totalCycles}`);

			// Create promises for all profiles in this cycle
			const cyclePromises = [];
			const waitTimes = getRandomWaitTimes(profilesPerCycle);

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
			await Promise.allSettled(cyclePromises);

			log(`✅ Cycle ${cycle} completed`);

			// Small delay between cycles (except for the last cycle)
			if (cycle < totalCycles) {
				log(`🕔 Waiting 5s before Cycle ${cycle + 1}...`);
				await new Promise((r) => setTimeout(r, 5000));
			}
		}

		automationRunning = false;
		automationDone = true;
		currentWindow = 0;
		currentWaitTime = 0;
		currentWindowStart = 0;
		activeWindows.clear();
		log(`🎉 All ${totalCycles} cycles completed successfully!`);
	})();
});

// Function to process a single window
async function processWindow(windowIndex, browser, combinedURL, ProxyURL, waitTime, cycle) {
	try {
		log(`🚀 Opening Profile ${windowIndex} (Cycle ${cycle})`);

		// Select browser for this specific window
		const browserChoice = browser !== 'random' ? getBrowserByName(browser) : getRandomBrowser();
		if (!browserChoice) {
			log(`❌ Invalid browser selection for Profile ${windowIndex}`);
			return;
		}

		log(`🌐 Using browser: ${browserChoice.name} for Profile ${windowIndex}`);

		const fingerprint = await generateFingerprint(ProxyURL);
		const userAgent = randomUA.getRandom();

		const browserInstance = await browserChoice.launcher.launch({ headless: false });
		const context = await browserInstance.newContext({
			userAgent,
			viewport: fingerprint.screen,
			locale: fingerprint.browserLanguages[0],
			timezoneId: fingerprint.timezone
		});
		const page = await context.newPage();

		// Track this window
		activeWindows.set(windowIndex, {
			browserInstance,
			startTime: Date.now(),
			waitTime: waitTime,
			cycle: cycle
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

		await page.goto(combinedURL, { waitUntil: 'load' });
		log(`🌐 Page loaded for Profile ${windowIndex} (Cycle ${cycle})`);
		log(`🕒 Time allocated: ${waitTime}s`);

		let usableScrollTime = waitTime;
		if (usableScrollTime > 10) {
			log(`⏳ Waiting 5s before scroll...`);
			await page.waitForTimeout(5000);
			usableScrollTime -= 5;
		}

		await simulateHumanScroll(page, usableScrollTime);

		await new Promise((r) => setTimeout(r, 1000));
		await browserInstance.close();

		// Remove from active windows and update completion count
		activeWindows.delete(windowIndex);
		completedWindows++;

		log(
			`✅ Profile ${windowIndex} (Cycle ${cycle}) completed (${completedWindows}/${totalWindows})`
		);
	} catch (err) {
		log(`❌ Error in Profile ${windowIndex} (Cycle ${cycle}): ${err.message}`);

		// Clean up on error
		if (activeWindows.has(windowIndex)) {
			const windowData = activeWindows.get(windowIndex);
			try {
				await windowData.browserInstance.close();
			} catch (closeErr) {
				log(`⚠️ Failed to close browser for Profile ${windowIndex}: ${closeErr.message}`);
			}
			activeWindows.delete(windowIndex);
		}
		completedWindows++;
	}
}

app.get('/automation-status', (req, res) => {
	let status = {
		done: automationDone,
		totalWindows: totalWindows,
		completedWindows: completedWindows,
		activeWindows: activeWindows.size,
		progress: totalWindows > 0 ? Math.round((completedWindows / totalWindows) * 100) : 0
	};

	// Add current window info if any are active
	if (activeWindows.size > 0) {
		const activeWindowEntries = Array.from(activeWindows.entries());
		status.activeWindowDetails = activeWindowEntries.map(([windowIndex, data]) => {
			const elapsed = (Date.now() - data.startTime) / 1000;
			const remaining = Math.max(0, Math.ceil(data.waitTime - elapsed));
			return {
				windowIndex,
				elapsed: Math.round(elapsed),
				remaining,
				waitTime: data.waitTime
			};
		});
	}

	res.json(status);
});

app.listen(PORT, () => {
	console.log(`✅ Server running at http://localhost:${PORT}`);
	log(`🚦 Server started on port ${PORT}`);
});
