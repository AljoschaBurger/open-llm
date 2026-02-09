SUBTASKS = start stop test mysql backend ping restart

.PHONY: subtasks $(SUBTASKS)

start:
	docker compose up -d --build

stop:
	docker compose down

go-test:
	cd backend && go test ./... && cd ..

mysql:
	docker exec -it open-llm-mysql-1 mysql -u root -proot123 llm-db;

backend:
	docker exec -it open-llm-backend-1 /bin/sh

ping:
	curl http://localhost:8080/ping

restart:
	make stop && make start