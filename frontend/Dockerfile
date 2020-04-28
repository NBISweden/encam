FROM node:11
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
VOLUME /app/node_modules
VOLUME /app/.cache
VOLUME /app/.parcel-cache
RUN yarn run parcel --version
CMD yarn start
