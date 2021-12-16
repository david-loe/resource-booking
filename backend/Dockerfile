FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# dev or start
CMD ["npm", "run", "dev"]