# HealthSync - Your AI Health Assistant

HealthSync is a React-based mobile health application designed to help users track and manage their health with personalized AI assistance. This README provides instructions for setting up and running the application from GitHub.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Project Setup](#project-setup)
4. [Running the Application](#running-the-application)
5. [Authentication](#authentication)
6. [Application Features](#application-features)
7. [Project Structure](#project-structure)
8. [Troubleshooting](#troubleshooting)
9. [Contributing](#contributing)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (v14.x or higher)
- [npm](https://www.npmjs.com/) (v6.x or higher) or [Yarn](https://yarnpkg.com/) (v1.22.x or higher)
- [Git](https://git-scm.com/)
- A code editor (e.g., [Visual Studio Code](https://code.visualstudio.com/))

## Getting Started

Follow these steps to clone the repository and set up the project:

1. Open your terminal or command prompt
2. Clone the repository:
   ```bash
   git clone https://github.com/AJKAng-APU/V_Hack.git
   ```
3. Navigate to the project directory:
   ```bash
   cd V_Hack
   ```

## Project Setup

Install the required dependencies:

```bash
npm install
```

Or if you're using Yarn:

```bash
yarn install
```

This will install all the necessary dependencies, including:
- React and React DOM
- Tailwind CSS
- Lucide React icons
- Other required packages

## Running the Application

After installing the dependencies, you can run the application in development mode:

```bash
npm start
```

Or with Yarn:

```bash
yarn start
```

This will start the development server and open the application in your default browser. If it doesn't open automatically, you can access it at [http://localhost:3000](http://localhost:3000).

## Authentication

The application includes a demo authentication system for testing purposes:

- **Demo Login**:
  - Email: `demo@healthsync.com`
  - Password: `demo`

Alternatively, any email with a password longer than 3 characters will work for demonstration purposes.

## Application Features

HealthSync offers several key features accessible from the main dashboard:

1. **Dashboard** - Overview of health metrics, upcoming events, and quick actions
2. **Medications** - Track and manage prescriptions with reminders
3. **Symptoms** - Record and monitor health symptoms
4. **Connect** - Communicate with healthcare providers
5. **Education** - Access personalized health information
6. **Profile** - Manage user settings and preferences

### Navigation

The application includes a bottom navigation bar for easy access to main sections:
- Dashboard (Home)
- Medications
- Symptoms
- Connect
- Profile

## Project Structure

The project follows a component-based architecture:

```
healthsync/
├── public/
│   ├── logo.jpg
│   └── index.html
├── src/
│   ├── components/
│   │   ├── HealthAssistantUI/
│   │   │   ├── index.jsx          # Main component
│   │   │   ├── NavButton.jsx
│   │   │   ├── SplashScreen.jsx
│   │   │   ├── colors.js          # Theme colors
│   │   │   └── screens/           # Application screens
│   │   │       ├── DashboardScreen.jsx
│   │   │       ├── MedicationsScreen.jsx
│   │   │       ├── SymptomsScreen.jsx
│   │   │       ├── ConnectScreen.jsx
│   │   │       ├── EducationScreen.jsx
│   │   │       ├── EmergencyScreen.jsx
│   │   │       ├── ProfileScreen.jsx
│   │   │       ├── SignInScreen.jsx
│   │   │       └── RegisterScreen.jsx
│   │   └── shared/                # Shared components
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css                  # Tailwind CSS
└── package.json
```

## Troubleshooting

If you encounter issues running the application:

1. **Missing dependencies**:
   ```bash
   npm install
   ```

2. **Port conflicts**: If port 3000 is in use, the CLI will prompt you to use a different port. Press `Y` to accept.

3. **Authentication issues**: Make sure to use the demo credentials mentioned above or any email with a password longer than 3 characters.

4. **"Module not found" errors**: Ensure all dependencies are properly installed. You might need to run:
   ```bash
   npm install lucide-react
   ```

## Contributing

To contribute to the project:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Commit your changes: `git commit -m "Add your feature"`
5. Push to the branch: `git push origin feature/your-feature-name`
6. Open a Pull Request

---

Thank you for using HealthSync! If you have any questions or need further assistance, please open an issue on the GitHub repository.
