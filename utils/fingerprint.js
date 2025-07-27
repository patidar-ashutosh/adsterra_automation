// utils/fingerprint.js
const crypto = require('crypto');
const axios = require('axios');
const { shuffleArray } = require('./helpers');

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

module.exports = generateFingerprint;
