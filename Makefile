# .PHONY: up declares that "start" is not a file name but a command/ target
.PHONY: start
.PHONY: stop

start:
	docker compose up -d --build

stop:
	docker compose down