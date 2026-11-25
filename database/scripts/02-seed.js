// Datos ficticios para practicar y mostrar BLACKBOX.
// MongoDB ejecuta este archivo después de 01-seed.js al iniciar un volumen vacío.
// Estos usuarios y sesiones NO son datos reales. 

// Encapsulamos el script para no reutilizar nombres globales de 01-seed.js.
(function seedSampleData() {
    const fs = require("fs");
    const usersCollection = db.getCollection("users");
    const sessionsCollection = db.getCollection("sessions");
    const casesCollection = db.getCollection("cases");

    // Leemos los JSON con datos ficticios. Las contraseñas ya están cifradas con bcrypt.
    const users = JSON.parse(fs.readFileSync("/docker-entrypoint-initdb.d/users.json", "utf8"));
    const sessions = JSON.parse(fs.readFileSync("/docker-entrypoint-initdb.d/sessions.json", "utf8"));

    print("------------------------ Preparando usuarios y sesiones ficticias en:", db.getName());

    // No hacemos ninguna inserción si faltan los datos o si los casos aún no existen.
    if (!Array.isArray(users) || users.length === 0 || !Array.isArray(sessions) || sessions.length === 0) {
        throw new Error("Los JSON de usuarios y sesiones deben contener arrays no vacíos");
    }

    const cases = casesCollection.find({}).toArray();
    const casesByCode = new Map(cases.map(caseData => [caseData.code, caseData]));

    if (casesByCode.size < 6) {
        throw new Error("Primero deben cargarse los seis casos con 01-seed.js");
    }

    // VALIDACIONES DE LOS USUARIOS
    const usernames = new Set();
    const emails = new Set();
    for (const userData of users) {
        if (typeof userData.username !== "string" || userData.username.length < 3 || userData.username.length > 15) {
            throw new Error("El nombre de usuario ficticio no es válido");
        }
        if (typeof userData.email !== "string" || !/^\S+@\S+\.\S+$/.test(userData.email) || userData.email !== userData.email.toLowerCase()) {
            throw new Error(`El email de ${userData.username} no es válido`);
        }
        if (!/^(\$2a\$|\$2b\$)\d{2}\$[./A-Za-z0-9]{53}$/.test(userData.passwordHash)) {
            throw new Error(`El hash bcrypt de ${userData.username} no es válido`);
        }
        if (!["user", "admin"].includes(userData.role)) {
            throw new Error(`El rol de ${userData.username} no es válido`);
        }
        if (usernames.has(userData.username) || emails.has(userData.email)) {
            throw new Error("Hay usuarios o emails repetidos en users.json");
        }
        usernames.add(userData.username);
        emails.add(userData.email);
    }

    // VALIDACIONES DE LAS SESIONES
    const sessionKeys = new Set();
    const sessionsByUsername = new Map();
    for (const sessionData of sessions) {
        const { username, caseCode, attempt, currentFile, currentEnigma,
            remainingLives, status, pointsEarned, startedDaysAgo, durationMinutes } = sessionData;
        const caseData = casesByCode.get(caseCode);

        if (!usernames.has(username) || !caseData) {
            throw new Error(`Usuario o caso inexistente en una sesión: ${username} / ${caseCode}`);
        }
        if (users.find(userData => userData.username === username).role !== "user") {
            throw new Error("Los administradores no deben tener sesiones ficticias");
        }
        if (!Number.isInteger(attempt) || attempt < 1 ||
            !Number.isInteger(currentFile) || currentFile < 1 || currentFile > 3 ||
            !Number.isInteger(currentEnigma) || currentEnigma < 1 || currentEnigma > 3 ||
            !Number.isInteger(remainingLives) || remainingLives < 0 || remainingLives > 6 ||
            !Number.isInteger(pointsEarned) || pointsEarned < 0 || pointsEarned > 6) {
            throw new Error(`Valores numéricos incorrectos en ${username} / ${caseCode}`);
        }
        if (!["active", "completed", "failed"].includes(status)) {
            throw new Error(`Estado de sesión no válido para ${username}`);
        }
        if (!Number.isInteger(startedDaysAgo) || startedDaysAgo < 1 ||
            !Number.isInteger(durationMinutes) || durationMinutes < 1) {
            throw new Error(`Fechas de ejemplo incorrectas para ${username}`);
        }
        if ((status === "failed" && remainingLives !== 0) ||
            (status !== "failed" && remainingLives === 0) ||
            (status === "completed" && (currentFile !== 3 || currentEnigma !== 3))) {
            throw new Error(`El progreso no concuerda con el estado de ${username}`);
        }
        if (status === "completed" && attempt === 1) {
            if (pointsEarned !== remainingLives) {
                throw new Error(`La puntuación del primer intento de ${username} es incorrecta`);
            }
        } else if (pointsEarned !== 0) {
            throw new Error(`Solo el primer intento completado puede puntuar: ${username}`);
        }

        const key = `${username}:${caseCode}:${attempt}`;
        if (sessionKeys.has(key)) {
            throw new Error(`Hay un intento repetido en sessions.json: ${key}`);
        }
        sessionKeys.add(key);
        if (!sessionsByUsername.has(username)) sessionsByUsername.set(username, []);
        sessionsByUsername.get(username).push(sessionData);
    }

    // Comprobamos que los casos se desbloquean por orden y los reintentos siguen a fallos.
    for (const [username, userSessions] of sessionsByUsername) {
        userSessions.sort((first, second) => second.startedDaysAgo - first.startedDaysAgo);
        const completedCases = new Set();
        const lastAttempt = new Map();
        let activeSessions = 0;

        for (const sessionData of userSessions) {
            const caseData = casesByCode.get(sessionData.caseCode);
            if (caseData.order > 1) {
                const previousCase = cases.find(item => item.order === caseData.order - 1);
                if (!previousCase || !completedCases.has(previousCase.code)) {
                    throw new Error(`${username} tiene un caso sin desbloquear: ${sessionData.caseCode}`);
                }
            }
            const prior = lastAttempt.get(sessionData.caseCode);
            if (sessionData.attempt === 1 && prior ||
                sessionData.attempt > 1 && (!prior || prior.attempt !== sessionData.attempt - 1 || prior.status !== "failed")) {
                throw new Error(`Secuencia de intentos incorrecta para ${username} / ${sessionData.caseCode}`);
            }
            if (sessionData.status === "active") activeSessions++;
            if (sessionData.status === "completed") completedCases.add(sessionData.caseCode);
            lastAttempt.set(sessionData.caseCode, sessionData);
        }
        if (activeSessions > 1) throw new Error(`${username} tiene más de una sesión activa`);
    }

    // ÍNDICES: equivalen a los únicos que definimos en los modelos de Mongoose.
    usersCollection.createIndex({ username: 1 }, { unique: true });
    usersCollection.createIndex({ email: 1 }, { unique: true });
    sessionsCollection.createIndex({ userId: 1, caseId: 1, attempt: 1 }, { unique: true });

    // INSERCIÓN DE LOS USUARIOS (sin duplicarlos ni sobrescribir los existentes).
    const now = new Date();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    let insertedUsersCount = 0;
    for (const userData of users) {
        const userSessions = sessionsByUsername.get(userData.username) || [];
        const oldestSessionDays = userSessions.length
            ? Math.max(...userSessions.map(sessionData => sessionData.startedDaysAgo)) + 2
            : 5;
        const createdAt = new Date(now.getTime() - oldestSessionDays * millisecondsPerDay);
        const result = usersCollection.updateOne(
            { username: userData.username, email: userData.email },
            { $setOnInsert: { ...userData, createdAt, updatedAt: createdAt, __v: 0 } },
            { upsert: true }
        );
        insertedUsersCount += result.upsertedCount;
    }

    // INSERCIÓN DE SESIONES: buscamos los ObjectId reales de cada usuario y caso.
    let insertedSessionsCount = 0;
    for (const sessionData of sessions) {
        const userData = usersCollection.findOne({ username: sessionData.username });
        const caseData = casesByCode.get(sessionData.caseCode);
        const createdAt = new Date(now.getTime() - sessionData.startedDaysAgo * millisecondsPerDay);
        const updatedAt = new Date(createdAt.getTime() + sessionData.durationMinutes * 60 * 1000);
        const finishedAt = sessionData.status === "active" ? null : updatedAt;

        const result = sessionsCollection.updateOne(
            { userId: userData._id, caseId: caseData._id, attempt: sessionData.attempt },
            {
                $setOnInsert: {
                    userId: userData._id,
                    caseId: caseData._id,
                    attempt: sessionData.attempt,
                    currentFile: sessionData.currentFile,
                    currentEnigma: sessionData.currentEnigma,
                    remainingLives: sessionData.remainingLives,
                    status: sessionData.status,
                    pointsEarned: sessionData.pointsEarned,
                    finishedAt,
                    createdAt,
                    updatedAt,
                    __v: 0
                }
            },
            { upsert: true }
        );
        insertedSessionsCount += result.upsertedCount;
    }

    print("------------------------ Usuarios ficticios nuevos:", insertedUsersCount, "de", users.length);
    print("------------------------ Sesiones ficticias nuevas:", insertedSessionsCount, "de", sessions.length);
    print("------------------------ Datos ficticios cargados correctamente");
})();
