// ===== Theme Engine =====
const THEMES = [
	{
		name: 'Aqua Neon',
		bg1: '#040b1a',
		bg2: '#0c1f38',
		accent: '#00ffd0',
		text: '#e6f3ff',
		muted: '#94a3b8'
	},
	{
		name: 'Cyber Magenta',
		bg1: '#140016',
		bg2: '#28002c',
		accent: '#ff00b8',
		text: '#ffe7ff',
		muted: '#ffb2f0'
	},
	{
		name: 'Lime Matrix',
		bg1: '#04110a',
		bg2: '#052617',
		accent: '#00ff66',
		text: '#eafff4',
		muted: '#9de9bf'
	},
	{
		name: 'Violet Storm',
		bg1: '#0b0720',
		bg2: '#1a0f40',
		accent: '#7c4dff',
		text: '#f1edff',
		muted: '#beb6ff'
	},
	{
		name: 'Amber Pulse',
		bg1: '#120a00',
		bg2: '#2a1a02',
		accent: '#ffb300',
		text: '#fff7e6',
		muted: '#ffd57a'
	}
];

let currentTheme = 0;
let autoRotateThemes = true; // Default to auto-rotation

function applyTheme(theme) {
	const root = document.documentElement;
	root.style.setProperty('--bg1', theme.bg1);
	root.style.setProperty('--bg2', theme.bg2);
	root.style.setProperty('--accent', theme.accent);
	root.style.setProperty('--text', theme.text);
	root.style.setProperty('--muted', theme.muted);
	document.getElementById(
		'bg'
	).style.background = `radial-gradient(800px 600px at 80% 20%, ${hexToRgba(
		theme.accent,
		0.12
	)}, transparent 60%), radial-gradient(600px 600px at 20% 80%, ${hexToRgba(
		theme.accent,
		0.08
	)}, transparent 60%)`;
	document.body.style.background = `radial-gradient(1200px 800px at 10% 10%, var(--bg2), var(--bg1))`;
}

