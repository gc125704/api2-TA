FROM node:18-slim

# Etapa 2: Definir diretório de trabalho
WORKDIR /app

# Etapa 3: Copiar os arquivos de dependência
COPY package*.json ./

# Etapa 4: Instalar dependências
RUN npm install --production

# Etapa 5: Copiar restante da aplicação
COPY . .

# Etapa 6: Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Etapa 7: Expor a porta
EXPOSE 3000

# Etapa 8: Comando de inicialização
CMD ["node", "./bin/www"]
