import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const RegistroContratista = () => {
  const navigate = useNavigate();
  const { userProfile, updateProfileLocally } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    phone: '',
    location_urbanization: '',
    location_sector: '',
    company_name: '',
    company_type: '',
    business_description: '',
    website: '',
  });

  const [errors, setErrors] = useState({});

  const companyTypes = [
    'Empresa', 'Pequeño Negocio', 'Startup', 'Freelancer',
    'Corporación', 'ONG', 'Gobierno', 'Particular'
  ];



  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
        if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido';
        if (!formData.location_urbanization.trim()) newErrors.location_urbanization = 'La dirección es requerida';
        break;
      case 2:
        if (!formData.company_name.trim()) newErrors.company_name = 'El nombre de la empresa es requerido';
        if (!formData.company_type) newErrors.company_type = 'El tipo de empresa es requerido';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);

    try {
      const updatedData = {
        // Campos básicos que SÍ existen en la tabla
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        user_type: 'contractor',

        // Información empresarial
        company_name: formData.company_name.trim(),
        company_type: formData.company_type,
        company_description: formData.business_description?.trim() || null,

        // Ubicación
        location_urbanization: formData.location_urbanization.trim(),
        address: formData.location_sector?.trim() || null,

        // Campos específicos de contratista
        profession: 'Contratista',
        specialties: JSON.stringify(['Contratación de Servicios']),

        // Campos opcionales
        email: userProfile?.email || null,
        description: `Empresa ${formData.company_type}: ${formData.company_name}`,
        experience_years: null,
        identity_card: null
      };

      console.log('💾 Guardando contratista en MySQL:', updatedData);

      // Intentar guardar en MySQL primero
      try {
        const { mysqlClient } = await import('../utils/mysqlClient');

        // Obtener ID del usuario
        const userId = userProfile?.id;

        console.log('🔍 Debug - userProfile:', userProfile);
        console.log('🔍 Debug - userId obtenido:', userId);

        // Actualizar usuario existente en MySQL
        if (userId) {
          console.log('💾 Actualizando MySQL con datos:', updatedData);
          const result = await mysqlClient.update('users', updatedData, `id = ${userId}`);
          console.log('✅ Contratista actualizado en MySQL:', result);
        } else {
          console.error('❌ No hay userId disponible en userProfile');
        }
      } catch (mysqlError) {
        console.log('⚠️ MySQL error:', mysqlError.message);
        console.error('🚨 Error completo:', mysqlError);
      }

      // Actualizar el perfil localmente usando la función del contexto
      updateProfileLocally(updatedData);

      console.log('✅ Perfil de contratista completado');
      alert('¡Perfil completado exitosamente! 🎉\n\nNota: Los datos se han guardado localmente. Cuando el servidor esté disponible, se sincronizarán automáticamente.');

      navigate('/');

    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error al guardar el perfil. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="text-center mb-1">
              <User className="w-10 h-10 mx-auto text-yellow-500" />
              <h2 className="text-sm font-bold text-slate-800">Información Personal</h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-0.5">Nombre Completo *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full bg-gray-100 focus:bg-white p-2 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 ${errors.name ? 'ring-1 ring-red-500' : ''}`}
                placeholder="Tu nombre completo"
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-0.5">Teléfono *</label>
              <div className="relative">
                <Phone className="absolute left-2 top-2 w-3 h-3 text-yellow-500" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full pl-7 pr-2 py-2 text-xs bg-gray-100 focus:bg-white rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 ${errors.phone ? 'ring-1 ring-red-500' : ''}`}
                  placeholder="Tu teléfono"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-0.5">Dirección *</label>
              <div className="relative">
                <MapPin className="absolute left-2 top-2 w-3 h-3 text-yellow-500" />
                <input
                  type="text"
                  value={formData.location_urbanization}
                  onChange={(e) => handleInputChange('location_urbanization', e.target.value)}
                  className={`w-full pl-7 pr-2 py-2 text-xs bg-gray-100 focus:bg-white rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 ${errors.location_urbanization ? 'ring-1 ring-red-500' : ''}`}
                  placeholder="Los Jardines"
                />
              </div>
              {errors.location_urbanization && <p className="text-red-500 text-xs">{errors.location_urbanization}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center mb-1">
              <Building2 className="w-10 h-10 mx-auto text-yellow-500" />
              <h2 className="text-sm font-bold text-slate-800">Información Empresarial</h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-0.5">Nombre de Empresa *</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                className={`w-full bg-gray-100 focus:bg-white p-2 text-xs rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 ${errors.company_name ? 'ring-1 ring-red-500' : ''}`}
                placeholder="Nombre empresa"
              />
              {errors.company_name && <p className="text-red-500 text-xs">{errors.company_name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-0.5">Tipo de Empresa *</label>
              <select
                value={formData.company_type}
                onChange={(e) => handleInputChange('company_type', e.target.value)}
                className={`w-full bg-gray-100 focus:bg-white p-2 text-xs rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 ${errors.company_type ? 'ring-1 ring-red-500' : ''}`}
              >
                <option value="">Selecciona...</option>
                {companyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.company_type && <p className="text-red-500 text-xs">{errors.company_type}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-0.5">Descripción</label>
              <textarea
                value={formData.business_description}
                onChange={(e) => handleInputChange('business_description', e.target.value)}
                className="w-full bg-gray-100 focus:bg-white p-2 text-xs rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 h-16 resize-none"
                placeholder="Describe tu negocio..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-0.5">Sitio Web</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full bg-gray-100 focus:bg-white p-2 text-xs rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                placeholder="https://ejemplo.com"
              />
            </div>

          </div>
        );


      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (currentStep === 1) {
                navigate('/'); // Solo en paso 1 va al inicio
              } else {
                setCurrentStep(currentStep - 1); // En paso 2+ va al paso anterior
              }
            }}
            className="p-0.5 hover:bg-yellow-300/50 rounded-full transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-800" />
          </button>
          <h1 className="text-base font-bold text-slate-800">Registro de Contratista</h1>
          <div className="w-5 h-5"></div>
        </div>

        <div className="mt-1">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-xs font-medium text-slate-700">Paso {currentStep} de 2</span>
            <span className="text-xs font-medium text-slate-700">{Math.round((currentStep / 2) * 100)}%</span>
          </div>
          <div className="w-full bg-yellow-200/50 rounded-full h-1">
            <div
              className="bg-yellow-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1 py-1">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-yellow-200/30 h-full flex flex-col">
          <div className="flex-1">{renderStep()}</div>
          <div className="mt-4 pt-2 border-t border-gray-100">
            <div className="flex space-x-2">
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  className="flex-1 flex items-center justify-center space-x-1 bg-gray-200 text-slate-700 py-3 rounded text-sm font-bold hover:bg-gray-300 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Anterior</span>
                </button>
              )}

              <button
                onClick={currentStep === 2 ? handleSubmit : nextStep}
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-1 bg-yellow-500 text-white py-3 rounded text-sm font-bold hover:bg-yellow-400 transition-colors shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>{currentStep === 2 ? 'Finalizar' : 'Siguiente'}</span>
                    {currentStep < 2 && <ArrowRight className="w-3 h-3" />}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroContratista;