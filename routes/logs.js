// routes/logs.js
const express = require('express');
const router = express.Router();
const { getLogs, getProfileLogs, getAllProfileLogs } = require('../utils/helpers');

router.get('/', (req, res) => {
	try {
		const logs = getLogs();
		res.setHeader('Content-Type', 'text/plain');
		res.send(logs);
	} catch (error) {
		console.error('Logs route error:', error);
		res.status(500).send('Failed to retrieve logs');
	}
});

// Get logs for a specific profile
router.get('/profile/:profileIndex', (req, res) => {
	try {
		const profileIndex = parseInt(req.params.profileIndex);
		if (isNaN(profileIndex) || profileIndex < 1) {
			return res.status(400).json({
				success: false,
				error: 'Invalid profile index'
			});
		}

		const logs = getProfileLogs(profileIndex);
		res.setHeader('Content-Type', 'text/plain');
		res.send(logs);
	} catch (error) {
		console.error('Profile logs route error:', error);
		res.status(500).send('Failed to retrieve profile logs');
	}
});

// Get all profile logs
router.get('/profiles', (req, res) => {
	try {
		const allProfileLogs = getAllProfileLogs();
		res.json({
			success: true,
			profileLogs: allProfileLogs
		});
	} catch (error) {
		console.error('All profile logs route error:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to retrieve all profile logs'
		});
	}
});

module.exports = router;
