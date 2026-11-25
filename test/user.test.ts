import { describe, it, expect } from "vitest";
import { UserModel } from "../src/models/user.model.ts";
import type { IUser } from "../src/models/user.model.ts";

// USUARIO DE PRUEBA
// Creamos siempre un usuario válido para poder modificar solo el campo
// que queremos comprobar en cada test.
// No usamos MongoDB: validate() comprueba el documento en memoria.
function createValidUser(): IUser {
    return {
        username: "investigadora",
        email: "investigadora@blackbox.test",
        passwordHash: "hash-de-prueba", // No es la contraseña original.
        role: "user"
    };
}

describe("Modelo User", () => {

    // VALIDACIÓN GENERAL Y VALORES POR DEFECTO
    describe("Usuario válido y valores por defecto", () => {
        it("acepta un usuario con todos sus datos correctos", async () => {
            const user = new UserModel(createValidUser());

            await expect(user.validate()).resolves.toBeUndefined();
        });

        it("asigna el rol user por defecto", async () => {
            const user = new UserModel({
                ...createValidUser(),
                role: undefined
            });

            expect(user.role).toBe("user");
            await expect(user.validate()).resolves.toBeUndefined();
        });
    });

    // CAMPOS OBLIGATORIOS
    describe("Campos obligatorios", () => {
        // it.each ejecuta el mismo test con cada campo y su mensaje de error.
        it.each([
            ["username", "El nombre del usuario es obligatorio"],
            ["email", "El email es obligatorio"],
            ["passwordHash", "El hash de la contraseña es obligatorio"]
        ])("rechaza un usuario sin %s", async (field, message) => {
            const user = new UserModel(createValidUser());
            user.set(field, undefined);

            await expect(user.validate()).rejects.toThrow(message);
        });
    });

    // USERNAME
    describe("Nombre de usuario", () => {
        it.each([
            ["ab", "El nombre del usuario tiene que tener al menos 3 caracteres"],
            ["x".repeat(16), "El nombre del usuario tiene que tener máximo 15 caracteres"]
        ])("rechaza un username con longitud incorrecta: %s", async (username, message) => {
            const user = new UserModel({ ...createValidUser(), username });

            await expect(user.validate()).rejects.toThrow(message);
        });

        it("rechaza un username formado únicamente por espacios", async () => {
            const user = new UserModel({
                ...createValidUser(),
                username: "   "
            });

            // trim convierte los espacios en una cadena vacía.
            await expect(user.validate()).rejects.toThrow(
                "El nombre del usuario es obligatorio"
            );
        });

        it("elimina espacios al principio y al final del username", () => {
            const user = new UserModel({
                ...createValidUser(),
                username: "  investigadora  "
            });

            expect(user.username).toBe("investigadora");
        });
    });

    // EMAIL
    describe("Correo electrónico", () => {
        it.each(["correo-sin-arroba", "nombre@", "@dominio.com"])(
            "rechaza un email con formato incorrecto: %s",
            async (email) => {
                const user = new UserModel({ ...createValidUser(), email });

                await expect(user.validate()).rejects.toThrow(
                    "El email no tiene un formato válido"
                );
            }
        );

        it("convierte el email a minúsculas", () => {
            const user = new UserModel({
                ...createValidUser(),
                email: "PRUEBA@BLACKBOX.TEST"
            });

            expect(user.email).toBe("prueba@blackbox.test");
        });
    });

    // PASSWORD HASH
    describe("Hash de contraseña", () => {
        it("permite guardar un hash sin validar el formato de la contraseña original", async () => {
            const user = new UserModel({
                ...createValidUser(),
                passwordHash: "hash-de-prueba"
            });

            await expect(user.validate()).resolves.toBeUndefined();
        });

        // Las reglas de la contraseña original se comprobarán en el registro,
        // antes de generar el hash con bcrypt; no pertenecen a este campo.
        it("oculta passwordHash en las consultas normales", () => {
            const passwordPath = UserModel.schema.path("passwordHash");

            expect(passwordPath.options.select).toBe(false);
        });
    });

    // ROLE
    describe("Roles", () => {
        it("acepta el rol user", async () => {
            const user = new UserModel({ ...createValidUser(), role: "user" });

            await expect(user.validate()).resolves.toBeUndefined();
        });

        it("acepta el rol admin", async () => {
            const user = new UserModel({ ...createValidUser(), role: "admin" });

            await expect(user.validate()).resolves.toBeUndefined();
        });

        it("rechaza un rol distinto de user o admin", async () => {
            const user = new UserModel(createValidUser());
            user.set("role", "superadmin");

            await expect(user.validate()).rejects.toThrow(
                "El rol debe ser user o admin"
            );
        });

        it("rechaza un rol nulo", async () => {
            const user = new UserModel(createValidUser());
            user.set("role", null);

            await expect(user.validate()).rejects.toThrow(
                "El rol es obligatorio"
            );
        });
    });

    // SEGURIDAD Y CONVERSIÓN A JSON
    describe("Seguridad y JSON", () => {
        it("no devuelve passwordHash al convertir un usuario a JSON", () => {
            const user = new UserModel(createValidUser());
            const userJSON = user.toJSON();

            expect(userJSON).not.toHaveProperty("passwordHash");
            expect(userJSON.username).toBe("investigadora");
            expect(userJSON.email).toBe("investigadora@blackbox.test");
        });

        it("no devuelve __v al convertir un usuario a JSON", () => {
            const user = new UserModel(createValidUser());
            user.set("__v", 0);

            expect(user.toJSON()).not.toHaveProperty("__v");
        });
    });

    // CONFIGURACIÓN DE MONGOOSE
    describe("Configuración de Mongoose", () => {
        it("tiene los timestamps activados", () => {
            expect(UserModel.schema.options.timestamps).toBe(true);
        });
    });
});


