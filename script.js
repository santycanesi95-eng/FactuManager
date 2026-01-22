/* ========================================== */
/* VARIABLES GLOBALES */
/* ========================================== */

let productos = [];
let ventas = [];
let compras = [];
let productoEditando = null;

/* ========================================== */
/* INICIALIZACIÓN */
/* ========================================== */

window.addEventListener('DOMContentLoaded', function() {
    cargarDatosDesdeLocalStorage();
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
        ultimaActualizacion: new Date().toISOString()
    };
    localStorage.setItem('factumanager_datos', JSON.stringify(datos));
}

function cargarDatosDesdeLocalStorage() {
    const datosGuardados = localStorage.getItem('factumanager_datos');
    if (datosGuardados) {
        try {
            const datos = JSON.parse(datosGuardados);
            productos = datos.productos || [];
            ventas = datos.ventas || [];
            compras = datos.compras || [];
        } catch (error) {
            console.error('Error al cargar datos:', error);
            productos = [];
            ventas = [];
            compras = [];
        }
    }
}

function limpiarTodosLosDatos() {
    if (confirm('¿Estás seguro de ELIMINAR TODOS LOS DATOS? Esta acción no se puede deshacer.')) {
        if (confirm('ÚLTIMA CONFIRMACIÓN: ¿Realmente deseas borrar todo?')) {
            localStorage.removeItem('factumanager_datos');
            productos = [];
            ventas = [];
            compras = [];
            actualizarTodasLasVistas();
            alert('Todos los datos han sido eliminados.');
        }
    }
}

function exportarDatos() {
    const datos = {
        productos: productos,
        ventas: ventas,
        compras: compras,
        fechaExportacion: new Date().toISOString(),
        version: '4.0'
    };
    const dataStr = JSON.stringify(datos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'FactuManager_Backup_' + new Date().toISOString().split('T')[0] + '.json';
    link.click();
    URL.revokeObjectURL(url);
    alert('Backup exportado correctamente');
}

function importarDatos(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const datos = JSON.parse(e.target.result);
            if (confirm('¿Deseas REEMPLAZAR todos los datos actuales con el backup?')) {
                productos = datos.productos || [];
                ventas = datos.ventas || [];
                compras = datos.compras || [];
                guardarEnLocalStorage();
                actualizarTodasLasVistas();
                cargarProductosEnSelectores();
                alert('Datos importados correctamente');
            }
        } catch (error) {
            alert('Error al importar el archivo.');
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
        mostrarAlerta('alertProducto', 'Por favor ingrese el nombre del producto', 'danger');
        return;
    }
    if (precioCosto <= 0 || precioVenta <= 0) {
        mostrarAlerta('alertProducto', 'Los precios deben ser mayores a 0', 'danger');
        return;
    }

    if (productoEditando) {
        const index = productos.findIndex(p => p.id === productoEditando);
        if (index !== -1) {
            productos[index] = {
                ...productos[index],
                nombre, stockInicial, stockActual, precioCosto, precioVenta, stockMinimo,
                porcentaje: ((precioVenta - precioCosto) / precioCosto * 100).toFixed(2)
            };
            mostrarAlerta('alertProducto', 'Producto actualizado correctamente', 'success');
        }
        productoEditando = null;
    } else {
        const producto = {
            id: Date.now(), nombre, stockInicial, stockActual, precioCosto, precioVenta, stockMinimo,
            porcentaje: ((precioVenta - precioCosto) / precioCosto * 100).toFixed(2)
        };
        productos.push(producto);
        mostrarAlerta('alertProducto', 'Producto agregado correctamente', 'success');
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
    document.getElementById('tituloFormProducto').textContent = 'Editar Producto';
    document.getElementById('btnGuardarProducto').textContent = 'Actualizar Producto';
    document.getElementById('btnCancelarProducto').style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicionProducto() {
    productoEditando = null;
    limpiarFormularioProducto();
    document.getElementById('tituloFormProducto').textContent = 'Agregar Nuevo Producto';
    document.getElementById('btnGuardarProducto').textContent = 'Guardar Producto';
    document.getElementById('btnCancelarProducto').style.display = 'none';
}

function eliminarProducto(id) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        productos = productos.filter(p => p.id !== id);
        guardarEnLocalStorage();
        actualizarTodasLasVistas();
        cargarProductosEnSelectores();
        mostrarAlerta('alertProducto', 'Producto eliminado correctamente', 'success');
    }
}

function buscarProductos() {
    const busqueda = document.getElementById('buscarProducto').value.toLowerCase();
    const productosFiltrados = productos.filter(p => p.nombre.toLowerCase().includes(busqueda));
    actualizarTablaProductos(productosFiltrados);
}

function actualizarTablaProductos(listaProductos = productos) {
    const tbody = document.getElementById('tablaProductos');
    if (listaProductos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #6c757d;">No hay productos registrados</td></tr>';
        return;
    }
    tbody.innerHTML = listaProductos.map(p => {
        const alerta = p.stockActual <= p.stockMinimo ? '<span class="badge badge-danger">Stock Bajo</span>' : '';
        return '<tr><td><strong>' + p.nombre + '</strong> ' + alerta + '</td><td>' + p.stockInicial + '</td><td>' + p.stockActual + '</td><td>' + (p.stockMinimo || 5) + '</td><td>$' + p.precioCosto.toFixed(2) + '</td><td>$' + p.precioVenta.toFixed(2) + '</td><td><strong>' + p.porcentaje + '%</strong></td><td><div class="actions-cell"><button class="btn btn-warning" onclick="editarProducto(' + p.id + ')">Editar</button><button class="btn btn-danger" onclick="eliminarProducto(' + p.id + ')">Eliminar</button></div></td></tr>';
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
    const opciones = '<option value="">Seleccione un producto</option>' + productos.map(p => '<option value="' + p.id + '">' + p.nombre + ' (Stock: ' + p.stockActual + ')</option>').join('');
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

function registrarVenta() {
    const fecha = document.getElementById('fechaVenta').value;
    const productoId = parseInt(document.getElementById('productoVenta').value);
    const cantidad = parseInt(document.getElementById('cantidadVenta').value) || 0;
    const tipo = document.getElementById('tipoVenta').value;
    const observacion = document.getElementById('observacionVenta').value.trim();

    if (!fecha || !productoId || cantidad <= 0) {
        mostrarAlerta('alertVenta', 'Por favor complete todos los campos obligatorios', 'danger');
        return;
    }

    const producto = productos.find(p => p.id === productoId);
    if (!producto) {
        mostrarAlerta('alertVenta', 'Producto no encontrado', 'danger');
        return;
    }
    if (producto.stockActual < cantidad) {
        mostrarAlerta('alertVenta', 'Stock insuficiente. Disponible: ' + producto.stockActual, 'danger');
        return;
    }

    const precioUnitario = producto.precioVenta;
    const total = cantidad * precioUnitario;
    const venta = {
        id: Date.now(),
        fecha, productoId, productoNombre: producto.nombre,
        cantidad, tipo, precioUnitario, total, observacion
    };
    ventas.push(venta);
    producto.stockActual -= cantidad;

    document.getElementById('productoVenta').value = '';
    document.getElementById('cantidadVenta').value = '';
    document.getElementById('precioVenta').value = '';
    document.getElementById('totalVenta').value = '';
    document.getElementById('observacionVenta').value = '';

    guardarEnLocalStorage();
    actualizarTodasLasVistas();
    cargarProductosEnSelectores();
    mostrarAlerta('alertVenta', 'Venta registrada correctamente. Stock actualizado.', 'success');
}

function anularVenta(id) {
    if (!confirm('¿Anular esta venta? Se devolverá el stock.')) return;
    const venta = ventas.find(v => v.id === id);
    if (!venta) return;
    const producto = productos.find(p => p.id === venta.productoId);
    if (producto) producto.stockActual += venta.cantidad;
    ventas = ventas.filter(v => v.id !== id);
    guardarEnLocalStorage();
    actualizarTodasLasVistas();
    cargarProductosEnSelectores();
    mostrarAlerta('alertVenta', 'Venta anulada. Stock devuelto.', 'success');
}

function actualizarTablaVentas() {
    const tbody = document.getElementById('tablaVentas');
    if (ventas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #6c757d;">No hay ventas registradas</td></tr>';
        return;
    }
    tbody.innerHTML = ventas.slice().reverse().map(v => {
        const tipoIcon = v.tipo === 'efectivo' ? '💵 Efectivo' : '💳 Transferencia';
        const tipoColor = v.tipo === 'efectivo' ? '#28a745' : '#17a2b8';
        return '<tr><td>' + formatearFecha(v.fecha) + '</td><td><strong>' + v.productoNombre + '</strong></td><td>' + v.cantidad + '</td><td><span style="color: ' + tipoColor + '; font-weight: bold;">' + tipoIcon + '</span></td><td>$' + v.precioUnitario.toFixed(2) + '</td><td><strong style="color: #28a745;">$' + v.total.toFixed(2) + '</strong></td><td>' + (v.observacion || '-') + '</td><td><button class="btn btn-danger" onclick="anularVenta(' + v.id + ')">Anular</button></td></tr>';
    }).join('');
}

function actualizarBalanceVentas() {
    const ventasEfectivo = ventas.filter(v => v.tipo === 'efectivo').reduce((sum, v) => sum + v.total, 0);
    const ventasTransferencia = ventas.filter(v => v.tipo === 'transferencia').reduce((sum, v) => sum + v.total, 0);
    const totalVentas = ventasEfectivo + ventasTransferencia;
    
    document.getElementById('ventasEfectivo').textContent = '$' + ventasEfectivo.toFixed(2);
    document.getElementById('ventasTransferencia').textContent = '$' + ventasTransferencia.toFixed(2);
    document.getElementById('totalVentasBalance').textContent = '$' + totalVentas.toFixed(2);
}

/* ========================================== */
/* GESTIÓN DE COMPRAS */
/* ========================================== */

function calcularTotalCompra() {
    const cantidad = parseInt(document.getElementById('cantidadCompra').value) || 0;
    const precio = parseFloat(document.getElementById('precioCompra').value) || 0;
    document.getElementById('totalCompra').value = (cantidad * precio).toFixed(2);
}

function registrarCompra() {
    const fecha = document.getElementById('fechaCompra').value;
    const productoId = parseInt(document.getElementById('productoCompra').value);
    const cantidad = parseInt(document.getElementById('cantidadCompra').value) || 0;
    const tipo = document.getElementById('tipoCompra').value;
    const observacion = document.getElementById('observacionCompra').value.trim();

    if (!fecha || !productoId || cantidad <= 0) {
        mostrarAlerta('alertCompra', 'Por favor complete todos los campos obligatorios', 'danger');
        return;
    }

    const producto = productos.find(p => p.id === productoId);
    if (!producto) {
        mostrarAlerta('alertCompra', 'Producto no encontrado', 'danger');
        return;
    }

    const precioUnitario = producto.precioCosto;
    const total = cantidad * precioUnitario;
    const compra = {
        id: Date.now(), fecha, productoId, productoNombre: producto.nombre,
        cantidad, tipo, precioUnitario, total, observacion
    };
    compras.push(compra);
    producto.stockActual += cantidad;

    document.getElementById('productoCompra').value = '';
    document.getElementById('cantidadCompra').value = '';
    document.getElementById('precioCompra').value = '';
    document.getElementById('totalCompra').value = '';
    document.getElementById('observacionCompra').value = '';

    guardarEnLocalStorage();
    actualizarTodasLasVistas();
    cargarProductosEnSelectores();
    mostrarAlerta('alertCompra', 'Compra registrada correctamente. Stock actualizado.', 'success');
}

function anularCompra(id) {
    if (!confirm('¿Anular esta compra? Se restará el stock.')) return;
    const compra = compras.find(c => c.id === id);
    if (!compra) return;
    const producto = productos.find(p => p.id === compra.productoId);
    if (producto) {
        producto.stockActual -= compra.cantidad;
        if (producto.stockActual < 0) producto.stockActual = 0;
    }
    compras = compras.filter(c => c.id !== id);
    guardarEnLocalStorage();
    actualizarTodasLasVistas();
    cargarProductosEnSelectores();
    mostrarAlerta('alertCompra', 'Compra anulada. Stock actualizado.', 'success');
}

function actualizarTablaCompras() {
    const tbody = document.getElementById('tablaCompras');
    if (compras.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #6c757d;">No hay compras registradas</td></tr>';
        return;
    }
    tbody.innerHTML = compras.slice().reverse().map(c => {
        const tipoIcon = c.tipo === 'efectivo' ? '💸 Efectivo' : '🏦 Transferencia';
        const tipoColor = c.tipo === 'efectivo' ? '#dc3545' : '#6c757d';
        return '<tr><td>' + formatearFecha(c.fecha) + '</td><td><strong>' + c.productoNombre + '</strong></td><td>' + c.cantidad + '</td><td><span style="color: ' + tipoColor + '; font-weight: bold;">' + tipoIcon + '</span></td><td>$' + c.precioUnitario.toFixed(2) + '</td><td><strong style="color: #dc3545;">$' + c.total.toFixed(2) + '</strong></td><td>' + (c.observacion || '-') + '</td><td><button class="btn btn-danger" onclick="anularCompra(' + c.id + ')">Anular</button></td></tr>';
    }).join('');
}

function actualizarBalanceCompras() {
    const comprasEfectivo = compras.filter(c => c.tipo === 'efectivo').reduce((sum, c) => sum + c.total, 0);
    const comprasTransferencia = compras.filter(c => c.tipo === 'transferencia').reduce((sum, c) => sum + c.total, 0);
    const totalCompras = comprasEfectivo + comprasTransferencia;
    
    document.getElementById('comprasEfectivo').textContent = '$' + comprasEfectivo.toFixed(2);
    document.getElementById('comprasTransferencia').textContent = '$' + comprasTransferencia.toFixed(2);
    document.getElementById('totalComprasBalance').textContent = '$' + totalCompras.toFixed(2);
}

/* ========================================== */
/* FUNCIONES GENERALES */
/* ========================================== */

function openTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));
    document.querySelector("[onclick=\"openTab('" + tabName + "')\"]").classList.add('active');
    document.getElementById(tabName).classList.add('active');
    if (tabName === 'configuracion') actualizarConfiguracion();
}

