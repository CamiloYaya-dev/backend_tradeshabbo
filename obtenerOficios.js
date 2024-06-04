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

async function obtenerOficios() {
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null, // Asegura que no se limite el tamaño de la ventana
        args: ['--window-size=1920,1080'] // Ajusta esto a las dimensiones deseadas
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');

    // Activar la interceptación de solicitudes aquí
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.resourceType() === 'image' && request.url().endsWith('.png')) {
            request.abort();
        } else {
            request.continue();
        }
    });
    let allMembers = [];
    await page.goto('https://www.dofus-touch.com/es/mmorpg/comunidad/directorios/paginas-gremios/1100502-gods/miembros?page=1', { waitUntil: 'networkidle0' });

    let currentPage = 1;  // Inicializar el contador de la página actual
    let lastPageProcessed = false;  // Bandera para indicar si la última página ya fue procesada

    while (true) {
        console.log('Inicio de captura de página...');
        await page.waitForSelector('.ak-pagination'); // Asegúrate de que la paginación esté cargada
        try {
            await page.waitForSelector('table tbody tr', {timeout: 0}); // Espera a que las filas de la tabla estén visibles
            let html = await page.content();
            let $ = cheerio.load(html);
            let memberRows = $('table tbody tr');
            for (let j = 0; j < memberRows.length; j++) {
                let name = $(memberRows[j]).find('td').first().find('a').text().trim();
                let link = $(memberRows[j]).find('td').first().find('a').attr('href');
                let level = $(memberRows[j]).find('td').eq(2).text().trim();
                if (link) {
                    await page.goto(`https://www.dofus-touch.com${link}`, { waitUntil: 'networkidle0', timeout: 0});
                    let detailHtml = await page.content();
                    let $detail = cheerio.load(detailHtml);
                    let jobs = [];
                    let allElements = $detail('div.ak-container.ak-content-list .ak-list-element');
                    let listJobs = allElements.filter(function() {
                        let classList = $detail(this).attr('class').split(/\s+/);
                        return classList.some(cls => /^ak-infos-job-\d+$/.test(cls));
                    });
                    listJobs.each(function () {
                        let jobTitle = $detail(this).find('.ak-title a').text().trim();
                        let jobLevel = $detail(this).find('.ak-text').text().trim();
                        jobs.push({
                            oficio: jobTitle,
                            nivel: jobLevel
                        });
                    });
                    allMembers.push({
                        name: name.toLowerCase(),
                        jobs: jobs,
                        level: level
                    });
                }
            }

            if (lastPageProcessed) {
                console.log('Última página ya fue procesada. Finalizando captura.');
                break;
            }

            // Volver a la página inicial
            await page.goto('https://www.dofus-touch.com/es/mmorpg/comunidad/directorios/paginas-gremios/1100502-gods/miembros?page=1', { waitUntil: 'networkidle0' });
            // Avanzar a la página siguiente según el contador actual
            for (let i = 1; i <= currentPage; i++) {
                await page.click('.ak-pagination li:nth-last-child(2) a'); // Hacer clic en "›" la cantidad de veces necesaria
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
            }
            currentPage++;  // Incrementar el contador de la página para el próximo ciclo

            // Verificar si el botón está deshabilitado
            const nextPageButton = await page.$('.ak-pagination li:nth-last-child(2) a'); // Seleccionar el enlace "›"
            const isDisabled = await page.evaluate(el => el.textContent.trim() === '›' && el.parentElement.classList.contains('disabled'), nextPageButton);
            if (isDisabled) {
                console.log('Última página alcanzada.');
                lastPageProcessed = true;  // Marcar la última página como procesada
            }
        } catch (error) {
            console.error('Error al capturar esta página: ' + error.message);
            break;
        }
    }
    await page.close();
    let placeholders = [];
    let values = [];
    let query = '';
    for (const member of allMembers) {
        const name = member.name;
        const jobs = JSON.stringify(member.jobs);  // Convierte los trabajos en una cadena JSON para almacenarlos
        const level = member.level;
        placeholders.push('(?, ?, ?)');
        values.push(name, jobs, level);
        query = `UPDATE referidos SET verificado = 1, nivel = ${level} WHERE invitado = '${name}'`
        await pool.execute(query);
    }
    query = 'TRUNCATE TABLE oficios';
    try {
        const [result] = await pool.execute(query);
        console.log('Tabla vaciada:', result);
    } catch (error) {
        console.error('Error al vaciar en la base de datos:', error);
    }
    query = `INSERT INTO oficios (nombre, oficios, nivel) VALUES ${placeholders.join(', ')}`;

    try {
        const [result] = await pool.execute(query, values);
        console.log('Insertados:', result);
    } catch (error) {
        console.error('Error al insertar en la base de datos:', error);
    }
    query = 'DELETE o1 FROM oficios o1 INNER JOIN (SELECT MIN(id) as id, nombre FROM oficios GROUP BY nombre HAVING COUNT(*) > 1) o2 ON o1.nombre = o2.nombre AND o1.id > o2.id;';
    try {
        const [result] = await pool.execute(query);
        console.log('Eliminados duplicados:', result);
    } catch (error) {
        console.error('Error al eliminar duplicados en la base de datos:', error);
    }
    query = 'DELETE FROM verificados WHERE nombre NOT IN (SELECT nombre FROM oficios);';
    try {
        const [result] = await pool.execute(query);
        console.log('Elementos eliminados:', result);
    } catch (error) {
        console.error('Error al eliminar duplicados en la base de datos:', error);
    }
}

module.exports = obtenerOficios;
