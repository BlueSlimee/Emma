const path = require("path");
const fs = require("fs");
const Discord = require("discord.js");
const colors = require("chalk").default;

// Configurar variáveis de ambiente
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Módulo de logging da Emma.
const console = require("./includes/emmalogger");

class Emma {
    /**
     * Inicializa uma instância da Emma.
     * @param {Object} config Configurações dessa instância
     * @param {Object} clientOptions Opções para passar ao cliente Discord.js
     */
    constructor (config, clientOptions) {
        this.config = config;
        if(this.config.OWNERS) this.config.OWNERS = this.config.OWNERS.split(",");

        this.client = new Discord.Client(clientOptions);

        // eventos
        this.client.on("ready", () => this.onReady());
        this.client.on("message", m => this.onMessage(m));
        this.client.on("error", err => this.handleWebSocketError(err));

        // manter referência à instância da Emma através do cliente
        this.client.Emma = this;
        
        // carregar os comandos
        this.commands = require("./includes/commandLoader")("./commands/");

        this.client.login(config.DISCORD_TOKEN);
    }

    /**
     * Quando o evento "ready" do Discord.js é executado
     */
    onReady () {
        console.log("✔️  Login feito!");
    }

    /**
     * Quando uma mensagem é recebida.
     * @param {Discord.Message} msg 
     */
    onMessage (msg) {
        // só queremos lidar com mensagens que são enviadas por um humano
        if(msg.system || msg.author.bot) return;
        console.log(`💬  ${msg.author.tag} ${colors.gray(msg.cleanContent)}`);

        if(!msg.content.startsWith(this.config.prefix)) return;

        const args = msg.content.split(" ");
        const cmd = args.shift().replace(this.config.prefix, "");

        console.debug(`${colors.green(cmd)} ${colors.bgBlack.white(args.join(" "))}`);

        this.handleCommand(msg, cmd, args);
    }

    /**
     * Executa os comandos.
     * @param {Discord.Message} msg 
     * @param {String} commandName 
     * @param {Array} args 
     */
    handleCommand (msg, commandName, args) {
        if(!this.commands.has(commandName)) return;

        const cmd = this.commands.get(commandName);

        /* Verificar permissões */
        if(cmd.user_must_be_owner && !this.config.OWNERS.includes(msg.author.id)) return;
        if(cmd.guild_only && !msg.guild) return;
        if(msg.guild && !msg.guild.available) return;
        if(msg.guild && !msg.member.hasPermission(cmd.user_permissions)) return;
        if(msg.guild && !msg.guild.me.hasPermission(cmd.bot_permissions)) return;

        cmd.exec(this, this.client, msg, args);
    }

    /**
     * Lida com possíveis erros na conexão.
     * @param {Error} error 
     */
    handleWebSocketError (error) {
        console.error(`----------------------------------------------------`);
        console.error(colors.red("Oof, erro na conexão! Mais informações:"));
        console.error(`> Nome: ${colors.yellow(error.name)}`);
        console.error(`> Stack: ${error.stack}`);
        console.error(`----------------------------------------------------`);
    }
}

const clientOptions = require("./clientOptions.json");
const emmaInst = new Emma(process.env, clientOptions);

/*
    Gente, como é gostoso usar git né?
*/