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

// Store connected clients for SSE
const connectedClients = new Set();

// SSE endpoint for real-time logs
app.get('/logs/stream', (req, res) => {
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		Connection: 'keep-alive',
		'Access-Control-Allow-Origin': '*'
	});

	// Send initial connection message
	res.write(
		`data: ${JSON.stringify({ type: 'connection', message: 'Connected to log stream' })}\n\n`
	);

	// Add client to connected clients
	connectedClients.add(res);

	// Handle client disconnect
	req.on('close', () => {
		connectedClients.delete(res);
	});
});

// Function to broadcast logs to all connected clients
function broadcastLog(profileIndex, message, cycleChangeData = null) {
	let logData;

	if (cycleChangeData) {
		// Handle cycle change event
		if (cycleChangeData.type === 'cycle_change') {
			logData = {
				type: 'cycle_change',
				cycle: cycleChangeData.cycle
			};
		} else if (cycleChangeData.type === 'status_change') {
			// Handle status change event
			logData = {
				type: 'status_change',
				profileIndex: cycleChangeData.profileIndex,
				status: cycleChangeData.status
			};
		}
	} else {
		// Handle regular log event
		logData = {
			type: 'log',
			profileIndex,
			message,
			timestamp: new Date().toISOString()
		};
	}

	connectedClients.forEach((client) => {
		client.write(`data: ${JSON.stringify(logData)}\n\n`);
	});
}

// Make broadcastLog available globally
global.broadcastLog = broadcastLog;

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
