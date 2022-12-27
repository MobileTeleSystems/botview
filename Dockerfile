FROM node:16-alpine3.11 AS development

RUN env

WORKDIR /app
COPY package*.json tsconfig*.json nest-cli.json .npmrc ./
RUN npm install --only=development
COPY ./src ./src
RUN npm run build


FROM node:16-alpine3.11 as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Installs latest Chromium package.
RUN apk add --no-cache chromium

WORKDIR /app
COPY package*.json .npmrc ./
RUN npm install --only=production

COPY --from=development /app/dist ./dist

# user not working, check later
# Add user so we don't need --no-sandbox.
#RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
#    && mkdir -p /home/pptruser/Downloads /app \
#    && chown -R pptruser:pptruser /home/pptruser \
#    && chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.
#USER pptruser

CMD ["node", "dist/main"]