import React, { useState, useEffect } from 'react';
import { X, Star, MapPin, Phone, Mail, DollarSign, Clock, Calendar, User, ArrowRight, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { mysqlClient } from '../utils/mysqlClient';

const PostDetailModal = ({ isOpen, onClose, post, onApply, hasApplied = false }) => {
  const [contractorData, setContractorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (isOpen && post) {
      fetchContractorProfile();
      // Procesar imágenes del post
      if (post.images) {
        try {
          const parsedImages = JSON.parse(post.images);
          setImages(parsedImages || []);
        } catch (error) {
          console.error('Error parsing post images:', error);
          setImages([]);
        }
      }
    }
  }, [isOpen, post]);

  const fetchContractorProfile = async () => {
    try {
      setLoading(true);

      // Obtener datos del contratista desde MySQL
      const userDataArray = await mysqlClient.select('users', `id = ${post.contractor_id}`);

      if (!userDataArray || userDataArray.length === 0) {
        throw new Error('Contratista no encontrado');
      }

      const userData = userDataArray[0]; // Tomar el primer usuario del array
      console.log('✅ Contractor data loaded:', userData);
      setContractorData(userData);
    } catch (error) {
      console.error('Error fetching contractor profile:', error);
      alert('Error al cargar el perfil del contratista');
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };


  const getSpecialtyIcon = (specialty) => {
    const icons = {
      'Plomería': '🔧',
      'Electricidad': '⚡',
      'Pintura': '🎨',
      'Carpintería': '🪵',
      'Fumigación': '🐛',
      'Mecánica Automotriz': '🚗',
      'Jardinería': '🌱',
      'Limpieza': '🧽',
      'Refrigeración': '❄️',
      'Electrónica': '📱',
      'Cerrajería': '🔐',
      'Construcción': '🏗️',
      'Aire Acondicionado': '🌬️',
      'Soldadura': '🔥',
      'Albañilería': '🧱',
      'Techado': '🏠',
      'Herrería': '⚒️',
      'Vidriería': '🪟',
      'Reparaciones Generales': '🔨'
    };
    return icons[specialty] || '🔨';
  };

  if (!isOpen || !post) return null;

  return (
    <div className="absolute inset-0 bg-white z-50">
      <div className="w-full h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-yellow-400 to-yellow-500 p-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-800" />
            </button>
            <h2 className="text-base font-bold text-slate-800 flex-1">Detalles del Trabajo</h2>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-slate-800" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="text-slate-600 mt-4">Cargando detalles...</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Galería de imágenes del post */}
            {images.length > 0 && (
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={images[currentImageIndex]}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />

                {/* Navegación de imágenes */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Indicadores */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1">
                      {images.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Título y especialidad */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-slate-800 leading-tight">{post.title}</h3>

              <div className="flex items-center space-x-3">
                <span className="text-3xl">{getSpecialtyIcon(post.specialty)}</span>
                <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                  {post.specialty}
                </span>
              </div>
            </div>

            {/* Descripción */}
            {post.description && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-bold text-slate-700 text-sm mb-2">Descripción del Trabajo</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{post.description}</p>
              </div>
            )}

            {/* Información del trabajo */}
            <div className="grid grid-cols-2 gap-3">
              {/* Presupuesto */}
              {(post.budget_min || post.budget_max || post.price) && (
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-base font-bold text-slate-800">
                    {post.budget_min && post.budget_max
                      ? `$${post.budget_min}-${post.budget_max}`
                      : post.price || 'A convenir'}
                  </p>
                  <p className="text-xs text-slate-600">Presupuesto</p>
                </div>
              )}

              {/* Tiempo estimado */}
              {post.estimated_hours && (
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-base font-bold text-slate-800">{post.estimated_hours}h</p>
                  <p className="text-xs text-slate-600">Tiempo Estimado</p>
                </div>
              )}
            </div>

            {/* Ubicación */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-bold text-slate-700 text-sm mb-2">📍 Ubicación del Trabajo</h4>
              <div className="flex items-start text-slate-600">
                <MapPin className="w-4 h-4 mr-2 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">{post.location || post.full_address}</p>
                  {(post.municipality || post.parish || post.sector) && (
                    <p className="text-sm text-slate-500 mt-1">
                      {[post.municipality, post.parish, post.sector].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {post.specific_address && (
                    <p className="text-sm text-slate-500 mt-1">{post.specific_address}</p>
                  )}
                  {post.reference_info && (
                    <p className="text-sm text-slate-500 mt-1 italic">{post.reference_info}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Información del contratista */}
            {contractorData && (
              <div className="bg-yellow-50 rounded-xl p-2 border border-yellow-200">
                <h4 className="font-bold text-slate-700 text-xs mb-2">Contratista</h4>

                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                    {contractorData.profile_photo_url ? (
                      <img
                        src={contractorData.profile_photo_url}
                        alt={contractorData.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-slate-800 text-sm">{contractorData.name}</h5>
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs font-medium text-slate-700 ml-1">
                        {contractorData.rating || '5.0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contacto del contratista */}
                <div className="space-y-1">
                  {contractorData.phone && (
                    <div className="flex items-center text-slate-600">
                      <Phone className="w-3 h-3 mr-1 text-yellow-500" />
                      <span className="text-xs">{contractorData.phone}</span>
                    </div>
                  )}
                  {contractorData.email && (
                    <div className="flex items-center text-slate-600">
                      <Mail className="w-3 h-3 mr-1 text-yellow-500" />
                      <span className="text-xs">{contractorData.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fecha de publicación */}
            {post.created_at && (
              <div className="flex items-center text-slate-500 text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                <span>Publicado el {new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  if (contractorData?.phone) {
                    window.location.href = `tel:${contractorData.phone}`;
                  }
                }}
                className="flex-1 bg-gray-200 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-300 transition-colors flex items-center justify-center"
                disabled={!contractorData?.phone}
              >
                <Phone className="w-4 h-4 mr-2" />
                Contactar
              </button>

              {hasApplied ? (
                <div className="flex-1">
                  <div className="bg-blue-100 text-blue-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center mb-1">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Ya Aplicado
                  </div>
                  <p className="text-xs text-center text-slate-500">En espera de respuesta</p>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onApply && onApply(post.id);
                    onClose();
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-bold text-sm hover:from-green-600 hover:to-green-700 shadow-lg flex items-center justify-center"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Aplicar al Trabajo
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetailModal;