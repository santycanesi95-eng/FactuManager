/* ========================================== */
/* VARIABLES GLOBALES */
/* ========================================== */

// Arrays para almacenar productos y movimientos en memoria
let productos = [];
let movimientos = [];

// Establecer fecha actual por defecto cuando carga la página
window.addEventListener('DOMContentLoaded', function() {
    document.getElementById('fechaMovimiento').valueAsDate = new Date();
});

/* ========================================== */
/* FUNCIONES PARA GESTIÓN DE PRODUCTOS */
/* ========================================== */

/**
 * Agrega un nuevo producto al sistema
 */
function agregarProducto() {
    // Obtener valores del formulario
    const nombre = document.getElementById('nombreProducto').value.trim();
    const stockInicial = parseInt(document.getElementById('stockInicial').value) || 0;
    const stockActual = parseInt(document.getElementById('stockActual').value) || 0;
    const precioCosto = parseFloat(document.getElementById('precioCosto').value) || 0;
    const precioVenta = parseFloat(document.getElementById('precioVenta').value) || 0;
    const ventas = parseInt(document.getElementById('unidadesVendidas').value) || 0;

    // Validación: el nombre es obligatorio
    if (!nombre) {
        mostrarAlerta('alertProducto', 'Por favor ingrese el nombre del producto', 'danger');
        return;
    }

    // Crear objeto producto con todos los datos
    const producto = {
        id: Date.now(), // ID único basado en timestamp
        nombre,
        stockInicial,
        stockActual,
        precioCosto,
        precioVenta,
        ventas,
        totalVentas: ventas * precioVenta, // Cálculo automático
        porcentaje: precioCosto > 0 ? (((precioVenta - precioCosto) / precioCosto) * 100).toFixed(2) : 0 // % de ganancia
    };

    // Agregar producto al array
    productos.push(producto);
    
    // Actualizar interfaz
    limpiarFormularioProducto();
    actualizarTablaProductos();
    actualizarEstadisticasProductos();
    mostrarAlerta('alertProducto', '✅ Producto agregado correctamente', 'success');
}

/**
 * Elimina un producto por su ID
 */
function eliminarProducto(id) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        // Filtrar el array para quitar el producto con ese ID
        productos = productos.filter(p => p.id !== id);
        
        // Actualizar interfaz
        actualizarTablaProductos();
        actualizarEstadisticasProductos();
        mostrarAlerta('alertProducto', '✅ Producto eliminado correctamente', 'success');
    }
}

/**
 * Actualiza la tabla de productos en el HTML
 */
function actualizarTablaProductos() {
    const tbody = document.getElementById('tablaProductos');
    
    // Si no hay productos, mostrar mensaje
    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #6c757d;">No hay productos registrados</td></tr>';
        return;
    }

    // Generar filas de la tabla con los productos
    tbody.innerHTML = productos.map(p => `
        <tr>
            <td><strong>${p.nombre}</strong></td>
            <td>${p.stockInicial}</td>
            <td>${p.stockActual}</td>
            <td>$${p.precioCosto.toFixed(2)}</td>
            <td>$${p.precioVenta.toFixed(2)}</td>
            <td>${p.ventas}</td>
            <td><strong>$${p.totalVentas.toFixed(2)}</strong></td>
            <td><strong>${p.porcentaje}%</strong></td>
            <td><button class="btn btn-danger" onclick="eliminarProducto(${p.id})">Eliminar</button></td>
        </tr>
    `).join('');
}

/**
 * Calcula y actualiza las estadísticas de productos
 */
function actualizarEstadisticasProductos() {
    // Sumar todas las unidades en stock
    const totalUnidades = productos.reduce((sum, p) => sum + p.stockActual, 0);
    
    // Sumar todas las ventas totales en dinero
    const totalVentas = productos.reduce((sum, p) => sum + p.totalVentas, 0);
    
    // Extraer solo los stocks para calcular máximo y mínimo
    const stocks = productos.map(p => p.stockActual);
    const maxStock = stocks.length > 0 ? Math.max(...stocks) : 0;
    const minStock = stocks.length > 0 ? Math.min(...stocks) : 0;

    // Actualizar valores en el HTML
    document.getElementById('totalUnidades').textContent = totalUnidades;
    document.getElementById('totalVentas').textContent = '$' + totalVentas.toFixed(2);
    document.getElementById('maxStock').textContent = maxStock;
    document.getElementById('minStock').textContent = minStock;
}

/**
 * Limpia el formulario de productos
 */
function limpiarFormularioProducto() {
    document.getElementById('nombreProducto').value = '';
    document.getElementById('stockInicial').value = '';
    document.getElementById('stockActual').value = '';
    document.getElementById('precioCosto').value = '';
    document.getElementById('precioVenta').value = '';
    document.getElementById('unidadesVendidas').value = '';
}

