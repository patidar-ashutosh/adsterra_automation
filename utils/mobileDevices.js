// Dynamic Mobile Device Profile Generator
// =====================================

const generateUserAgent = require('./userAgents');

// Device category configurations
const deviceConfigs = {
	mobile: {
		platforms: ['Android', 'iOS'],
		viewportRanges: {
			Android: [
				{ width: 360, height: 640, dpr: 2 }, // Small Android
				{ width: 375, height: 667, dpr: 2 }, // Medium Android
				{ width: 390, height: 844, dpr: 3 }, // Large Android
				{ width: 412, height: 915, dpr: 3 }, // XL Android
				{ width: 428, height: 926, dpr: 3 } // XXL Android
			],
			iOS: [
				{ width: 375, height: 667, dpr: 2 }, // iPhone SE
				{ width: 390, height: 844, dpr: 3 }, // iPhone 12/13/14
				{ width: 393, height: 852, dpr: 3 }, // iPhone 15 Pro
				{ width: 428, height: 926, dpr: 3 } // iPhone 14 Plus
			]
		},
		hardwareProfiles: {
			Android: [
				{ cores: 4, memory: 3, gpu: 'Mali-G52' },
				{ cores: 6, memory: 4, gpu: 'Mali-G57' },
				{ cores: 8, memory: 6, gpu: 'Adreno 610' },
				{ cores: 8, memory: 8, gpu: 'Adreno 650' },
				{ cores: 8, memory: 12, gpu: 'Adreno 740' }
			],
			iOS: [
				{ cores: 6, memory: 3, gpu: 'Apple A13' },
				{ cores: 6, memory: 4, gpu: 'Apple A14' },
				{ cores: 6, memory: 6, gpu: 'Apple A15' },
				{ cores: 6, memory: 8, gpu: 'Apple A16' },
				{ cores: 6, memory: 8, gpu: 'Apple A17 Pro' }
			]
		}
	},
	tablet: {
		platforms: ['Android', 'iOS'],
		viewportRanges: {
			Android: [
				{ width: 768, height: 1024, dpr: 1.5 }, // Small Android tablet
				{ width: 800, height: 1280, dpr: 1.5 }, // Medium Android tablet
				{ width: 1024, height: 1366, dpr: 2 }, // Large Android tablet
				{ width: 1200, height: 1600, dpr: 2 } // XL Android tablet
			],
			iOS: [
				{ width: 768, height: 1024, dpr: 2 }, // iPad Mini
				{ width: 810, height: 1080, dpr: 2 }, // iPad Air
				{ width: 834, height: 1112, dpr: 2 }, // iPad Pro 11"
				{ width: 1024, height: 1366, dpr: 2 } // iPad Pro 12.9"
			]
		},
		hardwareProfiles: {
			Android: [
				{ cores: 6, memory: 4, gpu: 'Mali-G52' },
				{ cores: 8, memory: 6, gpu: 'Mali-G57' },
				{ cores: 8, memory: 8, gpu: 'Adreno 650' },
				{ cores: 8, memory: 12, gpu: 'Adreno 740' }
			],
			iOS: [
				{ cores: 6, memory: 4, gpu: 'Apple A13' },
				{ cores: 8, memory: 8, gpu: 'Apple M1' },
				{ cores: 8, memory: 8, gpu: 'Apple M2' },
				{ cores: 10, memory: 16, gpu: 'Apple M2 Pro' }
			]
		}
	},
	desktop: {
		platforms: ['Windows', 'macOS', 'Linux'],
		viewportRanges: {
			Windows: [
				{ width: 1366, height: 768, dpr: 1 },
				{ width: 1440, height: 900, dpr: 1.25 },
				{ width: 1536, height: 864, dpr: 1.25 },
				{ width: 1600, height: 900, dpr: 1.5 },
				{ width: 1920, height: 1080, dpr: 1.5 },
				{ width: 2560, height: 1440, dpr: 2 }
			],
			macOS: [
				{ width: 1440, height: 900, dpr: 2 },
				{ width: 1680, height: 1050, dpr: 2 },
				{ width: 1920, height: 1080, dpr: 2 },
				{ width: 2560, height: 1600, dpr: 2 },
				{ width: 3072, height: 1920, dpr: 2 }
			],
			Linux: [
				{ width: 1366, height: 768, dpr: 1 },
				{ width: 1440, height: 900, dpr: 1 },
				{ width: 1920, height: 1080, dpr: 1.25 },
				{ width: 2560, height: 1440, dpr: 1.5 }
			]
		},
		hardwareProfiles: {
			Windows: [
				{ cores: 4, memory: 8, gpu: 'Intel UHD Graphics' },
				{ cores: 6, memory: 16, gpu: 'NVIDIA GTX 1660' },
				{ cores: 8, memory: 16, gpu: 'NVIDIA RTX 3060' },
				{ cores: 12, memory: 32, gpu: 'NVIDIA RTX 4070' }
			],
			macOS: [
				{ cores: 8, memory: 8, gpu: 'Apple M1' },
				{ cores: 8, memory: 16, gpu: 'Apple M1 Pro' },
				{ cores: 10, memory: 16, gpu: 'Apple M1 Max' },
				{ cores: 12, memory: 32, gpu: 'Apple M2 Ultra' }
			],
			Linux: [
				{ cores: 4, memory: 8, gpu: 'Intel UHD Graphics' },
				{ cores: 6, memory: 16, gpu: 'AMD Radeon RX 5500' },
				{ cores: 8, memory: 32, gpu: 'NVIDIA RTX 3080' }
			]
		}
	}
};

