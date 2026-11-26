import { Router, type Request, type Response} from "express";
import authRouter from "./auth.routes.ts";


//enrutador principal
const router = Router();

//ruta para comprobar que la API responde
router.get("/health", (req: Request, res: Response): void => {
  res.json({ message: "La API está funcionando" });
});


//todas las rutas de autentificación comenzarán por /api/auth
router.use("/auth", authRouter);

//rutas



export default router;