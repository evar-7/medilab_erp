// Mock server
// Simula el comportamiento del servidor para las peticiones DELETE de los items de la tabla,
// permitiendo que la animacion de eliminacion se vea correctamente sin recargar la pagina.
// Los cambios se guardan en sessionStorage para mantener el estado durante la sesion.

(function () {
    // 1. Restaurar estado de filas eliminadas desde sessionStorage al cargar la pagina
    function applyDeletedRows() {
        try {
            const deletedIds = JSON.parse(sessionStorage.getItem('labin_deleted_items') || '[]');
            if (deletedIds.length > 0) {
                deletedIds.forEach(id => {
                    const row = document.querySelector('tr[data-item-id="' + id + '"]') ||
                                document.querySelector('a[href*="/order_items/' + id + '"]')?.closest('tr');
                    if (row) row.remove();
                });
                const lineasBadge = document.querySelector('.card-header .badge-purple');
                if (lineasBadge) {
                    const restantes = document.querySelectorAll('tbody tr.order-item-row').length;
                    lineasBadge.textContent = restantes + ' LINEAS';
                }
            }
        } catch (_) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyDeletedRows);
    } else {
        applyDeletedRows();
    }

    // 2. Interceptar fetch para simular respuesta exitosa del servidor
    const originalFetch = window.fetch;
    window.fetch = async function (url, options) {
        const urlStr = String(url);
        if (urlStr.includes('/order_items/')) {
            const match = urlStr.match(/\/order_items\/(\d+)/);
            const itemId = match ? match[1] : null;

            console.log('%c[MOCK SERVER] Peticion DELETE simulada para item #' + itemId, 'color: green; font-weight: bold;');
            // Simula latencia de red de 150ms para ver la animacion por lotes
            await new Promise(r => setTimeout(r, 150));

            if (itemId) {
                const currentDeleted = JSON.parse(sessionStorage.getItem('labin_deleted_items') || '[]');
                if (!currentDeleted.includes(itemId)) {
                    currentDeleted.push(itemId);
                    sessionStorage.setItem('labin_deleted_items', JSON.stringify(currentDeleted));
                }
            }

            return new Response(JSON.stringify({status: 'ok', deleted: itemId}), {
                status: 200,
                headers: {'Content-Type': 'application/json'}
            });
        }
        return originalFetch.apply(this, arguments);
    };

    // 3. Manejador de clics para la "X" individual de cada fila
    document.addEventListener('click', async function (e) {
        const btn = e.target.closest('a.btn-danger.btn-sm[data-method="delete"]');
        if (!btn) return;

        e.preventDefault();

        const url = btn.getAttribute('href');
        if (!url || url === '#') return;

        const confirmMsg = btn.getAttribute('data-confirm') || 'Seguro que desea eliminar el record?';
        if (!confirm(confirmMsg)) return;

        btn.style.pointerEvents = 'none';
        btn.innerHTML = '<span class="fa fa-spinner fa-spin"></span>';

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            const data = new FormData();
            data.append('_method', 'delete');
            if (csrfToken) data.append('authenticity_token', csrfToken);

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRF-Token': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: data
            });

            if (res.ok) {
                const tr = btn.closest('tr');
                if (tr) {
                    tr.style.transition = 'opacity 0.25s, transform 0.25s';
                    tr.style.opacity = '0';
                    tr.style.transform = 'translateX(20px)';
                    setTimeout(() => {
                        tr.remove();
                        const lineasBadge = document.querySelector('.card-header .badge-purple');
                        if (lineasBadge) {
                            const restantes = document.querySelectorAll('tbody tr.order-item-row').length;
                            lineasBadge.textContent = restantes + ' LINEAS';
                        }
                    }, 250);
                }
            } else {
                alert('Error en servidor al eliminar la fila.');
                btn.style.pointerEvents = 'auto';
                btn.innerHTML = '<span class="fa fa-times"></span>';
            }
        } catch (err) {
            console.error('Error al borrar fila:', err);
            alert('Error de red al eliminar la fila.');
            btn.style.pointerEvents = 'auto';
            btn.innerHTML = '<span class="fa fa-times"></span>';
        }
    });

    // Funcion global para reiniciar datos en la prueba
    window.restablecerDatosPrueba = function () {
        sessionStorage.removeItem('labin_deleted_items');
        window.location.reload();
    };
})();
