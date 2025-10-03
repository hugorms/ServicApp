import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Phone, ArrowLeft, ArrowRight } from 'lucide-react';

const AgendaTrabajador = ({ userProfile, socket }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const mockAppointments = [
    {
      id: 1,
      time: '09:00',
      duration: '2h',
      client: 'Ana Martínez',
      service: 'Plomería - Reparación de tubería',
      location: 'Av. Principal 123, Apt 4B',
      phone: '+58 412-1234567',
      status: 'confirmed'
    },
    {
      id: 2,
      time: '14:30',
      duration: '1.5h',
      client: 'Roberto Silva',
      service: 'Electricidad - Instalación tomacorrientes',
      location: 'Calle 5ta con 8va, Casa 456',
      phone: '+58 424-7654321',
      status: 'pending'
    },
    {
      id: 3,
      time: '17:00',
      duration: '3h',
      client: 'Carmen López',
      service: 'Pintura - Sala y comedor',
      location: 'Urb. El Valle, Torre A-2',
      phone: '+58 414-9876543',
      status: 'confirmed'
    }
  ];

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            Mi Agenda
          </h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + Nuevo
          </button>
        </div>
      </div>

      {/* Selector de fecha */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-800 capitalize">
              {formatDate(selectedDate)}
            </h2>
          </div>
          
          <button 
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Lista de citas */}
      <div className="p-4">
        {mockAppointments.length > 0 ? (
          <div className="space-y-4">
            {mockAppointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{appointment.time}</p>
                      <p className="text-sm text-gray-600">{appointment.duration}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                    {appointment.status === 'confirmed' ? 'Confirmada' : 
                     appointment.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                  </span>
                </div>

                <div className="mb-3">
                  <h3 className="font-semibold text-gray-800 mb-1">{appointment.service}</h3>
                  <p className="text-gray-600 text-sm">Cliente: {appointment.client}</p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600">{appointment.location}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-600">{appointment.phone}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700">
                    Ver Detalles
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200">
                    Contactar Cliente
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No tienes citas para hoy
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Cuando tengas trabajos programados aparecerán aquí
            </p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              Ver Disponibilidad
            </button>
          </div>
        )}
      </div>

      {/* Resumen del día */}
      <div className="p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Resumen del Día</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">3</p>
              <p className="text-sm text-gray-600">Citas totales</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">6.5h</p>
              <p className="text-sm text-gray-600">Horas programadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">$450</p>
              <p className="text-sm text-gray-600">Ingresos estimados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendaTrabajador;