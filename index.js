const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass");
const sharp = require("sharp");

app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

obGlobal = {
    obErori: null,
    obImagini: null,
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup")
};

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

/* =========================
   FOLDERE
========================= */
let vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];
for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder, { recursive: true });
    }
}

/* =========================
   FISIERE STATICE
========================= */
app.use("/resurse", express.static(path.join(__dirname, "resurse")));
app.use("/dist", express.static(path.join(__dirname, "node_modules/bootstrap/dist")));
app.use("/js", express.static(path.join(__dirname, "resurse/bootstrap/bootstrap-5.3.8-dist/js")));

/* =========================
   FAVICON
========================= */
app.get("/favicon.ico", function (req, res) {
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"));
});

/* =========================
   ERORI
========================= */
function initErori() {
    let continut = fs.readFileSync(
        path.join(__dirname, "resurse/json/erori.json")
    ).toString("utf-8");

    let erori = obGlobal.obErori = JSON.parse(continut);
    let err_default = erori.eroare_default;

    err_default.imagine = path.join(erori.cale_baza, err_default.imagine).replace(/\\/g, "/");

    for (let eroare of erori.info_erori) {
        eroare.imagine = path.join(erori.cale_baza, eroare.imagine).replace(/\\/g, "/");
    }
}
initErori();

function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroare = null;
    if (identificator) {
        eroare = obGlobal.obErori.info_erori.find(
            elem => elem.identificator == identificator
        );
    }

    let errDefault = obGlobal.obErori.eroare_default;

    if (eroare?.status) {
        res.status(eroare.identificator);
    } else {
        res.status(500);
    }

    res.render("pagini/eroare", {
        imagine: imagine || eroare?.imagine || errDefault.imagine,
        titlu: titlu || eroare?.titlu || errDefault.titlu,
        text: text || eroare?.text || errDefault.text,
        paginaCurenta: "eroare"
    });
}

/* =========================
   GALERIE IMAGINI
========================= */
async function initImagini() {
    let continut = fs.readFileSync(
        path.join(__dirname, "resurse/json/galerie.json")
    ).toString("utf-8");

    obGlobal.obImagini = JSON.parse(continut);

    let luniAn = [
        "ianuarie", "februarie", "martie", "aprilie",
        "mai", "iunie", "iulie", "august",
        "septembrie", "octombrie", "noiembrie", "decembrie"
    ];

    let lunaCurenta = luniAn[new Date().getMonth()];

    obGlobal.obImagini.imagini = obGlobal.obImagini.imagini.filter(
        imag => !imag.luni || imag.luni.includes(lunaCurenta)
    );

    let vImagini = obGlobal.obImagini.imagini;
    let caleGalerie = obGlobal.obImagini.cale_galerie;

    let caleAbs = path.join(__dirname, caleGalerie);
    let caleAbsMediu = path.join(caleAbs, "mediu");

    if (!fs.existsSync(caleAbsMediu)) {
        fs.mkdirSync(caleAbsMediu, { recursive: true });
    }

    for (let imag of vImagini) {
        let numeFis = path.parse(imag.fisier).name;
        let caleFisAbs = path.join(caleAbs, imag.fisier);
        let caleFisMediuAbs = path.join(caleAbsMediu, numeFis + ".webp");

        if (fs.existsSync(caleFisAbs)) {
            await sharp(caleFisAbs)
                .resize(300)
                .toFormat("webp")
                .toFile(caleFisMediuAbs);
        }

        imag.fisier_mediu = path.join("/", caleGalerie, "mediu", numeFis + ".webp").replace(/\\/g, "/");
        imag.fisier = path.join("/", caleGalerie, imag.fisier).replace(/\\/g, "/");
    }
}

