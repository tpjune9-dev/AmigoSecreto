# 🎁 Amigo Secreto — Sistema Web de Sorteos

Aplicación web full stack, responsive y mobile-first para organizar sorteos de intercambio de regalos (**Amigo Secreto**) entre amigos, familiares o compañeros de trabajo.

---

## 🚀 Tecnologías Utilizadas

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + Lucide React + Canvas Confetti.
- **Enrutamiento:** `HashRouter` (100% compatible con **GitHub Pages** y hosting estático).
- **Backend:** Node.js + Express + TypeScript + Zod + Helmet + CORS + Express Rate Limit + JWT + Bcrypt.
- **Base de Datos:** MySQL conectada mediante **Prisma ORM** (sin utilizar Firebase, Supabase ni `localStorage` como base de datos).

---

## 📁 Estructura del Proyecto

```text
AmigoSecreto/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml        # Workflow automático para publicar el frontend en GitHub Pages
├── backend/
│   ├── prisma/
│   │   ├── migrations/             # Migraciones SQL para MySQL
│   │   └── schema.prisma           # Esquema Prisma (administradores, sorteos, participantes, asignaciones)
│   ├── src/
│   │   ├── config/prisma.ts        # Cliente Prisma conectado a MySQL
│   │   ├── middleware/             # Autenticación JWT (Admin / Participante) y Rate Limiting
│   │   ├── routes/                 # Rutas REST (authRoutes, sorteoRoutes, publicRoutes)
│   │   ├── services/               # Integración WhatsApp (wa.me manual + WhatsApp Business Cloud API)
│   │   ├── utils/                  # Algoritmo de permutación sin puntos fijos, generador de códigos y validación telefónica
│   │   ├── app.ts                  # Configuración Express y seguridad
│   │   └── server.ts               # Punto de entrada del servidor
│   ├── tests/
│   │   └── amigoSecreto.test.ts    # Pruebas automatizadas (Vitest + Supertest + MySQL)
│   ├── .env.example                # Plantilla de variables de entorno del backend
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/             # Navbar, ilustraciones navideñas SVG, modales de confirmación, insignias de estado
│   │   ├── context/                # Contexto de autenticación y notificaciones Toast
│   │   ├── pages/                  # HomePage, CreateDrawPage, JoinDrawPage, AdminDashboardPage, ResultPage
│   │   ├── services/api.ts         # Cliente API REST y generadores de enlaces wa.me
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example                # Plantilla de variables de entorno del frontend
│   ├── vite.config.ts              # Configuración de Vite compatible con GitHub Pages
│   └── package.json
├── .env.example
└── README.md
```

---

## 🛠️ 1. Requisitos Previos

- **Node.js** v18 o superior (probado en v20 y v24).
- **MySQL** 8.0+ o **MariaDB** 10.4+ en ejecución.

---

## 🗄️ 2. Pasos para Crear la Base de Datos MySQL

1. Inicia tu servidor MySQL (por ejemplo, desde MySQL Workbench, consola `mysql` o XAMPP).
2. Ejecuta la siguiente sentencia SQL para crear la base de datos:

```sql
CREATE DATABASE IF NOT EXISTS amigo_secreto
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

3. Configura el archivo `backend/.env` tomando como plantilla `backend/.env.example`:

```env
DATABASE_URL="mysql://root:tu_password@localhost:3306/amigo_secreto"
PORT=4000
NODE_ENV=development
JWT_SECRET="reemplaza_por_una_clave_secreta_larga_y_aleatoria"
FRONTEND_URL="http://localhost:5173"

# Opcional: API Oficial de WhatsApp Business Cloud (Meta)
WHATSAPP_API_ENABLED="false"
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_ACCESS_TOKEN=""
WHATSAPP_API_VERSION="v20.0"
```

---

## 📦 3. Instalación de Dependencias y Migraciones

### Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
```

### Frontend

```bash
cd frontend
npm install
```

Opcionalmente, crea el archivo `frontend/.env` a partir de `frontend/.env.example`:

```env
VITE_API_URL="http://localhost:4000/api"
VITE_BASE_PATH="./"
```

---

## 💻 4. Pasos para Probar Localmente

1. **Iniciar el servidor Backend (puerto 4000):**

```bash
cd backend
npm run dev
```

2. **Iniciar el servidor Frontend (puerto 5173):**

```bash
cd frontend
npm run dev
```

