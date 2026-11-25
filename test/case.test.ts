
import { describe, it, expect } from "vitest";
import { CaseModel } from "../src/models/case.model.ts";
import type { ICase, IFile, IEnigma } from "../src/models/case.model.ts";

// DATOS DE PRUEBA: siempre partimos de un caso completo y válido.
function createEnigma(order: number): IEnigma {
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

function createFile(order: number): IFile {
    return {
        order,
        title: `Expediente ${order}`,
        intro: "Introducción del expediente.",
        enigmas: [1, 2, 3].map(createEnigma)
    };
}

function createValidCase(): ICase {
    return {
        code: "CASE_01",
        order: 1,
        title: "Caso de prueba",
        description: "Descripción del caso de prueba.",
        completionMessage: "¡Caso completado!",
        files: [1, 2, 3].map(createFile)
    };
}

describe("Modelo Case", () => {

    describe("Caso válido", () => {
        it("acepta un caso con 3 expedientes y 3 enigmas por expediente", async () => {
            const caseDocument = new CaseModel(createValidCase());

            await expect(caseDocument.validate()).resolves.toBeUndefined();
            expect(caseDocument.files).toHaveLength(3);

            caseDocument.files.forEach((file) => {
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
        ])("rechaza un caso sin %s", async (field, message) => {
            const caseDocument = new CaseModel({
                ...createValidCase(),
                [field]: undefined
            });

            await expect(caseDocument.validate()).rejects.toThrow(message);
        });
    });

    describe("Orden del caso", () => {
        it.each([
            [0, "El orden del caso no puede ser menor que 1"],
            [1.5, "El orden del caso debe ser un número entero"]
        ])("rechaza order = %s", async (order, message) => {
            const caseDocument = new CaseModel({
                ...createValidCase(),
                order
            });

            await expect(caseDocument.validate()).rejects.toThrow(message);
        });


        it("permite un orden mayor que 6", async () => {
            const caseDocument = new CaseModel({
                ...createValidCase(),
                order: 7
            });
        
            await expect(caseDocument.validate()).resolves.toBeUndefined();
        });

    });

    describe("Longitud de los textos del caso", () => {
        it.each([
            ["code", 30],
            ["title", 100],
            ["description", 4000],
            ["completionMessage", 3000]
        ])("rechaza %s si supera %i caracteres", async (field, maxLength) => {
            const caseDocument = new CaseModel({
                ...createValidCase(),
                [field]: "x".repeat(maxLength + 1)
            });

            await expect(caseDocument.validate()).rejects.toThrow();
        });
    });

    describe("Expedientes embebidos", () => {
        it.each([0, 2, 4])("rechaza un caso con %i expedientes", async (count) => {
            const caseData = createValidCase();

            caseData.files = Array.from(
                { length: count },
                (_, i) => createFile((i % 3) + 1)
            );

            const caseDocument = new CaseModel(caseData);

            await expect(caseDocument.validate()).rejects.toThrow(
                "Cada caso debe contener exactamente 3 expedientes"
            );
        });

        it.each([
            ["order", "El orden del expediente es obligatorio"],
            ["title", "El título del expediente es obligatorio"],
            ["intro", "La introducción del expediente es obligatoria"]
        ])("rechaza un expediente sin %s", async (field, message) => {
            const caseData = createValidCase();

            Object.assign(caseData.files[0], {
                [field]: undefined
            });

            const caseDocument = new CaseModel(caseData);

            await expect(caseDocument.validate()).rejects.toThrow(message);
        });

        it.each([
            [0, "El orden del expediente no puede ser menor que 1"],
            [4, "el orden del expediente no puede ser mayor que 3"],
            [1.5, "El orden del expediente debe ser un número entero"]
        ])("rechaza un expediente con order = %s", async (order, message) => {
            const caseData = createValidCase();

            caseData.files[0].order = order;

            const caseDocument = new CaseModel(caseData);

            await expect(caseDocument.validate()).rejects.toThrow(message);
        });

        it.each([
            ["title", 100],
            ["intro", 3000]
        ])("rechaza %s del expediente si supera %i caracteres", async (field, maxLength) => {
            const caseData = createValidCase();

            Object.assign(caseData.files[0], {
                [field]: "x".repeat(maxLength + 1)
            });

            const caseDocument = new CaseModel(caseData);

            await expect(caseDocument.validate()).rejects.toThrow();
        });
    });

    describe("Enigmas embebidos", () => {
        it.each([0, 2, 4])("rechaza un expediente con %i enigmas", async (count) => {
            const caseData = createValidCase();

            caseData.files[0].enigmas = Array.from(
                { length: count },
                (_, i) => createEnigma((i % 3) + 1)
            );

            const caseDocument = new CaseModel(caseData);

            await expect(caseDocument.validate()).rejects.toThrow(
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
        ])("rechaza un enigma sin %s", async (field, message) => {
            const caseData = createValidCase();

            Object.assign(caseData.files[0].enigmas[0], {
                [field]: undefined
            });

            const caseDocument = new CaseModel(caseData);

            await expect(caseDocument.validate()).rejects.toThrow(message);
        });

        it.each([
            [0, "El orden del enigma no puede ser menor que 1"],
            [4, "El orden del enigma no puede ser mayor que 3"],
            [1.5, "El orden del enigma debe ser un número entero"]
        ])("rechaza un enigma con order = %s", async (order, message) => {
            const caseData = createValidCase();

            caseData.files[0].enigmas[0].order = order;

            const caseDocument = new CaseModel(caseData);

            await expect(caseDocument.validate()).rejects.toThrow(message);
        });

        it.each([
            ["code", 30],
            ["title", 100],
            ["question", 500],
            ["content", 10000],
            ["answer", 500],
            ["explanation", 4000]
        ])("rechaza %s del enigma si supera %i caracteres", async (field, maxLength) => {
            const caseData = createValidCase();

            Object.assign(caseData.files[0].enigmas[0], {
                [field]: "x".repeat(maxLength + 1)
            });

            const caseDocument = new CaseModel(caseData);

            await expect(caseDocument.validate()).rejects.toThrow();
        });
    });

    describe("Limpieza de textos", () => {
        it("elimina espacios exteriores en los campos con trim: true", async () => {
            const caseData = createValidCase();

            caseData.code = "  CASE_01  ";
            caseData.title = "  Caso de prueba  ";
            caseData.files[0].title = "  Expediente 1  ";
            caseData.files[0].enigmas[0].answer = "  BLACKBOX  ";

            const caseDocument = new CaseModel(caseData);
            await caseDocument.validate();

            expect(caseDocument.code).toBe("CASE_01");
            expect(caseDocument.title).toBe("Caso de prueba");
            expect(caseDocument.files[0].title).toBe("Expediente 1");
            expect(caseDocument.files[0].enigmas[0].answer).toBe("BLACKBOX");
        });

        it("conserva los espacios de content porque no tiene trim", async () => {
            const caseData = createValidCase();

            const content = "  if (true) {\n    console.log('ok');\n  }  ";

            caseData.files[0].enigmas[0].content = content;

            const caseDocument = new CaseModel(caseData);
            await caseDocument.validate();

            expect(caseDocument.files[0].enigmas[0].content).toBe(content);
        });
    });
});
