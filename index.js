const express = require('express');
const app = express();
const whatsappBot = require('./whatsappRefactor.js');
const initializeDatabase = require('./database.js');
const obtenerOficios = require("./obtenerOficios.js");
const fs = require('fs');

app.use(express.json());

let dbConnection;  // Variable para almacenar la conexión a la base de datos
let lastExecutionTime = 0;  // Variable para almacenar el tiempo de la última ejecución (en milisegundos)
let lastAlertAttackGuild = 0;
  
// Inicializar la base de datos
async function getDatabaseConnection() {
    try {
        // Intenta usar una consulta simple para verificar la conexión
        await dbConnection.query('SELECT 1');
    } catch (error) {
        console.error('La conexión con la base de datos se perdió. Reconectando...', error);
        dbConnection = await initializeDatabase();  // Intenta reconectar
    }
    return dbConnection;
}

app.get('/config', async (req, res) => {
    try {
        const db = await getDatabaseConnection();
        const [config] = await db.query('SELECT xpglobal, xpglobal_activa, setear_antes_de, cantidad_maxima_percos FROM config');
        res.json(config);
    } catch (error) {
        console.error('Error en la consulta a la base de datos:', error);
        res.status(500).send('Error al realizar la consulta');
    }
});

app.get('/ranks', async (req, res) => {
    const nuevoMiembro = 8; //a
    const admXp = 32; //b
    const disXp = 256; //c
    const defensa = 32768; //d
    const ponerrecudador = 128; //e
    const recrecaudador = 65536; //f
    const cercado = 4096; //g
    const prisma = 131072; //h
    const alianza = 262144; //i

    const valuesMap = {
        'a': nuevoMiembro,
        'b': admXp,
        'c': disXp,
        'd': defensa,
        'e': ponerrecudador,
        'f': recrecaudador,
        'g': cercado,
        'h': prisma,
        'i': alianza
    };

    try {
        const db = await getDatabaseConnection();
        const [ranks] = await db.query('SELECT * FROM rangos');

        // Calcular el valor de rights para cada rango
        const updatedRanks = ranks.map(rank => {
            const rightsArray = rank.rights.split(',');
            const rightsSum = rightsArray.reduce((sum, right) => sum + (valuesMap[right] || 0), 0);
            return {
                ...rank,
                rights: rightsSum
            };
        });

        res.json(updatedRanks);
    } catch (error) {
        console.error('Error en la consulta a la base de datos:', error);
        res.status(500).send('Error al realizar la consulta');
    }
});

let timer;

function setAlertTimer() {
    if (timer) clearTimeout(timer);  // Resetear el timer si ya está corriendo
    //console.log(whatsappNumber);
    whatsappNumber = '573145944184';  // Número por defecto si no se proporciona
    timer = setTimeout(() => {
        whatsappBot.sendMessage(`${whatsappNumber}@c.us`, 'El bot no responde hace 1 minuto.');
    }, 70000);  // 60000 milisegundos = 1 minuto
}

app.post('/botStatus', async (req, res) => {
    setAlertTimer();  // Resetear el timer cada vez que se recibe una solicitud
});

app.post('/guildInformation', async (req, res) => {
    const currentTime = Date.now();
    const twelveHoursInMilliseconds = 12 * 60 * 60 * 1000;
    const logData = JSON.stringify(req.body, null, 2); // Convierte el cuerpo de la solicitud a una cadena JSON con sangría
    
    // Guarda los datos en un archivo .txt
    fs.appendFile('guildInformation.txt', `${logData}\n`, (err) => {
        if (err) {
            console.error('Error al guardar el archivo:', err);
            return res.status(500).send('Error al guardar los datos');
        }
        res.send('Datos guardados correctamente');
    });
    if (currentTime - lastExecutionTime < twelveHoursInMilliseconds) {
        return res.status(200).send("OK");
    }

    try {
        const db = await getDatabaseConnection();

        // Verificar si req.body es un arreglo
        if (Array.isArray(req.body)) {
            const data = req.body;

            // Iterar sobre el arreglo e insertar cada objeto en la base de datos
            for (const player of data) {
                const { name, givenExperience } = player;
                if (name && givenExperience !== undefined) {
                    await db.query('INSERT INTO experiencia (name, givenExperience) VALUES (?, ?)', [name, givenExperience]);
                }
            }

            // Actualizar el tiempo de la última ejecución
            lastExecutionTime = currentTime;

            res.status(200).send("Datos insertados correctamente");
        } else {
            res.status(400).send("El cuerpo de la solicitud no es un arreglo");
        }
    } catch (error) {
        console.error('Error al insertar datos:', error);
        res.status(500).send('Error al insertar datos');
    }
});

app.post('/guildDetails', async (req, res) => {
    const currentTime = Date.now();
    const twelveHoursInMilliseconds = 10 * 60 * 1000;

    try {
        const db = await getDatabaseConnection();
        await db.query('UPDATE config SET nivel_gremio = ?, experiencia_gremio = ?', [req.body.level, req.body.experience]);
        res.status(200).send("Datos insertados correctamente");
    } catch (error) {
        console.error('Error al insertar datos:', error);
        res.status(500).send('Error al insertar datos');
    }
});

app.post('/guildAttack', async (req, res) => {
    const idGrupoReclutadores = '120363285015159643@g.us';
    const idGrupoAVAS = '120363301260854323@g.us';
    const idGrupoGremio = '120363255241442636@g.us';
    
    const currentTime = Date.now();
    const thirtySecondsInMilliseconds = 30 * 1000; // 30 segundos * 1000 milisegundos por segundo
    if (currentTime - lastAlertAttackGuild < thirtySecondsInMilliseconds) {
        return res.status(200).send("OK");
    }
    if(req.body.guild.guildName == "Gods"){
        console.log('hola')
        try {
            whatsappBot.sendMessage(idGrupoGremio, 'Estan ATACANDO EL PERCO de ['+req.body.worldX+','+req.body.worldY+']');
            whatsappBot.sendMessage(idGrupoReclutadores, 'Estan ATACANDO EL PERCO de ['+req.body.worldX+','+req.body.worldY+']');
            whatsappBot.sendMessage(idGrupoAVAS, 'Estan ATACANDO EL PERCO de ['+req.body.worldX+','+req.body.worldY+']');
            lastAlertAttackGuild = currentTime;
            res.status(200).send("Alerta enviada");
        } catch(error){
            console.error('Error al enviar los mensajes de ataque de perco:', error);
            res.status(500).send('Error al enviar los mensajes de ataque de perco');
        }
    } else {
        res.status(200).send("Gremio no es Gods");
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
    //obtenerOficios();
});
