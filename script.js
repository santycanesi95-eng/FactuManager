/* ========================================== */
/* VARIABLES GLOBALES */
/* ========================================== */

let productos = [];
let ventas = [];
let compras = [];
let movimientos = [];
let productoEditando = null;

/* ========================================== */
/* INICIALIZACIÓN */
/* ========================================== */

window.addEventListener('DOMContentLoaded', function() {
    cargarDatosDesdeLocalStorage();
    document.getElementById('fechaMovimiento').valueAsDate = new Date();
    document.getElementById('fechaVenta').valueAsDate = new Date();
    document.getElementById('fechaCompra').valueAsDate = new Date();
    document.getElementById('pdfFechaHasta').valueAsDate = new Date();
    actualizarTodasLasVistas();
    cargarProductosEnSelectores();
});

/* ========================================== */
/* PERSISTENCIA CON LOCALSTORAGE */
/* ========================================== */

function guardarEnLocalStorage() {
    const datos = {
        productos: productos,
        ventas: ventas,
        compras: compras,
        movimientos: movimientos,
        ultimaActualizacion: new Date().toISOString()
    };
    localStorage.setItem('factumanager_datos', JSON.stringify(datos));
    actualizarConfiguracion();
}

function cargarDatosDesdeLocalStorage() {
    const datosGuardados = localStorage.getItem('factumanager_datos');
    if (datosGuardados) {
        try {
            const datos = JSON.parse(datosGuardados);
            productos = datos.productos || [];
            ventas = datos.ventas || [];
            compras = datos.compras || [];
            movimientos = datos.movimientos || [];
            console.log('✅ Datos cargados correctamente');
        } catch (error) {
            console.error('❌ Error al cargar datos:', error);
            productos = [];
            ventas = [];
            compras = [];
            movimientos = [];
        }
    }
}

function limpiarTodosLosDatos() {
    if (confirm('⚠️ ¿Estás seguro de que quieres ELIMINAR TODOS LOS DATOS?\n\nEsta acción no se puede deshacer.\n\nSe recomienda hacer un backup antes.')) {
        if (confirm('🔴 ÚLTIMA CONFIRMACIÓN: ¿Realmente deseas borrar todo?')) {
            localStorage.removeItem('factumanager_datos');
            productos = [];
            ventas = [];
            compras = [];
            movimientos = [];
            actualizarTodasLasVistas();
            alert('✅ Todos los datos han sido eliminados.');
        }
    }
}

/* ========================================== */
/* EXPORTAR E IMPORTAR DATOS */
/* ========================================== */

