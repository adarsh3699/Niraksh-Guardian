import axios from "axios";

const API_URL = "http://localhost:4000/api/auth";

const testAuth = async () => {
	try {
		console.log("Testing Signup...");
		const uniqueEmail = `test${Date.now()}@example.com`;
		const signupRes = await axios.post(`${API_URL}/signup`, {
			email: uniqueEmail,
			password: "password123",
			gender: "Male",
		});
		console.log("Signup Success:", signupRes.data.message);
		const { accessToken, refreshToken } = signupRes.data.tokens;

		console.log("Testing Login...");
		const loginRes = await axios.post(`${API_URL}/login`, {
			email: uniqueEmail,
			password: "password123",
		});
		console.log("Login Success:", loginRes.data.message);

		console.log("Testing Refresh Token...");
		const refreshRes = await axios.post(`${API_URL}/refresh-token`, {
			refreshToken,
		});
		console.log("Refresh Success. New Access Token:", !!refreshRes.data.accessToken);

		console.log("Testing Logout...");
		const logoutRes = await axios.post(`${API_URL}/logout`, {
			refreshToken,
		});
		console.log("Logout Success:", logoutRes.data.message);
	} catch (error: any) {
		console.error("Test Failed:", error.response ? error.response.data : error.message);
	}
};

testAuth();
