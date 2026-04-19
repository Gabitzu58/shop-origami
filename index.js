const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass");
const { text } = require("stream/consumers");

const app = express();
app.set("view engine", "ejs");

const obGlobal = {
    obErori: null,
    obImagini: null,
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup"),
};

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

let vect_foldere=[ "temp", "logs", "backup", "fisiere_uploadate" ]
for (let folder of vect_foldere){
    let caleFolder=path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(path.join(caleFolder), {recursive:true});   
    }
}

app.use("/resurse", express.static(path.join(__dirname, "resurse")));

app.get("/favicon.ico", function(req, res){
    res.sendFile(path.join(__dirname,"resurse/imagini/favicon/favicon.ico"))
});

app.get(["/", "/index", "/home"], function(req, res){
    res.render("pagini/index", {
        ip: req.ip,
        paginaCurenta: "index"
    });
});

app.get("/despre", function(req, res){
    res.render("pagini/despre", {
        paginaCurenta: "despre"
    });
});
app.get("/despre", function(req, res){
    res.render("pagini/despre");
});

function initErori(){
    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json"), "utf-8");
    let erori = JSON.parse(continut);

    erori.eroare_default.imagine = erori.cale_baza + "/" + erori.eroare_default.imagine;

    for (let eroare of erori.info_erori){
        eroare.imagine = erori.cale_baza + "/" + eroare.imagine;
    }

    obGlobal.obErori = erori;
}
initErori();


function compileazaScss(caleScss, caleCss){
    if(!caleCss){
        let numeFisExt = path.basename(caleScss);
        let numeFis = numeFisExt.split(".")[0];
        caleCss = numeFis + ".css";
    }

    if (!path.isAbsolute(caleScss))
        caleScss = path.join(obGlobal.folderScss, caleScss);
    if (!path.isAbsolute(caleCss))
        caleCss = path.join(obGlobal.folderCss, caleCss);

    let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, { recursive: true });
    }

    let numeFisCss = path.basename(caleCss);
    if (fs.existsSync(caleCss)){
        fs.copyFileSync(caleCss, path.join(caleBackup, numeFisCss));
    }

    let rez = sass.compile(caleScss, { sourceMap: true });
    fs.writeFileSync(caleCss, rez.css);
}

let vFisiere = fs.readdirSync(obGlobal.folderScss);
for (let numeFis of vFisiere){
    if (path.extname(numeFis) == ".scss"){
        compileazaScss(numeFis);
    }
}

fs.watch(obGlobal.folderScss, function(eveniment, numeFis){
    if (eveniment == "change" || eveniment == "rename"){
        let caleCompleta = path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)){
            compileazaScss(caleCompleta);
        }
    }
});

function afisareEroare(res, identificator, titlu, text, imagine){
    let eroare = obGlobal.obErori.info_erori.find((elem) => 
         elem.identificator == identificator
)

let errDefault = obGlobal.obErori.eroare_default;
if(eroare?.status)
    res.status(eroare.identificator)
res.render("pagini/eroare", {
        imagine: imagine || eroare?.imagine ||  errDefault.imagine,
        titlu:titlu || eroare?.titlu ||  errDefault.titlu ,
        text:text || eroare?.text ||  errDefault.text,
    });

}
app.get("/eroare", function(req, res){
    afisareEroare(res,404,"Titlul!!")
});
app.get("/*pagina", function(req, res){
    console.log("Cale pagina", req.url);
    if (req.url.startsWith("/resurse") && path.extname(req.url)==""){
        afisareEroare(res,403);
        return;
    }
    if (path.extname(req.url)==".ejs"){
        afisareEroare(res,400);
        return;
    }
    try{
        res.render("pagini"+req.url, function(err, rezRandare){
            if (err){
                if (err.message.includes("Failed to lookup view")){
                    afisareEroare(res,404)
                }
                else{
                    afisareEroare(res);
                }
            }
            else{
                res.send(rezRandare);
                console.log("Rezultat randare", rezRandare);
            }
        });
    }
    catch(err){
        if (err.message.includes("Cannot find module")){
            afisareEroare(res,404)
        }
        else{
            afisareEroare(res);
        }
    }
});

app.listen(8080);
console.log("Serverul a pornit!");