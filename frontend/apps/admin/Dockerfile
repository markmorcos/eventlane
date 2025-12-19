FROM node:22-alpine AS deps
WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmrc ./

# Copy all workspace package.json files
COPY apps/admin/package.json ./apps/admin/
COPY apps/user/package.json ./apps/user/
COPY libs/shared/package.json ./libs/shared/

RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmrc ./

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy all source code
COPY apps ./apps
COPY libs ./libs
COPY angular.json tsconfig.json tailwind.config.ts ./

RUN corepack enable pnpm && pnpm run build:admin

FROM nginx:alpine
COPY --from=builder /app/dist/admin/browser /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
