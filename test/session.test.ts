import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import { SessionModel } from "../src/models/session.model.ts";
import type { ISession } from "../src/models/session.model.ts";

// SESIÓN DE PRUEBA
// Creamos una sesión válida para modificar solo el campo que queremos probar.
// Los ObjectId no tienen que existir en MongoDB para utilizar validate().
function createValidSession(): ISession {
    return {
        userId: new Types.ObjectId(),
        caseId: new Types.ObjectId(),
        attempt: 1,
        currentFile: 1,
        currentEnigma: 1,
        remainingLives: 6,
        status: "active",
        pointsEarned: 0,
        finishedAt: null
    };
}

describe("Modelo Session", () => {

    // VALIDACIÓN GENERAL Y VALORES POR DEFECTO
    describe("Sesión válida y valores por defecto", () => {
        it("acepta una sesión válida", async () => {
            const session = new SessionModel(createValidSession());

            await expect(session.validate()).resolves.toBeUndefined();
            expect(session.userId).toBeInstanceOf(Types.ObjectId);
            expect(session.caseId).toBeInstanceOf(Types.ObjectId);
        });

        it("comienza en el primer enigma, con 6 vidas y sin puntos", async () => {
            const validSession = createValidSession();
            const session = new SessionModel({
                userId: validSession.userId,
                caseId: validSession.caseId,
                attempt: 1
            });

            // Comprobamos que Mongoose aplica los valores default.
            expect(session.currentFile).toBe(1);
            expect(session.currentEnigma).toBe(1);
            expect(session.remainingLives).toBe(6);
            expect(session.status).toBe("active");
            expect(session.pointsEarned).toBe(0);
            expect(session.finishedAt).toBeNull();
            await expect(session.validate()).resolves.toBeUndefined();
        });
    });

    // CAMPOS OBLIGATORIOS: USUARIO, CASO E INTENTO
    describe("Campos obligatorios", () => {
        it.each([
            ["userId", "El usuario de la sesión es obligatorio"],
            ["caseId", "El número del caso es obligatorio"],
            ["attempt", "El número de intento es obligatorio"]
        ])("rechaza una sesión sin %s", async (field, message) => {
            const session = new SessionModel(createValidSession());
            session.set(field, undefined);

            await expect(session.validate()).rejects.toThrow(message);
        });
    });

    // ATTEMPT
    describe("Número de intento", () => {
        it.each([
            [0, "El intento debe ser al menos 1"],
            [1.5, "El intento debe ser un número entero"]
        ])("rechaza attempt = %s", async (attempt, message) => {
            const session = new SessionModel({ ...createValidSession(), attempt });

            await expect(session.validate()).rejects.toThrow(message);
        });

        it("permite un segundo intento", async () => {
            const session = new SessionModel({ ...createValidSession(), attempt: 2 });

            await expect(session.validate()).resolves.toBeUndefined();
        });
    });

    // PROGRESO: EXPEDIENTE Y ENIGMA ACTUALES
    describe("Progreso en el caso", () => {
        // Ambos valores tienen que ser enteros entre 1 y 3.
        it.each([
            ["currentFile", 0],
            ["currentFile", 4],
            ["currentFile", 1.5],
            ["currentEnigma", 0],
            ["currentEnigma", 4],
            ["currentEnigma", 1.5]
        ])("rechaza %s = %s", async (field, value) => {
            const session = new SessionModel(createValidSession());
            session.set(field, value);

            await expect(session.validate()).rejects.toThrow();
        });

        it("permite llegar al último enigma del tercer expediente", async () => {
            const session = new SessionModel({
                ...createValidSession(),
                currentFile: 3,
                currentEnigma: 3
            });

            await expect(session.validate()).resolves.toBeUndefined();
        });
    });

    // VIDAS RESTANTES
    describe("Integridad de la partida", () => {
        it.each([-1, 7, 2.5])("rechaza remainingLives = %s", async (remainingLives) => {
            const session = new SessionModel({ ...createValidSession(), remainingLives });

            await expect(session.validate()).rejects.toThrow();
        });
    });

    // ESTADO DE LA PARTIDA
    describe("Estado de la partida", () => {
        it("rechaza un estado no permitido", async () => {
            const session = new SessionModel(createValidSession());
            session.set("status", "paused");

            await expect(session.validate()).rejects.toThrow(
                "El estado de la sesión no es válido"
            );
        });

        it("acepta una sesión fallida con cero vidas y cero puntos", async () => {
            const session = new SessionModel({
                ...createValidSession(),
                remainingLives: 0,
                status: "failed",
                finishedAt: new Date()
            });

            await expect(session.validate()).resolves.toBeUndefined();
        });
    });

    // PUNTOS: LÍMITES Y REGLAS DEL PRIMER INTENTO
    describe("Puntuación", () => {
        it.each([-1, 7, 2.5])("rechaza pointsEarned = %s", async (pointsEarned) => {
            const session = new SessionModel({ ...createValidSession(), pointsEarned });

            await expect(session.validate()).rejects.toThrow();
        });

        // Solo el primer intento completado puede puntuar: vidas restantes = puntos.
        it("permite puntuar las vidas restantes al completar el primer intento", async () => {
            const session = new SessionModel({
                ...createValidSession(),
                remainingLives: 4,
                status: "completed",
                pointsEarned: 4,
                finishedAt: new Date()
            });

            await expect(session.validate()).resolves.toBeUndefined();
        });

        it("rechaza puntos distintos de las vidas restantes en el primer intento", async () => {
            const session = new SessionModel({
                ...createValidSession(),
                remainingLives: 4,
                status: "completed",
                pointsEarned: 5
            });

            await expect(session.validate()).rejects.toThrow(
                "El primer intento completado debe sumar las vidas restantes"
            );
        });

        it("rechaza completar el primer intento sin vidas", async () => {
            const session = new SessionModel({
                ...createValidSession(),
                remainingLives: 0,
                status: "completed",
                pointsEarned: 0
            });

            await expect(session.validate()).rejects.toThrow(
                "El primer intento completado debe sumar las vidas restantes"
            );
        });

        // Las sesiones activas, fallidas y los reintentos NO pueden puntuar.
        it("rechaza conseguir puntos mientras la sesión está activa", async () => {
            const session = new SessionModel({
                ...createValidSession(),
                pointsEarned: 6
            });

            await expect(session.validate()).rejects.toThrow(
                "Solo el primer intento completado puede conseguir puntos"
            );
        });

        it("rechaza dar puntos a una sesión fallida", async () => {
            const session = new SessionModel({
                ...createValidSession(),
                remainingLives: 0,
                status: "failed",
                pointsEarned: 3
            });

            await expect(session.validate()).rejects.toThrow(
                "Solo el primer intento completado puede conseguir puntos"
            );
        });

        it("permite completar un reintento sin conseguir puntos", async () => {
            const session = new SessionModel({
                ...createValidSession(),
                attempt: 2,
                remainingLives: 3,
                status: "completed",
                pointsEarned: 0,
                finishedAt: new Date()
            });

            await expect(session.validate()).resolves.toBeUndefined();
        });

        it("rechaza puntuar al completar un segundo intento", async () => {
            const session = new SessionModel({
                ...createValidSession(),
                attempt: 2,
                remainingLives: 4,
                status: "completed",
                pointsEarned: 4
            });

            await expect(session.validate()).rejects.toThrow(
                "Solo el primer intento completado puede conseguir puntos"
            );
        });
    });

    // CONFIGURACIÓN DE MONGOOSE
    describe("Configuración de Mongoose", () => {
        it("no muestra __v al convertir la sesión a JSON", () => {
            const session = new SessionModel(createValidSession());
            session.set("__v", 0);

            expect(session.toJSON()).not.toHaveProperty("__v");
        });

        it("declara un índice único para usuario, caso e intento", () => {
            // Esto comprueba la definición del índice, no lo prueba en MongoDB.
            const indexes = SessionModel.schema.indexes();

            expect(indexes).toEqual(expect.arrayContaining([
                [
                    { userId: 1, caseId: 1, attempt: 1 },
                    expect.objectContaining({ unique: true })
                ]
            ]));
        });

        it("tiene los timestamps activados", () => {
            expect(SessionModel.schema.options.timestamps).toBe(true);
        });
    });
});