function hexToRgba(hex, alpha) {
	const c = hex.replace('#', '');
	const bigint = parseInt(c, 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return `rgba(${r},${g},${b},${alpha})`;
}

function rotateTheme() {
	if (!autoRotateThemes) return; // Don't rotate if auto-rotation is disabled

	currentTheme = (currentTheme + 1) % THEMES.length;
	applyTheme(THEMES[currentTheme]);
	updateThemeDots();
}

function updateThemeDots() {
	const dots = document.getElementById('themeDots').querySelectorAll('button');
	dots.forEach((d, i) => d.classList.toggle('active', i === currentTheme));
}

function initThemeDots() {
	const wrap = document.getElementById('themeDots');
	wrap.innerHTML = ''; // Clear existing dots

	THEMES.forEach((t, i) => {
		const b = document.createElement('button');
		b.title = t.name;
		b.onclick = () => {
			currentTheme = i;
			autoRotateThemes = false; // Disable auto-rotation when manually selecting
			applyTheme(THEMES[currentTheme]);
			updateThemeDots();
			updateThemeRotatorLabel();
			localStorage.setItem('autoRotateThemes', 'false');
			localStorage.setItem('selectedTheme', i.toString());
		};
		b.style.background = `linear-gradient(135deg, ${t.bg1}, ${t.accent})`;
		wrap.appendChild(b);
	});
	updateThemeDots();
}

function updateThemeRotatorLabel() {
	const label = document.querySelector('.theme-rotator .muted');
	if (label) {
		label.textContent = autoRotateThemes ? 'Theme (Auto)' : 'Theme (Manual)';
	}
}

function toggleThemeMode() {
	autoRotateThemes = !autoRotateThemes;
	localStorage.setItem('autoRotateThemes', autoRotateThemes.toString());
	updateThemeRotatorLabel();

	if (autoRotateThemes) {
		logToConsole('🎭 Auto-rotating themes enabled');
	} else {
		logToConsole('🎨 Manual theme selection enabled');
	}
}

// Auto-rotate themes only if enabled
setInterval(rotateTheme, 12000);

// ===== Theme Selection Popup =====
function showThemeSelectionPopup() {
	const hasSeenPopup = localStorage.getItem('themeSelectionShown');
	if (hasSeenPopup) {
		// User has already made a choice, apply saved settings
		applySavedThemeSettings();
		return;
	}

	const popupContent = `
		<div style="text-align: center; margin-bottom: 20px;">
			<h3 style="color: var(--accent); margin-bottom: 15px;">🎨 Choose Your Theme Experience</h3>
			<p style="color: var(--text); margin-bottom: 25px;">Select how you'd like themes to work in GhostOps</p>
		</div>
		
		<div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 25px;">
			<div class="theme-option" style="padding: 15px; border: 2px solid var(--border); border-radius: 12px; cursor: pointer; transition: all 0.3s ease;" onclick="selectAutoTheme()">
				<div style="display: flex; align-items: center; gap: 12px;">
					<div style="width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(45deg, var(--accent), #0ff);"></div>
					<div style="text-align: left;">
						<h4 style="margin: 0 0 5px 0; color: var(--accent);">🎭 Auto-Rotating Themes</h4>
						<p style="margin: 0; color: var(--muted); font-size: 13px;">Themes automatically change every 12 seconds for a dynamic experience</p>
					</div>
				</div>
			</div>
			
			<div class="theme-option" style="padding: 15px; border: 2px solid var(--border); border-radius: 12px; cursor: pointer; transition: all 0.3s ease;" onclick="selectManualTheme()">
				<div style="display: flex; align-items: center; gap: 12px;">
					<div style="width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(45deg, #ff6b6b, #ffa500);"></div>
					<div style="text-align: left;">
						<h4 style="margin: 0 0 5px 0; color: var(--accent);">🎨 Manual Theme Selection</h4>
						<p style="margin: 0; color: var(--muted); font-size: 13px;">Choose a specific theme and keep it static</p>
					</div>
				</div>
			</div>
		</div>
		
		<div style="text-align: center; color: var(--muted); font-size: 12px;">
			You can change this later in the theme selector
		</div>
	`;

	const popup = showPopup('🎨 Welcome to GhostOps!', popupContent, 'Continue', false);

	// Add hover effects to theme options
	setTimeout(() => {
		const options = document.querySelectorAll('.theme-option');
		options.forEach((option) => {
			option.addEventListener('mouseenter', () => {
				option.style.borderColor = 'var(--accent)';
				option.style.transform = 'translateY(-2px)';
			});
			option.addEventListener('mouseleave', () => {
				option.style.borderColor = 'var(--border)';
				option.style.transform = 'translateY(0)';
			});
		});
	}, 100);
}

function selectAutoTheme() {
	autoRotateThemes = true;
	localStorage.setItem('autoRotateThemes', 'true');
	localStorage.setItem('themeSelectionShown', 'true');
	hidePopup();
	updateThemeRotatorLabel();
	logToConsole('🎭 Auto-rotating themes enabled');
}

function selectManualTheme() {
	autoRotateThemes = false;
	localStorage.setItem('autoRotateThemes', 'false');
	localStorage.setItem('themeSelectionShown', 'true');
	hidePopup();
	showManualThemeSelector();
}

function showManualThemeSelector() {
	const themeContent = `
		<div style="text-align: center; margin-bottom: 20px;">
			<h3 style="color: var(--accent); margin-bottom: 15px;">🎨 Pick Your Theme</h3>
			<p style="color: var(--text); margin-bottom: 25px;">Choose your preferred theme color scheme</p>
		</div>
		
		<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
			${THEMES.map(
				(theme, index) => `
				<div class="theme-preview" style="padding: 15px; border: 2px solid var(--border); border-radius: 12px; cursor: pointer; text-align: center; transition: all 0.3s ease;" onclick="selectSpecificTheme(${index})">
					<div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, ${theme.bg1}, ${theme.accent}); margin: 0 auto 10px auto; border: 2px solid ${theme.accent};"></div>
					<h4 style="margin: 0; color: var(--accent); font-size: 14px;">${theme.name}</h4>
				</div>
			`
			).join('')}
		</div>
	`;

	const popup = showPopup('🎨 Select Theme', themeContent, 'Apply Theme', false);

	// Add hover effects
	setTimeout(() => {
		const previews = document.querySelectorAll('.theme-preview');
		previews.forEach((preview) => {
			preview.addEventListener('mouseenter', () => {
				preview.style.borderColor = 'var(--accent)';
				preview.style.transform = 'scale(1.05)';
			});
			preview.addEventListener('mouseleave', () => {
				preview.style.borderColor = 'var(--border)';
				preview.style.transform = 'scale(1)';
			});
		});
	}, 100);
}

