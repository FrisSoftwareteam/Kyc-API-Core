FROM node:20-slim

# Create app directory
RUN mkdir -p /usr/src/core-service

WORKDIR /usr/src/core-service

# Install app dependencies
COPY package.json /usr/src/core-service/

RUN yarn install

# Bundle app source
COPY . /usr/src/core-service

RUN npm run build

EXPOSE 2001

CMD ["node", "build/bin/app.js"]