function mostrarAlerta(elementoId, mensaje, tipo) {
    const alertDiv = document.getElementById(elementoId);
    alertDiv.innerHTML = '<div class="alert alert-' + tipo + '">' + mensaje + '</div>';
    setTimeout(function() { alertDiv.innerHTML = ''; }, 4000);
}

function formatearFecha(fecha) {
    const partes = fecha.split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0];
}

function actualizarTodasLasVistas() {
    actualizarTablaProductos();
    actualizarEstadisticasProductos();
    actualizarTablaVentas();
    actualizarBalanceVentas();
    actualizarTablaCompras();
    actualizarBalanceCompras();
    actualizarResumenInformes();
}

function actualizarConfiguracion() {
    document.getElementById('configTotalProductos').textContent = productos.length;
    document.getElementById('configTotalVentas').textContent = ventas.length;
    document.getElementById('configTotalCompras').textContent = compras.length;
    const datosGuardados = localStorage.getItem('factumanager_datos');
    if (datosGuardados) {
        const datos = JSON.parse(datosGuardados);
        const fecha = new Date(datos.ultimaActualizacion);
        document.getElementById('configUltimaActualizacion').textContent = fecha.toLocaleString('es-AR');
    }
}

function actualizarResumenInformes() {
    document.getElementById('resumenProductos').textContent = productos.length;
    const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
    const totalCompras = compras.reduce((sum, c) => sum + c.total, 0);
    const balance = totalVentas - totalCompras;
    document.getElementById('resumenVentas').textContent = '$' + totalVentas.toFixed(2);
    document.getElementById('resumenCompras').textContent = '$' + totalCompras.toFixed(2);
    document.getElementById('resumenBalance').textContent = '$' + balance.toFixed(2);
}