function exportarDatos() {
    const datos = {
        productos: productos,
        ventas: ventas,
        compras: compras,
        movimientos: movimientos,
        fechaExportacion: new Date().toISOString(),
        version: '3.0'
    };
    
    const dataStr = JSON.stringify(datos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FactuManager_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert('✅ Backup exportado correctamente');
}

function importarDatos(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const datos = JSON.parse(e.target.result);
            
            if (confirm('⚠️ ¿Deseas REEMPLAZAR todos los datos actuales con el backup?\n\nLos datos actuales se perderán.')) {
                productos = datos.productos || [];
                ventas = datos.ventas || [];
                compras = datos.compras || [];
                movimientos = datos.movimientos || [];
                guardarEnLocalStorage();
                actualizarTodasLasVistas();
                cargarProductosEnSelectores();
                alert('✅ Datos importados correctamente');
            }
        } catch (error) {
            alert('❌ Error al importar el archivo. Verifica que sea un backup válido.');
            console.error(error);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

/* ========================================== */
/* GESTIÓN DE PRODUCTOS */
/* ========================================== */

function agregarProducto() {
    const nombre = document.getElementById('nombreProducto').value.trim();
    const stockInicial = parseInt(document.getElementById('stockInicial').value) || 0;
    const stockActual = parseInt(document.getElementById('stockActual').value) || 0;
    const precioCosto = parseFloat(document.getElementById('precioCosto').value) || 0;
    const precioVenta = parseFloat(document.getElementById('precioVenta').value) || 0;
    const stockMinimo = parseInt(document.getElementById('stockMinimo').value) || 5;

    if (!nombre) {
        mostrarAlerta('alertProducto', '⚠️ Por favor ingrese el nombre del producto', 'danger');
        return;
    }

    if (precioCosto <= 0 || precioVenta <= 0) {
        mostrarAlerta('alertProducto', '⚠️ Los precios deben ser mayores a 0', 'danger');
        return;
    }

    if (productoEditando) {
        const index = productos.findIndex(p => p.id === productoEditando);
        if (index !== -1) {
            productos[index] = {
                ...productos[index],
                nombre,
                stockInicial,
                stockActual,
                precioCosto,
                precioVenta,
                stockMinimo,
                porcentaje: ((precioVenta - precioCosto) / precioCosto * 100).toFixed(2)
            };
            mostrarAlerta('alertProducto', '✅ Producto actualizado correctamente', 'success');
        }
        productoEditando = null;
    } else {
        const producto = {
            id: Date.now(),
            nombre,
            stockInicial,
            stockActual,
            precioCosto,
            precioVenta,
            stockMinimo,
            porcentaje: ((precioVenta - precioCosto) / precioCosto * 100).toFixed(2)
        };
        productos.push(producto);
        mostrarAlerta('alertProducto', '✅ Producto agregado correctamente', 'success');
    }

    limpiarFormularioProducto();
    guardarEnLocalStorage();
    actualizarTodasLasVistas();
    cargarProductosEnSelectores();
}

function editarProducto(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    document.getElementById('nombreProducto').value = producto.nombre;
    document.getElementById('stockInicial').value = producto.stockInicial;
    document.getElementById('stockActual').value = producto.stockActual;
    document.getElementById('precioCosto').value = producto.precioCosto;
    document.getElementById('precioVenta').value = producto.precioVenta;
    document.getElementById('stockMinimo').value = producto.stockMinimo || 5;

    productoEditando = id;
    document.getElementById('tituloFormProducto').textContent = '✏️ Editar Producto';
    document.getElementById('btnGuardarProducto').textContent = '💾 Actualizar Producto';
    document.getElementById('btnCancelarProducto').style.display = 'inline-block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicionProducto() {
    productoEditando = null;
    limpiarFormularioProducto();
    document.getElementById('tituloFormProducto').textContent = '➕ Agregar Nuevo Producto';
    document.getElementById('btnGuardarProducto').textContent = '💾 Guardar Producto';
    document.getElementById('btnCancelarProducto').style.display = 'none';
}

function eliminarProducto(id) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        productos = productos.filter(p => p.id !== id);
        guardarEnLocalStorage();
        actualizarTodasLasVistas();
        cargarProductosEnSelectores();
        mostrarAlerta('alertProducto', '✅ Producto eliminado correctamente', 'success');
    }
}

function buscarProductos() {
    const busqueda = document.getElementById('buscarProducto').value.toLowerCase();
    const productosFiltrados = productos.filter(p => 
        p.nombre.toLowerCase().includes(busqueda)
    );
    actualizarTablaProductos(productosFiltrados);
}

