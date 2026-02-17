import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import PropTypes from "prop-types";
import "./AuthGuard.css";

/**
 * Component that guards routes requiring authentication
 * Shows a login message when users try to access protected features
 */
function AuthGuard({ children }) {
	const [redirectNow, setRedirectNow] = useState(false);
	const { isAuthenticated, isLoading } = useAuthContext();
	const location = useLocation();

	// Set up timer to redirect after delay when not authenticated
	useEffect(() => {
		// If authentication is still loading or user is authenticated, do nothing
		if (isLoading || isAuthenticated) return;

		// If not authenticated, set up redirect timer
		const timer = setTimeout(() => {
			setRedirectNow(true);
		}, 3000);

		return () => clearTimeout(timer);
	}, [isLoading, isAuthenticated]);

	// If still loading auth state, show nothing or a loading indicator
	if (isLoading) {
		return null;
	}

	// If not authenticated, handle redirect flow
	if (!isAuthenticated) {
		if (redirectNow) {
			// Redirect to login page with return URL
			return <Navigate to="/login" state={{ from: location, message: "Please login to access this feature" }} />;
		}

		// Show message before redirecting
		return (
			<div className="auth-guard-container">
				<div className="auth-guard-message">
					<h2>Authentication Required</h2>
					<p>You need to login to access this feature.</p>
					<p>Redirecting to login page...</p>
					<div className="auth-guard-spinner"></div>
					<button onClick={() => setRedirectNow(true)}>Login Now</button>
				</div>
			</div>
		);
	}

	// User is authenticated, render the protected component
	return children;
}

AuthGuard.propTypes = {
	children: PropTypes.node.isRequired,
};

export default AuthGuard;
