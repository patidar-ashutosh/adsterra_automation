// utils/helpers.js
const { chromium, firefox, webkit } = require('playwright');

const logs = [];

function log(message) {
	const time = new Date().toISOString();
	const entry = `[${time}] ${message}`;
	console.log(entry);
	logs.push(entry);
}

function getLogs() {
	return logs.join('\n');
}

function shuffleArray(arr) {
	return arr
		.map((a) => [Math.random(), a])
		.sort((a, b) => a[0] - b[0])
		.map((a) => a[1]);
}

function getRandomBrowser() {
	const browsers = [
		{ name: 'chromium', launcher: chromium },
		{ name: 'firefox', launcher: firefox },
		{ name: 'webkit', launcher: webkit }
	];
	return browsers[Math.floor(Math.random() * browsers.length)];
}

function getBrowserByName(name) {
	switch (name) {
		case 'chromium':
			return { name: 'chromium', launcher: chromium };
		case 'firefox':
			return { name: 'firefox', launcher: firefox };
		case 'webkit':
			return { name: 'webkit', launcher: webkit };
		default:
			return null;
	}
}

function getRandomWaitTimes(count, min = 45, max = 55) {
	return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

// function getSegmentDurations(totalTime, parts) {
// 	const base = totalTime / parts;
// 	return Array.from({ length: parts }, () => {
// 		const variation = Math.random() * 0.4 - 0.2;
// 		return Math.max(3, Math.floor(base + base * variation));
// 	});
// }

module.exports = {
	log,
	getLogs,
	shuffleArray,
	getRandomBrowser,
	getBrowserByName,
	getRandomWaitTimes
	// getSegmentDurations
};