function selectSpecificTheme(themeIndex) {
	currentTheme = themeIndex;
	applyTheme(THEMES[currentTheme]);
	updateThemeDots();
	updateThemeRotatorLabel();
	localStorage.setItem('selectedTheme', themeIndex.toString());
	hidePopup();
	logToConsole(`🎨 Applied theme: ${THEMES[themeIndex].name}`);
}

function applySavedThemeSettings() {
	const savedAutoRotate = localStorage.getItem('autoRotateThemes');
	const savedTheme = localStorage.getItem('selectedTheme');

	if (savedAutoRotate !== null) {
		autoRotateThemes = savedAutoRotate === 'true';
	}

	if (savedTheme !== null && !autoRotateThemes) {
		currentTheme = parseInt(savedTheme);
		applyTheme(THEMES[currentTheme]);
	}

	updateThemeRotatorLabel();
}

// ===== Matrix Rain Canvas =====
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');
let width, height, columns, drops;
function resize() {
	width = canvas.width = window.innerWidth;
	height = canvas.height = window.innerHeight;
	columns = Math.floor(width / 16);
	drops = Array(columns).fill(1);
}
window.addEventListener('resize', resize);
resize();

const glyphs =
	'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロゴゾドボポ0123456789';
function matrix() {
	ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent');
	ctx.font = '16px JetBrains Mono';
	for (let i = 0; i < drops.length; i++) {
		const text = glyphs.charAt(Math.floor(Math.random() * glyphs.length));
		ctx.fillText(text, i * 16, drops[i] * 16);
		if (drops[i] * 16 > height && Math.random() > 0.975) {
			drops[i] = 0;
		}
		drops[i]++;
	}
	requestAnimationFrame(matrix);
}
matrix();

// ===== Panels =====
document.querySelectorAll('.nav-btn').forEach((btn) => {
	btn.addEventListener('click', () => {
		document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
		btn.classList.add('active');
		const id = btn.dataset.panel;
		document.querySelectorAll('.panel').forEach((p) => p.classList.remove('show'));
		document.getElementById(`panel-${id}`).classList.add('show');
	});
});

// ===== URL Management =====
function addUrl() {
	const urlInputs = document.getElementById('urlInputs');
	const urlCount = urlInputs.children.length + 1;

	const urlGroup = document.createElement('div');
	urlGroup.className = 'url-input-group';
	urlGroup.style.display = 'flex';
	urlGroup.style.alignItems = 'center';
	urlGroup.style.gap = '8px';

	const input = document.createElement('input');
	input.type = 'text';
	input.className = 'website-url-input';
	input.placeholder = `Enter website URL ${urlCount}`;
	input.name = 'websiteURLs[]';
	input.value = '';

	// Add validation event listener
	input.addEventListener('input', function () {
		validateUrlInput(this);
	});

	const removeBtn = document.createElement('button');
	removeBtn.type = 'button';
	removeBtn.className = 'remove-url-btn';
	removeBtn.innerHTML = '×';
	removeBtn.onclick = () => removeUrl(removeBtn);

	urlGroup.appendChild(input);
	urlGroup.appendChild(removeBtn);
	urlInputs.appendChild(urlGroup);

	updateUrlPlaceholders();
	updateRemoveButtons();
	updateTotalProfilesSummary();

	// Focus on the new input
	input.focus();
}

