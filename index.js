const express = require('express');
const multer = require('multer');

const app = express();
//const whatsappBot = require('./whatsappRefactor.js');
const initializeDatabase = require('./database.js');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');


// Configuración de multer para guardar en ./salas
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'salas')); // Guardar en ./salas
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Guardar el archivo con su nombre original
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen.'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite de tamaño de archivo: 5MB
});

app.use('/salas', express.static(path.join(__dirname, 'salas')));

//comentar para enviar peticiones postman.
/*app.use((req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'JWT no proporcionado' });
    }

    try {
        // Desencriptar el JWT y obtener el API key
        const decoded = jwt.verify(token, 'b3f5d8c4e9a8f2c3d6b7e1a2c9f4b8d7a6e5f3c2d1b4a9f8c7e6d5b4a1c3e7f6');
        const apiKey = decoded.apiKey;

        // Validar el API key desencriptado
        if (apiKey === '4c5d8e1f2a3b4c5d6e7f8g9h0a1b2c3d4e5f') {
            next(); // Continuar con la solicitud
        } else {
            res.status(403).json({ error: 'API key inválido' });
        }
    } catch (error) {
        console.error('Error al verificar el JWT:', error);
        res.status(403).json({ error: 'JWT inválido o desencriptación fallida' });
    }
});*/

app.post('/upload-image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se ha recibido ninguna imagen.');
    }

    try {
        res.status(201).json({ message: 'Imagen subida exitosamente', filename: req.file.filename });
    } catch (error) {
        console.error('Error al guardar la imagen:', error);
        res.status(500).send('Error al guardar la imagen');
    }
});

app.get('/get-images', (req, res) => {
    const directoryPath = path.join(__dirname, 'salas');

    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Error al leer el directorio:', err);
            return res.status(500).send('Error al obtener las imágenes.');
        }

        // Crear una lista de URLs para cada imagen
        const imageUrls = files.map(file => {
            return `${req.protocol}://${req.get('host')}/salas/${file}`;
        });

        res.status(200).json({ images: imageUrls });
    });
});

app.use(express.json());

app.delete('/delete-image', (req, res) => {
    const { messageid } = req.body;
    if (!messageid) {
        return res.status(400).json({ error: 'El messageid es requerido.' });
    }

    const directoryPath = path.join(__dirname, 'salas');

    // Leer los archivos del directorio ./salas
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Error al leer el directorio:', err);
            return res.status(500).json({ error: 'Error al acceder a los archivos.' });
        }

        // Buscar el archivo que coincida con el messageid
        const fileToDelete = files.find(file => file.includes(`_${messageid}.`));

        if (!fileToDelete) {
            return res.status(404).json({ error: 'Archivo no encontrado.' });
        }

        // Eliminar el archivo
        const filePath = path.join(directoryPath, fileToDelete);
        fs.unlink(filePath, err => {
            if (err) {
                console.error('Error al eliminar el archivo:', err);
                return res.status(500).json({ error: 'Error al eliminar el archivo.' });
            }

            res.status(200).json({ message: 'Archivo eliminado exitosamente.' });
        });
    });
});


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

app.get('/habbo-catalog', async (req, res) => {
    try {
        const db = await getDatabaseConnection();
        const [config] = await db.query('SELECT * FROM catalogo');
        res.json(config);
    } catch (error) {
        console.error('Error en la consulta a la base de datos:', error);
        res.status(500).send('Error al realizar la consulta');
    }
});

app.get('/habbo-price-history', async (req, res) => {
    try {
        const db = await getDatabaseConnection();
        const [config] = await db.query(
            "SELECT id, product_id, CONVERT_TZ(fecha_precio, '+00:00', '-05:00') AS fecha_precio, precio, hotel, user_modify FROM price_history;"
        );
        res.json(config);
    } catch (error) {
        console.error('Error en la consulta a la base de datos:', error);
        res.status(500).send('Error al realizar la consulta');
    }
});

app.get('/habbo-online', async (req, res) => {
    try {
        const db = await getDatabaseConnection();
        const [config] = await db.query(
            "SELECT habbo_es, habbo_br, habbo_com FROM config"
        );
        res.json(config);
    } catch (error) {
        console.error('Error en la consulta a la base de datos:', error);
        res.status(500).send('Error al realizar la consulta');
    }
});

