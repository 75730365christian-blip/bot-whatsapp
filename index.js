let NUMERO_BOT = null;
const ADMINS_PERMITIDOS = [
    "51918417888",
    "51914610330",
    "51931938275",
    "14387028917",
    "51921692016",
    "51939760777",
    "51904383663",
    "51938854437",
    "51987787973",
    "51902263858",
    "51912334967",
    "51904741767",
    "51912334967"
];

// MULTI GRUPOS
const GRUPOS_PERMITIDOS = [
    "120363404333084500@g.us",
    "120363423219998648@g.us",
    "120363424984195309@g.us",
    "120363423262098566@g.us",
    "120363426582998693@g.us",
    "120363423427675248@g.us"
];

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// *** FUNCIÓN PARA ENCONTRAR CHROME (VERSIÓN FINAL) ***
function findChrome() {
    console.log("🔍 Iniciando búsqueda de Chrome...");

    // 1. Leer de variable de entorno (más fiable en Render)
    if (process.env.CHROME_PATH) {
        console.log(`📌 Usando CHROME_PATH de variable de entorno: ${process.env.CHROME_PATH}`);
        if (fs.existsSync(process.env.CHROME_PATH)) {
            console.log(`✅ Chrome válido en variable de entorno.`);
            return process.env.CHROME_PATH;
        } else {
            console.log(`⚠️ CHROME_PATH de entorno no es válido.`);
        }
    }

    // 2. Buscar archivo guardado por el build (fallback)
    const chromePathFile = '/opt/render/project/src/chrome.path';
    console.log(`🔍 Buscando archivo de ruta en: ${chromePathFile}`);
    try {
        if (fs.existsSync(chromePathFile)) {
            const savedPath = fs.readFileSync(chromePathFile, 'utf8').trim();
            console.log(`📄 Contenido del archivo: "${savedPath}"`);

            // Intentar con la ruta guardada
            if (savedPath && fs.existsSync(savedPath)) {
                console.log(`✅ Usando ruta guardada por el build.`);
                return savedPath;
            } else {
                console.log(`⚠️ Ruta guardada no válida. Intentando búsqueda directa...`);

                // BÚSQUEDA DIRECTA: Buscar el archivo chrome en el directorio de caché
                const { execSync } = require('child_process');
                const baseDir = '/opt/render/.cache/puppeteer/chrome';
                try {
                    const found = execSync(`find ${baseDir} -name chrome -type f 2>/dev/null | head -1`, { encoding: 'utf8' }).trim();
                    if (found && fs.existsSync(found)) {
                        console.log(`🔍 Chrome encontrado mediante búsqueda directa: ${found}`);
                        return found;
                    }
                } catch (e) {
                    console.log(`❌ Error en búsqueda directa: ${e.message}`);
                }
            }
        } else {
            console.log(`⚠️ Archivo ${chromePathFile} no existe.`);
        }
    } catch (e) {
        console.log(`❌ Error al leer archivo: ${e.message}`);
    }

    // 3. Buscar en rutas estándar (último recurso)
    console.log("🔍 Buscando Chrome en rutas estándar...");
    const possiblePaths = [
        '/opt/render/.cache/puppeteer/chrome/linux-145.0.7632.77/chrome-linux64/chrome',
        '/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome',
        '/opt/render/project/src/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome'
    ];

    const { execSync } = require('child_process');
    for (const pathPattern of possiblePaths) {
        if (pathPattern.includes('*')) {
            try {
                const found = execSync(`find ${pathPattern.split('*')[0]} -name chrome -type f 2>/dev/null | head -1`, { encoding: 'utf8' }).trim();
                if (found && fs.existsSync(found)) {
                    console.log(`🔍 Chrome encontrado en: ${found}`);
                    return found;
                }
            } catch (e) {}
        } else {
            if (fs.existsSync(pathPattern)) {
                console.log(`🔍 Chrome encontrado en: ${pathPattern}`);
                return pathPattern;
            }
        }
    }

    throw new Error('❌ No se pudo encontrar Chrome. Revisa la instalación.');
}

