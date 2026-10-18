FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/client/package.json packages/client/package.json
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production PORT=2567 DATA_DIR=/data
EXPOSE 2567
CMD ["npm","start"]
