import axios from "axios";

const API_URL = "http://localhost:4000";

async function testHealth() {
	try {
		console.log("Testing GET / ...");
		const rootRes = await axios.get(`${API_URL}/`);
		console.log("ROOT Status:", rootRes.status);

		console.log("Testing GET /health ...");
		const healthRes = await axios.get(`${API_URL}/health`);
		console.log("HEALTH Status:", healthRes.status);
		console.log("HEALTH Data:", healthRes.data);
	} catch (error: any) {
		console.error("Test failed:", error.response?.status, error.response?.data || error.message);
	}
}

testHealth();
