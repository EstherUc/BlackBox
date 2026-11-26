import { UserModel, type IUser } from "../models/user.model.ts";


//CONSULTAS A  MongoDB DE USUARIOS


//CREAR USUARIO - con contraseña ya cifrada
export const createUser = async (data: IUser) => {
    return UserModel.create(data);
};


//BUSCAR USUARIO POR EMAIL
//La contraseña tiene select: false en el esquema, así que hay que pedirla con "+passwordHash"
export const getUserByEmail = async (email: string) => {
    return UserModel.findOne({ email: email.toLocaleLowerCase() }).select("+passworHash");
};


//BUSCAR USUARIO POR ID - sin incluir el hash por defecto
export const getUserById = async (id: string) => {
    return UserModel.findById(id);
};
