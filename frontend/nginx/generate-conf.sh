#!/bin/sh
set -e

BASE_PATH="${BASE_PATH:-/}"
BASE_NO_SLASH="${BASE_PATH%/}"

REWRITE_BLOCK=""
if [ "$BASE_NO_SLASH" != "" ]; then
    REWRITE_BLOCK="
    rewrite ^${BASE_NO_SLASH}([^/].*)\$ ${BASE_PATH}\$1 last;
    rewrite ^${BASE_NO_SLASH}\$ ${BASE_PATH} last;"
fi

cat > /etc/nginx/conf.d/default.conf <<EOF
server {
    listen 80;
    absolute_redirect off;
${REWRITE_BLOCK}

    location ${BASE_PATH}api/ {
        proxy_pass http://backend:8000/api/;

        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-User-Id         \$http_x_user_id;

        proxy_http_version 1.1;
        proxy_set_header Connection "";

        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    location ${BASE_PATH} {
        alias /usr/share/nginx/html/;
        try_files \$uri \$uri/ ${BASE_PATH}index.html;
    }
}
EOF

echo "Generated /etc/nginx/conf.d/default.conf with BASE_PATH=${BASE_PATH}"

exec nginx -g 'daemon off;'
