const UserAgent = require('user-agents');

function generateUserAgent({
	browserName = 'Chrome',
	deviceCategory = 'desktop',
	platform = 'Win32',
	language = 'en-US'
}) {
	let userAgent;

	try {
		browserName = mapBrowserName(browserName);

		userAgent = new UserAgent({
			filter: {
				browserName,
				deviceCategory,
				platform,
				language
			}
		});
	} catch (err) {
		console.warn('⚠️ No exact match found, falling back to random user agent.');
		userAgent = new UserAgent(); // fallback to any random user agent
	}

	return {
		ua: userAgent.toString(),
		appVersion: userAgent.data.appVersion || '',
		platform: userAgent.data.platform || platform,
		vendor: userAgent.data.vendor || 'Google Inc.',
		os: userAgent.data.os || 'Windows',
		browser: userAgent.data.browser || 'Chrome'
	};
}

function mapBrowserName(engineName) {
	switch (engineName.toLowerCase()) {
		case 'chromium':
			return 'Chrome';
		case 'firefox':
			return 'Firefox';
		case 'webkit':
			return 'Safari';
		default:
			return engineName; // fallback to original name if unknown
	}
}

module.exports = generateUserAgent;

// const userAgents = [
// 	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
// 	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15',
// 	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
// ];
