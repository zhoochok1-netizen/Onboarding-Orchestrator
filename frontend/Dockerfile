FROM node:20-alpine AS build

ARG BASE_PATH=/
ENV PUBLIC_URL=${BASE_PATH}

WORKDIR /app

RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/Europe/Moscow /etc/localtime \
    && echo "Europe/Moscow" > /etc/timezone

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/generate-conf.sh /docker-entrypoint.d/generate-conf.sh
RUN chmod +x /docker-entrypoint.d/generate-conf.sh
EXPOSE 80
CMD ["/bin/sh", "/docker-entrypoint.d/generate-conf.sh"]
