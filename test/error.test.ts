import { describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";

import { HttpError } from "../src/utils/HttpError.ts";
import { notFound, errorHandler } from "../src/middlewares/error.middleware.ts";
import { UserModel } from "../src/models/user.model.ts";

// APLICACIÓN DE PRUEBA
// No hace falta conectar a MongoDB ni arrancar el index.ts.
// Creamos rutas pequeñas que provocan cada tipo de error deliberadamente.
function createTestApp() {
    const app = express();
    app.use(express.json());

    // Ruta de ejemplo para comprobar también los errores al interpretar JSON.
    app.post("/api/test", (_req, res) => {
        res.json({ message: "Petición recibida" });
    });

    // Error controlado: lo crea nuestro propio código mediante HttpError.
    app.get("/api/prohibido", () => {
        throw new HttpError(403, "No tienes permiso para acceder");
    });

    // Error inesperado: no es un HttpError, así que debe responder con 500.
    app.get("/api/inesperado", () => {
        throw new Error("Información interna que no debe llegar al cliente");
    });

    // Error de validación real de Mongoose, pero sin guardar el documento.
    app.get("/api/validacion", async () => {
        const user = new UserModel({
            username: "ab", // Menos de 3 caracteres.
            email: "email-invalido",
            passwordHash: "hash-de-prueba",
            role: "user"
        });
        await user.validate(); // Lanza ValidationError.
    });

    // Simulamos un ObjectId mal formado.
    app.get("/api/identificador", () => {
        throw new mongoose.Error.CastError("ObjectId", "id-incorrecto", "_id");
    });

    // Simulamos un índice unique duplicado en MongoDB (código 11000).
    app.get("/api/duplicado", () => {
        const error = Object.assign(new Error("Clave duplicada"), {
            code: 11000,
            keyValue: { email: "laura@ejemplo.com" }
        });
        throw error;
    });

    // Los middlewares de errores siempre van DESPUÉS de las rutas.
    app.use(notFound);
    app.use(errorHandler);

    return app;
}

const app = createTestApp();

describe("Gestión de errores", () => {

    // ERROR 404: RUTA QUE NO EXISTE
    describe("Rutas inexistentes", () => {
        it("devuelve 404 cuando solicitamos una ruta inexistente", async () => {
            const response = await request(app).get("/api/no-existe");

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("No existe la ruta GET /api/no-existe");
        });
    });

    // HTTPERROR: ERRORES QUE CONTROLAMOS NOSOTROS
    describe("Errores personalizados", () => {
        it("conserva el código y mensaje de un HttpError", async () => {
            const response = await request(app).get("/api/prohibido");

            expect(response.status).toBe(403);
            expect(response.body.error).toBe("No tienes permiso para acceder");
        });
    });

    // VALIDACIONES DE MONGOOSE
    describe("Errores de Mongoose", () => {
        it("convierte ValidationError en 400 con los detalles de los campos", async () => {
            const response = await request(app).get("/api/validacion");

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Hay datos que no son válidos");
            expect(response.body.details).toHaveProperty("username");
            expect(response.body.details).toHaveProperty("email");
        });

        it("convierte CastError en 400", async () => {
            const response = await request(app).get("/api/identificador");

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("El identificador proporcionado no es válido");
        });

        it("convierte el error 11000 de MongoDB en 409", async () => {
            const response = await request(app).get("/api/duplicado");

            expect(response.status).toBe(409);
            expect(response.body.error).toBe("El campo email ya está registrado");
        });
    });

    // JSON MAL FORMADO
    describe("Formato del cuerpo de la petición", () => {
        it("devuelve 400 cuando enviamos un JSON mal escrito", async () => {
            const response = await request(app)
                .post("/api/test")
                .set("Content-Type", "application/json")
                .send('{"email":'); // JSON incompleto a propósito.

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("El cuerpo de la petición no contiene un JSON válido");
        });
    });

    // ERROR INESPERADO
    describe("Errores internos", () => {
        it("devuelve 500 sin mostrar información interna del servidor", async () => {
            // Ocultamos el log esperado durante este test, sin cambiar el middleware.
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            try {
                const response = await request(app).get("/api/inesperado");

                expect(response.status).toBe(500);
                expect(response.body.error).toBe("Error interno del servidor");
                expect(JSON.stringify(response.body)).not.toContain("Información interna");
                expect(consoleSpy).toHaveBeenCalled();
            } finally {
                consoleSpy.mockRestore();
            }
        });
    });
});
