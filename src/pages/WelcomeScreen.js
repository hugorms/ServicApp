import React from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full bg-gray-100 flex flex-col justify-between">
      
      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        
        {/* Título Principal */}
        <div className="mb-8 text-center">
          <div className="bg-white rounded-2xl p-6 shadow-sm ">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                <svg className="w-7 h-7 text-slate-800" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">ServicApp</h1>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-yellow-300 to-yellow-400 mx-auto mb-3 rounded-full"></div>
            <p className="text-slate-600 text-sm font-medium">Conecta profesionales con oportunidades</p>
            <p className="text-slate-500 text-xs mt-1">Tu plataforma de confianza para servicios especializados</p>
          </div>
        </div>

        {/* Características principales */}
        <div className="space-y-3 mb-8 max-w-xs">
          <div className="bg-white  p-4 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-slate-800" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-slate-800 font-bold text-sm mb-1">Profesionales Certificados</h3>
                <p className="text-slate-600 text-xs leading-tight">Conecta con expertos verificados</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white  p-4 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-slate-800" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-slate-800 font-bold text-sm mb-1">Proceso Eficiente</h3>
                <p className="text-slate-600 text-xs leading-tight">Solicitudes rápidas y organizadas</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white  p-4 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-slate-800" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-slate-800 font-bold text-sm mb-1">Comunicación Directa</h3>
                <p className="text-slate-600 text-xs leading-tight">Plataforma segura y confiable</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="px-6 pb-8 space-y-3">
        <button
          onClick={() => navigate('/auth?mode=login')}
          className="w-full bg-yellow-400 text-slate-800 py-3 px-6 rounded-lg font-semibold text-base shadow-sm hover:bg-yellow-300 transition-colors"
        >
          Iniciar Sesión
        </button>
        
        <button
          onClick={() => navigate('/auth?mode=register')}
          className="w-full bg-yellow-400 text-slate-800 py-3 px-6 rounded-lg font-semibold text-base shadow-sm hover:bg-yellow-300 transition-colors"
        >
          Crear Cuenta
        </button>
        
        <p className="text-center text-gray-500 text-xs mt-4">
          Plataforma empresarial para profesionales
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;