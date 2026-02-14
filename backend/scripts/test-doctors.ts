import axios from "axios";

const API_URL = "http://localhost:4000/api";
const EMAIL = `doctor_test_${Date.now()}@example.com`;
const PASSWORD = "password123";

async function testDoctors() {
	try {
		let accessToken = "";
		console.log("1. Attempting Signup/Login...");
		try {
			await axios.post(`${API_URL}/auth/signup`, {
				email: EMAIL,
				password: PASSWORD,
				name: "Doctor Test User",
				gender: "other",
			});
			console.log("Signup successful. Logging in...");
		} catch (e: any) {
			if (e.response?.status === 400 && e.response?.data?.error === "User already exists") {
				console.log("User exists. Proceeding to login...");
			} else {
				console.log("Signup error (might be okay if user exists):", e.message);
			}
		}

		// Login
		try {
			const loginRes = await axios.post(`${API_URL}/auth/login`, {
				email: EMAIL,
				password: PASSWORD,
			});
			accessToken = loginRes.data.tokens.accessToken;
			console.log("Login successful. Token obtained.");
		} catch (e: any) {
			console.error("Login failed:", e.response?.status, e.response?.data);
			return;
		}

		console.log("\n2. Fetching Doctors (All)...");
		const doctorsRes = await axios.get(`${API_URL}/doctors`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		console.log("Doctors found:", doctorsRes.data.data.length);
		if (doctorsRes.data.data.length > 0) {
			console.log("First doctor:", doctorsRes.data.data[0]?.name);
		}

		console.log("\n3. Fetching Doctors (Search 'Cardiologist')...");
		const searchRes = await axios.get(`${API_URL}/doctors?search=Cardiologist`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		console.log("Doctors found (Cardiologist):", searchRes.data.data.length);
		if (searchRes.data.data.length > 0) {
			console.log("Match:", searchRes.data.data[0].name, "-", searchRes.data.data[0].specialization);
		}

		console.log("\n4. Fetching Doctors (Filter Location 'Mumbai')...");
		const locRes = await axios.get(`${API_URL}/doctors?location=Mumbai`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		console.log("Doctors found (Mumbai):", locRes.data.data.length);
	} catch (error: any) {
		console.error("Test failed:", error.response?.status, error.response?.data || error.message);
	}
}

testDoctors();
