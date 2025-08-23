const { log } = require('./helpers');

// 🧠 Bezier curve helper for smooth mouse paths
function bezierCurve(p0, p1, p2, t) {
	const x = Math.pow(1 - t, 2) * p0.x + 2 * (1 - t) * t * p1.x + Math.pow(t, 2) * p2.x;
	const y = Math.pow(1 - t, 2) * p0.y + 2 * (1 - t) * t * p1.y + Math.pow(t, 2) * p2.y;
	return { x, y };
}

// 🖱️ Simulate smooth mouse movement using Bezier curve
async function moveMouseSmooth(page, from, to, steps = 25) {
	const mid = {
		x: (from.x + to.x) / 2 + (Math.random() * 100 - 50),
		y: (from.y + to.y) / 2 + (Math.random() * 100 - 50)
	};
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const point = bezierCurve(from, mid, to, t);
		await page.mouse.move(point.x, point.y);
		await page.waitForTimeout(5 + Math.random() * 10);
	}
	// Micro twitch at end
	if (Math.random() < 0.3) {
		for (let i = 0; i < 3; i++) {
			await page.mouse.move(to.x + Math.random() * 3 - 1.5, to.y + Math.random() * 3 - 1.5);
			await page.waitForTimeout(20 + Math.random() * 30);
		}
	}
}

// 📱 Mobile touch event simulation
async function simulateTouchEvent(page, x, y, eventType = 'touchstart', profileIndex = null) {
	try {
		await page.evaluate(
			({ x, y, eventType }) => {
				const touch = new Touch({
					identifier: Date.now(),
					target: document.elementFromPoint(x, y) || document.body,
					clientX: x,
					clientY: y,
					pageX: x,
					pageY: y,
					radiusX: 2.5,
					radiusY: 2.5,
					rotationAngle: 0,
					force: 1
				});

				const touchEvent = new TouchEvent(eventType, {
					cancelable: true,
					bubbles: true,
					touches: [touch],
					targetTouches: [touch],
					changedTouches: [touch]
				});

				document.elementFromPoint(x, y)?.dispatchEvent(touchEvent) ||
					document.body.dispatchEvent(touchEvent);
			},
			{ x, y, eventType }
		);

		log(`📱 ${eventType} at (${x}, ${y})`, profileIndex);
	} catch (error) {
		log(`⚠️ Touch event failed: ${error.message}`, profileIndex);
	}
}

// 📱 Mobile swipe gesture simulation
async function simulateSwipe(
	page,
	startX,
	startY,
	endX,
	endY,
	duration = 500,
	profileIndex = null
) {
	try {
		const steps = Math.floor(duration / 16); // 60fps
		const deltaX = (endX - startX) / steps;
		const deltaY = (endY - startY) / steps;

		// Touch start
		await simulateTouchEvent(page, startX, startY, 'touchstart', profileIndex);
		await page.waitForTimeout(50);

		// Touch move (swipe)
		for (let i = 1; i <= steps; i++) {
			const currentX = startX + deltaX * i;
			const currentY = startY + deltaY * i;
			await simulateTouchEvent(page, currentX, currentY, 'touchmove', profileIndex);
			await page.waitForTimeout(16); // 60fps
		}

		// Touch end
		await simulateTouchEvent(page, endX, endY, 'touchend', profileIndex);
		await page.waitForTimeout(100);

		log(`📱 Swipe from (${startX}, ${startY}) to (${endX}, ${endY})`, profileIndex);
	} catch (error) {
		log(`⚠️ Swipe failed: ${error.message}`, profileIndex);
	}
}

