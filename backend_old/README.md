# Niraksh 2.0 Authentication System

This document explains the authentication system for Niraksh 2.0.

## Overview

The authentication system uses JWT (JSON Web Tokens) for secure authentication with a refresh token mechanism for enhanced security and improved user experience.

## Features

-   JWT-based authentication
-   Refresh token mechanism
-   Token expiration management
-   Secure storage of tokens
-   Environment variables for sensitive information
-   Google OAuth integration
-   Email/password authentication

## Authentication Flow

1. **User Login**:

    - User logs in with email/password or Google OAuth
    - Server validates credentials and generates:
        - Access token (short-lived)
        - Refresh token (long-lived)
    - Tokens are sent to the client

2. **Using Protected Resources**:

    - Client includes access token in Authorization header
    - Server validates token using middleware
    - If valid, request proceeds
    - If invalid or expired, client attempts token refresh

3. **Token Refresh**:

    - Client sends refresh token to server
    - Server validates refresh token
    - If valid, new access token and refresh token are issued
    - If invalid, user must log in again

4. **Logout**:
    - Client sends logout request with refresh token
    - Server invalidates the refresh token
    - Client clears token storage

## API Endpoints

### Auth Endpoints

-   `POST /user/signin`: Login with email/password
-   `POST /user/signin/google`: Login with Google
-   `POST /user/signup`: Register a new user
-   `POST /user/refresh-token`: Get new tokens using refresh token
-   `POST /user/logout`: Invalidate tokens and log out
-   `POST /user/forget_password`: Request password reset
-   `POST /user/change_password`: Change password

### Protected Routes

All endpoints under `/ai/*` require authentication.

## Setup

1. Make sure to set up environment variables in a `.env` file based on `.env.example`
2. Install dependencies: `npm install`
3. Start the server: `npm start`

## Security Considerations

-   Access tokens expire in 240 hours (configurable in .env)
-   Refresh tokens expire in 30 days (configurable in .env)
-   Refresh tokens are invalidated on logout
-   Sensitive data is stored in environment variables
-   Passwords are hashed using MD5 (consider upgrading to bcrypt)
