const mysql = require("mysql2/promise");

const banco = mysql.createPool({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "crud_simples",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

module.exports = banco;