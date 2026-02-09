package db

// creates table chat if not exists
// id int (pk)
// name varchar(255)
var CreateChat string = "create table if not exists chat (id int AUTO_INCREMENT primary key not null, name VARCHAR(255) not null);"
