FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Informe ao Koyeb que a porta 8000 será usada
EXPOSE 8000
CMD ["node", "index.js"]
