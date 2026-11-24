// Datos iniciales de BLACKBOX

// MongoDB ejecutará este script con mongosh cuando inicialice
// por primera vez un volumen de datos vacío.

// Cargaremos 6 casos, con 3 expedientes y 3 enigmas por expediente.

// Seleccionamos la colección donde guardaremos los casos.
const casesCollection = db.getCollection("cases");

// Comprobamos en qué base de datos se está ejecutando el script.
print("---------------------- Preparando los casos de BLACKBOX en:", db.getName());


//Leemos el archivo cases.json y convertimos su contenido en un array de objetos js (que servirá para después insertartarlo en MongoDB)
const fs = require("fs");
const cases = JSON.parse(
    fs.readFileSync("/docker-entrypoint-initdb.d/cases.json","utf8")
);

print("------------------------ Casos encontrados en el JSON: ", cases.length);


//COMPROBACIONES

//Comprobamos que el JSON contiene exactamente 6 casos.
if (!Array.isArray(cases) || cases.length !== 6) {
    throw new Error("BLACKBOX debe tener exactamente 6 casos");
}

// Recorremos los casos para comprobar su estructura.
let totalEnigmas = 0;

for (const caso of cases) {
    if (!Array.isArray(caso.files) || caso.files.length !== 3) {
        throw new Error(`El caso ${caso.code} debe tener 3 expedientes`);
    }

    for (const expediente of caso.files) {
        if (!Array.isArray(expediente.enigmas) || expediente.enigmas.length !== 3) {
            throw new Error(`El expediente ${expediente.title} debe tener 3 enigmas`);
        }

        totalEnigmas += expediente.enigmas.length;
    }
}

print("-------------------------------- Estructura comprobada: 6 casos y", totalEnigmas, "enigmas");



// Comprueba que un campo tenga un texto válido.
function comprobarTexto(valor, nombreCampo) {
    if (typeof valor !== "string" || valor.trim() === "") {
        throw new Error(`El campo ${nombreCampo} debe contener texto`);
    }
}



// Comprobamos los campos obligatorios de cada documento.
for (const caso of cases) {
    comprobarTexto(caso.code, "code del caso");
    comprobarTexto(caso.title, "title del caso");
    comprobarTexto(caso.description, "description del caso");
    comprobarTexto(caso.completionMessage, "completionMessage del caso");

    for (const expediente of caso.files) {
        comprobarTexto(expediente.title, "title del expediente");
        comprobarTexto(expediente.intro, "intro del expediente");

        for (const enigma of expediente.enigmas) {
            comprobarTexto(enigma.code, "code del enigma");
            comprobarTexto(enigma.title, "title del enigma");
            comprobarTexto(enigma.question, "question del enigma");
            comprobarTexto(enigma.content, "content del enigma");
            comprobarTexto(enigma.answer, "answer del enigma");
            comprobarTexto(enigma.explanation, "explanation del enigma");
        }
    }
}

print("------------------------ Campos obligatorios comprobados");





function comprobarOrdenes(elementos, nombre, maximo = null) {
    const ordenes = elementos.map(elemento => elemento.order);

    // Comprobamos que los órdenes sean enteros y estén dentro del rango.
    if (!ordenes.every(orden =>
        Number.isInteger(orden) &&
        orden >= 1 &&
        (maximo === null || orden <= maximo)
    )) {
        throw new Error(`Los órdenes de ${nombre} no son válidos`);
    }

    // Comprobamos que los órdenes no estén repetidos.
    if (new Set(ordenes).size !== ordenes.length) {
        throw new Error(`Hay órdenes repetidos en ${nombre}`);
    }
}



// Comprobamos los órdenes de los casos.
// Los casos pueden seguir creciendo en el futuro.
comprobarOrdenes(cases, "los casos");

for (const caso of cases) {
    comprobarOrdenes(caso.files, `los expedientes del caso ${caso.code}`, 3);

    for (const expediente of caso.files) {
        comprobarOrdenes(
            expediente.enigmas,
            `los enigmas del expediente ${expediente.order} del caso ${caso.code}`,
            3
        );
    }
}


print("------------------------ Órdenes comprobados correctamente");



// Comprueba que un texto no supere el límite de caracteres.
function comprobarMaximoTexto(valor, maximo, nombreCampo) {
    if (valor.length > maximo) {
        throw new Error(`El campo ${nombreCampo} no puede superar los ${maximo} caracteres`);
    }
}




// Comprobamos las longitudes máximas de los textos.
for (const caso of cases) {
    comprobarMaximoTexto(caso.code, 30, "code del caso");
    comprobarMaximoTexto(caso.title, 100, "title del caso");
    comprobarMaximoTexto(caso.description, 4000, "description del caso");
    comprobarMaximoTexto(caso.completionMessage, 3000, "completionMessage del caso");

    for (const expediente of caso.files) {
        comprobarMaximoTexto(expediente.title, 100, "title del expediente");
        comprobarMaximoTexto(expediente.intro, 3000, "intro del expediente");

        for (const enigma of expediente.enigmas) {
            comprobarMaximoTexto(enigma.code, 30, "code del enigma");
            comprobarMaximoTexto(enigma.title, 100, "title del enigma");
            comprobarMaximoTexto(enigma.question, 500, "question del enigma");
            comprobarMaximoTexto(enigma.content, 10000, "content del enigma");
            comprobarMaximoTexto(enigma.answer, 500, "answer del enigma");
            comprobarMaximoTexto(enigma.explanation, 4000, "explanation del enigma");
        }
    }
}

print("------------------------ Longitudes de texto comprobadas");



//INSERCIÓN de la colección


// Comprobamos que cada caso tenga un código diferente.
const codigos = cases.map(caso => caso.code);

if (new Set(codigos).size !== codigos.length) {
    throw new Error("Hay códigos de caso repetidos en cases.json");
}

print("------------------------ Códigos de los casos comprobados");


// Creamos índices únicos para evitar códigos y órdenes repetidos.
casesCollection.createIndex(
    { code: 1 },
    { unique: true }
);

casesCollection.createIndex(
    { order: 1 },
    { unique: true }
);

print("------------------------ Índices únicos creados");




// Insertamos los casos que todavía no existen en MongoDB.
let casosInsertados = 0;

for (const caso of cases) {
    const fecha = new Date();

    const resultado = casesCollection.updateOne(
        { code: caso.code },
        {
            $setOnInsert: {
                ...caso,
                createdAt: fecha,
                updatedAt: fecha,
                __v: 0
            }
        },
        { upsert: true }
    );

    casosInsertados += resultado.upsertedCount;
}

print("------------------------ Casos nuevos insertados:", casosInsertados);
print("------------------------ Casos que ya existían:", cases.length - casosInsertados);



