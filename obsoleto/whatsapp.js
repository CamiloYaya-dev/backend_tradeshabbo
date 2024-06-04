const scrapeAlmanax = require("./scrapeAlmanax");
const scrapeMembers = require('./scrapeLeader');
const mysql = require('mysql2/promise');

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment-timezone');

async function enviarMensajeWhatsapp() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',  // Sustituye por tu usuario
    password: '',  // Sustituye por tu contraseña
    database: 'gremio-gods'
  });

  return new Promise((resolve, reject) => {

  const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: "sessions",
    }),
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    }
  });

  

  const grupoId = '120363255241442636@g.us';
  const linkDiscord = 'https://discord.gg/wjUtkV4s';
  const premio = '50.000kk';
  let comandosBot = "COMANDOS DEL BOT: \n";
  comandosBot += "*------Gremio------* \n " ;
  comandosBot += "- *!lider* (llama al lider del gremio) - solo funciona en el grupo de whatsapp \n ";
  comandosBot += "- *!buscarMD* (menciona '@' a todos los Manos Derechas del gremio) - solo funciona en el grupo de whatsapp \n ";
  comandosBot += "- *!notificartodos* Envia un mensaje mencionando '@' a todos los miembros del grupo de whatsapp - solo funciona en el grupo de whatsapp \n ";
  comandosBot += "- *!verificarmiembro* (valida si un miembro es del gremio 'proximamente vinculara el celular del que solicita la verificacion con el nombre del pj') Ejemplo comando: !verificarmiembro andres\n ";
  comandosBot += "- *!nivelgremio* (dice el nivel actual del gremio) \n ";
  comandosBot += "- *!cantidadmiembros* (dice la cantidad de miembros del gremio) \n ";
  comandosBot += "- *!oficio-nombre_del_oficio* (da un listado de todos los miembros del gremio que tienen dicho oficio - ejemplo !oficio-forjados_de_palas o !oficio-minero) \n ";
  comandosBot += "- *!reglas* (da un listado las reglas del gremio) \n";
  comandosBot += "- *!grupo* (te agrega al grupo del gremio automaticamente o te envia el link de invitacion) \n";
  comandosBot += "*------Almanax------* \n " ;
  comandosBot += "- *!almanax* (dice la ofrenda de hoy) \n " ;
  comandosBot += "- *!almanax-año/mes/dia* (dice la ofrenda de una fecha en específico - ejemplo !almanax-2024/05/01) \n ";
  comandosBot += "- *!xpday* (devuelve la fecha y la explicacion del proximo almanax donde la bonificacion sea XP) \n";
  comandosBot += "*------Informativos------* \n " ;
  comandosBot += "- *!discord* (dice el link del servidor de discord) \n ";
  comandosBot += "- *!sorteosactivos* (dice los sorteos activos y requisitos para participar) \n ";
  comandosBot += "- *!horadofus* (dice la hora en dofus) \n";
  comandosBot += "*------Proximamente------* \n " ;
  comandosBot += "- !buscogrupo (próximamente) \n ";
  comandosBot += "- !dejardebuscargrupo (próximamente) \n ";
  comandosBot += "- !verificarmiembrogods (próximamente) \n ";
  comandosBot += "- !nivelgremio (próximamente) \n " ;
  comandosBot += "- !cantidadmiembrosgremio (próximamente) \n ";
  comandosBot += "- !reportarmiembro (próximamente) \n ";
  comandosBot += "- !agregarmiembro (próximamente) ";
  let sorteosActivos = "Los sorteos activos son: \n";
  sorteosActivos += "- 3 Ganadores de 50kk (solo miembros del grupo de whatsapp que esten en el gremio) \n " ;
  sorteosActivos += "- 1 Gelanillo (sin magear) \n " ;
  sorteosActivos += "*Los sorteos se hacen cada DOMINGO A MEDIA NOCHE (HORA COLOMBIA) de manera automatica, se publican los ganadores por el canal de Whatsapp, Discord y en el caso del premio de solo miembros del gremio se deja en los anuncion del gremio.* \n " ;
  let adminsParticipants = [];

  let ganadoresWhatsapp = '';
  
  let reglas = "Estas reglas aplican desde el *30/04/2024* \n\n";
  reglas += "*Reglas:* \n";
  reglas += "-----Gremio----- \n";
  reglas += "-1 Recaudador por persona \n";
  reglas += "-Solo personajes lvl +80 \n";
  reglas += "-----WhatsaApp----- \n";
  reglas += "-No ser ofensivos \n";
  reglas += "-No robar \n";
  reglas += "-No spam \n";
  reglas += "-No CP (Pornografia Infantil) \n";
  reglas += "-No gore \n";
  reglas += "-No zoofilia \n\n";
  reglas += "*Rangos/permisos:* \n";
  reglas += "-Consejero / hablar por canal alianza (49.999 xp o menos) \n";
  reglas += "-Gobernador / permisos anteriores y invitar nuevos miembros (50.000 xp a 249.999 xp) \n";
  reglas += "-Buscador de tesoros / permisos anteriores y distribuir los puntos de xp, poner y recaudar sus recaudadores (250.000 xp a 499.999 xp) \n";
  reglas += "-Diplomatico / permisos anteriores y administrar las reparticiones de xp (500.000 xp a 749.999 xp)\n";
  reglas += "-Guardian / permisos anteriores y ser prioritario en la defensa de los recaudadores (750.000 xp a 999.999 xp)\n";
  reglas += "-Reservista / permisos anteriores y utilizar los cercados (1.000.000 xp a 1.499.999 xp)\n";
  reglas += "-Protector / permisos anteriores y poseer o modificar un prisma de alianza (1.500.000 xp o mas)*. \n";
  reglas += "Los permisos se dan automaticamente al entrar en algun rango de xp donada al gremio";

  client.on('ready', async () => {
    console.log('Client is ready!');
    
    try {
      // Obtener la lista de chats
      const chats = await client.getChats();

      // Iterar sobre los chats para encontrar el grupo específico
      const groupName = 'Gremio Gods'; // Nombre del grupo que deseas encontrar

      const group = chats.find(chat => chat.name === groupName);

      if (group) {
          console.log(`ID del grupo ${groupName}: ${group.id._serialized}`);
          try {
            // Enviar mensaje al grupo
            const groupId = group.id._serialized; // ID del grupo
            const message = 'GodsBOT ON! , escribe !help para ver los comandos'; // Mensaje a enviar
            //await client.sendMessage(groupId, message);
            console.log('Mensaje enviado correctamente al grupo:', groupId);
          } catch (error) {
            console.error('Error al enviar el mensaje:', error);
          }
      } else {
          console.log(`No se encontró el grupo ${groupName}`);
      }
    } catch (error) {
      console.error('Error al obtener la lista de chats:', error);
    }
  });

  client.on('message', async message => {
    const regexAlmanax = /^!almanax-(\d{4})\/(\d{2})\/(\d{2})$/;
    const regexNotificartodos = /^!notificartodos\s+.+$/s;
    const regexVerificarMiembros = /^!verificarmiembro\s+\S+(\s+\S+)*$/gm;
    
    const match = message.body.match(/^!oficio-([^-\s]+)$/);
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
    // Verificar si el mensaje proviene del grupo deseado
    if (message.body === '!grupo') {
      const chats = await client.getChats();
      const groupName = 'Gremio Gods'; // Nombre del grupo que deseas encontrar
      const group = chats.find(chat => chat.name === groupName);

      if (group && group.isGroup) {
          // Asegurarse de que la variable 'group' realmente contiene un grupo
          const participant = message.from.endsWith('@c.us') ? message.from : `${message.from}@c.us`;
          console.log('Grupo:', group.name);
          console.log('Participante a añadir:', participant);
          try {
            await group.addParticipants([participant]);
            client.sendMessage(message.from, `Si por alguna razon, no te agregue automaticamente ingresa atraves de este link: https://chat.whatsapp.com/CSJ1ZgY1QI7KFeNCqwViiz`);
          } catch (error) {
            client.sendMessage(message.from, `Si por alguna razon, no te agregue automaticamente ingresa atraves de este link: https://chat.whatsapp.com/CSJ1ZgY1QI7KFeNCqwViiz`);
          }
      } else {
          console.log('No se encontró el grupo o el nombre no coincide.');
      }
    } else if (message.body === '!almanax') {
      const ofrenda = await scrapeAlmanax('whatsapp');
      if (ofrenda) {
        client.sendMessage(message.from === grupoId ? message.author : message.from, `La ofrenda de hoy en Almanax es: ${ofrenda}`);
      } else {
        client.sendMessage('No se pudo obtener la información del Almanax.');
      }
    } else if (message.body === '!discord') {
      client.sendMessage(message.from === grupoId ? message.author : message.from, `El link de discord es ${linkDiscord}`);
    } else if (message.body === '!help') {
      client.sendMessage(message.from === grupoId ? message.author : message.from, comandosBot);
    } else if (regexAlmanax.test(message.body)) {
      const [, año, mes, dia] = message.body.match(regexAlmanax);
      let fechaAlmanax = formatDate(año, mes, dia);
      let fechaAlmanaxSinHora = fechaAlmanax.toISOString().split('T')[0];
      if (!isNaN(fechaAlmanax)) {
        const ofrenda = await scrapeAlmanax('whatsapp', fechaAlmanaxSinHora);
        if (ofrenda) {
          client.sendMessage(message.from === grupoId ? message.author : message.from, `La ofrenda de hoy en Almanax es: ${ofrenda}`);
        } else {
          client.sendMessage('No se pudo obtener la información del Almanax.');
        }
      } else {
        // La fecha no es válida, maneja este caso adecuadamente
        client.sendMessage(message.from === grupoId ? message.author : message.from, "La fecha proporcionada no es válida.");
      }
    } else if (message.body === '!buscarMD' && message.from === grupoId) {
      const chats = await client.getChats();
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
        client.sendMessage(message.from === grupoId ? message.author : message.from, `El siguiente dia donde ahi bonus de XP es: ${ofrenda}`);
      } else {
        client.sendMessage('No se pudo obtener la información del Almanax.');
      }
    } else if (message.body === '!sorteosactivos') {
      client.sendMessage(message.from, sorteosActivos);
    } else if (regexVerificarMiembros.test(message.body)) {
      client.sendMessage(message.from === grupoId ? message.author : message.from, 'Verificando Miembro.... (30 segundos de espera)');
      (async () => {
        try {
          
          const mensajeSinComando = message.body.replace('!verificarmiembro ', "");
          console.log(mensajeSinComando);
          const resultado = await scrapeMembers(mensajeSinComando);
          console.log(resultado); // Imprime los miembros recolectados
          client.sendMessage(message.from === grupoId ? message.author : message.from, resultado.length === 1 ? 'El miembro ' + resultado + ' esta en el gremio' : 'El miembro ' + mensajeSinComando + ' NO esta el gremio');
        } catch (error) {
          console.error('Error scraping members:', error);
        }
      })();
    } else if (message.body === '!nivelgremio') {
      (async () => {
        try {
          const resultado = await scrapeMembers('!nivelgremio');
          console.log(resultado); // Imprime los miembros recolectados
          client.sendMessage(message.from === grupoId ? message.author : message.from, 'El nivel del gremio es: ' + resultado);
        } catch (error) {
          console.error('Error scraping members:', error);
        }
      })();
    } else if (message.body === '!cantidadmiembros') {
      (async () => {
        try {
          const resultado = await scrapeMembers('!cantidadmiembros');
          console.log(resultado); // Imprime los miembros recolectados
          client.sendMessage(message.from === grupoId ? message.author : message.from, 'El gremio consta de ' + resultado);
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
      client.sendMessage(message.from === grupoId ? message.author : message.from, 'La hora en dofus, la cual es la misma hora que en PARIS/FRANCIA es: '+horaFormateada);
    } else if (message.body === '!lider' && message.from === grupoId) {
      const chats = await client.getChats();
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
    } else if (regexNotificartodos.test(message.body) && (message.from === '573145944184@c.us' || message.from === '573106851098@c.us' || message.from === '573174599152@c.us' ||  message.from === '393276993498@c.us')) {
      console.log('hola');
      const chats = await client.getChats();
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
        let query = `SELECT nombre, oficios FROM oficios WHERE JSON_SEARCH(oficios, 'one', '%${textReplace}%') IS NOT NULL;`
        try {
            const [result] = await connection.execute(query);
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
            client.sendMessage(message.from === grupoId ? message.author : message.from, listadoOficiosGremio.length >= 1 ? `El listado de ${textReplace} del gremio son: \n ${listadoOficiosGremio}` : `No tenemos actualmente ${textReplace} en el gremio :(`);
        } catch (error) {
            console.error('Error al obtener oficios en la base de datos:', error);
        };
        
      } else {
        client.sendMessage(message.from === grupoId ? message.author : message.from, 'Oficio no reconocido');
      }
    } else if (message.body === '!reglas') {
      const chats = await client.getChats();
      // Iterar sobre los chats para encontrar el grupo específico
      const groupName = 'Gremio Gods'; // Nombre del grupo que deseas encontrar
      const group = chats.find(chat => chat.name === groupName);
      if (group) {
        try {
          if (group.description != reglas){
            group.setDescription(reglas);
          }
          client.sendMessage(message.from, reglas);
        } catch (error) {
          console.error('Error al enviar el mensaje:', error);
        }
      } else {
          console.log(`No se encontró el grupo ${groupName}`);
      }
    } else if (message.from !== grupoId) {
      client.sendMessage(message.from, `Bienvenido a GodsBOT del gremio Gods - Talok 1 - Escribe !help para ver los comandos`);
    }
  });

  function formatDate(year, month, day) {
    // Aquí puedes implementar la lógica para validar si la fecha es válida
    // Por ejemplo, puedes usar la clase Date de JavaScript
    const date = new Date(`${year}-${month}-${day}`);
    return date;
  }


  client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
  });

  async function ejecutarCadaDomingo() {
    const ahora = moment();
    const esDomingo = ahora.day() === 0; // El domingo es el día 0 en Moment.js
    const esMedianoche = ahora.hours() === 23 && ahora.minutes() === 59 && ahora.seconds() === 59;
    //console.log(ahora);
    if (esDomingo && esMedianoche) {
      seleccionarGanadoresWhatsappYEnviarMensaje().then(ganadores => {
          resolve(ganadores); // Resuelve la promesa con los ganadores
      }).catch(error => {
          reject(error); // Rechaza la promesa si hay un error
      });
    }
  }

  async function seleccionarGanadoresWhatsappYEnviarMensaje() {
    try {
      const chats = await client.getChats();

      // Iterar sobre los chats para encontrar el grupo específico
      const groupName = 'Gremio Gods'; // Nombre del grupo que deseas encontrar

      const group = chats.find(chat => chat.name === groupName);

      if (group) {
          console.log(`ID del grupo ${groupName}: ${group.id._serialized}`);
          try {
            // Enviar mensaje al grupo
            const members = group.participants;
              
            // Obtener el número total de miembros
            const totalMembers = members.length;
            
            // Generar un número aleatorio entre 1 y el número total de miembros
            const randomIndex1 = Math.floor(Math.random() * totalMembers) + 1;
            const randomIndex2 = Math.floor(Math.random() * totalMembers) + 1;
            const randomIndex3 = Math.floor(Math.random() * totalMembers) + 1;
            
            // Obtener el miembro ganador utilizando el número aleatorio
            const winner1 = members[randomIndex1].id.user;
            const winner2 = members[randomIndex2].id.user;
            const winner3 = members[randomIndex3].id.user;

            let mentions = [];
            let text = '';

            mentions.push(winner1+'@c.us');
            mentions.push(winner2+'@c.us');
            mentions.push(winner3+'@c.us');

            text += `@${winner1} `;
            text += `@${winner2} `;
            text += `@${winner3} `;
            ganadoresWhatsapp = 'los ganadores de '+ premio +' son: ' + text + 'RECUERDEN QUE SI NO ESTAN EN EL GREMIO PERDIERON EL PREMIO :C';
            
            // Enviar un mensaje al grupo mencionando al miembro ganador
            await group.sendMessage(ganadoresWhatsapp, { mentions });
            return ganadoresWhatsapp; // Devuelve los ganadores
          } catch (error) {
            console.error('Error al enviar el mensaje:', error);
          }
      } else {
          console.log(`No se encontró el grupo ${groupName}`);
      }
    } catch (error) {
      console.error('Error al seleccionar ganadores y enviar mensaje:', error);
    }
  }

  setInterval(ejecutarCadaDomingo, 1000);
  client.initialize();
  });
}

module.exports = enviarMensajeWhatsapp;
