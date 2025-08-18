FROM node:alpine3.22 AS base   
# código acima define a imagem do node e a versão e define um estágio "base" para construção 
# Este é o ambiente de desenvolvimento "base". 
# Aqui instalamos todas as dependências (incluindo as de desenvolvimento) e 
# compilamos seu código TypeScript para JavaScript.
WORKDIR /app 
# Define o diretório de trabalho dentro do contêiner
COPY package*.json /app/
# Copia os arquivos de dependências para o diretório de trabalho
RUN npm ci 
# Instala as dependências de produção e desenvolvimento
RUN npm run build
# Compila o código TypeScript para JavaScript 
RUN npm install --save-dev prettier 
# Instala o Prettier como dependência de desenvolvimento
COPY . /app/
# Copia todo o conteúdo do diretório atual para o diretório de trabalho no contêiner
# Fim do estágio de desenvolvimento "base" ----------------------------------

# Estágio 2: Produção
FROM node:alpine3.22 

WORKDIR /app
# copiamos a pasta 'node_modules' que foi instalada no
# estágio "builder". Se você rodar 'npm ci --omit=dev', apenas as dependências
# de produção serão instaladas, o que é o ideal.
# Copia apenas as dependências de produção do estágio anterior
COPY --from=base /app/node_modules ./node_modules
# Copia o código compilado do estágio anterior
COPY --from=base /app/dist ./dist

# Expõe a porta que a aplicação vai usar (ajuste se for diferente)
EXPOSE 3000

# Comando para iniciar a aplicação
CMD [ "node", "dist/services/evolutionApi.js" ]