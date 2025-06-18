# TestGrass Application

This is a new TestGrass application with a Docker setup that includes:
- Express.js backend server
- React frontend application

## Getting Started

### Prerequisites
- Docker and Docker Compose installed on your system

### Running the Application

1. Clone this repository
2. Run the application with Docker Compose:
   ```bash
   docker-compose up
   ```
3. Access the application at:
   - React frontend: http://localhost:3000
   - Express API: http://localhost:3001/api/hello

## Project Structure

```
TestGrass/
├── client/                # React frontend application
│   ├── public/            # Static assets
│   ├── src/               # React source code
│   └── Dockerfile         # Client container setup
├── server/                # Express.js backend server
│   ├── index.js           # Server entry point
│   └── Dockerfile         # Server container setup
├── legacy/                # Previous project files for reference
├── docker-compose.yml     # Docker compose configuration
└── package.json           # Root project configuration
```

## Development

- The application uses Docker volumes to enable hot-reloading during development
- Changes to the React or Express code will automatically reload the application
