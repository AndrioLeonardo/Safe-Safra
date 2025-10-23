# Usa uma imagem oficial do Nginx baseada no Alpine Linux (leve) como ponto de partida
FROM nginx:alpine

# Define o diretório de trabalho padrão dentro do contêiner
# Nginx por padrão serve arquivos desta pasta
WORKDIR /usr/share/nginx/html

# Copia todos os arquivos do seu projeto (., o diretório atual) 
# para o diretório de trabalho dentro do contêiner (.)docker
COPY . .

# Expõe a porta 80 (padrão do Nginx) para fora do contêiner
EXPOSE 80

# Comando padrão para iniciar o Nginx quando o contêiner for executado
# O '-g "daemon off;"' garante que o Nginx rode em primeiro plano, o que é necessário para o Docker
CMD ["nginx", "-g", "daemon off;"]