package db

// creates table prompt if not exists
// id int (pk)
// instruction_file varchar(255)
// chat_id int
// prompt TEXT
var CreatePrompt string = "create table if not exists prompt (id int AUTO_INCREMENT PRIMARY KEY not null, instruction_file varchar(255), chat_id int not null, prompt TEXT not null, Foreign Key (chat_id) REFERENCES chat(id));"
