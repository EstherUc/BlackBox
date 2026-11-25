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

for (const caseData of cases) {
    if (!Array.isArray(caseData.files) || caseData.files.length !== 3) {
        throw new Error(`El caso ${caseData.code} debe tener 3 expedientes`);
    }

    for (const fileData of caseData.files) {
        if (!Array.isArray(fileData.enigmas) || fileData.enigmas.length !== 3) {
            throw new Error(`El expediente ${fileData.title} debe tener 3 enigmas`);
        }

        totalEnigmas += fileData.enigmas.length;
    }
}

print("-------------------------------- Estructura comprobada: 6 casos y", totalEnigmas, "enigmas");



// Comprueba que un campo tenga un texto válido.
function validateText(value, fieldName) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`El campo ${fieldName} debe contener texto`);
    }
}



// Comprobamos los campos obligatorios de cada documento.
for (const caseData of cases) {
    validateText(caseData.code, "code del caso");
    validateText(caseData.title, "title del caso");
    validateText(caseData.description, "description del caso");
    validateText(caseData.completionMessage, "completionMessage del caso");

    for (const fileData of caseData.files) {
        validateText(fileData.title, "title del expediente");
        validateText(fileData.intro, "intro del expediente");

        for (const enigmaData of fileData.enigmas) {
            validateText(enigmaData.code, "code del enigma");
            validateText(enigmaData.title, "title del enigma");
            validateText(enigmaData.question, "question del enigma");
            validateText(enigmaData.content, "content del enigma");
            validateText(enigmaData.answer, "answer del enigma");
            validateText(enigmaData.explanation, "explanation del enigma");
        }
    }
}

print("------------------------ Campos obligatorios comprobados");





function validateOrders(items, context, maximum = null) {
    const orders = items.map(item => item.order);

    // Comprobamos que los órdenes sean enteros y estén dentro del rango.
    if (!orders.every(order =>
        Number.isInteger(order) &&
        order >= 1 &&
        (maximum === null || order <= maximum)
    )) {
        throw new Error(`Los órdenes de ${context} no son válidos`);
    }

    // Comprobamos que los órdenes no estén repetidos.
    if (new Set(orders).size !== orders.length) {
        throw new Error(`Hay órdenes repetidos en ${context}`);
    }
}



// Comprobamos los órdenes de los casos.
// Los casos pueden seguir creciendo en el futuro.
validateOrders(cases, "los casos");

for (const caseData of cases) {
    validateOrders(caseData.files, `los expedientes del caso ${caseData.code}`, 3);

    for (const fileData of caseData.files) {
        validateOrders(
            fileData.enigmas,
            `los enigmas del expediente ${fileData.order} del caso ${caseData.code}`,
            3
        );
    }
}


print("------------------------ Órdenes comprobados correctamente");



// Comprueba que un texto no supere el límite de caracteres.
function validateMaxTextLength(value, maximum, fieldName) {
    if (value.length > maximum) {
        throw new Error(`El campo ${fieldName} no puede superar los ${maximum} caracteres`);
    }
}




// Comprobamos las longitudes máximas de los textos.
for (const caseData of cases) {
    validateMaxTextLength(caseData.code, 30, "code del caso");
    validateMaxTextLength(caseData.title, 100, "title del caso");
    validateMaxTextLength(caseData.description, 4000, "description del caso");
    validateMaxTextLength(caseData.completionMessage, 3000, "completionMessage del caso");

    for (const fileData of caseData.files) {
        validateMaxTextLength(fileData.title, 100, "title del expediente");
        validateMaxTextLength(fileData.intro, 3000, "intro del expediente");

        for (const enigmaData of fileData.enigmas) {
            validateMaxTextLength(enigmaData.code, 30, "code del enigma");
            validateMaxTextLength(enigmaData.title, 100, "title del enigma");
            validateMaxTextLength(enigmaData.question, 500, "question del enigma");
            validateMaxTextLength(enigmaData.content, 10000, "content del enigma");
            validateMaxTextLength(enigmaData.answer, 500, "answer del enigma");
            validateMaxTextLength(enigmaData.explanation, 4000, "explanation del enigma");
        }
    }
}

print("------------------------ Longitudes de texto comprobadas");



//INSERCIÓN de la colección


// Comprobamos que cada caso tenga un código diferente.
const codes = cases.map(caseData => caseData.code);

if (new Set(codes).size !== codes.length) {
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
let insertedCasesCount = 0;

for (const caseData of cases) {
    const timestamp = new Date();

    const result = casesCollection.updateOne(
        { code: caseData.code },
        {
            $setOnInsert: {
                ...caseData,
                createdAt: timestamp,
                updatedAt: timestamp,
                __v: 0
            }
        },
        { upsert: true }
    );

    insertedCasesCount += result.upsertedCount;
}

print("------------------------ Casos nuevos insertados:", insertedCasesCount);
print("------------------------ Casos que ya existían:", cases.length - insertedCasesCount);