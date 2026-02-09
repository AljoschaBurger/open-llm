SUBTASKS = start stop test mysql

.PHONY: subtasks $(SUBTASKS)

start:
	docker compose up -d --build

stop:
	docker compose down

go-test:
	cd backend && go test ./... && cd ..

mysql:
	docker exec -it open-llm-mysql-1 mysql -u root -proot123 llm-db;