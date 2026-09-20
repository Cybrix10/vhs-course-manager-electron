async function ladeAnmeldungen() {
    const anmeldungen = await window.api.getAll();

    const tabelle = document.getElementById("anmeldungen-tabelle");
    const zeilen = tabelle.querySelectorAll("tr:not(:first-child)");
    zeilen.forEach(zeile => zeile.remove());

    anmeldungen.forEach(a => {
        const zeile = document.createElement("tr");
        zeile.innerHTML = `
            <td>${a.vorname} ${a.nachname}</td>
            <td>${a.kursbezeichnung}</td>
            <td>${a.beginndatum} (${a.tag})</td>
            <td>
                <button data-kursnr="${a.kursnr}" data-teilnehmernr="${a.teilnehmernr}" class="bearbeiten">Bearbeiten</button>
                <button data-kursnr="${a.kursnr}" data-teilnehmernr="${a.teilnehmernr}" class="loeschen">Löschen</button>
            </td>
        `;
        tabelle.appendChild(zeile);
    });
}

async function ladeKurse() {
    const kurse = await window.api.kursGetAll();
    const select = document.getElementById("kurs");

    select.innerHTML = '<option value="">Kurs auswählen</option>';

    kurse.forEach(k => {
        const option = document.createElement("option");
        option.value = k.kursnr;
        option.textContent = k.kursbezeichnung;
        select.appendChild(option);
    });
}

// setzt alle Felder zurück:
function formularLeeren() {
    document.querySelector('input[name="name"]').value = "";
    document.querySelector('input[name="nachname"]').value = "";
    document.getElementById("geschlecht").value = "Geschlecht";
    document.querySelector('input[name="strasse"]').value = "";
    document.querySelector('input[name="plz"]').value = "";
    document.querySelector('input[name="ort"]').value = "";
    document.querySelector('input[name="telepfon"]').value = "";
    document.querySelector('input[name="altersgruppe"]').value = "";
    document.getElementById("kurs").value = "";
    document.getElementById("edit-teilnehmernr").value = "";
    document.getElementById("edit-alte-kursnr").value = "";
}

// leert Formular, lädt Kurse, zeigt Modal
async function oeffneModalNeu() {
    formularLeeren();
    document.getElementById("formular-titel").textContent = "Neue Anmeldung";
    await ladeKurse();
    document.getElementById("modal-overlay").classList.add("active");
}

// holt bestehende Daten
async function oeffneModalBearbeiten(kursnr, teilnehmernr) {
    const teilnehmer = await window.api.getTeilnehmer(teilnehmernr);

    await ladeKurse();

    document.querySelector('input[name="name"]').value = teilnehmer.vorname;
    document.querySelector('input[name="nachname"]').value = teilnehmer.nachname;
    document.getElementById("geschlecht").value = teilnehmer.geschlecht;
    document.querySelector('input[name="strasse"]').value = teilnehmer.strasse;
    document.querySelector('input[name="plz"]').value = teilnehmer.plz;
    document.querySelector('input[name="ort"]').value = teilnehmer.ort;
    document.querySelector('input[name="telepfon"]').value = teilnehmer.telefon;
    document.querySelector('input[name="altersgruppe"]').value = teilnehmer.altersgruppe;
    document.getElementById("kurs").value = kursnr;

    document.getElementById("edit-teilnehmernr").value = teilnehmernr;
    document.getElementById("edit-alte-kursnr").value = kursnr;

    document.getElementById("formular-titel").textContent = "Anmeldung bearbeiten";
    document.getElementById("modal-overlay").classList.add("active");
}


function schliesseModal() {
    document.getElementById("modal-overlay").classList.remove("active");
    formularLeeren();
}

document.getElementById("Anmeldung").addEventListener("click", oeffneModalNeu);
document.getElementById("abbrechen").addEventListener("click", schliesseModal);

document.getElementById("speichern").addEventListener("click", async (event) => {
    event.preventDefault();

    const daten = {
        vorname: document.querySelector('input[name="name"]').value,
        nachname: document.querySelector('input[name="nachname"]').value,
        geschlecht: document.getElementById("geschlecht").value,
        strasse: document.querySelector('input[name="strasse"]').value,
        plz: document.querySelector('input[name="plz"]').value,
        ort: document.querySelector('input[name="ort"]').value,
        telefon: document.querySelector('input[name="telepfon"]').value,
        altersgruppe: document.querySelector('input[name="altersgruppe"]').value,
        kursnr: document.getElementById("kurs").value
    };

    const teilnehmernr = document.getElementById("edit-teilnehmernr").value;
    const alteKursnr = document.getElementById("edit-alte-kursnr").value;

    if (teilnehmernr) {
        daten.teilnehmernr = teilnehmernr;
        daten.alteKursnr = alteKursnr;
        await window.api.update(daten);
    } else {
        await window.api.add(daten);
    }

    schliesseModal();
    ladeAnmeldungen();
});

document.getElementById("anmeldungen-tabelle").addEventListener("click", async (event) => {
    const kursnr = event.target.dataset.kursnr;
    const teilnehmernr = event.target.dataset.teilnehmernr;

    if (event.target.classList.contains("bearbeiten")) {
        oeffneModalBearbeiten(kursnr, teilnehmernr);
    }

    if (event.target.classList.contains("loeschen")) {
        const bestaetigt = confirm("Diese Anmeldung wirklich löschen?");
        if (bestaetigt) {
            await window.api.delete(kursnr, teilnehmernr);
            ladeAnmeldungen();
        }
    }
});

document.querySelector('input[name="suche"]').addEventListener("input", (event) => {
    const suchbegriff = event.target.value.toLowerCase();
    const zeilen = document.querySelectorAll("#anmeldungen-tabelle tr:not(:first-child)");

    zeilen.forEach(zeile => {
        const text = zeile.textContent.toLowerCase();
        zeile.style.display = text.includes(suchbegriff) ? "" : "none";
    });
});

ladeAnmeldungen();