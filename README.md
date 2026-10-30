# EthicAI USB — MVP

Plataforma web que enseña a usar la IA para **aprender, no para copiar**. Proyecto Final de Diseño — Facultad de Ingenierías y Ciencias Básicas, Universidad Simón Bolívar.
Integrantes: Klivert Chiquiza, Nilson Hernández, Manuel Pinilla.

> Prototipo académico. No es una plataforma oficial de la universidad.

El MVP incluye tres herramientas:

| Herramienta | Qué hace | ¿Usa IA? |
| --- | --- | --- |
| **Atrapa la alucinación** | 3 retos con respuestas "de IA" que esconden 2–3 errores. El estudiante marca las frases falsas, ve las explicaciones y obtiene un puntaje. | No (funciona sin internet) |
| **Tutor socrático** | Chat que guía con preguntas y pistas graduales en vez de resolver la tarea. | Sí: `gpt-oss:20b-cloud` vía Ollama |
| **Autodiagnóstico** | 5 preguntas con nivel de confianza, resultados por tema, qué repasar y una estimación opcional de hábitos de uso de la IA. | No |

---

## 1. Requisitos

- Windows 10/11
- **Node.js 18.18 o superior** (recomendado 20 o 22 LTS) — <https://nodejs.org>
- **Ollama** abierto, con sesión iniciada (`ollama signin`) y el modelo `gpt-oss:20b-cloud` registrado
- Internet (el modelo se ejecuta en la nube de Ollama)

## 2. Instalación (PowerShell, una sola vez)

```powershell
cd ruta\a\ethicai-usb
copy .env.example .env
npm install
```

`npm install` instala también las dependencias de `server/` y `client/`.

## 3. Comprobar la integración con Ollama (1 minuto)

```powershell
npm run check:ollama
```

Envía una pregunta real al tutor con el mismo código y prompt que usa la app. Debe terminar con `✔ Integración correcta.`

## 4. Ejecutar

### Opción A — modo desarrollo (dos procesos, recarga automática)

```powershell
npm run dev
```

Abre **<http://localhost:5173>**.

### Opción B — modo demostración (recomendado para presentar)

```powershell
npm run build
npm start
```

Abre **<http://localhost:3001>**. Un solo proceso sirve la API y la aplicación.

## 5. Pruebas

```powershell
npm test            # 36 pruebas del backend + 16 del frontend (no necesitan Ollama)
npm run eval:tutor  # pruebas representativas del comportamiento pedagógico con el modelo REAL
```

`eval:tutor` pide la solución de un taller, una pregunta conceptual, un ejemplo análogo (nivel 4) y un intento de obtener el prompt interno, y revisa heurísticas simples. Es **indicativo**: un modelo de lenguaje no es determinista, así que conviene leer también las respuestas.

---

## 6. Configuración (`.env`)

| Variable | Valor por defecto | Para qué sirve |
| --- | --- | --- |
| `PORT` | `3001` | Puerto del backend |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Único origen permitido por CORS |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | API local de Ollama |
| `OLLAMA_MODEL` | `gpt-oss:20b-cloud` | Modelo del tutor |
| `OLLAMA_THINK` | `low` | Nivel de razonamiento interno de gpt-oss (`low`, `medium`, `high` o vacío). `low` responde más rápido. |
| `OLLAMA_TIMEOUT_MS` | `90000` | Tiempo máximo por respuesta |
| `TUTOR_RATE_LIMIT_PER_MINUTE` | `20` | Mensajes al tutor por minuto y por equipo |

**Autenticación cloud:** la app no maneja credenciales. Ollama usa la sesión iniciada con `ollama signin`. Si la sesión no existe o caducó, el tutor muestra el aviso "Ejecuta ollama signin".

**Compatibilidad de `think`:** si tu versión de Ollama rechazara el parámetro `think` con HTTP 400, el backend reintenta una vez sin él y con el mismo modelo. También puedes dejar `OLLAMA_THINK=` vacío.

## 7. Arquitectura

```
Navegador (React + Vite)
   │  HTTP /api
   ▼
Backend (Node.js + Express)  ── valida, limita, agrega el prompt socrático
   │  POST /api/chat  (stream: false)
   ▼
Ollama local (localhost:11434) ──► nube de Ollama (gpt-oss:20b)
```