/* ========================================== */
/* GENERACIÓN DE PDF CON RESUMEN POR PRODUCTO */
/* ========================================== */

function generarPDF() {
    const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF();
    const fechaDesde = document.getElementById('pdfFechaDesde').value;
    const fechaHasta = document.getElementById('pdfFechaHasta').value;
    
    let productosFiltrados = productos;
    let ventasFiltradas = ventas;
    let comprasFiltradas = compras;
    
    if (fechaDesde && fechaHasta) {
        ventasFiltradas = ventas.filter(v => v.fecha >= fechaDesde && v.fecha <= fechaHasta);
        comprasFiltradas = compras.filter(c => c.fecha >= fechaDesde && c.fecha <= fechaHasta);
    }
    
    doc.setFontSize(22);
    doc.setTextColor(102, 126, 234);
    doc.text('FactuManager Pro - Informe', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    let subtitulo = 'Generado: ' + new Date().toLocaleDateString('es-AR');
    if (fechaDesde && fechaHasta) {
        subtitulo += ' | Periodo: ' + formatearFecha(fechaDesde) + ' - ' + formatearFecha(fechaHasta);
    }
    doc.text(subtitulo, 105, 28, { align: 'center' });
    
    let yPos = 40;
    
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('Productos', 14, yPos);
    yPos += 10;
    
    if (productosFiltrados.length > 0) {
        const productosData = productosFiltrados.map(p => [
            p.nombre, 
            p.stockActual, 
            '$' + p.precioCosto.toFixed(2), 
            '$' + p.precioVenta.toFixed(2), 
            p.porcentaje + '%'
        ]);
        
        doc.autoTable({
            startY: yPos,
            head: [['Producto', 'Stock', 'P. Costo', 'P. Venta', '%']],
            body: productosData,
            theme: 'grid',
            headStyles: { fillColor: [102, 126, 234] },
            styles: { fontSize: 8 }
        });
        yPos = doc.lastAutoTable.finalY + 15;
    }
    
    if (yPos > 230) { 
        doc.addPage(); 
        yPos = 20; 
    }
    
    doc.setFontSize(16);
    doc.setTextColor(40, 167, 69);
    doc.text('RESUMEN DE VENTAS POR PRODUCTO', 14, yPos);
    yPos += 10;
    
    if (ventasFiltradas.length > 0) {
        const ventasPorProducto = {};
        
        ventasFiltradas.forEach(v => {
            if (!ventasPorProducto[v.productoNombre]) {
                ventasPorProducto[v.productoNombre] = {
                    cantidad: 0,
                    efectivo: 0,
                    transferencia: 0,
                    total: 0
                };
            }
            ventasPorProducto[v.productoNombre].cantidad += v.cantidad;
            if (v.tipo === 'efectivo') {
                ventasPorProducto[v.productoNombre].efectivo += v.total;
            } else {
                ventasPorProducto[v.productoNombre].transferencia += v.total;
            }
            ventasPorProducto[v.productoNombre].total += v.total;
        });
        
        const resumenData = Object.keys(ventasPorProducto).map(nombreProducto => [
    nombreProducto,
    ventasPorProducto[nombreProducto].cantidad + ' unidades',
    '$' + ventasPorProducto[nombreProducto].efectivo.toFixed(2),
    '$' + ventasPorProducto[nombreProducto].transferencia.toFixed(2),
    '$' + ventasPorProducto[nombreProducto].total.toFixed(2)
]);
    
    if (yPos > 230) { 
        doc.addPage(); 
        yPos = 20; 
    }
    
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('Detalle de Ventas', 14, yPos);
    yPos += 10;
    
    if (ventasFiltradas.length > 0) {
        const ventasData = ventasFiltradas.map(v => [
            formatearFecha(v.fecha), 
            v.productoNombre, 
            v.cantidad, 
            v.tipo === 'efectivo' ? 'Efectivo' : 'Transf.', 
            '$' + v.total.toFixed(2)
        ]);
        
        doc.autoTable({ 
            startY: yPos, 
            head: [['Fecha', 'Producto', 'Cant.', 'Tipo', 'Total']], 
            body: ventasData, 
            theme: 'grid', 
            headStyles: { fillColor: [40, 167, 69] }, 
            styles: { fontSize: 8 } 
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
    }
    
    if (yPos > 230) { 
        doc.addPage(); 
        yPos = 20; 
    }
    
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('Compras', 14, yPos);
    yPos += 10;
    
    if (comprasFiltradas.length > 0) {
        const comprasData = comprasFiltradas.map(c => [
            formatearFecha(c.fecha), 
            c.productoNombre, 
            c.cantidad, 
            c.tipo === 'efectivo' ? 'Efectivo' : 'Transf.', 
            '$' + c.total.toFixed(2)
        ]);
        
        doc.autoTable({ 
            startY: yPos, 
            head: [['Fecha', 'Producto', 'Cant.', 'Tipo', 'Total']], 
            body: comprasData, 
            theme: 'grid', 
            headStyles: { fillColor: [220, 53, 69] }, 
            styles: { fontSize: 8 } 
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
        const totalCompras = comprasFiltradas.reduce((sum, c) => sum + c.total, 0);
        doc.setFontSize(10);
        doc.text('Total Compras: $' + totalCompras.toFixed(2), 14, yPos);
    }
    
    doc.save('FactuManager_Informe_' + new Date().toISOString().split('T')[0] + '.pdf');
    alert('PDF generado correctamente!');
    
    if (yPos > 230) { 
        doc.addPage(); 
        yPos = 20; 
    }
    
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('Detalle de Ventas', 14, yPos);
    yPos += 10;
    
    if (ventasFiltradas.length > 0) {
        const ventasData = ventasFiltradas.map(v => [
            formatearFecha(v.fecha), 
            v.productoNombre, 
            v.cantidad, 
            v.tipo === 'efectivo' ? 'Efectivo' : 'Transf.', 
            '$' + v.total.toFixed(2)
        ]);
        
        doc.autoTable({ 
            startY: yPos, 
            head: [['Fecha', 'Producto', 'Cant.', 'Tipo', 'Total']], 
            body: ventasData, 
            theme: 'grid', 
            headStyles: { fillColor: [40, 167, 69] }, 
            styles: { fontSize: 8 } 
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
    }
    
    if (yPos > 230) { 
        doc.addPage(); 
        yPos = 20; 
    }
    
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('Compras', 14, yPos);
    yPos += 10;
    
    if (comprasFiltradas.length > 0) {
        const comprasData = comprasFiltradas.map(c => [
            formatearFecha(c.fecha), 
            c.productoNombre, 
            c.cantidad, 
            c.tipo === 'efectivo' ? 'Efectivo' : 'Transf.', 
            '$' + c.total.toFixed(2)

        ]);
        
        doc.autoTable({ 
            startY: yPos, 
            head: [['Fecha', 'Producto', 'Cant.', 'Tipo', 'Total']], 
            body: comprasData, 
            theme: 'grid', 
            headStyles: { fillColor: [220, 53, 69] }, 
            styles: { fontSize: 8 } 
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
        const totalCompras = comprasFiltradas.reduce((sum, c) => sum + c.total, 0);
        doc.setFontSize(10);
        doc.text('Total Compras: $' + totalCompras.toFixed(2), 14, yPos);
    }
    
    doc.save('FactuManager_Informe_' + new Date().toISOString().split('T')[0] + '.pdf');
    alert('PDF generado correctamente!');
    
    if (yPos > 230) { 
        doc.addPage(); 
        yPos = 20; 
    }
    
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('Detalle de Ventas', 14, yPos);
    yPos += 10;
    
    if (ventasFiltradas.length > 0) {
        const ventasData = ventasFiltradas.map(v => [
            formatearFecha(v.fecha), 
            v.productoNombre, 
            v.cantidad, 
            v.tipo === 'efectivo' ? 'Efectivo' : 'Transf.', 
            '$' + v.total.toFixed(2)
        ]);
        
        doc.autoTable({ 
            startY: yPos, 
            head: [['Fecha', 'Producto', 'Cant.', 'Tipo', 'Total']], 
            body: ventasData, 
            theme: 'grid', 
            headStyles: { fillColor: [40, 167, 69] }, 
            styles: { fontSize: 8 } 
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
    }
    
    if (yPos > 230) { 
        doc.addPage(); 
        yPos = 20; 
    }
    
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('Compras', 14, yPos);
    yPos += 10;
    
    if (comprasFiltradas.length > 0) {
        const comprasData = comprasFiltradas.map(c => [
            formatearFecha(c.fecha), 
            c.productoNombre, 
            c.cantidad, 
            c.tipo === 'efectivo' ? 'Efectivo' : 'Transf.', 
            '$' + c.total.toFixed(2)
        ]);
        
        doc.autoTable({ 
            startY: yPos, 
            head: [['Fecha', 'Producto', 'Cant.', 'Tipo', 'Total']], 
            body: comprasData, 
            theme: 'grid', 
            headStyles: { fillColor: [220, 53, 69] }, 
            styles: { fontSize: 8 } 
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
        const totalCompras = comprasFiltradas.reduce((sum, c) => sum + c.total, 0);
        doc.setFontSize(10);
        doc.text('Total Compras: $' + totalCompras.toFixed(2), 14, yPos);
    }
    
    doc.save('FactuManager_Informe_' + new Date().toISOString().split('T')[0] + '.pdf');
    alert('PDF generado correctamente!');
} + ventasPorProducto[nombreProducto].total.toFixed(2)
        
        
        doc.autoTable({
            startY: yPos,
            head: [['Producto', 'Unidades', 'Efectivo', 'Transferencia', 'Total']],
            body: resumenData,
            theme: 'grid',
            headStyles: { fillColor: [40, 167, 69] },
            styles: { fontSize: 8 }
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
        
        const totalEfectivo = ventasFiltradas.filter(v => v.tipo === 'efectivo').reduce((sum, v) => sum + v.total, 0);
        const totalTransferencia = ventasFiltradas.filter(v => v.tipo === 'transferencia').reduce((sum, v) => sum + v.total, 0);
        const totalGeneralVentas = totalEfectivo + totalTransferencia;
        
        doc.setFontSize(11);
        doc.setTextColor(40, 167, 69);
        doc.setFont(undefined, 'bold');
        doc.text('TOTAL EFECTIVO: $' + totalEfectivo.toFixed(2), 14, yPos);
    
    if (yPos > 230) { 
        doc.addPage(); 
        yPos = 20; 
    }
    
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('Detalle de Ventas', 14, yPos);
    yPos += 10;
    
    if (ventasFiltradas.length > 0) {
        const ventasData = ventasFiltradas.map(v => [
            formatearFecha(v.fecha), 
            v.productoNombre, 
            v.cantidad, 
            v.tipo === 'efectivo' ? 'Efectivo' : 'Transf.', 
            '$' + v.total.toFixed(2)
        ]);
        
        doc.autoTable({ 
            startY: yPos, 
            head: [['Fecha', 'Producto', 'Cant.', 'Tipo', 'Total']], 
            body: ventasData, 
            theme: 'grid', 
            headStyles: { fillColor: [40, 167, 69] }, 
            styles: { fontSize: 8 } 
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
    }
    
    if (yPos > 230) { 
        doc.addPage(); 
        yPos = 20; 
    }
    
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('Compras', 14, yPos);
    yPos += 10;
    
    if (comprasFiltradas.length > 0) {
        const comprasData = comprasFiltradas.map(c => [
            formatearFecha(c.fecha), 
            c.productoNombre, 
            c.cantidad, 
            c.tipo === 'efectivo' ? 'Efectivo' : 'Transf.', 
            '$' + c.total.toFixed(2)
        ]);
        
        doc.autoTable({ 
            startY: yPos, 
            head: [['Fecha', 'Producto', 'Cant.', 'Tipo', 'Total']], 
            body: comprasData, 
            theme: 'grid', 
            headStyles: { fillColor: [220, 53, 69] }, 
            styles: { fontSize: 8 } 
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
        const totalCompras = comprasFiltradas.reduce((sum, c) => sum + c.total, 0);
        doc.setFontSize(10);
        doc.text('Total Compras: $' + totalCompras.toFixed(2), 14, yPos);

    }
    
    doc.save('FactuManager_Informe_' + new Date().toISOString().split('T')[0] + '.pdf');
    alert('PDF generado correctamente!');
    doc.text('TOTAL EFECTIVO: $' + totalEfectivo.toFixed(2), 14, yPos);
        yPos += 7;
        doc.text('TOTAL TRANSFERENCIA: $' + totalTransferencia.toFixed(2), 14, yPos);
    
    if (yPos > 230) { 
        doc.addPage(); 
        yPos = 20; 
    }
    
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('Detalle de Ventas', 14, yPos);
    yPos += 10;
    
    if (ventasFiltradas.length > 0) {
        const ventasData = ventasFiltradas.map(v => [
            formatearFecha(v.fecha), 
            v.productoNombre, 
            v.cantidad, 
            v.tipo === 'efectivo' ? 'Efectivo' : 'Transf.', 
            '$' + v.total.toFixed(2)
        ]);
        
        doc.autoTable({ 
            startY: yPos, 
            head: [['Fecha', 'Producto', 'Cant.', 'Tipo', 'Total']], 
            body: ventasData, 
            theme: 'grid', 
            headStyles: { fillColor: [40, 167, 69] }, 
            styles: { fontSize: 8 } 
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
    }
    
    if (yPos > 230) { 
        doc.addPage(); 
        yPos = 20; 
    }
    
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('Compras', 14, yPos);
    yPos += 10;
    
    if (comprasFiltradas.length > 0) {
        const comprasData = comprasFiltradas.map(c => [
            formatearFecha(c.fecha), 
            c.productoNombre, 
            c.cantidad, 
            c.tipo === 'efectivo' ? 'Efectivo' : 'Transf.', 
            '$' + c.total.toFixed(2)
        ]);
        
        doc.autoTable({ 
            startY: yPos, 
            head: [['Fecha', 'Producto', 'Cant.', 'Tipo', 'Total']], 
            body: comprasData, 
            theme: 'grid', 
            headStyles: { fillColor: [220, 53, 69] }, 
            styles: { fontSize: 8 } 
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
        const totalCompras = comprasFiltradas.reduce((sum, c) => sum + c.total, 0);
        doc.setFontSize(10);
        doc.text('Total Compras: $' + totalCompras.toFixed(2), 14, yPos);
    }
    
    doc.save('FactuManager_Informe_' + new Date().toISOString().split('T')[0] + '.pdf');
    alert('PDF generado correctamente!');
    doc.text('TOTAL TRANSFERENCIA: $' + totalTransferencia.toFixed(2), 14, yPos);
        yPos += 7;
        doc.setFontSize(12);
        doc.text('TOTAL GENERAL VENTAS: $' + totalGeneralVentas.toFixed(2), 14, yPos);
    
    if (yPos > 230) { 
        doc.addPage(); 
        yPos = 20; 
    }
    
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('Detalle de Ventas', 14, yPos);
    yPos += 10;
    
    if (ventasFiltradas.length > 0) {
        const ventasData = ventasFiltradas.map(v => [
            formatearFecha(v.fecha), 
            v.productoNombre, 
            v.cantidad, 
            v.tipo === 'efectivo' ? 'Efectivo' : 'Transf.', 
            '$' + v.total.toFixed(2)
        ]);
        
        doc.autoTable({ 
            startY: yPos, 
            head: [['Fecha', 'Producto', 'Cant.', 'Tipo', 'Total']], 
            body: ventasData, 
            theme: 'grid', 
            headStyles: { fillColor: [40, 167, 69] }, 
            styles: { fontSize: 8 } 
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
    }
    
    if (yPos > 230) { 
        doc.addPage(); 
        yPos = 20; 
    }
    
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('Compras', 14, yPos);
    yPos += 10;
    
    if (comprasFiltradas.length > 0) {
        const comprasData = comprasFiltradas.map(c => [
            formatearFecha(c.fecha), 
            c.productoNombre, 
            c.cantidad, 
            c.tipo === 'efectivo' ? 'Efectivo' : 'Transf.', 
            '$' + c.total.toFixed(2)
        ]);
        
        doc.autoTable({ 
            startY: yPos, 
            head: [['Fecha', 'Producto', 'Cant.', 'Tipo', 'Total']], 
            body: comprasData, 
            theme: 'grid', 
            headStyles: { fillColor: [220, 53, 69] }, 
            styles: { fontSize: 8 } 
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
        const totalCompras = comprasFiltradas.reduce((sum, c) => sum + c.total, 0);
        doc.setFontSize(10);
        doc.text('Total Compras: $' + totalCompras.toFixed(2), 14, yPos);
    }
    
    doc.save('FactuManager_Informe_' + new Date().toISOString().split('T')[0] + '.pdf');
    alert('PDF generado correctamente!');
    doc.text('TOTAL GENERAL VENTAS: $' + totalGeneralVentas.toFixed(2), 14, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 15;
    if (ventasFiltradas.length > 0) {
    const totalGeneralVentas = ventasFiltradas.reduce((sum, v) => sum + v.total, 0);
    doc.setFontSize(12);
    doc.setTextColor(40, 167, 69);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL GENERAL VENTAS: $' + totalGeneralVentas.toFixed(2), 14, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 15;
} else {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('No hay ventas en este periodo', 14, yPos);
    yPos += 15;
}
    if (yPos > 230) { 
        doc.addPage(); 
        yPos = 20; 
    }
    
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('Detalle de Ventas', 14, yPos);
    yPos += 10;
    
    if (ventasFiltradas.length > 0) {
        const ventasData = ventasFiltradas.map(v => [
            formatearFecha(v.fecha), 
            v.productoNombre, 
            v.cantidad, 
            v.tipo === 'efectivo' ? 'Efectivo' : 'Transf.', 
            '$' + v.total.toFixed(2)
        ]);
        
        doc.autoTable({ 
            startY: yPos, 
            head: [['Fecha', 'Producto', 'Cant.', 'Tipo', 'Total']], 
            body: ventasData, 
            theme: 'grid', 
            headStyles: { fillColor: [40, 167, 69] }, 
            styles: { fontSize: 8 } 
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
    }
    
    if (yPos > 230) { 
        doc.addPage(); 
        yPos = 20; 
    }
    
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('Compras', 14, yPos);
    yPos += 10;
    
    if (comprasFiltradas.length > 0) {
        const comprasData = comprasFiltradas.map(c => [
            formatearFecha(c.fecha), 
            c.productoNombre, 
            c.cantidad, 
            c.tipo === 'efectivo' ? 'Efectivo' : 'Transf.', 
            '$' + c.total.toFixed(2)
        ]);
        
        doc.autoTable({ 
            startY: yPos, 
            head: [['Fecha', 'Producto', 'Cant.', 'Tipo', 'Total']], 
            body: comprasData, 
            theme: 'grid', 
            headStyles: { fillColor: [220, 53, 69] }, 
            styles: { fontSize: 8 } 
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
        const totalCompras = comprasFiltradas.reduce((sum, c) => sum + c.total, 0);
        doc.setFontSize(10);
        doc.text('Total Compras: $' + totalCompras.toFixed(2), 14, yPos);
    }
    
    doc.save('FactuManager_Informe_' + new Date().toISOString().split('T')[0] + '.pdf');
    alert('PDF generado correctamente!');
}