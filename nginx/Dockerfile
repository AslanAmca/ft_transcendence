FROM nginx

COPY nginx.conf /etc/nginx/nginx.conf

RUN openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
	-keyout /etc/ssl/private/localhost.key \
	-out /etc/ssl/certs/localhost.crt \
	-subj '/C=TR/ST=KOCAELI/L=GEBZE/O=42Kocaeli/CN=localhost'

CMD ["nginx", "-g", "daemon off;"]