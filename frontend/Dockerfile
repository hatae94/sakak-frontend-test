# syntax=docker/dockerfile:1

# pnpm 워크스페이스 루트를 빌드 컨텍스트로 사용한다.
#   docker build -f frontend/Dockerfile -t candiy-dashboard .

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- 의존성 설치 ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/
COPY algorithm/package.json ./algorithm/
RUN pnpm install --frozen-lockfile --filter frontend...

# ---- 빌드 ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter frontend build

# ---- 실행 ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# standalone 산출물에는 실행에 필요한 최소 node_modules가 포함된다.
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./frontend/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "frontend/server.js"]
