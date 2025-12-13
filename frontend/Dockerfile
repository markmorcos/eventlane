FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY angular.json tsconfig*.json ./
COPY src ./src

RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/dist/web ./dist/web
COPY package.json ./

EXPOSE 4000

CMD ["node", "dist/web/server/server.mjs"]