3. Abre en tu navegador `http://localhost:5173`:
   - Haz clic en **"Crear un sorteo"**, regístrate como administrador y crea un sorteo (se generará un código único como `AMIGO482`).
   - Copia el enlace de invitación o ábrelo en otra pestaña (`#/unirse?codigo=AMIGO482`) y registra al menos 2 participantes con sus números de WhatsApp (`+51...`) y su PIN personal de 6 dígitos.
   - Desde el **Panel del Administrador**, presiona **"Cerrar inscripciones"** y luego **"Realizar sorteo"**.
   - Ingresa a **"Mi Amigo Secreto"** (`#/resultado`), coloca el código del sorteo, tu número de WhatsApp y tu PIN de 6 dígitos, y presiona **"🎁 Descubrir mi amigo secreto"** para ver la animación con confeti.

---

## 🧪 5. Ejecutar Pruebas Automatizadas

El proyecto incluye una suite de pruebas automatizadas en `backend/tests/amigoSecreto.test.ts` que verifica:

- Que nadie se asigne a sí mismo (con 2, 3, 5, 10, 20 y 35 participantes).
- Que ningún destinatario se repita y que todos reciban exactamente una asignación.
- Que el sorteo no se pueda ejecutar dos veces (transacción serializable con bloqueo `FOR UPDATE`).
- Que los usuarios no puedan consultar resultados ajenos ni con PIN incorrecto ni manipulando parámetros en la URL.
- Que los códigos inválidos o inexistentes sean rechazados.
- Que los registros con teléfonos duplicados dentro del mismo sorteo sean rechazados.

Para ejecutarlas:

```bash
cd backend
npm test
```

---

## 🌐 6. Cómo Alojar el Backend y MySQL en un Servidor Externo (con HTTPS)

Dado que **GitHub Pages** solo aloja archivos estáticos (HTML, CSS y JS), el backend de Node.js/Express y la base de datos MySQL deben ejecutarse en un servidor externo con **HTTPS**:

### Opción recomendada (Railway / Render / VPS con Nginx + Certbot)

1. **Crear instancia de MySQL:**
   - Aprovisiona una base de datos MySQL en Railway, DigitalOcean Managed MySQL, AWS RDS, Aiven o tu propio VPS.
   - Copia la cadena de conexión `mysql://usuario:password@host:puerto/amigo_secreto`.

2. **Desplegar el directorio `backend`:**
   - Configura el directorio raíz del servicio como `backend`.
   - Comando de compilación (*Build Command*):
     ```bash
     npm ci && npx prisma generate && npx prisma migrate deploy && npm run build
     ```
   - Comando de inicio (*Start Command*):
     ```bash
     npm start
     ```
   - Configura las variables de entorno en el panel del servidor:
     - `NODE_ENV=production`
     - `DATABASE_URL=mysql://...`
     - `JWT_SECRET=<cadena_aleatoria_segura_de_64_caracteres>`
     - `FRONTEND_URL=https://tu-usuario.github.io`
   - Verifica que tu proveedor entregue el dominio con **HTTPS** (por ejemplo: `https://amigo-secreto-api.up.railway.app`).

---

## 🐙 7. Cómo Publicar el Frontend en GitHub Pages

El repositorio ya incluye el workflow `.github/workflows/deploy-pages.yml` configurado para publicar automáticamente en GitHub Pages:

1. Sube este proyecto a un repositorio en GitHub (rama `main`).
2. En tu repositorio de GitHub, ve a **Settings → Pages** y en **Build and deployment → Source** selecciona **GitHub Actions**.
3. Ve a **Settings → Secrets and variables → Actions → Variables** y crea una variable de repositorio llamada:
   - Nombre: `VITE_API_URL`
   - Valor: `https://tu-backend-externo.com/api` (la URL HTTPS real de tu backend desplegado).
4. Haz un `git push` a la rama `main` o ejecuta manualmente el workflow **"Publicar Frontend en GitHub Pages"** desde la pestaña **Actions**.
5. Una vez finalizado el workflow, tu aplicación estará disponible en `https://tu-usuario.github.io/nombre-del-repositorio/`.

---

## 💬 8. Integración con WhatsApp

1. **Modalidad Inicial (Activa por defecto con enlaces `wa.me`):**
   - Tanto el administrador como los participantes pueden compartir la invitación y los enlaces de consulta mediante `https://wa.me/...` con mensajes precargados que el usuario confirma manualmente en su aplicación de WhatsApp.
2. **Modalidad Opcional (API Oficial de WhatsApp Business Cloud de Meta):**
   - Si cuentas con una cuenta verificada en Meta for Developers (WhatsApp Business Cloud API), activa en `backend/.env`:
     ```env
     WHATSAPP_API_ENABLED="true"
     WHATSAPP_PHONE_NUMBER_ID="tu_phone_number_id"
     WHATSAPP_ACCESS_TOKEN="tu_token_permanente_de_meta"
     WHATSAPP_API_VERSION="v20.0"
     ```
   - El envío se realiza exclusivamente desde el backend (`POST /api/sorteos/:id/notificar-whatsapp`) únicamente a los participantes que otorgaron su consentimiento en el registro.

