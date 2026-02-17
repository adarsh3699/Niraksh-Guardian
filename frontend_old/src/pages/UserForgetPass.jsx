import { useState, useCallback } from "react";
import { NavLink } from "react-router-dom";
import "../styles/userForgetPass.css";
import { apiCall } from "../utils";
import ShowMsg from "../components/showMsg/ShowMsg";

const UserForgetPass = () => {
	const [email, setEmail] = useState("");
	const [encryptedOtp, setEncryptedOtp] = useState("");
	const [isOtpLoading, setIsOtpLoading] = useState(false);
	const [isPassLoading, setIsPassLoading] = useState(false);
	const [otpMsg, setOtpMsg] = useState("");
	const [passMsg, setPassMsg] = useState("");
	const [showChangePassForm, setShowChangePassForm] = useState(false);
	const [msg, setMsg] = useState({ text: "", type: "" });

	const handleMsgShown = useCallback((msgText, type) => {
		if (msgText) {
			setMsg({ text: msgText, type: type });
			setTimeout(() => {
				setMsg({ text: "", type: "" });
			}, 2500);
		} else {
			console.log("Please Provide Text Msg");
		}
	}, []);

	const handleEmailChange = useCallback((e) => {
		setEmail(e.target.value);
	}, []);

	const handleSendOtp = useCallback(
		async (e) => {
			e.preventDefault();
			setIsOtpLoading(true);
			setOtpMsg("");

			if (!email) {
				setOtpMsg("Please enter your email");
				handleMsgShown("Please enter your email", "error");
				setIsOtpLoading(false);
				return;
			}

			try {
				const response = await apiCall("user/forgot-password", "post", { email });

				if (response?.data?.statusCode === 200) {
					setShowChangePassForm(true);
					setOtpMsg(response.data.msg || "OTP sent to your email");
					setEncryptedOtp(response.data.otp);
					handleMsgShown("OTP sent to your email", "success");
				} else {
					const error = response?.data?.msg || "Failed to send OTP. Please try again.";
					setOtpMsg(error);
					handleMsgShown(error, "error");
				}
			} catch (error) {
				console.error("Password reset error:", error);
				const errorMessage = error?.response?.data?.msg || "Something went wrong. Please try again.";
				setOtpMsg(errorMessage);
				handleMsgShown(errorMessage, "error");
			} finally {
				setIsOtpLoading(false);
			}
		},
		[email, handleMsgShown]
	);

	const handlePasswordReset = useCallback(
		async (e) => {
			e.preventDefault();
			setIsPassLoading(true);
			setPassMsg("");

			const otp = e.target.otp.value;
			const password = e.target.password.value;
			const confirmPassword = e.target.confirmPassword.value;

			if (password !== confirmPassword) {
				setPassMsg("Passwords do not match");
				handleMsgShown("Passwords do not match", "error");
				setIsPassLoading(false);
				return;
			}

			try {
				const response = await apiCall("user/reset-password", "post", {
					email,
					password,
					encryptedOtp,
					otp,
				});

				if (response?.data?.statusCode === 200) {
					handleMsgShown("Password changed successfully", "success");
					setPassMsg("Password changed successfully");
					setTimeout(() => {
						window.location.href = "/login";
					}, 2000);
				} else {
					const error = response?.data?.msg || "Failed to reset password. Please try again.";
					setPassMsg(error);
					handleMsgShown(error, "error");
				}
			} catch (error) {
				console.error("Password change error:", error);
				const errorMessage = error?.response?.data?.msg || "Something went wrong. Please try again.";
				setPassMsg(errorMessage);
				handleMsgShown(errorMessage, "error");
			} finally {
				setIsPassLoading(false);
			}
		},
		[email, encryptedOtp, handleMsgShown]
	);

	return (
		<div id="forgot_password">
			<div className="container">
				<h1>Forgot Password</h1>

				<form className={!showChangePassForm ? "visible-form" : "hidden-form"} onSubmit={handleSendOtp}>
					<p>Enter your email address and we&apos;ll send you an OTP to reset your password.</p>
					{otpMsg && <div className="error-message">{otpMsg}</div>}

					<div className="form-group">
						<label htmlFor="email">Email</label>
						<input
							type="email"
							id="email"
							name="email"
							value={email}
							onChange={handleEmailChange}
							required
							placeholder="Enter your email"
							disabled={isOtpLoading}
						/>
					</div>

					<button type="submit" disabled={isOtpLoading}>
						{isOtpLoading ? (
							<div className="loader-container">
								<div className="loader"></div>
								<span>Sending OTP...</span>
							</div>
						) : (
							"Send OTP"
						)}
					</button>
				</form>

				<form className={showChangePassForm ? "visible-form" : "hidden-form"} onSubmit={handlePasswordReset}>
					<p>Enter the OTP sent to your email and create a new password.</p>
					{passMsg && <div className="message">{passMsg}</div>}

					<div className="form-group">
						<label htmlFor="otp">OTP</label>
						<input
							type="text"
							id="otp"
							name="otp"
							required
							placeholder="Enter OTP sent to your email"
							disabled={isPassLoading}
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">New Password</label>
						<input
							type="password"
							id="password"
							name="password"
							required
							pattern=".{8,}"
							placeholder="Minimum 8 characters"
							disabled={isPassLoading}
						/>
					</div>

					<div className="form-group">
						<label htmlFor="confirmPassword">Confirm Password</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							required
							pattern=".{8,}"
							placeholder="Confirm your new password"
							disabled={isPassLoading}
						/>
					</div>

					<button type="submit" disabled={isPassLoading}>
						{isPassLoading ? (
							<div className="loader-container">
								<div className="loader"></div>
								<span>Resetting Password...</span>
							</div>
						) : (
							"Reset Password"
						)}
					</button>
				</form>

				<div className="login-link">
					<NavLink to="/login">Back to Login</NavLink>
				</div>
			</div>
			{msg.text && <ShowMsg msgText={msg.text} type={msg.type} />}
		</div>
	);
};

export default UserForgetPass;
