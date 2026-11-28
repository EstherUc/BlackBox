import type { RequestHandler } from "express";
import { getAllCases, getCaseById } from "../repositories/case.repository.ts";
import mongoose, { isObjectIdOrHexString } from "mongoose";
import { HttpError } from "../utils/HttpError.ts";


/**
 * Obtiene todos los casos y los devuelve al cliente
 * GET /api/cases
 */
export const listCases: RequestHandler = async (_req,res) => {
    
    const cases = await getAllCases(); 
    res.status(200).json({ data: cases });
};


/**
 * Busca un caso por su id de MongoDB
 * GET /api/cases/:id
 */
export const getCase: RequestHandler<{id: string}> = async (req, res) => {  //le decimos a typescript que el parámetro id de la url es un string <{id: string}>, y así pasarlo a getCaseById() que espera un string sin que de error

    //obtenemos el id que llega como parámetro en la url
    const id = req.params.id;

    //comprobamos que el id existe y que tenga el formato de ObjectId que utiliza mongoDb
    if(!id || !mongoose.isObjectIdOrHexString(id)){
        throw new HttpError(400, "El identificador del caso no es valido");
    }

    const caseData = await getCaseById(id);

    if (!caseData) {
        throw new HttpError(404, "Caso no encontrado");
    }

    res.status(200).json({data: caseData});
}

