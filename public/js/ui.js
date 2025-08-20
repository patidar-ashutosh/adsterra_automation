// UI Management Functions
// =======================

// Popup utility functions
function showPopup(title, content, confirmText = 'Confirm', isStopPopup = false) {
	const popupTitle = document.getElementById('popupTitle');
	const popupContent = document.getElementById('popupContent');
	const popupConfirm = document.getElementById('popupConfirm');
	const popupOverlay = document.getElementById('popupOverlay');

	popupTitle.textContent = title;
	popupContent.innerHTML = content;
	popupConfirm.textContent = confirmText;

	if (isStopPopup) {
		popupConfirm.classList.add('stop');
	} else {
		popupConfirm.classList.remove('stop');
	}

	popupOverlay.style.display = 'flex';
}

function hidePopup() {
	const popupOverlay = document.getElementById('popupOverlay');
	popupOverlay.style.display = 'none';
}

// URL management functions
function addUrl() {
	const urlsContainer = document.getElementById('urls-container');
	const urlGroups = urlsContainer.querySelectorAll('.url-input-group');
	const newIndex = urlGroups.length + 1;

	const newUrlGroup = document.createElement('div');
	newUrlGroup.className = 'url-input-group';
	newUrlGroup.innerHTML = `
		<div class="url-input-row">
			<input
				type="text"
				class="website-url-input"
				name="websiteURLs[]"
				placeholder="Enter website URL ${newIndex}"
				required
			/>
			<button type="button" class="remove-url-btn" onclick="removeUrl(this)">×</button>
		</div>
	`;

	urlsContainer.appendChild(newUrlGroup);

	// Show remove buttons for all URLs when there are more than 1
	updateRemoveButtons();
	updateTotalProfilesSummary();

	// Update profile URL distribution if profiles are already created
	if (typeof currentProfilesCount !== 'undefined' && currentProfilesCount > 0) {
		updateProfileUrlDistribution(currentProfilesCount);
	}

	// Focus on the new input
	const newInput = newUrlGroup.querySelector('.website-url-input');
	newInput.focus();

	// Add validation event listener
	newInput.addEventListener('input', function () {
		if (this.value.trim()) {
			if (isValidURL(this.value.trim())) {
				this.classList.remove('invalid-url');
				this.classList.add('valid-url');
			} else {
				this.classList.remove('valid-url');
				this.classList.add('invalid-url');
			}
		} else {
			this.classList.remove('invalid-url', 'valid-url');
		}
	});

	// Update all placeholder numbers
	updateUrlPlaceholders();
}

function removeUrl(button) {
	const urlGroup = button.closest('.url-input-group');
	urlGroup.remove();

	// Update remove buttons visibility
	updateRemoveButtons();
	updateTotalProfilesSummary();

	// Update profile URL distribution if profiles are already created
	if (typeof currentProfilesCount !== 'undefined' && currentProfilesCount > 0) {
		updateProfileUrlDistribution(currentProfilesCount);
	}

	// Update all placeholder numbers
	updateUrlPlaceholders();
}

function updateUrlPlaceholders() {
	const urlInputs = document.querySelectorAll('.website-url-input');
	urlInputs.forEach((input, index) => {
		input.placeholder = `Enter website URL ${index + 1}`;
	});
}

function updateRemoveButtons() {
	const urlGroups = document.querySelectorAll('.url-input-group');
	const removeButtons = document.querySelectorAll('.remove-url-btn');

	// Show remove button only if there's more than 1 URL
	removeButtons.forEach((button) => {
		button.style.display = urlGroups.length > 1 ? 'flex' : 'none';
	});
}

function updateTotalProfilesSummary() {
	const urlCount = document.querySelectorAll('.website-url-input').length;
	const profilesPerUrl = parseInt(document.getElementById('profilesAtOnce').value) || 0;
	const cycles = parseInt(document.getElementById('openCount').value) || 0;

	const totalProfiles = urlCount * profilesPerUrl;
	const totalWindows = totalProfiles * cycles;

	document.getElementById('totalUrls').textContent = urlCount;
	document.getElementById('profilesPerUrl').textContent = profilesPerUrl;
	document.getElementById('totalProfiles').textContent = totalProfiles;
	document.getElementById('totalWindows').textContent = totalWindows;
}