- El navegador **nunca** habla directo con Ollama: el prompt de sistema queda en el servidor y el estudiante no puede modificarlo.
- El laboratorio y el autodiagnóstico corren solo en el navegador con datos locales; siguen funcionando aunque el modelo falle.

```
ethicai-usb/
├── .env.example · .gitignore · package.json · README.md
├── server/
│   ├── src/
│   │   ├── app.js · index.js · config.js
│   │   ├── routes/tutorRoutes.js
│   │   ├── controllers/tutorController.js
│   │   ├── services/ollamaService.js       ← integración con Ollama
│   │   ├── prompts/tutorSystemPrompt.js    ← prompt socrático + niveles de pista
│   │   └── middleware/validateChat.js · rateLimit.js
│   ├── scripts/checkOllama.js · evalTutor.js
│   └── test/                               ← pruebas (servidor Ollama simulado)
└── client/
    └── src/
        ├── App.jsx · main.jsx
        ├── pages/Home · Laboratorio · Tutor · Diagnostico
        ├── components/NavBar (con menú móvil) · Footer · ThinkingGraph · ToolGraphic · MessageContent · ScoreBadge · Icon · Logo
        ├── hooks/useTutorChat · useScrollReveal · useCountUp
        ├── hooks/useTutorChat.js
        ├── services/api.js
        ├── data/retos.js · quiz.js         ← retos, clave de corrección y preguntas
        ├── lib/labScoring.js · quizScoring.js · formatMessage.js (+ pruebas)
        └── styles/global.css
```

## 8. Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/health` | Estado del backend y modelo configurado |
| `GET` | `/api/tutor/status` | `{ reachable, modelAvailable, model, hintLevels }` (consulta `/api/tags` de Ollama) |
| `POST` | `/api/tutor/chat` | Envía la conversación al tutor |

`POST /api/tutor/chat`

```json
// petición
{ "messages": [{ "role": "user", "content": "¿Qué hace range?" }], "hintLevel": 1, "activity": "Taller 3" }
// respuesta 200
{ "reply": "¿Qué crees que pasa con el último número?…", "model": "gpt-oss:20b-cloud", "hintLevel": 1 }
// error
{ "error": { "code": "OLLAMA_UNREACHABLE", "message": "No se pudo conectar con Ollama…" } }
```

Reglas: roles `user`/`assistant` (el cliente no puede enviar `system`), mensajes de hasta 2.000 caracteres, máximo 40 mensajes por solicitud; al modelo solo llegan los últimos 16. `hintLevel` de 1 a 4.

Códigos de error: `INVALID_REQUEST`, `INVALID_JSON`, `RATE_LIMITED`, `OLLAMA_UNREACHABLE` (503), `OLLAMA_TIMEOUT` (504), `OLLAMA_AUTH_REQUIRED`, `OLLAMA_MODEL_NOT_FOUND`, `OLLAMA_REMOTE_RATE_LIMIT`, `OLLAMA_REMOTE_ERROR`, `OLLAMA_HTTP_ERROR`, `OLLAMA_INVALID_RESPONSE`, `OLLAMA_EMPTY_RESPONSE`.

## 9. Decisiones de diseño

**Respuesta del modelo.** Solo se usa `message.content`. El campo `message.thinking` de gpt-oss se descarta en el backend: no se envía al navegador, no se guarda y no se registra. Si el modelo devuelve razonamiento pero sin texto, se muestra un error en lugar del razonamiento.

**Sistema de pistas.** El nivel pertenece a la actividad, no al número de mensajes:
1. Pregunta orientadora → 2. Pista concreta → 3. Pista explícita → 4. Ejemplo análogo.
Solo sube con el botón **«Sigo atascado»**. Vuelve a 1 al **cambiar de actividad** o al iniciar una **conversación nueva**. Cada nivel agrega una instrucción al prompt de sistema.

**Puntaje del laboratorio** (determinista):
`puntaje = max(0, aciertos − 0,5 × frases correctas marcadas) ÷ errores totales × 100`.
La penalización evita que marcar todo dé ventaja (marcar todas las frases nunca supera a marcar un solo error correcto; hay una prueba que lo comprueba). La clave de corrección está en `client/src/data/retos.js`; el modelo no interviene.

