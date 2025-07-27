// routes/logs.js
const express = require('express');
const router = express.Router();
const { getLogs } = require('../utils/helpers');

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

module.exports = router;
