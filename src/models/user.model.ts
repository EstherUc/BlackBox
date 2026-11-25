import { Schema, model } from "mongoose";

export type UserRole = "user" | "admin";

//Interfaz usuario (NO guardamos contraseña, guardamos hash)
export interface IUser{
    username: string;
    email: string;
    passwordHash: string;
    role: UserRole;
}


//ESQUEMA DE LOS USUARIOS
const userSchema = new Schema<IUser>({
    username:{
        type: String,
        required: [true, "El nombre del usuario es obligatorio"],
        unique: [true, "El nombre del usuario no puede repetirse"],
        trim: true,
        minlength: [3, "El nombre del usuario tiene que tener al menos 3 caracteres"],
        maxlength: [15, "El nombre del usuario tiene que tener máximo 15 caracteres"]
    },
    email:{
        type: String,
        required: [true, "El email es obligatorio"],
        unique: [true, "El email no puede repetirse"],
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "El email no tiene un formato válido"]
    },
    passwordHash:{
        type: String,
        required: [true, "La contraseña es obligatoria"],
        select: false, // no se devuelve en las consultas salvo que se pida con .select("+passwordHash")
        match: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, "La contraseña no tiene un formato válido"] // Exige mínimo 8 caracteres, al menos una letra minúscula, una mayúscula, un número y un carácter especial.
    },
    role:{
        type: String,
        enum:{
            values: ["user","admin"],
            message: "El rol debe ser user o admin"
        },
        default: "user",
        required: [true, "El rol es obligatorio"]
    }
}, {
    timestamps: true,
    toJSON: {
        versionKey: false, //para quitar el __v cuando devolvamos el json
        transform: (_doc, result) => {
            //select: false protege consultas, pero también ocultamos el hash
            const { passwordHash, ...secureUser } = result; //no mandamos hash en el json
            return secureUser;
        }
    }
});


//Crear el modelo de Mongoose
export const UserModel = model<IUser>("User", userSchema);