/* ========================================== */
/* FUNCIONES PARA GESTIÓN DE MOVIMIENTOS */
/* ========================================== */

/**
 * Registra un nuevo movimiento (ingreso o gasto)
 */
function agregarMovimiento() {
    // Obtener valores del formulario
    const fecha = document.getElementById('fechaMovimiento').value;
    const descripcion = document.getElementById('descripcionMovimiento').value.trim();
    const tipo = document.getElementById('tipoMovimiento').value;
    const monto = parseFloat(document.getElementById('montoMovimiento').value) || 0;

    // Validación de campos
    if (!fecha || !descripcion || monto <= 0) {
        mostrarAlerta('alertMovimiento', 'Por favor complete todos los campos correctamente', 'danger');
        return;
    }

    // Crear objeto movimiento
    const movimiento = {
        id: Date.now(),
        fecha,
        descripcion,
        tipo,
        monto,
        saldo: calcularSaldoNuevo(monto, tipo) // Calcula el saldo acumulado
    };

    // Agregar movimiento al array
    movimientos.push(movimiento);
    
    // Actualizar interfaz
    limpiarFormularioMovimiento();
    actualizarTablaMovimientos();
    actualizarEstadisticasMovimientos();
    mostrarAlerta('alertMovimiento', '✅ Movimiento registrado correctamente', 'success');
}

/**
 * Calcula el nuevo saldo basado en el movimiento anterior
 */
function calcularSaldoNuevo(monto, tipo) {
    // Obtener saldo del último movimiento (o 0 si es el primero)
    const saldoAnterior = movimientos.length > 0 ? movimientos[movimientos.length - 1].saldo : 0;
    
    // Si es ingreso suma, si es gasto resta
    return tipo === 'ingreso' ? saldoAnterior + monto : saldoAnterior - monto;
}

/**
 * Elimina un movimiento por su ID
 */
function eliminarMovimiento(id) {
    if (confirm('¿Estás seguro de eliminar este movimiento?')) {
        // Filtrar el array para quitar el movimiento
        movimientos = movimientos.filter(m => m.id !== id);
        
        // Recalcular todos los saldos ya que dependen uno del otro
        recalcularSaldos();
        
        // Actualizar interfaz
        actualizarTablaMovimientos();
        actualizarEstadisticasMovimientos();
        mostrarAlerta('alertMovimiento', '✅ Movimiento eliminado correctamente', 'success');
    }
}

/**
 * Recalcula todos los saldos después de eliminar un movimiento
 */
function recalcularSaldos() {
    let saldoAcumulado = 0;
    movimientos.forEach(m => {
        // Recalcular saldo para cada movimiento
        saldoAcumulado = m.tipo === 'ingreso' ? saldoAcumulado + m.monto : saldoAcumulado - m.monto;
        m.saldo = saldoAcumulado;
    });
}

/**
 * Actualiza la tabla de movimientos en el HTML
 */
function actualizarTablaMovimientos() {
    const tbody = document.getElementById('tablaMovimientos');
    
    // Si no hay movimientos, mostrar mensaje
    if (movimientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #6c757d;">No hay movimientos registrados</td></tr>';
        return;
    }

    // Generar filas de la tabla
    tbody.innerHTML = movimientos.map(m => `
        <tr>
            <td>${formatearFecha(m.fecha)}</td>
            <td>${m.descripcion}</td>
            <td><span style="color: ${m.tipo === 'ingreso' ? '#28a745' : '#dc3545'}; font-weight: bold;">${m.tipo.toUpperCase()}</span></td>
            <td style="color: ${m.tipo === 'ingreso' ? '#28a745' : '#dc3545'}; font-weight: bold;">$${m.monto.toFixed(2)}</td>
            <td><strong>$${m.saldo.toFixed(2)}</strong></td>
            <td><button class="btn btn-danger" onclick="eliminarMovimiento(${m.id})">Eliminar</button></td>
        </tr>
    `).join('');
}

/**
 * Calcula y actualiza las estadísticas de movimientos
 */
function actualizarEstadisticasMovimientos() {
    // Filtrar y sumar solo los ingresos
    const totalIngresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
    
    // Filtrar y sumar solo los gastos
    const totalGastos = movimientos.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.monto, 0);
    
    // Obtener el saldo del último movimiento
    const saldoActual = movimientos.length > 0 ? movimientos[movimientos.length - 1].saldo : 0;

    // Actualizar valores en el HTML
    document.getElementById('totalIngresos').textContent = '$' + totalIngresos.toFixed(2);
    document.getElementById('totalGastos').textContent = '$' + totalGastos.toFixed(2);
    document.getElementById('saldoActual').textContent = '$' + saldoActual.toFixed(2);
}

/**
 * Limpia el formulario de movimientos
 */
