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

### Todos
1. Add a handler to add an instruction file which has to be safed in the backend
2. Add handler to change the current chat which changes the frontend trough a db call (chat history)
