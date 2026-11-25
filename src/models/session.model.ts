import { Schema, model, Types } from "mongoose";

//una sesión es un intento de resolver UN caso por parte de UN usuario
export type SessionStatus = "active" | "completed" | "failed";


//Interfaz sesión
export interface ISession{
    userId: Types.ObjectId; 
    caseId: Types.ObjectId;
    attempt: number; //nº de intento(1) o reintentos(2,3,...)
    currentFile: number; 
    currentEnigma: number; 
    remainingLives: number; //comienza en 6, un fallo resta 1
    status: SessionStatus;
    pointsEarned: number; //puntos del intento (no es la puntuación total del usuario)
    finishedAt: Date | null; //null mientras el intento siga activo
}


//ESQUEMA DE LA SESIÓN
const sessionSchema = new Schema<ISession>({
    userId:{
        type: Schema.Types.ObjectId,
        ref: "User", // Mongoose sabrá que este _id pertenece al modelo User.
        required: [true, "El usuario de la sesión es obligatorio"]
    },
    caseId:{
        type: Schema.Types.ObjectId,
        ref: "Case", // Mongoose sabrá que este _id pertenece al modelo Case.
        required: [true, "El número del caso es obligatorio"]
    },
    attempt:{
        type: Number,
        required: [true, "El número de intento es obligatorio"],
        min: [1,"El intento debe ser al menos 1"],
        validate:{
            validator: Number.isInteger,
            message: "El intento debe ser un número entero"
        }
    },
    currentFile:{
        type: Number,
        default: 1,
        min: [1, "El expediente mínimo es 1"],
        max: [3, "El expediente máximo es 3"],
        validate: {
            validator: Number.isInteger,
            message: "El expediente debe ser un número entero"
        }
    },
    currentEnigma:{
        type: Number,
        default: 1,
        min: [1, "El enigma mínimo es 1"],
        max: [3, "El enigma máximo es 3"],
        validate: {
            validator: Number.isInteger,
            message: "El enigma debe ser un número entero"
        }
    },
    remainingLives:{
        type: Number,
        default: 6,
        min: [0, "Las vidas no pueden ser negativas"],
        max: [6, "No se pueden tener más de 6 vidas"],
        validate: {
            validator: Number.isInteger,
            message: "Las vidas deben ser un númro entero"
        }
    },
    status:{
        type: String,
        enum: {
            values: ["active", "completed", "failed"],
            message: "El estado de la sesión no es válido"
        },
        default: "active"
    },
    pointsEarned:{
        type: Number,
        default: 0,
        min: [0, "Los puntos no pueden ser negativos"],
        max: [6, "Un caso no puede dar más de 6 puntos"],
        validate: {
            validator: Number.isInteger,
            message: "Los puntos deben ser un número entero"
        }
    },
    finishedAt:{
        type: Date, //fecha cuando la partida haya terminado
        default: null //si la partida está activa estará a null
    }
}, {
    timestamps: true,
    toJSON: { versionKey: false } //sin __v en las respuestas
});


//esto es para proteger e impedir guardar una sesión donde los datos no tengan sentido según las reglas del juego y nos avisa mongoose
//pre("validate") es un middleware de mongoose (se ejecuta la función antes de la validación del documento)
sessionSchema.pre("validate", function() {
    
    if(this.status === "completed" && this.attempt === 1){ //miramos si el usuario ha completado el caso en su primer intento

        if (this.remainingLives <= 0 || this.pointsEarned !== this.remainingLives){ //si le queda queda 0 vidas o menos, o los puntos son distintos de las vidas que quedan  (esto sería un error)
            this.invalidate("pointsEarned", "El primer intento completado debe sumar las vidas restantes");
        }
    }else{
        if(this.pointsEarned !== 0){ //los reintentos y las sesiones activas o fallidas no puntuan
            this.invalidate("pointsEarned","Solo el primer intento completado puede conseguir puntos");
        }
    }
});



//para no permitir que existan dos sesiones con la misma combinación de usuario, caso e intento (para evitar que existan, por ejemplo, dos primeros intentos, eso es error)
sessionSchema.index(
    { userId: 1, caseId: 1, attempt: 1 },
    { unique: true }
);

//Crear el modelo de Mongoose
export const SessionModel = model<ISession>("Session", sessionSchema);
