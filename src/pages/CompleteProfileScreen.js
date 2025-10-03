import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, Briefcase, Award, FileText,
  Camera, Save, X, Building, Home, Upload, CheckCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../utils/apiClient';

const CompleteProfileScreen = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    // Campos básicos
    name: '',
    email: '',
    phone: '',
    address: '',

    // Campos de trabajador
    profession: '',
    specialties: '',
    identity_card: '',
    experience_years: '',
    description: '',

    // Campos de contratista
    company_name: '',
    company_type: '',
    company_description: '',

    // Ubicación detallada
    location_urbanization: '',
    location_condominium: '',
    location_apartment_floor: '',
    location_apartment_number: '',
    location_house_number: '',
    location_quinta_number: '',

    // Archivos (Base64)
    profile_photo_url: '',
    identity_card_url: '',
    portfolio_urls: '',
    company_logo_url: '',
    business_license_url: '',
    id_scan_front_url: '',
    id_scan_back_url: '',
    facial_scan_url: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        profession: userProfile.profession || '',
        specialties: typeof userProfile.specialties === 'string' ? userProfile.specialties : JSON.stringify(userProfile.specialties || []),
        identity_card: userProfile.identity_card || '',
        experience_years: userProfile.experience_years || '',
        description: userProfile.description || '',
        company_name: userProfile.company_name || '',
        company_type: userProfile.company_type || '',
        company_description: userProfile.company_description || '',
        location_urbanization: userProfile.location_urbanization || '',
        location_condominium: userProfile.location_condominium || '',
        location_apartment_floor: userProfile.location_apartment_floor || '',
        location_apartment_number: userProfile.location_apartment_number || '',
        location_house_number: userProfile.location_house_number || '',
        location_quinta_number: userProfile.location_quinta_number || '',
        profile_photo_url: userProfile.profile_photo_url || '',
        identity_card_url: userProfile.identity_card_url || '',
        portfolio_urls: userProfile.portfolio_urls || '',
        company_logo_url: userProfile.company_logo_url || '',
        business_license_url: userProfile.business_license_url || '',
        id_scan_front_url: userProfile.id_scan_front_url || '',
        id_scan_back_url: userProfile.id_scan_back_url || '',
        facial_scan_url: userProfile.facial_scan_url || ''
      });
    }
  }, [userProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMessage({ type: '', text: '' });
  };

  const handleFileChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen no debe superar 5MB' });
      return;
    }

    // Convertir a Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [fieldName]: reader.result
      }));
      setMessage({ type: 'success', text: 'Imagen cargada correctamente' });
    };
    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Error al cargar la imagen' });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Preparar datos para enviar
      const dataToSend = { ...formData };

      // Convertir specialties a JSON si es string
      if (typeof dataToSend.specialties === 'string' && dataToSend.specialties) {
        try {
          dataToSend.specialties = JSON.parse(dataToSend.specialties);
        } catch {
          dataToSend.specialties = dataToSend.specialties.split(',').map(s => s.trim());
        }
      }

      // Actualizar perfil via API
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3009/api/users/${userProfile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        setMessage({ type: 'success', text: '✅ Perfil actualizado exitosamente' });

        // Actualizar userProfile en el contexto
        if (updateUserProfile) {
          updateUserProfile(result.data);
        }

        setTimeout(() => {
          navigate('/app');
        }, 1500);
      } else {
        throw new Error(result.error || 'Error al actualizar perfil');
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setMessage({ type: 'error', text: error.message || 'Error al actualizar perfil' });
    } finally {
      setLoading(false);
    }
  };

  const isWorker = userProfile?.user_type === 'worker';
  const isContractor = userProfile?.user_type === 'contractor';

  const totalSteps = isWorker ? 4 : 3;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-t-xl p-6 text-slate-800">
          <h1 className="text-2xl font-bold">Completar Perfil</h1>
          <p className="text-sm mt-1">Paso {currentStep} de {totalSteps}</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white px-6 py-3">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mx-6 mt-4 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-b-xl shadow-lg">

          {/* Paso 1: Información Básica */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Información Básica</h2>

              {/* Foto de Perfil */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mb-3">
                  {formData.profile_photo_url ? (
                    <img src={formData.profile_photo_url} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2 bg-yellow-500 text-slate-800 rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm font-medium">Subir Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'profile_photo_url')}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  placeholder="Ej: +58 414 1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  placeholder="Dirección completa"
                />
              </div>
            </div>
          )}

          {/* Paso 2: Ubicación Detallada */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Ubicación Detallada</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Urbanización</label>
                <input
                  type="text"
                  name="location_urbanization"
                  value={formData.location_urbanization}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Conjunto Residencial / Condominio</label>
                <input
                  type="text"
                  name="location_condominium"
                  value={formData.location_condominium}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Piso</label>
                  <input
                    type="number"
                    name="location_apartment_floor"
                    value={formData.location_apartment_floor}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nº Apartamento</label>
                  <input
                    type="text"
                    name="location_apartment_number"
                    value={formData.location_apartment_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nº Casa</label>
                  <input
                    type="text"
                    name="location_house_number"
                    value={formData.location_house_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nº Quinta</label>
                  <input
                    type="text"
                    name="location_quinta_number"
                    value={formData.location_quinta_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Información Profesional (Trabajador) */}
          {currentStep === 3 && isWorker && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Información Profesional</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Profesión</label>
                <input
                  type="text"
                  name="profession"
                  value={formData.profession}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  placeholder="Ej: Electricista, Plomero, Carpintero"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Especialidades (separadas por coma)</label>
                <input
                  type="text"
                  name="specialties"
                  value={formData.specialties}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  placeholder="Ej: Instalación eléctrica, Reparaciones, Mantenimiento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Años de Experiencia</label>
                <input
                  type="number"
                  name="experience_years"
                  value={formData.experience_years}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cédula de Identidad</label>
                <input
                  type="text"
                  name="identity_card"
                  value={formData.identity_card}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  placeholder="V-12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción / Sobre mí</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  placeholder="Cuéntanos sobre tu experiencia y habilidades..."
                />
              </div>
            </div>
          )}

          {/* Paso 3: Información de Empresa (Contratista) */}
          {currentStep === 3 && isContractor && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Información de Empresa</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Empresa</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Empresa</label>
                <select
                  name="company_type"
                  value={formData.company_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                >
                  <option value="">Seleccionar...</option>
                  <option value="individual">Persona Natural</option>
                  <option value="company">Empresa</option>
                  <option value="cooperative">Cooperativa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción de la Empresa</label>
                <textarea
                  name="company_description"
                  value={formData.company_description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  placeholder="Describe tu empresa, servicios que ofrece, etc..."
                />
              </div>

              {/* Logo de Empresa */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Logo de la Empresa</label>
                <div className="flex items-center gap-4">
                  {formData.company_logo_url && (
                    <img src={formData.company_logo_url} alt="Logo" className="w-16 h-16 object-cover rounded-lg" />
                  )}
                  <label className="cursor-pointer px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Subir Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'company_logo_url')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Paso 4: Documentos (Solo Trabajador) */}
          {currentStep === 4 && isWorker && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Documentos y Verificación</h2>

              <div className="space-y-3">
                {/* Cédula Frontal */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cédula (Frontal)</label>
                  <label className="cursor-pointer w-full px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">{formData.id_scan_front_url ? '✓ Cargada' : 'Subir imagen'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'id_scan_front_url')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Cédula Trasera */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cédula (Trasera)</label>
                  <label className="cursor-pointer w-full px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">{formData.id_scan_back_url ? '✓ Cargada' : 'Subir imagen'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'id_scan_back_url')}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Selfie */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Foto de Verificación (Selfie)</label>
                  <label className="cursor-pointer w-full px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    <span className="text-sm">{formData.facial_scan_url ? '✓ Cargada' : 'Tomar foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={(e) => handleFileChange(e, 'facial_scan_url')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-slate-600">
                  📸 Estos documentos son necesarios para verificar tu identidad y dar más confianza a los contratistas.
                </p>
              </div>
            </div>
          )}

          {/* Botones de Navegación */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-6 py-2 bg-gray-100 text-slate-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Anterior
              </button>
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="ml-auto px-6 py-2 bg-yellow-500 text-slate-800 rounded-lg hover:bg-yellow-400 transition-colors font-medium"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="ml-auto px-6 py-2 bg-yellow-500 text-slate-800 rounded-lg hover:bg-yellow-400 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Perfil
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfileScreen;
