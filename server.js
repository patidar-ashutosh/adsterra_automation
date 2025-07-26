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

function getRandomWaitTimes(count, min = 35, max = 55) {
	return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

function getSegmentDurations(totalTime, parts) {
	const base = totalTime / parts;
	return Array.from({ length: parts }, () => {
		const variation = Math.random() * 0.4 - 0.2;
		return Math.max(3, Math.floor(base + base * variation));
	});
}

app.post('/open-url', async (req, res) => {
	const { blogURL, ProxyURL, browser, openCount, profilesAtOnce } = req.body;

	if (!blogURL || !ProxyURL) {
		return res.status(400).json({ error: 'Missing blogURL or ProxyURL' });
	}

	const combinedURL = ProxyURL + encodeURIComponent(blogURL);
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
			const waitTimes = getRandomWaitTimes(profilesPerCycle, 3, 5);

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

		const scrollPlan = [
			{ start: 0.1, end: 0.3 },
			{ start: 0.3, end: 0.5 },
			{ start: 0.5, end: 0.8 },
			{ start: 0.8, end: 1.0 }
		];
		const durations = getSegmentDurations(usableScrollTime, scrollPlan.length);
		scrollPlan.forEach((seg, index) => (seg.duration = durations[index]));

		for (const seg of scrollPlan) {
			log(
				`📜 Profile ${windowIndex} (Cycle ${cycle}): Scrolling from ${Math.round(
					seg.start * 100
				)}% to ${Math.round(seg.end * 100)}% in ${seg.duration}s`
			);
			await page.evaluate(
				async ({ start, end, duration }) => {
					const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
					const startY = Math.floor(scrollHeight * start);
					const endY = Math.floor(scrollHeight * end);
					const steps = 60 * duration;

					for (let i = 0; i <= steps; i++) {
						const y = startY + (endY - startY) * (i / steps);
						window.scrollTo(0, y);
						await new Promise((r) => setTimeout(r, (duration * 1000) / steps));
					}
				},
				{ start: seg.start, end: seg.end, duration: seg.duration }
			);

			await new Promise((r) => setTimeout(r, 1000 + Math.floor(Math.random() * 2000)));
		}

		// Safe random text selection
		if (Math.random() < 0.5) {
			log(`🖱️ Attempting text selection in Profile ${windowIndex} (Cycle ${cycle})`);
			const safeElementHandle = await page.evaluateHandle(() => {
				const candidates = Array.from(document.querySelectorAll('p, span, div')).filter(
					(el) => {
						const style = window.getComputedStyle(el);
						const rect = el.getBoundingClientRect();
						const hasText = el.innerText.trim().length > 10;
						const isVisible =
							rect.width > 50 &&
							rect.height > 10 &&
							style.display !== 'none' &&
							style.visibility !== 'hidden';
						const isSafe =
							!el.closest('a') &&
							!el.closest('.ads, .ad, .sponsored, [class*="ad"], [id*="ad"]');
						return hasText && isVisible && isSafe;
					}
				);
				const randomIndex = Math.floor(Math.random() * candidates.length);
				return candidates[randomIndex] || null;
			});

			if (safeElementHandle) {
				const box = await safeElementHandle.boundingBox();
				if (box) {
					const mouse = page.mouse;
					const x1 = box.x + 5;
					const y1 = box.y + 5;
					const x2 = x1 + Math.min(100, box.width - 10);
					const y2 = y1 + Math.min(20, box.height - 10);

					await mouse.move(x1, y1);
					await mouse.down();
					await mouse.move(x2, y2, { steps: 10 });
					await mouse.up();

					log(
						`📋 Profile ${windowIndex} (Cycle ${cycle}): Text selected and copied at (${Math.round(
							x1
						)}, ${Math.round(y1)})`
					);
					await page.keyboard.down('Control');
					await page.keyboard.press('KeyC');
					await page.keyboard.up('Control');
				}
			} else {
				log(
					`⚠️ Profile ${windowIndex} (Cycle ${cycle}): No safe element found for selection`
				);
			}
		}

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
