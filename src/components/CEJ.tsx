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
}

/**
 * Interfaz para la respuesta de la API
 */
interface IRespuestaAPI {
  Automatizacion: IResultadoExpediente[]; 
  // Si tu backend devuelve más propiedades, agrégalas aquí
}

interface ICSVRow {
  EXPEDIENTE?: string;
  // Agrega más campos según las columnas de tu CSV si fuese necesario
}

export default function CEJ() {
  // Estado que guarda el archivo CSV seleccionado
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Estado para controlar si se está haciendo algún request
  const [isLoading, setIsLoading] = useState(false);

  // Estado donde guardamos TODOS los resultados (sumatoria de lotes)
  const [resultados, setResultados] = useState<IResultadoExpediente[]>([]);

  // Estado para indicar si ya se procesaron todos los códigos
  const [completed, setCompleted] = useState(false);

  // Maneja el evento de selección del archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Al seleccionar un nuevo archivo, limpiamos resultados
    setResultados([]);
    setCompleted(false);

    const file = e.target.files?.[0] || null;
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      // Si no es CSV, lo descartamos
      setCsvFile(null);
    }
  };

  /**
   * Esta función divide un array en chunks (subarrays) de un tamaño dado.
   */
  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunkedArr: T[][] = [];
    let index = 0;
    while (index < array.length) {
      chunkedArr.push(array.slice(index, index + size));
      index += size;
    }
    return chunkedArr;
  };

  // Al hacer clic en "Revisar", parsear CSV, dividir en lotes y enviar al backend
  const handleRevisar = async () => {
    if (!csvFile) return;

    setIsLoading(true);
    setCompleted(false);

    // 1. Parsear el archivo CSV
    const text = await csvFile.text();
    const parsed = Papa.parse<ICSVRow>(text, { header: true });

    // 2. Extraemos los códigos
    const todosLosCodigos: string[] = [];
    if (Array.isArray(parsed.data)) {
      parsed.data.forEach((row: ICSVRow) => {
        if (row.EXPEDIENTE) {
          todosLosCodigos.push(row.EXPEDIENTE.trim());
        }
      });
    }

    // 3. Dividimos el array de códigos en lotes de 3
    const chunks = chunkArray(todosLosCodigos, 3);

    // 4. Para almacenar resultados acumulados de todos los lotes
    const resultadosAcumulados: IResultadoExpediente[] = [];

    // 5. Procesamos cada chunk de manera secuencial
    for (const chunk of chunks) {
      const bodyToSend = { codigos: chunk };

      try {
        // Llamada a la API con el chunk de 3 códigos
        const res = await fetch('http://143.198.35.3:5011/api/expedientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyToSend),
        });

        if (!res.ok) {
          throw new Error('Error en la respuesta del servidor');
        }

        // Convertimos la respuesta a JSON
        const data: IRespuestaAPI = await res.json();

        // Si la API te devuelve "Automatizacion" como array de expedientes
        if (Array.isArray(data.Automatizacion)) {
          resultadosAcumulados.push(...data.Automatizacion);
        }

        // (Opcional) Si quieres ir mostrando resultados a medida que llegan:
        // setResultados([...resultadosAcumulados]);
      } catch (error) {
        console.error('Error enviando/recibiendo datos:', error);
      }
    }

    // 6. Cuando terminamos de procesar TODOS los chunks, guardamos todo en el state
    setResultados(resultadosAcumulados);
    setIsLoading(false);
    setCompleted(true); // Marcamos que ya se completó
  };

  /**
   * Descarga un archivo XLSX con los datos de todos los expedientes acumulados.
   */
  const handleDescargarXLSX = () => {
    if (!resultados || resultados.length === 0) return;

    const dataParaExcel = resultados.map((exp) => ({
      Codigo: exp.codigo,
      Fecha: exp.fecha || '',
      Sumilla: exp.sumilla || '',
    }));

    const hoja = XLSX.utils.json_to_sheet(dataParaExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Resultado');
    const excelBuffer = XLSX.write(libro, {
      bookType: 'xlsx',
      type: 'array',
      cellDates: true,
    });

    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Resultado.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Renderiza una tabla con la lista de expedientes (cada uno con codigo, fecha, sumilla, etc.)
   */
  const renderTabla = (expedientes: IResultadoExpediente[]) => {
    if (!expedientes || expedientes.length === 0) {
      return null;
    }

    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Resultado</h2>
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
            <span className="text-xs text-blue-900 underline">Cambiar</span>
          </label>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex items-center space-x-4">
        {/* Botón Revisar */}
        <button
          onClick={handleRevisar}
          disabled={!csvFile}
          className={`
            px-6 py-2 rounded 
            ${
              csvFile
                ? 'bg-red-400 hover:bg-red-500 text-white'
                : 'bg-red-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          Revisar
        </button>

        {/* Botón Descargar XLSX */}
        <button
          onClick={handleDescargarXLSX}
          disabled={resultados.length === 0}
          className={`
            px-6 py-2 rounded
            ${
              resultados.length > 0
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

      {/* Tabla de resultados */}
      {!isLoading && resultados && renderTabla(resultados)}

      {/* Mensaje de completado */}
      {completed && (
        <div className="mt-4 text-green-600 font-bold text-lg">
          ¡Completado!
        </div>
      )}
    </div>
  );
}
