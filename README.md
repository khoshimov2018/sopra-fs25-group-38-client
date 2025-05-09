# StudyBuddy

**Find your ideal study partner — based on courses, goals, and learning style.**

![image](https://github.com/user-attachments/assets/aa6850c6-6670-4dd8-9db2-ce59352a3419)

*Your smart companion for collaborative learning at university.*

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js-blue)](https://nextjs.org)
[![UI Library](https://img.shields.io/badge/UI-AntDesign-orange)](https://ant.design)

---

## Table of Contents

- [StudyBuddy](#studybuddy)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Technologies Used](#technologies-used)
  - [High-Level Components](#high-level-components)
    - [1. Matching System](#1-matching-system)
    - [2. Chat System](#2-chat-system)
    - [3. Profile Management](#3-profile-management)
    - [4. User Authentication](#4-user-authentication)
    - [5. API Service](#5-api-service)
  - [Launch \& Deployment](#launch--deployment)
    - [Prerequisites](#prerequisites)
    - [Local Development](#local-development)
    - [Testing](#testing)
    - [Building for Production](#building-for-production)
    - [Deployment](#deployment)
    - [Working with the Backend](#working-with-the-backend)
  - [Illustrations](#illustrations)
  - [Roadmap](#roadmap)
  - [Authors and Acknowledgment](#authors-and-acknowledgment)
  - [License](#license)

---

## Introduction

**StudyBuddy** is a web application designed to connect university students with compatible study partners based on shared courses, availability, and study goals. The platform features a swipe-based matching system, real-time chat, profile management, and AI-based study assistance.  
This frontend project provides the user interface and client-side logic, built with Next.js and Ant Design, allowing users to interact seamlessly with the backend services.

---

## Technologies Used

- **Frontend Framework**: [Next.js 14](https://nextjs.org/) (React framework with server-side rendering)
- **UI Library**: [Ant Design](https://ant.design/) for React components and styling
- **State Management**: React hooks for local state management
- **API Integration**: Custom HTTP client with Axios for backend communication
- **Real-time Features**: Polling for chat and notifications
- **AI Integration**: Google's Gemini API for AI study assistance
- **Styling**: CSS Modules and Ant Design theming
- **Deployment**: Vercel for hosting and CI/CD

---

## High-Level Components

### 1. [Matching System](/app/main/page.tsx)
The core of our application is the matching system, implemented in the main page. It presents users with potential study partners based on shared courses and preferences, offering a swipe-based interface to "like" or "skip" profiles. When two users mutually like each other, a match is created, enabling chat communication.

### 2. [Chat System](/app/chat/page.tsx)
The chat system enables real-time communication between matched users, supporting both individual and group chats. It includes typing indicators, message history, and an integrated AI advisor that assists students with study-related questions using Google's Gemini API.

### 3. [Profile Management](/app/profile/page.tsx)
The profile component allows users to create and edit their profiles, including personal information, profile pictures, courses they're taking, and their knowledge levels. This information is central to the matching algorithm and how users present themselves to potential study partners.

### 4. [User Authentication](/app/login/page.tsx)
The authentication system, implemented in login and registration pages, handles user registration, login, token management, and session persistence. It ensures secure access to the application and maintains user sessions.

### 5. [API Service](/app/api/apiService.ts)
The API service layer provides a unified interface for all backend communication, handling authentication, request formatting, and error handling. It's composed of specialized services for different entity types (users, courses, matches, etc.) that abstract the REST API endpoints.

---

## Launch & Deployment

### Prerequisites
- Node.js (version 18 or later)
- npm or yarn
- Git
- Access to the backend API (running locally or deployed)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/sopra-fs25/sopra-fs25-group-38-client.git
   cd sopra-fs25-group-38-client
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Configure environment variables**
   Create a `.env.local` file in the project root with the following variables:
   ```
   NEXT_PUBLIC_API_DOMAIN=http://localhost:8080 # Or your backend URL
   NEXT_PUBLIC_GOOGLE_API_KEY=your_gemini_api_key # For AI advisor functionality
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The application will be available at http://localhost:3000

### Testing

Run the tests with:
```bash
npm run test
# or
yarn test
```

### Building for Production

1. **Build the application**
   ```bash
   npm run build
   # or
   yarn build
   ```

2. **Start the production server**
   ```bash
   npm run start
   # or
   yarn start
   ```

### Deployment

The application is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure the environment variables in the Vercel dashboard
3. Deploy the application

For manual deployment:
```bash
npm run build
npm run export
```
This generates a static export in the `out` directory that can be deployed to any static hosting service.

### Working with the Backend

The frontend expects a specific API structure. Ensure the backend is running and accessible at the URL specified in your environment variables. If you're running the backend locally, follow the instructions in the [backend repository](https://github.com/sopra-fs25/sopra-fs25-group-38-server) to set it up.

---

## Illustrations

Here are some screenshots showcasing the key features of StudyBuddy:

### Main Interface - Match Finding
![Main Interface](/public/images/screenshot-main.png)

### Chat System
![Chat Interface](/public/images/screenshot-chat.png)

### AI Study Advisor
![AI Advisor](/public/images/screenshot-ai-advisor.png)

### User Profile
![Profile](/public/images/screenshot-profile.png)

### Registration
![Registration](/public/images/screenshot-registration.png)

---

## Roadmap

•⁠  ⁠[ ] Implement study challenges and leaderboard
•⁠  ⁠[ ] Refine matching algorithm with AI suggestions
•⁠  ⁠[ ] Enable calendar integration for availability sync

---

## Authors and Acknowledgment

**Team – Group 38:**

- Kai Koepchen – 24-738-189  
- Daria Kazmina – 22-898-118  
- Khoshimov Rakhmatillokhon – 23-060-361  
- Ajeong Shin – 24-742-405  
- Zhidian Huang – 24-745-655  
- Yanyang Luo – 24-742-165

Special thanks to:  
- SoPra Teaching Team  
- Course mates for feedback and user testing

---

## License

This project is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).  
© 2020 University of Zurich
