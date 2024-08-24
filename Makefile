all: up

up:
	docker-compose up --build

down:
	docker-compose down

start:
	docker-compose start

stop:
	docker-compose stop

prune: down
	docker system prune --all --volumes --force

re: clear up

.PHONY: all up down start stop prune re