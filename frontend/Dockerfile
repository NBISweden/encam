FROM node:11
WORKDIR /frontend_source
COPY ./ /app/
WORKDIR /app/
RUN yarn install --frozen-lockfile
VOLUME /app/node_modules
VOLUME /app/.cache
VOLUME /app/.parcel-cache
RUN apt update && apt install -y inotify-tools rsync

RUN yarn run parcel --version
RUN env
RUN yarn build 

CMD bash -c 'while true; do inotifywait -q -e modify,attrib,create,delete -r /frontend_source; rsync -a /frontend_source/ /app/ && yarn install --frozen-lockfile && yarn run parcel --version && yarn build && rsync -a /app/dist/browser/ /frontend_updates/; done'
