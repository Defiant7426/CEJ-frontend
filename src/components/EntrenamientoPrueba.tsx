import { useState } from 'react';
import axios from 'axios';

/**
 * Componente principal que maneja las pestañas:
 * 1. Entrenamiento (con capas intermedias dinámicas)
 * 2. Prueba
 */
export default function EntrenamientoPrueba() {
  // Manejo de tabs
  const [activeTab, setActiveTab] = useState<'entrenamiento' | 'prueba'>('entrenamiento');

  // ***** ESTADOS PARA ENTRENAMIENTO *****
  const [clienteNombre, setClienteNombre] = useState('');
  const [modelo, setModelo] = useState('NLP');
  const [dataset, setDataset] = useState('MNIST');

  // Capas: la primera (784) y la última (10) son fijas y no se muestran como inputs modificables.
  // En `intermediateLayers`, guardamos SÓLO las capas intermedias.
  const [intermediateLayers, setIntermediateLayers] = useState<string[]>(['128']);

  // Mensaje de entrenamiento (status)
  const [mensajeEntrenamiento, setMensajeEntrenamiento] = useState('');

  // ***** ESTADOS PARA PRUEBA *****
  const [rutaPrueba, setRutaPrueba] = useState('');
  const [respuestaPrueba, setRespuestaPrueba] = useState('');

  // Enlace HTTP para entrenamiento
  const urlEntrenamiento = 'http://127.0.0.1:3000/entrenamiento/'

  // Enlace HTTP para prueba
  const urlPrueba = 'http://127.0.0.1:3000/prueba/'

  // ----------------------------------------------------------------------------
  // Handlers para entrenamiento
  // ----------------------------------------------------------------------------
  const handleEntrenar = async () => {
    if (!clienteNombre || !modelo || !dataset) {
      alert('Por favor completa todos los campos para entrenar.');
      return;
    }

    const nombreModelo = `${modelo}_${dataset}`;
    const archivoPesos = `${clienteNombre}_${modelo}`;

    // Construimos el string de capas. Ejemplo: 784/128/64/256/10
    const capasConcatenadas = ['784', ...intermediateLayers, '10'].join('/');

    const payload = {
      CLIENTE: clienteNombre,
      NOMBRE_MODELO: nombreModelo,
      ARCHIVO_PESOS: archivoPesos,
      CAPAS: capasConcatenadas,
    };

    try {
      setMensajeEntrenamiento('Entrenando, espere un momento por favor...');
      const response = await axios.post(urlEntrenamiento + '/createEntrenamiento', payload);

      // Suponemos que el servidor devuelve algo como { ruta: 'models/mi_modelo.h5' }
      const rutaModelo = response.data?.ruta || 'Ruta no proporcionada.';
      setMensajeEntrenamiento(`Modelo entrenado satisfactoriamente, ruta del modelo: ${rutaModelo}`);
    } catch (error) {
      console.error(error);
      setMensajeEntrenamiento('Ocurrió un error al entrenar el modelo.');
    }
  };

  // ----------------------------------------------------------------------------
  // Handlers para capas intermedias
  // ----------------------------------------------------------------------------
  const handleAddLayer = () => {
    setIntermediateLayers([...intermediateLayers, '128']);  // valor por defecto
  };

  const handleRemoveLayer = (index: number) => {
    // Evitar que se quede sin capas (pero si se permite 1 como mínimo, 
    // podríamos condicionar que no se borre si length === 1).
    if (intermediateLayers.length === 1) {
      alert('Debe existir al menos 1 capa intermedia');
      return;
    }

    const newLayers = intermediateLayers.filter((_, i) => i !== index);
    setIntermediateLayers(newLayers);
  };

  const handleLayerChange = (index: number, value: string) => {
    const newLayers = [...intermediateLayers];
    newLayers[index] = value;
    setIntermediateLayers(newLayers);
  };

  // ----------------------------------------------------------------------------
  // Handlers para prueba
  // ----------------------------------------------------------------------------
  const handleProbar = async () => {
    if (!rutaPrueba) {
      alert('Por favor ingresa la ruta del modelo a probar.');
      return;
    }

    try {
      setRespuestaPrueba('Probando modelo, por favor espera...');
      const response = await axios.post(urlPrueba + '/create', {
        RUTA: rutaPrueba
      });

      const resultado = response.data?.resultado || JSON.stringify(response.data);
      setRespuestaPrueba(`Resultado de la prueba: ${resultado}`);
    } catch (error) {
      console.error(error);
      setRespuestaPrueba('Error al probar el modelo.');
    }
  };

  // ----------------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------------
  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center p-8">
      {/* ***** Tabs ***** */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('entrenamiento')}
          className={`px-4 py-2 rounded shadow transition-colors duration-200 ${
            activeTab === 'entrenamiento' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-blue-100'
          }`}
        >
          Entrenamiento
        </button>
        <button
          onClick={() => setActiveTab('prueba')}
          className={`px-4 py-2 rounded shadow transition-colors duration-200 ${
            activeTab === 'prueba' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-blue-100'
          }`}
        >
          Prueba
        </button>
      </div>

      {activeTab === 'entrenamiento' && (
        <div className="w-full max-w-2xl bg-white rounded shadow-md p-6 space-y-6">
          <h1 className="text-2xl font-bold text-center">Entrenamiento</h1>

          {/* Nombre de usuario */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Nombre de usuario:</label>
            <input
              type="text"
              placeholder="Ej: Franklin"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Selección de modelo */}
          <div className="flex flex-col">
            <span className="font-semibold mb-2">Selecciona el modelo:</span>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="modelo"
                  value="NLP"
                  checked={modelo === 'NLP'}
                  onChange={() => setModelo('NLP')}
                />
                <span>NLP</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="modelo"
                  value="CNN"
                  checked={modelo === 'CNN'}
                  onChange={() => setModelo('CNN')}
                />
                <span>CNN</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="modelo"
                  value="GAN"
                  checked={modelo === 'GAN'}
                  onChange={() => setModelo('GAN')}
                />
                <span>GAN</span>
              </label>
            </div>
          </div>

          {/* Selección de dataset */}
          <div className="flex flex-col">
            <span className="font-semibold mb-2">Selecciona el dataset:</span>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="dataset"
                  value="MNIST"
                  checked={dataset === 'MNIST'}
                  onChange={() => setDataset('MNIST')}
                />
                <span>MNIST</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="dataset"
                  value="CIFAR"
                  checked={dataset === 'CIFAR'}
                  onChange={() => setDataset('CIFAR')}
                />
                <span>CIFAR</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="dataset"
                  value="DATASET_X"
                  checked={dataset === 'DATASET_X'}
                  onChange={() => setDataset('DATASET_X')}
                />
                <span>DATASET_X</span>
              </label>
            </div>
          </div>

          {/* Capas dinámicas */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Capas</h2>
            <p className="text-gray-500">
              La primera capa (784) y la última capa (10) son fijas. 
              Puedes añadir o remover capas intermedias libremente.
            </p>

            {/* Capa 1 (fija) */}
            <div className="flex items-center space-x-2">
              <label className="font-semibold w-20 text-right">Capa 1:</label>
              <input
                type="text"
                value="784"
                className="border bg-gray-100 rounded px-2 py-1 text-center w-24"
                disabled
              />
            </div>

            {/* Capas Intermedias */}
            {intermediateLayers.map((layer, index) => (
              <div key={index} className="flex items-center space-x-2">
                <label className="font-semibold w-20 text-right">Capa {index + 2}:</label>
                <input
                  type="number"
                  value={layer}
                  onChange={(e) => handleLayerChange(index, e.target.value)}
                  className="border rounded px-2 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={() => handleRemoveLayer(index)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Quitar
                </button>
              </div>
            ))}

            {/* Botón para agregar capas */}
            <div className="text-right">
              <button
                onClick={handleAddLayer}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                Agregar capa
              </button>
            </div>

            {/* Capa 5 (fija) */}
            <div className="flex items-center space-x-2">
              <label className="font-semibold w-20 text-right">Capa final:</label>
              <input
                type="text"
                value="10"
                className="border bg-gray-100 rounded px-2 py-1 text-center w-24"
                disabled
              />
            </div>
          </div>

          {/* Botón entrenar */}
          <div className="pt-4 flex justify-center">
            <button
              onClick={handleEntrenar}
              disabled={!clienteNombre}
              className={`bg-blue-600 text-white font-bold py-2 px-6 rounded shadow hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50`}
            >
              Entrenar
            </button>
          </div>

          {/* Mensaje de entrenamiento */}
          {mensajeEntrenamiento && (
            <div className="text-center mt-4 text-lg font-semibold text-blue-700">
              {mensajeEntrenamiento}
            </div>
          )}
        </div>
      )}

      {activeTab === 'prueba' && (
        <div className="w-full max-w-md bg-white rounded shadow-md p-6 space-y-6">
          <h1 className="text-2xl font-bold text-center">Prueba</h1>
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Ruta del modelo:</label>
            <input
              type="text"
              placeholder="Ej: models/tu_modelo.h5"
              value={rutaPrueba}
              onChange={(e) => setRutaPrueba(e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleProbar}
              disabled={!rutaPrueba}
              className={`bg-green-600 text-white font-bold py-2 px-6 rounded shadow hover:bg-green-700 transition-colors duration-200 disabled:opacity-50`}
            >
              Probar
            </button>
          </div>

          {respuestaPrueba && (
            <div className="text-center mt-4 text-lg font-semibold text-green-700">
              {respuestaPrueba}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
