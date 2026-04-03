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
1. store the instruction into the llm call
2. In Syntaxhighlighter compontent a possiblity to copy code etc.
3. Show the Token / Seconds duration
4. Shows the Time needed to generate the anwser