import React from 'react';

const PhoneFrame = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="relative">
        {/* Marco exterior del teléfono */}
        <div className="bg-black rounded-[3rem] p-2 shadow-2xl">
          {/* Pantalla del teléfono */}
          <div className="bg-white rounded-[2.5rem] relative overflow-hidden" 
               style={{ width: '375px', height: '812px' }}>
            
{/* Notch superior */}
<div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black rounded-b-2xl z-50 flex items-center justify-between px-6"
     style={{ width: '160px', height: '28px' }}>
{/* Cámara */}
<div className="relative w-4 h-4 bg-gray-900 rounded-full shadow-md flex items-center justify-center">
  {/* Lente */}
  <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
  {/* Reflejo */}
  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full opacity-40"></div>
</div>  

{/* Speaker */}
  <div className="w-12 h-1.5 bg-gray-800 rounded-full"></div>
</div>

{/* Barra de estado */}
<div className="absolute top-0 left-0 right-0 h-12 bg-transparent z-40 flex justify-between items-center px-6 pt-3">
  {/* Hora */}
  <span className="text-gray-900 text-sm font-semibold">9:41</span>

  {/* Iconos de estado */}
  <div className="flex items-center space-x-2">
    {/* Señal */}
    <div className="flex items-end space-x-0.5">
      <div className="w-0.5 h-1 bg-gray-900 rounded-sm"></div>
      <div className="w-0.5 h-2 bg-gray-900 rounded-sm"></div>
      <div className="w-0.5 h-3 bg-gray-900 rounded-sm"></div>
      <div className="w-0.5 h-4 bg-gray-900 rounded-sm"></div>
    </div>

    {/* WiFi */}
    <div className="relative w-4 h-4 flex items-center justify-center">
      <div className="absolute bottom-0 w-1 h-1 bg-gray-900 rounded-full"></div>
      <div className="absolute w-3 h-3 border-2 border-gray-900 rounded-full opacity-60"></div>
      <div className="absolute w-5 h-5 border-2 border-gray-900 rounded-full opacity-30"></div>
    </div>

    {/* Batería */}
    <div className="relative flex items-center">
      <div className="w-6 h-3 border border-gray-900 rounded-sm flex items-center p-0.5">
        <div className="w-4 h-1.5 bg-gray-900 rounded-sm"></div>
      </div>
      <div className="w-0.5 h-1.5 bg-gray-900 rounded-r-sm ml-0.5"></div>
    </div>
  </div>
</div>


            {/* Contenido de la aplicación */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="w-full h-full pt-12">
                {children}
              </div>
            </div>

            {/* Indicador de home (barra inferior) */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black rounded-full"></div>
          </div>
        </div>

        {/* Botones laterales */}
        {/* Botón de volumen */}
        <div className="absolute left-0 top-32 w-1 h-8 bg-gray-600 rounded-l-lg"></div>
        <div className="absolute left-0 top-44 w-1 h-8 bg-gray-600 rounded-l-lg"></div>
        
        {/* Botón de encendido */}
        <div className="absolute right-0 top-36 w-1 h-12 bg-gray-600 rounded-r-lg"></div>
      </div>
    </div>
  );
};

export default PhoneFrame;