// Wait time logic functions
function handleWaitTimeLogic() {
	const minWaitInput = document.getElementById('minWaitTime');
	const maxWaitInput = document.getElementById('maxWaitTime');
	const minWaitValue = parseInt(minWaitInput.value) || 0;

	if (minWaitValue >= 30) {
		// Enable max wait time input
		maxWaitInput.disabled = false;

		// Set max wait time to min + 10, but not exceeding 230
		const maxWaitValue = Math.min(minWaitValue + 10, 230);
		maxWaitInput.value = maxWaitValue;
		maxWaitInput.min = minWaitValue + 10;

		// Update the help text
		const maxWaitHelp = maxWaitInput.nextElementSibling;
		if (maxWaitHelp) {
			maxWaitHelp.textContent = `Must be at least 10 seconds more than minimum (${minWaitValue}s). Current: ${maxWaitValue}s`;
		}
	} else {
		// Disable max wait time input
		maxWaitInput.disabled = true;
		maxWaitInput.value = '';

		// Update the help text
		const maxWaitHelp = maxWaitInput.nextElementSibling;
		if (maxWaitHelp) {
			maxWaitHelp.textContent =
				'This will be enabled after you set the minimum session duration. Must be at least 10 seconds more than minimum.';
		}
	}
}

// Form state management
function setAutomationState(isRunning) {
	const startButton = document.getElementById('startButton');
	const stopButton = document.getElementById('stopButton');

	if (isRunning) {
		document.body.classList.add('automation-running');
		startButton.style.display = 'none';
		stopButton.style.display = 'block';
		if (typeof startLogUpdates === 'function') startLogUpdates();
		if (typeof connectToLogStream === 'function') connectToLogStream();
	} else {
		document.body.classList.remove('automation-running');
		startButton.style.display = 'block';
		stopButton.style.display = 'none';
		if (typeof stopLogUpdates === 'function') stopLogUpdates();
		if (typeof disconnectFromLogStream === 'function') disconnectFromLogStream();
	}
}

// Initialize UI elements
function initializeUI() {
	// Initialize the summary
	updateTotalProfilesSummary();

	// Initialize wait time logic
	handleWaitTimeLogic();

	// Add event listeners for multiple URLs
	document.getElementById('addUrlBtn').addEventListener('click', addUrl);

	// Add validation to existing URL input
	const existingUrlInput = document.querySelector('.website-url-input');
	if (existingUrlInput) {
		existingUrlInput.addEventListener('input', function () {
			if (this.value.trim()) {
				if (isValidURL(this.value.trim())) {
					this.classList.remove('invalid-url');
					this.classList.add('valid-url');
				} else {
					this.classList.remove('valid-url');
					this.classList.add('invalid-url');
				}
			} else {
				this.classList.remove('invalid-url', 'valid-url');
			}
		});
	}

	// Update URLs when any URL input changes
	document.addEventListener('input', function (e) {
		if (e.target.classList.contains('website-url-input')) {
			updateTotalProfilesSummary();

			// Update profile URL distribution if profiles are already created
			if (typeof currentProfilesCount !== 'undefined' && currentProfilesCount > 0) {
				updateProfileUrlDistribution(currentProfilesCount);
			}
		}
		if (e.target.id === 'profilesAtOnce' || e.target.id === 'openCount') {
			updateTotalProfilesSummary();

			// Update profile URL distribution if profiles are already created
			if (typeof currentProfilesCount !== 'undefined' && currentProfilesCount > 0) {
				updateProfileUrlDistribution(currentProfilesCount);
			}
		}
		if (e.target.id === 'minWaitTime') {
			handleWaitTimeLogic();
		}
		if (e.target.id === 'maxWaitTime') {
			// Validate that max wait time is appropriate
			const minWaitValue = parseInt(document.getElementById('minWaitTime').value) || 0;
			const maxWaitValue = parseInt(e.target.value) || 0;

			if (maxWaitValue > 0 && maxWaitValue <= minWaitValue) {
				alert(
					'Maximum session duration must be at least 10 seconds more than minimum session duration'
				);
				e.target.value = minWaitValue + 10;
			}
		}
	});
}
