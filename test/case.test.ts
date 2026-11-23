
import { describe, it, expect } from "vitest";
import { CaseModel } from "../src/models/case.model.ts";
import type { ICase, IFile, IEnigma } from "../src/models/case.model.ts";

// DATOS DE PRUEBA: siempre partimos de un caso completo y válido.
function crearEnigma(order: number): IEnigma {
    return {
        order,
        code: `E${order}`,
        title: `Enigma ${order}`,
        question: "¿Cuál es el resultado?",
        content: "console.log(2 + 2)",
        answer: "4",
        explanation: "La suma de 2 + 2 es 4."
    };
}

function crearExpediente(order: number): IFile {
    return {
        order,
        title: `Expediente ${order}`,
        intro: "Introducción del expediente.",
        enigmas: [1, 2, 3].map(crearEnigma)
    };
}

function crearCasoValido(): ICase {
    return {
        code: "CASE_01",
        order: 1,
        title: "Caso de prueba",
        description: "Descripción del caso de prueba.",
        completionMessage: "¡Caso completado!",
        files: [1, 2, 3].map(crearExpediente)
    };
}

describe("Modelo Case", () => {

    describe("Caso válido", () => {
        it("acepta un caso con 3 expedientes y 3 enigmas por expediente", async () => {
            const caso = new CaseModel(crearCasoValido());

            await expect(caso.validate()).resolves.toBeUndefined();
            expect(caso.files).toHaveLength(3);

            caso.files.forEach((file) => {
                expect(file.enigmas).toHaveLength(3);
            });
        });
    });

    describe("Campos obligatorios del caso", () => {
        it.each([
            ["code", "El código del caso es obligatorio"],
            ["order", "El orden del caso es obligatorio"],
            ["title", "El título del caso es obligatorio"],
            ["description", "La descripción del caso es obligatoria"],
            ["completionMessage", "El mensaje de finalización del caso es obligatorio"]
        ])("rechaza un caso sin %s", async (campo, mensaje) => {
            const caso = new CaseModel({
                ...crearCasoValido(),
                [campo]: undefined
            });

            await expect(caso.validate()).rejects.toThrow(mensaje);
        });
    });

    describe("Orden del caso", () => {
        it.each([
            [0, "El orden del caso no puede ser menor que 1"],
            [7, "El orden del caso no puede ser mayor que 6"],
            [1.5, "El orden del caso debe ser un número entero"]
        ])("rechaza order = %s", async (order, mensaje) => {
            const caso = new CaseModel({
                ...crearCasoValido(),
                order
            });

            await expect(caso.validate()).rejects.toThrow(mensaje);
        });
    });

    describe("Longitud de los textos del caso", () => {
        it.each([
            ["code", 30],
            ["title", 100],
            ["description", 4000],
            ["completionMessage", 3000]
        ])("rechaza %s si supera %i caracteres", async (campo, maximo) => {
            const caso = new CaseModel({
                ...crearCasoValido(),
                [campo]: "x".repeat(maximo + 1)
            });

            await expect(caso.validate()).rejects.toThrow();
        });
    });

    describe("Expedientes embebidos", () => {
        it.each([0, 2, 4])("rechaza un caso con %i expedientes", async (cantidad) => {
            const datos = crearCasoValido();

            datos.files = Array.from(
                { length: cantidad },
                (_, i) => crearExpediente((i % 3) + 1)
            );

            const caso = new CaseModel(datos);

            await expect(caso.validate()).rejects.toThrow(
                "Cada caso debe contener exactamente 3 expedientes"
            );
        });

        it.each([
            ["order", "El orden del expediente es obligatorio"],
            ["title", "El título del expediente es obligatorio"],
            ["intro", "La introducción del expediente es obligatoria"]
        ])("rechaza un expediente sin %s", async (campo, mensaje) => {
            const datos = crearCasoValido();

            Object.assign(datos.files[0], {
                [campo]: undefined
            });

            const caso = new CaseModel(datos);

            await expect(caso.validate()).rejects.toThrow(mensaje);
        });

        it.each([
            [0, "El orden del expediente no puede ser menor que 1"],
            [4, "el orden del expediente no puede ser mayor que 3"],
            [1.5, "El orden del expediente debe ser un número entero"]
        ])("rechaza un expediente con order = %s", async (order, mensaje) => {
            const datos = crearCasoValido();

            datos.files[0].order = order;

            const caso = new CaseModel(datos);

            await expect(caso.validate()).rejects.toThrow(mensaje);
        });

        it.each([
            ["title", 100],
            ["intro", 3000]
        ])("rechaza %s del expediente si supera %i caracteres", async (campo, maximo) => {
            const datos = crearCasoValido();

            Object.assign(datos.files[0], {
                [campo]: "x".repeat(maximo + 1)
            });

            const caso = new CaseModel(datos);

            await expect(caso.validate()).rejects.toThrow();
        });
    });

    describe("Enigmas embebidos", () => {
        it.each([0, 2, 4])("rechaza un expediente con %i enigmas", async (cantidad) => {
            const datos = crearCasoValido();

            datos.files[0].enigmas = Array.from(
                { length: cantidad },
                (_, i) => crearEnigma((i % 3) + 1)
            );

            const caso = new CaseModel(datos);

            await expect(caso.validate()).rejects.toThrow(
                "Cada expediente debe contener exactamente 3 enigmas"
            );
        });

        it.each([
            ["order", "El orden del enigma es obligatorio"],
            ["code", "El código del enigma es obligatorio"],
            ["title", "El título del enigma es obligatorio"],
            ["question", "La pregunta del enigma es obligatoria"],
            ["content", "El contenido del enigma es obligatorio"],
            ["answer", "La respuesta del enigma es obligatoria"],
            ["explanation", "La explicación del enigma es obligatoria"]
        ])("rechaza un enigma sin %s", async (campo, mensaje) => {
            const datos = crearCasoValido();

            Object.assign(datos.files[0].enigmas[0], {
                [campo]: undefined
            });

            const caso = new CaseModel(datos);

            await expect(caso.validate()).rejects.toThrow(mensaje);
        });

        it.each([
            [0, "El orden del enigma no puede ser menor que 1"],
            [4, "El orden del enigma no puede ser mayor que 3"],
            [1.5, "El orden del enigma debe ser un número entero"]
        ])("rechaza un enigma con order = %s", async (order, mensaje) => {
            const datos = crearCasoValido();

            datos.files[0].enigmas[0].order = order;

            const caso = new CaseModel(datos);

            await expect(caso.validate()).rejects.toThrow(mensaje);
        });

        it.each([
            ["code", 30],
            ["title", 100],
            ["question", 500],
            ["content", 10000],
            ["answer", 500],
            ["explanation", 4000]
        ])("rechaza %s del enigma si supera %i caracteres", async (campo, maximo) => {
            const datos = crearCasoValido();

            Object.assign(datos.files[0].enigmas[0], {
                [campo]: "x".repeat(maximo + 1)
            });

            const caso = new CaseModel(datos);

            await expect(caso.validate()).rejects.toThrow();
        });
    });

    describe("Limpieza de textos", () => {
        it("elimina espacios exteriores en los campos con trim: true", async () => {
            const datos = crearCasoValido();

            datos.code = "  CASE_01  ";
            datos.title = "  Caso de prueba  ";
            datos.files[0].title = "  Expediente 1  ";
            datos.files[0].enigmas[0].answer = "  BLACKBOX  ";

            const caso = new CaseModel(datos);
            await caso.validate();

            expect(caso.code).toBe("CASE_01");
            expect(caso.title).toBe("Caso de prueba");
            expect(caso.files[0].title).toBe("Expediente 1");
            expect(caso.files[0].enigmas[0].answer).toBe("BLACKBOX");
        });

        it("conserva los espacios de content porque no tiene trim", async () => {
            const datos = crearCasoValido();

            const contenido = "  if (true) {\n    console.log('ok');\n  }  ";

            datos.files[0].enigmas[0].content = contenido;

            const caso = new CaseModel(datos);
            await caso.validate();

            expect(caso.files[0].enigmas[0].content).toBe(contenido);
        });
    });
});
