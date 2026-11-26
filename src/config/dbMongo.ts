import mongoose from "mongoose";
import { env } from "./env.ts";

// Construye la cadena de conexión a partir de las variables de entorno
const buildMongoUri = (): string => {
    const user = encodeURIComponent(env.MONGO_USER);
    const password = encodeURIComponent(env.MONGO_PASSWORD);

    return `mongodb://${user}:${password}@${env.MONGO_HOST}:${env.MONGO_PORT}/${env.MONGO_DB}?authSource=${env.MONGO_AUTH_SOURCE}`;
};


// Conecta con MongoDB una sola vez al arrancar la API. Si falla la conexión, 
// muestra el error y detiene la aplicación (process.exit).
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(buildMongoUri());
    console.log(`✅ Conectado a MongoDB (${env.MONGO_DB}@${env.MONGO_HOST})`);
  } catch (error) {
    // En TypeScript, lo que llega al catch es "unknown": hay que comprobar que es un Error
    console.error("❌ Error de conexión:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
};



export default connectDB;