// 📱 Mobile pinch-to-zoom simulation
async function simulatePinchZoom(page, centerX, centerY, scale = 1.5, profileIndex = null) {
	try {
		const finger1Start = { x: centerX - 50, y: centerY - 50 };
		const finger1End = { x: centerX - 50 * scale, y: centerY - 50 * scale };
		const finger2Start = { x: centerX + 50, y: centerY + 50 };
		const finger2End = { x: centerX + 50 * scale, y: centerY + 50 * scale };

		// Start both touches
		await simulateTouchEvent(page, finger1Start.x, finger1Start.y, 'touchstart', profileIndex);
		await simulateTouchEvent(page, finger2Start.x, finger2Start.y, 'touchstart', profileIndex);
		await page.waitForTimeout(50);

		// Move both touches (pinch)
		const steps = 20;
		for (let i = 1; i <= steps; i++) {
			const progress = i / steps;
			const finger1X = finger1Start.x + (finger1End.x - finger1Start.x) * progress;
			const finger1Y = finger1Start.y + (finger1End.y - finger1Start.y) * progress;
			const finger2X = finger2Start.x + (finger2End.x - finger2Start.x) * progress;
			const finger2Y = finger2Start.y + (finger2End.y - finger2Start.y) * progress;

			await simulateTouchEvent(page, finger1X, finger1Y, 'touchmove', profileIndex);
			await simulateTouchEvent(page, finger2X, finger2Y, 'touchmove', profileIndex);
			await page.waitForTimeout(25);
		}

		// End both touches
		await simulateTouchEvent(page, finger1End.x, finger1End.y, 'touchend', profileIndex);
		await simulateTouchEvent(page, finger2End.x, finger2End.y, 'touchend', profileIndex);

		log(`📱 Pinch zoom at (${centerX}, ${centerY}) with scale ${scale}`, profileIndex);
	} catch (error) {
		log(`⚠️ Pinch zoom failed: ${error.message}`, profileIndex);
	}
}

// Advanced human-like scroll simulation
async function simulateHumanScroll(
	page,
	totalDuration = 20,
	profileIndex = null,
	timeoutId = null,
	isMobile = false
) {
	if (!page || page.isClosed()) {
		log('⚠️ Page is closed, skipping scroll simulation', profileIndex);
		return;
	}

	const actions = [];
	let remainingTime = totalDuration;
	const maxScrollDepth = Math.random() * 0.25 + 0.55; // 55% to 80%
	const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
	const willVisitAds = Math.random() < 0.6; // 60% of sessions interact with ads
	const visitAdsAfterAction = Math.floor(Math.random() * 3); // Random step to trigger ad check

	// Mobile-specific adjustments
	if (isMobile) {
		// Mobile users scroll more frequently but shorter distances
		const mobileScrollCount = Math.floor(remainingTime / 1.5); // More frequent scrolls
		for (let i = 0; i < mobileScrollCount && remainingTime > 2; i++) {
			const direction = Math.random() > 0.2 ? 'down' : 'up'; // 80% down, 20% up
			const pause = 0.5 + Math.random() * 1.5; // 0.5-2s (faster on mobile)
			const scrollSize = (Math.random() * 0.08 + 0.03) * pageHeight; // 3% to 11%
			const duration = 0.3 + Math.random() * 0.8; // 0.3-1.1s (faster on mobile)

			actions.push({ direction, scrollSize, duration, pause, isMobile: true });
			remainingTime -= duration + pause;
		}
	} else {
		// Desktop scroll behavior (existing logic)
		while (remainingTime > 2) {
			const direction = Math.random() > 0.3 ? 'down' : 'up';
			const pause = 1 + Math.random() * 2; // 1–3s
			const scrollSize = (Math.random() * 0.05 + 0.02) * pageHeight; // 2% to 7%
			const duration = 0.8 + Math.random() * 1.5; // 0.8–2.3s

			actions.push({ direction, scrollSize, duration, pause, isMobile: false });
			remainingTime -= duration + pause;
		}
	}

	log(
		`📋 Scroll plan created: ${actions.length} actions over ${totalDuration}s (Mobile: ${isMobile})`,
		profileIndex
	);
	log(`🎯 Will visit ads: ${willVisitAds ? 'Yes' : 'No'}`, profileIndex);
	log(`📏 Page height: ${Math.round(pageHeight)}px`, profileIndex);

	for (const [index, action] of actions.entries()) {
		// Check if page is closed or timeout has been triggered
		if (!page || page.isClosed()) {
			log('⚠️ Page closed during scroll simulation, stopping', profileIndex);
			break;
		}

		// If we have a timeout ID, check if the timeout has already fired by checking if page is still open
		// This is an indirect way to detect if our timeout has been triggered
		try {
			await page.evaluate(() => window.location.href); // Simple check to see if page is still responsive
		} catch (e) {
			log(
				'⚠️ Page became unresponsive, likely due to timeout - stopping scroll',
				profileIndex
			);
			break;
		}

		log(
			`🔁 Action ${index + 1}/${actions.length}: Scrolling ${
				action.direction
			} for ${action.duration.toFixed(1)}s after ${action.pause.toFixed(1)}s pause (Mobile: ${
				action.isMobile
			})`,
			profileIndex
		);

		try {
			await page.waitForTimeout(action.pause * 1000);

			// Check again before scrolling
			if (!page || page.isClosed()) {
				log('⚠️ Page closed during action pause, stopping', profileIndex);
				break;
			}

			if (action.isMobile) {
				// Mobile scroll with touch events
				await simulateMobileScroll(page, action, profileIndex);
			} else {
				// Desktop scroll with mouse wheel
				await simulateDesktopScroll(page, action, profileIndex);
			}

			// Check before each additional action
			if (!page || page.isClosed()) break;

			// 🔁 This makes the bot occasionally idle and simulate tab-switching, increasing realism
			await simulateIdleBehavior(page, profileIndex, action.isMobile);

			if (!page || page.isClosed()) break;

			// Mobile-specific interactions
			if (action.isMobile) {
				await simulateMobileInteractions(page, profileIndex);
			} else {
				await simulateDesktopInteractions(page, profileIndex);
			}

			if (!page || page.isClosed()) break;

			// Possibly visit .ads during the session
			if (willVisitAds && index === visitAdsAfterAction) {
				await simulateAdInteraction(page, profileIndex, action.isMobile);
			}
		} catch (error) {
			log(`⚠️ Error during scroll action: ${error.message}`, profileIndex);
			break;
		}
	}

	// Random scroll to top or middle at end (simulate user wrap-up)
	if (Math.random() < 0.3 && page && !page.isClosed()) {
		const position =
			Math.random() < 0.5
				? 0
				: await page.evaluate(() => document.documentElement.scrollHeight * 0.5);

		if (isMobile) {
			// Mobile scroll to position
			await simulateMobileScrollTo(page, position, profileIndex);
		} else {
			// Desktop scroll to position
			await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), position);
		}

		log(`↩️ Scrolled to ${position === 0 ? 'top' : 'middle'} of the page`, profileIndex);
		await page.waitForTimeout(500 + Math.random() * 1000);
	}

	log(`🎉 Scroll simulation completed (Mobile: ${isMobile})`, profileIndex);
}

