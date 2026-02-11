# Stage 1: Install dependencies
FROM node:20

WORKDIR /app

# Kopiere package.json und package-lock.json und installiere dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Kopiere Quellcode
COPY . .

# Ports exposed für CRA Dev Server
EXPOSE 3000

# Start Command für CRA Dev Server
CMD ["npm", "start"]
