// routes/status.js
const express = require('express');
const router = express.Router();
const { getStatus } = require('../automation');

router.get('/', (req, res) => {
	res.json(getStatus());
});

module.exports = router;
