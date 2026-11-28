import { Schema, model } from "mongoose";   //Schema => es para definir como se guardan los datos (define las reglas)
                                            //model => crea el modelo con el que se trabajará en MongoDB (para trabajar con los documentos)


//estructura general de los datos: Icase contiene IFile[], e IFile contiene IEnigma[] 
// (los enigmas están dentro de los expedientes, y los expedientes dentro de los casos)


//un enigma va EMBEBIDO dentro de un expediente (File)
export interface IEnigma{
    order: number; //posición del enigma dentro del expediente (1,2 o 3)
    code: string;
    title: string;
    question: string;
    content: string; //info que necesita el usuario para resolver. Como un trozo código, mensaje, etc
    answer: string;
    explanation: string;
}

//un expediente (File) va EMBEBIDO dentro de una caso
export interface IFile{
    order: number; //posición del expediente dentro del caso (1,2 o 3)
    title: string;
    intro: string;
    enigmas: IEnigma[];
}


//un caso
export interface ICase{
    code: string;
    order: number; //orden de debloqueo (del 1 al 6)
    title: string;
    description: string;
    completionMessage: string; //mesnaje al completar el caso
    files: IFile[];
}



//Definición de como validará los datos Mongoose

//ESQUEMA DE LOS ENIGMAS
const enigmaSchema = new Schema<IEnigma>({
    order:{
        type: Number,
        required: [true, "El orden del enigma es obligatorio"],
        min: [1, "El orden del enigma no puede ser menor que 1"],
        max: [3, "El orden del enigma no puede ser mayor que 3"],
        validate:{
            validator: Number.isInteger,
            message: "El orden del enigma debe ser un número entero"
        }
    },
    code:{
        type: String,
        required: [true, "El código del enigma es obligatorio"],
        trim: true,
        maxlength: [30, "El código no puede superar los 30 caracteres"]
    },
    title:{
        type: String,
        required: [true, "El título del enigma es obligatorio"],
        trim: true,
        maxlength: [100, "El título no puede superar los 100 caracteres"]
    },
    question:{
        type: String,
        required: [true, "La pregunta del enigma es obligatoria"],
        trim: true,
        maxlength: [500, "La pregunta no puede superar los 500 caracteres"]
    },
    content:{
        type: String,
        required: [true, "El contenido del enigma es obligatorio"],
        maxlength: [10000, "El contenido no puede superar los 10000 caracteres"]
    },
    answer: {
        type: String,
        required: [true, "La respuesta del enigma es obligatoria"],
        trim: true,
        maxlength: [500, "La respuesta no puede superar los 500 caracteres"],
        select: false //No recuperamos la solución por defecto
    },
    explanation:{
        type: String,
        required: [true, "La explicación del enigma es obligatoria"],
        trim: true,
        maxlength: [4000, "La explicación no puede superar los 4000 caracteres"],
        select: false //No recuperamos la explicación por defecto
    }
});


//ESQUEMA DE LOS EXPEDIENTES
const fileSchema = new Schema<IFile>({
    order:{
        type: Number,
        required: [true, "El orden del expediente es obligatorio"],
        min: [1, "El orden del expediente no puede ser menor que 1"],
        max: [3, "el orden del expediente no puede ser mayor que 3"],
        validate:{
            validator: Number.isInteger,
            message: "El orden del expediente debe ser un número entero"
        }
    }, 
    title:{
        type: String,
        required: [true, "El título del expediente es obligatorio"],
        trim: true,
        maxlength: [100, "El título no puede superar los 100 caracteres"]
    },
    intro: {
        type: String,
        required: [true, "La introducción del expediente es obligatoria"],
        trim: true,
        maxlength: [3000, "La introducción no puede superar los 3000 caracteres"]
    },
    enigmas: {
        type: [enigmaSchema],
        validate: {
            validator: (enigmas: IEnigma[]) => enigmas.length === 3,
            message: "Cada expediente debe contener exactamente 3 enigmas"
        }
    }
});


//ESQUEMA DE LOS CASOS
const caseSchema = new Schema<ICase>({
    code:{
        type: String,
        required: [true, "El código del caso es obligatorio"],
        trim: true,
        unique: true,
        maxlength: [30, "El código no puede superar los 30 caracteres"]
    },
    order: {
        type: Number,
        required: [true, "El orden del caso es obligatorio"],
        unique: true,
        min: [1, "El orden del caso no puede ser menor que 1"],
        validate:{
            validator: Number.isInteger,
            message: "El orden del caso debe ser un número entero"
        }
    },
    title:{
        type: String,
        required: [true, "El título del caso es obligatorio"],
        trim: true,
        maxlength: [100, "El título no puede superar los 100 caracteres"]
    },
    description:{
        type: String,
        required: [true, "La descripción del caso es obligatoria"],
        trim: true,
        maxlength: [4000, "La descripción del caso no puede superar los 4000 caracteres"]
    },
    completionMessage:{
        type: String,
        required: [true, "El mensaje de finalización del caso es obligatorio"],
        trim: true,
        maxlength: [3000, "El mensaje de finalización del caso no puede superar los 3000 caracteres"]
    },
    files:{
        type: [fileSchema],
        validate:{
            validator: (files: IFile[]) => files.length === 3,
            message: "Cada caso debe contener exactamente 3 expedientes"
        }
    }
}, {
    timestamps: true,
    toJSON: { versionKey: false } // sin __v en las respuestas
});


//Crear el modelo de Mongoose
export const CaseModel = model<ICase>("Case", caseSchema);