// Font pools for different platforms
const fontPools = {
	Android: ['Roboto', 'Noto Sans', 'Product Sans', 'Google Sans', 'Segoe UI', 'Arial'],
	iOS: ['SF Pro Display', 'SF Pro Text', 'SF Mono', 'New York', 'Helvetica Neue', 'Arial'],
	Windows: ['Segoe UI', 'Arial', 'Calibri', 'Verdana', 'Tahoma', 'Times New Roman'],
	macOS: [
		'SF Pro Display',
		'SF Pro Text',
		'Helvetica Neue',
		'Arial',
		'Verdana',
		'Times New Roman'
	],
	Linux: ['Ubuntu', 'DejaVu Sans', 'Liberation Sans', 'Arial', 'Verdana', 'Times New Roman']
};

// WebGL renderer pools
const webglPools = {
	Android: [
		{ vendor: 'ARM', renderer: 'Mali-G52' },
		{ vendor: 'ARM', renderer: 'Mali-G57' },
		{ vendor: 'Qualcomm', renderer: 'Adreno 610' },
		{ vendor: 'Qualcomm', renderer: 'Adreno 650' },
		{ vendor: 'Qualcomm', renderer: 'Adreno 740' }
	],
	iOS: [
		{ vendor: 'Apple Inc.', renderer: 'Apple A13 GPU' },
		{ vendor: 'Apple Inc.', renderer: 'Apple A14 GPU' },
		{ vendor: 'Apple Inc.', renderer: 'Apple A15 GPU' },
		{ vendor: 'Apple Inc.', renderer: 'Apple M1 GPU' },
		{ vendor: 'Apple Inc.', renderer: 'Apple M2 GPU' }
	],
	Windows: [
		{ vendor: 'Intel Inc.', renderer: 'Intel UHD Graphics 620' },
		{ vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1660' },
		{ vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3060' },
		{ vendor: 'AMD', renderer: 'AMD Radeon RX 5500' }
	],
	macOS: [
		{ vendor: 'Apple Inc.', renderer: 'Apple M1' },
		{ vendor: 'Apple Inc.', renderer: 'Apple M1 Pro' },
		{ vendor: 'Apple Inc.', renderer: 'Apple M1 Max' },
		{ vendor: 'Apple Inc.', renderer: 'Apple M2' }
	],
	Linux: [
		{ vendor: 'Intel Inc.', renderer: 'Intel UHD Graphics 620' },
		{ vendor: 'AMD', renderer: 'AMD Radeon RX 5500' },
		{ vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3080' }
	]
};

// Timezone pools
const timezonePools = {
	Android: [
		'America/New_York',
		'America/Los_Angeles',
		'Europe/London',
		'Europe/Berlin',
		'Asia/Tokyo',
		'Asia/Shanghai'
	],
	iOS: [
		'America/New_York',
		'America/Los_Angeles',
		'Europe/London',
		'Europe/Paris',
		'Asia/Tokyo',
		'Australia/Sydney'
	],
	Windows: [
		'America/New_York',
		'America/Chicago',
		'America/Denver',
		'America/Los_Angeles',
		'Europe/London',
		'Europe/Berlin'
	],
	macOS: [
		'America/New_York',
		'America/Los_Angeles',
		'Europe/London',
		'Europe/Paris',
		'Asia/Tokyo',
		'Australia/Sydney'
	],
	Linux: [
		'America/New_York',
		'Europe/London',
		'Europe/Berlin',
		'Asia/Tokyo',
		'Asia/Shanghai',
		'Australia/Sydney'
	]
};

// Language pools
const languagePools = {
	Android: [
		'en-US',
		'en-GB',
		'es-ES',
		'fr-FR',
		'de-DE',
		'it-IT',
		'pt-BR',
		'ru-RU',
		'ja-JP',
		'ko-KR',
		'zh-CN',
		'hi-IN'
	],
	iOS: [
		'en-US',
		'en-GB',
		'es-ES',
		'fr-FR',
		'de-DE',
		'it-IT',
		'pt-BR',
		'ja-JP',
		'ko-KR',
		'zh-CN',
		'zh-TW'
	],
	Windows: [
		'en-US',
		'en-GB',
		'es-ES',
		'fr-FR',
		'de-DE',
		'it-IT',
		'pt-BR',
		'ru-RU',
		'pl-PL',
		'tr-TR'
	],
	macOS: [
		'en-US',
		'en-GB',
		'es-ES',
		'fr-FR',
		'de-DE',
		'it-IT',
		'pt-BR',
		'ja-JP',
		'ko-KR',
		'zh-CN'
	],
	Linux: [
		'en-US',
		'en-GB',
		'es-ES',
		'fr-FR',
		'de-DE',
		'it-IT',
		'pt-BR',
		'ru-RU',
		'pl-PL',
		'tr-TR'
	]
};

// Helper function to get random item from array
function getRandomItem(array) {
	return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get random number in range
function getRandomInRange(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random device profile
function generateRandomDevice(category = 'mobile') {
	if (!deviceConfigs[category]) {
		throw new Error(`Invalid device category: ${category}`);
	}

	// Select random platform for this category
	const platform = getRandomItem(deviceConfigs[category].platforms);

	// Get random viewport and hardware profile
	const viewport = getRandomItem(deviceConfigs[category].viewportRanges[platform]);
	const hardware = getRandomItem(deviceConfigs[category].hardwareProfiles[platform]);

	// Get random fonts, WebGL, timezone, and language
	const fonts = getRandomItem(fontPools[platform]);
	const webgl = getRandomItem(webglPools[platform]);
	const timezone = getRandomItem(timezonePools[platform]);
	const language = getRandomItem(languagePools[platform]);

	// Use the existing userAgents utility for consistent user agent generation
	const userAgentData = generateUserAgent({
		deviceCategory: category
	});

	// Ensure platform consistency - if user agent doesn't match platform, adjust
	let finalPlatform = platform;
	let finalOS = userAgentData.os;
	let finalBrowser = userAgentData.browser;

	// For mobile devices, ensure consistency and generate appropriate user agent
	if (category === 'mobile' || category === 'tablet') {
		if (platform === 'iOS') {
			finalOS = 'iOS';
			finalBrowser = 'Safari';
			// Generate iOS-specific user agent if the library didn't provide one
			if (!userAgentData.ua.includes('iPhone') && !userAgentData.ua.includes('iPad')) {
				const iosVersion = Math.random() > 0.5 ? '17_0' : '16_6';
				const safariVersion = Math.random() > 0.5 ? '17.0' : '16.6';
				userAgentData.ua = `Mozilla/5.0 (iPhone; CPU iPhone OS ${iosVersion} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${safariVersion} Mobile/15E148 Safari/604.1`;
			}
		} else if (platform === 'Android') {
			finalOS = 'Android';
			finalBrowser = 'Chrome';
			// Generate Android-specific user agent if the library didn't provide one
			if (!userAgentData.ua.includes('Android')) {
				const androidVersion = Math.random() > 0.5 ? '13' : '12';
				const chromeVersion = Math.random() > 0.5 ? '119.0.0.0' : '118.0.0.0';
				userAgentData.ua = `Mozilla/5.0 (Linux; Android ${androidVersion}; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Mobile Safari/537.36`;
			}
		}
	}

	// Create device profile
	const device = {
		userAgent: userAgentData.ua,
		platform: finalPlatform,
		os: finalOS,
		browser: finalBrowser,
		viewport: { width: viewport.width, height: viewport.height },
		devicePixelRatio: viewport.dpr,
		hardwareConcurrency: hardware.cores,
		deviceMemory: hardware.memory,
		maxTouchPoints: category === 'desktop' ? 0 : getRandomInRange(5, 10),
		webglVendor: webgl.vendor,
		webglRenderer: webgl.renderer,
		fonts: [fonts, 'Arial', 'Helvetica', 'sans-serif'],
		timezone: timezone,
		language: language,
		deviceCategory: category,
		// Generate a unique device name
		name: `${platform} ${
			category.charAt(0).toUpperCase() + category.slice(1)
		} ${getRandomInRange(1, 999)}`
	};

	return device;
}

// Generate multiple random devices for a category
function generateRandomDevices(category, count = 5) {
	const devices = {};
	for (let i = 0; i < count; i++) {
		const device = generateRandomDevice(category);
		devices[device.name] = device;
	}
	return devices;
}

// Get all available device categories
function getDeviceCategories() {
	return Object.keys(deviceConfigs);
}

// Get devices in a specific category (generate on-demand)
function getDevicesInCategory(category, count = 5) {
	if (!deviceConfigs[category]) {
		return [];
	}

	const devices = generateRandomDevices(category, count);
	return Object.keys(devices);
}

// Get a specific device by name (generate if not exists)
function getDeviceByName(deviceName) {
	// For now, we'll generate a random device since we're using dynamic generation
	// In a real implementation, you might want to cache generated devices
	const category = deviceName.toLowerCase().includes('mobile')
		? 'mobile'
		: deviceName.toLowerCase().includes('tablet')
		? 'tablet'
		: 'desktop';
	return generateRandomDevice(category);
}

// Get a random device from a specific category
function getRandomDevice(category = 'mobile') {
	return generateRandomDevice(category);
}

// Generate a complete device profile with all properties
function generateCompleteDeviceProfile(category = 'mobile') {
	const device = generateRandomDevice(category);

	// Add additional properties that might be needed
	device.appVersion = device.userAgent.split('AppleWebKit/')[1]?.split(' ')[0] || '537.36';
	device.vendor = device.platform === 'iOS' ? 'Apple Computer, Inc.' : 'Google Inc.';
	device.browserLanguages = [device.language, device.language.split('-')[0]];
	device.screen = {
		width: device.viewport.width,
		height: device.viewport.height,
		colorDepth: 24,
		pixelDepth: 24
	};
	device.isMobile = category !== 'desktop';
	device.hasTouch = category !== 'desktop';

	return device;
}

module.exports = {
	deviceConfigs,
	generateRandomDevice,
	generateRandomDevices,
	generateCompleteDeviceProfile,
	getRandomDevice,
	getDeviceCategories,
	getDevicesInCategory,
	getDeviceByName
};
