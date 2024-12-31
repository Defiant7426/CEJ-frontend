# Usa una imagen de Node para compilar
FROM node:16-alpine as build

# Crea un directorio para la app
WORKDIR /app

# Copia los package*.json e instala dependencias
COPY package*.json ./
RUN npm install

# Copia todo el código y construye la app
COPY . .
RUN npm run build

# Segunda etapa: un contenedor más ligero para servir los archivos
FROM node:16-alpine as production

WORKDIR /app

# Instala "serve" para servir la carpeta build
RUN npm install -g serve

# Copia la carpeta de build generada en la etapa anterior
COPY --from=build /app/build ./build

# Expone el puerto 3000 (o el que prefieras)
EXPOSE 3000

# Comando de arranque
CMD ["serve", "-s", "build", "-l", "3000"]
