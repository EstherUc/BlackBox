import { Router } from "express";
import { listCases, getCase } from "../controllers/case.controller.ts";


//todas las rutas relacionadas con los casos agrupadas
const caseRouter = Router();


caseRouter.get("/", listCases); // GET /api/cases  - Devuelve listado de casos con los datos públicos
caseRouter.get("/:id", getCase); // GET /api/case/:id  - Devuelve el caso según el id de MongoDB



export default caseRouter;