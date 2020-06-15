FROM node:lts

RUN mkdir -p /app
COPY ./ /app/
WORKDIR /app
RUN yarn install --frozen-lockfile


RUN ls -l /app
VOLUME /app/node_modules
VOLUME /app/.cache
VOLUME /app/.parcel-cache

RUN yarn run parcel --version
RUN yarn build  --no-source-maps

CMD cd /app && yarn run parcel --version && yarn start
