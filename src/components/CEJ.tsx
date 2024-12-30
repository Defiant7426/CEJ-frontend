import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Interfaz para cada elemento que nos devolverá la API.
 */
interface IResultadoExpediente {
  codigo: string;
  fecha: string | null;
  sumilla: string | null;
  // Si más adelante quieres un "nombre", puedes agregarlo aquí
}

interface ICSVRow {
    EXPEDIENTE?: string;
    // Agrega más campos según las columnas de tu CSV
  }

/**
 * Interfaz para la respuesta de la API
 */
interface IRespuestaAPI {
  Automatizacion: IResultadoExpediente[] | unknown;
  //Automatizacion2: IResultadoExpediente[] | unknown;
  //Automatizacion3: IResultadoExpediente[] | unknown;
}

export default function CEJ() {
  // Estado que guarda el archivo CSV seleccionado
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Estado para el "cargando..."
  const [isLoading, setIsLoading] = useState(false);

  // Estado donde guardamos el resultado que viene de la API
  const [resultados, setResultados] = useState<IRespuestaAPI | null>(null);

  // Maneja el evento de selección del archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResultados(null); // Limpiar resultados previos si hay
    const file = e.target.files?.[0] || null;
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      // Si no es CSV, lo descartamos
      setCsvFile(null);
    }
  };

  // Al hacer clic en "Revisar", parsear CSV, enviar al backend
  const handleRevisar = async () => {
    if (!csvFile) return;
    setIsLoading(true);

    // 1. Parsear el archivo CSV
    const text = await csvFile.text();
    const parsed = Papa.parse<ICSVRow>(text, { header: true }); 

    const codigos: string[] = [];
    if (Array.isArray(parsed.data)) {
      parsed.data.forEach((row: ICSVRow) => {
        // Ajusta el nombre de la columna según tu CSV
        if (row.EXPEDIENTE) {
          codigos.push(row.EXPEDIENTE.trim());
        }
      });
    }

    // 2. Generar el JSON que se enviará al backend
    const bodyToSend = {
      codigos
    };

    console.log('Enviando al backend:', bodyToSend);

    try {
      // 3. Enviar al endpoint
      const res = await fetch('/api/expedientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyToSend),
      });

      if (!res.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      // 4. Obtener la respuesta como JSON
      const data: IRespuestaAPI = await res.json();
      setResultados(data);
    } catch (error) {
      console.error('Error enviando/recibiendo datos:', error);
      // Podrías mostrar algún mensaje de error al usuario si gustas
      setResultados(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Descarga un archivo XLSX con los datos de Automatizacion1.
   */
  const handleDescargarXLSX = () => {
    if (!resultados) return;

    const expedientes = resultados.Automatizacion;
    if (!Array.isArray(expedientes) || expedientes.length === 0) {
      return;
    }

    // 1. Preparamos un array de objetos, con la forma que deseamos mostrar en Excel
    //    Por ejemplo, { Codigo, Fecha, Sumilla }.
    //    Opcionalmente, podrías añadir una columna Nombre si tuvieras ese dato.
    const dataParaExcel = expedientes.map((exp) => ({
      Codigo: exp.codigo,
      Fecha: exp.fecha || '',
      Sumilla: exp.sumilla || '',
    }));

    // 2. Crear un "worksheet" (hoja de trabajo) a partir de este array
    const hoja = XLSX.utils.json_to_sheet(dataParaExcel);

    // 3. Crear un "workbook" (libro)
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Resultado');

    // 4. Generar el binario en formato Excel
    //    El "write" te devuelve un arraybuffer o base64. En React, solemos usar "write" con 'array'
    const excelBuffer = XLSX.write(libro, {
      bookType: 'xlsx',
      type: 'array',
      // Para soportar mejor acentos y caracteres especiales
      cellDates: true,
    });

    // 5. Crear un blob a partir de ese ArrayBuffer
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    // 6. Forzar la descarga del archivo
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Resultado.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  /**
   * Descarga en CSV los datos de Automatizacion1.
   */
  const handleDescargarCSV = () => {
    if (!resultados) return;

    // Aseguramos que sea un array de IResultadoExpediente
    const expedientes = resultados.Automatizacion;
    if (!Array.isArray(expedientes) || expedientes.length === 0) {
      return;
    }

    // Cabeceras del CSV
    const cabeceras = ['Codigo', 'Fecha', 'Sumilla'];

    // Convertir a formato CSV (forma sencilla manual)
    const lineas = [cabeceras.join(',')]; // Primera línea con cabeceras
    expedientes.forEach((exp) => {
      const fila = [
        exp.codigo,
        exp.fecha || '',
        exp.sumilla ? exp.sumilla.replace(/(\r\n|\n|\r)/g, ' ') : '', 
        // reemp. saltos de línea si quieres
      ];
      lineas.push(fila.join(','));
    });

    const csvContent = lineas.join('\n');

    // Generar y descargar el archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Automatizacion1.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  /**
   * Renderiza una tabla dada la lista de expedientes (cada uno con codigo, fecha, sumilla, etc.)
   */
  const renderTabla = (titulo: string, expedientes: IResultadoExpediente[] | unknown) => {
    if (!Array.isArray(expedientes) || expedientes.length === 0) {
      // Si no es un array o está vacío, no renderizamos nada
      return null;
    }

    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">{titulo}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b">Nombre</th>
                <th className="py-2 px-4 border-b">Código</th>
                <th className="py-2 px-4 border-b">Fecha</th>
                <th className="py-2 px-4 border-b">Sumilla</th>
              </tr>
            </thead>
            <tbody>
              {expedientes.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {/* Nombre lo dejaremos vacío por ahora o tomado del CSV si se requiere más adelante */}
                  <td className="py-2 px-4 border-b"></td>
                  <td className="py-2 px-4 border-b">{item.codigo}</td>
                  <td className="py-2 px-4 border-b">{item.fecha || ''}</td>
                  <td className="py-2 px-4 border-b">{item.sumilla || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center p-8">
      <h1 className="text-2xl font-bold mb-6">CEJ - Automatización</h1>

      <p className="text-gray-600 text-center mb-4">
        El documento debe de ser un CSV donde contenga los códigos de expedientes
      </p>

      {/* Zona de carga del archivo */}
      {!csvFile ? (
        <div className="w-64 h-32 bg-blue-200 flex items-center justify-center mb-4">
          <label className="cursor-pointer px-4 py-2">
            <span className="text-lg text-gray-700 font-semibold">
              Subir documento...
            </span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      ) : (
        <div className="w-64 bg-blue-200 flex items-center justify-between px-4 py-2 mb-4">
          <div className="flex items-center space-x-2">
            {/* Ícono o texto */}
            <span className="text-blue-700 font-bold text-lg">&#128196;</span>
            <p className="text-gray-700">{csvFile.name}</p>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            {/* Ícono/Texto que indique que se puede reemplazar el archivo */}
            <span className="text-xs text-blue-900 underline">Cambiar</span>
          </label>
        </div>
      )}

    <div className="flex items-center space-x-4">

      {/* Botón Revisar */}
      <button
        onClick={handleRevisar}
        disabled={!csvFile}
        className={`
          px-6 py-2 rounded 
          ${csvFile ? 'bg-red-400 hover:bg-red-500 text-white' : 'bg-red-200 text-gray-400 cursor-not-allowed'}
        `}
      >
        Revisar
      </button>

      {/* Botón Descargar CSV */}
      <button
          onClick={handleDescargarXLSX}
          disabled={
            !resultados ||
            !Array.isArray(resultados.Automatizacion) ||
            resultados.Automatizacion.length === 0
          }
          className={`
            px-6 py-2 rounded
            ${
              resultados &&
              Array.isArray(resultados.Automatizacion) &&
              resultados.Automatizacion.length > 0
                ? 'bg-green-400 hover:bg-green-500 text-white'
                : 'bg-green-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          Descargar XLSX
        </button>
        </div>

      {/* Mensaje de "Cargando..." */}
      {isLoading && (
        <div className="mt-4 text-lg font-semibold">Cargando...</div>
      )}

      {/* Resultados */}
      {resultados && !isLoading && (
        <div className="w-full mt-8">
          {renderTabla('Resultado', resultados.Automatizacion)}
          {/* {renderTabla('Automatización 2', resultados.Automatizacion2)}
          {renderTabla('Automatización 3', resultados.Automatizacion3)} */}
        </div>
      )}
    </div>
  );
}
