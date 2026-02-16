const tls = require("tls");
const fs = require("fs");

const options = {
	host: "db.prisma.io",
	port: 5432,
	minVersion: "TLSv1.2",
	rejectUnauthorized: false, // For testing, to see if we even get a cert
};

console.log(`Attempting TLS connection to ${options.host}:${options.port}...`);

const socket = tls.connect(options, () => {
	console.log("✅ TLS Connection established!");
	console.log("   Cipher:", socket.getCipher());
	console.log("   Protocol:", socket.getProtocol());
	console.log("   Authorized:", socket.authorized);
	if (!socket.authorized) {
		console.log("   Authorization Error:", socket.authorizationError);
	}
	socket.end();
});

socket.on("error", (err) => {
	console.error("❌ Connection failed:", err);
});

socket.on("end", () => {
	console.log("Connection closed.");
});
