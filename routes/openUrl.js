// routes/openUrl.js
const express = require('express');
const router = express.Router();
const { runAutomation } = require('../automation');

router.post('/', async (req, res) => {
	const { blogURL, ProxyURL, browser, openCount, profilesAtOnce } = req.body;

	if (!blogURL || !ProxyURL) {
		return res.status(400).json({ error: 'Missing blogURL or ProxyURL' });
	}

	// const combinedURL = ProxyURL + encodeURIComponent(blogURL);
	const combinedURL = 'https://apkmody.com/';

	res.json({ success: true, started: true });

	await runAutomation({
		url: combinedURL,
		proxyURL: ProxyURL,
		browser,
		openCount,
		profilesAtOnce
	});

	res.json({ success: true, started: true });
});

module.exports = router;