// *** CREACIÓN DEL CLIENTE CON RUTA DE CHROME PERSISTENTE ***
const chromePath = '/opt/render/project/chrome/chrome/linux-146.0.7680.66/chrome-linux64/chrome';
console.log(`✅ Usando Chrome (ruta persistente): ${chromePath}`);

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './session-data'
    }),
    puppeteer: {
        headless: true,
        executablePath: chromePath,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

client.on('qr', qr => {
    console.log('Escanea el QR con tu WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('🤖 Bot conectado correctamente');

    const info = client.info;
    NUMERO_BOT = info.wid.user;

    console.log("📱 Número del bot:", NUMERO_BOT);

    const chats = await client.getChats();
    const grupos = chats.filter(chat => chat.isGroup);
    console.log(`\n📋 El bot está en ${grupos.length} grupos:`);
    grupos.forEach(g => console.log(`   - ${g.name}: ${g.id._serialized}`));
});

function botEsAdmin(chat) {
    const botParticipant = chat.participants.find(p => p.id.user === NUMERO_BOT);
    return botParticipant?.isAdmin || false;
}

function obtenerMenciones(chat, autorID) {
    let mentions = [];
    for (let p of chat.participants) {
        const id = p.id._serialized;
        const numero = p.id.user;

        if (numero === NUMERO_BOT) continue;
        if (id === autorID) continue;

        mentions.push(id);
    }
    return mentions;
}

async function descargarMultimedia(message) {
    if (!message.hasMedia) return null;

    try {
        const media = await message.downloadMedia();
        return media;
    } catch (error) {
        console.log("Error al descargar multimedia:", error.message);
        return null;
    }
}

// 🔥 NUEVA FUNCIÓN: Normalizar comandos (acepta ! o /)
function normalizarComando(texto) {
    if (texto.startsWith('!') || texto.startsWith('/')) {
        return {
            prefijo: texto[0],
            comando: texto.substring(1).trim()
        };
    }
    return {
        prefijo: null,
        comando: texto
    };
}

client.on('message', async message => {
    try {
        const chat = await message.getChat();

        if (!chat.isGroup) return;
        if (!GRUPOS_PERMITIDOS.includes(chat.id._serialized)) {
            return;
        }

        let usuarioAutorizado = false;

        if (message.fromMe) {
            usuarioAutorizado = true;
        } else {
            const contact = await message.getContact();
            const numeroAutor = contact.number;

            if (ADMINS_PERMITIDOS.includes(numeroAutor)) {
                usuarioAutorizado = true;
            }
        }

        if (!usuarioAutorizado) return;

        const texto = message.body.trim();
        const autorID = message.author || message.from;

        // 🔥 Normalizar el comando
        const { prefijo, comando } = normalizarComando(texto);

        // Si no hay prefijo (! o /), ignoramos
        if (!prefijo) return;

        switch (true) {
            case comando === 'misgrupos':
                try {
                    const chats = await client.getChats();
                    const grupos = chats.filter(chat => chat.isGroup);

                    let mensaje = `📋 *GRUPOS DONDE ESTOY* 📋\n\n`;

                    grupos.forEach((grupo, index) => {
                        mensaje += `${index + 1}. *${grupo.name}*\n`;
                        mensaje += `   📌 ID: \`${grupo.id._serialized}\`\n`;
                        mensaje += `   👥 Miembros: ${grupo.participants.length}\n\n`;
                    });

                    mensaje += `\n✅ Total: ${grupos.length} grupos`;

                    await chat.sendMessage(mensaje);
                } catch (error) {
                    await chat.sendMessage("❌ Error al listar grupos");
                }
                break;

            case comando === 'menu':
                await chat.sendMessage(
`📜 *LISTA DE COMANDOS*

/n [mensaje] → Notificar con texto personalizado
/n (respondiendo) → Reenviar mensaje mencionando a todos
/ban → Expulsar miembro (responder a su mensaje)
/grupo cerrar → Solo admins escriben
/grupo abrir → Todos pueden escribir
/estado → Ver estado del bot y grupo
/misgrupos → Listar todos los grupos del bot
/menu → Ver comandos`
                );
                break;

            case comando.startsWith('n'):
                await manejarNotificacion(message, chat, autorID);
                break;

            case comando === 'grupo cerrar':
                await manejarCerrarGrupo(message, chat);
                break;

            case comando === 'grupo abrir':
                await manejarAbrirGrupo(message, chat);
                break;

            case comando === 'estado':
                await manejarEstado(message, chat);
                break;

            case comando === 'ban':
                await manejarBan(message, chat);
                break;

            default:
                break;
        }

    } catch (err) {
        console.log("❌ Error controlado:", err.message);

        try {
            const logEntry = `${new Date().toISOString()} - ERROR: ${err.message}\n`;
            fs.appendFileSync('error.log', logEntry);
        } catch (e) {
            // Ignorar error de log
        }
    }
});

// 🔥 MODIFICADA: manejarNotificacion ahora acepta !n y /n
async function manejarNotificacion(message, chat, autorID) {
    const texto = message.body.trim();
    const mentions = obtenerMenciones(chat, autorID);

    // Extraer el mensaje después del comando (!n o /n)
    let mensajeAdmin = '';
    if (texto.startsWith('!n ')) {
        mensajeAdmin = texto.slice(3).trim();
    } else if (texto.startsWith('/n ')) {
        mensajeAdmin = texto.slice(3).trim();
    } else if (texto === '!n' || texto === '/n') {
        mensajeAdmin = '';
    }

    // Caso 1: /n con texto personalizado
    if (mensajeAdmin && !message.hasQuotedMsg) {
        const mensajeCompleto = `${mensajeAdmin}`;
        await chat.sendMessage(mensajeCompleto, { mentions });
        return;
    }

    // Caso 2: /n respondiendo a un mensaje
    if (message.hasQuotedMsg) {
        const quotedMsg = await message.getQuotedMessage();

        if (quotedMsg.hasMedia) {
            const media = await descargarMultimedia(quotedMsg);

            if (media) {
                const textoOriginal = quotedMsg.body || "";
                const mensajeReenviado = `${textoOriginal}`;

                await chat.sendMessage(media, {
                    caption: mensajeReenviado,
                    mentions: mentions
                });
            } else {
                await chat.sendMessage("❌ No se pudo reenviar la multimedia. Enviando solo mención:", { mentions });
            }
        } else {
            const textoOriginal = quotedMsg.body;
            const mensajeReenviado = `${textoOriginal}`;

            await chat.sendMessage(mensajeReenviado, { mentions });
        }

        return;
    }

    // Caso 3: /n solo sin responder
    if (!mensajeAdmin && !message.hasQuotedMsg) {
        await chat.sendMessage("❌ Debes escribir un mensaje después de /n O responder a un mensaje para reenviarlo.");
    }
}

// Las demás funciones (manejarCerrarGrupo, manejarAbrirGrupo, manejarEstado, manejarBan)
// quedan IGUAL que antes, no necesitan cambios porque ya usan el chat directamente

async function manejarCerrarGrupo(message, chat) {
    if (!botEsAdmin(chat)) {
        return chat.sendMessage("❌ No soy administrador del grupo. Necesito ser admin para cerrar el grupo.");
    }

    try {
        await chat.setMessagesAdminsOnly(true);
        await chat.sendMessage("🔒 *Grupo cerrado*\nSolo administradores pueden escribir.");
    } catch (error) {
        await chat.sendMessage("❌ Error al cerrar el grupo. Verifica mis permisos.");
        console.log("Error al cerrar grupo:", error.message);
    }
}

async function manejarAbrirGrupo(message, chat) {
    if (!botEsAdmin(chat)) {
        return chat.sendMessage("❌ No soy administrador del grupo. Necesito ser admin para abrir el grupo.");
    }

    try {
        await chat.setMessagesAdminsOnly(false);
        await chat.sendMessage("🔓 *Grupo abierto*\nTodos los miembros pueden escribir.");
    } catch (error) {
        await chat.sendMessage("❌ Error al abrir el grupo. Verifica mis permisos.");
        console.log("Error al abrir grupo:", error.message);
    }
}

async function manejarEstado(message, chat) {
    const totalMiembros = chat.participants.length;
    const esAdmin = botEsAdmin(chat);
    const modoGrupo = chat.groupMetadata?.restrict ? "🔒 Solo admins" : "🔓 Todos pueden escribir";

    const estadoMsg = `📊 *ESTADO DEL BOT Y GRUPO*

👥 *Miembros:* ${totalMiembros}
🤖 *Bot es admin:* ${esAdmin ? '✅ Sí' : '❌ No'}
🔐 *Modo grupo:* ${modoGrupo}
📱 *Número bot:* @${NUMERO_BOT}

*Admins permitidos:* ${ADMINS_PERMITIDOS.length}`;

    await chat.sendMessage(estadoMsg, {
        mentions: [message.author || message.from]
    });
}

async function manejarBan(message, chat) {
    if (!message.hasQuotedMsg) {
        return chat.sendMessage("❌ Debes responder al mensaje de la persona que quieres expulsar con !ban");
    }

    if (!botEsAdmin(chat)) {
        return chat.sendMessage("❌ No soy administrador del grupo. Necesito ser admin para expulsar miembros.");
    }

    const quotedMsg = await message.getQuotedMessage();
    const contactToBan = await quotedMsg.getContact();
    const participantIdToBan = contactToBan.id._serialized;

    if (ADMINS_PERMITIDOS.includes(contactToBan.number)) {
        return chat.sendMessage("❌ No puedes expulsar a un administrador del bot");
    }

    if (contactToBan.number === NUMERO_BOT) {
        return chat.sendMessage("❌ No puedes expulsarme a mí 😢");
    }

    try {
        const chatFresco = await client.getChatById(chat.id._serialized);
        const estaEnElGrupo = chatFresco.participants.some(p => p.id._serialized === participantIdToBan);

        if (!estaEnElGrupo) {
            return chat.sendMessage("❌ Esta persona no está en el grupo en este momento");
        }

        await chatFresco.removeParticipants([participantIdToBan]);

        const contactoActualizado = await client.getContactById(participantIdToBan);
        await chat.sendMessage(`✅ *Miembro expulsado*\n\n@${contactoActualizado.number} ha sido eliminado del grupo.`, {
            mentions: [participantIdToBan]
        });

    } catch (error) {
        console.log("Error al expulsar:", error.message);

        if (error.message.includes("not-authorized")) {
            await chat.sendMessage("❌ No tengo permisos para expulsar miembros. Hazme admin del grupo.");
        } else {
            await chat.sendMessage("❌ Error al intentar expulsar. Verifica que soy admin del grupo.");
        }
    }
}

client.initialize();
