FROM node:11
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
CMD yarn start
