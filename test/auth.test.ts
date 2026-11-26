import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest"; //para simular peticiones HTTP a la API en los tests
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import router from "../src/routes/router.ts";
import { notFound, errorHandler } from "../src/middlewares/error.middleware.ts";
import { createUser, getUserByEmail, getUserById } from "../src/repositories/user.repository.ts";
import { UserModel } from "../src/models/user.model.ts";
import { env } from "../src/config/env.ts";

// REPOSITORIO SIMULADO
// Sustituimos las consultas a MongoDB por funciones de prueba.
// Así comprobamos los controladores y las rutas sin tocar la base de datos real.
vi.mock("../src/repositories/user.repository.ts", () => ({
    createUser: vi.fn(),
    getUserByEmail: vi.fn(),
    getUserById: vi.fn()
}));

// DATOS DE PRUEBA
// Usaremos la misma contraseña válida en los ejemplos de registro y login.
const TEST_PASSWORD = "Blackbox2026!";

function createRegisterBody() {
    return {
        username: "laura",
        email: "laura@ejemplo.com",
        password: TEST_PASSWORD,
        passwordRepeat: TEST_PASSWORD
    };
}

// Creamos un documento Mongoose en memoria, sin guardarlo en MongoDB.
// El hash se genera de verdad para poder probar bcrypt.compare() en el login.
async function createTestUser() {
    return new UserModel({
        username: "laura",
        email: "laura@ejemplo.com",
        passwordHash: await bcrypt.hash(TEST_PASSWORD, 4),
        role: "user"
    });
}

// APLICACIÓN EXPRESS PARA LOS TESTS
// Montamos las mismas rutas y middlewares necesarios para la autenticación.
// No importamos index.ts: ese archivo conectaría MongoDB y abriría el servidor.
function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser()); // Necesario para que isAuthenticated lea req.cookies.
    app.use("/api", router);
    app.use(notFound);
    app.use(errorHandler);
    return app;
}

const app = createTestApp();

// Limpiamos los resultados simulados antes de cada prueba.
// Así ningún test depende de lo que haya ocurrido en otro.
beforeEach(() => {
    vi.resetAllMocks();
});