async function initGalerieStatica() {
    const caleJson = path.join(__dirname, "resurse/json/galerie_statica.json");
    const continut = fs.readFileSync(caleJson, "utf-8");
    const galerie = JSON.parse(continut);

    const caleGalerie = galerie.cale_galerie; // ex. resurse/galerie_statica
    const caleAbsGalerie = path.join(__dirname, caleGalerie);
    const caleAbsMediu = path.join(caleAbsGalerie, "mediu");
    const caleAbsMic = path.join(caleAbsGalerie, "mic");

    if (!fs.existsSync(caleAbsMediu)) {
        fs.mkdirSync(caleAbsMediu, { recursive: true });
    }

    if (!fs.existsSync(caleAbsMic)) {
        fs.mkdirSync(caleAbsMic, { recursive: true });
    }

    for (const imag of galerie.imagini) {
        const numeFis = path.parse(imag.cale_imagine).name;
        const ext = path.parse(imag.cale_imagine).ext;

        const caleFisAbs = path.join(caleAbsGalerie, imag.cale_imagine);
        const caleFisMediuAbs = path.join(caleAbsMediu, `${numeFis}${ext}`);
        const caleFisMicAbs = path.join(caleAbsMic, `${numeFis}${ext}`);

        if (fs.existsSync(caleFisAbs)) {
            await sharp(caleFisAbs)
                .resize({ width: 500 })
                .toFile(caleFisMediuAbs);

            await sharp(caleFisAbs)
                .resize({ width: 300 })
                .toFile(caleFisMicAbs);
        }

        imag.fisier = `/${caleGalerie}/${imag.cale_imagine}`.replace(/\\/g, "/");
        imag.fisier_mediu = `/${caleGalerie}/mediu/${numeFis}${ext}`.replace(/\\/g, "/");
        imag.fisier_mic = `/${caleGalerie}/mic/${numeFis}${ext}`.replace(/\\/g, "/");
    }

    return galerie;
}
app.get("/galerie", async function (req, res) {
    const galerie = await initGalerieStatica();

    const minute = new Date().getMinutes();
    let sfert;
    if (minute < 15) sfert = 1;
    else if (minute < 30) sfert = 2;
    else if (minute < 45) sfert = 3;
    else sfert = 4;

    let imaginiFiltrate = galerie.imagini.filter(img => img.sfert_ora === sfert);
    imaginiFiltrate = imaginiFiltrate.slice(0, 10);

    res.render("pagini/galerie", {
        paginaCurenta: "galerie",
        imagini: imaginiFiltrate
    });
});
/* =========================
   COMPILARE SCSS
========================= */
function compileazaScss(caleScss, caleCss) {
    if (!caleCss) {
        let numeFisExt = path.basename(caleScss);
        let numeFis = numeFisExt.split(".")[0];
        caleCss = numeFis + ".css";
    }

    if (!path.isAbsolute(caleScss)) {
        caleScss = path.join(obGlobal.folderScss, caleScss);
    }

    if (!path.isAbsolute(caleCss)) {
        caleCss = path.join(obGlobal.folderCss, caleCss);
    }

    let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, { recursive: true });
    }

    let numeFisCss = path.basename(caleCss);
    if (fs.existsSync(caleCss)) {
        fs.copyFileSync(caleCss, path.join(caleBackup, numeFisCss));
    }

    let rez = sass.compile(caleScss, { sourceMap: true });
    fs.writeFileSync(caleCss, rez.css);
}

/* =========================
   COMPILARE INITIALA SCSS
========================= */
let vFisiere = fs.readdirSync(obGlobal.folderScss);
for (let numeFis of vFisiere) {
    if (path.extname(numeFis) == ".scss") {
        compileazaScss(numeFis);
    }
}

/* =========================
   WATCH SCSS
========================= */
fs.watch(obGlobal.folderScss, function (eveniment, numeFis) {
    if (!numeFis) return;

    if (eveniment == "change" || eveniment == "rename") {
        let caleCompleta = path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta) && path.extname(caleCompleta) == ".scss") {
            compileazaScss(caleCompleta);
        }
    }
});

/* =========================
   RUTE PRINCIPALE
========================= */
app.get(["/", "/index", "/home"], async function (req, res) {
    const galerie = await initGalerieStatica();

    const minute = new Date().getMinutes();
    let sfert;
    if (minute < 15) sfert = 1;
    else if (minute < 30) sfert = 2;
    else if (minute < 45) sfert = 3;
    else sfert = 4;

    let imaginiFiltrate = galerie.imagini.filter(img => img.sfert_ora === sfert);
    imaginiFiltrate = imaginiFiltrate.slice(0, 10);

    res.render("pagini/index", {
        ip: req.ip,
        imagini: imaginiFiltrate,
        paginaCurenta: "index"
    });
});
app.get("/despre", function (req, res) {
    res.render("pagini/despre", {
        paginaCurenta: "despre"
    });
});

app.get("/eroare", function (req, res) {
    afisareEroare(res, 404);
});

/* =========================
   RUTA GENERALA PAGINI
========================= */
app.get("/*pagina", function (req, res) {
    console.log("Cale pagina", req.url);

    if (req.url.startsWith("/resurse") && path.extname(req.url) == "") {
        afisareEroare(res, 403);
        return;
    }

    if (path.extname(req.url) == ".ejs") {
        afisareEroare(res, 400);
        return;
    }

    try {
        res.render("pagini" + req.url, function (err, rezRandare) {
            if (err) {
                if (err.message.includes("Failed to lookup view")) {
                    afisareEroare(res, 404);
                } else {
                    afisareEroare(res);
                }
            } else {
                res.send(rezRandare);
            }
        });
    } catch (err) {
        if (err.message.includes("Cannot find module")) {
            afisareEroare(res, 404);
        } else {
            afisareEroare(res);
        }
    }
});

/* =========================
   PORNIRE SERVER
========================= */
(async function () {
    try {
        await initImagini();
        await initGalerieStatica();

        const PORT = process.env.PORT || 8080;
        app.listen(PORT, function () {
            console.log("Serverul a pornit!");
            console.log("Port:", PORT);
        });
    } catch (err) {
        console.error("Eroare la pornirea serverului:", err);
    }
})();