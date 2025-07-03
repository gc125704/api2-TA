FROM node:18-slim

# Etapa 2: Definir diret�rio de trabalho
WORKDIR /app

# Etapa 3: Copiar os arquivos de depend�ncia
COPY package*.json ./

# Etapa 4: Instalar depend�ncias
RUN npm install --production

# Etapa 5: Copiar restante da aplica��o
COPY . .

# Etapa 6: Definir vari�veis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Etapa 7: Expor a porta
EXPOSE 3000

# Etapa 8: Comando de inicializa��o
CMD ["node", "./bin/www"]
