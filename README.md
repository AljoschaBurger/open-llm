# open-llm
A free to use and containerized generative AI web application to use ollama llama3.1:8b with a UI on your local machine.

# Requirements
- Docker
- Make

# How to use

## Start the application
```bash
- make start
```

## Stop the application 
```bash
- make stop
```

## Run tests
```bash
- make test
```
## Use the mysql database through the terminal
```bash
- make mysql
```

## Use the backend through terminal
```bash
- make backend
```

## Test the backend connection
```bash
- make ping
```

### Todos
1. Add a handler to add an instruction file which has to be safed in the backend
2. Add handler to change the current chat which changes the frontend trough a db call (chat history)
3. Frontend
4. Edit the handlePrompt_test.go that it is able to test db queries


Test curl:

curl -X POST http://localhost:8080/ask      -H "Content-Type: application/json"      -d '{"prompt": "Schreibe ein Gedicht über Golang"}'