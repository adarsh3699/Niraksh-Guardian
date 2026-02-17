import { useState, useEffect, useCallback } from 'react';
import { logoutUser } from '../utils';

/**
 * Custom hook to manage authentication state
 * @returns {Object} Authentication state and methods
 */
export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Function to check authentication status
    const checkAuthStatus = useCallback(() => {
        const jwtToken = localStorage.getItem('JWT_token');
        const userDetails = localStorage.getItem('user_details');

        setIsLoading(true);
        if (jwtToken && userDetails) {
            try {
                setIsAuthenticated(true);
                setUserProfile(JSON.parse(userDetails));
            } catch (error) {
                console.error('Error parsing user details:', error);
                setIsAuthenticated(false);
                setUserProfile(null);
            }
        } else {
            setIsAuthenticated(false);
            setUserProfile(null);
        }
        setIsLoading(false);
    }, []);

    // Function to handle logout
    const handleLogout = useCallback(async () => {
        try {
            await logoutUser();
            setIsAuthenticated(false);
            setUserProfile(null);
            return true;
        } catch (error) {
            console.error('Error during logout:', error);
            return false;
        }
    }, []);

    // Check auth status on mount and when localStorage changes
    useEffect(() => {
        // Initial check
        checkAuthStatus();

        // Listen for localStorage changes
        const handleStorageChange = (event) => {
            if (event.key === 'JWT_token' || event.key === 'user_details' || event.key === null) {
                checkAuthStatus();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Create an interval to periodically check auth status
        const interval = setInterval(checkAuthStatus, 5000);

        // Cleanup
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [checkAuthStatus]);

    return {
        isAuthenticated,
        userProfile,
        isLoading,
        logout: handleLogout,
        checkAuthStatus
    };
} 