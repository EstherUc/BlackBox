//Este archivo amplía el tipo Request de Express.
//No genera código JavaScript: solo ayuda a TypeScript a reconocer req.user (añadimos nueva propiedad a req, que es req.user)
import type { UserRole } from "../models/user.model.ts";

//Datos que guardamos en el JWT y recuperamos al verificarlo. (Datos del usuario en req.user)
export interface AuthUser {
    userId: string;
    username: string;
    role: UserRole;
}

//Añadimos nuestra propiedad user a las peticiones de Express para que este disponible en el resto del proyecto.
declare global {
    namespace Express {
        interface Request {
            // Solo estará definido después del middleware isAuthenticated.
            user?: AuthUser;
        }
    }
}
