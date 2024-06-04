const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment-timezone');

const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }
  };

async function scrapeAlmanax(canal, fecha = '', razon = '') {
    try {
        const timeZone = 'Europe/Paris'; // Zona horaria de París
        let fechaRequerida = fecha ? moment(fecha).format('YYYY-MM-DD') : moment().tz(timeZone).format('YYYY-MM-DD'); // Obtener la hora actual en París
        let textoDivMid = '';
        let ofrenda = '';
        if(razon != ''){
            while (!textoDivMid.includes("experiencia")) {
                const response = await axios.get('https://www.krosmoz.com/es/almanax/'+fechaRequerida, options);
                const $ = cheerio.load(response.data);

                // Encuentra el elemento con el id "achievement_dofus" y obtén su contenido
                const elementos = $('#achievement_dofus');
                if (elementos.length > 1) {
                    const segundoElemento = elementos.eq(1);
                    const divTop = segundoElemento.find('div.top'); //imprime
                    const divMid = segundoElemento.find('.mid');
                    divMid.contents().each(function() {
                        if (this.nodeType === 3 && this.nodeValue.trim() === '') {
                            $(this).remove(); // Elimina nodos de texto que son solo espacios en blanco
                        }
                    });
                    divMid.find('span').first().remove();
                    const divMore = divMid.find('.more');
                    const divB = divMid.find('b');
                    const divMoreInfos = divMid.find('.more-infos');
                    const divP = divMoreInfos.find('p');
                    const divFleft = divMoreInfos.find('.fleft');
                    if (divTop.length > 0) {
                        const textoDivTop = divTop.text().trim();
                        textoDivMid = divMid.contents().first().text().trim();
                        const textoDivMore = divMore.contents().first().text().trim();
                        const textoDivB = divB.text().trim();
                        const textoDivP= divP.contents().first().text().trim();
                        const textoDivFleft= divFleft.contents().first().text().trim();
                        if (canal === 'discord'){
                            ofrenda = textoDivTop + " <:iconodofustouch:1232105994482356224> \n " + textoDivMid;
                            if (textoDivMid.includes("experiencia")) {
                                ofrenda += " <:xp:1232108389325340694> \n";
                                ofrenda += textoDivMore + textoDivB + " <:lvlup:1232109870967422976> \n";
                            } else {
                                ofrenda += textoDivMore + textoDivB + "\n";
                            }
                            ofrenda += textoDivP + "\n";
                            ofrenda += textoDivFleft
                        } else if (canal === "whatsapp"){
                            ofrenda = fechaRequerida + " \n\n "; 
                            ofrenda += textoDivTop + " \n\n " + textoDivMid + " \n\n";
                            ofrenda += textoDivMore + textoDivB + " \n\n";
                            ofrenda += textoDivP + "\n";
                            ofrenda += textoDivFleft
                        }
                    } else {
                        console.log("No se encontró un div con clase 'top' dentro del segundo elemento con el ID 'achievement_dofus'");
                    }
                } else {
                    console.log("No se encontró un segundo elemento con el ID 'achievement_dofus'");
                }
                // Aumentar la fecha requerida en un día para la próxima iteración
                fechaRequerida = moment(fechaRequerida).add(1, 'day').format('YYYY-MM-DD');
            }
        } else {
            const response = await axios.get('https://www.krosmoz.com/es/almanax/'+fechaRequerida, options);
            const $ = cheerio.load(response.data);

            // Encuentra el elemento con el id "achievement_dofus" y obtén su contenido
            const elementos = $('#achievement_dofus');
            if (elementos.length > 1) {
                const segundoElemento = elementos.eq(1);
                const divTop = segundoElemento.find('div.top'); //imprime
                const divMid = segundoElemento.find('.mid');
                divMid.contents().each(function() {
                    if (this.nodeType === 3 && this.nodeValue.trim() === '') {
                        $(this).remove(); // Elimina nodos de texto que son solo espacios en blanco
                    }
                });
                divMid.find('span').first().remove();
                const divMore = divMid.find('.more');
                const divB = divMid.find('b');
                const divMoreInfos = divMid.find('.more-infos');
                const divP = divMoreInfos.find('p');
                const divFleft = divMoreInfos.find('.fleft');
                if (divTop.length > 0) {
                    const textoDivTop = divTop.text().trim();
                    textoDivMid = divMid.contents().first().text().trim();
                    const textoDivMore = divMore.contents().first().text().trim();
                    const textoDivB = divB.text().trim();
                    const textoDivP= divP.contents().first().text().trim();
                    const textoDivFleft= divFleft.contents().first().text().trim();
                    if (canal === 'discord'){
                        ofrenda = textoDivTop + " <:iconodofustouch:1232105994482356224> \n " + textoDivMid;
                        if (textoDivMid.includes("experiencia")) {
                            ofrenda += " <:xp:1232108389325340694> \n";
                            ofrenda += textoDivMore + textoDivB + " <:lvlup:1232109870967422976> \n";
                        } else {
                            ofrenda += textoDivMore + textoDivB + "\n";
                        }
                        ofrenda += textoDivP + "\n";
                        ofrenda += textoDivFleft
                    } else if (canal === "whatsapp"){
                        ofrenda = textoDivTop + " \n\n " + textoDivMid + " \n\n";
                        ofrenda += textoDivMore + textoDivB + " \n\n";
                        ofrenda += textoDivP + "\n";
                        ofrenda += textoDivFleft
                    }
                } else {
                    console.log("No se encontró un div con clase 'top' dentro del segundo elemento con el ID 'achievement_dofus'");
                }
            } else {
                console.log("No se encontró un segundo elemento con el ID 'achievement_dofus'");
            }
        }
        return ofrenda;

    } catch (error) {
        console.error('Error al obtener la información del Almanax:', error);
        return null;
    }
}

module.exports = scrapeAlmanax;
