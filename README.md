# MediLab ERP - Entorno de Demostración y Simulación de Automatización

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi&logoColor=white)
![Uvicorn](https://img.shields.io/badge/Uvicorn-ASGI-green)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=black)
![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-red?logo=googlechrome&logoColor=white)

Entorno de demostración interactivo y servidor de pruebas para la extensión de navegador corporativa **Lab Suite** (Borrado por Lotes Adaptativo y Modo Oscuro). 

Este proyecto recrea fielmente la interfaz del ERP médico **MediLab** junto a un backend ligero en **FastAPI** para simular la persistencia y latencia de base de datos sin requerir acceso a servidores de producción.

---

## - Problema y Solución

* **El Problema:** En el ERP original, cancelar o eliminar líneas de exámenes de laboratorio requiere interactuar manualmente fila por fila, aceptando confirmaciones modales individuales. Esto genera cuellos de botella operativos y riesgo de bloqueo por límite de peticiones (*Rate Limiting* / HTTP 429) si se automatiza agresivamente.
* **La Solución:** La extensión inyecta casillas de selección masiva en la tabla original y ejecuta un pipeline de borrado por lotes adaptativo:
  * **Concurrencia controlada:** Procesa las peticiones en bloques de 2 en 2.
  * **Delays adaptativos:** Ajusta dinámicamente el tiempo de espera entre lotes según el tiempo de respuesta del servidor (prevención activa contra errores 429).
  * **Persistencia reactiva:** Sincroniza la vista con el servidor mediante recarga automática del estado de la orden.

---

## - Características de esta Demo

1. **Réplica Visual del ERP:** Maquetación exacta de una orden de servicio con 15 líneas de pruebas clínicas (código, descripción, precios, IVA y acciones).
2. **Backend Mock Reactivo (`FastAPI`):**
   * Endpoint `POST /orders/{order_id}/order_items/{item_id}` que simula latencia de red (120 ms) y respuesta `200 OK`.
   * **Renderizado Dinámico:** Simula la base de datos en memoria; al ejecutarse `window.location.reload()`, las filas eliminadas permanecen borradas y el contador de líneas se actualiza automáticamente.
   * **Cabeceras Anti-Caché:** Middleware integrado para ver cambios en CSS/JS de forma inmediata en desarrollo.
3. **Botón de Restablecimiento Inmediato:** Permite pulsar *"Reiniciar datos de prueba"* para limpiar la memoria y volver a disponer de las 15 filas originales al instante.

---

## 📁 Estructura del Repositorio

```text
├── medilab_erp/         # Frontend estático de la orden del ERP
│   ├── fonts/               # Tipografías corporativas
│   ├── images/              # Logotipos e íconos SVG
│   ├── scripts/             # Contiene el script mock_server.js (borrado de filas individual y botón "Reiniciar datos de prueba")
│   ├── index.html           # Plantilla interactiva de la orden
│   ├── styles.css           # Estilos de la demo
│   └── stylesheet.css       # Estilos base del ERP
├── server.py                # Servidor FastAPI (Mock API + Servidor Estático)
├── requirements.txt         # Dependencias Python
└── README.md                # Documentación del proyecto
```

---

## 📡 Endpoints de la API Mock

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/` | Entrega el HTML de la demo con las filas activas en memoria. |
| `POST` | `/orders/{order_id}/order_items/{item_id}` | Registra la eliminación de un ítem y devuelve `200 OK`. |
| `POST` | `/api/reset` | Limpia la lista de eliminados y restaura las 15 filas. |
| `GET` | `/api/deleted-items` | Retorna los IDs de las filas eliminadas en la sesión actual. |

---

## 🛠️ Instalación y Ejecución Local

### 1. Clonar el Repositorio
```bash
git clone https://github.com/TU-USUARIO/templates.git
cd templates
```

### 2. Crear y Activar Entorno Virtual
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar Dependencias
```bash
pip install -r requirements.txt
```

### 4. Iniciar el Servidor
```bash
python server.py
```

El servidor quedará disponible en: **`http://localhost:8000`**

---

## 📄 Licencia

Este proyecto fue desarrollado con fines demostrativos y de portafolio para evidenciar técnicas de automatización frontend, extensiones de navegador y simulación de microservicios con FastAPI.
