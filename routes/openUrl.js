// routes/openUrl.js
const express = require('express');
const router = express.Router();
const { runAutomation } = require('../automation');
const {
	getDeviceCategories,
	getDevicesInCategory,
	getDeviceByName,
	generateRandomDevice
} = require('../utils/mobileDevices');

router.post('/', async (req, res) => {
	try {
		const {
			websiteURLs,
			browser,
			openCount,
			profilesAtOnce,
			timeout,
			minWaitTime,
			maxWaitTime,
			headless,
			deviceCategory = 'desktop',
			specificDevice = null
		} = req.body;

		// Handle website URLs
		let urls = [];
		if (websiteURLs && Array.isArray(websiteURLs)) {
			urls = websiteURLs;
		}

		// Input validation
		if (!urls || urls.length === 0) {
			return res.status(400).json({
				success: false,
				error: 'Missing website URLs'
			});
		}

		// Validate device category
		const validDeviceCategories = ['desktop', 'mobile', 'tablet', 'random'];
		if (!validDeviceCategories.includes(deviceCategory)) {
			return res.status(400).json({
				success: false,
				error: `Invalid device category. Must be one of: ${validDeviceCategories.join(
					', '
				)}`
			});
		}

		// Validate specific device if provided
		let deviceInfo = null;
		if (specificDevice && typeof specificDevice === 'string') {
			try {
				deviceInfo = getDeviceByName(specificDevice);
			} catch (error) {
				console.log(`Device not found, will generate new one: ${error.message}`);
			}
		}

		// Validate each URL format and clean them
		const cleanedUrls = [];
		for (let i = 0; i < urls.length; i++) {
			try {
				let urlString = urls[i].trim();
				// Add protocol if missing
				if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
					urlString = 'https://' + urlString;
				}

				const url = new URL(urlString);
				cleanedUrls.push(url.toString());
			} catch (urlError) {
				return res.status(400).json({
					success: false,
					error: `Invalid website URL format at position ${i + 1}: ${urls[i]}`
				});
			}
		}

		// Validate numeric inputs
		const cycles = parseInt(openCount) || 1;
		const profiles = parseInt(profilesAtOnce) || 1;
		const pageTimeout = parseInt(timeout) || 30;
		const minWait = parseInt(minWaitTime) || 45;
		const maxWait = parseInt(maxWaitTime) || 55;

		if (cycles < 1 || cycles > 20) {
			return res.status(400).json({
				success: false,
				error: 'openCount must be between 1 and 20'
			});
		}

		if (profiles < 1 || profiles > 10) {
			return res.status(400).json({
				success: false,
				error: 'profilesAtOnce must be between 1 and 10'
			});
		}

		if (pageTimeout < 30 || pageTimeout > 120) {
			return res.status(400).json({
				success: false,
				error: 'timeout must be between 30 and 120 seconds'
			});
		}

		if (minWait < 30 || minWait > 200) {
			return res.status(400).json({
				success: false,
				error: 'minWaitTime must be between 30 and 200 seconds'
			});
		}

		if (maxWait < 30 || maxWait > 230) {
			return res.status(400).json({
				success: false,
				error: 'maxWaitTime must be between 30 and 230 seconds'
			});
		}

		if (minWait >= maxWait) {
			return res.status(400).json({
				success: false,
				error: 'minWaitTime must be less than maxWaitTime'
			});
		}

		// Calculate total profiles and sessions
		const totalProfiles = cleanedUrls.length * profiles;
		const totalSessions = totalProfiles * cycles;

		// Check if total sessions exceed reasonable limits
		if (totalSessions > 200) {
			return res.status(400).json({
				success: false,
				error: `Total sessions (${totalSessions}) exceeds maximum limit of 200. Please reduce websites, profiles, or cycles.`
			});
		}

		// Determine final device category and device info
		let finalDeviceCategory = deviceCategory;
		let finalSpecificDevice = specificDevice;

		if (deviceCategory === 'random') {
			// Randomly select between mobile and desktop
			finalDeviceCategory = Math.random() > 0.5 ? 'mobile' : 'desktop';
		}

		// If no specific device and mobile/tablet, generate one
		if (
			(finalDeviceCategory === 'mobile' || finalDeviceCategory === 'tablet') &&
			!finalSpecificDevice
		) {
			try {
				const randomDevice = generateRandomDevice(finalDeviceCategory);
				finalSpecificDevice = randomDevice.name;
				deviceInfo = randomDevice;
			} catch (error) {
				console.log(`Failed to generate random device: ${error.message}`);
			}
		}

		// Send initial response
		res.json({
			success: true,
			started: true,
			urls: cleanedUrls,
			totalUrls: cleanedUrls.length,
			profilesPerUrl: profiles,
			totalProfiles: totalProfiles,
			cycles,
			timeout: pageTimeout,
			minWait,
			maxWait,
			totalSessions,
			deviceCategory: finalDeviceCategory,
			specificDevice: finalSpecificDevice,
			deviceInfo: deviceInfo
				? {
						name: finalSpecificDevice,
						platform: deviceInfo.platform,
						os: deviceInfo.os,
						viewport: deviceInfo.viewport,
						touchPoints: deviceInfo.maxTouchPoints
				  }
				: null
		});

		// Run automation in background with multiple URLs and device settings
		runAutomation({
			urls: cleanedUrls,
			originalUrls: cleanedUrls,
			browser,
			openCount: cycles,
			profilesAtOnce: profiles,
			timeout: pageTimeout,
			minWaitTime: minWait,
			maxWaitTime: maxWait,
			headless: headless !== undefined ? headless : false,
			deviceCategory: finalDeviceCategory,
			specificDevice: finalSpecificDevice
		}).catch((err) => {
			console.error('Automation error:', err);
		});
	} catch (error) {
		console.error('Route error:', error);
		res.status(500).json({
			success: false,
			error: 'Internal server error'
		});
	}
});

// New endpoint to get available device categories and devices
router.get('/devices', (req, res) => {
	try {
		const categories = getDeviceCategories();
		const devices = {};

		categories.forEach((category) => {
			// Generate 5 random devices for each category
			devices[category] = getDevicesInCategory(category, 5);
		});

		res.json({
			success: true,
			categories,
			devices
		});
	} catch (error) {
		console.error('Error getting devices:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to get device information'
		});
	}
});

module.exports = router;
