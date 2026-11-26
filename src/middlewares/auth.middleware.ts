import type { RequestHandler, Request } from "express";
import { HttpError } from "../utils/HttpError.ts";
import { env } from "../config/env.ts";
import jwt from "jsonwebtoken";


//Busca el JWT en la cabecera Authorization o en la cookie.
//Si llegan ambos, damos prioridad a la cabecera.
const getToken = (req: Request): string | undefined => {
    const authorization = req.headers.authorization;

    if (authorization?.startsWith("Bearer ")) {
        const token = authorization.slice(7).trim();
        return token || undefined;
    }

    const token: unknown = req.cookies?.token;

    return typeof token === "string" ? token : undefined;
};


//comprueba el JWT que el navegador envía en la cookie "token".
//si es válido, deja los datos del usuario en req.user para la siguiente función.
export const isAuthenticated: RequestHandler = (req, _res, next) => {
    const token: unknown = req.cookies?.token; //obtener el token

    if (typeof token !== "string") { //comprobar tipo del token
        next(new HttpError(401, "No has iniciado sesión"));
        return;
    }

    try {
        
        const payload = jwt.verify(token, env.JWT_SECRET); //jwt.verify() comprueba la firma y la caducidad del token.

        // No confiamos en la estructura del contenido sin comprobarla.
        if (
            typeof payload === "string" ||
            typeof payload.userId !== "string" ||
            typeof payload.username !== "string" ||
            (payload.role !== "user" && payload.role !== "admin")
        ) {
            throw new Error("Contenido del token no válido");
        }

        req.user = {
            userId: payload.userId,
            username: payload.username,
            role: payload.role
        };

        next(); // Permite continuar hacia la siguiente ruta o middleware.
    } catch {
        next(new HttpError(401, "Token no válido o caducado"));
    }
};