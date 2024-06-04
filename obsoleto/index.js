const scrapeAlmanax = require("./scrapeAlmanax.js");
const obtenerOficios = require("./obtenerOficios.js");
const enviarMensajeWhatsapp = require('./whatsapp.js');
const express = require('express');
const app = express();
const mysql = require('mysql2');
const port = 3000; // Asegúrate de que este puerto no entre en conflicto con otros servicios
const { Client } = require("discord.js");
const client = new Client({
    intents: [3276799]
})
const canalAlmanaxId = "1232055306171846666";
const canalSorteosId = "1232047493286592532";
const moment = require('moment-timezone');
const config = require("./config.json");

// Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gremio-gods'
});

connection.connect(error => {
    if (error) throw error;
    console.log('Conexión exitosa a la base de datos');
});

// Middleware para parsear JSON
app.use(express.json());

// Ruta de la API para obtener datos
app.get('/data', (req, res) => {
    connection.query('SELECT xpglobal FROM config', (error, results, fields) => {
      if (error) throw error;
      res.json(results);
    });
});

let timer;

function setAlertTimer(whatsappNumer) {
    // Si el timer ya está corriendo, lo reseteamos
    if (timer) clearTimeout(timer);
    whatsappNumer = whatsappNumer ? whatsappNumer : '573137649008'
    // Establece un nuevo timer
    timer = setTimeout(() => {
        client.sendMessage(whatsappNumer+'@c.us', `Si por alguna razon, no te agregue automaticamente ingresa atraves de este link: https://chat.whatsapp.com/CSJ1ZgY1QI7KFeNCqwViiz`);
    }, 60000);  // 60000 milisegundos = 1 minuto
}

// Endpoint para recibir los datos
app.post('/botStatus', (req, res) => {
    // Procesa los datos recibidos
    if (req.body) {
        console.log("Datos recibidos:", req.body);  // Debería mostrar el JSON recibido
        res.status(200).send("Datos recibidos correctamente");
    } else {
        console.log("No se recibió cuerpo en la solicitud");
        res.status(400).send("No se recibió cuerpo en la solicitud");
    }

    // Resetear el timer cada vez que se recibe una solicitud
    setAlertTimer(req.body.whatsappNumer);
});

client.on("messageCreate", async message =>{
    if(message.content == "!almanax"){
        const ofrenda = await scrapeAlmanax('discord');
        if (ofrenda) {
            message.channel.send(`La ofrenda de hoy en Almanax es: ${ofrenda}`);
        } else {
            message.channel.send('No se pudo obtener la información del Almanax.');
        }
    }
})

async function verificarCambioDeDia() {
    const timeZone = 'Europe/Paris'; // Zona horaria de París
    const horaActualEnParis = moment().tz(timeZone).format('HH:mm:ss'); // Obtener la hora actual en París
    //console.log(horaActualEnParis);
    if(horaActualEnParis === '00:00:00'){
        try {
            const canalAlmanax = await client.channels.fetch(canalAlmanaxId);
            const ofrenda = await scrapeAlmanax('discord');
            if (canalAlmanax) {
                if (ofrenda) {
                    canalAlmanax.send(`La ofrenda de hoy en Almanax es: ${ofrenda}`);
                } else {
                    canalAlmanax.send('No se pudo obtener la información del Almanax.');
                }
            }
        } catch (error) {
            console.error('Error al enviar el mensaje al canal:', error);
        }
        obtenerOficios();
    }
    setTimeout(verificarCambioDeDia, 1000);
}

async function enviarGanadoresDeWhatsappPorDiscord(ganadores){
    try {
        const canalSorteos = await client.channels.fetch(canalSorteosId);
        if (canalSorteos) {
            canalSorteos.send(ganadores);
        }
    } catch (error) {
        console.error('Error al enviar el mensaje al canal:', error);
    }
}

enviarMensajeWhatsapp().then(ganadores => {
    enviarGanadoresDeWhatsappPorDiscord(ganadores);
}).catch(error => {
    console.error('Error al obtener los ganadores:', error);
});

verificarCambioDeDia();
// Inicia el timer la primera vez cuando se levanta el servidor
setAlertTimer();
//obtenerOficios();

client.login(config.token);
console.log("El bot ya esta listo!");

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
    console.log("El bot ya está listo!");
});