// Mobile scroll simulation
async function simulateMobileScroll(page, action, profileIndex) {
	const currentScrollY = await page.evaluate(() => window.scrollY);
	const scrollHeight = await page.evaluate(
		() => document.documentElement.scrollHeight - window.innerHeight
	);

	let startY = currentScrollY;
	let endY =
		action.direction === 'down'
			? Math.min(scrollHeight, startY + action.scrollSize)
			: Math.max(0, startY - action.scrollSize);

	// Simulate touch scroll with momentum
	const steps = Math.floor(action.duration * 60); // 60fps
	for (let i = 0; i <= steps; i++) {
		const progress = i / steps;
		// Mobile scroll has more momentum and bounce
		const ease = 0.5 - Math.cos(progress * Math.PI) / 2; // ease-in-out
		let y = startY + (endY - startY) * ease;

		// Add slight horizontal movement for mobile realism
		const x = Math.sin(progress * Math.PI) * (Math.random() * 2 - 1);

		await page.evaluate(
			({ y, x }) => {
				window.scrollTo(x, y);
			},
			{ y, x }
		);

		await page.waitForTimeout((action.duration * 1000) / steps);
	}
}

// Desktop scroll simulation
async function simulateDesktopScroll(page, action, profileIndex) {
	await page.evaluate(async ({ direction, scrollSize, duration }) => {
		const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
		let startY = window.scrollY;
		let endY =
			direction === 'down'
				? Math.min(scrollHeight, startY + scrollSize)
				: Math.max(0, startY - scrollSize);
		const steps = 60 * duration;

		for (let i = 0; i <= steps; i++) {
			let progress = i / steps;
			let ease = 0.5 - Math.cos(progress * Math.PI) / 2; // ease-in-out
			let y = startY + (endY - startY) * ease;
			window.scrollTo(0, y);
			await new Promise((r) => setTimeout(r, (duration * 1000) / steps));
		}
	}, action);
}

// Mobile scroll to specific position
async function simulateMobileScrollTo(page, position, profileIndex) {
	const currentScrollY = await page.evaluate(() => window.scrollY);
	const distance = position - currentScrollY;
	const duration = Math.abs(distance) / 1000; // 1px per ms

	await simulateMobileScroll(
		page,
		{
			direction: distance > 0 ? 'down' : 'up',
			scrollSize: Math.abs(distance),
			duration: Math.max(0.5, duration),
			pause: 0,
			isMobile: true
		},
		profileIndex
	);
}

// Mobile-specific interactions
async function simulateMobileInteractions(page, profileIndex) {
	// Touch-based interactions
	if (Math.random() < 0.3) {
		const x = Math.floor(Math.random() * 400) + 50;
		const y = Math.floor(Math.random() * 600) + 50;
		await simulateTouchEvent(page, x, y, 'touchstart', profileIndex);
		await page.waitForTimeout(100 + Math.random() * 200);
		await simulateTouchEvent(page, x, y, 'touchend', profileIndex);
	}

	// Swipe gestures
	if (Math.random() < 0.2) {
		const startX = Math.floor(Math.random() * 300) + 50;
		const startY = Math.floor(Math.random() * 400) + 100;
		const endX = startX + (Math.random() * 200 - 100);
		const endY = startY + (Math.random() * 200 - 100);
		await simulateSwipe(
			page,
			startX,
			startY,
			endX,
			endY,
			300 + Math.random() * 400,
			profileIndex
		);
	}

	// Pinch zoom
	if (Math.random() < 0.1) {
		const centerX = Math.floor(Math.random() * 300) + 100;
		const centerY = Math.floor(Math.random() * 400) + 100;
		const scale = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
		await simulatePinchZoom(page, centerX, centerY, scale, profileIndex);
	}

	// Mobile keyboard
	if (Math.random() < 0.15) {
		await page.keyboard.press('ArrowDown');
		log(`⬇️ ArrowDown (Mobile)`, profileIndex);
	}

	if (Math.random() < 0.15) {
		await page.keyboard.press('ArrowUp');
		log(`⬆️ ArrowUp (Mobile)`, profileIndex);
	}
}

// Desktop interactions (existing logic)
async function simulateDesktopInteractions(page, profileIndex) {
	if (Math.random() < 0.4) {
		const x = Math.floor(Math.random() * 800) + 100;
		const y = Math.floor(Math.random() * 500) + 100;
		const from = { x: Math.random() * 1000, y: Math.random() * 700 };
		await moveMouseSmooth(page, from, { x, y });
		log(`🌀 Smoothly moved mouse to (${x}, ${y})`, profileIndex);
	}

	if (Math.random() < 0.2) {
		await page.keyboard.down('Control');
		await page.keyboard.press('KeyF');
		await page.keyboard.up('Control');
		log(`🔎 Simulated Ctrl+F`, profileIndex);
	}

	if (Math.random() < 0.3) {
		const pauseTime = 500 + Math.floor(Math.random() * 1500);
		log(`😴 Extra pause for ${(pauseTime / 1000).toFixed(1)}s`, profileIndex);
		await page.waitForTimeout(pauseTime);
	}

	if (Math.random() < 0.1) {
		await page.keyboard.press('ArrowDown');
		log(`⬇️ ArrowDown`, profileIndex);
	}

	if (Math.random() < 0.1) {
		await page.keyboard.press('ArrowUp');
		log(`⬆️ ArrowUp`, profileIndex);
	}

	if (Math.random() < 0.25) {
		log('📝 Simulating text selection', profileIndex);
		await page.evaluate(() => {
			const getTextNodes = (node) => {
				const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
				const textNodes = [];
				while (walker.nextNode()) {
					const el = walker.currentNode.parentElement;
					if (
						el &&
						el.tagName.toLowerCase() !== 'a' &&
						walker.currentNode.textContent.trim().length > 20
					) {
						textNodes.push(walker.currentNode);
					}
				}
				return textNodes;
			};

			const textNodes = getTextNodes(document.body);
			if (textNodes.length > 0) {
				const node = textNodes[Math.floor(Math.random() * textNodes.length)];
				const range = document.createRange();
				const textLength = node.textContent.length;
				const start = Math.floor(Math.random() * (textLength - 10));
				const end = start + 10 + Math.floor(Math.random() * 20);
				range.setStart(node, start);
				range.setEnd(node, Math.min(end, textLength));
				const sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
				setTimeout(() => sel.removeAllRanges(), 2000 + Math.random() * 4000);
			}
		});
	}

	if (Math.random() < 0.2) {
		log('🔗 Simulating link hover', profileIndex);
		await page.evaluate(() => {
			const links = Array.from(document.querySelectorAll('a'));
			if (links.length > 0) {
				const link = links[Math.floor(Math.random() * links.length)];
				const rect = link.getBoundingClientRect();
				const x = rect.left + rect.width / 2;
				const y = rect.top + rect.height / 2;
				window.dispatchEvent(
					new MouseEvent('mousemove', {
						clientX: x,
						clientY: y,
						bubbles: true
					})
				);
			}
		});
	}

	if (Math.random() < 0.15) {
		log('📋 Simulating text copy', profileIndex);
		await page.keyboard.down('Control');
		await page.keyboard.press('KeyC');
		await page.keyboard.up('Control');
	}
}

