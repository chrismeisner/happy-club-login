// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.0/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.8.0/firebase-auth.js";

// Your Firebase configuration object
const firebaseConfig = {
	apiKey: "AIzaSyACBO64SK2oszaG1nCT9eDCY19sU7uXFb0",
	authDomain: "happy-club-4b9c6.firebaseapp.com",
	projectId: "happy-club-4b9c6",
	storageBucket: "happy-club-4b9c6.appspot.com",
	messagingSenderId: "576647028980",
	appId: "1:576647028980:web:1e5a371d1e349919c9bea1",
	measurementId: "G-8SNNGVPGBH"
};

// Initialize Firebase
console.log('🚀 Initializing Firebase app...');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
console.log('✅ Firebase app initialized.');

const baseID = 'app5YI0Re9mA0md7z';
const apiKey = 'patCtettCOnYI94VS.bd7fb1b026878bd6218a0f5b7357ae3ecbce9c1af187531c0d8916965fbafb23';

// Table name variables
const loginsTableName = 'tbl885ri5HFCMs9RG';
const membersTableName = 'tble20MIr9ribNP4C';
const servicesTableName = 'Services'; // Using "Services" as the table name

document.getElementById('phone-number').addEventListener('input', (event) => {
	let phoneNumber = event.target.value;
	console.log(`📱 Phone number input: ${phoneNumber}`);
	// Trim input to ensure it doesn't exceed 10 characters
	if (phoneNumber.length > 10) {
		event.target.value = phoneNumber.slice(0, 10); // Truncate to first 10 characters
		console.log('✂️ Trimmed phone number to 10 digits');
	}
});

document.getElementById('phone-number').addEventListener('keypress', (event) => {
	if (event.key === 'Enter') {
		event.preventDefault(); // Prevent the default action
		console.log('⏩ Enter key pressed, triggering Send Code button');
		document.getElementById('login-button').click(); // Trigger the click event on the "Send Code" button
	}
});

document.getElementById('login-button').addEventListener('click', () => {
	let phoneNumber = document.getElementById('phone-number').value;
	console.log(`📞 Phone number entered: ${phoneNumber}`);

	// Validate phone number length and format
	const phoneNumberPattern = /^\d{10}$/;
	if (!phoneNumberPattern.test(phoneNumber)) {
		alert("🚫 Please enter a valid 10-digit phone number.");
		console.log('❌ Invalid phone number format');
		return;
	}

	// Store the original phone number and login method
	localStorage.setItem('phoneNumber', phoneNumber);
	localStorage.setItem('loginMethod', 'mobile');
	console.log('💾 Phone number and login method saved to localStorage');

	// Format phone number to E.164 format
	const formattedPhoneNumber = '+1' + phoneNumber;
	console.log(`🔢 Formatted phone number: ${formattedPhoneNumber}`);

	const loginButton = document.getElementById('login-button');
	loginButton.disabled = true; // Disable the button
	loginButton.classList.add('dimmed'); // Apply the dimming style
	loginButton.innerText = 'Sending...'; // Change button text to "Sending"
	console.log('🔄 Sending code... Button disabled and dimmed');

	const appVerifier = new RecaptchaVerifier('recaptcha-container', {
		'size': 'invisible'
	}, auth);
	appVerifier.render().then(widgetId => {
		console.log(`🔒 Invisible reCAPTCHA rendered with widgetId: ${widgetId}`);
	});

	signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier)
		.then((confirmationResult) => {
			// SMS sent. Prompt user to type the code from the message.
			window.confirmationResult = confirmationResult;
			console.log('📲 SMS sent. Confirmation result:', confirmationResult);
			document.getElementById('verification-code').style.display = 'block';
			document.getElementById('verify-button').style.display = 'block';
			document.getElementById('message').innerText = "Enter the OTP sent to your mobile number";
			
			// Hide the "Sending..." button
			loginButton.style.display = 'none';
			console.log('📩 Verification code input and verify button displayed');
		}).catch((error) => {
			console.error('❌ Error during signInWithPhoneNumber:', error);
			// Re-enable button on error
			loginButton.disabled = false;
			loginButton.classList.remove('dimmed');
			loginButton.innerText = 'Send Code';
			console.log('⚠️ Error during sign-in. Button re-enabled');
		});
});

