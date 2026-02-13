import jwt, { JwtPayload } from "jsonwebtoken";
import env from "../../config/env";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export const generateAccessToken = (userId: string): string => {
	return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (userId: string): string => {
	return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

export const verifyAccessToken = (token: string): string | JwtPayload => {
	return jwt.verify(token, env.JWT_SECRET);
};

export const verifyRefreshToken = (token: string): string | JwtPayload => {
	return jwt.verify(token, env.JWT_REFRESH_SECRET);
};
