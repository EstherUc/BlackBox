import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { HttpError } from "../utils/HttpError.ts";



/**
 * Si ninguna ruta ha respondido, la ruta no existe: pasa un HttpError 404 al errorHandler.
 *
 * @param req - Usa el método y la URL para el mensaje
 * @param res - No lo usa
 * @param next - Siempre next(HttpError 404)
 */
export const notFound: RequestHandler = (req, _res, next) => {
    next(new HttpError(404, `No existe la ruta ${req.method} ${req.originalUrl}`));
};




/**
 * Manejador de errores centralizado.
 *
 * Traduce cada tipo de error a una respuesta { error } (y details en los de validación):
 * HttpError → su status · ValidationError → 400 · CastError → 400 · code 11000 → 409 ·
 * JSON mal escrito → 400 · cualquier otro → 500.
 *
 * @param err - El error lanzado (throw) o pasado con next(error)
 * @param req - No lo usa
 * @param res - Responde con el status y el mensaje correspondientes
 * @param next - Obligatorio en la firma (4 parámetros = manejador de errores), aunque no se use
 * Express lo reconoce porque recibe 4 parámetros.
 * Va el ÚLTIMO en index.ts y recibe cualquier error: los que lanzamos nosotros
 * (HttpError) y los que lanzan Mongoose o Express.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    // Si ya se empezó a enviar una respuesta, delegamos en Express.
    if (res.headersSent) {
        next(err);
        return;
    }

    // Errores controlados por nosotros (que traen su código): 400, 401, 403, 404, etc.
    if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message });
        return;
    }

    // Datos que incumplen las validaciones de un esquema de Mongoose (required, min, max...)
    if (err instanceof mongoose.Error.ValidationError) {
        const details: Record<string, string> = {};

        for (const [field, fieldError] of Object.entries(err.errors)) {
            details[field] = fieldError.message;
        }

        res.status(400).json({ error: "Hay datos que no son válidos", details });
        return;
    }

    // Por ejemplo, cuando recibimos un ObjectId con formato incorrecto.
    if (err instanceof mongoose.Error.CastError) {
        res.status(400).json({ error: "El identificador proporcionado no es válido" });
        return;
    }

    // MongoDB devuelve el código 11000 al incumplir un índice único.
    // Esto puede ocurrir con un username o email ya registrado.
    if (err?.code === 11000) {
        const field = Object.keys(err.keyValue ?? {})[0] ?? "dato";
        res.status(409).json({ error: `El campo ${field} ya está registrado` });
        return;
    }

    // JSON mal escrito en el body de la petición.
    if (err?.type === "entity.parse.failed") {
        res.status(400).json({ error: "El cuerpo de la petición no contiene un JSON válido" });
        return;
    }

    // Cualquier otro error: lo vemos en la consola, pero al cliente no le damos detalles
    console.error("Error inesperado:", err);
    res.status(500).json({ error: "Error interno del servidor" });
};