document.getElementById('verification-code').addEventListener('input', () => {
	const code = document.getElementById('verification-code').value;
	console.log(`🔑 Verification code entered: ${code}`);
	if (code.length === 6) {
		verifyCode(code);
	}
});

async function createLoginRecord(identifier) {
	const url = `https://api.airtable.com/v0/${baseID}/${loginsTableName}`;
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			fields: {
				Mobile: identifier.includes('@') ? null : identifier,
				Email: identifier.includes('@') ? identifier : null
			}
		})
	});
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const data = await response.json();
	console.log('📝 Login record created in Airtable:', data);
}

async function checkUserExists(identifier) {
	const filterFormula = identifier.includes('@') ? `{Email}='${identifier}'` : `{Mobile}='${identifier}'`;
	const url = `https://api.airtable.com/v0/${baseID}/${membersTableName}?filterByFormula=${encodeURIComponent(filterFormula)}`;
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${apiKey}`
		}
	});
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const data = await response.json();
	console.log(`👤 User exists check for ${identifier}:`, data.records.length > 0);
	return data.records.length > 0;
}

async function fetchUserData(identifier) {
	const filterFormula = identifier.includes('@') ? `{Email}='${identifier}'` : `{Mobile}='${identifier}'`;
	const url = `https://api.airtable.com/v0/${baseID}/${membersTableName}?filterByFormula=${encodeURIComponent(filterFormula)}`;
	console.log(`🌐 Fetching user data for identifier: ${identifier}`);
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${apiKey}`
		}
	});
	const data = await response.json();
	if (data.records.length > 0) {
		const userRecord = data.records[0].fields;
		console.log('🗂 User data fetched from Airtable:', userRecord);
		document.getElementById('profile-mobile-number').innerText = identifier;
		document.getElementById('username').innerText = userRecord.Username || 'Not found';
		document.getElementById('first-name').innerText = userRecord['First Name'] || 'Not found';
		document.getElementById('last-name').innerText = userRecord['Last Name'] || 'Not found';
		document.getElementById('email').innerText = userRecord.Email || 'Not available';
		document.getElementById('member-type').innerText = userRecord['Member Type'] || 'Not available';
	} else {
		console.log('🔍 No matching user data found in Airtable.');
		document.getElementById('username').innerText = 'Not found';
		document.getElementById('first-name').innerText = 'Not found';
		document.getElementById('last-name').innerText = 'Not found';
		document.getElementById('email').innerText = 'Not available';
		document.getElementById('member-type').innerText = 'Not available';
	}
}

async function verifyCode(code) {
	console.log(`🔑 Verifying code: ${code}`);
	window.confirmationResult.confirm(code).then(async (result) => {
		// User signed in successfully.
		const user = result.user;
		const identifier = localStorage.getItem('phoneNumber');
		console.log('✅ User signed in successfully:', user);
		document.getElementById('message').innerText = "Signed in :)";
		document.getElementById('message').classList.remove('blue');
		document.getElementById('message').classList.add('lime');
		document.getElementById('phone-number').style.display = 'none';
		document.getElementById('login-button').style.display = 'none';
		document.getElementById('verification-code').style.display = 'none';
		document.getElementById('verify-button').style.display = 'none';
		document.getElementById('signout-button').style.display = 'block';
		document.getElementById('mobile-status').classList.remove('hidden');
		document.getElementById('mobile-number').innerText = identifier;
		console.log('📲 User signed in and UI updated');

		// Save logged in state
		localStorage.setItem('loggedIn', true);
		console.log('💾 Logged in state saved to localStorage');

		// Create login record in Airtable
		await createLoginRecord(identifier);

		// Fetch user data
		await fetchUserData(identifier);

		// Show profile container
		document.getElementById('profile-container').classList.remove('hidden');
		console.log('📂 Profile container displayed');

		// Fetch and display services
		await fetchAndDisplayServices();

		// Update logged-in as section
		updateLoggedInAs(identifier);

	}).catch((error) => {
		console.error('❌ Error during confirmationResult.confirm:', error);
	});
}

document.getElementById('email-login-button').addEventListener('click', () => {
	const email = document.getElementById('email-address').value;
	const actionCodeSettings = {
		url: window.location.href,
		handleCodeInApp: true,
	};

	sendSignInLinkToEmail(auth, email, actionCodeSettings)
		.then(() => {
			// The link was successfully sent. Save the email locally to complete sign-in.
			window.localStorage.setItem('emailForSignIn', email);
			window.localStorage.setItem('loginMethod', 'email');
			document.getElementById('email-sent-message').innerText = `🔗 Email sent! Check your inbox at ${email} for the login link.`;
			document.getElementById('email-sent-message').classList.remove('hidden');
			console.log(`📧 Email login link sent to ${email}`);
		})
		.catch((error) => {
			console.error('❌ Error sending email login link:', error);
			alert(`🚫 Error sending email: ${error.message}`);
		});
});

// Check if the URL contains the sign-in link
if (isSignInWithEmailLink(auth, window.location.href)) {
	let email = window.localStorage.getItem('emailForSignIn');
	if (!email) {
		// If the email is not available in localStorage, prompt the user to provide it.
		email = window.prompt('Please provide your email for confirmation');
	}

	signInWithEmailLink(auth, email, window.location.href)
		.then(async (result) => {
			// User signed in successfully.
			const user = result.user;
			console.log('✅ Email link sign-in successful:', user);
			window.localStorage.removeItem('emailForSignIn');

			document.getElementById('message').innerText = "Signed in with email :)";
			document.getElementById('message').classList.remove('blue');
			document.getElementById('message').classList.add('lime');
			document.getElementById('phone-number').style.display = 'none';
			document.getElementById('login-button').style.display = 'none';
			document.getElementById('verification-code').style.display = 'none';
			document.getElementById('verify-button').style.display = 'none';
			document.getElementById('signout-button').style.display = 'block';
			document.getElementById('mobile-status').classList.remove('hidden');
			document.getElementById('mobile-number').innerText = email;
			document.getElementById('profile-container').classList.remove('hidden');

			await createLoginRecord(email);
			await fetchUserData(email);

			// Fetch and display services
			await fetchAndDisplayServices();

			// Update logged-in as section
			updateLoggedInAs(email);

			console.log('📲 User signed in with email and UI updated');
		})
		.catch((error) => {
			console.error('❌ Error during email link sign-in:', error);
		});
}

document.getElementById('signout-button').addEventListener('click', () => {
	console.log('🚪 Sign out button clicked.');
	signOut(auth).then(() => {
		console.log('👋 User signed out.');
		document.getElementById('message').innerText = "Hello, please enter your mobile number to sign in to Happy Club";
		document.getElementById('message').classList.remove('lime');
		document.getElementById('message').classList.add('blue');
		document.getElementById('phone-number').style.display = 'block';
		document.getElementById('login-button').style.display = 'block';
		document.getElementById('verification-code').style.display = 'none';
		document.getElementById('verify-button').style.display = 'none';
		document.getElementById('email-address').style.display = 'block';
		document.getElementById('email-login-button').style.display = 'block';
		document.getElementById('signout-button').style.display = 'none';
		document.getElementById('profile-container').classList.add('hidden'); // Hide profile container
		document.getElementById('phone-number').value = '';
		document.getElementById('verification-code').value = '';
		document.getElementById('email-address').value = '';
		document.getElementById('mobile-status').classList.add('hidden');
		document.getElementById('email-sent-message').classList.add('hidden');
		localStorage.removeItem('phoneNumber');
		localStorage.removeItem('emailForSignIn');
		localStorage.removeItem('loginMethod');
		localStorage.removeItem('loggedIn');
		document.getElementById('logged-in-as').classList.add('hidden');
		console.log('🔄 UI reset to initial state');
	}).catch((error) => {
		console.error('❌ Error during signOut:', error);
	});
});

onAuthStateChanged(auth, (user) => {
	const savedIdentifier = window.localStorage.getItem('emailForSignIn') || window.localStorage.getItem('phoneNumber');
	if (user && savedIdentifier) {
		console.log('👤 User is signed in:', user);
		document.getElementById('message').innerText = "Signed in :)";
		document.getElementById('message').classList.remove('blue');
		document.getElementById('message').classList.add('lime');
		document.getElementById('phone-number').style.display = 'none';
		document.getElementById('login-button').style.display = 'none';
		document.getElementById('verification-code').style.display = 'none';
		document.getElementById('verify-button').style.display = 'none';
		document.getElementById('email-address').style.display = 'none';
		document.getElementById('email-login-button').style.display = 'none';
		document.getElementById('signout-button').style.display = 'block';
		document.getElementById('mobile-status').classList.remove('hidden');
		document.getElementById('mobile-number').innerText = savedIdentifier;
		fetchUserData(savedIdentifier); // Fetch user data based on saved identifier (email or phone number)
		document.getElementById('profile-container').classList.remove('hidden'); // Show profile container
		fetchAndDisplayServices(); // Fetch and display services
		updateLoggedInAs(savedIdentifier); // Update logged-in as section
		console.log('📂 Profile container displayed');
	} else {
		console.log('🚫 No user is signed in.');
		document.getElementById('message').innerText = "Hello, please enter your mobile number to sign in to Happy Club";
		document.getElementById('message').classList.remove('lime');
		document.getElementById('message').classList.add('blue');
		document.getElementById('phone-number').style.display = 'block';
		document.getElementById('login-button').style.display = 'block';
		document.getElementById('verification-code').style.display = 'none';
		document.getElementById('verify-button').style.display = 'none';
		document.getElementById('email-address').style.display = 'block';
		document.getElementById('email-login-button').style.display = 'block';
		document.getElementById('signout-button').style.display = 'none';
		document.getElementById('profile-container').classList.add('hidden'); // Hide profile container
		document.getElementById('mobile-status').classList.add('hidden');
		document.getElementById('email-sent-message').classList.add('hidden');
		document.getElementById('logged-in-as').classList.add('hidden');
		console.log('🔄 UI reset to initial state');
	}
});

// Fetch and display services
async function fetchAndDisplayServices() {
	const url = `https://api.airtable.com/v0/${baseID}/${servicesTableName}`;
	console.log('🌐 Fetching services data...');
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${apiKey}`
		}
	});
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const data = await response.json();
	const servicesList = document.getElementById('services-list');
	servicesList.innerHTML = ''; // Clear any existing services

	data.records.forEach(record => {
		const listItem = document.createElement('li');
		listItem.classList.add('mb-4');
		listItem.innerHTML = `
			<h3 class="font-bold">${record.fields.Title}</h3>
			<p class="italic">${record.fields.Subtitle}</p>
			<p>${record.fields.Features}</p>
			<p><strong>Support:</strong> ${record.fields.Support}</p>
			<a href="${record.fields.URL}" target="_blank" class="text-blue-500">Learn more</a><br>
			<a href="${record.fields['URL-2']}" target="_blank" class="text-blue-500">Support link</a>
		`;
		servicesList.appendChild(listItem);
	});
	console.log('✅ Services data displayed:', data.records);
}

// Test Airtable connection function
async function testAirtableConnection() {
	const url = `https://api.airtable.com/v0/${baseID}/${membersTableName}?pageSize=1`;
	try {
		console.log('🌐 Attempting to connect to Airtable with URL:', url);
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${apiKey}`
			}
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		console.log('🔌 Airtable connection successful:', data);
		document.getElementById('airtable-status').innerText = 'Airtable connection successful ✅';
		document.getElementById('airtable-status').classList.add('text-green-600');
	} catch (error) {
		console.error('❌ Error testing Airtable connection:', error);
		document.getElementById('airtable-status').innerText = 'Airtable connection failed ❌';
		document.getElementById('airtable-status').classList.add('text-red-600');
	}
}

// Call the test function
testAirtableConnection();

// Navigate to the edit profile page
document.getElementById('update-profile-button').addEventListener('click', () => {
	window.location.href = 'edit-profile.html';
});

// Update logged-in as section
function updateLoggedInAs(identifier) {
	const loggedInAsElement = document.getElementById('logged-in-as');
	loggedInAsElement.innerText = `Logged in as: ${identifier}`;
	loggedInAsElement.classList.remove('hidden');
}