function actualizarTablaProductos(listaProductos = productos) {
    const tbody = document.getElementById('tablaProductos');
    
    if (listaProductos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #6c757d;">No hay productos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = listaProductos.map(p => {
        const alerta = p.stockActual <= p.stockMinimo ? '<span class="badge badge-danger">⚠️ Stock Bajo</span>' : '';
        return `
            <tr>
                <td><strong>${p.nombre}</strong> ${alerta}</td>
                <td>${p.stockInicial}</td>
                <td>${p.stockActual}</td>
                <td>${p.stockMinimo || 5}</td>
                <td>$${p.precioCosto.toFixed(2)}</td>
                <td>$${p.precioVenta.toFixed(2)}</td>
                <td><strong>${p.porcentaje}%</strong></td>
                <td>
                    <div class="actions-cell">
                        <button class="btn btn-warning" onclick="editarProducto(${p.id})">✏️ Editar</button>
                        <button class="btn btn-danger" onclick="eliminarProducto(${p.id})">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function actualizarEstadisticasProductos() {
    const totalUnidades = productos.reduce((sum, p) => sum + p.stockActual, 0);
    const productosStockBajo = productos.filter(p => p.stockActual <= p.stockMinimo).length;

    document.getElementById('totalUnidades').textContent = totalUnidades;
    document.getElementById('cantidadProductos').textContent = productos.length;
    document.getElementById('alertasStock').textContent = productosStockBajo;
}

function limpiarFormularioProducto() {
    document.getElementById('nombreProducto').value = '';
    document.getElementById('stockInicial').value = '';
    document.getElementById('stockActual').value = '';
    document.getElementById('precioCosto').value = '';
    document.getElementById('precioVenta').value = '';
    document.getElementById('stockMinimo').value = '';
}

/* ========================================== */
/* GESTIÓN DE VENTAS */
/* ========================================== */

function cargarProductosEnSelectores() {
    const selectVenta = document.getElementById('productoVenta');
    const selectCompra = document.getElementById('productoCompra');
    
    const opciones = '<option value="">Seleccione un producto</option>' + 
        productos.map(p => `<option value="${p.id}">${p.nombre} (Stock: ${p.stockActual})</option>`).join('');
    
    selectVenta.innerHTML = opciones;
    selectCompra.innerHTML = opciones;
    
    selectVenta.addEventListener('change', function() {
        const producto = productos.find(p => p.id == this.value);
        if (producto) {
            document.getElementById('precioVenta').value = producto.precioVenta.toFixed(2);
            calcularTotalVenta();
        }
    });
    
    selectCompra.addEventListener('change', function() {
        const producto = productos.find(p => p.id == this.value);
        if (producto) {
            document.getElementById('precioCompra').value = producto.precioCosto.toFixed(2);
            calcularTotalCompra();
        }
    });
}

function calcularTotalVenta() {
    const cantidad = parseInt(document.getElementById('cantidadVenta').value) || 0;
    const precio = parseFloat(document.getElementById('precioVenta').value) || 0;
    document.getElementById('totalVenta').value = (cantidad * precio).toFixed(2);
}

function calcularTotalCompra() {
    const cantidad = parseInt(document.getElementById('cantidadCompra').value) || 0;
    const precio = parseFloat(document.getElementById('precioCompra').value) || 0;
    document.getElementById('totalCompra').value = (cantidad * precio).toFixed(2);
}

function registrarVenta() {
    const fecha = document.getElementById('fechaVenta').value;
    const productoId = parseInt(document.getElementById('productoVenta').value);
    const cantidad = parseInt(document.getElementById('cantidadVenta').value) || 0;
    const observacion = document.getElementById('observacionVenta').value.trim();

    if (!fecha || !productoId || cantidad <= 0) {
        mostrarAlerta('alertVenta', '⚠️ Por favor complete todos los campos obligatorios', 'danger');
        return;
    }

    const producto = productos.find(p => p.id === productoId);
    if (!producto) {
        mostrarAlerta('alertVenta', '❌ Producto no encontrado', 'danger');
        return;
    }

    if (producto.stockActual < cantidad) {
        mostrarAlerta('alertVenta', `❌ Stock insuficiente. Disponible: ${producto.stockActual}`, 'danger');
        return;
    }

    const precioUnitario = producto.precioVenta;
    const total = cantidad * precioUnitario;

    // Crear registro de venta
    const venta = {
        id: Date.now(),
        fecha,
        productoId,
        productoNombre: producto.nombre,
        cantidad,
        precioUnitario,
        total,
        observacion
    };

    ventas.push(venta);

    // Actualizar stock del producto
    producto.stockActual -= cantidad;

    // Crear movimiento de ingreso automático
    const movimiento = {
        id: Date.now() + 1,
        fecha,
        descripcion: `Venta: ${cantidad} ${producto.nombre}${observacion ? ' - ' + observacion : ''}`,
        tipo: 'ingreso_efectivo',
        monto: total,
        origen: 'venta',
        ventaId: venta.id
    };

    movimientos.push(movimiento);

    // Limpiar formulario
    document.getElementById('productoVenta').value = '';
    document.getElementById('cantidadVenta').value = '';
    document.getElementById('precioVenta').value = '';
    document.getElementById('totalVenta').value = '';
    document.getElementById('observacionVenta').value = '';

    guardarEnLocalStorage();
    actualizarTodasLasVistas();
    cargarProductosEnSelectores();
    mostrarAlerta('alertVenta', '✅ Venta registrada correctamente. Stock actualizado automáticamente.', 'success');
}

function anularVenta(id) {
    if (!confirm('¿Estás seguro de anular esta venta?\n\nSe devolverá el stock al producto.')) {
        return;
    }

    const venta = ventas.find(v => v.id === id);
    if (!venta) return;

    // Devolver stock al producto
    const producto = productos.find(p => p.id === venta.productoId);
    if (producto) {
        producto.stockActual += venta.cantidad;
    }

    // Eliminar movimiento asociado
    movimientos = movimientos.filter(m => m.ventaId !== id);

    // Eliminar venta
    ventas = ventas.filter(v => v.id !== id);

    guardarEnLocalStorage();
    actualizarTodasLasVistas();
    cargarProductosEnSelectores();
    mostrarAlerta('alertVenta', '✅ Venta anulada. Stock devuelto al producto.', 'success');
}

function actualizarTablaVentas() {
    const tbody = document.getElementById('tablaVentas');
    
    if (ventas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #6c757d;">No hay ventas registradas</td></tr>';
        return;
    }

    tbody.innerHTML = ventas.slice().reverse().map(v => `
        <tr>
            <td>${formatearFecha(v.fecha)}</td>
            <td><strong>${v.productoNombre}</strong></td>
            <td>${v.cantidad}</td>
            <td>$${v.precioUnitario.toFixed(2)}</td>
            <td><strong style="color: #28a745;">$${v.total.toFixed(2)}</strong></td>
            <td>${v.observacion || '-'}</td>
            <td>
                <button class="btn btn-danger" onclick="anularVenta(${v.id})">🔄 Anular</button>
            </td>
        </tr>
    `).join('');
}

/* ========================================== */
/* GESTIÓN DE COMPRAS */
/* ========================================== */

function registrarCompra() {
    const fecha = document.getElementById('fechaCompra').value;
    const productoId = parseInt(document.getElementById('productoCompra').value);
    const cantidad = parseInt(document.getElementById('cantidadCompra').value) || 0;
    const observacion = document.getElementById('observacionCompra').value.trim();

    if (!fecha || !productoId || cantidad <= 0) {
        mostrarAlerta('alertCompra', '⚠️ Por favor complete todos los campos obligatorios', 'danger');
        return;
    }

    const producto = productos.find(p => p.id === productoId);
    if (!producto) {
        mostrarAlerta('alertCompra', '❌ Producto no encontrado', 'danger');
        return;
    }

    const precioUnitario = producto.precioCosto;
    const total = cantidad * precioUnitario;

    // Crear registro de compra
    const compra = {
        id: Date.now(),
        fecha,
        productoId,
        productoNombre: producto.nombre,
        cantidad,
        precioUnitario,
        total,
        observacion
    };

    compras.push(compra);

    // Actualizar stock del producto
    producto.stockActual += cantidad;

    // Crear movimiento de gasto automático
    const movimiento = {
        id: Date.now() + 1,
        fecha,
        descripcion: `Compra: ${cantidad} ${producto.nombre}${observacion ? ' - ' + observacion : ''}`,
        tipo: 'gasto_efectivo',
        monto: total,
        origen: 'compra',
        compraId: compra.id
    };

    movimientos.push(movimiento);

    // Limpiar formulario
    document.getElementById('productoCompra').value = '';
    document.getElementById('cantidadCompra').value = '';
    document.getElementById('precioCompra').value = '';
    document.getElementById('totalCompra').value = '';
    document.getElementById('observacionCompra').value = '';

    guardarEnLocalStorage();
    actualizarTodasLasVistas();
    cargarProductosEnSelectores();
    mostrarAlerta('alertCompra', '✅ Compra registrada correctamente. Stock actualizado automáticamente.', 'success');
}

function anularCompra(id) {
    if (!confirm('¿Estás seguro de anular esta compra?\n\nSe restará el stock del producto.')) {
        return;
    }

    const compra = compras.find(c => c.id === id);
    if (!compra) return;

    // Restar stock del producto
    const producto = productos.find(p => p.id === compra.productoId);
    if (producto) {
        producto.stockActual -= compra.cantidad;
        if (producto.stockActual < 0) producto.stockActual = 0;
    }

    // Eliminar movimiento asociado
    movimientos = movimientos.filter(m => m.compraId !== id);

    // Eliminar compra
    compras = compras.filter(c => c.id !== id);

    guardarEnLocalStorage();
    actualizarTodasLasVistas();
    cargarProductosEnSelectores();
    mostrarAlerta('alertCompra', '✅ Compra anulada. Stock actualizado.', 'success');
}

function actualizarTablaCompras() {
    const tbody = document.getElementById('tablaCompras');
    
    if (compras.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #6c757d;">No hay compras registradas</td></tr>';
        return;
    }

    tbody.innerHTML = compras.slice().reverse().map(c => `
        <tr>
            <td>${formatearFecha(c.fecha)}</td>
            <td><strong>${c.productoNombre}</strong></td>
            <td>${c.cantidad}</td>
            <td>$${c.precioUnitario.toFixed(2)}</td>
            <td><strong style="color: #dc3545;">$${c.total.toFixed(2)}</strong></td>
            <td>${c.observacion || '-'}</td>
            <td>
                <button class="btn btn-danger" onclick="anularCompra(${c.id})">🔄 Anular</button>
            </td>
        </tr>
    `).join('');
}

/* ========================================== */
/* GESTIÓN DE MOVIMIENTOS */
/* ========================================== */

function agregarMovimiento() {
    const fecha = document.getElementById('fechaMovimiento').value;
    const descripcion = document.getElementById('descripcionMovimiento').value.trim();
    const tipo = document.getElementById('tipoMovimiento').value;
    const monto = parseFloat(document.getElementById('montoMovimiento').value) || 0;

    if (!fecha || !descripcion || monto <= 0) {
        mostrarAlerta('alertMovimiento', '⚠️ Por favor complete todos los campos correctamente', 'danger');
        return;
    }

    const movimiento = {
        id: Date.now(),
        fecha,
        descripcion,
        tipo,
        monto,
        origen: 'manual'
    };

    movimientos.push(movimiento);
    
    limpiarFormularioMovimiento();
    guardarEnLocalStorage();
    actualizarTodasLasVistas();
    mostrarAlerta('alertMovimiento', '✅ Movimiento registrado correctamente', 'success');
}

function eliminarMovimiento(id) {
    const movimiento = movimientos.find(m => m.id === id);
    
    if (movimiento && movimiento.origen !== 'manual') {
        alert('❌ No se puede eliminar este movimiento porque fue creado automáticamente.\n\nDebes anular la venta o compra asociada.');
        return;
    }
    
    if (confirm('¿Estás seguro de eliminar este movimiento?')) {
        movimientos = movimientos.filter(m => m.id !== id);
        guardarEnLocalStorage();
        actualizarTodasLasVistas();
        mostrarAlerta('alertMovimiento', '✅ Movimiento eliminado correctamente', 'success');
    }
}

function filtrarMovimientos() {
    const tipo = document.getElementById('filtroTipo').value;
    const fechaDesde = document.getElementById('filtroFechaDesde').value;
    const fechaHasta = document.getElementById('filtroFechaHasta').value;

    let movimientosFiltrados = [...movimientos];

    if (tipo !== 'todos') {
        movimientosFiltrados = movimientosFiltrados.filter(m => m.tipo === tipo);
    }

    if (fechaDesde) {
        movimientosFiltrados = movimientosFiltrados.filter(m => m.fecha >= fechaDesde);
    }

    if (fechaHasta) {
        movimientosFiltrados = movimientosFiltrados.filter(m => m.fecha <= fechaHasta);
    }

    actualizarTablaMovimientos(movimientosFiltrados);
}

function limpiarFiltros() {
    document.getElementById('filtroTipo').value = 'todos';
    document.getElementById('filtroFechaDesde').value = '';
    document.getElementById('filtroFechaHasta').value = '';
    actualizarTablaMovimientos();
}

function actualizarTablaMovimientos(listaMovimientos = movimientos) {
    const tbody = document.getElementById('tablaMovimientos');
    
    if (listaMovimientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6c757d;">No hay movimientos registrados</td></tr>';
        return;
    }

    const tiposIconos = {
        'ingreso_efectivo': '💵',
        'ingreso_transferencia': '💳',
        'gasto_efectivo': '💸',
        'gasto_transferencia': '🏦'
    };

    const tiposNombres = {
        'ingreso_efectivo': 'Ingreso Efectivo',
        'ingreso_transferencia': 'Ingreso Transferencia',
        'gasto_efectivo': 'Gasto Efectivo',
        'gasto_transferencia': 'Gasto Transferencia'
    };

    const tiposColores = {
        'ingreso_efectivo': '#28a745',
        'ingreso_transferencia': '#17a2b8',
        'gasto_efectivo': '#dc3545',
        'gasto_transferencia': '#6c757d'
    };

    tbody.innerHTML = listaMovimientos.slice().reverse().map(m => `
        <tr>
            <td>${formatearFecha(m.fecha)}</td>
            <td>${m.descripcion}</td>
            <td><span style="color: ${tiposColores[m.tipo]}; font-weight: bold;">${tiposIconos[m.tipo]} ${tiposNombres[m.tipo]}</span></td>
            <td style="color: ${tiposColores[m.tipo]}; font-weight: bold;">$${m.monto.toFixed(2)}</td>
            <td>
                <button class="btn btn-danger" onclick="eliminarMovimiento(${m.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function actualizarEstadisticasMovimientos() {
    const ingresosEfectivo = movimientos.filter(m => m.tipo === 'ingreso_efectivo').reduce((sum, m) => sum + m.monto, 0);
    const ingresosTransferencia = movimientos.filter(m => m.tipo === 'ingreso_transferencia').reduce((sum, m) => sum + m.monto, 0);
    const gastosEfectivo = movimientos.filter(m => m.tipo === 'gasto_efectivo').reduce((sum, m) => sum + m.monto, 0);
    const gastosTransferencia = movimientos.filter(m => m.tipo === 'gasto_transferencia').reduce((sum, m) => sum + m.monto, 0);
    
    const totalIngresos = ingresosEfectivo + ingresosTransferencia;
    const totalGastos = gastosEfectivo + gastosTransferencia;
    const balance = totalIngresos - totalGastos;

    document.getElementById('totalIngresosEfectivo').textContent = '$' + ingresosEfectivo.toFixed(2);
    document.getElementById('totalIngresosTransferencia').textContent = '$' + ingresosTransferencia.toFixed(2);
    document.getElementById('totalGastosEfectivo').textContent = '$' + gastosEfectivo.toFixed(2);
    document.getElementById('totalGastosTransferencia').textContent = '$' + gastosTransferencia.toFixed(2);
    document.getElementById('balanceGeneral').textContent = '$' + balance.toFixed(2);
}

function limpiarFormularioMovimiento() {
    document.getElementById('fechaMovimiento').valueAsDate = new Date();
    document.getElementById('descripcionMovimiento').value = '';
    document.getElementById('tipoMovimiento').value = 'ingreso_efectivo';
    document.getElementById('montoMovimiento').value = '';
}

/* ========================================== */
/* FUNCIONES GENERALES */
/* ========================================== */

function openTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    document.querySelector(`[onclick="openTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'configuracion') {
        actualizarConfiguracion();
    }
}

function mostrarAlerta(elementoId, mensaje, tipo) {
    const alertDiv = document.getElementById(elementoId);
    alertDiv.innerHTML = `<div class="alert alert-${tipo}">${mensaje}</div>`;
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 4000);
}

function formatearFecha(fecha) {
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
}

function actualizarTodasLasVistas() {
    actualizarTablaProductos();
    actualizarEstadisticasProductos();
    actualizarTablaVentas();
    actualizarTablaCompras();
    actualizarTablaMovimientos();
    actualizarEstadisticasMovimientos();
    actualizarResumenInformes();
}

function actualizarConfiguracion() {
    document.getElementById('configTotalProductos').textContent = productos.length;
    document.getElementById('configTotalVentas').textContent = ventas.length;
    document.getElementById('configTotalCompras').textContent = compras.length;
    document.getElementById('configTotalMovimientos').textContent = movimientos.length;
    
    const datosGuardados = localStorage.getItem('factumanager_datos');
    if (datosGuardados) {
        const datos = JSON.parse(datosGuardados);
        const fecha = new Date(datos.ultimaActualizacion);
        document.getElementById('configUltimaActualizacion').textContent = fecha.toLocaleString('es-AR');
    }
}

function actualizarResumenInformes() {
    document.getElementById('resumenProductos').textContent = productos.length;
    document.getElementById('resumenVentas').textContent = ventas.length;
    document.getElementById('resumenCompras').textContent = compras.length;
    
    const totalIngresos = movimientos.filter(m => m.tipo.includes('ingreso')).reduce((sum, m) => sum + m.monto, 0);
    const totalGastos = movimientos.filter(m => m.tipo.includes('gasto')).reduce((sum, m) => sum + m.monto, 0);
    const balance = totalIngresos - totalGastos;
    
    document.getElementById('resumenBalance').textContent = '$' + balance.toFixed(2);
}

/* ========================================== */
/* GENERACIÓN DE PDF */
/* ========================================== */

function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const fechaDesde = document.getElementById('pdfFechaDesde').value;
    const fechaHasta = document.getElementById('pdfFechaHasta').value;

    let productosFiltrados = [...productos];
    let ventasFiltradas = [...ventas];
    let comprasFiltradas = [...compras];
    let movimientosFiltrados = [...movimientos];

    if (fechaDesde && fechaHasta) {
        ventasFiltradas = ventas.filter(v => v.fecha >= fechaDesde && v.fecha <= fechaHasta);
        comprasFiltradas = compras.filter(c => c.fecha >= fechaDesde && c.fecha <= fechaHasta);
        movimientosFiltrados = movimientos.filter(m => m.fecha >= fechaDesde && m.fecha <= fechaHasta);
    }

    // TÍTULO
    doc.setFontSize(22);
    doc.setTextColor(102, 126, 234);
    doc.text('FactuManager Pro - Informe', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    let subtitulo = `Generado: ${new Date().toLocaleDateString('es-AR')}`;
    if (fechaDesde && fechaHasta) {
        subtitulo += ` | Período: ${formatearFecha(fechaDesde)} - ${formatearFecha(fechaHasta)}`;
    }
    doc.text(subtitulo, 105, 28, { align: 'center' });

    let yPos = 40;

    // SECCIÓN: PRODUCTOS
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('📦 Productos', 14, yPos);
    yPos += 10;

    if (productosFiltrados.length > 0) {
        const productosData = productosFiltrados.map(p => [
            p.nombre,
            p.stockInicial,
            p.stockActual,
            p.stockMinimo || 5,
            '$' + p.precioCosto.toFixed(2),
            '$' + p.precioVenta.toFixed(2),
            p.porcentaje + '%'
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Producto', 'Stock Ini.', 'Stock Act.', 'Stock Mín.', 'P. Costo', 'P. Venta', '%']],
            body: productosData,
            theme: 'grid',
            headStyles: { fillColor: [102, 126, 234] },
            styles: { fontSize: 8 }
        });

        yPos = doc.lastAutoTable.finalY + 10;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('No hay productos registrados', 14, yPos);
        yPos += 15;
    }

    // SECCIÓN: VENTAS
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('🛒 Ventas', 14, yPos);
    yPos += 10;

    if (ventasFiltradas.length > 0) {
        const ventasData = ventasFiltradas.map(v => [
            formatearFecha(v.fecha),
            v.productoNombre,
            v.cantidad,
           '$' + v.precioUnitario.toFixed(2),
           '$' + v.total.toFixed(2)
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Fecha', 'Producto', 'Cant.', 'P. Unit.', 'Total']],
            body: ventasData,
            theme: 'grid',
            headStyles: { fillColor: [40, 167, 69] },
            styles: { fontSize: 8 }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        const totalVentas = ventasFiltradas.reduce((sum, v) => sum + v.total, 0);
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.text(`Total Ventas: ${totalVentas.toFixed(2)}`, 14, yPos);
        yPos += 15;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('No hay ventas en este período', 14, yPos);
        yPos += 15;
    }

    // SECCIÓN: COMPRAS
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('📥 Compras', 14, yPos);
    yPos += 10;

    if (comprasFiltradas.length > 0) {
        const comprasData = comprasFiltradas.map(c => [
            formatearFecha(c.fecha),
            c.productoNombre,
            c.cantidad,
           '$' + c.precioUnitario.toFixed(2),
           '$' + c.total.toFixed(2)
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Fecha', 'Producto', 'Cant.', 'P. Unit.', 'Total']],
            body: comprasData,
            theme: 'grid',
            headStyles: { fillColor: [220, 53, 69] },
            styles: { fontSize: 8 }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        const totalCompras = comprasFiltradas.reduce((sum, c) => sum + c.total, 0);
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.text(`Total Compras: ${totalCompras.toFixed(2)}`, 14, yPos);
        yPos += 15;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('No hay compras en este período', 14, yPos);
        yPos += 15;
    }

    // SECCIÓN: MOVIMIENTOS
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('💰 Otros Movimientos', 14, yPos);
    yPos += 10;

    const movimientosManuales = movimientosFiltrados.filter(m => m.origen === 'manual');

    if (movimientosManuales.length > 0) {
        const tiposNombres = {
            'ingreso_efectivo': 'Ing. Efectivo',
            'ingreso_transferencia': 'Ing. Transf.',
            'gasto_efectivo': 'Gasto Efectivo',
            'gasto_transferencia': 'Gasto Transf.'
        };

        const movimientosData = movimientosManuales.map(m => [
            formatearFecha(m.fecha),
            m.descripcion,
            tiposNombres[m.tipo],
            '$' + m.monto.toFixed(2)
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Fecha', 'Descripción', 'Tipo', 'Monto']],
            body: movimientosData,
            theme: 'grid',
            headStyles: { fillColor: [102, 126, 234] },
            styles: { fontSize: 8 }
        });

        yPos = doc.lastAutoTable.finalY + 10;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('No hay otros movimientos en este período', 14, yPos);
        yPos += 15;
    }

    // RESUMEN FINANCIERO
    if (yPos > 240) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('💵 Resumen Financiero', 14, yPos);
    yPos += 10;

    const ingresosEfectivo = movimientosFiltrados.filter(m => m.tipo === 'ingreso_efectivo').reduce((sum, m) => sum + m.monto, 0);
    const ingresosTransferencia = movimientosFiltrados.filter(m => m.tipo === 'ingreso_transferencia').reduce((sum, m) => sum + m.monto, 0);
    const gastosEfectivo = movimientosFiltrados.filter(m => m.tipo === 'gasto_efectivo').reduce((sum, m) => sum + m.monto, 0);
    const gastosTransferencia = movimientosFiltrados.filter(m => m.tipo === 'gasto_transferencia').reduce((sum, m) => sum + m.monto, 0);
    
    const totalIngresos = ingresosEfectivo + ingresosTransferencia;
    const totalGastos = gastosEfectivo + gastosTransferencia;
    const balance = totalIngresos - totalGastos;

    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text(`Ingresos Efectivo: ${ingresosEfectivo.toFixed(2)}`, 14, yPos);
    yPos += 7;
    doc.text(`Ingresos Transferencia: ${ingresosTransferencia.toFixed(2)}`, 14, yPos);
    yPos += 7;
    doc.text(`Gastos Efectivo: ${gastosEfectivo.toFixed(2)}`, 14, yPos);
    yPos += 7;
    doc.text(`Gastos Transferencia: ${gastosTransferencia.toFixed(2)}`, 14, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(102, 126, 234);
    doc.text(`BALANCE TOTAL: ${balance.toFixed(2)}`, 14, yPos);

    // GUARDAR PDF
    doc.save(`FactuManager_Informe_${new Date().toISOString().split('T')[0]}.pdf`);
    alert('✅ PDF generado correctamente!');
}