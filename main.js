const {
    app,
    BrowserWindow,
    ipcMain
} = require("electron");

const path = require("path");
function createWindow() {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true
        }
    });
    window.loadFile(
        path.join(__dirname, "index.html")
    );
}

app.whenReady().then(() => {
    createWindow();
});


// Datenbank verbindung herstellen
const Database = require("better-sqlite3");
const db = new Database('db/vhs.db')

// Inter-Process Communication definiert eine Funktion, die der Renderer später aufrufen darf:
ipcMain.handle('anmeldung:getAll', () => {
    return db.prepare(`
        SELECT 
            kt.kursnr,
            kt.teilnehmernr,
            t.vorname,
            t.nachname,
            k.kursbezeichnung,
            k.beginndatum,
            k.tag,
            k.anfangszeit
        FROM vhs_kursteilnehmer kt
        JOIN vhs_teilnehmer t ON kt.teilnehmernr = t.teilnehmernr
        JOIN vhs_kurs k ON kt.kursnr = k.kursnr
    `).all();
});

ipcMain.handle('kurs:getAll', () => {
    return db.prepare('SELECT kursnr, kursbezeichnung FROM vhs_kurs').all();  // bereitet ein SQL-Statement vor (Schutz vor SQL-Injection)
});

ipcMain.handle('anmeldung:add', (event, daten) => {
    const insertTeilnehmer = db.prepare(`
        INSERT INTO vhs_teilnehmer 
            (vorname, nachname, geschlecht, strasse, plz, ort, telefon, altersgruppe)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`); // bereitet ein SQL-Statement vor (Schutz vor SQL-Injection)

        // platzhalter werden befüllt und statement wird ausgeführt
    const result = insertTeilnehmer.run(
        daten.vorname,
        daten.nachname,
        daten.geschlecht,
        daten.strasse,
        daten.plz,
        daten.ort,
        daten.telefon,
        daten.altersgruppe
    );

    const neueTeilnehmerNr = result.lastInsertRowid; // automatisch vergebene ID des neuen Teilnehmers merken

    // verknüpft Teilnehmer mit dem gewählten Kurs
    const insertAnmeldung = db.prepare(`
        INSERT INTO vhs_kursteilnehmer (kursnr, teilnehmernr)
        VALUES (?, ?)
    `);
    insertAnmeldung.run(daten.kursnr, neueTeilnehmerNr);

    return { erfolg: true };    // Rückmeldung an den Renderer, dass das Speichern geklappt hat
});

// IPC-Handler: lädt einen einzelnen Teilnehmer anhand seiner teilnehmernr (für den Bearbeiten-Dialog)
ipcMain.handle('teilnehmer:getById', (event, teilnehmernr) => {
    return db.prepare(`
        SELECT * FROM vhs_teilnehmer WHERE teilnehmernr = ?
    `).get(teilnehmernr);
});

// IPC-Handler: aktualisiert die Personendaten eines Teilnehmers und ggf. den zugeordneten Kurs
ipcMain.handle('anmeldung:update', (event, daten) => {
    // Personendaten des Teilnehmers überschreiben
    db.prepare(`
        UPDATE vhs_teilnehmer
        SET vorname = ?, nachname = ?, geschlecht = ?, strasse = ?, 
            plz = ?, ort = ?, telefon = ?, altersgruppe = ?
        WHERE teilnehmernr = ?
    `).run(
        daten.vorname, daten.nachname, daten.geschlecht, daten.strasse,
        daten.plz, daten.ort, daten.telefon, daten.altersgruppe,
        daten.teilnehmernr
    ); // bestimmt, WELCHER Teilnehmer aktualisiert wird


    // prüfen, ob sich der Kurs geändert hat
    if (daten.kursnr != daten.alteKursnr) {
        db.prepare(`
            DELETE FROM vhs_kursteilnehmer WHERE kursnr = ? AND teilnehmernr = ?
        `).run(daten.alteKursnr, daten.teilnehmernr);

        db.prepare(`
            INSERT INTO vhs_kursteilnehmer (kursnr, teilnehmernr) VALUES (?, ?)
        `).run(daten.kursnr, daten.teilnehmernr);
    }

    return { erfolg: true };
});

// IPC-Handler: löscht die Anmeldung eines Teilnehmers zu einem bestimmten Kurs
ipcMain.handle('anmeldung:delete', (event, kursnr, teilnehmernr) => {
    db.prepare(`
        DELETE FROM vhs_kursteilnehmer WHERE kursnr = ? AND teilnehmernr = ?
    `).run(kursnr, teilnehmernr);

    return { erfolg: true };
});