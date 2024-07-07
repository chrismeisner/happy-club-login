// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.0/firebase-app.js";
import { getAuth, updateProfile, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.8.0/firebase-auth.js";

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
const membersTableName = 'tble20MIr9ribNP4C';

document.addEventListener('DOMContentLoaded', () => {
	console.log('🌐 DOM Content Loaded');

	onAuthStateChanged(auth, async (user) => {
		if (user) {
			console.log('👤 User is signed in:', user);
			const editProfileForm = document.getElementById('edit-profile-form');
			const firstNameInput = document.getElementById('first-name');
			const lastNameInput = document.getElementById('last-name');
			const emailInput = document.getElementById('email');

			const identifier = localStorage.getItem('emailForSignIn') || localStorage.getItem('phoneNumber');

			console.log('🔍 Fetching user data from Airtable...');
			// Fetch user data from Airtable
			const userRecord = await fetchUserData(identifier);

			// Populate fields with existing user data
			if (userRecord) {
				console.log('🗂 User data fetched from Airtable:', userRecord);
				if (userRecord['First Name']) {
					firstNameInput.value = userRecord['First Name'];
				}
				if (userRecord['Last Name']) {
					lastNameInput.value = userRecord['Last Name'];
				}
				if (userRecord['Email']) {
					emailInput.value = userRecord['Email'];
				}
			} else {
				console.log('⚠️ No user data found in Airtable.');
			}

			// Update logged-in as section
			updateLoggedInAs(identifier);

			editProfileForm.addEventListener('submit', async (e) => {
				e.preventDefault();
				console.log('💾 Save Changes button clicked');

				const firstName = firstNameInput.value.trim();
				const lastName = lastNameInput.value.trim();
				const email = emailInput.value.trim();

				console.log('📝 Collected input values:', { firstName, lastName, email });

				try {
					console.log('🔄 Updating Firebase user profile...');
					// Update display name
					await updateProfile(user, {
						displayName: `${firstName} ${lastName}`
					});
					console.log('✅ Firebase profile updated');

					let updateFields = {
						'First Name': firstName,
						'Last Name': lastName,
						'Email': email
					};

					console.log('🔄 Updating Airtable record...');
					// Update Airtable
					await updateAirtable(identifier, updateFields);

					console.log('✅ Airtable record updated');
					console.log('➡️ Redirecting to index.html');
					window.location.href = 'index.html'; // Redirect back to profile page
				} catch (error) {
					console.error('❌ Error updating profile:', error);
				}
			});

			document.getElementById('cancel-button').addEventListener('click', () => {
				console.log('🚫 Cancel button clicked, redirecting to index.html');
				window.location.href = 'index.html'; // Redirect back to profile page without saving changes
			});
		} else {
			console.log('❌ No current user found. Redirecting to login page.');
			await signOut(auth);
			window.location.href = 'index.html'; // Redirect to the login page
		}
	});
});

async function fetchUserData(identifier) {
	try {
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

		if (data.records.length > 0) {
			const userRecord = data.records[0].fields;
			console.log('🗂 User data fetched from Airtable:', userRecord);
			return userRecord;
		} else {
			console.log('🔍 No matching user data found in Airtable.');
			return null;
		}
	} catch (error) {
		console.error('❌ Error fetching user data:', error);
	}
}

async function updateAirtable(identifier, fields) {
	try {
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

		if (data.records.length > 0) {
			const recordId = data.records[0].id;

			const updateUrl = `https://api.airtable.com/v0/${baseID}/${membersTableName}/${recordId}`;

			const updateResponse = await fetch(updateUrl, {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ fields })
			});

			if (!updateResponse.ok) {
				throw new Error(`HTTP error! status: ${updateResponse.status}`);
			}

			const updateData = await updateResponse.json();
			console.log('📝 Airtable record updated:', updateData);
		} else {
			console.log('⚠️ No matching record found in Airtable for update.');
		}
	} catch (error) {
		console.error('❌ Error updating Airtable record:', error);
	}
}

// Update logged-in as section
function updateLoggedInAs(identifier) {
	const loggedInAsElement = document.getElementById('logged-in-as');
	loggedInAsElement.innerText = `Logged in as: ${identifier}`;
	loggedInAsElement.classList.remove('hidden');
}
