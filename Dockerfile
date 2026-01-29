FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# O comando abaixo garante que o arquivo de banco de dados tenha permissão de escrita
RUN chmod 777 database.json
EXPOSE 8000
CMD ["npm", "start"]
