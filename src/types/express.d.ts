//Este archivo amplía el tipo Request de Express.
//No genera código JavaScript: solo ayuda a TypeScript a reconocer req.user.
import type { UserRole } from "../models/user.model.ts";

// Datos que guardamos en el JWT y recuperamos al verificarlo. (req.user)
export interface AuthUser {
    userId: string;
    username: string;
    role: UserRole;
}

declare global {
    namespace Express {
        interface Request {
            // Solo estará definido después del middleware isAuthenticated.
            user?: AuthUser;
        }
    }
}
