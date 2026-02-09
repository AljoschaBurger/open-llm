SUBTASKS = start stop test
.PHONY: subtasks $(SUBTASKS)

start:
	docker compose up -d --build

stop:
	docker compose down

test:
	cd backend && go test ./... && cd ..