app.post('/habbo-update-catalog', async (req, res) => {
    try {
        const db = await getDatabaseConnection();

        // Obtener los datos de la solicitud
        const { id, price, lang, user_id } = req.body;

        // Validar que todos los campos necesarios estén presentes
        if (!id || !price || !lang || !user_id) {
            return res.status(400).json({
                error: 'Los campos id, price, lang y user_id son obligatorios'
            });
        }

        // Validar el idioma
        if (!['ES', 'US'].includes(lang)) {
            return res.status(400).json({
                error: 'El campo lang debe ser "es" o "us"'
            });
        }

        // Verificar si el usuario tiene el permiso adecuado
        const [permissionCheck] = await db.query(
            `SELECT 1 
             FROM user_permissions 
             WHERE user_id = ? 
               AND permission_id = 1 
               AND (country = ? OR country = 'ES-US')`,
            [user_id, lang]
        );

        if (!permissionCheck.length) {
            return res.status(403).json({
                error: 'No tienes permisos para realizar esta acción'
            });
        }
        // Actualizar el precio en la tabla catalogo
        if (lang === 'ES') {
            await db.query(
                'UPDATE catalogo SET price = ?, upvotes = 0, downvotes = 0, upvotes_belief = 0, downvotes_belief = 0 WHERE id = ?',
                [price, id]
            );
        } else if (lang === 'US') {
            await db.query(
                'UPDATE catalogo SET usa_price = ?, upvotes = 0, downvotes = 0, upvotes_belief = 0, downvotes_belief = 0 WHERE id = ?',
                [price, id]
            );
        }

        const result = await db.query(
            'SELECT username FROM users WHERE id = ?',
            [user_id]
        );
        
        const user = result[0]; // Acceder al primer elemento del array
        
        if (!user) {
            throw new Error('Usuario no encontrado.');
        }
        
        const username = user[0].username;

        // Insertar un nuevo registro en price_history
        await db.query(
            'INSERT INTO price_history (product_id, precio, hotel, user_modify) VALUES (?, ?, ?, ?)',
            [id, price, lang === 'ES' ? 'ES' : 'US', username]
        );

        res.status(200).json({
            message: 'Precio actualizado correctamente'
        });
    } catch (error) {
        console.log("error");
        console.error('Error en la consulta a la base de datos:', error);
        res.status(500).json({
            error: 'Error al realizar la consulta'
        });
    }
});

app.get('/contador-visitas', async (req, res) => {
    try {
        const db = await getDatabaseConnection();
        
        await db.query('UPDATE config SET contador_visitas = contador_visitas + 1 WHERE id = 1');
        
        const [rows] = await db.query('SELECT contador_visitas FROM config WHERE id = 1');
        
        if (rows.length > 0) {
            res.json({ contador_visitas: rows[0].contador_visitas });
        } else {
            res.status(404).send('Registro no encontrado');
        }
    } catch (error) {
        console.error('Error en la consulta a la base de datos:', error);
        res.status(500).send('Error al realizar la consulta');
    }
});

app.get('/contador-votos', async (req, res) => {
    try {
        const db = await getDatabaseConnection();
        
        const [rows] = await db.query('SELECT contador_votos FROM config WHERE id = 1');
        
        if (rows.length > 0) {
            res.json({ contador_votos: rows[0].contador_votos });
        } else {
            res.status(404).send('Registro no encontrado');
        }
    } catch (error) {
        console.error('Error en la consulta a la base de datos:', error);
        res.status(500).send('Error al realizar la consulta');
    }
});

app.post('/encuestas', async (req, res) => {
    const { encuesta_id, imagen, modo, duracion, activa } = req.body;
    try {
        const db = await getDatabaseConnection();
        const [result] = await db.query('INSERT INTO encuestas (encuesta_id, imagen, modo, duracion, activa) VALUES (?, ?, ?, ?, ?)', [encuesta_id, imagen, modo, duracion, activa]);
        res.status(201).json({ encuesta_id: result.insertId });
    } catch (error) {
        console.error('Error al insertar encuesta:', error);
        res.status(500).send('Error al insertar encuesta');
    }
});

app.put('/encuestas/:id/inactivar', async (req, res) => {
    const encuestaId = req.params.id;
    try {
        const db = await getDatabaseConnection();
        await db.query('UPDATE encuestas SET activa = 0 WHERE encuesta_id = ?', [encuestaId]);
        res.status(200).send('Encuesta inactivada correctamente');
    } catch (error) {
        console.error('Error al inactivar encuesta:', error);
        res.status(500).send('Error al inactivar encuesta');
    }
});


