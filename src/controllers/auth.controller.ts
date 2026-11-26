import type { CookieOptions, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";
import { createUser, getUserByEmail, getUserById } from "../repositories/user.repository.ts";
import { HttpError } from "../utils/HttpError.ts";
import type { AuthUser } from "../types/express.d.ts";


//Interfaz para los datos que vendrán del POST /api/auth/register
interface RegisterBody{
    username?: unknown; //Known es para comprobar los tipos reales de los datos recibidos
    email?: unknown;
    password?: unknown;
    passwordRepeat?: unknown;
}

//Interfaz para los datos que vendrán en POST api/auth/login
interface LoginBody {
    email?: unknown;
    password?: unknown;
}


//para el formato del password: mínimo 8 caracteres, minúscula, mayúscula, número y símbolo.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

//opciones comunes al crear y borrar la cookie con el JWT
const TOKEN_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true, // el JavaScript del navegador no puede leer esta cookie
    sameSite: "strict", // solo se envía desde nuestra propia web (reduce el envío de la cookie desde otros sitios)
    secure: env.NODE_ENV === "production", // solo por HTTPS en producción (en local no hay HTTPS)
    path: "/"
};

const TOKEN_DURATION_MS = 24 * 60 * 60 * 1000; //24h


/**
 * POST /api/auth/register
 * Comprueba los datos, genera el hash con bcrypt y crea el usuario.
 * El rol siempre será "user": nadie puede registrarse como administrador.
 */
export const register = async (req: Request<{}, {}, RegisterBody>, res: Response) => {
    const { username, email, password, passwordRepeat } = req.body ?? {};

    //No confiamos en los tipos de los datos enviados por el cliente (por si acaso)

    if (typeof username !== "string" || typeof email !== "string") {
        throw new HttpError(400, "El nombre de usuario y el email son obligatorios");
    }

    if (typeof password !== "string" || typeof passwordRepeat !== "string") {
        throw new HttpError(400, "La contraseña y su confirmación son obligatorias");
    }

    if (!PASSWORD_PATTERN.test(password)) {
        throw new HttpError(400, "La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo");
    }

    if (password !== passwordRepeat) {
        throw new HttpError(400, "Las contraseñas no coinciden");
    }

    //codificamos la contraseña para guardarla así en MongoDB
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await createUser({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: "user"  //role: "user" siempre. Aunque alguien envíe "role": "admin" en el body, no lo usamo
    });

    //el toJSON que hay en el UserModel evita que se devuelva el passwordHash.
    res.status(201).json({ data: user });
};


/**
 * POST /api/auth/login
 * Comprueba email y contraseña. Si son correctos, crea una cookie HttpOnly.
 */
export const login = async (req: Request<{}, {}, LoginBody>, res: Response) => {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string") {
        throw new HttpError(400, "El email y la contraseña son obligatorios");
    }

    const user = await getUserByEmail(email.trim().toLowerCase());

    //usamos el mismo error cuando no existe el email o no coincide el hash para no dar pistas
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw new HttpError(401, "Credenciales incorrectas");
    }

    //el JWT contiene los datos mínimos (y sin importancia, porque esto no va cifrado, es base64) para identificar al usuario.
    const payload: AuthUser = {
        userId: user._id.toString(), //aquí obtenemos el id que mongoDB asignó al usuario y lo convertimos a texto para guardarlo dentro del JWT
        username: user.username,
        role: user.role
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "24h" });

    //el token viaja en una cookie, no en la respuesta JSON.
    res.cookie("token", token, { ...TOKEN_COOKIE_OPTIONS, maxAge: TOKEN_DURATION_MS });

    res.status(200).json({ data: user });
};


/**
 * GET /api/auth/me
 * Devuelve los datos del usuario autenticado (sin su hash)
 */
export const me = async (req: Request, res: Response) => {
    if (!req.user) {
        throw new HttpError(401, "No has iniciado sesión");
    }

    const user = await getUserById(req.user.userId);
    if (!user) {
        throw new HttpError(404, "El usuario ya no existe");
    }

    res.json({ data: user });
};

/**
 * POST /api/auth/logout
 * Borra la cookie. Un JWT ya emitido no se revoca en el servidor
 */
export const logout = (_req: Request, res: Response): void => {
    res.clearCookie("token", TOKEN_COOKIE_OPTIONS);
    res.json({ message: "Sesión cerrada" });
};


