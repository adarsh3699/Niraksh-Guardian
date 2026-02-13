import jwt from "jsonwebtoken";
import env from "../config/env";

export const generateAccessToken = (userId: string): string => {
	return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: string): string => {
	return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string): string | jwt.JwtPayload => {
	return jwt.verify(token, env.JWT_SECRET);
};

export const verifyRefreshToken = (token: string): string | jwt.JwtPayload => {
	return jwt.verify(token, env.JWT_REFRESH_SECRET);
};
