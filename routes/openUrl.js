// routes/openUrl.js
const express = require('express');
const router = express.Router();
const { runAutomation } = require('../automation');

router.post('/', async (req, res) => {
	try {
		const {
			blogURL,
			ProxyURL,
			browser,
			openCount,
			profilesAtOnce,
			timeout,
			minWaitTime,
			maxWaitTime
		} = req.body;

		// Input validation
		if (!blogURL || !ProxyURL) {
			return res.status(400).json({
				success: false,
				error: 'Missing blogURL or ProxyURL'
			});
		}

		// Validate URL format
		try {
			new URL(blogURL);
		} catch (urlError) {
			return res.status(400).json({
				success: false,
				error: 'Invalid blogURL format'
			});
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

		if (pageTimeout < 10 || pageTimeout > 120) {
			return res.status(400).json({
				success: false,
				error: 'timeout must be between 10 and 120 seconds'
			});
		}

		if (minWait < 10 || minWait > 120) {
			return res.status(400).json({
				success: false,
				error: 'minWaitTime must be between 10 and 120 seconds'
			});
		}

		if (maxWait < 10 || maxWait > 120) {
			return res.status(400).json({
				success: false,
				error: 'maxWaitTime must be between 10 and 120 seconds'
			});
		}

		if (minWait >= maxWait) {
			return res.status(400).json({
				success: false,
				error: 'minWaitTime must be less than maxWaitTime'
			});
		}

		const combinedURL = ProxyURL + encodeURIComponent(blogURL);
		// const combinedURL = 'https://getmodsapk.com/';

		// Send initial response
		res.json({
			success: true,
			started: true,
			url: combinedURL,
			cycles,
			profiles,
			timeout: pageTimeout,
			minWait,
			maxWait
		});

		// Run automation in background
		runAutomation({
			url: combinedURL,
			proxyURL: ProxyURL,
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
