// Form Validation Functions
// =========================

// Function to validate a single URL
function validateUrl(url) {
	if (!url || url.trim() === '') {
		return { valid: false, error: 'URL cannot be empty' };
	}

	try {
		// Add protocol if missing
		const urlToTest = url.startsWith('http') ? url : `https://${url}`;
		new URL(urlToTest);
		return { valid: true, url: urlToTest };
	} catch (e) {
		return { valid: false, error: 'Invalid URL format' };
	}
}

// Function to validate all URLs in the form
function validateAllURLs() {
	const urlInputs = document.querySelectorAll('.website-url-input');
	const errors = [];
	const validUrls = [];

	urlInputs.forEach((input, index) => {
		const url = input.value.trim();
		const validation = validateUrl(url);

		if (!validation.valid) {
			errors.push({
				index: index + 1,
				url: url,
				error: validation.error
			});
			// Mark input as invalid
			input.classList.remove('valid');
			input.classList.add('invalid');
		} else {
			validUrls.push(validation.url);
			// Mark input as valid
			input.classList.remove('invalid');
			input.classList.add('valid');
		}
	});

	return { errors, validUrls };
}

// Function to check if any URL inputs are empty
function hasEmptyURLs() {
	const urlInputs = document.querySelectorAll('.website-url-input');
	return Array.from(urlInputs).some((input) => input.value.trim() === '');
}

// Function to check if all URL inputs are valid
function areAllURLsValid() {
	const urlInputs = document.querySelectorAll('.website-url-input');
	return Array.from(urlInputs).every((input) => {
		const url = input.value.trim();
		return url !== '' && validateUrl(url).valid;
	});
}

// Function to show validation errors
function showValidationErrors(errors) {
	const errorMessages = errors
		.map((item) => `${item.index}. ${item.url || 'Empty URL'}: ${item.error}`)
		.join('\n');

	alert(`Please fix the following URL errors:\n\n${errorMessages}`);
}

// Function to validate wait times
function validateWaitTimes() {
	const minWaitTime = parseInt(document.getElementById('minWaitTime').value) || 45;
	const maxWaitTime = parseInt(document.getElementById('maxWaitTime').value) || 55;

	if (minWaitTime < 30) {
		alert('Minimum Session Duration must be at least 30 seconds');
		return false;
	}

	if (maxWaitTime < minWaitTime + 10) {
		alert('Maximum Session Duration must be at least 10 seconds more than Minimum');
		return false;
	}

	if (maxWaitTime > 230) {
		alert('Maximum Session Duration cannot exceed 230 seconds');
		return false;
	}

	return true;
}

// Function to validate all form inputs
function validateForm() {
	// Check if there are any URL inputs
	const urlInputs = document.querySelectorAll('.website-url-input');
	if (urlInputs.length === 0) {
		alert('Please add at least one website URL');
		return false;
	}

	// Validate all URLs
	const urlValidation = validateAllURLs();
	if (urlValidation.errors.length > 0) {
		showValidationErrors(urlValidation.errors);
		return false;
	}

	// Validate wait times
	if (!validateWaitTimes()) {
		return false;
	}

	// Check if at least one URL is provided
	if (urlValidation.validUrls.length === 0) {
		alert('Please provide at least one valid website URL');
		return false;
	}

	return true;
}
