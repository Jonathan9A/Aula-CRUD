const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs")
const banco = require("./database")

const app = express();
const PORT = 3000;

// Permite receber dados de formulários
app.use(express.urlencoded({ extended: true }));

// Define a pasta public como pasta de arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Rota da página inicial
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Rota da página de login
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Rota da página de cadastro
app.get("/cadastro", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "cadastro.html"));
});

// Rota da página do administrador
app.get("/adm", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "adm.html"));
});

// Rota temporária para receber o formulário de login
app.post("/login", (req, res) => {
    const email = req.body.email;
    const senha = req.body.senha;

    console.log("Tentativa de login:");
    console.log("Email:", email);
    console.log("Senha:", senha);

    // Por enquanto, depois de tentar login, manda para o ADM
    res.redirect("/adm");
});

app.get("/teste-banco", async (req, res) => {
    try {
        const [resultado] = await banco.query(`
            SELECT 
                1 AS conectado,
                DATABASE() AS banco,
                NOW() AS horario
        `);

        res.json({
            express: "funcionando",
            mysql: "conectado",
            banco: resultado[0].banco,
            horarioDoBanco: resultado[0].horario
        });
    } catch (erro) {
        console.error("Erro ao conectar com o banco:");
        console.error(erro);

        res.status(500).json({
            express: "funcionando",
            mysql: "erro na conexão",
            codigo: erro.code,
            mensagem: erro.message
        });
    }
});

// Cadastra um novo usuário no banco
app.post("/cadastro", async (req, res) => {
    const { email, senha } = req.body;

    // Verifica se os campos foram preenchidos
    if (!email || !senha) {
        return res.status(400).send("Preencha o e-mail e a senha.");
    }

    // Verifica o tamanho mínimo da senha
    if (senha.length < 6) {
        return res.status(400).send(
            "A senha precisa ter pelo menos 6 caracteres."
        );
    }

    try {
        // Padroniza o e-mail
        const emailFormatado = email.trim().toLowerCase();

        // Transforma a senha original em hash
        const senhaHash = await bcrypt.hash(senha, 10);

        // Comando SQL parametrizado
        const sql = `
            INSERT INTO usuarios (email, senha)
            VALUES (?, ?)
        `;

        // Envia os dados ao MySQL
        const [resultado] = await banco.execute(sql, [
            emailFormatado,
            senhaHash
        ]);

        console.log(
            `Usuário cadastrado com sucesso. ID: ${resultado.insertId}`
        );

        res.redirect("/login");

    } catch (erro) {

        // Código gerado quando o e-mail já existe
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).send(
                "Já existe um usuário cadastrado com este e-mail."
            );
        }

        console.error("Erro ao cadastrar usuário:", erro);

        res.status(500).send(
            "Não foi possível realizar o cadastro."
        );
    }
});