describe("Autenticación", () => {

    // REGISTRO
    describe("POST /api/auth/register", () => {
        it("registra un usuario válido, genera su hash y devuelve 201", async () => {
            // Simulamos que MongoDB crea el usuario y nos devuelve su documento.
            vi.mocked(createUser).mockImplementation(async (data) => new UserModel(data));

            const response = await request(app)
                .post("/api/auth/register")
                .send(createRegisterBody());

            expect(response.status).toBe(201);
            expect(response.body.data.username).toBe("laura");
            expect(response.body.data.role).toBe("user");
            expect(response.body.data).not.toHaveProperty("passwordHash");
            expect(response.body.data).not.toHaveProperty("__v");

            // Comprobamos qué datos intentó guardar el controlador.
            const savedData = vi.mocked(createUser).mock.calls[0]?.[0];
            expect(savedData).toBeDefined();
            expect(savedData?.passwordHash).not.toBe(TEST_PASSWORD);
            expect(await bcrypt.compare(TEST_PASSWORD, savedData!.passwordHash)).toBe(true);
        });

        it("ignora el rol admin enviado por el cliente", async () => {
            vi.mocked(createUser).mockImplementation(async (data) => new UserModel(data));

            const response = await request(app)
                .post("/api/auth/register")
                .send({ ...createRegisterBody(), role: "admin" });

            expect(response.status).toBe(201);
            expect(response.body.data.role).toBe("user");
            expect(vi.mocked(createUser).mock.calls[0]?.[0].role).toBe("user");
        });

        it("rechaza el registro si el email ya existe", async () => {
            // Simulamos el código 11000 que MongoDB devuelve por un índice único.
            vi.mocked(createUser).mockRejectedValue({
                code: 11000,
                keyValue: { email: "laura@ejemplo.com" }
            });

            const response = await request(app)
                .post("/api/auth/register")
                .send(createRegisterBody());

            expect(response.status).toBe(409);
            expect(response.body.error).toContain("email");
        });

        it.each([
            ["faltan campos", { username: "laura" }, "El nombre de usuario y el email son obligatorios"],
            ["el email no es texto", { ...createRegisterBody(), email: 123 }, "El nombre de usuario y el email son obligatorios"],
            ["contraseña débil", { ...createRegisterBody(), password: "1234", passwordRepeat: "1234" }, "La contraseña debe tener al menos 8 caracteres"],
            ["contraseñas distintas", { ...createRegisterBody(), passwordRepeat: "OtraClave2026!" }, "Las contraseñas no coinciden"]
        ])("rechaza el registro cuando %s", async (_caseName, body, message) => {
            const response = await request(app)
                .post("/api/auth/register")
                .send(body);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain(message);
            expect(createUser).not.toHaveBeenCalled();
        });
    });

    // INICIO DE SESIÓN
    describe("POST /api/auth/login", () => {
        it("permite iniciar sesión con credenciales correctas y crea una cookie HttpOnly", async () => {
            const user = await createTestUser();
            vi.mocked(getUserByEmail).mockResolvedValue(user);

            const response = await request(app)
                .post("/api/auth/login")
                .send({ email: "  LAURA@EJEMPLO.COM ", password: TEST_PASSWORD });

            expect(response.status).toBe(200);
            expect(getUserByEmail).toHaveBeenCalledWith("laura@ejemplo.com");
            expect(response.body.data.username).toBe("laura");
            expect(response.body.data).not.toHaveProperty("passwordHash");

            // Set-Cookie nos permite comprobar que el backend envió la cookie.
            const cookies = response.headers["set-cookie"] as string[] | undefined;
            const tokenCookie = cookies?.find((cookie) => cookie.startsWith("token="));
            expect(tokenCookie).toBeDefined();
            expect(tokenCookie).toContain("HttpOnly");
        });

        it("rechaza un email que no existe", async () => {
            vi.mocked(getUserByEmail).mockResolvedValue(null);

            const response = await request(app)
                .post("/api/auth/login")
                .send({ email: "nadie@ejemplo.com", password: TEST_PASSWORD });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe("Credenciales incorrectas");
        });

        it("rechaza una contraseña incorrecta", async () => {
            const user = await createTestUser();
            vi.mocked(getUserByEmail).mockResolvedValue(user);

            const response = await request(app)
                .post("/api/auth/login")
                .send({ email: "laura@ejemplo.com", password: "ContraseñaErrónea1!" });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe("Credenciales incorrectas");
        });

        it("rechaza un login sin los campos obligatorios", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({ email: "laura@ejemplo.com" });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("El email y la contraseña son obligatorios");
            expect(getUserByEmail).not.toHaveBeenCalled();
        });
    });

    // ACCESO AL PERFIL MEDIANTE JWT
    describe("GET /api/auth/me", () => {
        it("rechaza el acceso si no hay cookie ni token", async () => {
            const response = await request(app).get("/api/auth/me");

            expect(response.status).toBe(401);
            expect(response.body.error).toBe("No has iniciado sesión");
        });

        it("devuelve el perfil cuando el JWT es válido", async () => {
            const user = await createTestUser();
            vi.mocked(getUserById).mockResolvedValue(user);

            // Firmamos un token de prueba con el secreto de nuestra aplicación.
            const token = jwt.sign({
                userId: user._id.toString(),
                username: user.username,
                role: user.role
            }, env.JWT_SECRET, { expiresIn: "1h" });

            const response = await request(app)
                .get("/api/auth/me")
                .set("Cookie", `token=${token}`);

            expect(response.status).toBe(200);
            expect(getUserById).toHaveBeenCalledWith(user._id.toString());
            expect(response.body.data.username).toBe("laura");
            expect(response.body.data).not.toHaveProperty("passwordHash");
        });

        it("rechaza un JWT firmado con un secreto diferente", async () => {
            const token = jwt.sign({
                userId: "507f1f77bcf86cd799439011",
                username: "laura",
                role: "user"
            }, "secreto-incorrecto");

            const response = await request(app)
                .get("/api/auth/me")
                .set("Cookie", `token=${token}`);

            expect(response.status).toBe(401);
            expect(response.body.error).toBe("Token no válido o caducado");
        });

        it("rechaza un JWT firmado pero sin los datos necesarios", async () => {
            // Una firma válida no garantiza que el contenido tenga nuestra estructura.
            const token = jwt.sign({ username: "laura" }, env.JWT_SECRET);

            const response = await request(app)
                .get("/api/auth/me")
                .set("Cookie", `token=${token}`);

            expect(response.status).toBe(401);
            expect(response.body.error).toBe("Token no válido o caducado");
        });

        it("devuelve 404 si el usuario del JWT ya no existe", async () => {
            vi.mocked(getUserById).mockResolvedValue(null);

            const token = jwt.sign({
                userId: "507f1f77bcf86cd799439011",
                username: "laura",
                role: "user"
            }, env.JWT_SECRET);

            const response = await request(app)
                .get("/api/auth/me")
                .set("Cookie", `token=${token}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("El usuario ya no existe");
        });
    });

    // CIERRE DE SESIÓN
    describe("POST /api/auth/logout", () => {
        it("borra la cookie y después impide consultar el perfil", async () => {
            const user = await createTestUser();
            vi.mocked(getUserByEmail).mockResolvedValue(user);
            vi.mocked(getUserById).mockResolvedValue(user);

            // agent conserva las cookies entre peticiones, como Postman o un navegador.
            const agent = request.agent(app);

            const loginResponse = await agent
                .post("/api/auth/login")
                .send({ email: user.email, password: TEST_PASSWORD });
            expect(loginResponse.status).toBe(200);

            const profileBeforeLogout = await agent.get("/api/auth/me");
            expect(profileBeforeLogout.status).toBe(200);

            const logoutResponse = await agent.post("/api/auth/logout");
            expect(logoutResponse.status).toBe(200);
            expect(logoutResponse.body.message).toBe("Sesión cerrada");

            const profileAfterLogout = await agent.get("/api/auth/me");
            expect(profileAfterLogout.status).toBe(401);
            expect(profileAfterLogout.body.error).toBe("No has iniciado sesión");
        });
    });
});
