import React from 'react';
import { Calendar, DollarSign, Star, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import NotificationCenter from '../components/NotificationCenter';

const PanelTrabajador = ({ userProfile, socket, onNavigateToPost }) => {
  return (
    <div className="h-full bg-gray-100 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              ¡Hola, {userProfile.name}!
            </h1>
            <p className="text-slate-700 text-sm font-medium">
              {userProfile.profession || 'Trabajador independiente'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Centro de notificaciones */}
            <NotificationCenter
              userId={userProfile.id}
              userType="worker"
              onNavigateToPost={onNavigateToPost}
            />

            <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full border border-yellow-300">
              <Star className="w-4 h-4 text-slate-800 mr-1" />
              <span className="text-sm font-bold text-slate-800">
                {userProfile.rating || '5.0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Trabajos Hoy</p>
                <p className="text-2xl font-bold text-slate-800">3</p>
              </div>
              <Calendar className="w-8 h-8 text-slate-800" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Ingresos Mes</p>
                <p className="text-2xl font-bold text-slate-800">$2,400</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Estado del perfil */}
      <div className="px-4">
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-yellow-200/30">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-800">
              Estado del Perfil
            </h2>
            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
              userProfile.verification_status === 'verified' 
                ? 'bg-yellow-50 text-green-600 border-green-300'
                : userProfile.verification_status === 'pending'
                ? 'bg-yellow-50 text-slate-800 border-yellow-300'
                : 'bg-yellow-50 text-slate-700 border-yellow-300'
            }`}>
              {userProfile.verification_status === 'verified' ? 'Verificado' : 
               userProfile.verification_status === 'pending' ? 'Pendiente' : 'No verificado'}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm text-slate-600 font-medium">Información básica completa</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm text-slate-600 font-medium">Fotos de portfolio agregadas</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-slate-700 mr-2" />
              <span className="text-sm text-slate-600 font-medium">Verificación en proceso</span>
            </div>
          </div>
        </div>
      </div>


      {/* Estadísticas de rendimiento */}
      <div className="px-4">
        <h2 className="text-lg font-bold text-slate-800 mb-3">
          Rendimiento
        </h2>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200/30">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-lg font-bold text-slate-800">95%</p>
              <p className="text-xs text-slate-600 font-medium">Satisfacción</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-slate-800" />
              </div>
              <p className="text-lg font-bold text-slate-800">42</p>
              <p className="text-xs text-slate-600 font-medium">Trabajos completados</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-slate-800" />
              </div>
              <p className="text-lg font-bold text-slate-800">1.2h</p>
              <p className="text-xs text-slate-600 font-medium">Tiempo promedio</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanelTrabajador;