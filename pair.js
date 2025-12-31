const express = require('express');
const fs = require('fs');
const router = express.Router();
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const { upload } = require('./mega');

router.get('/', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).send({ code: "Invalid Number" });

    async function SenuraPair() {
        const { state, saveCreds } = await useMultiFileAuthState(`./session`);
        try {
            let sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }),
                browser: ["SENURA-MD", "Safari", "3.0"],
            });

            if (!sock.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code: code });
                }
            }

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on("connection.update", async (s) => {
                const { connection } = s;
                if (connection === "open") {
                    await delay(5000);
                    const auth_path = './session/creds.json';
                    
                    // Mega එකට upload කරමු
                    const mega_url = await upload(fs.createReadStream(auth_path), `${Math.random().toString(36).substring(2)}.json`);
                    
                    // Session ID එක හදමු
                    const sid = mega_url.replace('https://mega.nz/file/', 'SENURA-MD_');

                    await sock.sendMessage(sock.user.id, { text: sid });
                    
                    console.log("Connected! Session ID sent to WhatsApp.");
                    await delay(100);
                    fs.rmSync('./session', { recursive: true, force: true });
                }
            });
        } catch (err) {
            console.log(err);
            SenuraPair();
        }
    }
    return await SenuraPair();
});

module.exports = router;
