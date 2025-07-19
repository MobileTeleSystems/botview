FROM mcr.microsoft.com/playwright:v1.54.1-noble AS development

WORKDIR /app
COPY package*.json tsconfig*.json nest-cli.json ./
RUN npm ci

COPY ./src ./src
COPY ./test ./test

RUN npm run test
RUN npm run test:e2e
RUN npm run build


FROM mcr.microsoft.com/playwright:v1.54.1-noble as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=development /app/dist ./dist

CMD ["node", "dist/main"]