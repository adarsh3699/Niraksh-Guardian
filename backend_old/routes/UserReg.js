const express = require("express");
// const jwt = require("jsonwebtoken");
const axios = require("axios");
const {
	JWT_SECRET,
	md5Hash,
	sendMail,
	encryptText,
	decryptText,
	createTokens,
	createRefreshToken,
	verifyRefreshToken,
	verifyGoogleIdToken,
	verifyAccessToken,
} = require("../utils");
const User = require("../models/userRegModels");

const app = express();

app.get("/", (req, res) => {
	res.send("Hello user");
});

// normal-auth
app.post("/signin", async (req, res) => {
	const email = req.body?.email?.trim();
	const password = req.body?.password?.trim();

	if (!email || !password) return res.status(400).json({ statusCode: 400, msg: "Invalid field!" });
	try {
		const existingUser = await User.findOne({ email });

		if (!existingUser) {
			return res.status(404).json({ statusCode: 404, msg: "User don't exist!" });
		}

		if (existingUser?.linkWithPassword) {
			const encryptedPassword = md5Hash(password);

			if (encryptedPassword !== existingUser.password) {
				return res.status(400).json({ statusCode: 400, msg: "Invalid credintials!" });
			}

			// Generate access token
			const token = createTokens({
				userId: existingUser._id,
				email: existingUser.email,
				type: "user",
			});

			// Generate refresh token
			const refreshToken = createRefreshToken({
				userId: existingUser._id,
				tokenVersion: Date.now(),
			});

			// Calculate expiration date for refresh token
			const refreshExpires = new Date();
			refreshExpires.setDate(refreshExpires.getDate() + 30); // 30 days from now

			// Update user's refresh token in database
			await User.updateOne(
				{ _id: existingUser._id },
				{
					$set: {
						refreshToken: refreshToken,
						refreshTokenExpiresAt: refreshExpires,
						lastLogin: new Date(),
					},
				}
			);

			const loginInfo = createTokens({
				verified: existingUser?.verified,
				linkWithGoogle: existingUser?.linkWithGoogle,
				linkWithPassword: existingUser?.linkWithPassword,
			});

			res.status(200).json({
				statusCode: 200,
				jwt: token,
				refreshToken: refreshToken,
				loginInfo,
				msg: "Login Successfully",
			});
		} else {
			return res.status(400).json({
				statusCode: 400,
				msg: "You have an account using Google Login. So,Please login through the Google button ",
			});
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({ statusCode: 500, msg: "Something went wrong!" });
	}
});

// google-auth
app.post("/signin/google", async (req, res) => {
	// Accept both ID token and Access Token
	const googleAccessToken = req.body.googleAccessToken;
	const googleIdToken = req.body.googleIdToken || googleAccessToken; // Handle either token type
	const createdOn = new Date(Date.now());

	try {
		if (googleAccessToken || googleIdToken) {
			// If we have access token, use it to get user info from Google API
			if (googleAccessToken && googleAccessToken.startsWith("ya29.")) {
				axios
					.get("https://www.googleapis.com/oauth2/v3/userinfo", {
						headers: {
							Authorization: `Bearer ${googleAccessToken}`,
						},
					})
					.then(async (response) => {
						// Process user data from Google API
						await processGoogleUserData(response.data, createdOn, res);
					})
					.catch((err) => {
						console.log(err);
						res.status(400).json({ statusCode: 400, msg: "Invalid access token!" });
					});
			}
			// If we have ID token (JWT from Google), verify it
			else if (googleIdToken) {
				try {
					const payload = await verifyGoogleIdToken(googleIdToken);

					// Process user data from verified token
					const userData = {
						given_name: payload.given_name,
						family_name: payload.family_name,
						email: payload.email,
						picture: payload.picture,
					};

					await processGoogleUserData(userData, createdOn, res);
				} catch (error) {
					console.log("Error verifying ID token:", error);
					res.status(400).json({ statusCode: 400, msg: "Invalid ID token!" });
				}
			}
		} else {
			res.status(400).json({ statusCode: 400, msg: "Please provide a Google token" });
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({ statusCode: 500, msg: "Something went wrong!" });
	}
});

// Helper function to process Google user data
async function processGoogleUserData(userData, createdOn, res) {
	try {
		const firstName = userData.given_name;
		const lastName = userData.family_name;
		const email = userData.email;
		const picture = userData.picture;

		const existingUser = await User.findOne({ email });

		if (!existingUser) {
			const result = await User.create({
				firstName,
				lastName,
				profilePicture: picture,
				email,
				verified: true,
				linkWithGoogle: true,
				linkWithPassword: false,
				createdOn,
			});

			const token = createTokens({
				userId: result?._id,
				email: result?.email,
			});

			// Generate refresh token
			const refreshToken = createRefreshToken({
				userId: result?._id,
				tokenVersion: Date.now(),
			});

			// Calculate expiration date for refresh token
			const refreshExpires = new Date();
			refreshExpires.setDate(refreshExpires.getDate() + 30); // 30 days from now

			// Update user's refresh token in database
			await User.updateOne(
				{ _id: result?._id },
				{
					$set: {
						refreshToken: refreshToken,
						refreshTokenExpiresAt: refreshExpires,
						lastLogin: new Date(),
					},
				}
			);

			const loginInfo = createTokens({
				verified: result?.verified,
				linkWithGoogle: result?.linkWithGoogle,
				linkWithPassword: result?.linkWithPassword,
			});

			const details = {
				firstName: result?.firstName,
				lastName: result?.lastName,
				profilePicture: result?.profilePicture,
			};

			res.status(200).json({
				statusCode: 200,
				details,
				jwt: token,
				refreshToken: refreshToken,
				loginInfo,
				msg: "Login Successfully",
			});
		} else if (existingUser.linkWithGoogle === true) {
			const token = createTokens({
				userId: existingUser._id,
				email: existingUser.email,
			});

			// Generate refresh token
			const refreshToken = createRefreshToken({
				userId: existingUser._id,
				tokenVersion: Date.now(),
			});

			// Calculate expiration date for refresh token
			const refreshExpires = new Date();
			refreshExpires.setDate(refreshExpires.getDate() + 30); // 30 days from now

			// Update user's refresh token in database
			await User.updateOne(
				{ _id: existingUser._id },
				{
					$set: {
						refreshToken: refreshToken,
						refreshTokenExpiresAt: refreshExpires,
						lastLogin: new Date(),
					},
				}
			);

			const loginInfo = createTokens({
				verified: existingUser?.verified,
				linkWithGoogle: existingUser?.linkWithGoogle,
				linkWithPassword: existingUser?.linkWithPassword,
			});

			const details = {
				firstName: existingUser.firstName,
				lastName: existingUser.lastName,
				profilePicture: existingUser.profilePicture,
			};

			res.status(200).json({
				statusCode: 200,
				details,
				jwt: token,
				refreshToken: refreshToken,
				loginInfo,
				msg: "Login Successfully",
			});
		} else {
			return res.status(404).json({
				statusCode: 404,
				msg: "Please login through your email password.",
			});
		}
	} catch (error) {
		console.log("Error processing Google user data:", error);
		res.status(500).json({ statusCode: 500, msg: "Error processing user data" });
	}
}

// create new User
app.post("/signup", async (req, res) => {
	// normal form signup
	const email = req.body?.email?.trim();
	const password = req.body?.password?.trim();
	const gender = req.body?.gender?.trim();
	const createdOn = new Date(Date.now());

	try {
		if (!email || !password || !gender)
			return res.status(400).json({
				statusCode: 400,
				msg: "Please Provide all Details or Check password Pattern",
			});

		// if (password !== confPassword) return res.status(400).json({ statusCode: 400, msg: "Password does not match" });
		if (password.length < 8)
			return res.status(400).json({
				statusCode: 400,
				msg: "Password must be at least 8 characters",
			});

		const existingUser = await User.findOne({ email });

		if (existingUser) return res.status(400).json({ statusCode: 400, msg: "User already exist!" });

		const hashedPassword = md5Hash(password);

		const result = await User.create({
			email,
			gender,
			password: hashedPassword,
			verified: true,
			linkWithGoogle: false,
			linkWithPassword: true,
			createdOn,
		});

		res.status(200).json({ statusCode: 200, msg: "Successfully Created" });
	} catch (err) {
		console.log(err);
		res.status(500).json({ statusCode: 500, msg: "Something went wrong!" });
	}
});

app.post("/forgot-password", async function (req, res) {
	const email = req.body.email ? req.body.email.trim() : req.body.email;
	try {
		if (email) {
			// Check if the email exists in the database
			const user = await User.findOne({ email });

			if (!user) {
				return res.status(404).json({
					statusCode: 404,
					msg: "Email not registered. Please check your email or create a new account.",
				});
			}

			let toSend = {};
			const otp = Math.floor(1000 + Math.random() * 9000);

			sendMail(email, "Forgot Password", "Your OTP is", otp);
			toSend.statusCode = 200;
			toSend.msg = "OTP sent successfully";
			toSend.otp = encryptText(otp + "");

			res.status(toSend.statusCode);
			res.send(toSend);
		} else {
			res.status(400);
			res.send({ statusCode: 400, msg: "Please Enter Your Email" });
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({ statusCode: 500, msg: "Something went wrong!" });
	}
});

app.post("/reset-password", async function (req, res) {
	const email = req.body.email ? req.body.email.trim() : req.body.email;
	const password = req.body.password ? req.body.password.trim() : req.body.password;
	const otp = req.body.otp ? req.body.otp.trim() : req.body.otp;
	const encryptedOtp = decryptText(req.body.encryptedOtp);

	try {
		if (email && req.body.password && otp && req.body.encryptedOtp) {
			if (otp == encryptedOtp) {
				const encryptedPassword = md5Hash(password);

				const queryResp = await User.updateOne({ email }, { $set: { password: encryptedPassword } });

				let toSend = {};
				toSend.statusCode = 200;
				toSend.msg = "Password updated successfully";
				res.status(toSend.statusCode);
				res.send(toSend);
			} else {
				res.status(400);
				res.send({ statusCode: 400, msg: "OTP do not match" });
			}
		} else {
			res.status(400);
			res.send({ statusCode: 400, msg: "Please provide all details" });
		}
	} catch (e) {
		res.status(500);
		res.send({
			statusCode: 500,
			msg: "Something went wrong",
			error: e.message,
		});
	}
});

// Refresh token endpoint
app.post("/refresh-token", async (req, res) => {
	const refreshToken = req.body?.refreshToken?.trim();

	if (!refreshToken) {
		return res.status(400).json({ statusCode: 400, msg: "Refresh token is required" });
	}

	try {
		// Verify the refresh token
		const tokenResult = verifyRefreshToken(refreshToken);
		if (!tokenResult.authorization) {
			return res.status(401).json({ statusCode: 401, msg: "Invalid or expired refresh token" });
		}

		// Find the user with this refresh token
		const user = await User.findOne({ refreshToken });

		if (!user) {
			return res.status(401).json({ statusCode: 401, msg: "Invalid refresh token" });
		}

		// Check if the token is expired in our database
		if (user.refreshTokenExpiresAt && new Date() > user.refreshTokenExpiresAt) {
			return res.status(401).json({ statusCode: 401, msg: "Refresh token expired" });
		}

		// Generate new tokens
		const accessToken = createTokens({
			userId: user._id,
			email: user.email,
			type: "user",
		});

		const newRefreshToken = createRefreshToken({
			userId: user._id,
			tokenVersion: Date.now(),
		});

		// Calculate expiration date for refresh token
		const refreshExpires = new Date();
		refreshExpires.setDate(refreshExpires.getDate() + 30); // 30 days from now

		// Update the user's refresh token in the database
		await User.updateOne(
			{ _id: user._id },
			{
				$set: {
					refreshToken: newRefreshToken,
					refreshTokenExpiresAt: refreshExpires,
					lastLogin: new Date(),
				},
			}
		);

		// Send the new tokens
		res.status(200).json({
			statusCode: 200,
			jwt: accessToken,
			refreshToken: newRefreshToken,
			msg: "Tokens refreshed successfully",
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({ statusCode: 500, msg: "Something went wrong!" });
	}
});

// Logout endpoint
app.post("/logout", async (req, res) => {
	// Verify the access token to identify the user
	const tokenVerification = verifyAccessToken(req);
	if (!tokenVerification.authorization) {
		return res.status(401).json({ statusCode: 401, msg: "Unauthorized" });
	}

	const { userId } = tokenVerification.payload;

	try {
		// Clear the refresh token for this user
		await User.updateOne(
			{ _id: userId },
			{
				$set: {
					refreshToken: null,
					refreshTokenExpiresAt: null,
				},
			}
		);

		res.status(200).json({
			statusCode: 200,
			msg: "Logged out successfully",
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({ statusCode: 500, msg: "Something went wrong!" });
	}
});

module.exports = app;
