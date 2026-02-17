import { useCallback, useState } from "react";

import "../styles/userSignup.css";
import { NavLink } from "react-router-dom";
import { apiCall } from "../utils";
import ShowMsg from "../components/showMsg/ShowMsg";

const UserSignup = () => {
	const [msg, setMsg] = useState({ text: "", type: "" });
	const [isLoading, setIsLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
	});

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

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({
			...formData,
			[name]: value,
		});
	};

	const handleSubmit = useCallback(
		async (e) => {
			e.preventDefault();
			setIsLoading(true);
			setErrorMsg("");

			try {
				const apiResp = await apiCall("user/signup", "post", formData);

				if (apiResp.statusCode === 200) {
					document.location.href = "/login";
				} else {
					setErrorMsg(apiResp.msg || "Signup failed. Please try again.");
					handleMsgShown(apiResp.msg, "error");
				}
			} catch (error) {
				console.error("Signup error:", error);
				const errorMessage = error?.response?.data?.msg || "Something went wrong. Please try again.";
				setErrorMsg(errorMessage);
				handleMsgShown(errorMessage, "error");
			} finally {
				setIsLoading(false);
			}
		},
		[formData, handleMsgShown]
	);

	return (
		<div id="userSignup">
			<div className="container">
				<h1>Create an account</h1>
				{errorMsg && <div className="error-message">{errorMsg}</div>}

				<form id="signup-form" onSubmit={handleSubmit}>
					<label htmlFor="email">Email</label>
					<input
						type="email"
						id="email"
						name="email"
						onChange={handleChange}
						required
						placeholder="Enter email"
						disabled={isLoading}
					/>

					<label htmlFor="username">Name</label>
					<input
						type="text"
						id="username"
						name="username"
						onChange={handleChange}
						required
						placeholder="Enter name"
						disabled={isLoading}
					/>

					<label htmlFor="password">Set Password</label>
					<input
						type="password"
						id="password"
						name="password"
						onChange={handleChange}
						required
						placeholder="Enter password"
						disabled={isLoading}
					/>

					<label>Sex</label>
					<div className="gender-group">
						<label>
							<input
								type="radio"
								id="male"
								name="gender"
								onChange={handleChange}
								value="male"
								required
								disabled={isLoading}
							/>
							Male
						</label>
						<label>
							<input
								type="radio"
								id="female"
								name="gender"
								onChange={handleChange}
								value="female"
								required
								disabled={isLoading}
							/>
							Female
						</label>
					</div>

					<button type="submit" disabled={isLoading}>
						{isLoading ? (
							<div className="loader-container">
								<div className="loader"></div>
								<span>Creating account...</span>
							</div>
						) : (
							"Continue"
						)}
					</button>
				</form>
				<button className="google-btn" disabled={isLoading}>
					<img
						src="https://www.freepnglogos.com/uploads/google-logo-png/google-logo-icon-png-transparent-background-osteopathy-16.png"
						loading="lazy"
						alt="Google"
						width="20px"
					/>
					Continue with Google
				</button>
				<div className="login-link">
					<NavLink to="/login">Already have an account? Log in</NavLink>
				</div>
			</div>
			{msg && <ShowMsg msgText={msg?.text} type={msg?.type} />}
		</div>
	);
};

export default UserSignup;
