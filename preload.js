// contextBridge: sichere Brücke zwischen Main-Prozess und Renderer
// ipcRenderer: zum Senden von Anfragen an main.js
const { contextBridge, ipcRenderer } = require("electron");


// macht ein Objekt "window.api" im Renderer verfügbar,
// aber NUR mit genau diesen Funktionen (kein direkter Node.js/DB-Zugriff möglich)
contextBridge.exposeInMainWorld("api", {
    getAll: () => ipcRenderer.invoke("anmeldung:getAll"),   // ruft in main.js den Handler 'anmeldung:getAll' auf -> lädt alle Anmeldungen
    kursGetAll: () => ipcRenderer.invoke("kurs:getAll"),   // ruft 'kurs:getAll' auf -> lädt alle Kurse (fürs Dropdown)
    add: (daten) => ipcRenderer.invoke("anmeldung:add", daten),   // ruft 'anmeldung:add' auf und übergibt die Formulardaten -> legt neue Anmeldung an
    getTeilnehmer: (teilnehmernr) => ipcRenderer.invoke("teilnehmer:getById", teilnehmernr),  // ruft 'teilnehmer:getById' auf -> lädt einen einzelnen Teilnehmer (für Bearbeiten-Dialog)
    update: (daten) => ipcRenderer.invoke("anmeldung:update", daten),   // ruft 'anmeldung:update' auf -> aktualisiert Teilnehmerdaten und ggf. Kurs
    delete: (kursnr, teilnehmernr) => ipcRenderer.invoke("anmeldung:delete", kursnr, teilnehmernr)  // ruft 'anmeldung:delete' auf -> löscht eine Anmeldung
});