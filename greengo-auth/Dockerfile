FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# trỏ API về BE trong docker (map ra localhost ở máy)
ENV VITE_API=http://localhost:8080
EXPOSE 5173
CMD ["npm","run","dev","--","--host","0.0.0.0"]
