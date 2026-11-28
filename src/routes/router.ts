import { Router, type Request, type Response} from "express";
import authRouter from "./auth.routes.ts";
import caseRouter from "./case.routes.ts";



//enrutador principal
const router = Router();

//ruta para comprobar que la API responde
router.get("/health", (req: Request, res: Response): void => {
  res.json({ message: "La API está funcionando" });
});



router.use("/auth", authRouter); //todas las rutas de autentificación empezarán por /api/auth
router.use("/cases", caseRouter); //todas las rutas de casos empezarán por /api/cases



export default router;