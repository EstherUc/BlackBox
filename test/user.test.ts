import { describe, it, expect } from "vitest";
import { UserModel } from "../src/models/user.model.ts";
import type { IUser } from "../src/models/user.model.ts";


describe("UserModel", () => {

    // Usuario válido para realizar las pruebas
    const validUser: IUser = {
        username: "usuario123",
        email: "usuario@gmail.com",
        passwordHash: "Password123!",
        role: "user"
    };

    // VALIDACIÓN GENERAL

    it("Debería crear un usuario válido", async () => {
        const user = new UserModel(validUser);

        await expect(user.validate()).resolves.toBeUndefined();
    });

    // USERNAME

    it("Debería exigir un nombre de usuario", async () => {
        const user = new UserModel({
            ...validUser,
            username: undefined
        });

        await expect(user.validate()).rejects.toThrow(
            "El nombre del usuario es obligatorio"
        );
    });

    it("Debería rechazar un username menor de 3 caracteres", async () => {
        const user = new UserModel({
            ...validUser,
            username: "ab"
        });

        await expect(user.validate()).rejects.toThrow(
            "El nombre del usuario tiene que tener al menos 3 caracteres"
        );
    });

    it("Debería rechazar un username mayor de 15 caracteres", async () => {
        const user = new UserModel({
            ...validUser,
            username: "usuario1234567890"
        });

        await expect(user.validate()).rejects.toThrow(
            "El nombre del usuario tiene que tener máximo 15 caracteres"
        );
    });

    it("Debería eliminar los espacios del username", () => {
        const user = new UserModel({
            ...validUser,
            username: "  usuario123  "
        });

        expect(user.username).toBe("usuario123");
    });

    // EMAIL

    it("Debería exigir un email", async () => {
        const user = new UserModel({
            ...validUser,
            email: undefined
        });

        await expect(user.validate()).rejects.toThrow(
            "El email es obligatorio"
        );
    });

    it("Debería rechazar un email inválido", async () => {
        const user = new UserModel({
            ...validUser,
            email: "emailincorrecto"
        });

        await expect(user.validate()).rejects.toThrow(
            "El email no tiene un formato válido"
        );
    });

    it("Debería convertir el email a minúsculas", () => {
        const user = new UserModel({
            ...validUser,
            email: "USUARIO@GMAIL.COM"
        });

        expect(user.email).toBe("usuario@gmail.com");
    });

    // PASSWORD HASH

    it("Debería exigir una contraseña", async () => {
        const user = new UserModel({
            ...validUser,
            passwordHash: undefined
        });

        await expect(user.validate()).rejects.toThrow(
            "La contraseña es obligatoria"
        );
    });

    it("Debería rechazar una contraseña inválida", async () => {
        const user = new UserModel({
            ...validUser,
            passwordHash: "1234"
        });

        await expect(user.validate()).rejects.toThrow(
            "La contraseña no tiene un formato válido"
        );
    });

    // ROLE

    it("Debería asignar el rol user por defecto", async () => {
        const user = new UserModel({
            ...validUser,
            role: undefined
        });

        expect(user.role).toBe("user");

        await expect(user.validate()).resolves.toBeUndefined();
    });

    it("Debería aceptar el rol user", async () => {
        const user = new UserModel({
            ...validUser,
            role: "user"
        });

        await expect(user.validate()).resolves.toBeUndefined();
    });

    it("Debería aceptar el rol admin", async () => {
        const user = new UserModel({
            ...validUser,
            role: "admin"
        });

        await expect(user.validate()).resolves.toBeUndefined();
    });

    it("Debería rechazar un rol inválido", async () => {
        const user = new UserModel({
            ...validUser,
            role: "moderator"
        });

        await expect(user.validate()).rejects.toThrow(
            "El rol debe ser user o admin"
        );
    });

    it("Debería rechazar un rol nulo", async () => {
        const user = new UserModel({
            ...validUser,
            role: null
        });

        await expect(user.validate()).rejects.toThrow(
            "El rol es obligatorio"
        );
    });

    // SEGURIDAD Y JSON

    it("No debería devolver el passwordHash en el JSON", () => {
        const user = new UserModel(validUser);
        const result = user.toJSON();

        expect(result).not.toHaveProperty("passwordHash");
        expect(result.username).toBe(validUser.username);
        expect(result.email).toBe(validUser.email);
        expect(result.role).toBe(validUser.role);
    });

    it("No debería devolver __v en el JSON", () => {
        const user = new UserModel(validUser);

        user.set("__v", 0);

        expect(user.toJSON()).not.toHaveProperty("__v");
    });

    it("Debería tener select false en passwordHash", () => {
        expect(
            UserModel.schema.path("passwordHash").options.select
        ).toBe(false);
    });

    it("Debería tener los timestamps activados", () => {
        expect(UserModel.schema.options.timestamps).toBe(true);
    });

});