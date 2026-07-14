FROM node:22.12.0-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:22.12.0-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_API_BASE_URL
ARG VITE_POLICIES_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_POLICIES_API_BASE_URL=$VITE_POLICIES_API_BASE_URL

RUN npm run build
RUN npm prune --omit=dev

FROM node:22.12.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["npm", "run", "start"]