app.post('/opciones', async (req, res) => {
    const { encuesta_id, opcion_texto, opcion_discord_id } = req.body;
    try {
        const db = await getDatabaseConnection();
        await db.query('INSERT INTO opciones (encuesta_id, opcion_texto, opcion_discord_id) VALUES (?, ?, ?)', [encuesta_id, opcion_texto, opcion_discord_id]);
        const [result] =  await db.query('SELECT * FROM opciones WHERE encuesta_id = ? AND opcion_texto = ? AND opcion_discord_id = ?', [encuesta_id, opcion_texto, opcion_discord_id]);
        res.status(201).json({ data: result });
    } catch (error) {
        console.error('Error al insertar opción:', error);
        res.status(500).send('Error al insertar opción');
    }
});

app.post('/votos', async (req, res) => {
    const { encuesta_id, opcion_id, usuario_id } = req.body;
    try {
        const db = await getDatabaseConnection();
        const [result] = await db.query('INSERT INTO votos (encuesta_id, opcion_id, usuario_id) VALUES (?, ?, ?)', [encuesta_id, opcion_id, usuario_id]);
        res.status(201).json({ voto_id: result.insertId });
    } catch (error) {
        console.error('Error al insertar voto:', error);
        res.status(500).send('Error al insertar voto');
    }
});

app.post('/nueva-noticia', async (req, res) => {
    const { titulo, imagen_completa, alt_imagen_completa, descripcion_completa, imagen_resumida, alt_imagen_resumida, descripcion_resumida, hotel } = req.body;
    try {
        const db = await getDatabaseConnection();
        const [result] = await db.query('INSERT INTO noticias (titulo, imagen_completa, alt_imagen_completa, descripcion_completa, imagen_resumida, alt_imagen_resumida, descripcion_resumida, hotel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [titulo, imagen_completa, alt_imagen_completa, descripcion_completa, imagen_resumida, alt_imagen_resumida, descripcion_resumida, hotel]);
        res.status(201).json({ noticia_id: result.insertId });
    } catch (error) {
        console.error('Error al insertar la noticia:', error);
        res.status(500).send('Error al insertar noticia');
    }
});

app.get('/noticias', async (req, res) => {
     try {
        const db = await getDatabaseConnection();
        const [result] = await db.query('SELECT * FROM noticias');
        res.status(201).json({data: result });
    } catch (error) {
        console.error('Error al insertar la noticia:', error);
        res.status(500).send('Error al insertar noticia');
    }
});

app.post('/nueva-noticia-oficial', async (req, res) => {
    const { titulo, link, hotel } = req.body;
    try {
        const db = await getDatabaseConnection();
        const [result] = await db.query('INSERT INTO noticias_oficiales (title, link, hotel) VALUES (?, ?, ?)', [titulo, link, hotel]);
        res.status(201).json({ noticia_id: result.insertId });
    } catch (error) {
        console.error('Error al insertar la noticia:', error);
        res.status(500).send('Error al insertar la noticia oficial');
    }
});

app.get('/noticias-oficiales', async (req, res) => {
    try {
       const db = await getDatabaseConnection();
       const [result] = await db.query('SELECT * FROM noticias_oficiales');
       res.status(201).json({data: result });
   } catch (error) {
       console.error('Error al insertar la noticia:', error);
       res.status(500).send('Error al insertar noticia oficial');
   }
});

app.delete('/votos', async (req, res) => {
    const { encuesta_id, opcion_id, usuario_id } = req.body;
    try {
        const db = await getDatabaseConnection();
        const [result] = await db.query('DELETE FROM votos WHERE encuesta_id = ? AND opcion_id = ? AND usuario_id = ?', [encuesta_id, opcion_id, usuario_id]);

        if (result.affectedRows === 0) {
            return res.status(404).send('Voto no encontrado');
        }

        res.status(200).send('Voto eliminado correctamente');
    } catch (error) {
        console.error('Error al eliminar voto:', error);
        res.status(500).send('Error al eliminar voto');
    }
});

app.put('/votos', async (req, res) => {
    const { encuesta_id, opcion_id, usuario_id } = req.body;
    try {
        const db = await getDatabaseConnection();
        const [result] = await db.query('UPDATE votos SET opcion_id = ? WHERE encuesta_id = ? AND usuario_id = ?', [opcion_id, encuesta_id, usuario_id]);

        if (result.affectedRows === 0) {
            return res.status(404).send('Voto no encontrado');
        }

        res.status(200).send('Voto actualizado correctamente');
    } catch (error) {
        console.error('Error al actualizar voto:', error);
        res.status(500).send('Error al actualizar voto');
    }
});


app.get('/encuestas', async (req, res) => {
    try {
        const db = await getDatabaseConnection();
        const [encuestas] = await db.query('SELECT * FROM encuestas');
        res.json(encuestas);
    } catch (error) {
        console.error('Error al obtener encuestas:', error);
        res.status(500).send('Error al obtener encuestas');
    }
});


app.get('/encuestas/:id', async (req, res) => {
    const encuestaId = req.params.id;
    try {
        const db = await getDatabaseConnection();
        const [encuesta] = await db.query('SELECT * FROM encuestas WHERE encuesta_id = ?', [encuestaId]);

        if (encuesta.length === 0) {
            return res.status(404).send('Encuesta no encontrada');
        }

        const [opciones] = await db.query('SELECT * FROM opciones WHERE encuesta_id = ?', [encuestaId]);
        res.json({ ...encuesta[0], opciones });
    } catch (error) {
        console.error('Error al obtener la encuesta:', error);
        res.status(500).send('Error al obtener la encuesta');
    }
});

app.post('/guardar_invitaciones', async (req, res) => {
    const updates = req.body;

    try {
        const db = await getDatabaseConnection();

        for (const update of updates) {
            const { code, uses, inviterId } = update;

            // Verificar si el registro con el code existe
            const [rows] = await db.query('SELECT id FROM invitaciones_discord WHERE code = ?', [code]);

            if (rows.length > 0) {
                // Si existe, actualizar el campo 'uses'
                await db.query('UPDATE invitaciones_discord SET uses = ? WHERE code = ?', [uses, code]);
            } else {
                // Si no existe, insertar un nuevo registro
                await db.query('INSERT INTO invitaciones_discord (code, uses, inviterId) VALUES (?, ?, ?)', [code, uses, inviterId]);
            }
        }

        res.status(201).json({ message: 'Invitaciones guardadas correctamente.' });
    } catch (error) {
        console.error('Error al insertar o actualizar la invitación:', error);
        res.status(500).send('Error al procesar las invitaciones.');
    }
});

app.get('/invitaciones', async (req, res) => {
    try {
        const db = await getDatabaseConnection();
        const [invitaciones] = await db.query('SELECT * FROM invitaciones_discord');
        res.json(invitaciones);
    } catch (error) {
        console.error('Error las invitaciones:', error);
        res.status(500).send('Error las invitaciones');
    }
});

app.post('/competicion-invitacion', async (req, res) => {
    const { nuevoUsuarioId, nuevoUsuarioTag, invitadoId, invitadoTag, invitacionCode } = req.body;
    try {
        const db = await getDatabaseConnection();
        const [result] = await db.query('INSERT INTO competicion_invitacion (nuevoUsuarioId, nuevoUsuarioTag, invitadoId, invitadoTag, invitacionCode) VALUES (?, ?, ?, ?, ?)', [nuevoUsuarioId, nuevoUsuarioTag, invitadoId, invitadoTag, invitacionCode]);
        res.status(201).json({ noticia_id: result.insertId });
    } catch (error) {
        console.error('Error al insertar el registro:', error);
        res.status(500).send('Error al insertar el registro');
    }
});

app.post('/actualizar_uso_invitacion', async (req, res) => {
    const { code, uses } = req.body;
    try {
        const db = await getDatabaseConnection();
        await db.query('UPDATE invitaciones_discord SET uses = ? WHERE code = ?', [uses, code]);
        res.status(201).json({ noticia_id: result.insertId });
    } catch (error) {
        console.error('Error al insertar el registro:', error);
        res.status(500).send('Error al insertar el registro');
    }
});

app.post('/register-user', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const db = await getDatabaseConnection();

        // Verificar si el usuario ya existe
        const [existingUser] = await db.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        if (existingUser.length > 0) {
            return res.status(200).json({ 
                message: "El usuario o correo ya está registrado." 
            });
        }
        // Crear un hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Registrar el nuevo usuario
        await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(201).json({ 
            message: "Usuario registrado con éxito"
        });

    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).json({ 
            error: "Error al registrar el usuario." 
        });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
    }

    try {
        const db = await getDatabaseConnection();

        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }
        const user = users[0];

        // Verifica la contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }
        // Obtener permisos asociados
        const [permissions] = await db.query(
            'SELECT permission_id FROM user_permissions WHERE user_id = ?',
            [user.id]
        );

        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                permissions: permissions // Devuelve una lista de permisos
            }
        });
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
});

