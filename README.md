# Backend de TradeHabbo

Este repositorio contiene el backend oficial de **TradeHabbo**, la fansite dedicada al juego **Habbo**. Su principal función es gestionar todas las peticiones entrantes que llegan a través de **Ngrok**, procesarlas y responder adecuadamente según el contexto de uso.

## 🚀 ¿Qué hace este backend?

- Atiende y responde peticiones relacionadas con el ecosistema de **Habbo**.
- Expone endpoints utilizados por la plataforma web de TradeHabbo.
- Integra herramientas para el scraping y automatización de procesos vinculados a la actividad de la fansite.
- Gestiona APIs personalizadas para notificar vía **WhatsApp** a los miembros del clan **Gods** del juego **Dofus Touch**.

## ⚙️ Tecnologías utilizadas

Este backend está desarrollado en **Node.js** y hace uso de las siguientes tecnologías y librerías:

- **Express**: Framework para crear rutas y manejar peticiones HTTP.
- **MySQL2**: Cliente para conectarse a bases de datos MySQL.
- **Axios**: Cliente HTTP para consumir servicios externos.
- **Cheerio**: Scraping y parseo de HTML.
- **Puppeteer**: Automatización de navegación en sitios web.
- **Tesseract.js**: Reconocimiento óptico de caracteres (OCR).
- **Moment-timezone**: Manejo de fechas con soporte de zonas horarias.
- **Multer**: Middleware para el manejo de archivos.
- **JWT (jsonwebtoken)**: Autenticación y generación de tokens.
- **bcrypt**: Encriptación de contraseñas.
- **pm2**: Gestor de procesos para producción.
- **discord.js**: Integración con servidores de Discord.
- **qrcode-terminal**: Generación de códigos QR para CLI.
- **venom** y **whatsapp-web.js**: Automatización de WhatsApp Web.
- **robotjs**: Control del teclado y ratón de forma programática.
- **pngjs**: Lectura y manipulación de imágenes PNG.

## 🎮 Contexto de uso

Este proyecto fue diseñado con el objetivo de facilitar la automatización, integración y comunicación dentro del entorno de los juegos **Habbo** y **Dofus Touch**, apoyando tanto a usuarios de la comunidad **TradeHabbo** como al clan **Gods** en tareas repetitivas, notificaciones y gestión de datos.

---

© TradeHabbo - Todos los derechos reservados.
