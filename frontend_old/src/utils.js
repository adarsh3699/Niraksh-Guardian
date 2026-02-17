// import Cookies from 'universal-cookie';
// const cookies = new Cookies();

// const apiBaseUrl = 'https://bhemu-notes-api.onrender.com/';
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/';

// variables for setting cookie expiratiom tym
const COOKIE_EXPIRATION_MINS = 30 * 24 * 60; // 30 days

let COOKIE_EXPIRATION_TYM = new Date();
COOKIE_EXPIRATION_TYM.setTime(COOKIE_EXPIRATION_TYM.getTime() + COOKIE_EXPIRATION_MINS * 60 * 1000);

// Function to check if token is expired
function isTokenExpired(token) {
	if (!token) return true;

	try {
		const payload = extractEncryptedToken(token);
		const expirationTime = payload.exp * 1000; // Convert to milliseconds
		return Date.now() >= expirationTime;
	} catch {
		// Token is invalid
		return true;
	}
}

// Function to refresh the access token
async function refreshAccessToken() {
	const refreshToken = localStorage.getItem('refresh_token');

	if (!refreshToken) {
		localStorage.removeItem('JWT_token');
		localStorage.removeItem('user_details');
		localStorage.removeItem('loginInfo');
		return null;
	}

	try {
		const response = await fetch(`${apiBaseUrl}user/refresh-token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ refreshToken }),
		});

		const data = await response.json();

		if (response.ok) {
			localStorage.setItem('JWT_token', data.jwt);
			localStorage.setItem('refresh_token', data.refreshToken);
			return data.jwt;
		} else {
			// If refresh token is invalid, clear all auth-related items
			localStorage.removeItem('JWT_token');
			localStorage.removeItem('refresh_token');
			localStorage.removeItem('loginInfo');
			localStorage.removeItem('user_details');
			return null;
		}
	} catch (error) {
		console.error("Error refreshing token:", error);
		localStorage.removeItem('JWT_token');
		localStorage.removeItem('refresh_token');
		localStorage.removeItem('loginInfo');
		localStorage.removeItem('user_details');
		return null;
	}
}

async function apiCall(endpoint, method = 'GET', body = null, file = false) {
	const apiUrl = apiBaseUrl + endpoint;
	let authorization = localStorage.getItem("JWT_token");

	// Check if token is expired and refresh if needed
	if (authorization && isTokenExpired(authorization) && !endpoint.includes('refresh-token')) {
		const newToken = await refreshAccessToken();
		authorization = newToken;

		// If we couldn't refresh the token and this is a protected endpoint, handle accordingly
		if (!authorization && endpoint.startsWith('ai/')) {
			return {
				data: {
					statusCode: 401,
					msg: 'Authentication required. Please log in again.'
				},
				statusCode: 401
			};
		}
	}

	const headers = {
		Authorization: `Bearer ${authorization}`,
	};

	if (!file && body) {
		headers['Content-Type'] = 'application/json';
	}

	try {
		const response = await fetch(apiUrl, {
			method,
			headers,
			body: file ? body : body ? JSON.stringify(body) : null,
		});

		const statusCode = response.status;
		const data = await response.json();

		// If server returns authentication error, clear tokens and return specific error
		if (statusCode === 401) {
			// Only clear tokens if this is not a login/refresh attempt
			if (!endpoint.includes('signin') && !endpoint.includes('refresh-token')) {
				console.log("Authentication error, clearing tokens");
				localStorage.removeItem('JWT_token');
				localStorage.removeItem('refresh_token');
				localStorage.removeItem('loginInfo');
				localStorage.removeItem('user_details');

				// Return authentication error
				return {
					data: {
						statusCode: 401,
						msg: 'Authentication required. Please log in again.'
					},
					statusCode: 401
				};
			}
		}

		return { data, statusCode };
	} catch (error) {
		console.error("Error in apiCall:", error);
		return {
			data: {
				statusCode: 500,
				msg: 'Something went wrong. Please try again later.'
			},
			statusCode: 500
		};
	}
}

// Function to log out user completely
async function logoutUser() {
	const refreshToken = localStorage.getItem('refresh_token');

	if (refreshToken) {
		try {
			await apiCall('user/logout', 'POST', { refreshToken });
		} catch (error) {
			console.error("Error logging out:", error);
		}
	}

	// Clear all auth-related items from localStorage
	localStorage.removeItem('JWT_token');
	localStorage.removeItem('refresh_token');
	localStorage.removeItem('loginInfo');
	localStorage.removeItem('user_details');
	localStorage.removeItem('healthAssistantChat');
}


function extractEncryptedToken(token) {
	try {
		var base64Url = token.split('.')[1];
		var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		var jsonPayload = decodeURIComponent(
			window
				.atob(base64)
				.split('')
				.map(function (c) {
					return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
				})
				.join('')
		);
		return JSON.parse(jsonPayload);
	} catch (err) {
		console.log(err);
	}
}

// function getLoggedUserId() {
// 	try {
// 		const myUserId = cookies.get('userId');
// 		if (myUserId) {
// 			return myUserId;
// 		}
// 	} catch {}

// 	return null;
// }

// function setLoggedUserId(userId) {
// 	try {
// 		cookies.set('userId', userId, {
// 			path: '/',
// 			expires: COOKIE_EXPIRATION_TIME,
// 		});
// 	} catch {}
// }

// function validateUsername(name) {
//     var re = /^[a-zA-Z0-9_]*$/;
//     return re.test(name);
// }

function userDeviceType() {
	const { innerWidth: width, innerHeight: height } = window;
	if (width > 900) {
		return { mobile: false, desktop: true, width, height };
	} else {
		return { mobile: true, desktop: false, width, height };
	}
}

export { apiCall, extractEncryptedToken, userDeviceType, logoutUser, isTokenExpired, refreshAccessToken };
