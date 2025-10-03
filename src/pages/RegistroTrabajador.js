import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { mysql } from '../utils/mysqlClient';
import ProfessionSelector from '../components/ProfessionSelector';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  Camera,
  ArrowRight,
  Image,
  X
} from 'lucide-react';

const RegistroTrabajador = () => {
  const navigate = useNavigate();
  const { userProfile, updateProfileLocally } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Paso 1: Información básica
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    phone: '',
    location_zones: '',
    profile_photo: null,

    // Paso 2: Información profesional (NUEVO SISTEMA)
    professions: [], // Array de {profession, specialties, custom_specialty, experience_years, experience_description}
    certifications: '',
    portfolio_photos: []
  });

  const [errors, setErrors] = useState({});
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Funciones para manejo de foto de perfil
  const handlePhotoCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleInputChange('profile_photo', e.target.result);
        setShowPhotoOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'camera'; // Esto activa la cámara directamente
    input.onchange = handlePhotoCapture;
    input.click();
  };

  const handleGallerySelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = handlePhotoCapture;
    input.click();
  };

  const removePhoto = () => {
    handleInputChange('profile_photo', null);
  };

  // Funciones para manejo del portafolio
  const handlePortfolioCapture = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const currentPhotos = formData.portfolio_photos || [];
          handleInputChange('portfolio_photos', [...currentPhotos, e.target.result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handlePortfolioCamera = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'camera';
    input.multiple = true;
    input.onchange = handlePortfolioCapture;
    input.click();
  };

  const handlePortfolioGallery = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = handlePortfolioCapture;
    input.click();
  };

  const removePortfolioPhoto = (index) => {
    const currentPhotos = [...formData.portfolio_photos];
    currentPhotos.splice(index, 1);
    handleInputChange('portfolio_photos', currentPhotos);
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
        if (!formData.email.trim()) newErrors.email = 'El correo es requerido';
        if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido';
        if (!formData.location_zones.trim()) newErrors.location_zones = 'Las zonas de servicio son requeridas';
        break;
      case 2:
        if (!formData.professions || formData.professions.length === 0) {
          newErrors.professions = 'Selecciona al menos una profesión';
        }
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
      // Obtener la primera profesión como profesión principal
      const mainProfession = formData.professions.length > 0
        ? formData.professions[0].profession
        : 'Servicios Generales';

      const updatedData = {
        // Campos básicos que SÍ existen en la tabla
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        user_type: 'worker',
        profile_completed: 1, // ✅ IMPORTANTE: Marcar perfil como completado

        // Información profesional (NUEVO SISTEMA)
        profession: mainProfession,
        professions: JSON.stringify(formData.professions), // Guardar array completo con experiencia por profesión

        // Campos de experiencia (extraer del primer profesión como backup)
        experience_years: formData.professions[0]?.experience_years
          ? parseInt(formData.professions[0].experience_years.split('-')[0])
          : null,
        description: formData.professions[0]?.experience_description?.trim() || null,

        // Ubicación
        location_urbanization: formData.location_zones?.trim() || null,

        // Fotos y portafolio
        profile_photo_url: formData.profile_photo || null,
        portfolio_urls: JSON.stringify(formData.portfolio_photos || []),

        // Certificaciones adicionales
        identity_card: formData.certifications?.trim() || null
      };

      console.log('💾 Guardando trabajador en MySQL:', updatedData);

      // Intentar guardar en MySQL usando el endpoint correcto /api/users/:id
      try {
        const userId = userProfile?.id;
        const token = localStorage.getItem('token');

        console.log('🔍 Debug - userProfile:', userProfile);
        console.log('🔍 Debug - userId obtenido:', userId);
        console.log('🔍 Debug - token disponible:', !!token);

        if (!userId) {
          console.error('❌ No hay userId disponible en userProfile');
          throw new Error('Usuario no identificado');
        }

        if (!token) {
          console.error('❌ No hay token de autenticación');
          throw new Error('Sin autenticación');
        }

        // Actualizar usuario usando el endpoint correcto
        console.log('💾 Actualizando MySQL con datos:', updatedData);

        const response = await fetch(`http://localhost:3009/api/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedData)
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          throw new Error(result.error || 'Error actualizando perfil');
        }

        console.log('✅ Trabajador actualizado en MySQL:', result);
      } catch (mysqlError) {
        console.log('⚠️ MySQL error:', mysqlError.message);
        console.error('🚨 Error completo:', mysqlError);
        throw mysqlError; // Re-lanzar el error para que se capture en el catch principal
      }

      // Actualizar el perfil localmente usando la función del contexto
      updateProfileLocally(updatedData);

      console.log('✅ Perfil de trabajador completado');
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
              <h2 className="text-sm font-bold text-slate-800">Información Básica</h2>
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
              <label className="block text-xs font-bold text-slate-800 mb-0.5">Correo Electrónico *</label>
              <div className="relative">
                <Mail className="absolute left-2 top-2 w-3 h-3 text-yellow-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-7 pr-2 py-2 text-xs bg-gray-100 focus:bg-white rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 ${errors.email ? 'ring-1 ring-red-500' : ''}`}
                  placeholder="tu@correo.com"
                  readOnly
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              <p className="text-xs text-slate-500 mt-0.5">Correo con el que te registraste</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-0.5">Teléfono de Contacto *</label>
              <div className="relative">
                <Phone className="absolute left-2 top-2 w-3 h-3 text-yellow-500" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full pl-7 pr-2 py-2 text-xs bg-gray-100 focus:bg-white rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 ${errors.phone ? 'ring-1 ring-red-500' : ''}`}
                  placeholder="Tu teléfono de contacto"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-0.5">Ubicación/Zonas de Servicio *</label>
              <div className="relative">
                <MapPin className="absolute left-2 top-2 w-3 h-3 text-yellow-500" />
                <input
                  type="text"
                  value={formData.location_zones}
                  onChange={(e) => handleInputChange('location_zones', e.target.value)}
                  className={`w-full pl-7 pr-2 py-2 text-xs bg-gray-100 focus:bg-white rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 ${errors.location_zones ? 'ring-1 ring-red-500' : ''}`}
                  placeholder="Ej: Los Jardines, Piantini, Naco"
                />
              </div>
              {errors.location_zones && <p className="text-red-500 text-xs">{errors.location_zones}</p>}
              <p className="text-xs text-slate-500 mt-0.5">Zonas donde ofreces tus servicios</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">Foto de Perfil</label>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {formData.profile_photo ? (
                      <img
                        src={formData.profile_photo}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  {formData.profile_photo && (
                    <button
                      onClick={removePhoto}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex space-x-2 mb-1">
                    <button
                      onClick={handleCameraCapture}
                      className="flex-1 flex items-center justify-center space-x-1 text-xs bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-400 transition-colors"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Cámara</span>
                    </button>
                    <button
                      onClick={handleGallerySelect}
                      className="flex-1 flex items-center justify-center space-x-1 text-xs bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-400 transition-colors"
                    >
                      <Image className="w-3 h-3" />
                      <span>Galería</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Opcional pero recomendable</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center mb-1">
              <Briefcase className="w-10 h-10 mx-auto text-yellow-500" />
              <h2 className="text-sm font-bold text-slate-800">Información Profesional</h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">Profesiones y Especialidades *</label>
              <ProfessionSelector
                value={formData.professions}
                onChange={(professions) => handleInputChange('professions', professions)}
                maxProfessions={3}
              />
              {errors.professions && <p className="text-red-500 text-xs mt-1">{errors.professions}</p>}
              <p className="text-xs text-slate-500 mt-1">Agrega profesiones, especialidades y experiencia específica</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-800 mb-1">Certificaciones/Títulos (Opcional)</label>
              <input
                type="text"
                value={formData.certifications}
                onChange={(e) => handleInputChange('certifications', e.target.value)}
                className="w-full bg-gray-100 focus:bg-white px-2 py-1.5 text-xs rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                placeholder="Ej: Certificado soldadura, Técnico electricista"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-800 mb-1">Portafolio de Trabajos (Opcional)</label>

              {/* Botones compactos */}
              <div className="flex space-x-1.5 mb-2">
                <button
                  onClick={handlePortfolioCamera}
                  className="flex-1 flex items-center justify-center gap-1 text-[11px] bg-yellow-500 text-white px-2 py-1.5 rounded hover:bg-yellow-400 transition-colors"
                >
                  <Camera className="w-3 h-3" />
                  <span>Cámara</span>
                </button>
                <button
                  onClick={handlePortfolioGallery}
                  className="flex-1 flex items-center justify-center gap-1 text-[11px] bg-blue-500 text-white px-2 py-1.5 rounded hover:bg-blue-400 transition-colors"
                >
                  <Image className="w-3 h-3" />
                  <span>Galería</span>
                </button>
              </div>

              {/* Grid de fotos compacto */}
              {formData.portfolio_photos && formData.portfolio_photos.length > 0 ? (
                <div className="grid grid-cols-4 gap-1.5">
                  {formData.portfolio_photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`Trabajo ${index + 1}`}
                        className="w-full h-16 object-cover rounded"
                      />
                      <button
                        onClick={() => removePortfolioPhoto(index)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded p-3 text-center">
                  <Camera className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                  <p className="text-[10px] text-slate-500">Sin fotos ({formData.portfolio_photos?.length || 0})</p>
                </div>
              )}
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
          <h1 className="text-base font-bold text-slate-800">Registro de Trabajador</h1>
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

export default RegistroTrabajador;