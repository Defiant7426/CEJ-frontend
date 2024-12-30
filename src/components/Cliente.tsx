import { useState } from 'react';
import axios from 'axios';

interface ProductoCompra {
    ID_PROD: number;
    NAME_PROD: string;
    COST: number;
    UNIT: string;
    AMOUNT: number;
    cantidadSolicitada: number;
}

interface InfoCompra {
    productos: ProductoCompra[];
    costoTotalVenta: number;
}

export default function Cliente() {
  const [ruc, setRuc] = useState('');
  const [nombre, setNombre] = useState('');
  const [cantidadAzucar, setCantidadAzucar] = useState('');
  const [cantidadArroz, setCantidadArroz] = useState('');
  const [cantidadFrejoles, setCantidadFrejoles] = useState('');
  const [mostrarInfo, setMostrarInfo] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [infoCompra, setInfoCompra] = useState<InfoCompra | null>(null);
  const unidades = 'kg';



  const handleComprar = async () => {
    setMensajeError('');
    setMostrarInfo(false);

    const idSales = ruc.substring(0, 3) + nombre.substring(0, 3);
    //const productosSolicitados = [];

    const productos = [
      { id: 1, cantidad: parseInt(cantidadAzucar) || 0 },
      { id: 2, cantidad: parseInt(cantidadArroz) || 0 },
      { id: 3, cantidad: parseInt(cantidadFrejoles) || 0 },
    ];

    try {
      // Obtener información de productos del almacén
      const productosInfo = await Promise.all(
        productos.map(async (producto) => {// 64.227.4.59
          if (producto.cantidad > 0) {
            const res = await axios.get(`http://64.227.4.59:3000/almacen/product/${producto.id}`);
            return { ...res.data, cantidadSolicitada: producto.cantidad };
          }
          return null;
        })
      );

      // Filtrar los productos solicitados
      const productosValidos = productosInfo.filter((p) => p);

      // Verificar disponibilidad de stock
      for (const producto of productosValidos) {
        if (producto.AMOUNT < producto.cantidadSolicitada) {
          setMensajeError(`No hay suficiente stock de ${producto.NAME_PROD}`);
          return;
        }
      }

      // Calcular costo total
      let costoTotalVenta = 0;
      productosValidos.forEach((producto) => {
        costoTotalVenta += producto.COST * producto.cantidadSolicitada;
      });

      // Crear venta
      await axios.post('http://64.227.4.59:3000/ventas/createSale', {
        RUC: ruc,
        NAME: nombre,
        COST_TOTAL: costoTotalVenta,
      });

      // Crear detalle de venta y actualizar almacén
      for (const producto of productosValidos) {
        const totalProducto = producto.COST * producto.cantidadSolicitada;

        // Crear detalle de venta
        await axios.post('http://64.227.4.59:3000/detallesVentas/createDetalle', {
          ID_SALES: idSales,
          ID_PROD: producto.ID_PROD,
          NAME_PROD: producto.NAME_PROD,
          UNIT: producto.UNIT,
          AMOUNT: producto.cantidadSolicitada,
          COST: producto.COST,
          TOTAL: totalProducto,
        });

        // Actualizar almacén
        await axios.post('http://64.227.4.59:3000/almacen/updateProduct', {
          ID_PROD: producto.ID_PROD,
          AMOUNT: producto.AMOUNT - producto.cantidadSolicitada,
        });
      }

      // Mostrar información de la compra
      setInfoCompra({
        productos: productosValidos,
        costoTotalVenta,
      });
      setMostrarInfo(true);
    } catch (error) {
      console.error(error);
      setMensajeError('Error al procesar la compra.');
    }
  };

  const isButtonDisabled = ruc === '' || nombre === '';

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-3/4 mt-4 space-x-4">
        <input
          type="text"
          placeholder="RUC"
          value={ruc}
          onChange={(e) => setRuc(e.target.value)}
          className="border rounded px-3 py-2 w-1/2"
        />
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="border rounded px-3 py-2 w-1/2"
        />
      </div>

      <div className="flex justify-around w-full mt-8">
        {/* Azúcar */}
        <div className="flex flex-col items-center">
          <img src="https://metroio.vtexassets.com/arquivos/ids/245275-800-auto?v=638173939626970000&width=800&height=auto&aspect=true" alt="Azúcar" className="w-40 h-40" />
          <div className="flex items-center mt-2">
            <input
              type="number"
              min="0"
              value={cantidadAzucar}
              onChange={(e) => setCantidadAzucar(e.target.value)}
              className="border rounded px-2 py-1 w-16"
            />
            <span className="ml-2">{unidades}</span>
          </div>
        </div>
        {/* Arroz */}
        <div className="flex flex-col items-center">
          <img src="https://www.tiendaperuonline.com/cdn/shop/products/Disenosintitulo_7f862ee8-8552-4ba7-8c69-4c8a3f9fccc8_1024x1024.png?v=1618327838" alt="Arroz" className="w-40 h-40" />
          <div className="flex items-center mt-2">
            <input
              type="number"
              min="0"
              value={cantidadArroz}
              onChange={(e) => setCantidadArroz(e.target.value)}
              className="border rounded px-2 py-1 w-16"
            />
            <span className="ml-2">{unidades}</span>
          </div>
        </div>
        {/* Frejoles */}
        <div className="flex flex-col items-center">
          <img src="https://www.tienda-peruana.com/1313/frejol-canario-frejoles-secos-peruanos-para-tacu-tacu-el-plebeyo-peru.jpg" alt="Frejoles" className="w-40 h-40" />
          <div className="flex items-center mt-2">
            <input
              type="number"
              min="0"
              value={cantidadFrejoles}
              onChange={(e) => setCantidadFrejoles(e.target.value)}
              className="border rounded px-2 py-1 w-16"
            />
            <span className="ml-2">{unidades}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleComprar}
        disabled={isButtonDisabled}
        className={`mt-8 bg-blue-500 text-white font-bold py-2 px-4 rounded ${
          isButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
        }`}
      >
        Comprar
      </button>

      {mensajeError && (
        <div className="mt-4 text-red-500">{mensajeError}</div>
      )}

      {mostrarInfo && infoCompra && (
        <div className="mt-8 w-3/4 bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-bold mb-4">Información de la compra</h2>
          <p>RUC: {ruc}</p>
          <p>Nombre: {nombre}</p>
          <ul>
            {infoCompra.productos.map((producto) => (
              <li key={producto.ID_PROD} className="mb-2">
                <strong>{producto.NAME_PROD}</strong>: {producto.cantidadSolicitada} {unidades} x ${producto.COST} = ${producto.COST * producto.cantidadSolicitada}
              </li>
            ))}
          </ul>
          <p className="mt-4 font-bold">Costo Total: ${infoCompra.costoTotalVenta}</p>
        </div>
      )}
    </div>
  );
}