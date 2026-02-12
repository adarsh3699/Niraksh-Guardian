const { enc, AES, MD5 } = require("crypto-js");
const { google } = require("googleapis");
const nodemailer = require("nodemailer");
var createError = require("http-errors");
const JWT = require("jsonwebtoken");
require("dotenv").config();

const encryptionKey = process.env.JWT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
	throw new Error("Missing JWT_SECRET environment variable");
}

const CLIENT_ID = process.env.EMAIL_CLIENT_ID;
const CLEINT_SECRET = process.env.EMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.EMAIL_REDIRECT_URI;
const REFRESH_TOKEN = process.env.EMAIL_REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLEINT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

function getMongoDb() {
	if (!process.env.MONGODB_URI) {
		throw new Error("Missing MONGODB_URI environment variable");
	}
	return process.env.MONGODB_URI;
}

function createTokens(payload) {
	try {
		const options = {
			expiresIn: process.env.JWT_EXPIRATION || "240h",
		};

		const token = JWT.sign(payload, JWT_SECRET, options);
		return token;
	} catch (err) {
		console.log(err);
		return createError.InternalServerError().message;
	}
}

function createRefreshToken(payload) {
	try {
		const options = {
			expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || "30d",
		};

		const token = JWT.sign(payload, JWT_SECRET, options);
		return token;
	} catch (err) {
		console.log(err);
		return createError.InternalServerError().message;
	}
}

function signLoginInfoToken(verified, linkWithGoogle, linkWithPassword) {
	try {
		const payload = {
			verified: verified,
			linkWithGoogle: linkWithGoogle,
			linkWithPassword: linkWithPassword,
		};
		const options = {
			expiresIn: process.env.JWT_EXPIRATION || "240h",
		};

		const token = JWT.sign(payload, JWT_SECRET, options);
		return token;
	} catch (err) {
		console.log(err);
		return createError.InternalServerError().message;
	}
}

function verifyAccessToken(req) {
	try {
		if (!req?.headers?.authorization) return { authorization: false, message: "Please provide Token" };

		const authHeader = req.headers["authorization"];
		const bearerToken = authHeader.split(" ");
		const token = bearerToken[1];

		const isTokenValid = JWT.verify(token, JWT_SECRET, (err, payload) => {
			if (err) {
				const message = err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
				return { authorization: false, message };
			}

			return { authorization: true, payload };
		});
		return isTokenValid;
	} catch (err) {
		console.log(err);
		return { authorization: false, message: "Internal server error" };
	}
}

function verifyLoginInfoToken(token) {
	try {
		if (!token) return { authorization: false, message: "Please provide Token" };

		const isTokenValid = JWT.verify(token, JWT_SECRET, (err, payload) => {
			if (err) {
				const message = err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
				return { authorization: false, message };
			}

			return { authorization: true, payload };
		});
		return isTokenValid;
	} catch (err) {
		console.log(err);
		return { authorization: false, message: "Internal server error" };
	}
}

function verifyRefreshToken(token) {
	try {
		if (!token) return { authorization: false, message: "Please provide Token" };

		const isTokenValid = JWT.verify(token, JWT_SECRET, (err, payload) => {
			if (err) {
				const message = err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
				return { authorization: false, message };
			}

			return { authorization: true, payload };
		});
		return isTokenValid;
	} catch (err) {
		console.log(err);
		return { authorization: false, message: "Internal server error" };
	}
}

function encryptText(text) {
	try {
		const encryptedValue = AES.encrypt(text, encryptionKey).toString();
		return encryptedValue;
	} catch {
		return null;
	}
}

function decryptText(enryptedValue) {
	let value = null;
	try {
		const decrypted = AES.decrypt(enryptedValue, encryptionKey);
		value = enc.Utf8.stringify(decrypted);
	} catch {
		return null;
	}

	return value;
}

function md5Hash(text) {
	try {
		return MD5(text).toString();
	} catch {
		return null;
	}
}

async function sendMail(mailTo, mailSubject, title, object) {
	try {
		//mailing to the new user
		const accessToken = await oAuth2Client.getAccessToken();

		const transport = nodemailer.createTransport({
			service: "gmail",
			auth: {
				type: "OAuth2",
				user: process.env.EMAIL_USER || "bhemujee@gmail.com",
				clientId: CLIENT_ID,
				clientSecret: CLEINT_SECRET,
				refreshToken: REFRESH_TOKEN,
				accessToken: accessToken,
			},
		});

		const mailOptions = {
			from: "Niraksh Guardian" + " <" + (process.env.EMAIL_USER || "bhemujee@gmail.com") + ">",
			to: mailTo,
			subject: mailSubject,
			text: title + "/n" + object,
			html:
				'<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' +
				mailSubject +
				'</title><style>body {font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;margin: 0;padding: 0;background-color: #f9f9f9;}#wrapper {max-width: 600px;margin: 0 auto;background-color: #ffffff;border-radius: 8px;overflow: hidden;box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);}#header {background-color: #2c3e50;padding: 30px 20px;text-align: center;}#title {color: white;font-size: 28px;font-weight: 600;margin: 0;}#content {padding: 30px 25px;}#object {background-color: #f7f7f7;border-left: 4px solid #2c3e50;color: #333;padding: 20px;font-size: 16px;line-height: 1.5;margin: 20px 0;border-radius: 0 4px 4px 0;}#footer {padding: 20px;text-align: center;font-size: 14px;color: #777;background-color: #f1f1f1;}.button {display: inline-block;background-color: #3498db;color: white;text-decoration: none;padding: 12px 25px;border-radius: 4px;font-weight: 500;margin-top: 15px;}.welcome-text {margin-bottom: 20px;line-height: 1.6;color: #444;}.additional-info {margin-top: 25px;padding-top: 20px;border-top: 1px solid #eee;color: #666;font-size: 14px;}.contact-info {margin-top: 20px;font-size: 14px;color: #666;}.highlight {color: #2c3e50;font-weight: 600;}</style></head><body><div id="wrapper"><div id="header"><h1 id="title">' +
				title +
				'</h1></div><div id="content"><p class="welcome-text">Thank you for using Niraksh Guardian, your trusted security companion. We\'re committed to keeping your information safe and secure.</p><div id="object">' +
				object +
				'</div><div class="additional-info"><p>Niraksh Guardian provides advanced security features to protect your data and privacy. If you have any questions about this notification or need assistance with your account, please don\'t hesitate to reach out to our support team.</p><p class="contact-info">For additional help: <span class="highlight">adarsh3699@gmail.com</span></p></div></div><div id="footer">© ' +
				new Date().getFullYear() +
				" Niraksh Guardian. All rights reserved.</div></div></body></html>",
		};

		const result = await transport.sendMail(mailOptions);

		console.log("Email sent...", result);
		return result;
	} catch (err) {
		console.log("Fail to send mail ", err);
	}
}

async function verifyGoogleIdToken(token) {
	try {
		const ticket = await oAuth2Client.verifyIdToken({
			idToken: token,
			audience: [CLIENT_ID, process.env.GOOGLE_CLIENT_ID],
		});
		const payload = ticket.getPayload();
		return payload;
	} catch (error) {
		console.error("Error verifying Google ID token:", error);
		throw new Error("Invalid Google ID token");
	}
}

module.exports = {
	encryptText,
	JWT_SECRET,
	decryptText,
	md5Hash,
	getMongoDb,
	sendMail,
	createTokens,
	verifyAccessToken,
	signLoginInfoToken,
	verifyLoginInfoToken,
	createRefreshToken,
	verifyRefreshToken,
	verifyGoogleIdToken,
};