app.post('/insertar-catalogo', async (req, res) => {
     // Lista de campos requeridos
     const requiredFields = [
        'name',
        'name_us',
        'name_br',
        'price',
        'usa_price',
        'icon',
        'highlight',
        'hot',
        'status',
        'descripcion',
        'upvotes',
        'downvotes',
        'upvotes_belief',
        'downvotes_belief',
        'mote'
    ];

    // Verificar si falta algún campo en el objeto `req.body`
    const missingFields = requiredFields.filter((field) => !(field in req.body));

    if (missingFields.length > 0) {
        return res.status(400).json({
            error: `Faltan los siguientes campos requeridos: ${missingFields.join(', ')}`,
        });
    }

    // Extraer los valores del cuerpo de la solicitud
    const {
        name,
        name_us,
        name_br,
        price,
        usa_price,
        icon,
        highlight,
        hot,
        status,
        descripcion,
        upvotes,
        downvotes,
        upvotes_belief,
        downvotes_belief,
        mote
    } = req.body;

    try {
        const db = await getDatabaseConnection();

        // Insertar el registro en la tabla catalogo
        const [catalogResult] = await db.query(
            `INSERT INTO catalogo (
                name, 
                name_us, 
                name_br, 
                price, 
                usa_price, 
                icon, 
                highlight, 
                hot, 
                status, 
                descripcion, 
                upvotes, 
                downvotes, 
                upvotes_belief, 
                downvotes_belief, 
                mote
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                name_us,
                name_br,
                price || 0,
                usa_price || 0,
                icon,
                highlight || 0,
                hot || 0,
                status || 0,
                descripcion || '',
                upvotes || 0,
                downvotes || 0,
                upvotes_belief || 0,
                downvotes_belief || 0,
                mote || '',
            ]
        );

        const productId = catalogResult.insertId;

        // Crear dos registros en la tabla price_history
        const userModify = 'emo.'; // O el usuario que modifica, puedes ajustarlo según tu lógica
        const hotel1 = 'ES';
        const hotel2 = 'US';

        await db.query(
            `INSERT INTO price_history (product_id, precio, hotel, user_modify) VALUES (?, ?, ?, ?), (?, ?, ?, ?)`,
            [
                productId, price, hotel1, userModify,
                productId, usa_price, hotel2, userModify
            ]
        );

        res.status(201).json({
            message: 'Registro insertado en catalogo y price_history con éxito.',
            catalogId: productId,
        });
    } catch (error) {
        console.error('Error al insertar en las tablas catalogo y price_history:', error);
        res.status(500).json({
            error: 'Error al insertar en las tablas catalogo y price_history.',
        });
    }
});

app.post('/update-password', async (req, res) => {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
        return res.status(400).json({
            message: "Se requieren userId y newPassword."
        });
    }

    try {
        const db = await getDatabaseConnection();

        // Verificar si el usuario existe
        const [user] = await db.query(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );

        if (user.length === 0) {
            return res.status(404).json({
                message: "Usuario no encontrado."
            });
        }

        // Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar la contraseña en la base de datos
        await db.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, userId]
        );

        res.status(200).json({
            message: "Contraseña actualizada con éxito."
        });

    } catch (error) {
        console.error('Error al actualizar la contraseña:', error);
        res.status(500).json({
            error: "Error al actualizar la contraseña."
        });
    }
});

app.get('/obtener-placas', async (req, res) => {
    try {
        const db = await getDatabaseConnection();

        const [placas] = await db.query('SELECT * FROM placas');

        res.status(200).json(placas);
    } catch (error) {
        console.error('Error al obtener placas:', error);
        res.status(500).json({
            error: "No se pudieron obtener las placas."
        });
    }
});

app.get('/obtener-premios', async (req, res) => {
    try {
        const db = await getDatabaseConnection();

        const [premios] = await db.query(`
            SELECT
                p.*,
                c.name AS furni_name
            FROM origins_premios p
            JOIN catalogo c ON p.furni = c.id
        `);

        res.status(200).json(premios);
    } catch (error) {
        console.error('Error al obtener premios:', error);
        res.status(500).json({
            error: "No se pudieron obtener los premios."
        });
    }
});

app.get('/obtener-eventos', async (req, res) => {
    try {
        const db = await getDatabaseConnection();

        const [eventos] = await db.query(`
            SELECT * FROM eventos
            ORDER BY created_at DESC
        `);

        res.status(200).json(eventos);
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.status(500).json({
            error: "No se pudieron obtener los eventos."
        });
    }
});

const port = 3001;
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
