FROM node:18 AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build \
  && cp public/service-worker.js build/service-worker.js

FROM node:18 AS production
WORKDIR /usr/src/app
RUN npm install -g serve
COPY --from=build /usr/src/app/build ./build
COPY localhost+2.pem /usr/src/app/cert.pem
COPY localhost+2-key.pem /usr/src/app/key.pem
EXPOSE 443
CMD ["serve", "-s", "build", "-l", "443", "--ssl-cert", "cert.pem", "--ssl-key", "key.pem"]
