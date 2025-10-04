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
  ArrowRight,
  Upload,
  Home,
  Camera,
  Image,
  X
} from 'lucide-react';

const RegistroContratista = () => {
  const navigate = useNavigate();
  const { userProfile, updateProfileLocally } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [registrationType, setRegistrationType] = useState(''); // 'personal' o 'empresa'

  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    phone: '',
    location_urbanization: '',
    location_sector: '',
    profile_photo: null,
    company_name: '',
    company_type: '',
    business_description: '',
    // Paso 3: Ubicación detallada
    location_condominium: '',
    location_apartment_floor: '',
    location_apartment_number: '',
    location_house_number: '',
    location_quinta_number: '',
    // Paso 3: Documentos
    company_logo: null,
    business_license: null,
    id_scan_front: null,
    id_scan_back: null,
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

  const handleFileChange = (field, file) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  // Generar URL de vista previa para imágenes
  const getPreviewUrl = (file) => {
    if (file && file.type?.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  // Capturar foto de perfil
  const handlePhotoCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('profile_photo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'camera';
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

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!registrationType) newErrors.registrationType = 'Selecciona el tipo de registro';
        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
        if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido';
        if (!formData.location_urbanization.trim()) newErrors.location_urbanization = 'La dirección es requerida';
        break;
      case 2:
        // Solo valida si es tipo empresa
        if (registrationType === 'empresa') {
          if (!formData.company_name.trim()) newErrors.company_name = 'El nombre de la empresa es requerido';
          if (!formData.company_type) newErrors.company_type = 'El tipo de empresa es requerido';
        }
        break;
      case 3:
        // Paso 3 es opcional, no hay validaciones obligatorias
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      // Si es registro personal, saltar paso 2 (detalles empresa)
      if (currentStep === 1 && registrationType === 'personal') {
        setCurrentStep(3); // Ir directo al paso 3
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const prevStep = () => {
    // Si estamos en paso 3 y venimos de registro personal, volver al paso 1
    if (currentStep === 3 && registrationType === 'personal') {
      setCurrentStep(1);
    } else {
      setCurrentStep(prev => prev - 1);
    }
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

        // Ubicación básica
        location_urbanization: formData.location_urbanization.trim(),
        address: formData.location_sector?.trim() || null,

        // Ubicación detallada (Paso 3 - opcional)
        location_condominium: formData.location_condominium?.trim() || null,
        location_apartment_floor: formData.location_apartment_floor ? parseInt(formData.location_apartment_floor) : null,
        location_apartment_number: formData.location_apartment_number?.trim() || null,
        location_house_number: formData.location_house_number?.trim() || null,
        location_quinta_number: formData.location_quinta_number?.trim() || null,

        // Campos opcionales
        email: userProfile?.email || null,
        experience_years: null,
        identity_card: null,

        // Foto de perfil (base64)
        profile_photo_url: formData.profile_photo || null
      };

      // Solo agregar datos de empresa si es tipo "empresa"
      if (registrationType === 'empresa') {
        updatedData.company_name = formData.company_name.trim();
        updatedData.company_type = formData.company_type;
        updatedData.company_description = formData.business_description?.trim() || null;
        updatedData.profession = 'Contratista';
        updatedData.specialties = JSON.stringify(['Contratación de Servicios']);
        updatedData.description = `Empresa ${formData.company_type}: ${formData.company_name}`;
      } else {
        // Registro personal
        updatedData.company_name = null;
        updatedData.company_type = null;
        updatedData.company_description = null;
        updatedData.profession = 'Contratista Individual';
        updatedData.specialties = JSON.stringify(['Contratación de Servicios']);
        updatedData.description = `Contratista: ${formData.name}`;
      }

      // TODO: Subir archivos a storage cuando esté disponible
      // formData.company_logo, formData.business_license, etc.

      console.log('💾 Guardando contratista en MySQL:', updatedData);

      // Obtener ID del usuario
      const userId = userProfile?.id;

      if (!userId) {
        console.error('❌ No hay userId disponible en userProfile');
        alert('Error: No se puede identificar el usuario. Por favor, inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      // Intentar guardar en MySQL
      let saveSuccess = false;
      try {
        const { mysqlClient } = await import('../utils/mysqlClient');

        console.log('💾 Actualizando MySQL con datos:', updatedData);
        const result = await mysqlClient.update('users', updatedData, `id = ${userId}`);

        console.log('📊 Resultado de MySQL:', result);

        if (result.success) {
          console.log('✅ Contratista actualizado en MySQL correctamente');
          saveSuccess = true;
        } else {
          console.error('❌ Error en MySQL update:', result.error);
          throw new Error(result.error || 'Error al actualizar en base de datos');
        }
      } catch (mysqlError) {
        console.error('🚨 Error guardando en MySQL:', mysqlError);
        alert(`Error al guardar en la base de datos:\n${mysqlError.message}\n\nPor favor, verifica que el servidor esté disponible e inténtalo de nuevo.`);
        setLoading(false);
        return; // No continuar si falla el guardado
      }

      // Guardado exitoso en base de datos
      if (saveSuccess) {
        console.log('✅ Perfil de contratista completado y guardado en BD');
        alert('¡Perfil completado exitosamente! 🎉');

        // Recargar la página para que useAuth obtenga los datos actualizados desde la BD
        window.location.href = '/';
      }

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
          <div className="space-y-4">
            <div className="text-center mb-1">
              <User className="w-10 h-10 mx-auto text-yellow-500" />
              <h2 className="text-sm font-bold text-slate-800">Información Personal</h2>
            </div>

            {/* Tipo de registro */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">¿Cómo deseas registrarte? *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationType('personal');
                    if (errors.registrationType) {
                      setErrors(prev => ({ ...prev, registrationType: null }));
                    }
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    registrationType === 'personal'
                      ? 'border-yellow-500 bg-yellow-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-yellow-300'
                  }`}
                >
                  <User className={`w-6 h-6 mx-auto mb-1 ${registrationType === 'personal' ? 'text-yellow-600' : 'text-slate-400'}`} />
                  <p className={`text-xs font-bold ${registrationType === 'personal' ? 'text-yellow-700' : 'text-slate-600'}`}>
                    Personal
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Usuario común</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRegistrationType('empresa');
                    if (errors.registrationType) {
                      setErrors(prev => ({ ...prev, registrationType: null }));
                    }
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    registrationType === 'empresa'
                      ? 'border-yellow-500 bg-yellow-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-yellow-300'
                  }`}
                >
                  <Building2 className={`w-6 h-6 mx-auto mb-1 ${registrationType === 'empresa' ? 'text-yellow-600' : 'text-slate-400'}`} />
                  <p className={`text-xs font-bold ${registrationType === 'empresa' ? 'text-yellow-700' : 'text-slate-600'}`}>
                    Empresa
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Con datos comerciales</p>
                </button>
              </div>
              {errors.registrationType && <p className="text-red-500 text-xs mt-1">{errors.registrationType}</p>}
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

            {/* Foto de Perfil */}
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
                      type="button"
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
                      type="button"
                      onClick={handleCameraCapture}
                      className="flex-1 flex items-center justify-center space-x-1 text-xs bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-400 transition-colors"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Cámara</span>
                    </button>
                    <button
                      type="button"
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
          <div className="space-y-3">
            {/* Header compacto */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full mb-2 shadow-md">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-sm font-bold text-slate-800">Datos de tu Empresa</h2>
            </div>

            {/* Datos básicos - Compactos */}
            <div className="space-y-2">
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                className={`w-full bg-gray-100 focus:bg-white p-2 text-xs rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 ${errors.company_name ? 'ring-1 ring-red-500' : ''}`}
                placeholder="🏢 Nombre de empresa *"
              />
              {errors.company_name && <p className="text-red-500 text-xs -mt-1">{errors.company_name}</p>}

              <select
                value={formData.company_type}
                onChange={(e) => handleInputChange('company_type', e.target.value)}
                className={`w-full bg-gray-100 focus:bg-white p-2 text-xs rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 ${errors.company_type ? 'ring-1 ring-red-500' : ''}`}
              >
                <option value="">Tipo de empresa *</option>
                {companyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.company_type && <p className="text-red-500 text-xs -mt-1">{errors.company_type}</p>}

              <textarea
                value={formData.business_description}
                onChange={(e) => handleInputChange('business_description', e.target.value)}
                className="w-full bg-gray-100 focus:bg-white p-2 text-xs rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 h-14 resize-none"
                placeholder="Descripción breve del negocio..."
              />
            </div>

            {/* Documentos - Con vista previa */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 p-2.5 rounded-lg border border-yellow-200/50">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Upload className="w-3.5 h-3.5 text-yellow-600" />
                <h3 className="text-xs font-bold text-slate-800">Documentos (Opcional)</h3>
              </div>

              <div className="space-y-2">
                {/* Logo con vista previa */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700">Logo de Empresa</span>
                    {formData.company_logo && <span className="text-xs text-green-600">✓</span>}
                  </div>

                  {formData.company_logo && getPreviewUrl(formData.company_logo) ? (
                    <div className="relative">
                      <img
                        src={getPreviewUrl(formData.company_logo)}
                        alt="Vista previa logo"
                        className="w-full h-32 object-contain bg-white rounded-lg border-2 border-yellow-300 p-2"
                      />
                      <button
                        type="button"
                        onClick={() => handleFileChange('company_logo', null)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="border-2 border-dashed border-yellow-300 rounded-lg p-4 bg-white hover:bg-yellow-50 transition-colors">
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto text-yellow-500 mb-1" />
                          <p className="text-xs text-slate-600">
                            Haz clic para subir
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">PNG, JPG hasta 5MB</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('company_logo', e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Licencia comercial */}
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-slate-700">Licencia Comercial</span>
                    {formData.business_license && <span className="text-xs text-green-600">✓ {formData.business_license.name}</span>}
                  </div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange('business_license', e.target.files[0])}
                    className="w-full text-xs bg-white p-1 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 shadow-sm file:mr-2 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-xs file:bg-yellow-100 file:text-yellow-700"
                  />
                </div>
              </div>
            </div>

          </div>
        );

      case 3:
        return (
          <div className="space-y-3">
            {/* Header compacto */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full mb-2 shadow-md">
                <Home className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-sm font-bold text-slate-800">Ubicación Detallada</h2>
              <p className="text-xs text-slate-500 mt-0.5">Información adicional de tu ubicación</p>
            </div>

            {/* Ubicación detallada - Compacta */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 p-2.5 rounded-lg border border-yellow-200/50">
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-yellow-600" />
                <h3 className="text-xs font-bold text-slate-800">Datos Específicos de Ubicación</h3>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={formData.location_condominium}
                  onChange={(e) => handleInputChange('location_condominium', e.target.value)}
                  className="w-full bg-white p-1.5 text-xs rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 shadow-sm"
                  placeholder="🏢 Condominio o edificio"
                />

                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="number"
                    value={formData.location_apartment_floor}
                    onChange={(e) => handleInputChange('location_apartment_floor', e.target.value)}
                    className="w-full bg-white p-1.5 text-xs rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 shadow-sm"
                    placeholder="Piso"
                  />
                  <input
                    type="text"
                    value={formData.location_apartment_number}
                    onChange={(e) => handleInputChange('location_apartment_number', e.target.value)}
                    className="w-full bg-white p-1.5 text-xs rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 shadow-sm"
                    placeholder="Apto"
                  />
                  <input
                    type="text"
                    value={formData.location_house_number}
                    onChange={(e) => handleInputChange('location_house_number', e.target.value)}
                    className="w-full bg-white p-1.5 text-xs rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 shadow-sm"
                    placeholder="Casa"
                  />
                </div>

                <input
                  type="text"
                  value={formData.location_quinta_number}
                  onChange={(e) => handleInputChange('location_quinta_number', e.target.value)}
                  className="w-full bg-white p-1.5 text-xs rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 shadow-sm"
                  placeholder="🏘️ Quinta o número adicional"
                />
              </div>
            </div>

            {/* Cédula personal (para ambos tipos) */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 p-2.5 rounded-lg border border-yellow-200/50">
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="w-3.5 h-3.5 text-yellow-600" />
                <h3 className="text-xs font-bold text-slate-800">Documento de Identidad</h3>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <label className="block">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-slate-700">Cédula Frente</span>
                    {formData.id_scan_front && <span className="text-xs text-green-600">✓</span>}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('id_scan_front', e.target.files[0])}
                    className="w-full text-xs bg-white p-1.5 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 shadow-sm file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-xs file:bg-yellow-100 file:text-yellow-700 hover:file:bg-yellow-200"
                  />
                </label>

                <label className="block">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-slate-700">Cédula Reverso</span>
                    {formData.id_scan_back && <span className="text-xs text-green-600">✓</span>}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('id_scan_back', e.target.files[0])}
                    className="w-full text-xs bg-white p-1.5 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 shadow-sm file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-xs file:bg-yellow-100 file:text-yellow-700 hover:file:bg-yellow-200"
                  />
                </label>
              </div>
            </div>

            {/* Nota compacta */}
            <div className="bg-blue-50/50 px-2.5 py-2 rounded-lg border border-blue-200/50">
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-blue-700">💡 Tip:</span> Puedes completar esto después desde tu perfil
              </p>
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
            <span className="text-xs font-medium text-slate-700">
              Paso {currentStep === 3 && registrationType === 'personal' ? '2' : currentStep} de {registrationType === 'personal' ? '2' : '3'}
            </span>
            <span className="text-xs font-medium text-slate-700">
              {registrationType === 'personal'
                ? Math.round(((currentStep === 3 ? 2 : currentStep) / 2) * 100)
                : Math.round((currentStep / 3) * 100)
              }%
            </span>
          </div>
          <div className="w-full bg-yellow-200/50 rounded-full h-1">
            <div
              className="bg-yellow-600 h-1 rounded-full transition-all duration-300"
              style={{
                width: `${
                  registrationType === 'personal'
                    ? ((currentStep === 3 ? 2 : currentStep) / 2) * 100
                    : (currentStep / 3) * 100
                }%`
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1 py-1">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-yellow-200/30 h-full flex flex-col">
          <div className="flex-1">{renderStep()}</div>
          <div className="mt-4 pt-2 border-t border-gray-100">
            {/* Paso 3: Botones especiales con opción "Omitir" */}
            {currentStep === 3 ? (
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={prevStep}
                    className="flex-1 flex items-center justify-center space-x-1 bg-gray-200 text-slate-700 py-3 rounded text-sm font-bold hover:bg-gray-300 transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Anterior</span>
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center space-x-1 bg-yellow-500 text-white py-3 rounded text-sm font-bold hover:bg-yellow-400 transition-colors shadow-md disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      <span>Finalizar</span>
                    )}
                  </button>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full text-slate-600 text-xs py-2 hover:text-slate-800 transition-colors"
                >
                  Omitir este paso →
                </button>
              </div>
            ) : (
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
                  onClick={nextStep}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center space-x-1 bg-yellow-500 text-white py-3 rounded text-sm font-bold hover:bg-yellow-400 transition-colors shadow-md disabled:opacity-50"
                >
                  <span>Siguiente</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroContratista;