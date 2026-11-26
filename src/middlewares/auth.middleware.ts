import type { RequestHandler } from "express";
import { HttpError } from "../utils/HttpError.ts";
import { env } from "../config/env.ts";
import jwt from "jsonwebtoken";

//comprueba el JWT que el navegador envía en la cookie "token".
//si es válido, deja los datos del usuario en req.user para la siguiente función.
export const isAuthenticated: RequestHandler = (req, _res, next) => {
    const token: unknown = req.cookies?.token;

    if (typeof token !== "string") {
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