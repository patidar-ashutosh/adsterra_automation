const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const openUrlRoute = require('./routes/openUrl');
const logsRoute = require('./routes/logs');
const automationStatusRoute = require('./routes/status');
const stopRoute = require('./routes/stop');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
// Automation start
app.use('/open-url', openUrlRoute);
// Logs endpoint
app.use('/logs', logsRoute.router);
// Automation status
app.use('/automation-status', automationStatusRoute);
// Stop automation
app.use('/stop-automation', stopRoute);

// Root UI page
app.get('/', (req, res) => {
	try {
		res.sendFile(path.join(__dirname, 'public', 'index.html'));
	} catch (error) {
		console.error('Error serving index.html:', error);
		res.status(500).send('Internal server error');
	}
});

// Error handling middleware
app.use((error, req, res, next) => {
	console.error('Unhandled error:', error);
	res.status(500).json({
		success: false,
		error: 'Internal server error'
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		success: false,
		error: 'Route not found'
	});
});

// Start server with error handling
const server = app
	.listen(PORT, () => {
		console.log(`✅ Server running at http://localhost:${PORT}`);
	})
	.on('error', (error) => {
		console.error('❌ Server failed to start:', error);
		process.exit(1);
	});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('🔄 Shutting down server gracefully...');
	server.close(() => {
		console.log('✅ Server closed');
		process.exit(0);
	});
});

process.on('SIGINT', () => {
	console.log('🔄 Shutting down server gracefully...');
	server.close(() => {
		console.log('✅ Server closed');
		process.exit(0);
	});
});
