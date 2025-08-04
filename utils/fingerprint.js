const axios = require('axios');
const crypto = require('crypto');
const generateUserAgent = require('./userAgents.js');

function shuffleArray(arr) {
	const a = arr.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

async function generateFingerprint(proxyURL = '', browserName, deviceCategory) {
	const screenProfiles = [
		{ width: 1920, height: 1080 },
		{ width: 1366, height: 768 },
		{ width: 1536, height: 864 },
		{ width: 1600, height: 900 }
	];
	const languageProfiles = [
		['en-US', 'en'],
		['fr-FR', 'fr'],
		['de-DE', 'de'],
		['hi-IN', 'hi'],
		['es-ES', 'es']
	];
	const fontPool = [
		'Arial',
		'Verdana',
		'Tahoma',
		'Trebuchet MS',
		'Georgia',
		'Times New Roman',
		'Courier New',
		'Comic Sans MS'
	];
	const webGLList = [
		{ vendor: 'Intel Inc.', renderer: 'Intel Iris OpenGL Engine' },
		{ vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3060/PCIe/SSE2' },
		{ vendor: 'AMD', renderer: 'AMD Radeon Pro 560 OpenGL Engine' }
	];

	let timezone = 'UTC';
	if (proxyURL && proxyURL.trim()) {
		try {
			const ip = proxyURL.replace(/^http(s)?:\/\//, '').split(':')[0];
			const geo = await axios.get(`http://ip-api.com/json/${ip}`, { timeout: 5000 });
			if (geo.data?.timezone) timezone = geo.data.timezone;
		} catch (e) {
			console.warn('⚠️ Timezone lookup failed:', e.message);
		}
	}

	const screen = screenProfiles[Math.floor(Math.random() * screenProfiles.length)];
	const languages = languageProfiles[Math.floor(Math.random() * languageProfiles.length)];
	const dpr = [1, 1.25, 1.5, 2][Math.floor(Math.random() * 4)];
	const uaMeta = await generateUserAgent({
		browserName: browserName || 'Chrome',
		deviceCategory: deviceCategory || 'desktop',
		platform: 'Win32',
		language: languages[0]
	});
	const webgl = webGLList[Math.floor(Math.random() * webGLList.length)];

	return {
		userAgent: uaMeta.ua,
		appVersion: uaMeta.appVersion,
		platform: uaMeta.platform,
		vendor: uaMeta.vendor,
		os: uaMeta.os,
		browser: uaMeta.browser,
		browserLanguages: languages,
		screen: { width: screen.width, height: screen.height, colorDepth: 24, pixelDepth: 24 },
		devicePixelRatio: dpr,
		timezone,
		fonts: shuffleArray(fontPool).slice(0, 5),
		deviceMemory: [4, 8, 16][Math.floor(Math.random() * 3)],
		hardwareConcurrency: [4, 8, 12][Math.floor(Math.random() * 3)],
		plugins: [
			{
				name: 'Chrome PDF Plugin',
				description: 'Portable Document Format',
				filename: 'internal-pdf-viewer'
			},
			{ name: 'Native Client', description: 'Native Client', filename: 'internal-nacl' }
		],
		mimeTypes: [
			{ type: 'application/pdf', description: 'PDF Viewer', suffixes: 'pdf' },
			{ type: 'application/x-nacl', description: 'Native Client', suffixes: 'pnacl' }
		],
		webglVendor: webgl.vendor,
		webglRenderer: webgl.renderer,
		canvasNoise: crypto.randomBytes(16).toString('hex'),
		audioFingerprint: Math.random().toFixed(16),
		connection: {
			effectiveType: ['4g', '3g', '2g', 'slow-2g'][Math.floor(Math.random() * 4)],
			downlink: +(Math.random() * 10 + 1).toFixed(1),
			rtt: Math.floor(Math.random() * 100 + 20),
			type: 'wifi'
		},
		maxTouchPoints: 0 // desktop
	};
}

module.exports = generateFingerprint;