function validateUrlInput(input) {
	const url = input.value.trim();

	if (url === '') {
		input.classList.remove('valid', 'invalid');
		return;
	}

	try {
		// Try to create a URL object to validate
		new URL(url.startsWith('http') ? url : `https://${url}`);
		input.classList.remove('invalid');
		input.classList.add('valid');
	} catch (e) {
		input.classList.remove('valid');
		input.classList.add('invalid');
	}
}

function removeUrl(button) {
	const urlGroup = button.parentElement;
	urlGroup.remove();
	updateUrlPlaceholders();
	updateRemoveButtons();
	updateTotalProfilesSummary();
}

function updateUrlPlaceholders() {
	const urlInputs = document.querySelectorAll('.website-url-input');
	urlInputs.forEach((input, index) => {
		input.placeholder = `Enter website URL ${index + 1}`;
	});
}

function updateRemoveButtons() {
	const removeButtons = document.querySelectorAll('.remove-url-btn');
	const urlCount = removeButtons.length;

	removeButtons.forEach((button, index) => {
		// Show remove button only when there are more than 1 URL
		// For the first URL, only show remove button if there are multiple URLs
		button.style.display = urlCount > 1 ? 'flex' : 'none';
	});
}

function updateTotalProfilesSummary() {
	const urlCount = document.querySelectorAll('.website-url-input').length;
	const profilesPerWebsite = parseInt(document.getElementById('profilesAtOnce').value) || 3;
	const cycles = parseInt(document.getElementById('openCount').value) || 3;

	document.getElementById('totalWebsites').textContent = urlCount;
	document.getElementById('profilesPerWebsite').textContent = profilesPerWebsite;
	document.getElementById('totalProfiles').textContent = urlCount * profilesPerWebsite;
	document.getElementById('totalSessions').textContent = urlCount * profilesPerWebsite * cycles;
}

// ===== Wait Time Logic =====
function handleWaitTimeLogic() {
	const minWaitTime = document.getElementById('minWaitTime');
	const maxWaitTime = document.getElementById('maxWaitTime');

	minWaitTime.addEventListener('input', () => {
		const minValue = parseInt(minWaitTime.value) || 45;
		const maxValue = Math.min(minValue + 10, 230);

		maxWaitTime.disabled = false;
		maxWaitTime.min = minValue + 10;
		maxWaitTime.value = maxValue;
	});
}

// ===== Progress Ring Integration =====
function setProgress(p) {
	p = Math.max(0, Math.min(100, p));
	const ring = document.getElementById('ringProgress');
	const ringText = document.getElementById('ringText');

	if (ring && ringText) {
		ring.setAttribute('stroke-dasharray', `${p}, 100`);
		ringText.textContent = `${p}%`;
	}
}

// ===== Console Integration =====
function logToConsole(line) {
	const consoleEl = document.getElementById('console');
	if (consoleEl) {
		const ts = new Date().toLocaleTimeString();
		const msg = `[${ts}] ${line}\n`;
		consoleEl.textContent += msg;
		consoleEl.scrollTop = consoleEl.scrollHeight;
	}
}

// ===== System Info =====
function updateSystemInfo() {
	// Update Node version (you can get this from your backend)
	const nodeVer = document.getElementById('nodeVer');
	if (nodeVer) {
		nodeVer.textContent = 'v18.x';
	}

	const pwVer = document.getElementById('pwVer');
	if (pwVer) {
		pwVer.textContent = '~1.46';
	}

	// Update last run time
	const lastRun = document.getElementById('lastRun');
	if (lastRun) {
		const savedLastRun = localStorage.getItem('lastRun');
		if (savedLastRun) {
			lastRun.textContent = savedLastRun;
		}
	}

	// Fake latency for demo
	const latency = document.getElementById('latency');
	if (latency) {
		setInterval(() => {
			latency.textContent = (20 + Math.random() * 80).toFixed(0) + ' ms';
		}, 1500);
	}
}

