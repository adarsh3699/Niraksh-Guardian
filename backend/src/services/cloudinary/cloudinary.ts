import { v2 as cloudinary } from "cloudinary";
import env from "../../config/env";
import logger from "../../config/logger";

// Configure Cloudinary
cloudinary.config({
	cloud_name: env.CLOUDINARY_CLOUD_NAME,
	api_key: env.CLOUDINARY_API_KEY,
	api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads an image buffer to Cloudinary.
 * @param fileBuffer The image buffer to upload.
 * @param folder The folder in Cloudinary to store the image.
 * @returns The secure URL of the uploaded image.
 */
export const uploadImage = async (fileBuffer: Buffer, folder: string = "niraksh_uploads"): Promise<string> => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream({ folder: folder }, (error, result) => {
			if (error) {
				logger.error({ err: error }, "Cloudinary Upload Error");
				return reject(error);
			}
			if (!result) {
				return reject(new Error("Cloudinary upload failed: No result returned"));
			}
			resolve(result.secure_url);
		});
		uploadStream.end(fileBuffer);
	});
};

/**
 * Extracts public ID from a Cloudinary URL.
 */
/**
 * Extracts public ID from a Cloudinary URL.
 */
export const extractPublicId = (url: string): string | null => {
	try {
		// Matches .../upload/v12345/folder/imageId.jpg -> folder/imageId
		const parts = url.split("/upload/");
		if (parts.length < 2) return null;

		// parts[1] is like "v1739564263/test_uploads/xyzw.png"
		// Find the first slash after version
		const versionEndIndex = parts[1].indexOf("/");
		if (versionEndIndex === -1) return null;

		let publicIdWithExtension = parts[1].substring(versionEndIndex + 1);

		// Remove file extension
		const lastDotIndex = publicIdWithExtension.lastIndexOf(".");
		if (lastDotIndex !== -1) {
			publicIdWithExtension = publicIdWithExtension.substring(0, lastDotIndex);
		}

		return publicIdWithExtension;
	} catch (error) {
		logger.error({ err: error, url }, "Failed to extract public ID");
		return null;
	}
};

/**
 * Deletes an image from Cloudinary using its public ID.
 */
export const deleteImage = async (publicId: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		cloudinary.uploader.destroy(publicId, (error, result) => {
			if (error) {
				logger.error({ err: error, publicId }, "Cloudinary Delete Error");
				return reject(error);
			}
			logger.info({ publicId, result }, "Cloudinary Image Deleted");
			resolve();
		});
	});
};

export default cloudinary;