function limpiarFormularioMovimiento() {
    document.getElementById('fechaMovimiento').valueAsDate = new Date();
    document.getElementById('descripcionMovimiento').value = '';
    document.getElementById('tipoMovimiento').value = 'ingreso';
    document.getElementById('montoMovimiento').value = '';
}

/**
 * Convierte fecha de formato YYYY-MM-DD a DD/MM/YYYY
 */
function formatearFecha(fecha) {
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
}

/* ========================================== */
/* FUNCIONES GENERALES */
/* ========================================== */

/**
 * Cambia entre pestañas (tabs)
 */
function openTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    // Remover clase "active" de todas las pestañas y contenidos
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    // Agregar clase "active" a la pestaña clickeada
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

/**
 * Muestra alertas temporales al usuario
 */
function mostrarAlerta(elementoId, mensaje, tipo) {
    const alertDiv = document.getElementById(elementoId);
    alertDiv.innerHTML = `<div class="alert alert-${tipo}">${mensaje}</div>`;
    
    // Ocultar alerta después de 3 segundos
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 3000);
}

/* ========================================== */
/* GENERACIÓN DE PDF */
/* ========================================== */

/**
 * Genera y descarga un PDF con todos los datos
 */
function generarPDF() {
    // Inicializar jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // ========== TÍTULO PRINCIPAL ==========
    doc.setFontSize(22);
    doc.setTextColor(102, 126, 234);
    doc.text('FactuManager - Informe Semanal', 105, 20, { align: 'center' });

    // Fecha del informe
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-AR')}`, 105, 28, { align: 'center' });

    let yPos = 40; // Posición vertical inicial

    // ========== SECCIÓN 1: PRODUCTOS ==========
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('📦 Productos', 14, yPos);
    yPos += 10;

    if (productos.length > 0) {
        // Preparar datos de productos para la tabla
        const productosData = productos.map(p => [
            p.nombre,
            p.stockInicial,
            p.stockActual,
            '$' + p.precioCosto.toFixed(2),
            '$' + p.precioVenta.toFixed(2),
            p.ventas,
            '$' + p.totalVentas.toFixed(2),
            p.porcentaje + '%'
        ]);

        // Crear tabla de productos
        doc.autoTable({
            startY: yPos,
            head: [['Producto', 'Stock Ini.', 'Stock Act.', 'P. Costo', 'P. Venta', 'Ventas', 'Total', '%']],
            body: productosData,
            theme: 'grid',
            headStyles: { fillColor: [102, 126, 234] },
            styles: { fontSize: 8 }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Calcular estadísticas de productos
        const totalUnidades = productos.reduce((sum, p) => sum + p.stockActual, 0);
        const totalVentas = productos.reduce((sum, p) => sum + p.totalVentas, 0);
        const stocks = productos.map(p => p.stockActual);
        const maxStock = Math.max(...stocks);
        const minStock = Math.min(...stocks);

        // Mostrar estadísticas
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.text(`Total Unidades: ${totalUnidades}`, 14, yPos);
        doc.text(`Total Ventas: $${totalVentas.toFixed(2)}`, 70, yPos);
        doc.text(`Stock MAX: ${maxStock}`, 130, yPos);
        doc.text(`Stock MIN: ${minStock}`, 170, yPos);
        yPos += 15;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('No hay productos registrados', 14, yPos);
        yPos += 15;
    }

    // ========== SECCIÓN 2: MOVIMIENTOS ==========
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('💰 Movimientos de Caja', 14, yPos);
    yPos += 10;

    if (movimientos.length > 0) {
        // Preparar datos de movimientos para la tabla
        const movimientosData = movimientos.map(m => [
            formatearFecha(m.fecha),
            m.descripcion,
            m.tipo.toUpperCase(),
            '$' + m.monto.toFixed(2),
            '$' + m.saldo.toFixed(2)
        ]);

        // Crear tabla de movimientos
        doc.autoTable({
            startY: yPos,
            head: [['Fecha', 'Descripción', 'Tipo', 'Monto', 'Saldo']],
            body: movimientosData,
            theme: 'grid',
            headStyles: { fillColor: [102, 126, 234] },
            styles: { fontSize: 8 }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Calcular estadísticas de movimientos
        const totalIngresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + m.monto, 0);
        const totalGastos = movimientos.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.monto, 0);
        const saldoFinal = movimientos[movimientos.length - 1].saldo;

        // Mostrar estadísticas
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.text(`Total Ingresos: $${totalIngresos.toFixed(2)}`, 14, yPos);
        doc.text(`Total Gastos: $${totalGastos.toFixed(2)}`, 80, yPos);
        doc.text(`Saldo Final: $${saldoFinal.toFixed(2)}`, 145, yPos);
    } else {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('No hay movimientos registrados', 14, yPos);
    }

    // ========== GUARDAR PDF ==========
    doc.save(`FactuManager_Informe_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.pdf`);
    
    alert('✅ PDF generado correctamente!');
}