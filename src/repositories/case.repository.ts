import { CaseModel } from "../models/case.model.ts";


//CONSULTAS A MongoDB (mediante Mongoose) de los casos

//Propiedades de los casos que mostraremos publicamente (para consultar el caso)
const PUBLIC_CASE_FIELDS = "_id code order title description";


/**
 * Obtiene todos los casos para mostrarlos en el listado.
 * Recupera únicamente los campos públicos y los ordena.
 */
export const getAllCases = async () => {
    return CaseModel.find().select(PUBLIC_CASE_FIELDS).sort({ order: 1 });
};


/**
 * Busca un caso por su _id de MongoDB.
 * Devuelve únicamente los campos públicos
 */
export const getCaseById = async (id: string) => {
    return CaseModel.findById(id).select(PUBLIC_CASE_FIELDS);
};

