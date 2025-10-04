import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Star, Edit3, Camera, Save, X,
  Briefcase, Award, Clock, LogOut, Home, Building, Image, Shield
} from 'lucide-react';
import { apiClient, handleApiError } from '../utils/apiClient';
import { mysqlClient } from '../utils/mysqlClient';
import { useAuth } from '../hooks/useAuth';
import ProfessionSelector from '../components/ProfessionSelector';
import { getProfessionIcon } from '../config/professionsData';

const ProfileScreen = () => {
  const { userProfile, updateUserProfile, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    rating: 0,
    earnings: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    professions: [], // Nuevo campo para múltiples profesiones
    profession: '', // Mantener por compatibilidad
    specialties: '',
    identity_card: '',
    experience_years: 0,
    description: '',
    company_name: '',
    company_type: '',
    company_description: '',
    location_urbanization: '',
    location_condominium: '',
    location_apartment_floor: '',
    location_apartment_number: '',
    location_house_number: '',
    location_quinta_number: '',
    profile_photo_url: ''
  });

  useEffect(() => {
    if (userProfile) {
      // Parsear professions desde JSON
      let professionsData = [];
      try {
        professionsData = userProfile.professions
          ? (typeof userProfile.professions === 'string'
              ? JSON.parse(userProfile.professions)
              : userProfile.professions)
          : [];
      } catch (e) {
        console.error('Error parsing professions:', e);
      }

      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        professions: professionsData,
        profession: userProfile.profession || '',
        specialties: typeof userProfile.specialties === 'string'
          ? userProfile.specialties
          : (Array.isArray(userProfile.specialties) ? userProfile.specialties.join(', ') : JSON.parse(userProfile.specialties || '[]').join(', ')),
        identity_card: userProfile.identity_card || '',
        experience_years: userProfile.experience_years || 0,
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
        profile_photo_url: userProfile.profile_photo_url || ''
      });
      loadStats();
    }
  }, [userProfile]);

  const loadStats = async () => {
    if (!userProfile) return;

    try {
      if (userProfile.user_type === 'worker') {
        const completedJobsResponse = await apiClient.get(`/post_applications?worker_id=${userProfile.id}&status=completed`);
        const completedJobs = completedJobsResponse.data;

        const totalApplicationsResponse = await apiClient.get(`/post_applications?worker_id=${userProfile.id}`);
        const totalApplications = totalApplicationsResponse.data;

        setStats({
          totalJobs: totalApplications?.length || 0,
          completedJobs: completedJobs?.length || 0,
          rating: Number(userProfile.rating) || 0,
          earnings: (completedJobs?.length || 0) * 50000
        });
      } else if (userProfile.user_type === 'contractor') {
        const posts = await mysqlClient.select('posts', `contractor_id = ${userProfile.id}`);
        const completedPosts = await mysqlClient.select('posts', `contractor_id = ${userProfile.id} AND status = 'completed'`);

        setStats({
          totalJobs: posts?.length || 0,
          completedJobs: completedPosts?.length || 0,
          rating: Number(userProfile.rating) || 0,
          earnings: 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profile_photo_url: reader.result }));
    };
    reader.onerror = () => {
      alert('Error al cargar la imagen');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const dataToSend = { ...formData };

      // Convertir specialties a array si es string
      if (typeof dataToSend.specialties === 'string' && dataToSend.specialties) {
        dataToSend.specialties = dataToSend.specialties.split(',').map(s => s.trim());
      }

      // Convertir professions a JSON string si es array
      if (Array.isArray(dataToSend.professions)) {
        dataToSend.professions = JSON.stringify(dataToSend.professions);
      }

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
        // Actualizar contexto
        if (updateUserProfile) {
          updateUserProfile(result.data);
        }

        setIsEditing(false);
        alert('✅ Perfil actualizado correctamente');
      } else {
        throw new Error(result.error || 'Error al actualizar perfil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('❌ Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!userProfile) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const isWorker = userProfile.user_type === 'worker';
  const isContractor = userProfile.user_type === 'contractor';

  return (
    <div className="h-full bg-gray-50 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 p-6">
        <div className="flex justify-between items-start">
          <h1 className="text-xl font-bold text-slate-800">Mi Perfil</h1>

          <div className="flex space-x-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                >
                  <Edit3 className="w-5 h-5 text-slate-800" />
                </button>
                <button
                  onClick={signOut}
                  className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors"
                  title="Salir de la app"
                >
                  <LogOut className="w-5 h-5 text-slate-800" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Avatar y info básica */}
        <div className="flex items-center space-x-4 mt-4">
          <div className="relative">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-800 text-2xl font-bold overflow-hidden">
              {formData.profile_photo_url ? (
                <img
                  src={formData.profile_photo_url}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{userProfile.name?.charAt(0)?.toUpperCase()}</span>
              )}
            </div>
            {isEditing && (
              <label className="absolute -bottom-1 -right-1 p-1 bg-yellow-500 rounded-full cursor-pointer hover:bg-yellow-400">
                <Camera className="w-4 h-4 text-slate-800" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-white/90 border-0 rounded-lg px-3 py-2 text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Tu nombre"
              />
            ) : (
              <h2 className="text-lg font-bold text-slate-800">{userProfile.name}</h2>
            )}

            <div className="flex items-center space-x-2 mt-1">
              <p className="text-sm text-slate-600 capitalize">
                {isContractor ? 'Contratista' : 'Trabajador'}
              </p>
              {stats.rating > 0 && (
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-600 fill-current" />
                  <span className="text-sm text-slate-600 ml-1">{Number(stats.rating).toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="p-4 bg-white mx-4 -mt-4 rounded-xl shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">{stats.totalJobs}</div>
            <div className="text-sm text-gray-500">{isContractor ? 'Proyectos' : 'Trabajos'}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completedJobs}</div>
            <div className="text-sm text-gray-500">Completados</div>
          </div>
        </div>
      </div>

      {/* Información del perfil */}
      <div className="p-4 space-y-4">

        {/* Información de contacto */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Información de Contacto</h3>

          <div className="space-y-3">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700 text-sm">{userProfile.email}</span>
            </div>

            <div className="flex items-start">
              <Phone className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0 mt-1" />
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="flex-1 bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white"
                  placeholder="Número de teléfono"
                />
              ) : (
                <span className="text-gray-700 text-sm">{userProfile.phone || 'No especificado'}</span>
              )}
            </div>

            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0 mt-1" />
              <div className="flex-1">
                {isEditing ? (
                  <>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white resize-none mb-2"
                      placeholder="Dirección completa"
                      rows="2"
                    />
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={formData.location_urbanization}
                        onChange={(e) => handleInputChange('location_urbanization', e.target.value)}
                        className="w-full bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white"
                        placeholder="Urbanización"
                      />
                      <input
                        type="text"
                        value={formData.location_condominium}
                        onChange={(e) => handleInputChange('location_condominium', e.target.value)}
                        className="w-full bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white"
                        placeholder="Conjunto Residencial"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={formData.location_house_number}
                          onChange={(e) => handleInputChange('location_house_number', e.target.value)}
                          className="bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white"
                          placeholder="Nº Casa"
                        />
                        <input
                          type="text"
                          value={formData.location_apartment_number}
                          onChange={(e) => handleInputChange('location_apartment_number', e.target.value)}
                          className="bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white"
                          placeholder="Nº Apto"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    {userProfile.address && (
                      <span className="text-gray-700 text-sm block">{userProfile.address}</span>
                    )}
                    {userProfile.location_urbanization && (
                      <span className="text-gray-600 text-sm block">{userProfile.location_urbanization}</span>
                    )}
                    {userProfile.location_condominium && (
                      <span className="text-gray-600 text-xs block">🏘️ {userProfile.location_condominium}</span>
                    )}
                    {(userProfile.location_house_number || userProfile.location_apartment_number) && (
                      <span className="text-gray-600 text-xs block">
                        {userProfile.location_house_number && `🏠 Casa ${userProfile.location_house_number}`}
                        {userProfile.location_house_number && userProfile.location_apartment_number && ' • '}
                        {userProfile.location_apartment_number && `🚪 Apto ${userProfile.location_apartment_number}`}
                      </span>
                    )}
                    {!userProfile.address && !userProfile.location_urbanization && !userProfile.location_condominium && (
                      <span className="text-gray-500 text-sm block italic">No especificado</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Información profesional para trabajadores */}
        {isWorker && (
          <>
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Habilidades/Categorías de Trabajo
              </h3>

              {isEditing ? (
                <ProfessionSelector
                  value={formData.professions}
                  onChange={(professions) => handleInputChange('professions', professions)}
                  maxProfessions={3}
                />
              ) : (
                <div className="space-y-2">
                  {formData.professions && formData.professions.length > 0 ? (
                    formData.professions.map((profData, index) => {
                      const icon = getProfessionIcon(profData.profession);
                      return (
                        <div key={index} className="bg-gray-50 rounded-lg p-2.5">
                          {/* Header compacto */}
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-lg">{icon}</span>
                            <span className="text-sm font-semibold text-slate-800">{profData.profession}</span>
                            {profData.experience_years && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium ml-auto">
                                {profData.experience_years}
                              </span>
                            )}
                          </div>

                          {/* Especialidades compactas */}
                          {profData.specialties && profData.specialties.length > 0 && (
                            <div className="ml-6">
                              <div className="flex flex-wrap gap-1">
                                {profData.specialties.map((spec, i) => (
                                  <span key={i} className="text-[10px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded-full">
                                    {spec === 'Otro' && profData.custom_specialty ? profData.custom_specialty : spec}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Descripción compacta */}
                          {profData.experience_description && (
                            <div className="ml-6 mt-1.5">
                              <p className="text-[10px] text-slate-600 leading-relaxed">{profData.experience_description}</p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm italic">No hay profesiones registradas</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Información de empresa para contratistas */}
        {isContractor && (
          <div className="bg-white rounded-xl p-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Información de Empresa
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nombre de la Empresa</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    className="w-full bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white"
                    placeholder="Nombre de la empresa"
                  />
                ) : (
                  <p className="text-gray-700 font-medium">{userProfile.company_name || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Tipo de Empresa</label>
                {isEditing ? (
                  <select
                    value={formData.company_type}
                    onChange={(e) => handleInputChange('company_type', e.target.value)}
                    className="w-full bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="individual">Persona Natural</option>
                    <option value="company">Empresa</option>
                    <option value="cooperative">Cooperativa</option>
                  </select>
                ) : (
                  <p className="text-gray-700">{userProfile.company_type || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Descripción</label>
                {isEditing ? (
                  <textarea
                    value={formData.company_description}
                    onChange={(e) => handleInputChange('company_description', e.target.value)}
                    rows={3}
                    className="w-full bg-gray-100 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white resize-none"
                    placeholder="Describe tu empresa, servicios, etc..."
                  />
                ) : (
                  <p className="text-gray-700 text-sm">{userProfile.company_description || 'No hay información disponible'}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fecha de registro */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-500 mr-3" />
            <span className="text-gray-700 text-sm">
              Miembro desde {formatDate(userProfile.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
