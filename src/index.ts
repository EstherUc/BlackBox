import { env } from "./config/env.ts"; //carga y valida el .en (si falta algo, no arranca)
import express from "express";
import cors from "cors";
import connectDB from "./config/dbMongo.ts";
// import cookieParser from "cookie-parser";
import router from "./routes/router.ts";
// import { swaggerUi, swaggerSpec } from "./config/swagger.ts";
import { notFound, errorHandler } from "./middlewares/error.middleware.ts";

//creamos la aplicación Express.
const app = express();

// Permitimos que Express interprete las peticiones con JSON.
app.use(express.json());

// Configuramos que frontend puede realizar peticiones a nuestra API.
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

// Leerá las cookies de las peticiones
// app.use(cookieParser()); //rellena req.cookies

// rutas de la API.
app.use("/api", router);

// Documentación interactiva de Swagger.
// app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Los middlewares de errores (siempre van después de las rutas)
app.use(notFound);    // Si ninguna ruta responde, devuelve un error 404.
app.use(errorHandler); // Gestiona los errores de forma centralizada.

// Primero conectamos con MongoDB. Si falla la conexión, connectDB detiene la aplicación.
await connectDB();

// Dentro del contenedor Express escucha en el puerto 3000. APP_PORT es el puerto publicado en nuestro ordenador.
app.listen(3000, () => {
    console.log(`BLACKBOX en marcha: http://localhost:${env.APP_PORT}/health`);
});