# ft_transcendence

This repository contains the source code and documentation for the **ft_transcendence** project at Ecole 42. The goal of this project is to build a fully functional web application using Django for the backend, Vanilla JavaScript for the frontend, PostgreSQL for the database, and Nginx as the server. The project includes user authentication with OAuth2.0 and cookie-based authentication, features a complete membership system, and incorporates Server-Side Rendering (SSR). Additionally, the project uses Three.js for 3D game development, specifically a Pong game. It is containerized using Docker and can be set up with Docker Compose.

## About
The **ft_transcendence** project teaches students how to build a full-stack web application with a focus on secure authentication, 3D game development, and containerized deployment. It uses Django for backend logic and Vanilla JavaScript for the frontend. OAuth2.0 and cookie-based authentication ensure secure user sessions, while Three.js is used for creating an interactive 3D Pong game.

## Technologies
This project uses the following technologies:
- **Backend**: Django (Python web framework)
- **Frontend**: Vanilla JavaScript (with HTML/CSS for UI)
- **Database**: PostgreSQL
- **Server**: Nginx
- **Containerization**: Docker, Docker Compose
- **Authentication**: OAuth2.0 and Cookie-based authentication
- **3D Game**: Three.js (JavaScript library for 3D graphics)
- **Rendering**: Server-Side Rendering (SSR)

## Features
- **Complete Membership System**: A fully functional user registration and management system.
- **User Authentication**: OAuth2.0 for secure sign-in and cookie-based authentication for session management.
- **3D Pong Game**: The project includes an interactive 3D Pong game built using Three.js, where users can engage in gameplay.
- **Friendship System**: Users can add friends, block users, and manage friendships.
- **User Profiles**: Each user has a customizable profile page.
- **Responsive Design**: The application is fully responsive and works well on mobile devices.

## Usage
Once the application is running, you can:
- Register or log in using OAuth2.0.
- Play the 3D Pong game.
- Manage your profile and friendships.

## Setup
To set up the project locally using Docker, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/AslanAmca/ft_transcendence.git
   cd ft_transcendence
2. Make sure Docker and Docker Compose are installed on your system.
3. Create a .env file in the project root with the necessary environment variables for the Django backend and PostgreSQL database. An example .env file content is as follows:
	```bash
	# Django
	SECRET_KEY=django-insecure-=i!rw*37#o=!y70%hbaq!=9e+m3*(+jo=@$#ki!gws=3p5oikr

	# OAuth With Ecole
	OAUTH_CLIENT_ID=u-s4t2ud-602dc098a2c0f7801f677bbfb7b21398d8b9d28925bb3a4af2f15f0e120fa407
	OAUTH_CLIENT_SECRET=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
	OAUTH_REDIRECT_URI=https://localhost/oauth/callback/

	# PostgreSQL Environment Variables
	POSTGRES_DB=pong
	POSTGRES_USER=postgres
	POSTGRES_PASSWORD=pass123
	```
	Note: OAuth details should be obtained by creating a project in the intra.42.fr
4. Build and run the Docker containers using Docker Compose:
	```bash
	make
	# or
	docker-compose up --build
5. The application will be accessible at https://localhost with Nginx serving the frontend and backend.
