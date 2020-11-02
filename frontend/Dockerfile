FROM node:lts

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
VOLUME /app/node_modules
COPY . .

ARG VERSION
RUN echo $VERSION && yarn build

CMD cd /app && yarn && yarn start
