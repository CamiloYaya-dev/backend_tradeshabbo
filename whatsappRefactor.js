const mysql = require('mysql2/promise');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const scrapeAlmanax = require("./scrapeAlmanax");
const scrapeMembers = require('./scrapeLeader');
const moment = require('moment-timezone');
const obtenerOficios = require("./obtenerOficios.js");


class WhatsAppBot {

    constructor() {
        this.initializeDatabase();
        this.initializeWhatsAppClient();
        this.startWeeklyTask();
        this.previousNivelGremio = null;
    }

    initializeDatabase() {
        this.pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '', 
            database: 'gremio-gods',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    
    initializeWhatsAppClient() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            },
            webVersion: '2.3000.1014360233',
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'

            }
        });

        this.client.on('qr', qr => {
            console.log('QR Received');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            console.log('WhatsApp Client is ready!');
            this.sendMessage('573145944184@c.us', 'bot on');
        });

        this.client.on('message', message => this.handleMessage(message));

        this.client.initialize();
    }

    async executeQuery(query, params = []) {
        let connection;
        try {
            connection = await this.pool.getConnection();
            const [result] = await connection.execute(query, params);
            return result;
        } catch (error) {
            console.error('Error executing query:', error);
            throw error; // Propaga el error para ser manejado donde corresponda
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async sendMessage(to, message) {
        await this.client.sendMessage(to, message);
    }

    async handleMessage(message) {
        const grupoId = '120363255241442636@g.us';
        const idGrupoReclutadores = '120363285015159643@g.us';
        const idGrupoAVAS = '120363301260854323@g.us';
        const linkDiscord = 'https://discord.gg/cysENbZEXM';
        let comandosBot = "COMANDOS DEL BOT: \n";
        comandosBot += "*------Gremio------* \n " ;
        comandosBot += "- *!lider* (llama al lider del gremio) - solo funciona en el grupo de whatsapp \n ";
        comandosBot += "- *!buscarMD* (menciona '@' a todos los Manos Derechas del gremio) - solo funciona en el grupo de whatsapp \n ";
        comandosBot += "- *!notificartodos* Envia un mensaje mencionando '@' a todos los miembros del grupo de whatsapp - solo funciona en el grupo de whatsapp - Exclusivo de MD \n ";
        comandosBot += "- *!referido.nombrereclutador/nombrereclutado* Guarda en la base de datos las personas que a invitado un reclutador ejemplo (!referedio.keneth-gato/andres) - Exclusivo de MD \n ";
        comandosBot += "- *!verificar* (valida si un miembro es del gremio 'proximamente vinculara el celular del que solicita la verificacion con el nombre del pj') Ejemplo comando: !verificarmiembro andres\n ";
        comandosBot += "- *!nivelgremio* (dice el nivel actual del gremio) \n ";
        comandosBot += "- *!cantidadmiembros* (dice la cantidad de miembros del gremio) \n ";
        comandosBot += "- *!oficio-nombre_del_oficio* (da un listado de todos los miembros del gremio que tienen dicho oficio - ejemplo !oficio-forjador_de_palas o !oficio-minero) \n ";
        comandosBot += "- *!reglas* (da un listado las reglas del gremio) \n";
        comandosBot += "- *!grupo* (te agrega al grupo del gremio automaticamente o te envia el link de invitacion) \n";
        comandosBot += "*------Almanax------* \n " ;
        comandosBot += "- *!almanax* (dice la ofrenda de hoy) \n " ;
        comandosBot += "- *!almanax-año/mes/dia* (dice la ofrenda de una fecha en específico - ejemplo !almanax-2024/05/01) \n ";
        comandosBot += "- *!xpday* (devuelve la fecha y la explicacion del proximo almanax donde la bonificacion sea XP) \n";
        comandosBot += "*------Informativos------* \n " ;
        comandosBot += "- *!discord* (dice el link del servidor de discord) \n ";
        comandosBot += "- *!premios* (dice los sorteos activos y requisitos para participar) \n ";
        comandosBot += "- *!horadofus* (dice la hora en dofus) \n";
        comandosBot += "*------MARKETPLACE------* \n " ;
        comandosBot += "- *!vendo* - Sirve para publicar en la lista de 'vendedores' que vendes (el limite es 2 artículos publicados) - ejemplo !vendo set jalato a 50kk \n";
        comandosBot += "- *!vermisventas* - Sirve para ver que artículos de ventas tienes publicados, también para saber sus identificadores por si quieres eliminarlos \n";
        comandosBot += "- *!eliminarventa.identificador* - Sirve para eliminar un articulo de venta publicado - ejemplo si el identificador es 5 el comando seria !eliminarventa.5 \n";
        comandosBot += "- *!vervendedores* - Muestra el listado de todos los artículos publicados de ventas, ósea puedes ver quien esta vendiendo que cosa y podras comunicarte con esta persona. \n";
        comandosBot += "- *!compro* - Sirve para publicar en la lista de 'compradores' que compras (el limite es 2 arcticulos publicados) - ejemplo !compro set pio amarillo a 1mk) \n";
        comandosBot += "- *!vermiscompras* - Sirve para ver que artículos de compras tienes publicados, también para saber sus identificadores por si quieres eliminarlos \n";
        comandosBot += "- *!eliminarcompra.identificador* - Sirve para eliminar un articulo de compra publicado - ejemplo si el identificador es 9 el comando seria !eliminarcompra.9 \n";
        comandosBot += "- *!vercompradores* - Muestra el listado de todos los artículos publicados de compras, ósea puedes ver quien esta comprando que cosa y podras comunicarte con esta persona. \n";
        comandosBot += "- *!reportar.tipo.identificador* - Permite reportar un comprador|vendedor (es el tipo) si algo salió mal con algún articulo publicado - ejemplo !reportar.comprador.14 (esto reportando el articulo con el identificador 14 de la lista de compradores) \n";
        comandosBot += "*------Proximamente------* \n " ;
        comandosBot += "- !buscogrupo (próximamente) \n ";
        comandosBot += "- !dejardebuscargrupo (próximamente) \n ";
        let premios = "*Desde el 13/05/2024 para participar en los sorteos o en los premios fijos ahi que ser mínimo rango 'Gobernador' (haber donado mas de 250.000 xp al gremio) a no ser que el sorteo o premio fijo especifique que no ahi que cumplir este requisito. \n\n";
        premios += "*Los sorteos de esta semana son:* \n " ;
        premios += "1 gelanillo - entre todos los del gremio que esten verificados en el grupo de whatsapp (sorteo) - no ahi requisito de rango 'Gobernador'\n" ;
        premios += "1 gelanillo - entre todos los del gremio (sorteo)\n" ;
        premios += "250kk - para los que esten por encima del nivel (se dira cada semana), para esta semana es 100+ (sorteo)\n\n" ;
        premios += "*Los premios fijos de esta semana son:* \n " ;
        premios += "Para los que mas donen XP en la semana (domingo a domingo, todos los domingos) \n " ;
        premios += "1. 500.000kk \n " ;
        premios += "2. 300.000kk \n " ;
        premios += "3. 250.000kk \n " ;
        premios += "4. 210.000kk \n " ;
        premios += "5. 178.000kk \n " ;
        premios += "6. 151.000kk \n " ;
        premios += "7. 128.000kk \n " ;
        premios += "8. 109.000kk \n " ;
        premios += "9. 92.000kk \n " ;
        premios += "10. 82.000kk \n\n" ;
        premios += "*Los sorteos y anuncio de los ganadores de premios fijos se hacen cada DOMINGO A MEDIA NOCHE (HORA COLOMBIA) de manera automatica, se publican los ganadores por el canal de WhatsApp* \n " ;
        let adminsParticipants = [];
        let reglas = "Estas reglas aplican desde el *30/04/2024* \n\n";
        reglas += "*Reglas:* \n";
        reglas += "-----Gremio----- \n";
        reglas += "-1 Recaudador por persona \n";
        reglas += "-Solo personajes lvl 100+ \n";
        reglas += "-----WhatsaApp----- \n";
        reglas += "-No ser ofensivos \n";
        reglas += "-No robar \n";
        reglas += "-No spam \n";
        reglas += "-No CP (Pornografia Infantil) \n";
        reglas += "-No gore \n";
        reglas += "-No zoofilia \n\n";
        reglas += "*Rangos/permisos:* \n";
        reglas += "-Consejero / hablar por canal alianza (249.999 xp o menos) \n";
        reglas += "-Gobernador / permisos anteriores y invitar nuevos miembros (250.000 xp a 4.999.999 xp) \n";
        reglas += "-Buscador de tesoros / permisos anteriores y distribuir los puntos de xp, poner y recaudar sus recaudadores (5.000.000 xp a 7.999.999 xp) \n";
        reglas += "-Diplomatico / permisos anteriores y administrar las reparticiones de xp (8.000.000 xp a 9.999.999 xp)\n";
        reglas += "-Guardian / permisos anteriores y ser prioritario en la defensa de los recaudadores (10.000.000 xp a 11.999.999 xp)\n";
        reglas += "-Reservista / permisos anteriores y utilizar los cercados (12.000.000 xp a 14.999.999 xp)\n";
        reglas += "-Protector / permisos anteriores y poseer o modificar un prisma de alianza (15.000.000 xp o mas)*. \n";
        reglas += "Los permisos se dan automaticamente al entrar en algun rango de xp donada al gremio";
        const regexAlmanax = /^!almanax-(\d{4})\/(\d{2})\/(\d{2})$/;
        const regexNotificartodos = /^!notificartodos\s+.+$/s;
        const regexVerificarMiembro = /^!verificar\s+[a-zA-Z]+(-[a-zA-Z]+)?(\s+[a-zA-Z]+(-[a-zA-Z]+)?)*$/gm;
        const regexActivarMiembro = /^!activar\s+[a-zA-Z]+(-[a-zA-Z]+)?(\s+[a-zA-Z]+(-[a-zA-Z]+)?)*$/gm;
        const match = message.body.match(/^!oficio-([^-\s]+)$/);
        const regexReferidos = /^!referido\.([a-z]+(?:-[a-z]+)?)\/([a-z]+(?:-[a-z]+)?)$/gm;
        const matchReferidos = regexReferidos.exec(message.body);
        const oficiosPermitidos = new Set([
        "alquimista",
        "campesino",
        "carnicero",
        "cazador",
        "escultomago_de_arcos",
        "escultomago_de_bastones",
        "escultomago_de_varitas",
        "escultor_de_arcos",
        "escultor_de_bastones",
        "escultor_de_varitas",
        "fabricante",
        "forjador_de_dagas",
        "forjador_de_espadas",
        "forjador_de_hachas",
        "forjador_de_martillos",
        "forjador_de_palas",
        "forjamago_de_dagas",
        "forjamago_de_espadas",
        "forjamago_de_hachas",
        "forjamago_de_martillos",
        "forjamago_de_palas",
        "joyero",
        "joyeromago",
        "leñador",
        "manitas",
        "minero",
        "panadero",
        "pescadero",
        "pescador",
        "sastre",
        "sastremago",
        "zapatero",
        "zapateromago"
        ]);
        const regexVendo = /^!vendo\s+.+$/s;
        const regexEliminarVenta = /^!eliminarventa\.\d+$/s;
        const regexCompro = /^!compro\s+.+$/s;
        const regexEliminarCompra = /^!eliminarcompra\.\d+$/s;
        const regexReportar = /^!reportar\.(comprador|vendedor)\.(\d+)$/;
        const regexRecordatorio = /^!recordatorio\.(\d+)\.(\d+)\s+(.*)$/;
        const matchRegexRecortario = regexRecordatorio.exec(message.body);
        //                                              camilo                    shridd                                        keneth                                  adekiin                                     dani
        const celularesMDValidacion = (message.from === '573145944184@c.us' || message.from === '573106851098@c.us' || message.from === '573174599152@c.us' ||  message.from === '573042464654@c.us' || message.from === '573013688040@c.us');
        const regexEliminarRecordatorio = /^!eliminar\.recordatorio\.(\d+)$/s;
        // Puedes añadir diferentes comandos o acciones según el contenido del mensaje
        if (message.body === '!grupo') {
            const chats = await this.client.getChats();
            let a = 'Reclutadores - MD - GODS';
            const group1 = chats.find(chat => chat.name === a);
            console.log(group1);
            let b = 'AVA’S GODS';
            const group2 = chats.find(chat => chat.name === b);
            console.log(group2);
            //console.log(chats);
            const groupName = 'Gremio Gods'; // Nombre del grupo que deseas encontrar
            const group = chats.find(chat => chat.name === groupName);
            if (group && group.isGroup) {
                // Asegurarse de que la variable 'group' realmente contiene un grupo
                const participant = message.from.endsWith('@c.us') ? message.from : `${message.from}@c.us`;
                console.log('Grupo:', group.name);
                console.log('Participante a añadir:', participant);
                try {
                    await group.addParticipants([participant]);
                    this.client.sendMessage(message.from, `Si por alguna razon, no te agregue automaticamente ingresa atraves de este link: https://chat.whatsapp.com/CSJ1ZgY1QI7KFeNCqwViiz`);
                } catch (error) {
                    this.client.sendMessage(message.from, `Si por alguna razon, no te agregue automaticamente ingresa atraves de este link: https://chat.whatsapp.com/CSJ1ZgY1QI7KFeNCqwViiz`);
                }
            } else {
                console.log('No se encontró el grupo o el nombre no coincide.');
            }
        } else if (message.body === '!almanax') {
            const ofrenda = await scrapeAlmanax('whatsapp');
            if (ofrenda) {
                this.client.sendMessage(message.from === grupoId ? message.author : message.from, `La ofrenda de hoy en Almanax es: ${ofrenda}`);
            } else {
                this.client.sendMessage('No se pudo obtener la información del Almanax.');
            }
        } else if (message.body === '!discord') {
            this.client.sendMessage(message.from === grupoId ? message.author : message.from, `El link de discord es ${linkDiscord}`);
        } else if (message.body === '!help') {
            this.client.sendMessage(message.from === grupoId ? message.author : message.from, comandosBot);
        } else if (regexAlmanax.test(message.body)) {
            const [, año, mes, dia] = message.body.match(regexAlmanax);
            let fechaAlmanax = await this.formatDate(año, mes, dia);
            let fechaAlmanaxSinHora = fechaAlmanax.toISOString().split('T')[0];
            if (!isNaN(fechaAlmanax)) {
                const ofrenda = await scrapeAlmanax('whatsapp', fechaAlmanaxSinHora);
                if (ofrenda) {
                    this.client.sendMessage(message.from === grupoId ? message.author : message.from, `La ofrenda de hoy en Almanax es: ${ofrenda}`);
                } else {
                    this.client.sendMessage('No se pudo obtener la información del Almanax.');
                }
            } else {
                // La fecha no es válida, maneja este caso adecuadamente
                this.client.sendMessage(message.from === grupoId ? message.author : message.from, "La fecha proporcionada no es válida.");
            }
        } else if (message.body === '!buscarMD' && message.from === grupoId) {
            const chats = await this.client.getChats();
            // Iterar sobre los chats para encontrar el grupo específico
            const groupName = 'Gremio Gods'; // Nombre del grupo que deseas encontrar
            const group = chats.find(chat => chat.name === groupName);
            if (group) {
                try {
                // Enviar mensaje al grupo
                const members = group.participants;
                adminsParticipants = members.filter(member => member.isAdmin === true);
                adminsParticipants = members.filter(member => {
                    // Excluir los números 573145944184 y 573208260687
                    return member.isAdmin && member.id.user !== '573145944184' && member.id.user !== '573208260687';
                });
                const usersArray = adminsParticipants.map(member => `@${member.id.user}`).join(' ');
                const serializedArray = adminsParticipants.map(member => member.id._serialized);
                const textMD = 'Se necesita un Mano Derecha ' + usersArray.toString();
                group.sendMessage(textMD, { mentions: serializedArray });
                } catch (error) {
                    console.error('Error al enviar el mensaje:', error);
                }
            } else {
                console.log(`No se encontró el grupo ${groupName}`);
            }
        } else if (message.body === '!xpday') {
            const ofrenda = await scrapeAlmanax('whatsapp', '', 'xpday');
            if (ofrenda) {
                this.client.sendMessage(message.from === grupoId ? message.author : message.from, `El siguiente dia donde ahi bonus de XP es: ${ofrenda}`);
            } else {
                this.client.sendMessage('No se pudo obtener la información del Almanax.');
            }
        } else if (message.body === '!premios') {
            this.client.sendMessage(message.from, premios);
        } else if (regexVerificarMiembro.test(message.body)) {
            this.client.sendMessage(message.from === grupoId ? message.author : message.from, 'Verificando Miembro.... (30 segundos de espera)');
            let mensajeSinComando = message.body.replace('!verificar ', "");
            mensajeSinComando = mensajeSinComando.toLowerCase();
            console.log(mensajeSinComando);
            let query = `SELECT nombre FROM oficios WHERE nombre = ?`;
            try {
                const result = await this.executeQuery(query, [mensajeSinComando]);
                this.client.sendMessage(message.from === grupoId ? message.author : message.from, result.length === 1 ? 'El miembro ' + result[0].nombre + ' esta en el gremio, pendiente de verificacion por parte de un Mano derecha' : 'El miembro ' + mensajeSinComando + ' NO esta el gremio');
                if(result.length === 1){
                    query = `SELECT nombre FROM verificados WHERE nombre = ?`;
                    try {
                        const result = await this.executeQuery(query, [mensajeSinComando]);
                        if (result.length > 0) {
                            this.client.sendMessage(message.from === grupoId ? message.author : message.from, 'El miembro ' + mensajeSinComando + ' ya está en la lista, espera a ser activado por un Mano Derecha.');
                            return; // Sale de la función si el nombre ya existe
                        }
                    } catch (error) {
                        console.error('Error al verificar existencia:', error);
                        return; // Sale de la función si hay un error al verificar
                    }
                    query = `INSERT INTO verificados (nombre, whatsapp) VALUES (?, ?)`;
                    await this.executeQuery(query, [result[0].nombre, message.from === grupoId ? message.author : message.from]);
                }
            } catch (error) {
                console.error('Error al obtener oficios en la base de datos:', error);
            };
        } else if (message.body === '!nivelgremio') {
            (async () => {
                try {
                const resultado = await scrapeMembers('!nivelgremio');
                console.log(resultado); // Imprime los miembros recolectados
                this.client.sendMessage(message.from === grupoId ? message.author : message.from, 'El nivel del gremio es: ' + resultado);
                } catch (error) {
                console.error('Error scraping members:', error);
                }
            })();
        } else if (message.body === '!cantidadmiembros') {
            (async () => {
                try {
                const resultado = await scrapeMembers('!cantidadmiembros');
                console.log(resultado); // Imprime los miembros recolectados
                this.client.sendMessage(message.from === grupoId ? message.author : message.from, 'El gremio consta de ' + resultado);
                } catch (error) {
                console.error('Error scraping members:', error);
                }
            })();
        } else if (message.body === '!horadofus') {
            const timeZone = 'Europe/Paris';
            // Obtener la hora actual en París
            let horaActualParis = moment().tz(timeZone);
            // Formatear la hora en un formato legible
            let horaFormateada = horaActualParis.format('YYYY-MM-DD HH:mm:ss');
            this.client.sendMessage(message.from === grupoId ? message.author : message.from, 'La hora en dofus, la cual es la misma hora que en PARIS/FRANCIA es: '+horaFormateada);
        } else if (message.body === '!lider' && message.from === grupoId) {
            const chats = await this.client.getChats();
            // Iterar sobre los chats para encontrar el grupo específico
            const groupName = 'Gremio Gods'; // Nombre del grupo que deseas encontrar
            const group = chats.find(chat => chat.name === groupName);
            if (group) {
                try {
                // Enviar mensaje al grupo
                const members = group.participants;
                adminsParticipants = members.filter(member => member.isAdmin === true);
                adminsParticipants = members.filter(member => {
                    // Solo los números 573145944184
                    return member.isAdmin && member.id.user === '573145944184';
                });
                const usersArray = adminsParticipants.map(member => `@${member.id.user}`).join(' ');
                const serializedArray = adminsParticipants.map(member => member.id._serialized);
                const textMD = 'Te necesitan ' + usersArray.toString();
                group.sendMessage(textMD, { mentions: serializedArray });
                } catch (error) {
                    console.error('Error al enviar el mensaje:', error);
                }
            } else {
                console.log(`No se encontró el grupo ${groupName}`);
            }
        } else if (regexNotificartodos.test(message.body) && celularesMDValidacion) {
            const chats = await this.client.getChats();
            // Iterar sobre los chats para encontrar el grupo específico
            const groupName = 'Gremio Gods'; // Nombre del grupo que deseas encontrar
            const group = chats.find(chat => chat.name === groupName);
            if (group) {
                try {
                // Enviar mensaje al grupo
                const mensajeSinComando = message.body.replace('!notificartodos', "");
                const members = group.participants.filter(member => 
                    member.id._serialized !== '573145944184@c.us' &&
                    member.id._serialized !== '573106851098@c.us' &&
                    member.id._serialized !== '573174599152@c.us' &&
                    member.id._serialized !== '393276993498@c.us' &&
                    member.id._serialized !== '573208260687@c.us'
                );
                const usersArray = members.map(member => `@${member.id.user}`).join(' ');
                const serializedArray = members.map(member => member.id._serialized);
                const textNotificarTodos = mensajeSinComando + usersArray.toString();
                group.sendMessage(textNotificarTodos, { mentions: serializedArray });
                } catch (error) {
                    console.error('Error al enviar el mensaje:', error);
                }
            } else {
                console.log(`No se encontró el grupo ${groupName}`);
            }
        } else if (match) {
            const oficioExtraido = match[1];
            if (oficiosPermitidos.has(oficioExtraido)) {
                let textReplace = oficioExtraido.replace(/_/g, " ");
                let query = `SELECT nombre, oficios FROM oficios WHERE JSON_SEARCH(oficios, 'one', ?) IS NOT NULL;`;
                try {
                    const result = await this.executeQuery(query, [textReplace]);
                    console.log(result);
                    const resultados = result.map(miembro => {
                        const oficios = JSON.parse(miembro.oficios);
                        const oficioEncontrado = oficios.find(o => o.oficio.toLowerCase() === textReplace);
                        return oficioEncontrado ? { nombre: miembro.nombre, oficio: oficioEncontrado } : null;
                    }).filter(result => result !== null);
                    resultados.sort((a, b) => {
                        // Extraer el número del nivel del string '(nivel X)'
                        const nivelA = parseInt(a.oficio.nivel.match(/\d+/)[0], 10);
                        const nivelB = parseInt(b.oficio.nivel.match(/\d+/)[0], 10);
                        // Orden decreciente: b antes que a
                        return nivelB - nivelA;
                    });
                    const listadoOficiosGremio = resultados.map(miembro => 
                    `- ${miembro.nombre} ${miembro.oficio.oficio} ${miembro.oficio.nivel} \n`
                    ).join('');
                    this.client.sendMessage(message.from === grupoId ? message.author : message.from, listadoOficiosGremio.length >= 1 ? `El listado de ${textReplace} del gremio son: \n ${listadoOficiosGremio}` : `No tenemos actualmente ${textReplace} en el gremio :(`);
                } catch (error) {
                    console.error('Error al obtener oficios en la base de datos:', error);
                };
                
            } else {
                this.client.sendMessage(message.from === grupoId ? message.author : message.from, 'Oficio no reconocido');
            }
        } else if (message.body === '!reglas') {
            const chats = await this.client.getChats();
            // Iterar sobre los chats para encontrar el grupo específico
            const groupName = 'Gremio Gods'; // Nombre del grupo que deseas encontrar
            const group = chats.find(chat => chat.name === groupName);
            if (group) {
                try {
                    if (group.description != reglas){
                        group.setDescription(reglas);
                    }
                    this.client.sendMessage(message.from, reglas);
                } catch (error) {
                console.error('Error al enviar el mensaje:', error);
                }
            } else {
                console.log(`No se encontró el grupo ${groupName}`);
            }
        } else if (matchReferidos && celularesMDValidacion) {
            const valoresPermitidos = ['keneth-sacro', 'shridd', 'adekiin', 'daniel-arjona'];
            let reclutador = matchReferidos[1];
            let invitado = matchReferidos[2];
            let query = '';
            console.log(matchReferidos);
            if (valoresPermitidos.includes(reclutador)) {
                console.log("Reclutador válido:", reclutador);
                query = `SELECT * FROM referidos WHERE invitado = ?`;
                const resultSelect = await this.executeQuery(query, [invitado]);
                if (resultSelect.length > 0) {
                    this.client.sendMessage(message.from === grupoId ? message.author : message.from, 'El invitado ' + invitado + ' ya ha sido referido anteriormente por '+resultSelect[0].reclutador);
                } else {
                    query = `INSERT INTO referidos (reclutador, invitado, verificado, nivel) VALUES (?, ?, 0, 0)`;
                    const resultInto = await this.executeQuery(query, [reclutador, invitado]);
                    if(resultInto) {
                        this.client.sendMessage(message.from === grupoId ? message.author : message.from, 'El miembro '+invitado+' a sido correctamente referido al reclutador '+reclutador);
                    } else {
                        this.client.sendMessage(message.from === grupoId ? message.author : message.from, 'Hubo un error al intentar referir a '+invitado+' , por favor contacte a Andres');
                    }
                }
            } else {
                this.client.sendMessage(message.from === grupoId ? message.author : message.from, 'El reclutador: '+reclutador+' NO es valido'); 
            }
        } else if (regexVendo.test(message.body)) {
            const mensajeSinComando = message.body.replace('!vendo', "");
            const vendedor = message.from === grupoId ? message.author : message.from;
            
            let checkQuery = 'SELECT COUNT(*) AS count FROM ventas WHERE vendedor = ? AND habilitado = 1';
            const countResult = await this.executeQuery(checkQuery, [vendedor]);
            
            if (countResult[0].count < 2) {
                let query = 'INSERT INTO ventas (vendedor, mensaje, habilitado) VALUES (?, ?, 1)';
                const resultInto = await this.executeQuery(query, [vendedor, mensajeSinComando]);
                if(resultInto) {
                    this.client.sendMessage(vendedor, 'El articulo de venta: '+mensajeSinComando+'\n Del propietario: '+vendedor+'\n Ha sido correctamente publicado');
                } else {
                    this.client.sendMessage(vendedor, 'Hubo un error al intentar referir publicar la venta, comuniquese con Andres para solucionarlo');
                }
            } else {
                this.client.sendMessage(vendedor, 'No puede agregar más ventas, ya ha alcanzado el límite de registros permitidos (2), primero elimine algun articulo ya existente.');
            }
        } else if (message.body === "!vermisventas") {
            const propietario = message.from === grupoId ? message.author : message.from;
            console.log(propietario);
            let query = "SELECT * FROM ventas WHERE vendedor = ? AND habilitado = 1";
            const resultSelect = await this.executeQuery(query, [propietario]);
            if(resultSelect.length>0) {
                let mensajes = 'Sus artículos de ventas son:\n';  // Iniciar el mensaje con una cabecera
                for (let item of resultSelect) {
                    mensajes += 'Identificador: *' + item.id + '* \n'+'Mensaje: ' + item.mensaje + '\n'+'Fecha de publicado: '+ item.fecha_registro+'\n';  // Añadir cada mensaje de artículo en venta a la lista
                }
                mensajes += "\nEl *Identificador* es importante si quiere eliminar un arcticulo, los arcticulos se eliminan automaticamente despues de 30 dias de publicados";
                this.client.sendMessage(propietario, mensajes);  
            } else if(resultSelect.length == 0) {
                this.client.sendMessage(propietario, 'Usted no tiene articulos de venta actualmente');
            } else {
                this.client.sendMessage(propietario, 'Hubo un error al intentar obtener sus articulos, comuniquese con Andres para solucionarlo');
            }
        } else if (regexEliminarVenta.test(message.body)) {
            const id = message.body.replace('!eliminarventa.', "");
            const propietario = message.from === grupoId ? message.author : message.from;
            let query = "UPDATE ventas SET habilitado = 0 WHERE id = ? AND vendedor = ?";
            const result = await this.executeQuery(query, [id, propietario]);

            // Verificar cuántos registros fueron afectados
            if (result.affectedRows > 0) {
                console.log("Registro eliminado con éxito.");
                this.client.sendMessage(propietario, "El artículo ha sido eliminado correctamente.");
            } else {
                console.log("No se encontró el registro para eliminar o no tienes permiso para eliminarlo.");
                this.client.sendMessage(propietario, "No se pudo eliminar el artículo. Comuniquese con Andres para solucionarlo");
            }
        } else if (message.body === "!vervendedores") {
            const propietario = message.from === grupoId ? message.author : message.from;
            let query = "SELECT * FROM ventas WHERE habilitado = 1";
            const resultSelect = await this.executeQuery(query, );
            if(resultSelect.length>0) {
                let mensajes = 'Los artículos en venta son:\n';  // Iniciar el mensaje con una cabecera
                for (let item of resultSelect) {
                    mensajes += 'Identificador: *' + item.id + '* \n'+'Vendedor: *' + item.vendedor.replace("@c.us", "") + '* \n'+'Mensaje: ' + item.mensaje + '\n'+'Fecha de publicado: '+ item.fecha_registro+'\n';  // Añadir cada mensaje de artículo en venta a la lista
                }
                mensajes += "\n*IMPORTANTE* las ventas son principalmente dentro del juego si el vendedor ofrece articulos externos a transacciones que puedas hacer dentro del juego es bajo *TU* responsabilidad.";
                mensajes += "\nRecueda grabar, tomar capturas de pantalla, etc... ya que si algo sale mal puedes reportar al vendedor con el comando *!reportar* y se te pediran estas evidencias para poder hacer el respectivo baneo.";
                mensajes += "\nPara aprender a usar el comando !reportar utiliza el comando !help";
                this.client.sendMessage(propietario, mensajes);  
            } else if(resultSelect.length == 0) {
                this.client.sendMessage(propietario, 'No existen articulos de venta actualmente');
            } else {
                this.client.sendMessage(propietario, 'Hubo un error al intentar obtener sus articulos, comuniquese con Andres para solucionarlo');
            }
        } else if (regexCompro.test(message.body)) {
            const mensajeSinComando = message.body.replace('!compro', "");
            const comprador = message.from === grupoId ? message.author : message.from;
            
            let checkQuery = 'SELECT COUNT(*) AS count FROM compras WHERE comprador = ? AND habilitado = 1';
            const countResult = await this.executeQuery(checkQuery, [comprador]);

            if (countResult[0].count < 2) {
                let query = 'INSERT INTO compras (comprador, mensaje, habilitado) VALUES (?, ?, 1)';
                const resultInto = await this.executeQuery(query, [comprador, mensajeSinComando]);
                if(resultInto) {
                    this.client.sendMessage(comprador, 'El articulo de compra: '+mensajeSinComando+'\n Del propietario: '+comprador+'\n Ha sido correctamente publicado');
                } else {
                    this.client.sendMessage(comprador, 'Hubo un error al intentar referir publicar la compra, comuniquese con Andres para solucionarlo');
                }
            } else {
                this.client.sendMessage(comprador, 'No puede agregar más compras, ya ha alcanzado el límite de registros permitidos (2), primero elimine algun articulo ya existente.');
            }
        } else if (message.body === "!vermiscompras") {
            const propietario = message.from === grupoId ? message.author : message.from;
            console.log(propietario);
            let query = "SELECT * FROM compras WHERE comprador = ? AND habilitado = 1";
            const resultSelect = await this.executeQuery(query, [propietario]);
            if(resultSelect.length>0) {
                let mensajes = 'Sus artículos de compras son:\n';  // Iniciar el mensaje con una cabecera
                for (let item of resultSelect) {
                    mensajes += 'Identificador: *' + item.id + '* \n'+'Mensaje: ' + item.mensaje + '\n'+'Fecha de publicado: '+ item.fecha_registro+'\n';  // Añadir cada mensaje de artículo en venta a la lista
                }
                mensajes += "\nEl *Identificador* es importante si quiere eliminar un arcticulo, los arcticulos se eliminan automaticamente despues de 30 dias de publicados";
                this.client.sendMessage(propietario, mensajes);  
            } else if(resultSelect.length == 0) {
                this.client.sendMessage(propietario, 'Usted no tiene articulos de compra actualmente');
            } else {
                this.client.sendMessage(propietario, 'Hubo un error al intentar obtener sus articulos, comuniquese con Andres para solucionarlo');
            }
        } else if (regexEliminarCompra.test(message.body)) {
            const id = message.body.replace('!eliminarcompra.', "");
            const propietario = message.from === grupoId ? message.author : message.from;
            let query = "UPDATE compras SET habilitado = 0 WHERE id = ? AND comprador = ?";
            const result = await this.executeQuery(query, [id, propietario]);

            // Verificar cuántos registros fueron afectados
            if (result.affectedRows > 0) {
                console.log("Registro eliminado con éxito.");
                this.client.sendMessage(propietario, "El artículo ha sido eliminado correctamente.");
            } else {
                console.log("No se encontró el registro para eliminar o no tienes permiso para eliminarlo.");
                this.client.sendMessage(propietario, "No se pudo eliminar el artículo. Comuniquese con Andres para solucionarlo");
            }
        } else if (message.body === "!vercompradores") {
            const propietario = message.from === grupoId ? message.author : message.from;
            let query = "SELECT * FROM compras WHERE habilitado = 1";
            const resultSelect = await this.executeQuery(query, );
            if(resultSelect.length>0) {
                let mensajes = 'Los artículos de compra son:\n';  // Iniciar el mensaje con una cabecera
                for (let item of resultSelect) {
                    mensajes += 'Identificador: *' + item.id + '* \n'+'Comprador: *' + item.comprador.replace("@c.us", "") + '* \n'+'Mensaje: ' + item.mensaje + '\n'+'Fecha de publicado: '+ item.fecha_registro+'\n';  // Añadir cada mensaje de artículo en venta a la lista
                }
                mensajes += "\n*IMPORTANTE* las compras son principalmente dentro del juego si el comprador busca articulos externos a transacciones que puedas hacer dentro del juego es bajo *TU* responsabilidad.";
                mensajes += "\nRecueda grabar, tomar capturas de pantalla, etc... ya que si algo sale mal puedes reportar al comprador con el comando *!reportar* y se te pediran estas evidencias para poder hacer el respectivo baneo.";
                mensajes += "\nPara aprender a usar el comando !reportar utiliza el comando !help";
                this.client.sendMessage(propietario, mensajes);  
            } else if(resultSelect.length == 0) {
                this.client.sendMessage(propietario, 'No existen articulos de compra actualmente');
            } else {
                this.client.sendMessage(propietario, 'Hubo un error al intentar obtener sus articulos, comuniquese con Andres para solucionarlo');
            }
        } else if (regexReportar.test(message.body)) {
            const matches = message.body.match(regexReportar);
            const tipo = matches[1]; // 'comprador' o 'vendedor'
            const id = matches[2]; // Número como cadena
            const propietario = message.from === grupoId ? message.author : message.from;
            const tabla = tipo === 'comprador' ? 'compras' : 'ventas';
            let checkQuery = `SELECT COUNT(*) AS count FROM ${tabla} WHERE id = ?`;
            const checkResult = await this.executeQuery(checkQuery, [id]);
            if (checkResult[0].count > 0) {
                let reportCheckQuery = "SELECT COUNT(*) AS count FROM reportes WHERE articulo_id = ? AND tipo = ? AND propietario = ?";
                const reportCheckResult = await this.executeQuery(reportCheckQuery, [id, tipo, propietario]);
                if (reportCheckResult[0].count === 0) {
                    let query = "INSERT INTO reportes (articulo_id, tipo, propietario) VALUES (?, ?, ?)";
                    const result = await this.executeQuery(query, [id, tipo, propietario]);
                    // Verificar cuántos registros fueron afectados
                    if (result.affectedRows > 0) {
                        this.client.sendMessage(propietario, "El artículo ha sido reportado exitosamente");
                    } else {
                        this.client.sendMessage(propietario, "No se pudo reportar el artículo. Comuniquese con Andres para solucionarlo");
                    }
                } else {
                    this.client.sendMessage(propietario, "Ya ha reportado este artículo anteriormente. No puede reportarlo nuevamente.");
                }
            } else {
                this.client.sendMessage(propietario, "No se pudo reportar el artículo por que no existe, verifique la informacion e intentelo nuevamente");
            }
        } else if (matchRegexRecortario && celularesMDValidacion) {
            const intervalo = parseInt(matchRegexRecortario[1], 10);
            const duracion = parseInt(matchRegexRecortario[2], 10);
            const texto = matchRegexRecortario[3];
            const usuario = message.from;
            const fechaInicio = new Date();

            // Guardar en la base de datos
            const query = `INSERT INTO recordatorios (usuario, mensaje, intervalo_minutos, duracion_dias, fecha_inicio, activo) VALUES (?, ?, ?, ?, ?, ?)`;
            await this.executeQuery(query, [usuario, texto, intervalo, duracion, fechaInicio, true]);
            
            // Confirmar al usuario 
            if(intervalo >= 1){
                this.sendMessage(usuario, "Recordatorio creado con éxito. Se enviará cada " + intervalo + " minutos durante " + duracion + " días.");
            } else {
                this.sendMessage(usuario, "Recordatorio creado con éxito y agregao a la lista de aleatorios. Ahora podra ser elegible aleatoriamente cada hora durante " + duracion + " días.");
            }
        } else if (regexEliminarRecordatorio.test(message.body) && celularesMDValidacion) {
            const id = message.body.replace('!eliminar.recordatorio.', "");
            console.log(id);
            let query = "UPDATE recordatorios SET activo = false WHERE id = ?";
            const result = await this.executeQuery(query, [id]);
            if (result) {
                this.sendMessage(message.from === grupoId ? message.author : message.from, "El recordatorio con el identificador "+id+" ha sido eliminado con exito");
            } else {
                this.sendMessage(message.from === grupoId ? message.author : message.from, "Error al eliminar el recordatorio, comuniquese con andres");
            }
        } else if (message.body === "!ver.lista.recordatorios" && celularesMDValidacion) {
            let query = "SELECT * FROM recordatorios WHERE activo = true";
            const resultSelect = await this.executeQuery(query, );
            if(resultSelect.length>0) {
                let mensajes = 'Los recordatorios activos son:\n';  // Iniciar el mensaje con una cabecera
                for (let item of resultSelect) {
                    mensajes += 'Identificador: *' + item.id + '* \n'+'Mensaje: ' + item.mensaje + '\n'+'Duracion dias: '+ item.duracion_dias+'\n'+'Intervalo de minutos: '+ item.intervalo_minutos+'\n'+'Fecha inicio: '+ item.fecha_inicio+'\n';
                }
                this.client.sendMessage(message.from === grupoId ? message.author : message.from, mensajes);  
            } else if(resultSelect.length == 0) {
                this.client.sendMessage(message.from === grupoId ? message.author : message.from, 'No existen articulos de venta actualmente');
            } else {
                this.client.sendMessage(message.from === grupoId ? message.author : message.from, 'Hubo un error al intentar obtener sus articulos, comuniquese con Andres para solucionarlo');
            }
        } else if (regexActivarMiembro.test(message.body) && celularesMDValidacion){
            let mensajeSinComando = message.body.replace('!activar ', "");
            mensajeSinComando = mensajeSinComando.toLowerCase();
            mensajeSinComando = mensajeSinComando.charAt(0).toUpperCase() + mensajeSinComando.slice(1);
            console.log(mensajeSinComando);
            let queryVerificado = `SELECT verificado FROM verificados WHERE nombre = ?`;
            try {
                const verificado = await this.executeQuery(queryVerificado, [mensajeSinComando]);
                if (verificado.length > 0 && verificado[0].verificado === 1) {
                    this.client.sendMessage(message.from === grupoId ? message.author : message.from, 'El miembro ' + mensajeSinComando + 'ya esta verificado, intenta con otra persona');
                    return; // Sale de la función si el miembro ya está verificado
                }
            } catch (error) {
                console.error('Error al verificar estado:', error);
                return; // Sale de la función si hay un error al verificar
            }
            let query = `UPDATE verificados SET verificado = 1 WHERE nombre = ? AND whatsapp IS NOT NULL`;
            try {
                const result = await this.executeQuery(query, [mensajeSinComando]);
                if(result.affectedRows === 1){
                    this.client.sendMessage(message.from === grupoId ? message.author : message.from, 'El miembro ' + mensajeSinComando + ' a sido activado correctamente');
                    query = `SELECT GROUP_CONCAT(nombre SEPARATOR ', ') AS nombres, whatsapp FROM verificados WHERE whatsapp IS NOT NULL AND verificado = 1 GROUP BY whatsapp`;
                    try {
                        const result = await this.executeQuery(query, );
                        if(result.length>0) {
                            let mensajes = 'Los miembros del gremio verificados son:\n';  // Iniciar el mensaje con una cabecera
                            for (let item of result) {
                                mensajes += 'Nombre/s: *' + item.nombres + '* \n'+'Whatsapp: ' + item.whatsapp.replace("@c.us", "")+'\n';  // Añadir cada mensaje de artículo en venta a la lista
                            }
                            mensajes += "\nPara verificarte tu tambien usa el comando !verificar (ejemplo !verificar andres)";
                            const chats = await this.client.getChats();
                            const groupName = 'Gremio Gods';
                            const group = chats.find(chat => chat.name === groupName);
                            if (group) {
                                await group.sendMessage(mensajes);
                            }
                        }
                    } catch (error) {
                        console.error('Error al obtener informacion de la base de datos:', error);
                    };
                }
            } catch (error) {
                console.error('Error al obtener oficios en la base de datos:', error);
            };
        } else if(message.body === '!verlistaverificados' && celularesMDValidacion) {
            let query = `SELECT nombre, whatsapp FROM verificados WHERE whatsapp IS NOT NULL AND verificado = 0`;
            try {
                const result = await this.executeQuery(query, );
                if(result.length>0) {
                    let mensajes = 'Los miembros a la espera de una activacion por un mano derecha son:\n';  // Iniciar el mensaje con una cabecera
                    for (let item of result) {
                        mensajes += 'Nombre: *' + item.nombre + '* \n'+'Whatsapp: ' + item.whatsapp.replace("@c.us", "")+'\n';  // Añadir cada mensaje de artículo en venta a la lista
                    }
                    mensajes += "\nPara activar un miembro solo usa el comando !activar (ejemplo !activar andres)";
                    this.client.sendMessage(message.from === grupoId ? message.author : message.from, mensajes); 
                } else {
                    this.client.sendMessage(message.from === grupoId ? message.author : message.from, 'No ahi ningun miembro a la espera de ser verificado'); 
                }
            } catch (error) {
                console.error('Error al obtener oficios en la base de datos:', error);
            };
        } else if(message.body === '!ververificados' && celularesMDValidacion) {
            let query = `SELECT GROUP_CONCAT(nombre SEPARATOR ', ') AS nombres, whatsapp FROM verificados WHERE whatsapp IS NOT NULL AND verificado = 1 GROUP BY whatsapp`;
            try {
                const result = await this.executeQuery(query, );
                if(result.length>0) {
                    let mensajes = 'Los miembros del gremio verificados son:\n';  // Iniciar el mensaje con una cabecera
                    for (let item of result) {
                        mensajes += 'Nombre/s: *' + item.nombres + '* \n'+'Whatsapp: ' + item.whatsapp.replace("@c.us", "")+'\n';  // Añadir cada mensaje de artículo en venta a la lista
                    }
                    mensajes += "\nPara verificarte tu tambien usa el comando !verificar (ejemplo !verificar andres)";
                    this.client.sendMessage(message.from === grupoId ? message.author : message.from, mensajes);
                }
            } catch (error) {
                console.error('Error al obtener informacion de la base de datos:', error);
            };
        } else if (message.from !== grupoId && message.from !== idGrupoReclutadores && message.from !== idGrupoAVAS) {
            this.client.sendMessage(message.from, `Bienvenido a GodsBOT del gremio Gods - Talok 1 - Escribe !help para ver los comandos`);
        }
    }

    async checkAndSendReminders() {
        const now = new Date();
        const query = `SELECT * FROM recordatorios WHERE activo = true`;
        const recordatorios = await this.executeQuery(query);
        const grupoId = '120363255241442636@g.us';
        // Filtrar recordatorios con intervalo_minutos igual a 0
        const recordatoriosCero = recordatorios.filter(rec => rec.intervalo_minutos === 0);
        const recordatoriosOtros = recordatorios.filter(rec => rec.intervalo_minutos > 0);

        // Manejar recordatorios con intervalo_minutos igual a 0
        if (recordatoriosCero.length > 0 && now.getMinutes() === 0) { // Ejecutar al inicio de cada hora
            const randomIndex = Math.floor(Math.random() * recordatoriosCero.length);
            const rec = recordatoriosCero[randomIndex];
            this.sendMessage(grupoId, rec.mensaje);
        }
        for (let rec of recordatoriosOtros) {
            const fechaFin = new Date(rec.fecha_creacion);
            fechaFin.setDate(fechaFin.getDate() + rec.duracion_dias);
    
            if (now > fechaFin) {
                // Desactivar el recordatorio si ha pasado el tiempo de duración
                const deactivateQuery = `UPDATE recordatorios SET activo = false WHERE id = ?`;
                await this.executeQuery(deactivateQuery, [rec.id]);
            } else {
                // Verificar si es hora de enviar el recordatorio
                const ultimaVezEnviado = new Date(rec.fecha_inicio);
                ultimaVezEnviado.setMinutes(ultimaVezEnviado.getMinutes() + rec.intervalo_minutos);
    
                if (now >= ultimaVezEnviado) {
                    // Enviar mensaje
                    this.sendMessage(grupoId, rec.mensaje);
    
                    // Actualizar fecha_inicio para el próximo envío
                    const updateQuery = `UPDATE recordatorios SET fecha_inicio = ? WHERE id = ?`;
                    await this.executeQuery(updateQuery, [new Date(), rec.id]);
                }
            }
        }
    }

    async checkLevelGuild() {
        const query = `SELECT nivel_gremio FROM config`;
        const result = await this.executeQuery(query);

        if (result && result.length > 0) {
            const currentNivelGremio = result[0].nivel_gremio;

            if (this.previousNivelGremio === null) {
                // Primera vez, solo almacena el valor
                this.previousNivelGremio = currentNivelGremio;
                return false;
            } else {
                if (currentNivelGremio !== this.previousNivelGremio) {
                    this.previousNivelGremio = currentNivelGremio; // Actualizar el valor anterior
                    return true;
                } else {
                    return false;
                }
            }
        } else {
            console.error('No se pudo obtener nivel_gremio de la base de datos');
            return false;
        }
    }
    

    async formatDate(year, month, day) {
        const date = new Date(`${year}-${month}-${day}`);
        return date;
    }

    startWeeklyTask() {
        setInterval(() => {
            this.ejecutarCadaDomingo();
        }, 1000);
    }

    async ejecutarCadaDomingo() {
        const ahora = moment();
        console.log(ahora);
        const esDomingo = ahora.day() === 0;
        const esLunes = ahora.day() === 1;
        const esViernes = ahora.day() === 5;
        const esSabado = ahora.day() === 6;
        const esMedianoche = ahora.hours() === 23 && ahora.minutes() === 59 && ahora.seconds() === 59;
        const esCincoDespuesMediaNoche = ahora.hours() === 0 && ahora.minutes() === 4 && ahora.seconds() === 59;
        const cadaMinuto = ahora.seconds() === 59;
        const cadaHora = ahora.minutes() === 22 && ahora.seconds() === 59;
        const xpMinima = '10';
        const xpMaxima = '15';
        const premio = '1 gelanillo';
        let query = '';
        let banderaprueba = true;
        if(cadaMinuto){
            this.checkAndSendReminders();
        }
        if(cadaHora){
            /*const cambioNivelGremio = await this.checkLevelGuild();
            const chats = await this.client.getChats();
            // Iterar sobre los chats para encontrar el grupo específico
            const groupName = 'Gremio Gods'; // Nombre del grupo que deseas encontrar
            const group = chats.find(chat => chat.name === groupName);
            if (group) {
                try {
                    const result = await scrapeMembers('noticias');
                    if(result){
                        const message = '*-----NUEVA NOTICIA-----*\n'+'*Link:* https://www.dofus-touch.com'+result.href + '\n'+'*Titulo:* '+result.text+'\n'+'*Descripcion:* '+result.description;
                        group.sendMessage(message);
                    }
                } catch (error) {
                    console.error('Error al enviar el mensaje:', error);
                }
                if(cambioNivelGremio){
                    const message = 'El nivel del gremio subio a '+this.previousNivelGremio;
                    group.sendMessage(message);
                }
            } else {
                console.log(`No se encontró el grupo ${groupName}`);
            }*/
            await scrapeMembers('habbo');
        }
        if(esLunes && esCincoDespuesMediaNoche) {
            //1 gelanillo por ser parte del grupo de whatsapp
            try {
                const ganadores = await this.seleccionarGanadoresWhatsappYEnviarMensaje();
                console.log('Ganadores seleccionados:', ganadores);
            } catch (error) {
                console.error('Error al seleccionar ganadores:', error);
            }
            query = "SELECT nombre FROM oficios WHERE nombre NOT IN ('Andres', 'Luisa', 'Yaya', 'Dana') AND `nivel` > 100  ORDER BY RAND() LIMIT 1;"
            const chats = await this.client.getChats();
            // Iterar sobre los chats para encontrar el grupo específico
            const groupName = 'Gremio Gods'; // Nombre del grupo que deseas encontrar
            const group = chats.find(chat => chat.name === groupName);
            if (group) {
                try {
                    const result = await this.executeQuery(query, );
                    group.sendMessage('El ganador al azar de 250.000k por cumplir la meta de nivel (+100) es: '+result[0].nombre);
                } catch (error) {
                    console.error('Error al enviar el mensaje:', error);
                } 
                query = "SELECT nombre FROM oficios WHERE nombre NOT IN ('Andres', 'Luisa', 'Yaya', 'Dana') ORDER BY RAND() LIMIT 1;"
                try {
                    const result = await this.executeQuery(query, );
                    group.sendMessage('El ganador de 1 gelanillo por ser parte del gremio DENTRO del juego es: '+result[0].nombre);
                } catch (error) {
                    console.error('Error al enviar el mensaje:', error);
                }
                try {
                    const createTableQuery = `
                        CREATE TEMPORARY TABLE temp_experiencia (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(255),
                            givenExperience BIGINT,
                            timestamp DATETIME
                        );
                    `;
            
                    const insertDataQuery = `
                        INSERT INTO temp_experiencia (name, givenExperience, timestamp)
                        SELECT name, givenExperience, timestamp
                        FROM experiencia
                        WHERE timestamp BETWEEN '2024-06-17 00:00:00' AND '2024-06-24 23:59:59';
                    `;
            
                    const calculateDifferenceQuery = `
                        WITH 
                        FirstExperience AS (
                            SELECT 
                                name, 
                                MIN(timestamp) AS firstTimestamp,
                                MIN(givenExperience) AS firstExperience
                            FROM 
                                temp_experiencia
                            WHERE
                                timestamp >= '2024-06-17 00:00:00'
                            GROUP BY 
                                name
                        ),
                        LastExperience AS (
                            SELECT 
                                name, 
                                MAX(timestamp) AS lastTimestamp,
                                MAX(givenExperience) AS lastExperience
                            FROM 
                                temp_experiencia
                            WHERE
                                timestamp <= '2024-06-24 23:59:59'
                            GROUP BY 
                                name
                        )
                        SELECT 
                            le.name,
                            (le.lastExperience - COALESCE(fe.firstExperience, 0)) AS experienceDifference
                        FROM 
                            LastExperience le
                        LEFT JOIN 
                            FirstExperience fe ON le.name = fe.name
                        WHERE le.name NOT IN ('Andres', 'Luisa', 'Yaya', 'Dana', 'Panteqlo', 'Fabromafis', 'Pandasuma', 'Elvince-Lore', 'Stea', 'Bambola', 'Crujinx')
                        ORDER BY 
                            experienceDifference DESC
                        LIMIT 10;
                    `;
            
                    const dropTableQuery = `
                        DROP TEMPORARY TABLE temp_experiencia;
                    `;
            
                    // Ejecutar las consultas secuencialmente
                    await this.executeQuery(createTableQuery);
                    await this.executeQuery(insertDataQuery);
                    const result = await this.executeQuery(calculateDifferenceQuery);
                    await this.executeQuery(dropTableQuery);
                    let text = 'Los ganadores de los premios fijos son:\n';
                    for (let i = 0; i < result.length; i++) {
                        text += (i + 1) + ') ' + result[i].name + ' con '+result[i].experienceDifference+' de XP'+'\n'; // Asegúrate de usar 'name' en lugar de 'nombre' si la propiedad en el objeto es 'name'
                    }
                    group.sendMessage(text);
            
                    console.log('Final result:', result);
                } catch (error) {
                    console.error('Error executing queries:', error);
                }
            } else {
                console.log(`No se encontró el grupo ${groupName}`);
            }
        }
        if(esMedianoche) { 
            console.log('entre');
            /*await obtenerOficios();
            query = `DELETE FROM compras WHERE DATEDIFF(CURDATE(), fecha_registro) > 30`;
            await this.executeQuery(query, );
            query = `DELETE FROM ventas WHERE DATEDIFF(CURDATE(), fecha_registro) > 30`;
            await this.executeQuery(query, );*/
        }
        if(esViernes && esMedianoche){
            query = `UPDATE config SET xpglobal = ?`;
            await this.executeQuery(query, [xpMaxima]);
        }
        if(esSabado && esMedianoche){
            query = `UPDATE config SET xpglobal = ?`;
            await this.executeQuery(query, [xpMinima]);
        }
    }

    async seleccionarGanadoresWhatsappYEnviarMensaje() {
        try {
            const chats = await this.client.getChats();
            const groupName = 'Gremio Gods';
            const group = chats.find(chat => chat.name === groupName);

            if (group) {
                const members = group.participants;
                const totalMembers = members.length;
                const randomIndex = Math.floor(Math.random() * totalMembers);
                const winner = members[randomIndex].id.user;
                const mention = `${winner}@c.us`;
                const text = `@${winner}`;
                const ganadoresWhatsapp = `El ganador de 1 Gelanillo por ser parte del grupo de whatsapp es: ${text} RECUERDA QUE SI NO ESTÁ EN EL GREMIO PERDIO EL PREMIO :C`;
                await group.sendMessage(ganadoresWhatsapp, { mentions: [mention] });
                return ganadoresWhatsapp;
            } else {
                console.log(`No se encontró el grupo ${groupName}`);
                return 'Grupo no encontrado';
            }
        } catch (error) {
            console.error('Error al seleccionar ganadores y enviar mensaje:', error);
            throw error;
        }
    }
}

// Exportamos una instancia de WhatsAppBot
module.exports = new WhatsAppBot();
