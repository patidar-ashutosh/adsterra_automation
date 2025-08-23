module.exports = async function injectFingerprint(page, fp) {
	await page.addInitScript((fp) => {
		/* Navigator props */
		Object.defineProperty(navigator, 'platform', { get: () => fp.platform });
		Object.defineProperty(navigator, 'language', { get: () => fp.browserLanguages[0] });
		Object.defineProperty(navigator, 'languages', { get: () => fp.browserLanguages });
		Object.defineProperty(navigator, 'hardwareConcurrency', {
			get: () => fp.hardwareConcurrency
		});
		Object.defineProperty(navigator, 'deviceMemory', { get: () => fp.deviceMemory });
		Object.defineProperty(navigator, 'maxTouchPoints', { get: () => fp.maxTouchPoints });
		Object.defineProperty(navigator, 'userAgent', { get: () => fp.userAgent });
		Object.defineProperty(navigator, 'webdriver', { get: () => false });
		Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' });

		/* Screen & window dimensions */
		Object.defineProperty(window, 'devicePixelRatio', { get: () => fp.devicePixelRatio });
		const s = fp.screen;
		Object.defineProperty(screen, 'width', { get: () => s.width });
		Object.defineProperty(screen, 'height', { get: () => s.height });
		Object.defineProperty(screen, 'colorDepth', { get: () => s.colorDepth });
		Object.defineProperty(screen, 'pixelDepth', { get: () => s.pixelDepth });
		Object.defineProperty(window, 'innerWidth', { get: () => s.width });
		Object.defineProperty(window, 'innerHeight', { get: () => s.height });

		/* Timezone */
		Intl.DateTimeFormat.prototype.resolvedOptions = function () {
			return { timeZone: fp.timezone, locale: fp.browserLanguages[0] };
		};

		/* Touch Support */
		Object.defineProperty(window, 'ontouchstart', { get: () => fp.maxTouchPoints > 0 });
		Object.defineProperty(window, 'ontouchend', { get: () => fp.maxTouchPoints > 0 });
		Object.defineProperty(window, 'ontouchmove', { get: () => fp.maxTouchPoints > 0 });
		Object.defineProperty(window, 'ontouchcancel', { get: () => fp.maxTouchPoints > 0 });

		/* Mobile Orientation API */
		if (fp.orientation) {
			Object.defineProperty(window, 'orientation', { get: () => fp.orientation.angle });
			Object.defineProperty(screen, 'orientation', {
				get: () => ({
					type: fp.orientation.type,
					angle: fp.orientation.angle
				})
			});
		}

		/* Mobile Sensors */
		if (fp.sensors) {
			// Accelerometer
			if (fp.sensors.accelerometer) {
				Object.defineProperty(window, 'DeviceMotionEvent', {
					get: () =>
						class MockDeviceMotionEvent extends Event {
							constructor(type, init) {
								super(type, init);
								this.acceleration = { x: 0, y: 0, z: 0 };
								this.accelerationIncludingGravity = { x: 0, y: 9.8, z: 0 };
								this.rotationRate = { alpha: 0, beta: 0, gamma: 0 };
								this.interval = 16;
							}
						}
				});
			}

			// Gyroscope
			if (fp.sensors.gyroscope) {
				Object.defineProperty(window, 'DeviceOrientationEvent', {
					get: () =>
						class MockDeviceOrientationEvent extends Event {
							constructor(type, init) {
								super(type, init);
								this.alpha = Math.random() * 360;
								this.beta = Math.random() * 180 - 90;
								this.gamma = Math.random() * 180 - 90;
								this.absolute = false;
							}
						}
				});
			}
		}

		/* Permissions API */
		const origQuery = window.navigator.permissions.query;
		window.navigator.permissions.query = (params) =>
			params.name === 'notifications'
				? Promise.resolve({ state: Notification.permission })
				: origQuery(params);

		/* Plugins & mimeTypes */
		Object.defineProperty(navigator, 'plugins', {
			get: () =>
				fp.plugins.map((p) => ({
					name: p.name,
					description: p.description,
					filename: p.filename
				}))
		});
		Object.defineProperty(navigator, 'mimeTypes', {
			get: () =>
				fp.mimeTypes.map((mt) => ({
					type: mt.type,
					description: mt.description,
					suffixes: mt.suffixes,
					enabledPlugin: { description: mt.description }
				}))
		});

		/* Canvas spoof */
		const toDataURLOriginal = HTMLCanvasElement.prototype.toDataURL;
		HTMLCanvasElement.prototype.toDataURL = function () {
			const ctx = this.getContext('2d');
			ctx.fillStyle = 'rgb(50,50,50)';
			ctx.fillRect(0, 0, this.width, this.height);
			return toDataURLOriginal.apply(this, arguments);
		};

		/* WebGL spoof */
		const origGetParam = WebGLRenderingContext.prototype.getParameter;
		WebGLRenderingContext.prototype.getParameter = function (param) {
			if (param === 37445) return fp.webglVendor;
			if (param === 37446) return fp.webglRenderer;
			return origGetParam.call(this, param);
		};

		/* AudioContext spoof */
		const AC = window.AudioContext || window.webkitAudioContext;
		if (AC) {
			const orig = AC.prototype.getChannelData;
			AC.prototype.getChannelData = function () {
				const d = orig.apply(this, arguments);
				const shift = Math.random() * 1e-7;
				for (let i = 0; i < d.length; i += 100) d[i] += shift;
				return d;
			};
			Object.defineProperty(AC.prototype, 'sampleRate', {
				get: () => 44100 + Math.floor(Math.random() * 5)
			});
		}

		/* Math.random tweak */
		const origRand = Math.random;
		Math.random = () => parseFloat((origRand() + 1e-7).toFixed(10));

		/* Connection spoof */
		const conn = navigator.connection || {};
		Object.defineProperty(conn, 'effectiveType', { get: () => fp.connection.effectiveType });
		Object.defineProperty(conn, 'downlink', { get: () => fp.connection.downlink });
		Object.defineProperty(conn, 'rtt', { get: () => fp.connection.rtt });
		Object.defineProperty(conn, 'type', { get: () => fp.connection.type });
		Object.defineProperty(navigator, 'connection', { get: () => conn });

		/* Battery API override */
		Object.defineProperty(navigator, 'getBattery', {
			value: () =>
				Promise.resolve({
					charging: fp.battery ? fp.battery.charging : true,
					level: fp.battery ? fp.battery.level : 0.87,
					chargingTime: fp.battery ? fp.battery.chargingTime : 0,
					dischargingTime: fp.battery ? fp.battery.dischargingTime : Infinity
				})
		});

		/* MediaDevices spoof */
		Object.defineProperty(navigator, 'mediaDevices', {
			get: () => ({
				enumerateDevices: () =>
					Promise.resolve([
						{
							kind: 'audioinput',
							label: 'Microphone (Built-in)',
							deviceId: 'default',
							groupId: '1'
						},
						{
							kind: 'videoinput',
							label: 'Camera (Built-in)',
							deviceId: 'default',
							groupId: '1'
						}
					])
			})
		});

		/* WebRTC iframe protection */
		if (window.RTCPeerConnection) {
			const orig = window.RTCPeerConnection;
			window.RTCPeerConnection = function (...args) {
				const pc = new orig(...args);
				const origGetStats = pc.getStats.bind(pc);
				pc.getStats = function () {
					return origGetStats().then((stats) => {
						return stats; // optionally strip local IPs
					});
				};
				return pc;
			};
		}

		/* Performance API spoofing for mobile */
		if (fp.isMobile) {
			// Mobile devices have different performance characteristics
			const origNow = performance.now;
			performance.now = function () {
				const time = origNow.call(this);
				// Add slight variation to mimic mobile CPU throttling
				return time + (Math.random() * 0.1 - 0.05);
			};

			// Mobile memory info
			if (performance.memory) {
				Object.defineProperty(performance.memory, 'usedJSHeapSize', {
					get: () => Math.floor(Math.random() * 50000000) + 10000000 // 10-60MB
				});
				Object.defineProperty(performance.memory, 'totalJSHeapSize', {
					get: () => Math.floor(Math.random() * 100000000) + 50000000 // 50-150MB
				});
				Object.defineProperty(performance.memory, 'jsHeapSizeLimit', {
					get: () => Math.floor(Math.random() * 200000000) + 100000000 // 100-300MB
				});
			}
		}

		/* Vibration API for mobile */
		if (fp.isMobile && fp.maxTouchPoints > 0) {
			Object.defineProperty(navigator, 'vibrate', {
				value: function (pattern) {
					// Mock vibration - just return true to indicate support
					return true;
				}
			});
		}

		/* Mobile-specific viewport meta */
		if (fp.isMobile) {
			// Ensure viewport meta tag exists and is mobile-friendly
			let viewportMeta = document.querySelector('meta[name="viewport"]');
			if (!viewportMeta) {
				viewportMeta = document.createElement('meta');
				viewportMeta.name = 'viewport';
				document.head.appendChild(viewportMeta);
			}
			viewportMeta.content =
				'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
		}
	}, fp);
};