async function simulateAdInteraction(page, profileIndex, isMobile = false) {
	if (!page || page.isClosed()) return;
	log('🧭 Searching for .ads elements...', profileIndex);

	try {
		const adHandles = await page.$$('.ads');

		if (adHandles.length) {
			log(`🎯 Found ${adHandles.length} .ads elements`, profileIndex);
			for (const [i, handle] of adHandles.entries()) {
				if (!page || page.isClosed()) break;
				try {
					await handle.evaluate((el) => {
						el.scrollIntoView({ behavior: 'smooth', block: 'center' });
					});

					if (Math.random() < 0.7) {
						const box = await handle.boundingBox();
						if (box) {
							const x = box.x + box.width / 2 + (Math.random() * 30 - 15);
							const y = box.y + box.height / 2 + (Math.random() * 30 - 15);

							if (isMobile) {
								// Mobile touch interaction
								await simulateTouchEvent(page, x, y, 'touchstart', profileIndex);
								await page.waitForTimeout(100 + Math.random() * 200);
								await simulateTouchEvent(page, x, y, 'touchend', profileIndex);
							} else {
								// Desktop mouse interaction
								await page.mouse.move(x, y, { steps: 10 });
							}

							log(
								`🖱️ ${isMobile ? 'Touched' : 'Hovered'} near .ads element #${
									i + 1
								}`,
								profileIndex
							);
						}
					}
					const pause = 2000 + Math.random() * 1000;
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
			log('❌ No .ads elements found', profileIndex);
		}
	} catch (error) {
		log(`⚠️ Error while visiting .ads elements: ${error.message}`, profileIndex);
	}
}

const simulateIdleBehavior = async (page, profileIndex, isMobile = false) => {
	try {
		const idleChance = Math.random();
		if (idleChance < 0.15) {
			// 15% chance to idle every loop
			const idleTime = Math.floor(Math.random() * 5000) + 5000; // 5-10 sec
			log(`😴 Idling for ${idleTime / 1000}s...`, profileIndex);

			// Randomly decide whether to simulate tab switch (blur/focus)
			const switchTabs = Math.random() < 0.5;
			if (switchTabs) {
				try {
					await page.evaluate(() => window.dispatchEvent(new Event('blur')));
					log(`🔄 Simulating tab blur...`, profileIndex);
					await new Promise((res) => setTimeout(res, Math.floor(idleTime / 2)));
					await page.evaluate(() => window.dispatchEvent(new Event('focus')));
					log(`🔄 Simulating tab focus...`, profileIndex);
					await new Promise((res) => setTimeout(res, Math.floor(idleTime / 2)));
				} catch (e) {
					log(`⚠️ Error simulating tab switch: ${e.message}`, profileIndex);
					await new Promise((res) => setTimeout(res, idleTime));
				}
			} else {
				await new Promise((res) => setTimeout(res, idleTime));
			}
		}
	} catch (err) {
		log(`⚠️ Idle behavior failed: ${err.message}`, profileIndex);
	}
};

module.exports = simulateHumanScroll;
