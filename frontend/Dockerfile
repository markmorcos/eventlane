FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --prefer-offline --no-audit

FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist/web ./dist/web
COPY --from=builder /app/package.json ./

EXPOSE 4000

CMD ["node", "dist/web/server/server.mjs"]