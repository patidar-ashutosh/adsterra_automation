// routes/openUrl.js
const express = require('express');
const router = express.Router();
const { runAutomation } = require('../automation');

router.post('/', async (req, res) => {
	try {
		const {
			websiteURLs,
			browser,
			openCount,
			profilesAtOnce,
			timeout,
			minWaitTime,
			maxWaitTime
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
			totalSessions
		});

		// Run automation in background with multiple URLs
		runAutomation({
			urls: cleanedUrls,
			originalUrls: cleanedUrls,
			browser,
			openCount: cycles,
			profilesAtOnce: profiles,
			timeout: pageTimeout,
			minWaitTime: minWait,
			maxWaitTime: maxWait
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

module.exports = router;
