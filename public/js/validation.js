// Form Validation Functions
// =========================

// Function to validate URL format
function isValidURL(string) {
	try {
		new URL(string);
		return true;
	} catch (_) {
		return false;
	}
}

// Function to validate all URLs before submission
function validateAllURLs() {
	const urlInputs = document.querySelectorAll('.website-url-input');
	const invalidUrls = [];

	urlInputs.forEach((input, index) => {
		const url = input.value.trim();
		if (url && !isValidURL(url)) {
			invalidUrls.push({ index: index + 1, url: url });
			input.classList.add('invalid-url');
		} else {
			input.classList.remove('invalid-url');
		}
	});

	return invalidUrls;
}

// Function to validate wait time values
function validateWaitTimes() {
	const minWaitInput = document.getElementById('minWaitTime');
	const maxWaitInput = document.getElementById('maxWaitTime');
	const minWaitValue = parseInt(minWaitInput.value) || 0;
	const maxWaitValue = parseInt(maxWaitInput.value) || 0;

	if (minWaitValue < 30) {
		alert('Minimum session duration must be at least 30 seconds');
		return false;
	}

	if (maxWaitValue > 0 && maxWaitValue <= minWaitValue) {
		alert(
			'Maximum session duration must be at least 10 seconds more than minimum session duration'
		);
		return false;
	}

	if (maxWaitValue > 230) {
		alert('Maximum session duration cannot exceed 230 seconds');
		return false;
	}

	return true;
}
