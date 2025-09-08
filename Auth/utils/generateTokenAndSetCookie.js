import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, user) => {
	const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
		expiresIn: "7d",
	});

	res.cookie("token", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite:  process.env.NODE_ENV === "production" ? "none" : "lax",
		maxAge: 7 * 24 * 60 * 60 * 1000,
	});

	return token;
};