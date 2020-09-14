FROM node:lts

RUN mkdir -p /app
COPY ./ /app/
WORKDIR /app
RUN yarn install --frozen-lockfile

VOLUME /app/node_modules

ARG VERSION
RUN echo $VERSION && yarn build

CMD cd /app && yarn && yarn start
