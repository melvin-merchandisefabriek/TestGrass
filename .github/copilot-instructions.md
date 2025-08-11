# TestGrass Application

TestGrass is a React frontend + Express.js backend application that creates an interactive grass/nature visualization using SVG animations. The application is containerized with Docker and features real-time animation of grass blades with physics-based movements.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap, Build, and Test the Repository

**Development Environment Setup (Recommended):**
```bash
# Install dependencies for both client and server
cd /home/runner/work/TestGrass/TestGrass/server
npm install  # Takes ~1 second

cd /home/runner/work/TestGrass/TestGrass/client  
npm install  # Takes ~3 seconds

# Start development servers (run in separate terminals)
cd /home/runner/work/TestGrass/TestGrass/server
npm start  # Starts Express server on port 3001

cd /home/runner/work/TestGrass/TestGrass/client
npm start  # Starts React dev server on port 3000 with hot reload
```

**Docker Development Environment:**
```bash
# Build Docker containers - NEVER CANCEL: Takes 2-3 minutes. Set timeout to 5+ minutes.
docker compose build

# Start both services - NEVER CANCEL: Takes 1-2 minutes to fully start. Set timeout to 5+ minutes.
docker compose up

# Alternative: Use root scripts (NOTE: Uses old docker-compose syntax that may not work)
npm run start  # Equivalent to docker compose up
npm run build  # Equivalent to docker compose build - FAILS due to docker-compose vs docker compose
```

**Build Commands:**
```bash
# Client production build - NEVER CANCEL: Takes 5-8 seconds. Set timeout to 2+ minutes.
cd client
CI=false npm run build  # CI=false prevents ESLint errors from failing build

# Test production build locally
npm install -g serve
serve -s build
```

**Testing:**
```bash
# Client tests - NEVER CANCEL: Takes <1 second. Set timeout to 2+ minutes.
cd client
npm test -- --watchAll=false --passWithNoTests  # No tests currently defined

# Server tests
cd server  
npm test  # Currently returns placeholder error - no real tests defined
```

## Validation

### Manual Testing Scenarios
**CRITICAL: Always manually validate any changes by running these complete scenarios:**

1. **API Connectivity Test:**
   ```bash
   curl http://localhost:3001/api/hello
   # Expected: {"message":"Hello World from the server!"}
   ```

2. **Frontend Rendering Test:**
   ```bash
   curl http://localhost:3000 | head -10
   # Expected: HTML with TestGrass App title and React bundle
   ```

3. **Visual Animation Test:**
   - Navigate to http://localhost:3000 in browser
   - Verify animated grass blades appear on dark background
   - Verify colored corner squares (red, green, blue, yellow) are visible
   - Check browser console for JavaScript errors

**Build Validation:**
- Always run `cd client && CI=false npm run build` after making changes
- Build warnings are acceptable, but build failures must be fixed
- Production build should complete in 5-8 seconds

## Common Tasks

### Development Workflow
```bash
# Quick development start (non-Docker)
cd server && npm start &  # Background server
cd client && npm start   # Foreground client with hot reload

# Docker development start  
docker compose up  # Both services with hot reload via volumes

# Stop all services
docker compose down
# OR manually kill background processes
```

### Deployment
```bash
# Production deployment (requires PM2 and nginx)
./deploy.sh  # Pulls latest code, builds frontend, restarts PM2, reloads nginx
```

### Troubleshooting Docker Issues
```bash
# If Docker containers fail to start:
docker compose down
docker system prune -f
docker compose build --no-cache
docker compose up
```

### Code Quality
- **Linting**: ESLint warnings are present but acceptable in development
- **No formal linting command** - warnings appear during build/start
- **No formatting tool configured** - manual code formatting required

## Repository Structure

```
TestGrass/
├── client/                    # React frontend (port 3000)
│   ├── public/
│   │   └── data/             # SVG shape definitions (*.json files)
│   ├── src/
│   │   ├── components/       # React components (UnifiedSceneSVG, Shape, etc.)
│   │   └── utils/           # Animation and DOM utilities
│   ├── Dockerfile           # Client container definition
│   └── package.json         # React app dependencies
├── server/                   # Express.js backend (port 3001) 
│   ├── index.js             # Main server file with /api/hello endpoint
│   ├── Dockerfile           # Server container definition
│   └── package.json         # Server dependencies
├── legacy/                   # Previous version for reference
├── docker-compose.yml        # Multi-container orchestration
├── deploy.sh                 # Production deployment script
└── package.json             # Root scripts (Docker shortcuts)
```

## Key Technologies

- **Frontend**: React 18.2.0, react-scripts 5.0.1, axios 1.4.0
- **Backend**: Express.js 4.18.2, cors 2.8.5, nodemon 2.0.22 (dev)
- **Container**: Docker with Node.js 18 base images
- **Animation**: Custom SVG animation system with JSON shape definitions

## Data Files and Assets

**Shape Definitions** (`client/public/data/`):
- `triangleShape.json` - Primary grass blade shape
- `circleTemplate.json` - Circular elements  
- `groundShape.json` - Ground/terrain definition
- `menuButton*.json` - UI button definitions
- `simplePlayer.json` - Player character shape
- `sinShape.json` - Sine wave patterns
- `wind.json` - Wind effect parameters

## Port Configuration

- **React Frontend**: http://localhost:3000
- **Express API**: http://localhost:3001
- **API Endpoints**: 
  - `GET /api/hello` - Test endpoint returning JSON message

## Known Issues and Workarounds

1. **ESLint Warnings**: Multiple unused variable warnings exist but don't prevent functionality
2. **Docker Compose Syntax**: Root `package.json` scripts use old `docker-compose` syntax - use `docker compose` directly
3. **No Tests**: Test infrastructure exists but no actual tests are implemented
4. **Version Warning**: docker-compose.yml version attribute is obsolete but harmless

## Timing Expectations

| Operation | Expected Time | Timeout Setting |
|-----------|---------------|-----------------|
| Server npm install | ~1 second | 2+ minutes |
| Client npm install | ~3 seconds | 2+ minutes |
| Client production build | 5-8 seconds | 2+ minutes |
| Docker compose build | 2-3 minutes | 5+ minutes |
| Docker compose up | 1-2 minutes | 5+ minutes |
| Development server startup | 5-15 seconds | 2+ minutes |

**NEVER CANCEL long-running operations. Wait for completion even if they appear to hang.**

## Environment Notes

- Developed and tested on Ubuntu/Linux environment
- Requires Node.js 18+ and Docker
- No external database dependencies
- All data stored in JSON files and memory
- Hot reloading enabled in development mode via Docker volumes