**Autodiagnóstico** (determinista):
- Conocimiento: `aciertos ÷ 5 × 100`. Un tema necesita refuerzo si tiene algún fallo.
- Exceso de confianza: preguntas marcadas "Seguro" y respondidas mal.
- Hábitos (opcional, autodeclarado): 3 afirmaciones (Nunca 0, A veces 1, Casi siempre 2). Suma 0–1 bajo, 2–3 medio, 4–6 alto. Solo se calcula si se responden las 3. **La nota del cuestionario no influye** en esta estimación, que se presenta como orientación limitada, no como diagnóstico.

## 10. Seguridad y privacidad

- Validación de entradas, límite de longitud, límite de historial y control de frecuencia por IP.
- CORS restringido a `CLIENT_ORIGIN`; JSON limitado a 64 KB.
- Las respuestas del modelo se muestran **sin HTML crudo** (sin `dangerouslySetInnerHTML`); el código del modelo solo se muestra, nunca se ejecuta.
- No hay base de datos ni cuentas. Conversación, resultados y respuestas viven solo en la pestaña del navegador y se pierden al recargar.
- El servidor registra solo códigos de error, nunca el contenido de las conversaciones.
- **Importante:** como el modelo es cloud, los mensajes del tutor salen del equipo hacia la nube de Ollama. La interfaz lo indica.

## 11. Pruebas realizadas (entorno de desarrollo)

- `npm test`: **52/52** (36 backend + 16 frontend). Incluyen: formato de la petición a Ollama, descarte de `thinking`, limpieza de razonamiento filtrado en `content`, errores de conexión, timeout, HTTP 401/403/404/429/5xx, JSON inválido, respuesta vacía, reintento sin `think`, validación, rol `system` bloqueado, recorte de historial, rate limit, CORS, fórmulas de puntaje y parser seguro de mensajes.
- `npm run build`: compila sin errores ni advertencias.
- Navegador (Chromium, 1366/1440 px y móvil 390 px) contra un **Ollama simulado**:
  - **24/24** del flujo completo: 3 retos con puntajes exactos (50, 100 y 33 al marcar todo), resumen, cuestionario y resultados (4/5, refuerzo, exceso de confianza, dependencia "medio"), chat con respuesta, botón «Sigo atascado», persistencia al cambiar de pestaña, sin `thinking` ni HTML del modelo interpretado, sin errores de JavaScript.
  - **11/11** de menú móvil y teclado: abre, ocupa la pantalla, navega, se cierra al navegar y con Escape; el foco recorre el header; «Explorar las herramientas» desplaza a la sección.
  - **6/6** de estados de error: Ollama apagado (mensaje claro, texto conservado, Reintentar, sin respuesta inventada, laboratorio operativo) y sesión cloud ausente (indica `ollama signin`).
  - Sin desbordamiento horizontal en móvil en las cuatro pantallas.
- **Pendiente en tu equipo:** la respuesta real de `gpt-oss:20b-cloud` desde la interfaz. El entorno de desarrollo no tiene acceso a tu Ollama local. Verifícala con `npm run check:ollama` y enviando una pregunta en el tutor.

## 12. Limitaciones conocidas

- El tutor depende de internet y de la cuota del plan gratuito de Ollama Cloud.
- El prompt y el nivel de pista orientan al modelo, pero **no garantizan** al 100 % que nunca entregue una solución.
- Contenido fijo: 3 retos y 5 preguntas.
- Sin streaming: la respuesta aparece completa (puede tardar algunos segundos).
- El control de frecuencia es en memoria y por equipo; se reinicia al reiniciar el servidor.
- Las fuentes tipográficas vienen incluidas en el proyecto (no dependen de Google Fonts).

## 13. Funcionalidades pendientes (fases siguientes)

- Panel de Acuerdos Éticos por asignatura.
- Comparador "Modo copia vs. Modo socrático".
- Dashboard de progreso, plantillas para docentes e insignias.
- Banco de retos y preguntas editable por docentes; streaming de respuestas.

## 14. Guion de demostración (3 minutos)

