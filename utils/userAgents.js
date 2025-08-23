const UserAgent = require('user-agents');

function generateUserAgent({ deviceCategory = 'desktop' }) {
	let userAgent;

	try {
		userAgent = new UserAgent({
			deviceCategory
		});
	} catch (err) {
		console.warn('⚠️ No exact match found, falling back to random user agent.');
		userAgent = new UserAgent(); // fallback to any random user agent
	}

	return {
		ua: userAgent.toString(),
		appVersion: userAgent.data.appVersion || '',
		platform: userAgent.data.platform || 'Win32',
		vendor: userAgent.data.vendor || 'Google Inc.',
		os: userAgent.data.os || 'Windows',
		browser: userAgent.data.browser || 'Chrome'
	};
}

module.exports = generateUserAgent;
