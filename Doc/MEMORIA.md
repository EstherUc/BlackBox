# BLACKBOX: Memoria técnica y de desarrollo

> **BLACKBOX** es una API REST para un juego de investigación y enigmas con una estética de misterio tecnológico. Cada jugador se enfrenta a casos que parecen expedientes recuperados de un sistema desconocido: mensajes cifrados, registros sospechosos, pequeños retos de programación y pistas que hay que relacionar para llegar hasta el final.
>
> El proyecto está planteado como un backend con **Node.js, Express 5, TypeScript, MongoDB y Mongoose**, autenticación mediante **JWT**, pruebas con **Vitest** y ejecución local con **Docker Compose**. La idea es que, más adelante, pueda conectarlo a un frontend desarrollado con **React**.
>
> **Estado de esta memoria — 23 de noviembre de 2026:** documento de diseño y seguimiento. La estructura, las dependencias y la configuración básica están preparadas, pero los modelos, controladores, endpoints y tests definitivos todavía están por implementar. Las decisiones descritas como «previstas» no deben confundirse con funcionalidades ya terminadas.

---

## Índice

1. [Descripción del proyecto](#1-descripción-del-proyecto)
2. [De JavaScript a TypeScript: por qué cambié de idea](#2-de-javascript-a-typescript-por-qué-cambié-de-idea)
3. [Por qué MongoDB](#3-por-qué-mongodb)
4. [Modelo de datos](#4-modelo-de-datos)
5. [Reglas del juego](#5-reglas-del-juego)
6. [Arquitectura del backend](#6-arquitectura-del-backend)
7. [Seguridad y autorización](#7-seguridad-y-autorización)
8. [Endpoints previstos](#8-endpoints-previstos)
9. [Gestión de errores](#9-gestión-de-errores)
10. [Testing](#10-testing)
11. [Retos técnicos y decisiones](#11-retos-técnicos-y-decisiones)
12. [Estado actual y plan de implementación](#12-estado-actual-y-plan-de-implementación)
13. [Mejoras futuras](#13-mejoras-futuras)
14. [Anexo A: configuración y herramientas](#anexo-a-configuración-y-herramientas)
15. [Anexo B: comprobación de objetivos](#anexo-b-comprobación-de-objetivos)

---

## 1. Descripción del proyecto

### 1.1. La idea

Quería que este backend fuese algo más que un CRUD con usuarios y registros. Me apetecía darle una temática propia, pero sin dejar de practicar lo importante del proyecto individual: construir una API, trabajar con una base de datos, organizar el código, proteger rutas y hacer pruebas.

De ahí salió **BLACKBOX**. La persona que juega entra en un sistema lleno de expedientes extraños. Cada caso plantea un misterio y, para resolverlo, hay que superar una serie de enigmas. No se trata de responder preguntas al azar, sino de leer, fijarse en los detalles, deducir información y, en algunos casos, entender qué hace un pequeño fragmento de código.

El backend se encarga de que las reglas se cumplan: qué caso puede abrir una persona, por qué enigma va, cuántas vidas le quedan, si ha terminado el intento y cuántos puntos le corresponden.

### 1.2. Qué ofrece la API

- **Registro e inicio de sesión:** cada jugador tiene su cuenta y puede recuperar su progreso.
- **Casos ordenados:** no se puede empezar directamente por el último caso; hay que desbloquearlos.
- **Partidas o intentos:** el backend guarda por dónde va cada jugador y sus vidas restantes.
- **Validación de respuestas:** es el servidor, no el frontend, quien decide si una respuesta es correcta.
- **Puntuación:** se premia superar cada caso en el primer intento y conservar vidas.
- **Clasificación:** un ranking construido a partir de los puntos conseguidos.
- **Administración:** un rol diferenciado para las operaciones que no deben estar disponibles para jugadores normales.

### 1.3. Usuarios y roles

| Acceso | Qué puede hacer |
|---|---|
| Visitante, sin iniciar sesión | Consultar información pública que se decida exponer; no jugar ni modificar progreso |
| `user` | Registrarse, iniciar sesión, consultar los casos visibles, jugar, revisar su progreso y consultar el ranking |
| `admin` | Administrar el contenido y realizar operaciones de mantenimiento autorizadas; no se crea desde un registro público normal |

**Decisión importante:** el rol del jugador es `user`, no `player`, para mantener la coherencia en los modelos y el JWT.

### 1.4. Tres entidades principales

| Entidad | Colección MongoDB | Para qué sirve |
|---|---|---|
| `User` | `users` | Identidad, credenciales y rol |
| `Case` | `cases` | Información de cada caso, expedientes y enigmas |
| `Session` | `sessions` | Intentos de un usuario en un caso, progreso, vidas y puntos |

No necesito una colección independiente para cada enigma ni otra colección para el ranking. Las relaciones y los documentos embebidos permiten mantener un modelo relativamente sencillo.

---

## 2. De JavaScript a TypeScript: por qué cambié de idea

### 2.1. Cómo empezó el proyecto

**Al principio preparé BLACKBOX para hacerlo en JavaScript**, que es el lenguaje con el que ya había trabajado en clase y con el que me sentía más cómoda. Creé la estructura del backend pensando en Express, MongoDB y los archivos habituales: rutas, controladores, modelos, repositorios y middlewares. También dejé preparadas dependencias y una primera organización de tests con Jest.

Mi idea inicial era aprovechar lo que ya conocía de un proyecto anterior y centrarme en entender bien el funcionamiento de esta API, porque las reglas del juego tienen su miga.

### 2.2. El cambio a TypeScript

Después, **el profesor nos dio la posibilidad de hacer el trabajo en TypeScript** y me animé a cambiarlo. No era algo que tuviera previsto desde el primer momento, pero me pareció una buena oportunidad para empezar a familiarizarme con él, probar cosas nuevas y aprender mientras construyo un proyecto de verdad.

No pretendo dar a entender que ya domino TypeScript. De hecho, parte de la gracia de este cambio es precisamente ir descubriendo cómo se trabaja con los tipos, las interfaces y las funciones tipadas, equivocarme, corregir cosas y entender por qué el editor me avisa de ciertos errores. Prefiero aprovechar BLACKBOX para **trastear con TypeScript y coger soltura** antes que limitarme a hacer exactamente lo mismo que ya sabía hacer en JavaScript.

### 2.3. Qué tuve que adaptar

| Antes | Ahora |
|---|---|
| Archivos `.js` | Archivos `.ts` dentro de `src/` |
| `index.js` en la raíz | `src/index.ts` |
| Ejecución con Nodemon | `node --watch src/index.ts` con Node 26 |
| Tests planteados con Jest | Vitest, siguiendo las herramientas que estamos viendo en clase |
| Sin compilación TypeScript | `tsc`, con salida en `dist/` |
| Configuración inicial de módulos | `NodeNext` y `"type": "module"` |

La estructura general no cambió demasiado: seguí utilizando **controladores, repositorios, modelos, rutas y middlewares**. Lo que cambió fue el lenguaje y la configuración necesaria para trabajar con él.

### 2.4. Qué quiero aprender con este cambio

- Definir **tipos e interfaces** para usuarios, casos, sesiones y datos recibidos por la API.
- Comprender las diferencias entre un valor obligatorio, uno opcional y uno que puede ser `null`.
- Tipar funciones asíncronas y sus resultados.
- Trabajar con los tipos de **Express** y **Mongoose**.
- Distinguir errores de compilación, errores de tipos y errores que ocurren al ejecutar.
- Escribir y adaptar tests con Vitest.

**Mi objetivo no es complicar la API por utilizar TypeScript**, sino aprovecharlo para que el código sea más claro y para ir aprendiendo de forma progresiva, siguiendo en lo posible el estilo que estamos trabajando con el profesor.

---

## 3. Por qué MongoDB

### 3.1. Un caso contiene sus propios expedientes

En BLACKBOX, cuando alguien abre un caso necesita ver la información del caso y el enigma que le corresponde. Cada caso tiene una estructura fija:

```text
Case
└── files[]                     3 expedientes
    └── enigmas[]               3 enigmas por expediente
```

Esto significa que hay **9 enigmas por caso**. Como los expedientes pertenecen al caso y no tienen sentido por separado dentro del juego, **encaja guardarlos como subdocumentos** en MongoDB.

Un ejemplo reducido de documento sería:

```json
{
  "slug": "signal-without-sender",
  "order": 1,
  "title": "La señal sin remitente",
  "difficulty": "facil",
  "description": "Un sistema apagado ha respondido a una llamada que nadie hizo.",
  "files": [
    {
      "order": 1,
      "title": "El paquete",
      "intro": "Solo queda un fragmento del mensaje.",
      "enigmas": [
        {
          "order": 1,
          "code": "C01-E01-P01",
          "title": "El mensaje hexadecimal",
          "type": "hex",
          "question": "¿Qué palabra forma este mensaje?",
          "content": "45 43 48 4F",
          "answer": "[respuesta guardada solo en el servidor]",
          "explanation": "[explicación interna del enigma]"
        }
      ]
    }
  ]
}
```

> El ejemplo es ilustrativo y solo muestra una parte del caso. **La respuesta y su explicación no deben devolverse directamente en el endpoint público del enigma.** Esos datos se necesitan en el servidor para validar las respuestas.

### 3.2. Qué va embebido y qué se referencia

| Dato | Cómo se guarda | Por qué |
|---|---|---|
| `Case.files[]` | Embebido dentro de `Case` | Los expedientes forman parte del caso |
| `files[].enigmas[]` | Embebido dentro de cada expediente | Los enigmas se leen y organizan en su contexto |
| `Session.userId` | Referencia a `User` | Un usuario existe independientemente de sus partidas |
| `Session.caseId` | Referencia a `Case` | Muchos jugadores pueden intentar un mismo caso |
| Puntos del ranking | Calculados desde `Session` | Evita guardar el mismo dato en distintos sitios |

### 3.3. ¿Y si se hiciera con SQL?

Con una base de datos relacional probablemente habría tablas de usuarios, casos, expedientes, enigmas y sesiones, relacionadas con claves externas. Sería una opción válida, pero aquí el contenido de cada caso tiene una estructura bastante estable y suele consultarse unido.

MongoDB permite representar esa jerarquía de forma natural y practicar precisamente **documentos, subdocumentos, arrays, referencias, consultas y agregaciones**, que son parte de lo que estoy aprendiendo.

### 3.4. Limitaciones que debo tener en cuenta

MongoDB no garantiza automáticamente que una referencia `userId` apunte a un usuario existente del mismo modo que una clave foránea en SQL. Tendré que comprobar las referencias cuando corresponda.

Además, el hecho de tener un documento con todas las respuestas hace especialmente importante **controlar qué campos devuelve la API**. Una consulta a MongoDB no debería acabar transformándose sin más en una respuesta JSON para el jugador.

---

## 4. Modelo de datos

### 4.1. Diagrama de relaciones

```text
┌───────────────────────────┐
│            User           │
│ _id                       │
│ username                  │
│ email                     │
│ passwordHash              │
│ role: user | admin        │
└─────────────┬─────────────┘
              │ 1
              │
              │ N
┌─────────────▼─────────────┐           ┌───────────────────────────┐
│          Session          │     N   1 │            Case           │
│ _id                       ├──────────►│ _id                       │
│ userId → User             │           │ slug                      │
│ caseId → Case             │           │ order                     │
│ attempt                   │           │ title, difficulty         │
│ currentFile               │           │ description               │
│ currentPuzzle             │           │ files[]                   │
│ remainingLives            │           │   ├ order, title, intro   │
│ status                    │           │   └ enigmas[]             │
│ pointsEarned              │           │       ├ code, title, type │
│ finishedAt                │           │       ├ question, content │
└───────────────────────────┘           │       └ answer, explanation│
                                        └───────────────────────────┘
```

### 4.2. Modelo `User`

| Campo | Tipo previsto | Uso |
|---|---|---|
| `username` | `string` | Nombre visible en el ranking |
| `email` | `string` | Identificación para el inicio de sesión; único |
| `passwordHash` | `string` | Contraseña transformada mediante bcrypt |
| `role` | `'user' \| 'admin'` | Control de acceso; `user` por defecto |
| `createdAt`, `updatedAt` | `Date` | Fechas de creación y modificación |

La contraseña no se almacena en texto plano y el hash no debe aparecer en las respuestas de la API. El campo `role` **nunca debe aceptarse libremente en un registro público**.

### 4.3. Modelo `Case`

| Campo | Tipo previsto | Uso |
|---|---|---|
| `slug` | `string` | Identificador legible del caso |
| `order` | `number` | Orden de desbloqueo, del 1 al 6 |
| `title` | `string` | Nombre del caso |
| `difficulty` | `string` | Dificultad, según los datos de los casos |
| `description` | `string` | Presentación narrativa |
| `files` | `File[]` | Tres expedientes embebidos |

Cada **expediente** contiene `order`, `title`, `intro` y su array `enigmas`. Cada **enigma** contiene un código, título, tipo, pregunta, contenido, respuesta y explicación. En los datos preparados también puede incluirse `order` para establecer su posición.

Los enigmas **no tendrán sistema de pistas**. Es una decisión del diseño del juego, no un elemento que se haya olvidado implementar.

### 4.4. Modelo `Session`

| Campo | Tipo previsto | Uso |
|---|---|---|
| `userId` | `ObjectId` (`ref: User`) | Quién está jugando |
| `caseId` | `ObjectId` (`ref: Case`) | Qué caso está intentando |
| `attempt` | `number` | Número de intento para ese usuario y ese caso |
| `currentFile` | `number` | Expediente actual, del 1 al 3 |
| `currentPuzzle` | `number` | Enigma actual dentro del expediente, del 1 al 3 |
| `remainingLives` | `number` | Vidas que quedan; empieza en 6 |
| `status` | `string` | Intento activo, completado o fallido |
| `pointsEarned` | `number` | Puntuación obtenida, si corresponde |
| `finishedAt` | `Date \| null` | Momento en que termina el intento |
| `createdAt`, `updatedAt` | `Date` | Fechas de seguimiento |

**Importante:** `currentPuzzle` es la posición **dentro de un expediente**, no un número del 1 al 9. Esta distinción evita bastantes confusiones al pasar de un expediente al siguiente.

Los nombres concretos de los valores de `status` deberán fijarse en el esquema TypeScript/Mongoose para que coincidan con los datos de prueba y las comprobaciones de los controladores.

### 4.5. Las seis historias preparadas

| Orden | Caso | Dificultad de los datos preparados |
|---:|---|---|
| 1 | **La señal sin remitente** | `facil` |
| 2 | **El usuario que no existe** | `media` |
| 3 | **El archivo condenado** | `media-alta` |
| 4 | **La consola que miente** | `media` |
| 5 | **El diccionario prohibido** | `media` |
| 6 | **La sala de los reflejos** | `media-alta` |

Son **6 casos × 3 expedientes × 3 enigmas = 54 enigmas**. Hay retos de lógica, codificación, análisis de logs, HTTP, secuencias, pequeños fragmentos de JavaScript y otras pruebas de deducción.

El contenido narrativo y los datos iniciales están diseñados. **Cargar los documentos en MongoDB y conectar los modelos con la API sigue formando parte de la implementación.**

---

## 5. Reglas del juego

Esta es la parte con más personalidad de BLACKBOX y también la que exige más cuidado en el backend.

### 5.1. Los casos se desbloquean por orden

Al empezar solo se puede jugar al **caso 1**. El siguiente queda disponible cuando se completa el anterior. Esto continúa hasta el sexto caso.

El frontend puede mostrar los casos bloqueados con otro aspecto, pero **la comprobación real debe hacerla el servidor**. No basta con ocultar un botón en React.

### 5.2. Cada caso tiene nueve enigmas

El recorrido es secuencial:

```text
Caso 1
  Expediente 1 → Enigma 1 → Enigma 2 → Enigma 3
  Expediente 2 → Enigma 1 → Enigma 2 → Enigma 3
  Expediente 3 → Enigma 1 → Enigma 2 → Enigma 3
  Caso completado → se desbloquea el caso 2
```

La API guarda la posición actual y no permite saltarse enigmas enviando índices elegidos por el cliente.

### 5.3. Se empieza con seis vidas

Cada intento comienza con **6 vidas**. Una respuesta correcta hace avanzar al siguiente enigma. Una respuesta incorrecta resta **1 vida**. Si se llega a **0 vidas**, el intento se considera fallido y se cierra.

No hay pistas ni forma de recuperar vidas durante el intento.

### 5.4. Se puede reintentar un caso perdido

Perder un caso no significa quedarse bloqueado para siempre. Se puede iniciar otro intento, que vuelve a empezar con seis vidas y desde el primer enigma.

La diferencia está en la puntuación: **superarlo en un segundo intento permite avanzar, pero ya no da puntos de ese caso**.

### 5.5. Los puntos dependen del primer intento

La regla principal es sencilla:

> **Solo se pueden ganar puntos al completar un caso en el primer intento. Los puntos son las vidas que queden en ese momento.**

| Situación | Resultado | Puntos del caso |
|---|---|---:|
| Supera el caso a la primera sin fallos | Completado | 6 |
| Supera el caso a la primera con dos errores | Completado | 4 |
| Pierde el primer intento | Fallido | 0 |
| Pierde el primero y supera el segundo | Completado y siguiente caso desbloqueado | 0 |
| Repite un caso ya puntuado | Nunca puede aumentar su puntuación | No suma puntos nuevos |

El máximo teórico es **36 puntos** (6 puntos × 6 casos).

Esta mecánica busca que acertar a la primera tenga valor, pero sin impedir que alguien que haya fallado pueda continuar la historia.

### 5.6. El ranking

No hace falta guardar un `totalScore` en cada usuario ni crear una colección `leaderboard`. La puntuación puede calcularse sumando `pointsEarned` de las sesiones completadas.

La clasificación mostrará a los jugadores ordenados de mayor a menor puntuación. Los administradores no tienen por qué aparecer en ese ranking.

**Precaución:** los puntos no se deben volver a sumar al repetir una petición ni al completar de nuevo un caso. El servidor tendrá que garantizar que cada caso aporta puntos **una única vez como máximo**.

### 5.7. Una respuesta no puede decidir el resultado desde el cliente

El jugador enviará su respuesta; no enviará si es correcta, las vidas que quiere conservar ni los puntos que desea recibir.

```text
Jugador envía una respuesta
            │
            ▼
Servidor comprueba la sesión activa
            │
            ▼
Servidor identifica el enigma correcto
            │
            ▼
Compara respuesta con el dato guardado
      ┌─────┴─────┐
      │           │
   Correcta    Incorrecta
      │           │
   Avanza     Resta 1 vida
      │           │
      └─────┬─────┘
            ▼
Guarda progreso y devuelve estado actualizado
```

El método exacto de normalización de respuestas (mayúsculas, espacios, formatos) se definirá con cuidado para no dar por correcta una respuesta distinta de la prevista.

---

## 6. Arquitectura del backend

### 6.1. Estructura actual

La estructura que he preparado es esta (los archivos de lógica todavía están pendientes de desarrollar):

```text
blackbox/
├── src/
│   ├── index.ts
│   ├── config/
│   │   └── dbMongo.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── case.controller.ts
│   │   └── session.controller.ts
│   ├── middlewares/
│   │   └── auth.middleware.ts
│   ├── models/
│   │   ├── models.ts
│   │   ├── user.model.ts
│   │   ├── case.model.ts
│   │   └── session.model.ts
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   ├── case.repository.ts    
│   │   └── session.repository.ts
│   ├── routes/
│   │   ├── router.ts
│   │   ├── user.router.ts
│   │   ├── case.router.ts
│   │   └── session.router.ts
│   └── utils/
│       └── errors.ts
├── test/
│   ├── auth.test.ts
│   ├── user.test.ts
│   ├── case.test.ts
│   └── session.test.ts
├── mongo/
├── .env.example
├── .dockerignore
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── package-lock.json
└── tsconfig.json
```

La intención es mantener una estructura que reconozca de las clases y del trabajo anterior, sin añadir carpetas o capas porque sí. En particular, **de momento no he creado una carpeta `services`**: quiero ver cómo evoluciona el ejemplo del profesor y añadirla solo si resulta necesaria para organizar la lógica del juego.


### 6.2. Qué hace cada capa

| Capa | Responsabilidad |
|---|---|
| **Routes** | Definen las direcciones y los métodos HTTP; conectan middlewares y controladores |
| **Middlewares** | Verifican la autenticación, los permisos y, cuando corresponda, gestionan errores |
| **Controllers** | Reciben las peticiones, aplican las reglas del juego y construyen las respuestas |
| **Repositories** | Agrupan las operaciones de consulta y escritura mediante Mongoose |
| **Models** | Definen los esquemas, tipos y validaciones de datos |
| **Utils** | Funciones de apoyo para errores, comprobaciones y lógica reutilizable |
| **Config** | Gestiona la conexión a MongoDB y la configuración de la aplicación |

El recorrido habitual será:

```text
Petición HTTP
     ↓
    Ruta
     ↓
 Middleware (si procede)
     ↓
 Controlador
     ↓
 Repositorio
     ↓
 Modelo Mongoose
     ↓
  MongoDB
```

### 6.3. Ejemplo: enviar una respuesta

Para una petición de respuesta, el controlador tendrá que:

1. Identificar al usuario por el JWT.
2. Buscar su sesión y comprobar que le pertenece y está activa.
3. Localizar el caso y el enigma correspondiente a la posición guardada.
4. Comparar la respuesta enviada con la respuesta del servidor.
5. Actualizar vidas o posición; terminar el intento si procede.
6. Asignar puntos solo cuando se cumplen las reglas del primer intento.
7. Guardar la sesión y devolver **solo la información que el cliente debe conocer**.

Las búsquedas y guardados corresponderán al repositorio. Las reglas de vidas, desbloqueos y puntos no deben repartirse sin control entre distintas rutas.

### 6.4. TypeScript dentro de esta arquitectura

TypeScript ayudará a que los datos tengan una forma conocida. Por ejemplo, un tipo sencillo podría ser:

```ts
type UserRole = 'user' | 'admin';

type SessionStatus = 'active' | 'completed' | 'failed';

interface SessionProgress {
  currentFile: number;
  currentPuzzle: number;
  remainingLives: number;
  status: SessionStatus;
}
```

**Esto es un ejemplo de diseño, no código implementado.** Cuando escriba los modelos, tendré que hacer coincidir los tipos de TypeScript, los esquemas de Mongoose y los JSON de datos iniciales.

---

## 7. Seguridad y autorización

### 7.1. Registro e inicio de sesión

La autenticación se plantea con **bcrypt** para guardar contraseñas mediante hash y **JWT** para identificar al usuario en rutas protegidas.

Flujo previsto:

1. Una persona envía nombre, email y contraseña para registrarse.
2. Se validan los datos y se comprueba que no exista ya esa cuenta.
3. Se guarda un hash de la contraseña, nunca la contraseña original.
4. Al iniciar sesión se comprueba la contraseña con bcrypt.
5. Si es correcta, se genera un JWT.
6. En las siguientes peticiones protegidas se envía `Authorization: Bearer <token>`.

No se permitirá que una persona se registre escogiendo `role: 'admin'` desde el cuerpo de la petición.

### 7.2. Permisos

| Acción | Sin sesión | `user` | `admin` |
|---|:---:|:---:|:---:|
| Registrarse / iniciar sesión | ✅ | ✅ | ✅ |
| Ver los contenidos públicos definidos | ✅ | ✅ | ✅ |
| Iniciar un caso desbloqueado | ❌ | ✅ | Según política del juego |
| Enviar respuestas de su sesión | ❌ | ✅ | Según política del juego |
| Consultar su propio progreso | ❌ | ✅ | ✅ |
| Modificar sesiones o puntos de otra persona | ❌ | ❌ | Solo herramientas administrativas autorizadas |
| Administrar casos | ❌ | ❌ | ✅ |

### 7.3. Las respuestas correctas deben quedar protegidas

Este punto es especialmente importante en BLACKBOX. Los documentos de `Case` contienen las respuestas necesarias para comprobar cada enigma, pero **no pueden salir completas en los endpoints para jugadores**.

Por ejemplo, una respuesta pública del enigma podría mostrar:

```json
{
  "code": "C01-E01-P01",
  "title": "El mensaje hexadecimal",
  "type": "hex",
  "question": "¿Qué palabra forma este mensaje?",
  "content": "45 43 48 4F"
}
```

No debería incluir `answer`, ni una explicación que desvele la respuesta antes de completar la prueba. El servidor conserva esa información internamente.

### 7.4. Proteger las sesiones

Un usuario no debe poder:

- Modificar `remainingLives`, `status` o `pointsEarned` desde el body de una petición.
- Responder a una sesión que pertenece a otra persona.
- Empezar un caso todavía bloqueado.
- Reutilizar una sesión fallida como si siguiera activa.
- Saltar al último enigma cambiando un número en la URL o en el JSON.
- Enviar varias peticiones simultáneas y conseguir puntos duplicados.

También habrá que tratar con cuidado la validación de ObjectId y evitar pasar objetos recibidos del cliente directamente a consultas de MongoDB sin comprobarlos.

### 7.5. Variables de entorno

Las credenciales de MongoDB y el secreto JWT se guardarán en `.env`, que está excluido de Git. `.env.example` sirve para mostrar qué variables se necesitan, pero sin incluir contraseñas reales.

---

## 8. Endpoints previstos

**La siguiente tabla es una propuesta de rutas**, no una lista de endpoints que ya funcionen. Puede cambiar ligeramente cuando escriba los controladores. Se utilizará el prefijo `/api`.

### 8.1. Autenticación y usuarios

| Método | Ruta propuesta | Acceso | Qué hace |
|---|---|---|---|
| `POST` | `/api/auth/register` | Público | Crear una cuenta |
| `POST` | `/api/auth/login` | Público | Iniciar sesión y obtener JWT |
| `GET` | `/api/users/me` | Autenticado | Consultar el perfil propio |
| `PATCH` | `/api/users/me` | Autenticado | Actualizar datos permitidos del perfil, si se incluye en el alcance final |

### 8.2. Casos

| Método | Ruta propuesta | Acceso | Qué hace |
|---|---|---|---|
| `GET` | `/api/cases` | Según contenido público | Listar casos sin respuestas secretas |
| `GET` | `/api/cases/:id` | Autenticado | Consultar información del caso y su estado de acceso |
| `POST` | `/api/cases` | Admin | Crear contenido, si se habilita mantenimiento por API |
| `PATCH` | `/api/cases/:id` | Admin | Editar contenido, si se habilita |
| `DELETE` | `/api/cases/:id` | Admin | Eliminar contenido, con las precauciones necesarias |

**Nota:** que exista un endpoint de detalle no significa devolver todos los enigmas con sus soluciones. El servidor decidirá qué información puede ver el usuario.

### 8.3. Sesiones y juego

| Método | Ruta propuesta | Acceso | Qué hace |
|---|---|---|---|
| `POST` | `/api/sessions` | Autenticado | Iniciar un intento de un caso desbloqueado |
| `GET` | `/api/sessions/me` | Autenticado | Consultar los intentos y el progreso del usuario |
| `GET` | `/api/sessions/:id` | Propietario | Ver el estado de una sesión propia |
| `POST` | `/api/sessions/:id/answer` | Propietario, activa | Enviar una respuesta y avanzar o perder vida |
| `GET` | `/api/leaderboard` | Público o autenticado | Clasificación por puntos |

La decisión sobre si el ranking es público o requiere sesión puede tomarse cuando se empiece con el frontend.

### 8.4. Formato de respuestas

Una estructura coherente ayudará a React a manejar las respuestas:

```json
{
  "data": {
    "sessionId": "<id>",
    "remainingLives": 5,
    "currentFile": 1,
    "currentPuzzle": 2,
    "status": "active",
    "pointsEarned": 0
  }
}
```

En los errores se seguirá un formato común, por ejemplo:

```json
{
  "error": {
    "code": "CASE_LOCKED",
    "message": "Todavía no has desbloqueado este caso"
  }
}
```

Estos formatos son orientativos hasta que se definan los controladores.

---

## 9. Gestión de errores

### 9.1. Respuestas HTTP

| Código | Cuándo se utilizará |
|---|---|
| `200` | Consulta o acción completada |
| `201` | Usuario o sesión creada |
| `400` | Datos incorrectos, respuesta mal formada o petición no válida |
| `401` | Falta autenticación o el token no es válido |
| `403` | Usuario autenticado sin permiso o caso bloqueado |
| `404` | Usuario, caso o sesión inexistente |
| `409` | Conflicto de estado, por ejemplo intentar iniciar otra sesión activa o duplicar una operación |
| `500` | Error inesperado del servidor |

### 9.2. Errores propios del juego

| Código orientativo | Situación |
|---|---|
| `CASE_LOCKED` | El caso todavía no está desbloqueado |
| `CASE_NOT_FOUND` | No existe el caso solicitado |
| `SESSION_NOT_FOUND` | La sesión no existe o no se puede consultar |
| `SESSION_NOT_ACTIVE` | El intento ya ha terminado |
| `ACTIVE_SESSION_EXISTS` | Ya existe un intento activo incompatible con iniciar otro |
| `INVALID_ANSWER` | La petición no incluye una respuesta válida |
| `FORBIDDEN` | El usuario intenta acceder a recursos ajenos o administrativos |

No todo fallo de un enigma es un error HTTP: **dar una respuesta incorrecta es una acción válida del juego**. El servidor puede devolver una respuesta normal indicando que se ha perdido una vida. Es importante no confundir las reglas de la partida con un fallo técnico de la API.

### 9.3. Centralizar los errores

La idea es mantener una utilidad o middleware de errores para no repetir la misma lógica en todos los controladores. El mensaje que recibe el jugador debe ser claro, pero no debe filtrar información sensible, trazas internas o respuestas correctas.

---

## 10. Testing

### 10.1. Por qué Vitest

La primera estructura del proyecto incluía **Jest**, porque era para trabajar con JavaScript. Cuando pasé a TypeScript también pasé a **Vitest**, que es la herramienta que el profesor ha comentado que utilizemos.

Los archivos de test están preparados, aunque **todavía están vacíos en el estado actual del proyecto**. No sería correcto afirmar que las reglas del juego están probadas solo porque Vitest está instalado.

### 10.2. Tests que quiero escribir

| Archivo / grupo | Qué comprobar |
|---|---|
| `auth.test.ts` | Registro, login, credenciales incorrectas, JWT y acceso protegido |
| `user.test.ts` | Consulta del perfil, permisos y protección de datos |
| `case.test.ts` | Orden de los casos, bloqueos y ocultación de respuestas |
| `session.test.ts` | Creación de intentos, vidas, avance y estado final |
| Tests del juego (por añadir) | Primer intento, reintentos, desbloqueos y puntuaciones |
| Tests del ranking (por añadir) | Suma de puntos y exclusión de administradores |

### 10.3. Casos que considero imprescindibles

1. Un intento nuevo empieza con **6 vidas**.
2. Una respuesta correcta avanza exactamente un enigma.
3. Una respuesta incorrecta resta exactamente una vida.
4. Con **0 vidas** el intento pasa a fallido y ya no acepta respuestas.
5. El progreso pasa correctamente del tercer enigma de un expediente al primero del siguiente.
6. El noveno enigma correcto termina el caso.
7. No se puede jugar a un caso bloqueado.
8. Completar el primer intento con 4 vidas otorga **4 puntos**.
9. Perder el primer intento y superar el segundo otorga **0 puntos**.
10. Volver a enviar una petición no puede sumar puntos dos veces.
11. Un usuario no puede consultar o modificar una sesión ajena.
12. Los endpoints del jugador **no revelan las respuestas**.
13. El ranking suma los puntos de las sesiones correspondientes y no incluye al admin.

### 10.4. Tests unitarios e integración

Los **tests unitarios** comprobarán reglas aisladas, por ejemplo cómo se calculan puntos o cómo cambia la posición de un enigma. Los **tests de integración** servirán para comprobar que las rutas de Express, los middlewares y la base de datos se comportan correctamente en conjunto.

`supertest` ya está instalado y puede resultar útil para probar la API HTTP. Queda pendiente decidir cómo aislar la base de datos de los tests; lo importante es no ejecutar pruebas destructivas sobre datos reales.

### 10.5. Comandos disponibles

```bash
npm test                    # Ejecuta los tests una vez
npm run test:watch          # Vitest observa cambios
npm run test:coverage       # Informe de cobertura
npm run type-check          # Comprueba tipos
npm run build               # Compila TypeScript
```

Actualmente, `type-check` y `build` han podido ejecutarse sin errores sobre la estructura preparada. **Eso no equivale a haber validado una API todavía sin implementar.**

---

## 11. Retos técnicos y decisiones

### 11.1. Calcular puntos sin hacer trampas

Si el frontend enviara los puntos obtenidos, sería muy sencillo modificar una petición y ponerse la puntuación máxima. La solución prevista es que **los puntos los calcule el servidor** a partir del estado de la sesión y del número de intento.

### 11.2. Evitar sesiones y puntos duplicados

Dos peticiones enviadas casi a la vez podrían intentar modificar la misma sesión. Habrá que pensar cómo asegurar que una misma respuesta no avance dos enigmas y que una finalización no puntúe dos veces. Es una parte especialmente delicada porque afecta a la integridad del ranking.

### 11.3. Conseguir que el juego recuerde dónde estaba cada jugador

El estado no puede vivir solo en el navegador. Una persona puede cerrar la pestaña o iniciar sesión desde otro dispositivo. La colección `sessions` permite recuperar el intento y su posición desde MongoDB.

### 11.4. No enseñar las soluciones antes de tiempo

Mongoose podrá consultar el caso completo para comprobar respuestas, pero el controlador tendrá que construir una representación segura. Una ruta de listado o detalle no debe enviar accidentalmente `answer` y `explanation`.

### 11.5. La dificultad de relacionar documentos y subdocumentos

Las sesiones referencian casos, pero la posición de un enigma vive dentro de los arrays de `Case`. Habrá que comprobar límites y posiciones para evitar un acceso a un enigma inexistente o un salto de expediente mal calculado.

### 11.6. Aprender TypeScript mientras programo

El cambio de lenguaje implica que seguramente tenga que consultar documentación y corregir errores de tipos que antes no aparecían. Lo veo como parte del aprendizaje. Prefiero avanzar poco a poco, entendiendo cómo funciona cada interfaz o tipo, antes que crear una arquitectura demasiado compleja de golpe.

### 11.7. Entender Docker y los distintos `localhost`

Hay una diferencia importante entre ejecutar la API directamente en mi ordenador y hacerlo dentro de Docker:

- Desde un contenedor, el servidor MongoDB se alcanza por el servicio `mongo` en el puerto `27017`.
- Desde **MongoDB Compass**, que está en mi ordenador, se accede normalmente a `localhost` y al puerto publicado.
- Si ejecuto la API con `npm run dev` fuera de Docker, la conexión a MongoDB también suele necesitar `localhost`.

Quiero entender bien esa diferencia, porque evita muchos errores de conexión.

---

## 12. Estado actual y plan de implementación

### 12.1. Lo que está preparado a fecha de esta memoria

| Elemento | Estado |
|---|---|
| Idea, ambientación y mecánicas del juego | **Diseñadas** |
| Seis casos con tres expedientes y tres enigmas cada uno | **Datos preparados** |
| Estructura de carpetas en `src/` | **Creada** |
| Cambio a `src/index.ts` y configuración TypeScript | **Preparado** |
| Dependencias de Express, Mongoose, bcrypt, JWT, Swagger | **Declaradas e instaladas** |
| Vitest y Supertest | **Instalados; tests pendientes** |
| `tsconfig.json` con `NodeNext` | **Configurado** |
| Scripts de compilación y comprobación de tipos | **Configurados y probados sobre el esqueleto** |
| Dockerfile, Docker Compose y `.dockerignore` | **Creados; integración pendiente de validar** |
| Modelos Mongoose | **Pendientes de implementar** |
| Registro y login | **Pendientes de implementar** |
| Reglas de sesión y puntuación | **Pendientes de implementar** |
| Endpoints y ranking | **Pendientes de implementar** |
| Documentación Swagger completa | **Pendiente de implementar** |

### 12.2. Orden de trabajo previsto

**Fase 1 — Arranque y MongoDB.** Crear el servidor Express en `src/index.ts`, configurar los middlewares básicos y establecer la conexión con Mongoose. Comprobar el funcionamiento tanto local como en Docker, cuando corresponda.

**Fase 2 — Usuarios y autenticación.** Empezar por `User`, como en los ejemplos trabajados en clase. Crear modelo, repositorio, controlador, rutas y JWT. Probar los accesos.

**Fase 3 — Casos.** Definir el esquema de `Case`, incluyendo expedientes y enigmas embebidos. Preparar las consultas y cargar los datos iniciales. Asegurarse de que las respuestas correctas no se exponen.

**Fase 4 — Sesiones y reglas del juego.** Implementar inicio de intento, validación de respuestas, pérdida de vidas, avance, cierre de sesión y desbloqueo del caso siguiente.

**Fase 5 — Puntuación y ranking.** Comprobar la regla de primer intento, impedir puntuaciones duplicadas y calcular la clasificación.

**Fase 6 — Pruebas y documentación.** Adaptar los tests a Vitest, comprobar casos límite, documentar los endpoints con Swagger y revisar el README y esta memoria.

### 12.3. Criterio para avanzar

No quiero marcar fases como terminadas solo porque existan sus archivos. Para dar una fase por completada debería poder **ejecutarla, probar una petición real, comprobar qué guarda en MongoDB y explicar qué hace el código**.

---

## 13. Mejoras futuras

Son ideas que encajarían con BLACKBOX, pero que no forman parte del mínimo que necesito terminar ahora:

- Construir un **frontend con React** que muestre los casos como expedientes interactivos.
- Añadir una pantalla de progreso con los casos completados, bloqueados y pendientes.
- Mostrar mejor el ranking y las estadísticas personales.
- Crear herramientas de administración para cargar nuevos casos sin modificar archivos JSON.
- Ampliar el catálogo con más historias y enigmas.
- Mejorar las pruebas de integración y automatizar comprobaciones.
- Preparar un entorno de despliegue diferente del entorno de desarrollo.

No quiero añadir un sistema de pistas: la decisión actual es mantener los enigmas sin ayudas.

---

## Anexo A: configuración y herramientas

### A.1. Tecnologías principales

| Herramienta | Uso en BLACKBOX |
|---|---|
| **Node.js 26** | Ejecutar la aplicación y, en desarrollo, archivos TypeScript directamente |
| **TypeScript** | Tipar el backend y compilar a JavaScript |
| **Express 5** | Crear rutas y gestionar peticiones HTTP |
| **MongoDB 8** | Base de datos documental |
| **Mongoose** | Esquemas, validación y consultas |
| **bcrypt** | Hash y comprobación de contraseñas |
| **jsonwebtoken** | Autenticación con JWT |
| **express-validator** | Validaciones de entrada, según necesidades |
| **cors** | Permitir solicitudes desde el frontend autorizado |
| **Vitest** | Tests |
| **Supertest** | Pruebas de endpoints HTTP |
| **swagger-jsdoc / swagger-ui-express** | Documentación interactiva de la API |
| **Docker / Docker Compose** | Entorno con API y MongoDB |
| **MongoDB Compass** | Consultar y gestionar los datos de MongoDB desde una aplicación gráfica |

### A.2. Scripts actuales de `package.json`

```json
{
  "scripts": {
    "dev": "node --watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "docs": "jsdoc -c jsdoc.json"
  }
}
```

**Apunte:** el script `docs` está preparado, pero el archivo de configuración de JSDoc y su uso efectivo todavía deberán revisarse. La documentación de la API mediante Swagger es otro trabajo distinto.

### A.3. TypeScript y módulos

En `package.json` se utiliza:

```json
"type": "module"
```

Y en `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "rewriteRelativeImportExtensions": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Para que la ejecución directa y la compilación sean compatibles, los imports relativos pueden escribirse con extensión `.ts` y el compilador los reescribirá a `.js` al construir `dist/`.

### A.4. Variables de entorno (`.env.example`)

```dotenv
APP_HOST=Blackbox
APP_PORT=3000

MONGO_HOST=mongo
MONGO_PORT=27017
MONGO_USER=user
MONGO_PASSWORD=pon_aqui_una_password
MONGO_DB=Blackbox_bd
MONGO_AUTH_SOURCE=admin

JWT_SECRET=pon_aqui_un_secreto_largo
```

`APP_HOST` y `MONGO_HOST` se han utilizado también como nombres de contenedor en Docker Compose, siguiendo la forma de trabajar vista en clase. **Eso no significa que `APP_HOST` deba utilizarse como dirección de escucha de Express**.

El `.env` real no se comparte ni se sube a Git; solo se sube el ejemplo.

### A.5. Docker y Compass

El `Dockerfile` está preparado con `node:26-slim`, `npm ci` y el comando de desarrollo. Docker Compose declara dos servicios: `app` y `mongo`. Ya no hay un servicio `mongo-express`, porque se utilizará **MongoDB Compass** como herramienta gráfica.

**Pendiente de revisar al levantar los contenedores:** asegurar que las variables del `.env` lleguen al proceso de Node (`env_file` o una alternativa equivalente), que el puerto de Express coincida con el mapeo, que el volumen de `node_modules` esté bien declarado y que el montaje de scripts de inicialización apunte a una carpeta real si se usa.

La conexión de Compass, usando los datos del ejemplo, tendría la forma:

```text
mongodb://user:TU_PASSWORD@localhost:27017/Blackbox_bd?authSource=admin
```

Se reemplaza `TU_PASSWORD` por la contraseña real del `.env`. Nunca se guarda esa contraseña en la memoria ni en el repositorio.

### A.6. Archivos que no se deben publicar

En `.gitignore` y `.dockerignore` se excluyen archivos o carpetas como `.env`, `node_modules`, `dist` y los resultados de cobertura, según corresponda. **`package-lock.json` sí se conserva y se sube a Git**, porque permite instalar las versiones bloqueadas de las dependencias.

---

## Anexo B: comprobación de objetivos

Este anexo es una lista de objetivos del propio proyecto, no una afirmación de que estén ya completados.

| Objetivo | Cómo se abordará | Estado actual |
|---|---|---|
| API REST con Express | Rutas para usuarios, casos, sesiones y ranking | Pendiente |
| Persistencia en MongoDB | `User`, `Case`, `Session` con Mongoose | Pendiente |
| Subdocumentos | `files[]` y `enigmas[]` dentro de `Case` | Diseñado |
| Referencias entre documentos | `Session.userId` y `Session.caseId` | Diseñado |
| Autenticación | bcrypt + JWT | Dependencias preparadas |
| Autorización por roles | `user` / `admin` | Diseñado |
| Reglas de negocio | Vidas, intentos, desbloqueos y puntos | Diseñadas |
| Consultas / agregaciones | Ranking a partir de sesiones | Diseñado |
| Testing | Vitest y Supertest | Preparado, sin tests implementados |
| TypeScript | Modelos, controladores y funciones tipadas | Configurado; implementación pendiente |
| Docker Compose | API + MongoDB; Compass como cliente gráfico | Configuración inicial preparada |
| Documentación | Swagger y documentación técnica | Pendiente |
| Frontend posterior | Consumo de la API desde React | Mejora futura |

---

## Cierre personal

BLACKBOX empezó siendo una forma de practicar lo aprendido sobre backend con una idea que me resultaba divertida: convertir una API en el motor de un juego de expedientes, enigmas y decisiones. Poco a poco, también se ha convertido en una oportunidad para probar herramientas nuevas.

**El paso de JavaScript a TypeScript no estaba en el plan inicial.** Lo decidí al ver que el profesor nos daba esa opción y que podía aprovechar el proyecto para empezar a manejarme con otro lenguaje. Seguramente habrá partes que me cuesten más por hacerlo así, pero precisamente me interesa aprender cómo se tipan los datos y cómo encajan TypeScript, Express y Mongoose en un proyecto real.

Me gustaría que el resultado no fuese solo una API que funcione, sino un proyecto que **entienda**, que pueda explicar y que después me sirva como base para crear una interfaz en React. La ambientación de BLACKBOX es la parte creativa; el verdadero reto está en conseguir que todo el sistema funcione de manera coherente y segura.

*Memoria viva: se actualizará conforme avance la implementación y se confirmen las decisiones que ahora están planteadas como propuestas.*
