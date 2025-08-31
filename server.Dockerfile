##### Multi-stage Dockerfile building client (React) and server (Express) into one image
##### Resulting container serves API and static build at port 3001

# Stage 1: build React client
FROM node:18 AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: production server with static assets
FROM node:18
WORKDIR /app/server
ENV NODE_ENV=production

# Install server production deps
COPY server/package*.json ./
RUN npm install --production

# Copy server source
COPY server/ .

# Copy built client assets into expected relative path ../client/build
COPY --from=client-build /app/client/build ../client/build

EXPOSE 3001
CMD ["node", "index.js"]
