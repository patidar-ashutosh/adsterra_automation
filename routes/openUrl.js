// routes/openUrl.js
const express = require('express');
const router = express.Router();
const { runAutomation } = require('../automation');

router.post('/', async (req, res) => {
	try {
		const {
			blogURLs,
			blogURL, // Keep for backward compatibility
			ProxyURL,
			browser,
			openCount,
			profilesAtOnce,
			timeout,
			minWaitTime,
			maxWaitTime
		} = req.body;

		// Handle both single URL (backward compatibility) and multiple URLs
		let urls = [];
		if (blogURLs && Array.isArray(blogURLs)) {
			urls = blogURLs;
		} else if (blogURL) {
			urls = [blogURL];
		}

		// Input validation
		if (!urls || urls.length === 0) {
			return res.status(400).json({
				success: false,
				error: 'Missing blog URLs'
			});
		}

		if (!ProxyURL) {
			return res.status(400).json({
				success: false,
				error: 'Missing ProxyURL'
			});
		}

		// Validate and clean proxy URL
		let cleanProxyURL = ProxyURL.trim();
		if (!cleanProxyURL.endsWith('=') && !cleanProxyURL.endsWith('&')) {
			// Add separator if not present
			cleanProxyURL = cleanProxyURL + '=';
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
					error: `Invalid URL format at position ${i + 1}: ${urls[i]}`
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

		// Calculate total profiles and windows
		const totalProfiles = cleanedUrls.length * profiles;
		const totalWindows = totalProfiles * cycles;

		// Check if total windows exceed reasonable limits
		if (totalWindows > 200) {
			return res.status(400).json({
				success: false,
				error: `Total windows (${totalWindows}) exceeds maximum limit of 200. Please reduce URLs, profiles, or cycles.`
			});
		}

		// Prepare combined URLs for each blog
		// const combinedURLs = urls.map((url) => encodeURIComponent(url));
		const combinedURLs = cleanedUrls; // Send clean URLs, let automation handle proxy combination

		// Send initial response
		res.json({
			success: true,
			started: true,
			urls: cleanedUrls,
			combinedURLs: combinedURLs,
			totalUrls: cleanedUrls.length,
			profilesPerUrl: profiles,
			totalProfiles: totalProfiles,
			cycles,
			timeout: pageTimeout,
			minWait,
			maxWait,
			totalWindows
		});

		// Run automation in background with multiple URLs
		runAutomation({
			urls: combinedURLs,
			originalUrls: cleanedUrls,
			proxyURL: cleanProxyURL, // Use the cleaned proxy URL
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
