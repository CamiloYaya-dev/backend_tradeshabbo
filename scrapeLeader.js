const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',  // Sustituye por tu usuario
    password: '',  // Sustituye por tu contraseña
    database: 'gremio-gods',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Definimos la función que deseamos exportar
async function scrapeMembers(parametro) {
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        headless: true, // Cambia a true si no necesitas la interfaz gráfica
        args: ['--start-minimized'] // Esto intentará iniciar el navegador minimizado
    });

    let nivelGremio = '';
    let cantidadMiembros = '';
    let noticias = [];
    let banderaNoticias = false;
    if(parametro === "!nivelgremio" || parametro === "!cantidadmiembros"){
        const page = await browser.newPage();
        const url = `https://www.dofus-touch.com/es/mmorpg/comunidad/directorios/paginas-gremios/1100502-gods/miembros?page=1`;
        try {
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 5000 }); // Intenta cargar la página con un timeout
            const html = await page.content();
            const $ = cheerio.load(html);
            nivelGremio = $('.ak-directories-level').text().trim();
            cantidadMiembros = $('.ak-directories-breed').text().trim();
            await page.close();
        } catch (error) {
            console.error('Timeout alcanzado, capturando la página como está...');
            const html = await page.content();
            const $ = cheerio.load(html);
            nivelGremio = $('.ak-directories-level').text().trim();
            cantidadMiembros = $('.ak-directories-breed').text().trim();
            await page.close();
        }
    } else if (parametro === 'noticias') {
        const page = await browser.newPage();
        const url = `https://www.dofus-touch.com/es/mmorpg/actualidad/noticias`;
        try {
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 }); // Intenta cargar la página con un timeout
            const html = await page.content();
            const $ = cheerio.load(html);
            $('.ak-text').each((index, element) => {
                const firstAnchor = $(element).find('a').first(); // Selecciona solo la primera etiqueta <a>
                const href = firstAnchor.attr('href').trim(); // Obtiene el atributo href
                const text = firstAnchor.text().trim(); // Obtiene el texto dentro de la etiqueta <a>
                // Obteniendo la descripción del elemento 'ak-item-elt-desc'
                const description = $(element).closest('.ak-item-elt-content').find('.ak-item-elt-desc').text().trim();
                noticias.push({ href, text, description });
            });
            const [rows] = await pool.execute("SELECT href, text, description FROM noticias ORDER BY id DESC LIMIT 1");
            if (rows.length > 0) {
                let lastDbNews = rows[0];
                let lastScrapedNews = noticias[0];  // Ahora noticias[0] es efectivamente el último noticia scrapeada después de reverse()
                
                // Comparar el último registro de la base de datos con la última noticia scrapeada
                if (lastDbNews.href === lastScrapedNews.href && lastDbNews.text === lastScrapedNews.text && lastDbNews.description === lastScrapedNews.description) {
                    console.log("No hay noticias nuevas para agregar.");
                } else {
                    const query = "INSERT INTO noticias (href, text, description) VALUES (?, ?, ?)";
                    await pool.execute(query, [noticias[0].href, noticias[0].text, noticias[0].description]);
                    console.log("Noticia nueva agregada con éxito.");
                    banderaNoticias = true;
                }
            }
            // Si la noticia es nueva o no hay registros en la base de datos, insertar la noticia
            await page.close();
        } catch (error) {
            console.error('Timeout alcanzado, capturando la página como está...');
        }
        
    } else if (parametro === 'habbo') {
        await updateHabboData();
    }
    //await page.close();
    await browser.disconnect(); // Desconectar el navegador al finalizar
    if(parametro === "!nivelgremio"){
        return nivelGremio;
    } else if (parametro === "!cantidadmiembros") {
        return cantidadMiembros;
    } else if (noticias){
        if(banderaNoticias){
            return noticias[0];
        } else {
            return false;
        }
    }
}

async function fetchCheckinCount(url, query) {
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        headless: true, // Cambia a true si no necesitas la interfaz gráfica
        args: ['--start-minimized'] // Esto intentará iniciar el navegador minimizado
    });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });
        const html = await page.content();
        const $ = cheerio.load(html);
        const checkinCount = $('.habbo__origins__checkin__count.ng-binding').text().trim();
        await pool.execute(query, [checkinCount]);
    } catch (error) {
        console.error(`Error al cargar la página ${url}:`, error);
    } finally {
        await page.close();
    }
}

async function updateHabboData() {
    console.log("entre");
    const urls = [
        { url: 'https://origins.habbo.es/', query: 'UPDATE config SET habbo_es = ?' },
        { url: 'https://origins.habbo.com.br/', query: 'UPDATE config SET habbo_br = ?' },
        { url: 'https://origins.habbo.com/', query: 'UPDATE config SET habbo_com = ?' }
    ];

    for (const { url, query } of urls) {
        await fetchCheckinCount(url, query);
    }
}

// Exportamos la función
module.exports = scrapeMembers;
