import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth.controller.ts";
import { isAuthenticated } from "../middlewares/auth.middleware.ts";


//todas las rutas relacionadas con el registro y la autenticación agrupadas
const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", isAuthenticated, me); //solo se puede consultar con sesión iniciada.

export default authRouter;
