# [DestinaGuide](https://destinaguide.web.app/)

Visit live application at [DestinaGuide](https://destinaguide.web.app/).

DestinaGuide is a web application designed to help users explore and manage tourist spots around the world. It provides features for viewing, adding, updating, and deleting tourist spots, as well as user authentication and personalized lists.

## Features

- **User Authentication**: Secure login and registration using email/password or Google authentication.
- **Tourist Spot Management**: Add, update, view, and delete tourist spots.
- **Personalized Lists**: Users can manage their own list of tourist spots.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **Dark Mode**: Toggle between light and dark themes.
- **Interactive UI**: Built with React, TailwindCSS, and DaisyUI for a modern and responsive interface.

## Technologies Used

### Frontend

- **React**: For building the user interface.
- **Vite**: For fast development and build processes.
- **React Router**: For client-side routing.
- **TailwindCSS**: For styling.
- **DaisyUI**: For pre-designed UI components.
- **Axios**: For making API requests.
- **Firebase**: For authentication.

### Backend

- **Node.js**: For server-side logic.
- **Express**: For building the REST API.
- **MongoDB**: For database management.
- **Node-Cron**: For scheduling tasks.

## Installation

### Prerequisites

- Node.js and npm installed on your machine.
- MongoDB database connection string.
- Firebase project setup for authentication.

### Steps

1. Clone the repository:

   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```bash
   cd DestinaGuide
   ```

3. Install dependencies for both client and server:

   ```bash
   cd DestinaGuide-client
   npm install
   cd ../DestinaGuide-server
   npm install
   ```

4. Set up environment variables:

   - For the client, create a `.env` file in `DestinaGuide-client` and add the required Firebase and API URL variables.
   - For the server, create a `.env` file in `DestinaGuide-server` and add the MongoDB connection string and other necessary variables.

5. Start the development servers:

   - Client:
     ```bash
     cd DestinaGuide-client
     npm run dev
     ```
   - Server:
     ```bash
     cd DestinaGuide-server
     npm run dev
     ```

6. Open the client in your browser at `http://localhost:5173` (default Vite port).
7. Open the server in your browser at `http://localhost:3000`.

## Deployment

- The client can be deployed using Firebase Hosting.
- The server can be deployed using Vercel or any Node.js hosting platform.
