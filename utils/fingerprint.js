const axios = require('axios');
const crypto = require('crypto');
const generateUserAgent = require('./userAgents.js');
const { generateCompleteDeviceProfile, getDeviceByName } = require('./mobileDevices.js');

function shuffleArray(arr) {
	const a = arr.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

async function generateFingerprint(browserName, deviceCategory, specificDevice = null) {
	// If specific device is provided, use it directly
	if (specificDevice && typeof specificDevice === 'string') {
		const device = getDeviceByName(specificDevice);
		if (device) {
			return generateMobileFingerprint(device);
		}
	}

	// If device category is mobile/tablet, use mobile fingerprinting
	if (deviceCategory === 'mobile' || deviceCategory === 'tablet') {
		const device = generateCompleteDeviceProfile(deviceCategory);
		return generateMobileFingerprint(device);
	}

	// Desktop fingerprinting (existing logic)
	return generateDesktopFingerprint(browserName);
}

// Generate mobile-specific fingerprint
function generateMobileFingerprint(device) {
	const screen = device.viewport;
	const languages = [device.language, device.language.split('-')[0]];
	const dpr = device.devicePixelRatio;
	const webgl = { vendor: device.webglVendor, renderer: device.webglRenderer };

	return {
		userAgent: device.userAgent,
		appVersion:
			device.appVersion ||
			device.userAgent.split('AppleWebKit/')[1]?.split(' ')[0] ||
			'605.1.15',
		platform: device.platform,
		vendor:
			device.vendor ||
			(device.platform === 'iPhone' || device.platform === 'iPad'
				? 'Apple Computer, Inc.'
				: 'Google Inc.'),
		os: device.os,
		browser: device.browser,
		browserLanguages: languages,
		screen: {
			width: screen.width,
			height: screen.height,
			colorDepth: 24,
			pixelDepth: 24
		},
		devicePixelRatio: dpr,
		timezone: device.timezone,
		fonts: shuffleArray(device.fonts || ['Arial', 'Helvetica', 'sans-serif']).slice(0, 5),
		deviceMemory: device.deviceMemory,
		hardwareConcurrency: device.hardwareConcurrency,
		plugins:
			device.platform === 'iPhone' || device.platform === 'iPad'
				? [
						{
							name: 'PDF Viewer',
							description: 'Portable Document Format',
							filename: 'internal-pdf-viewer'
						}
				  ]
				: [
						{
							name: 'Chrome PDF Plugin',
							description: 'Portable Document Format',
							filename: 'internal-pdf-viewer'
						},
						{
							name: 'Native Client',
							description: 'Native Client',
							filename: 'internal-nacl'
						}
				  ],
		mimeTypes:
			device.platform === 'iPhone' || device.platform === 'iPad'
				? [{ type: 'application/pdf', description: 'PDF Viewer', suffixes: 'pdf' }]
				: [
						{ type: 'application/pdf', description: 'PDF Viewer', suffixes: 'pdf' },
						{
							type: 'application/x-nacl',
							description: 'Native Client',
							suffixes: 'pnacl'
						}
				  ],
		webglVendor: webgl.vendor,
		webglRenderer: webgl.renderer,
		canvasNoise: crypto.randomBytes(16).toString('hex'),
		audioFingerprint: Math.random().toFixed(16),
		connection: {
			effectiveType: ['4g', '5g', '3g'][Math.floor(Math.random() * 3)],
			downlink: +(Math.random() * 50 + 20).toFixed(1), // Mobile speeds: 20-70 Mbps
			rtt: Math.floor(Math.random() * 80 + 20), // Mobile RTT: 20-100ms
			type: 'cellular'
		},
		maxTouchPoints: device.maxTouchPoints,
		isMobile: true,
		hasTouch: true,
		deviceCategory: device.deviceCategory,
		// Mobile-specific properties
		orientation: {
			type: 'portrait-primary',
			angle: 0
		},
		// Battery simulation for mobile
		battery: {
			charging: Math.random() > 0.3, // 70% chance of charging
			level: Math.random() * 0.4 + 0.3, // 30-70% battery level
			chargingTime: 0,
			dischargingTime: Math.floor(Math.random() * 3600) + 1800 // 30-90 minutes
		},
		// Mobile sensors
		sensors: {
			accelerometer: true,
			gyroscope: true,
			magnetometer: true,
			ambientLight: true
		}
	};
}

// Generate desktop fingerprint using the userAgents utility
function generateDesktopFingerprint(browserName) {
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

	// Use a random timezone from a diverse selection
	const timezones = [
		'UTC',
		'America/New_York',
		'America/Los_Angeles',
		'America/Chicago',
		'America/Denver',
		'Europe/London',
		'Europe/Paris',
		'Europe/Berlin',
		'Asia/Tokyo',
		'Asia/Shanghai',
		'Australia/Sydney'
	];
	const timezone = timezones[Math.floor(Math.random() * timezones.length)];

	const screen = screenProfiles[Math.floor(Math.random() * screenProfiles.length)];
	const languages = languageProfiles[Math.floor(Math.random() * languageProfiles.length)];
	const dpr = [1, 1.25, 1.5, 2][Math.floor(Math.random() * 4)];
	const webgl = webGLList[Math.floor(Math.random() * webGLList.length)];

	// Use the userAgents utility for consistent user agent generation
	const userAgentData = generateUserAgent({
		deviceCategory: 'desktop'
	});

	return {
		userAgent: userAgentData.ua,
		appVersion: userAgentData.appVersion,
		platform: userAgentData.platform,
		vendor: userAgentData.vendor,
		os: userAgentData.os,
		browser: userAgentData.browser,
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
		maxTouchPoints: 0, // desktop
		isMobile: false,
		hasTouch: false,
		deviceCategory: 'desktop'
	};
}

module.exports = generateFingerprint;
