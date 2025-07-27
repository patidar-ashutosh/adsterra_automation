// routes/logs.js
const express = require('express');
const router = express.Router();
const { getLogs } = require('../utils/helpers');

router.get('/', (req, res) => {
	res.setHeader('Content-Type', 'text/plain');
	res.send(getLogs());
});

module.exports = router;
