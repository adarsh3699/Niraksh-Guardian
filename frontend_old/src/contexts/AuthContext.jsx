import { createContext, useContext } from "react";
import { useAuth } from "../hooks/useAuth";
import PropTypes from "prop-types";

// Create the Auth Context
const AuthContext = createContext(null);

/**
 * Auth Provider component to wrap the application
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function AuthProvider({ children }) {
	const auth = useAuth();

	return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

/**
 * Custom hook to use the auth context
 * @returns {Object} Auth context value
 */
export function useAuthContext() {
	const context = useContext(AuthContext);
	if (context === null) {
		throw new Error("useAuthContext must be used within an AuthProvider");
	}
	return context;
}
