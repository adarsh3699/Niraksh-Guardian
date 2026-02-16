import { uploadImage, extractPublicId, deleteImage } from "../src/services/cloudinary/cloudinary";

async function testCloudinary() {
	try {
		console.log("🚀 Testing Cloudinary Upload...");
		// Create a small 1x1 red pixel PNG buffer
		const buffer = Buffer.from(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
			"base64"
		);

		console.log("   Uploading test image...");
		const url = await uploadImage(buffer, "test_uploads");
		console.log("   ✅ Upload successful!");
		console.log(`   URL: ${url}`);

		console.log("\n🚀 Testing Cloudinary Deletion...");
		const publicId = extractPublicId(url);
		console.log(`   Extracted Public ID: ${publicId}`);

		if (publicId) {
			await deleteImage(publicId);
			console.log("   ✅ Deletion successful!");
		} else {
			console.error("   ❌ Failed to extract Public ID.");
			process.exit(1);
		}
	} catch (error: any) {
		console.error("   ❌ Operation failed:", error.message);
		if (error.issues) {
			console.error("   Validation Issues:", JSON.stringify(error.issues, null, 2));
		}
		process.exit(1);
	}
}

testCloudinary();
