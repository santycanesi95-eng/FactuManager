/* ========================================== */
/* VARIABLES GLOBALES */
/* ========================================== */

let productos = [];
let movimientos = [];
let productoEditando = null;
let movimientoEditando = null;

/* ========================================== */
/* INICIALIZACIÓN - CARGAR DATOS AL INICIAR */
/* ========================================== */

window.addEventListener('DOMContentLoaded', function() {
    cargarDatosDesdeLocalStorage();
    document.getElementById('fechaMovimiento').valueAsDate = new Date();
    document.getElementById('pdfFechaHasta').valueAsDate = new Date();
    actualizarTodasLasVistas();
});

/* ========================================== */
/* PERSISTENCIA CON LOCALSTORAGE */
/* ========================================== */

function guardarEnLocalStorage() {
    const datos = {
        productos: productos,
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
            movimientos = datos.movimientos || [];
            console.log('✅ Datos cargados correctamente');
        } catch (error) {
            console.error('❌ Error al cargar datos:', error);
            productos = [];
            movimientos = [];
        }
    }
}

function limpiarTodosLosDatos() {
    if (confirm('⚠️ ¿Estás seguro de que quieres ELIMINAR TODOS LOS DATOS?\n\nEsta acción no se puede deshacer.\n\nSe recomienda hacer un backup antes.')) {
        if (confirm('🔴 ÚLTIMA CONFIRMACIÓN: ¿Realmente deseas borrar todo?')) {
            localStorage.removeItem('factumanager_datos');
            productos = [];
            movimientos = [];
            actualizarTodasLasVistas();
            alert('✅ Todos los datos han sido eliminados.');
        }
    }
}

/* ========================================== */
/* EXPORTAR E IMPORTAR DATOS (BACKUP) */
/* ========================================== */

function exportarDatos() {
    const datos = {
        productos: productos,
        movimientos: movimientos,
        fechaExportacion: new Date().toISOString(),
        version: '2.0'
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
                movimientos = datos.movimientos || [];
                guardarEnLocalStorage();
                actualizarTodasLasVistas();
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
/* FUNCIONES PARA GESTIÓN DE PRODUCTOS */
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
        // EDITAR producto existente
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
        // CREAR nuevo producto
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
    const valorInventario = productos.reduce((sum, p) => sum + (p.stockActual * p.precioCosto), 0);
    const productosStockBajo = productos.filter(p => p.stockActual <= p.stockMinimo).length;

    document.getElementById('totalUnidades').textContent = totalUnidades;
    document.getElementById('totalVentas').textContent = '$0'; // Se actualizará cuando implementemos ventas
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
/* FUNCIONES PARA GESTIÓN DE MOVIMIENTOS */
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

    if (movimientoEditando) {
        // EDITAR movimiento existente
        const index = movimientos.findIndex(m => m.id === movimientoEditando);
        if (index !== -1) {
            movimientos[index] = {
                ...movimientos[index],
                fecha,
                descripcion,
                tipo,
                monto
            };
            movimientos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            recalcularSaldos();
            mostrarAlerta('alertMovimiento', '✅ Movimiento actualizado correctamente', 'success');
        }
        movimientoEditando = null;
    } else {
        // CREAR nuevo movimiento
        const movimiento = {
            id: Date.now(),
            fecha,
            descripcion,
            tipo,
            monto,
            saldo: 0
        };
        movimientos.push(movimiento);
        movimientos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        recalcularSaldos();
        mostrarAlerta('alertMovimiento', '✅ Movimiento registrado correctamente', 'success');
    }

    limpiarFormularioMovimiento();
    guardarEnLocalStorage();
    actualizarTodasLasVistas();
}

function editarMovimiento(id) {
    const movimiento = movimientos.find(m => m.id === id);
    if (!movimiento) return;

    document.getElementById('fechaMovimiento').value = movimiento.fecha;
    document.getElementById('descripcionMovimiento').value = movimiento.descripcion;
    document.getElementById('tipoMovimiento').value = movimiento.tipo;
    document.getElementById('montoMovimiento').value = movimiento.monto;

    movimientoEditando = id;
    document.getElementById('tituloFormMovimiento').textContent = '✏️ Editar Movimiento';
    document.getElementById('btnGuardarMovimiento').textContent = '💾 Actualizar Movimiento';
    document.getElementById('btnCancelarMovimiento').style.display = 'inline-block';

    openTab('movimientos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicionMovimiento() {
    movimientoEditando = null;
    limpiarFormularioMovimiento();
    document.getElementById('tituloFormMovimiento').textContent = '➕ Registrar Movimiento';
    document.getElementById('btnGuardarMovimiento').textContent = '💾 Guardar Movimiento';
    document.getElementById('btnCancelarMovimiento').style.display = 'none';
}

function eliminarMovimiento(id) {
    if (confirm('¿Estás seguro de eliminar este movimiento?')) {
        movimientos = movimientos.filter(m => m.id !== id);
        recalcularSaldos();
        guardarEnLocalStorage();
        actualizarTodasLasVistas();
        mostrarAlerta('alertMovimiento', '✅ Movimiento eliminado correctamente', 'success');
    }
}

function recalcularSaldos() {
    let saldoAcumulado = 0;
    movimientos.forEach(m => {
        saldoAcumulado = m.tipo === 'ingreso' ? saldoAcumulado + m.monto : saldoAcumulado - m.monto;
        m.saldo = saldoAcumulado;
    });
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
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #6c757d;">No hay movimientos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = listaMovimientos.map(m => `
        <tr>
            <td>${formatearFecha(m.fecha)}</td>
            <td>${m.descripcion}</td>
            <td><span style="color: ${m.tipo === 'ingreso' ? '#28a745' : '#dc3545'}; font-weight: bold;">${m.tipo === 'ingreso' ? '💰' : '💸'} ${m.tipo.toUpperCase()}</span></td>
            <td style="color: ${m.tipo === 'ingreso' ? '#28a745' : '#dc3545'}; font-weight: bold;">$${m.monto.toFixed(2)}</td>
            <td><strong>$${m.saldo.toFixed(2)}</strong></td>
            <td>
                <div class="actions-cell">
                    <button class="btn btn-warning" onclick="editarMovimiento(${m.id})">✏️</button>
                    <button class="btn btn-danger" onclick="eliminarMovimiento(${m.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function actualizarEstadisticasMovimientos() {
    const totalIngresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
    const totalGastos = movimientos.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.monto, 0);
    const saldoActual = movimientos.length > 0 ? movimientos[movimientos.length - 1].saldo : 0;

    document.getElementById('totalIngresos').textContent = '$' + totalIngresos.toFixed(2);
    document.getElementById('totalGastos').textContent = '$' + totalGastos.toFixed(2);
    document.getElementById('saldoActual').textContent = '$' + saldoActual.toFixed(2);
}

function limpiarFormularioMovimiento() {
    document.getElementById('fechaMovimiento').valueAsDate = new Date();
    document.getElementById('descripcionMovimiento').value = '';
    document.getElementById('tipoMovimiento').value = 'ingreso';
    document.getElementById('montoMovimiento').value = '';
}

function formatearFecha(fecha) {
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
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

function actualizarTodasLasVistas() {
    actualizarTablaProductos();
    actualizarEstadisticasProductos();
    actualizarTablaMovimientos();
    actualizarEstadisticasMovimientos();
    actualizarResumenInformes();
}

function actualizarConfiguracion() {
    document.getElementById('configTotalProductos').textContent = productos.length;
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
    document.getElementById('resumenMovimientos').textContent = movimientos.length;
    
    const balance = movimientos.length > 0 ? movimientos[movimientos.length - 1].saldo : 0;
    document.getElementById('resumenBalance').textContent = '$' + balance.toFixed(2);
    
    const valorInventario = productos.reduce((sum, p) => sum + (p.stockActual * p.precioCosto), 0);
    document.getElementById('resumenInventario').textContent = '$' + valorInventario.toFixed(2);
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
    let movimientosFiltrados = [...movimientos];

    if (fechaDesde && fechaHasta) {
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

    // PRODUCTOS
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

        const totalUnidades = productosFiltrados.reduce((sum, p) => sum + p.stockActual, 0);
        const valorInventario = productosFiltrados.reduce((sum, p) => sum + (p.stockActual * p.precioCosto), 0);

        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.text(`Total Productos: ${productosFiltrados.length}`, 14, yPos);
        doc.text(`Total Unidades: ${totalUnidades}`, 80, yPos);
        doc.text(`Valor Inventario: $${valorInventario.toFixed(2)}`, 145, yPos);
        yPos += 15;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('No hay productos registrados', 14, yPos);
        yPos += 15;
    }

    // MOVIMIENTOS
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('💰 Movimientos', 14, yPos);
    yPos += 10;

    if (movimientosFiltrados.length > 0) {
        const movimientosData = movimientosFiltrados.map(m => [
            formatearFecha(m.fecha),
            m.descripcion,
            m.tipo.toUpperCase(),
            '$' + m.monto.toFixed(2),
            '$' + m.saldo.toFixed(2)
        ]);

        
        doc.autoTable({
            startY: yPos,
            head: [['Fecha', 'Descripción', 'Tipo', 'Monto', 'Saldo']],
            body: movimientosData,
            theme: 'grid',
            headStyles: { fillColor: [102, 126, 234] },
            styles: { fontSize: 8 }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        const totalIngresos = movimientosFiltrados.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
        const totalGastos = movimientosFiltrados.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.monto, 0);
        const saldoFinal = movimientosFiltrados.length > 0 ? movimientosFiltrados[movimientosFiltrados.length - 1].saldo : 0;

        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.text(`Ingresos: $${totalIngresos.toFixed(2)}`, 14, yPos);
        doc.text(`Gastos: $${totalGastos.toFixed(2)}`, 80, yPos);
        doc.text(`Balance: $${saldoFinal.toFixed(2)}`, 145, yPos);
    } else {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('No hay movimientos registrados', 14, yPos);
    }

    doc.save(`FactuManager_Informe_${new Date().toISOString().split('T')[0]}.pdf`);
    alert('✅ PDF generado correctamente!');
}