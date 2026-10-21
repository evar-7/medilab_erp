import asyncio
import os
import re
from pathlib import Path
from typing import Set

import uvicorn
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent
PAGINA_PRINCIPAL_DIR = BASE_DIR / "medilab_erp"

app = FastAPI(
    title="MediLab Demo ERP - Mock Backend",
    description="Servidor local para simular la API del ERP.",
    version="1.0.0"
)

# Deshabilitar caché del navegador para desarrollo
@app.middleware("http")
async def disable_cache_middleware(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Habilitar CORS para permitir llamadas tanto desde localhost:8000 como desde localhost:63342
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:63342",
        "http://127.0.0.1:63342",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Estado en memoria de los ítems eliminados en la sesión
deleted_items: Set[str] = set()


def render_dynamic_index() -> str:
    """
    Lee index.html y remueve las filas eliminadas en memoria,
    simulando cómo el ERP real renderizaría la tabla al recargar la página.
    """
    index_path = PAGINA_PRINCIPAL_DIR / "index.html"
    if not index_path.exists():
        return "<h1>index.html no encontrado</h1>"

    html = index_path.read_text(encoding="utf-8")

    if deleted_items:
        for item_id in deleted_items:
            # Remueve la fila <tr> con data-item-id correspondiente
            pattern = rf'<tr\s+class="order-item-row"\s+data-item-id="{re.escape(item_id)}">.*?</tr>\s*'
            html = re.sub(pattern, "", html, flags=re.DOTALL)

        # Actualiza el badge del contador de líneas
        total_original = 15
        restantes = max(0, total_original - len(deleted_items))
        html = re.sub(r"\d+\s+LÍNEAS", f"{restantes} LÍNEAS", html)

    return html


@app.get("/", response_class=HTMLResponse)
async def serve_root():
    return HTMLResponse(content=render_dynamic_index(), media_type="text/html")


@app.get("/index.html", response_class=HTMLResponse)
async def serve_index_html():
    return HTMLResponse(content=render_dynamic_index(), media_type="text/html")


@app.get("/medilab_erp/", response_class=HTMLResponse)
async def serve_medilab_erp_root():
    return HTMLResponse(content=render_dynamic_index(), media_type="text/html")


@app.get("/medilab_erp/index.html", response_class=HTMLResponse)
async def serve_medilab_erp_index():
    return HTMLResponse(content=render_dynamic_index(), media_type="text/html")


# Endpoint de eliminación (soporta tanto POST como DELETE)
@app.api_route("/orders/{order_id}/order_items/{item_id}", methods=["POST", "DELETE"])
async def delete_order_item(order_id: str, item_id: str, request: Request):
    """
    Simula la eliminación de una prueba/producto de una orden en la BD.
    Devuelve HTTP 200 OK imitando la respuesta del ERP original.
    """
    # Simular latencia de red (120ms)
    await asyncio.sleep(0.12)

    deleted_items.add(str(item_id))
    print(f"[BD SIMULADA] Eliminado item #{item_id} de orden #{order_id} (Restantes: {15 - len(deleted_items)})")

    return JSONResponse(
        content={
            "status": "ok",
            "message": f"Item {item_id} eliminado exitosamente de la orden {order_id}",
            "order_id": order_id,
            "deleted": item_id,
        },
        status_code=status.HTTP_200_OK,
    )


@app.get("/api/deleted-items")
async def get_deleted_items():
    """Consulta la lista de ítems eliminados en memoria."""
    return {"deleted_items": list(deleted_items), "total": len(deleted_items)}


@app.api_route("/api/reset", methods=["GET", "POST"])
async def reset_deleted_items():
    """Restablece el estado en memoria para repetir la prueba."""
    deleted_items.clear()
    print("[BD SIMULADA] Datos de prueba restablecidos (15 líneas activas).")
    return {"status": "ok", "message": "Datos restablecidos"}


# Montar archivos estáticos para estilos, imágenes y fuentes
if PAGINA_PRINCIPAL_DIR.exists():
    app.mount("/medilab_erp", StaticFiles(directory=str(PAGINA_PRINCIPAL_DIR), html=False), name="medilab_erp_static")
    app.mount("/", StaticFiles(directory=str(PAGINA_PRINCIPAL_DIR), html=False), name="static_root")

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print(" Servidor Demo MediLab iniciado correctamente")
    print(" Abre tu navegador en: http://localhost:8000")
    print("=" * 60 + "\n")
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
