# This is a simple development Dockerfile
# use nodejs 20 alpine as base image
FROM node:20-alpine

# install pnpm globally
RUN npm install -g pnpm

# set working directory
WORKDIR /app

# create applogs directly for logging
RUN mkdir -p /app/applogs

# copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# install dependencies
RUN pnpm install --frozen-lockfile

# copy the rest of the application code
COPY . .

# expose the port the app runs on
EXPOSE 8000

# start the application
CMD ["pnpm","run", "start:dev"]

# healthcheck to ensure the app is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

