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
1. Performance issue because of often rerendering through useStates and writing in localforage in chat.tsx -> useage if useMemo() important and to exclude the history into a seperate component  