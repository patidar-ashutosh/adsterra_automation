// utils/log.js
const activityLogs = [];

function log(message) {
	const timestamp = new Date().toLocaleTimeString();
	const fullMessage = `[${timestamp}] ${message}`;
	console.log(fullMessage);
	activityLogs.push(fullMessage);

	// Keep logs from growing too large
	if (activityLogs.length > 1000) {
		activityLogs.shift(); // keep log size small
	}
}

function getLogs() {
	return activityLogs.join('\n');
}

module.exports = {
	log,
	getLogs
};
