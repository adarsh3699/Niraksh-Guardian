# Niraksh 2.0 - Smart Healthcare Platform

<div align="center">
  <img src="frontend/src/assets/brandLogo.png" alt="Niraksh Logo" width="150">
  <br>
  <h3>AI-powered healthcare guidance for better health decisions</h3>
</div>

## Overview

Niraksh 2.0 is a comprehensive healthcare platform designed to help users navigate health concerns through AI-powered analysis and doctor recommendations. The platform combines intuitive user interfaces with advanced natural language processing to understand symptoms and provide relevant healthcare guidance.

### Key Features

-   **AI Symptom Analysis**: Analyze user symptoms using advanced LLM models to identify potential health conditions
-   **Doctor Recommendation Engine**: Match symptoms with the right medical specialists using both keyword matching and semantic analysis
-   **Interactive Health Assistant**: Converse naturally about health concerns and receive intelligent guidance
-   **Homepage Symptom Search**: Quick entry point for users to start their healthcare journey with a simple search
-   **Responsive Design**: Optimized user experience across all devices

## Technology Stack

### Frontend

-   **Framework**: React with hooks and memo for optimized performance
-   **Routing**: React Router for seamless navigation
-   **UI Components**: Custom components with modern styling
-   **Styling**: CSS with responsive design patterns
-   **Type Checking**: PropTypes for component validation

### Backend

-   **Server**: Node.js with Express
-   **APIs**: RESTful endpoints for AI analysis and data processing
-   **AI Integration**: Google Gemini 2.0 API for advanced symptom analysis
-   **Database**: MongoDB for storing doctor and medical data
-   **Authentication**: JWT-based user authentication

## Project Structure

```
niraksh_2.0/
├── frontend/               # React application
│   ├── src/                # Source code
│   │   ├── assets/         # Images, icons, and static assets
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── styles/         # CSS files
│   │   ├── utils/          # Utility functions
│   │   └── App.jsx         # Main application component
│   ├── jsonData/           # Doctor and symptom data
│   └── public/             # Public assets
│
├── backend/                # Node.js server
│   ├── controllers/        # API route controllers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── utils/              # Helper functions
│   └── index.js            # Server entry point
│
└── README.md               # This documentation
```

## Getting Started

### Prerequisites

-   Node.js (v16+)
-   npm or yarn
-   MongoDB (local or Atlas)
-   Google Gemini API key (for AI features)

### Installation

1. Clone the repository

    ```bash
    git clone https://github.com/yourusername/niraksh_2.0.git
    cd niraksh_2.0
    ```

2. Install frontend dependencies

    ```bash
    cd frontend
    npm install
    ```

3. Install backend dependencies

    ```bash
    cd ../backend
    npm install
    ```

4. Configure environment variables

    - Create a `.env` file in the backend directory based on `.env.example`
    - Add your Google Gemini API key and MongoDB connection string

5. Start the development servers

    Backend:

    ```bash
    cd backend
    npm start
    ```

    Frontend:

    ```bash
    cd frontend
    npm run dev
    ```

6. Access the application at `http://localhost:5173`

## Key Features Explained

### Doctor Suggestion System

The platform uses a sophisticated system to match patients with appropriate healthcare providers:

1. **Symptom Analysis**: User symptoms are analyzed using two approaches:

    - Semantic analysis using Gemini 2.0 models for nuanced understanding
    - Keyword matching as a reliable fallback

2. **Doctor Ranking**: Doctors are prioritized based on:

    - Specialty relevance to symptoms
    - Years of experience
    - Consultation fees

3. **Interactive UI**: Clear presentation of recommendations with:
    - Visual indicators for top recommendations
    - Reasoning explanations for transparency
    - Filtering options for user preference

### Responsive Design

The interface adapts seamlessly to different screen sizes, ensuring a consistent experience across:

-   Desktop computers
-   Tablets
-   Mobile devices

## Contributing

We welcome contributions to Niraksh 2.0! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

-   Medical data sourced from verified healthcare databases
-   UI inspiration from leading healthcare platforms
-   Special thanks to all contributors who have helped shape this project

---

<div align="center">
  <p>Made with ❤️ for better healthcare access</p>
</div>