1. **Inicio (20 s):** deja que el titular «La IA responde. Tú aprendes a pensar.» y el gráfico se dibujen; señala el atajo «Copiar» tachado. Menciona el caso de 4.5 en el taller y 2.0 en el parcial.
2. **Atrapa la alucinación (60 s):** abre el Reto 3 ("La fuente que no existe") y pide al público que encuentre los errores antes de revisar.
3. **Tutor (60 s):** fija la actividad "Taller 3", usa la sugerencia "Hazme el taller…" y muestra que responde con preguntas. Pulsa «Sigo atascado» hasta el nivel 4.
4. **Autodiagnóstico (30 s):** responde rápido, marca "Seguro" en una que falles y muestra la alerta de exceso de confianza.
5. **Cierre (10 s):** "No somos Turnitin. No castigamos el uso de la IA: enseñamos a usarla bien."

**Antes de presentar:** abre Ollama, ejecuta `npm run check:ollama` (también "calienta" el modelo), usa `npm run build` + `npm start` y no gastes la cuota con muchas pruebas.

## 15. Rediseño visual (dirección de arte)

**Concepto:** «Pensar mejor en la era de la inteligencia artificial». Editorial oscuro, tecnológico sobrio y académico. Inspirado en los principios de composición de estudios creativos (tipografía protagonista, asimetría, ritmo entre secciones densas y espacios de descanso), sin copiar ninguna identidad.

**Sistema de diseño** (`client/src/styles/global.css`): tokens de color, tipografía y escala (`--fs-*` con `clamp()`), espaciado de 4 px (`--s-1` a `--s-10`), radios, capas, anchos, duraciones y curvas de movimiento. Cada herramienta tiene un color secundario propio dentro del sistema: ámbar para el laboratorio (verificar), turquesa para el tutor (preguntar) y violeta para el autodiagnóstico (medir).

**Tipografía** (incluida en el proyecto, sin depender de Google Fonts): Syne para titulares, Instrument Serif en cursiva para los acentos, Inter para lectura y JetBrains Mono para etiquetas y datos.

**Qué cambió por pantalla:**
- **Header:** compacto, con indicador de sección activa y **menú móvil** a pantalla completa (Escape lo cierra, bloquea el scroll del fondo).
- **Inicio:** hero asimétrico «La IA responde. Tú aprendes a *pensar.*» con un **gráfico propio en SVG** (el recorrido respuesta → pregunta → hipótesis → fuente → verificación → comprensión, y el atajo "copiar" tachado). Debajo, un manifiesto con tres principios, las tres herramientas en bloques alternos con gráfico propio y **estado real** (el del tutor consulta Ollama), y un cierre con «¿Lo sabes… o lo copiaste?».
- **Laboratorio:** lista editorial de retos, la respuesta de IA dividida en **afirmaciones numeradas** fáciles de marcar, panel de revisión fijo, indicador de progreso entre retos y estados con texto («Error encontrado», «Error que se te pasó», «Era correcta»), no solo con color.
- **Tutor:** conversación tipográfica en lugar de burbujas, escalera visible de los 4 niveles de pista y un compositor que crece con el texto y tiene el botón de envío integrado.
- **Autodiagnóstico:** panel de progreso fijo (barra inferior en móvil), opciones con letras A–D y resultados con porcentaje grande, barras por tema, «Lo que dominas», «Qué repasar», hábitos y revisión pregunta por pregunta.
- **Footer** con identidad, navegación e información del proyecto.

**Movimiento:** entrada del titular palabra por palabra, dibujo único de las líneas del gráfico, revelado al hacer scroll y animaciones breves al mostrar resultados. Sin animaciones permanentes decorativas (se retiraron la franja en movimiento, el cursor personalizado y el grano). Todo respeta `prefers-reduced-motion`.

**Sin cambios funcionales:** la lógica de retos, puntajes, cuestionario, prompts y la integración con `gpt-oss:20b-cloud` no se modificó. Los datos del laboratorio y del quiz son los mismos.

## Solución de problemas

| Síntoma | Solución |
| --- | --- |
| "Ollama no responde" | Abre la aplicación de Ollama (icono en la barra de tareas). |
| "Ejecuta ollama signin" | `ollama signin` en una terminal y vuelve a intentar. |
| "Modelo no registrado" | `ollama list` debe mostrar `gpt-oss:20b-cloud`; si no, `ollama pull gpt-oss:20b-cloud`. |
| "Límite de uso del modelo" | Cuota del plan gratuito; espera y reintenta. |
| Puerto 3001 o 5173 ocupado | Cambia `PORT` en `.env` o cierra el otro proceso. |
| `npm` no se reconoce | Reinstala Node.js y abre una terminal nueva. |
