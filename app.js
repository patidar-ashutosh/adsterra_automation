const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = 3000;

const openUrlRoute = require('./routes/openUrl');
const logsRoute = require('./routes/logs');
const automationStatusRoute = require('./routes/status');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
// Automation start
app.use('/open-url', openUrlRoute);
// Logs endpoint
app.use('/logs', logsRoute);
// Automation status
app.use('/automation-status', automationStatusRoute);

// Root UI page
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
	console.log(`✅ Server running at http://localhost:${PORT}`);
});