// ===== Mobile Menu Toggle =====
function initializeMobileMenu() {
	const mobileMenuToggle = document.getElementById('mobileMenuToggle');
	const mobileMenuBtn = mobileMenuToggle?.querySelector('.mobile-menu-btn');
	const sidebar = document.querySelector('.sidebar');

	if (mobileMenuToggle && mobileMenuBtn && sidebar) {
		mobileMenuBtn.addEventListener('click', () => {
			sidebar.classList.toggle('show');
			mobileMenuToggle.classList.toggle('active');
		});

		// Close sidebar when clicking outside
		document.addEventListener('click', (e) => {
			if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
				sidebar.classList.remove('show');
				mobileMenuToggle.classList.remove('active');
			}
		});
	}
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
	// Initialize URL management
	document.getElementById('addUrlBtn').addEventListener('click', addUrl);

	// Add the first URL input automatically
	addUrl();

	// Initialize wait time logic
	handleWaitTimeLogic();

	// Initialize summary updates
	document.getElementById('profilesAtOnce').addEventListener('input', updateTotalProfilesSummary);
	document.getElementById('openCount').addEventListener('input', updateTotalProfilesSummary);

	// Initialize theme system
	applyTheme(THEMES[currentTheme]);
	initThemeDots();
	showThemeSelectionPopup(); // Show theme selection popup on first load

	// Initialize theme toggle
	const themeToggle = document.getElementById('themeToggle');
	if (themeToggle) {
		themeToggle.addEventListener('click', toggleThemeMode);
	}

	// Initialize mobile menu
	initializeMobileMenu();

	// Initialize system info
	updateSystemInfo();

	// Set initial summary values
	updateTotalProfilesSummary();

	// Log initial message
	logToConsole('🚀 GhostOps Automation System Ready');
	logToConsole('✅ All systems operational');
});

// ===== Integration with existing automation system =====
window.GhostOpsUI = {
	logToConsole,
	setProgress,
	updateSystemInfo
};

// Override the existing showPopup and hidePopup functions to use our new UI
window.showPopup = function (title, content, confirmText, showCancel = false) {
	// Create popup HTML
	const popupHTML = `
    <div class="popup-overlay" id="popupOverlay">
      <div class="popup-container" id="popupContainer">
        <div class="popup-header">
          <h3 id="popupTitle">${title}</h3>
          <button class="popup-close" id="popupClose">&times;</button>
        </div>
        <div class="popup-content" id="popupContent">
          ${content}
        </div>
        <div class="popup-actions">
          ${
				showCancel
					? '<button class="popup-btn popup-btn-cancel" id="popupCancel">Cancel</button>'
					: ''
			}
          <button class="popup-btn popup-btn-confirm" id="popupConfirm">${confirmText}</button>
        </div>
      </div>
    </div>
  `;

	// Remove existing popup if any
	const existingPopup = document.getElementById('popupOverlay');
	if (existingPopup) {
		existingPopup.remove();
	}

	// Add new popup
	document.body.insertAdjacentHTML('beforeend', popupHTML);

	// Show popup
	const popup = document.getElementById('popupOverlay');
	popup.style.display = 'flex';

	// Setup close button
	document.getElementById('popupClose').addEventListener('click', hidePopup);

	// Setup cancel button if exists
	const cancelBtn = document.getElementById('popupCancel');
	if (cancelBtn) {
		cancelBtn.addEventListener('click', hidePopup);
	}

	// Return the confirm button for external event binding
	return document.getElementById('popupConfirm');
};

window.hidePopup = function () {
	const popup = document.getElementById('popupOverlay');
	if (popup) {
		popup.remove();
	}
};
