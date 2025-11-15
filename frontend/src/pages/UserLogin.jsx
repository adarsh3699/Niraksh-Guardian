import { useCallback, useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { apiCall, extractEncryptedToken } from "../utils";
import { useAuthContext } from "../contexts/AuthContext";
import ShowMsg from "../components/showMsg/ShowMsg";

import "../styles/userLogin.css";

// Google OAuth client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const UserLogin = () => {
	const [msg, setMsg] = useState({ text: "", type: "" });
	const [isLoading, setIsLoading] = useState(false);
	const [loadingText, setLoadingText] = useState("");
	const [errorMsg, setErrorMsg] = useState("");
	const location = useLocation();
	const navigate = useNavigate();
	const { isAuthenticated, checkAuthStatus } = useAuthContext();

	// Load Google API script
	useEffect(() => {
		// Load Google's auth script
		const loadGoogleScript = () => {
			// Check if script already exists
			if (document.getElementById("google-auth-script")) return;

			const script = document.createElement("script");
			script.src = "https://accounts.google.com/gsi/client";
			script.id = "google-auth-script";
			script.async = true;
			script.defer = true;
			document.body.appendChild(script);

			script.onload = initializeGoogleLogin;
		};

		loadGoogleScript();

		return () => {
			// Cleanup Google script and callbacks
			const script = document.getElementById("google-auth-script");
			if (script) {
				document.body.removeChild(script);
			}
			// Remove the callback handler
			window.handleGoogleCredentialResponse = undefined;
		};
	}, []);

	// Initialize Google login
	const initializeGoogleLogin = useCallback(() => {
		if (!window.google) return;

		// Define the callback handler for Google's response
		window.handleGoogleCredentialResponse = async (response) => {
			if (response.credential) {
				await handleGoogleAuth(response.credential);
			}
		};

		// Render the button
		window.google.accounts.id.initialize({
			client_id: GOOGLE_CLIENT_ID,
			callback: window.handleGoogleCredentialResponse,
			auto_select: false,
		});

		window.google.accounts.id.renderButton(document.getElementById("google-signin-button"), {
			theme: "outline",
			size: "large",
			width: "100%",
		});
	}, []);

	useEffect(() => {
		// If user is already logged in, redirect to requested page or home
		if (isAuthenticated) {
			const destination = location.state?.from?.pathname || "/";
			navigate(destination, { replace: true });
		}

		// Show message if redirected from a protected route
		if (location.state?.message) {
			handleMsgShown(location.state.message, "info");
		}
	}, [isAuthenticated, location, navigate]);

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

	const handleSubmit = useCallback(
		async (e) => {
			e.preventDefault();
			setIsLoading(true);
			setLoadingText("Logging in...");
			setErrorMsg("");

			const formData = {
				email: e.target.email.value,
				password: e.target.password.value,
			};

			try {
				const apiResp = await apiCall("user/signin", "post", formData);

				if (apiResp?.data?.statusCode === 200 && apiResp?.data?.jwt) {
					const extractedToken = extractEncryptedToken(apiResp.data.jwt);
					const userDetails = {
						type: "user",
						email: extractedToken?.email,
						userId: extractedToken?.userId,
					};

					localStorage.setItem("user_details", JSON.stringify(userDetails));
					localStorage.setItem("JWT_token", apiResp.data.jwt);
					localStorage.setItem("refresh_token", apiResp.data.refreshToken);
					localStorage.setItem("loginInfo", apiResp.data.loginInfo);

					console.log("Tokens stored successfully");

					// Refresh auth state
					checkAuthStatus();

					// Redirect to the page they were trying to access or home
					const destination = location.state?.from?.pathname || "/";
					navigate(destination, { replace: true });
				} else {
					const error = apiResp?.data?.msg || "Login failed. Please check your credentials.";
					setErrorMsg(error);
					handleMsgShown(error, "error");
				}
			} catch (error) {
				console.error("Login error:", error);
				const errorMessage =
					error?.response?.data?.msg || "Something went wrong during login. Please try again.";
				setErrorMsg(errorMessage);
				handleMsgShown(errorMessage, "error");
			} finally {
				setIsLoading(false);
				setLoadingText("");
			}
		},
		[handleMsgShown, location, navigate, checkAuthStatus]
	);

	const handleGoogleAuth = useCallback(
		async (credential) => {
			setIsLoading(true);
			setLoadingText("Connecting to Google...");
			setErrorMsg("");

			try {
				// Call backend with the Google ID token
				const apiResp = await apiCall("user/signin/google", "post", {
					googleIdToken: credential,
				});

				if (apiResp?.data?.statusCode === 200 && apiResp?.data?.jwt) {
					const extractedToken = extractEncryptedToken(apiResp.data.jwt);

					const userDetails = {
						type: "user",
						email: extractedToken?.email,
						userId: extractedToken?.userId,
						firstName: apiResp.data?.details?.firstName,
						lastName: apiResp.data?.details?.lastName,
						profilePicture: apiResp.data?.details?.profilePicture,
					};

					localStorage.setItem("user_details", JSON.stringify(userDetails));
					localStorage.setItem("JWT_token", apiResp.data.jwt);
					localStorage.setItem("refresh_token", apiResp.data.refreshToken);
					localStorage.setItem("loginInfo", apiResp.data.loginInfo);

					console.log("Google login successful!");

					// Refresh auth state
					checkAuthStatus();

					// Redirect to the page they were trying to access or home
					const destination = location.state?.from?.pathname || "/";
					navigate(destination, { replace: true });
				} else {
					const error = apiResp?.data?.msg || "Google login failed. Please try again.";
					setErrorMsg(error);
					handleMsgShown(error, "error");
				}
			} catch (error) {
				console.error("Google login error:", error);
				const errorMessage =
					error?.response?.data?.msg || "Something went wrong during Google login. Please try again.";
				setErrorMsg(errorMessage);
				handleMsgShown(errorMessage, "error");
			} finally {
				setIsLoading(false);
				setLoadingText("");
			}
		},
		[handleMsgShown, location, navigate, checkAuthStatus]
	);

	return (
		<div id="UserLogin">
			<div className="container">
				<h1>Login</h1>
				{location.state?.message && <div className="login-message">{location.state.message}</div>}
				{errorMsg && <div className="error-message">{errorMsg}</div>}

				<form id="login-form" onSubmit={handleSubmit}>
					<label htmlFor="email">Email</label>
					<input type="email" id="email" name="email" required placeholder="Enter your email" />

					<label htmlFor="password">Password</label>
					<input type="password" id="password" name="password" required placeholder="Enter your password" />

					<button type="submit" disabled={isLoading}>
						{isLoading ? (
							<div className="loader-container">
								<div className="loader"></div>
								<span>{loadingText}</span>
							</div>
						) : (
							"Login"
						)}
					</button>
				</form>

				{/* Google Sign-in Button container */}
				<div id="google-signin-container">
					<div id="google-signin-button" style={{ display: isLoading ? "none" : "flex" }}></div>
				</div>

				<div className="links">
					<NavLink to="/forgot-password">Forgot password?</NavLink>
					<NavLink to="/register" style={{ marginTop: "20px" }}>
						Don&apos;t have an account? Sign up
					</NavLink>
				</div>
			</div>
			{msg && <ShowMsg msgText={msg?.text} type={msg?.type} />}
		</div>
	);
};

export default UserLogin;
