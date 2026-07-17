FROM node:22-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++

# Copy root workspace files
COPY package.json yarn.lock ./
COPY apps/api/package.json ./apps/api/

# Install all workspace dependencies
RUN yarn install

# Copy prisma and generate client
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/prisma.config.ts ./apps/api/

WORKDIR /usr/src/app/apps/api

RUN yarn prisma generate

# Copy API source
COPY apps/api/ ./

EXPOSE 3333

CMD ["yarn", "dev"]
