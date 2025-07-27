// utils/helpers.js
const { chromium, firefox, webkit } = require('playwright');

const logs = [];
const profileLogs = new Map(); // Track logs for each profile
const profileStatus = new Map(); // Track status for each profile

function log(message, profileIndex = null) {
	const time = new Date().toISOString();
	const entry = `[${time}] ${message}`;
	console.log(entry);
	logs.push(entry);

	// If profileIndex is provided, also log to that specific profile
	if (profileIndex !== null) {
		if (!profileLogs.has(profileIndex)) {
			profileLogs.set(profileIndex, []);
		}
		// Store logs without timestamp for cleaner display
		const cleanMessage = message;
		profileLogs.get(profileIndex).push(cleanMessage);
	}
}

// Function to update profile status
function updateProfileStatus(profileIndex, status) {
	profileStatus.set(profileIndex, status);
}

// Function to get profile status
function getProfileStatus(profileIndex) {
	return profileStatus.get(profileIndex) || 'waiting';
}

// Function to get all profile statuses
function getAllProfileStatuses() {
	const result = {};
	for (const [profileIndex, status] of profileStatus.entries()) {
		result[profileIndex] = status;
	}
	return result;
}

function getLogs() {
	return logs.join('\n');
}

function getProfileLogs(profileIndex) {
	const profileLog = profileLogs.get(profileIndex);
	return profileLog ? profileLog.join('\n') : '';
}

function getAllProfileLogs() {
	const result = {};
	for (const [profileIndex, logs] of profileLogs.entries()) {
		result[profileIndex] = logs.join('\n');
	}
	return result;
}

function clearProfileLogs() {
	profileLogs.clear();
	profileStatus.clear();
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

module.exports = {
	log,
	getLogs,
	getProfileLogs,
	getAllProfileLogs,
	clearProfileLogs,
	updateProfileStatus,
	getProfileStatus,
	getAllProfileStatuses,
	shuffleArray,
	getRandomBrowser,
	getBrowserByName,
	getRandomWaitTimes
};
