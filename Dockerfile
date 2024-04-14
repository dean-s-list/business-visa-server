# Use an official Node.js image as the base image
FROM node:18 as builder

# Install necessary packages
RUN corepack enable && corepack prepare pnpm@8 --activate

# Set the working directory
WORKDIR /workspace

# Copy the entire repo (you may want to specify only the necessary folders)
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build server app
RUN pnpm build

# Create a smaller image for production
FROM node:18-alpine as final

# Set the working directory
WORKDIR /server

# Install necessary packages
RUN apk add --update --no-cache python3
RUN corepack enable && corepack prepare pnpm@8 --activate

# Copy only necessary files from the builder stage
COPY --from=builder /workspace/dist /server
COPY --from=builder /workspace/package.json /server
COPY --from=builder /workspace/pnpm-lock.yaml /server

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Expose the port your app runs on
EXPOSE 8000

# Start your app
ENTRYPOINT ["node", "index.js"]
