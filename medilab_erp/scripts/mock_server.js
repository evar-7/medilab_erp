// Mock server
// Simula el comportamiento del servidor para las peticiones DELETE de los items de la tabla,
// permitiendo que la animación de eliminación se vea correctamente sin recargar la página.
// Los cambios se guardan en sessionStorage para mantener el estado durante la sesión.

(function () {
    // 1. Restaurar estado de filas eliminadas desde sessionStorage al cargar la página
    const deletedIds = JSON.parse(sessionStorage.getItem('labin_deleted_items') || '[]');
    if (deletedIds.length > 0) {
        document.addEventListener('DOMContentLoaded', () => {
            deletedIds.forEach(id => {
                const btn = document.querySelector('a[href*="/order_items/' + id + '"]');
                if (btn) {
                    const tr = btn.closest('tr');
                    if (tr) tr.remove();
                }
            });
            const lineasBadge = document.querySelector('.card-header .badge-purple');
            if (lineasBadge) {
                const restantes = document.querySelectorAll('tbody tr.order-item-row').length;
                lineasBadge.textContent = restantes + ' LÍNEAS';
            }
        });
    }

    // 2. Interceptar fetch para simular respuesta exitosa del servidor
    const originalFetch = window.fetch;
    window.fetch = async function (url, options) {
        const urlStr = String(url);
        if (urlStr.includes('/order_items/')) {
            const match = urlStr.match(/\/order_items\/(\d+)/);
            const itemId = match ? match[1] : null;

            console.log('%c[MOCK SERVER] Petición DELETE simulada para item #' + itemId, 'color: green; font-weight: bold;');
            // Simula latencia de red de 150ms para ver la animación por lotes
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

        const confirmMsg = btn.getAttribute('data-confirm') || '¿Está seguro que desea eliminar el record?';
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
                            lineasBadge.textContent = restantes + ' LÍNEAS';
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

    // Función global para reiniciar datos en la prueba
    window.restablecerDatosPrueba = async function () {
        sessionStorage.removeItem('labin_deleted_items');
        try { await fetch('/api/reset', { method: 'POST' }); } catch (_) {}
        window.location.reload();
    };
})();