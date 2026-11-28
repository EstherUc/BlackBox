import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { Types } from "mongoose";

import router from "../src/routes/router.ts";
import { notFound, errorHandler } from "../src/middlewares/error.middleware.ts";
import { getAllCases, getCaseById } from "../src/repositories/case.repository.ts";
import { CaseModel } from "../src/models/case.model.ts";

// REPOSITORIO SIMULADO
// Sustituimos las lecturas de MongoDB por resultados preparados en memoria.
// Probamos las rutas y los controladores SIN modificar los 6 casos reales.
vi.mock("../src/repositories/case.repository.ts", () => ({
    getAllCases: vi.fn(),
    getCaseById: vi.fn()
}));

// DATOS DE PRUEBA
// Generamos un documento con expedientes, enigmas y soluciones ficticias.
// Tener datos secretos en el documento permite comprobar que la API NO los envía.
function createTestCase(order: number) {
    return new CaseModel({
        code: `CASE_${String(order).padStart(2, "0")}`,
        order,
        title: `Caso de prueba ${order}`,
        description: `Descripción pública del caso ${order}`,
        completionMessage: "MENSAJE_FINAL_SECRETO",
        files: [1, 2, 3].map((fileOrder) => ({
            order: fileOrder,
            title: `Expediente ${fileOrder}`,
            intro: "Introducción que no se publica todavía",
            enigmas: [1, 2, 3].map((enigmaOrder) => ({
                order: enigmaOrder,
                code: `E${fileOrder}${enigmaOrder}`,
                title: "Enigma de prueba",
                question: "Pregunta secreta",
                content: "CONTENIDO_NO_PUBLICO",
                answer: "RESPUESTA_SECRETA",
                explanation: "EXPLICACION_SECRETA"
            }))
        }))
    });
}

// APLICACIÓN EXPRESS PARA TESTS
// No importamos index.ts: ese archivo conecta MongoDB y abre el puerto 3000.
// Montamos aquí las mismas rutas y los mismos middlewares de errores.
const app = express();
app.use(express.json());
app.use("/api", router);
app.use(notFound);
app.use(errorHandler);

// Limpiamos los mocks entre pruebas para que sean independientes.
beforeEach(() => {
    vi.resetAllMocks();
});

// SEGURIDAD: lista de campos que nunca debe enseñar una ficha pública.
function expectPublicCase(responseData: Record<string, unknown>) {
    expect(responseData).toHaveProperty("_id");
    expect(responseData).toHaveProperty("code");
    expect(responseData).toHaveProperty("order");
    expect(responseData).toHaveProperty("title");
    expect(responseData).toHaveProperty("description");

    expect(responseData).not.toHaveProperty("files");
    expect(responseData).not.toHaveProperty("completionMessage");

    // Si alguien añadiese un campo secreto en otro nivel, también lo detectaríamos.
    const json = JSON.stringify(responseData);
    expect(json).not.toContain("RESPUESTA_SECRETA");
    expect(json).not.toContain("EXPLICACION_SECRETA");
    expect(json).not.toContain("CONTENIDO_NO_PUBLICO");
    expect(json).not.toContain("MENSAJE_FINAL_SECRETO");
}

describe("API de casos", () => {
    describe("GET /api/cases", () => {
        it("devuelve 200 y un listado de fichas públicas", async () => {
            // Preparamos lo que devolvería el repositorio después de ordenar.
            const firstCase = createTestCase(1);
            const secondCase = createTestCase(2);
            vi.mocked(getAllCases).mockResolvedValue([firstCase, secondCase]);

            const response = await request(app).get("/api/cases");

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data[0].code).toBe("CASE_01");
            expect(response.body.data[1].code).toBe("CASE_02");
            expect(getAllCases).toHaveBeenCalledOnce();

            // Las dos fichas deben ocultar los datos del juego.
            response.body.data.forEach(expectPublicCase);
        });

        it("devuelve un array vacío si no hay casos", async () => {
            vi.mocked(getAllCases).mockResolvedValue([]);

            const response = await request(app).get("/api/cases");

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual([]);
        });

        it("no filtra soluciones aunque el repositorio devuelva documentos completos", async () => {
            // Aquí simulamos intencionadamente un repositorio que NO hizo select().
            // El controlador debe seguir enviando únicamente los campos públicos.
            vi.mocked(getAllCases).mockResolvedValue([createTestCase(1)]);

            const response = await request(app).get("/api/cases");

            expect(response.status).toBe(200);
            expectPublicCase(response.body.data[0]);
        });
    });

    describe("GET /api/cases/:id", () => {
        it("devuelve 200 con la ficha pública del caso solicitado", async () => {
            const caseDocument = createTestCase(3);
            const id = caseDocument._id.toString();
            vi.mocked(getCaseById).mockResolvedValue(caseDocument);

            const response = await request(app).get(`/api/cases/${id}`);

            expect(response.status).toBe(200);
            expect(getCaseById).toHaveBeenCalledWith(id);
            expect(response.body.data._id).toBe(id);
            expect(response.body.data.code).toBe("CASE_03");
            expectPublicCase(response.body.data);
        });

        it("devuelve 400 si el identificador tiene un formato incorrecto", async () => {
            const response = await request(app).get("/api/cases/no-es-un-id");

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("El identificador del caso no es válido");
            // No hace falta preguntar a MongoDB si el formato ya es incorrecto.
            expect(getCaseById).not.toHaveBeenCalled();
        });

        it("devuelve 404 si el identificador es válido pero no existe", async () => {
            const id = new Types.ObjectId().toString();
            vi.mocked(getCaseById).mockResolvedValue(null);

            const response = await request(app).get(`/api/cases/${id}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("El caso no existe");
            expect(getCaseById).toHaveBeenCalledWith(id);
        });

        it("devuelve 500 sin exponer detalles internos si falla la consulta", async () => {
            vi.mocked(getCaseById).mockRejectedValue(new Error("Fallo interno secreto"));
            const id = new Types.ObjectId().toString();
            // Evitamos que el error esperado ensucie la consola durante este test.
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            try {
                const response = await request(app).get(`/api/cases/${id}`);

                expect(response.status).toBe(500);
                expect(response.body.error).toBe("Error interno del servidor");
                expect(JSON.stringify(response.body)).not.toContain("Fallo interno secreto");
            } finally {
                consoleSpy.mockRestore();
            }
        });
    });
});
