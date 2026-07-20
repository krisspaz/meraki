# Plataforma de Registro e Invitaciones - Expo 360 Meraki

Esta plataforma web moderna, segura y de alto rendimiento gestiona las invitaciones digitales y el registro de participantes para la **Expo 360 Meraki**, una actividad organizada por estudiantes de la Carrera de Diseño Gráfico.

La aplicación bloquea automáticamente las inscripciones cuando se alcanza el límite total de la actividad o la capacidad máxima de un taller en particular. Cuenta con una lista de espera opcional y un panel de administración para controlar participantes, talleres e invitaciones.

---

## Arquitectura del Proyecto

El sistema está estructurado como un monorepositorio con contenedores separados de Docker, garantizando un despliegue limpio y consistente:

*   **Frontend**: React, Vite, TypeScript, React Router, Tailwind CSS, TanStack Query y React Hook Form + Zod.
*   **Backend**: Python, FastAPI, SQLAlchemy (asíncrono), Pydantic (V2) y base de datos relacional.
*   **Base de Datos**: PostgreSQL 15 (asíncrono mediante `asyncpg`).
*   **Proxy Inverso**: Nginx para enrutar el tráfico de la API y servir estáticos de forma eficiente en producción.
*   **Migraciones**: Alembic para versionar la base de datos de manera automatizada.

---

## Requisitos Previos

Asegúrate de tener instalados los siguientes componentes en tu sistema antes de iniciar:

*   [Docker](https://www.docker.com/products/docker-desktop/) (Versión 20.10 o superior)
*   [Docker Compose](https://docs.docker.com/compose/install/) (V2)

---

## Instalación y Configuración

1.  **Variables de Entorno**:
    Copia el archivo de plantilla `.env.example` para crear el archivo de variables locales `.env`:
    ```bash
    cp .env.example .env
    ```
    *(Nota: El archivo `.env` ya viene precargado con credenciales seguras por defecto para desarrollo).*

2.  **Iniciar la Aplicación**:
    Ejecuta el siguiente comando en la raíz del proyecto para construir y levantar todos los servicios en segundo plano:
    ```bash
    docker compose up --build
    ```
    Este comando compilará el frontend, levantará el servidor asíncrono FastAPI del backend y el motor de base de datos PostgreSQL.

3.  **Migraciones y Semilla**:
    El contenedor de `backend` ejecuta automáticamente al iniciar:
    *   `alembic upgrade head`: Aplica el esquema de la base de datos.
    *   `python app/scripts/seed.py`: Carga los datos de demostración del evento y el administrador.

---

## Credenciales Administrativas por Defecto

Una vez levantado el sistema, el script de semilla creará un usuario administrador inicial con las siguientes credenciales:

*   **Usuario**: `admin`
*   **Contraseña**: `admin_meraki_2026!`
*   **Correo**: `expo360.meraki@gmail.com`

---

## Puertos y Servicios Locales (Desarrollo)

*   **Frontend**: [http://localhost:5173](http://localhost:5173) (Consola de registro público de usuarios y portal administrativo).
*   **Backend API**: [http://localhost:8000](http://localhost:8000) (Servidor de desarrollo FastAPI).
*   **Documentación Interactiva Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs) (Para probar endpoints y revisar esquemas OpenAPI).
*   **Base de Datos**: `localhost:5432` (PostgreSQL).

---

## Enlaces de Invitación de Prueba

El script de semilla (Seed) crea por defecto los siguientes tokens que puedes probar en el navegador:

1.  **Invitación Individual Válida**:
    [http://localhost:5173/invitacion/token_individual_1](http://localhost:5173/invitacion/token_individual_1)
2.  **Invitación Grupal Válida (Límite 10 usos)**:
    [http://localhost:5173/invitacion/token_grupal_1](http://localhost:5173/invitacion/token_grupal_1)
3.  **Invitación Vencida**:
    [http://localhost:5173/invitacion/token_expired](http://localhost:5173/invitacion/token_expired) (Lanza error 410)
4.  **Invitación Deshabilitada**:
    [http://localhost:5173/invitacion/token_disabled](http://localhost:5173/invitacion/token_disabled) (Lanza error 403)

---

## Prevención de Condiciones de Carrera (Concurrencia)

Para evitar la sobreventa de cupos (por ejemplo, si dos personas intentan registrarse al mismo tiempo en el último segundo cuando queda un solo espacio libre), el sistema implementa una **estrategia de bloqueo pesimista en PostgreSQL**:

1.  **Inicio de Transacción**: Toda la validación y el registro ocurren en un bloque atómico.
2.  **Bloqueo de la Invitación (`FOR UPDATE`)**:
    ```sql
    SELECT * FROM invitations WHERE token = :token FOR UPDATE;
    ```
    Previene que el mismo token individual se gaste dos veces simultáneamente.
3.  **Bloqueo del Taller (`FOR UPDATE`)**:
    ```sql
    SELECT * FROM workshops WHERE id = :workshop_id FOR UPDATE;
    ```
    Congela y serializa el conteo de la capacidad del taller.
4.  **Bloqueo del Límite General del Evento (`FOR UPDATE`)**:
    ```sql
    SELECT * FROM events WHERE status = 'active' FOR UPDATE;
    ```
    Sincroniza y congela el límite de participantes generales del evento.
5.  **Verificación**: El backend comprueba la disponibilidad actual. Si hay cupo, crea la inscripción y actualiza los contadores.
6.  **Confirmación (Commit)**: Se libera el bloqueo. Cualquier transacción concurrente esperó y leerá el contador actualizado, arrojando un error de cupo lleno (`409 Conflict`) de manera segura.

---

## Ejecución de Pruebas Unitarias y Concurrencia

Para ejecutar las pruebas automatizadas (incluida la prueba de concurrencia y estrés de 5 peticiones simultáneas sobre 1 cupo), utiliza el siguiente comando sobre el contenedor activo:

```bash
docker compose exec backend pytest app/tests/
```

Todas las pruebas deben aprobarse de forma exitosa, demostrando que:
*   Exactamente 1 persona obtiene el cupo y las otras 4 son rechazadas con error `409` controlado.
*   No se permiten duplicados de correo en registros activos.
*   Las invitaciones vencidas o deshabilitadas son rechazadas.
