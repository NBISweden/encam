FROM node:14.3
WORKDIR /front
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
CMD yarn start
