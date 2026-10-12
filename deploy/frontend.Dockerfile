FROM node:24.8.0-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY angular.json tsconfig*.json .postcssrc.json ./
COPY src ./src
COPY contracts ./contracts
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist/oraculo/browser /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
