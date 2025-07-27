const { log } = require('./helpers');

// New human-like scroll simulation
async function simulateHumanScroll(page, totalDuration = 20, profileIndex = null) {
	// Check if page is still available
	if (!page || page.isClosed()) {
		log('⚠️ Page is closed, skipping scroll simulation', profileIndex);
		return;
	}

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
		// Check if page is still available before each action
		if (!page || page.isClosed()) {
			log('⚠️ Page closed during scroll simulation, stopping', profileIndex);
			break;
		}

		log(
			`🔁 Scrolling ${action.direction} for ${action.duration.toFixed(
				1
			)}s after ${action.pause.toFixed(1)}s pause`,
			profileIndex
		);

		try {
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
				log(`🖱️ Moved mouse to (${x}, ${y})`, profileIndex);
			}

			if (Math.random() < 0.15) {
				await page.keyboard.down('Control');
				await page.keyboard.press('KeyF');
				await page.keyboard.up('Control');
				log(`🔎 Simulated Ctrl+F (Find) action`, profileIndex);
			}

			if (Math.random() < 0.3) {
				const pauseTime = 500 + Math.floor(Math.random() * 1500);
				log(`😴 Extra pause for ${(pauseTime / 1000).toFixed(1)}s`, profileIndex);
				await page.waitForTimeout(pauseTime);
			}
		} catch (error) {
			log(`⚠️ Error during scroll action: ${error.message}`, profileIndex);
			break;
		}
	}

	// Step: Visit all elements with `.ads` class
	if (!page || page.isClosed()) {
		log('⚠️ Page closed before visiting .ads elements', profileIndex);
		return;
	}

	log('🧭 Searching for .ads elements...', profileIndex);
	try {
		await page.evaluate(() => window.scrollTo(0, 0)); // Go to top before visiting ads
		await page.waitForTimeout(1000); // Optional short pause

		const adHandles = await page.$$('.ads');

		if (adHandles.length) {
			log(`🎯 Found ${adHandles.length} .ads elements. Visiting each...`, profileIndex);
			for (const [i, handle] of adHandles.entries()) {
				// Check if page is still available
				if (!page || page.isClosed()) {
					log('⚠️ Page closed while visiting .ads elements', profileIndex);
					break;
				}

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
							log(`🖱️ Hovered near .ads element #${i + 1}`, profileIndex);
						}
					}

					const pause = 2000 + Math.random() * 1000; // 2–3 seconds
					log(
						`⏸️ Pausing on .ads element #${i + 1} for ${(pause / 1000).toFixed(1)}s`,
						profileIndex
					);
					await page.waitForTimeout(pause);
				} catch (e) {
					log(`⚠️ Failed to visit .ads element #${i + 1}: ${e.message}`, profileIndex);
				}
			}
		} else {
			log('❌ No .ads elements found on the page.', profileIndex);
		}
	} catch (error) {
		log(`⚠️ Error while visiting .ads elements: ${error.message}`, profileIndex);
	}
}

module.exports = simulateHumanScroll;
