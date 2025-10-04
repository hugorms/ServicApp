import React, { useState } from 'react';
import { ArrowLeft, Camera, X, Plus, ChevronLeft, ChevronRight, MapPin, Home, Building2 } from 'lucide-react';
import { mysqlClient } from '../utils/mysqlClient';
import { PROFESSIONS_LIST, getProfessionIcon } from '../config/professionsData';
import { MUNICIPALITIES, PARISHES, SECTORS, PROPERTY_TYPES } from '../config/locations';
import NotificationService from '../utils/notificationService';
import MapPicker from '../components/MapPicker';

// Las notificaciones ahora se manejan con el servicio centralizado NotificationService

const NuevoPost = ({ userProfile, onBack, editingPost }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Debug: Ver qué datos llegan para editar
  React.useEffect(() => {
    if (editingPost) {
      console.log('🔍 NuevoPost - Editando post:', editingPost);
      console.log('📝 Datos del post a editar:', {
        title: editingPost.title,
        specialty: editingPost.specialty,
        description: editingPost.description,
        images: editingPost.images,
        budget_min: editingPost.budget_min,
        budget_max: editingPost.budget_max,
      });
    } else {
      console.log('📝 NuevoPost - Creando post nuevo');
    }
  }, [editingPost]);

  // Estados del formulario
  const [formData, setFormData] = useState({
    title: editingPost?.title || '',
    specialty: editingPost?.specialty || '',
    description: editingPost?.description || '',

    // Nueva estructura de ubicación
    municipality: editingPost?.municipality || '',
    parish: editingPost?.parish || '',
    sector: editingPost?.sector || '',
    property_type: editingPost?.property_type || '',
    specific_address: editingPost?.specific_address || '',
    reference_info: editingPost?.reference_info || '',

    // Presupuesto
    budget_min: editingPost?.budget_min || '',
    budget_max: editingPost?.budget_max || '',

    // Contacto
    contact_phone: editingPost?.contact_phone || userProfile?.phone || '',

    // Imágenes
    images: editingPost?.images || []
  });

  // Debug: Ver estado inicial del formulario
  React.useEffect(() => {
    console.log('📋 Estado inicial del formulario:', formData);
  }, []);

  // Usar la lista de profesiones
  const professions = PROFESSIONS_LIST;


  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funciones para manejo de imágenes del post
  const handleImageCapture = (event) => {
    const files = Array.from(event.target.files);
    const currentImages = formData.images || [];

    // Limitar a máximo 6 imágenes
    if (currentImages.length + files.length > 6) {
      alert('Máximo 6 fotos permitidas');
      return;
    }

    files.forEach(file => {
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const updatedImages = [...(formData.images || []), e.target.result];
          handleInputChange('images', updatedImages);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'camera';
    input.multiple = true;
    input.onchange = handleImageCapture;
    input.click();
  };

  const handleGallerySelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = handleImageCapture;
    input.click();
  };

  const removeImage = (index) => {
    const currentImages = [...(formData.images || [])];
    currentImages.splice(index, 1);
    handleInputChange('images', currentImages);

    // Ajustar índice del carrusel si es necesario
    if (currentImageIndex >= currentImages.length && currentImages.length > 0) {
      setCurrentImageIndex(currentImages.length - 1);
    } else if (currentImages.length === 0) {
      setCurrentImageIndex(0);
    }
  };

  const nextImage = () => {
    if (formData.images && currentImageIndex < formData.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      setCurrentImageIndex(0); // Volver al inicio
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (formData.images) {
      setCurrentImageIndex(formData.images.length - 1); // Ir al final
    }
  };

  // Validar paso actual
  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() && formData.specialty && formData.description.trim();
      case 2:
        return formData.municipality.trim() && formData.parish.trim() && formData.specific_address.trim();
      case 3:
        return formData.contact_phone.trim();
      default:
        return true;
    }
  };

  // Siguiente paso
  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      alert('Por favor completa todos los campos requeridos');
    }
  };

  // Paso anterior
  const prevStep = () => {
    setStep(step - 1);
  };

  // Enviar formulario
  const handleSubmit = async () => {
    if (!validateStep(3)) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Guardando post localmente:', formData);
      console.log('👤 UserProfile del contratista:', userProfile);

      // Preparar datos del post para MySQL

      const postData = {
        contractor_id: userProfile.id || 1, // Usar ID 1 si no hay usuario logueado
        title: formData.title.trim(),
        description: formData.description.trim(),
        specialty: formData.specialty, // ✅ PROFESIÓN requerida
        location: `${formData.municipality}, ${formData.parish}, ${formData.sector}`.trim(),
        municipality: formData.municipality.trim(),
        parish: formData.parish.trim(),
        sector: formData.sector.trim(),
        property_type: formData.property_type,
        specific_address: formData.specific_address.trim(),
        reference_info: formData.reference_info.trim(),
        budget_min: parseFloat(formData.budget_min) || null,
        budget_max: parseFloat(formData.budget_max) || null,
        contact_phone: formData.contact_phone.trim(),
        price: String(formData.budget_max || formData.budget_min || '0'),
        estimated_hours: null,
        status: 'Pending',
        urgency: 'medium' // ✅ CAMPO REQUERIDO - agregar urgencia por defecto
      };

      console.log('📦 PostData para MySQL:', postData);

      if (editingPost) {
        // Actualizar post existente
        try {
          const result = await mysqlClient.update('posts', postData, `id = ${editingPost.id}`);
          console.log('✅ Post actualizado en MySQL:', result);
          alert('¡Publicación actualizada exitosamente! 🎉');
        } catch (mysqlError) {
          console.error('❌ Error actualizando post:', mysqlError);
          alert('Error al actualizar la publicación. Verifica que MySQL esté funcionando.');
          throw mysqlError;
        }
      } else {
        // Crear nuevo post
        let savedPost = null;

        try {
          const result = await mysqlClient.insert('posts', postData);

          if (!result.success) {
            throw new Error('Error al crear post en MySQL');
          }

          // Obtener el ID del post creado
          savedPost = {
            id: result.data?.id || result.insertId,
            ...postData
          };
          console.log('✅ Post creado en MySQL:', savedPost);

          // Guardar imágenes en la tabla post_images
          if (formData.images && formData.images.length > 0) {
            console.log(`💾 Guardando ${formData.images.length} imágenes en post_images...`);

            for (let i = 0; i < formData.images.length; i++) {
              const imageData = {
                post_id: savedPost.id,
                image_url: formData.images[i],
                description: null,
                order_index: i + 1,
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
              };

              try {
                await mysqlClient.insert('post_images', imageData);
                console.log(`✅ Imagen ${i + 1} guardada en post_images`);
              } catch (imageError) {
                console.error(`❌ Error guardando imagen ${i + 1}:`, imageError);
              }
            }
          }

          // Enviar notificaciones a trabajadores
          const notificationCount = await NotificationService.notifyNewJob(
            formData.specialty,
            savedPost.title,
            `${formData.municipality}, ${formData.parish}`,
            savedPost.id
          );

          alert(`¡Publicación creada exitosamente! 🎉\n\n${notificationCount > 0 ? `Se notificaron ${notificationCount} trabajadores de ${formData.specialty}` : 'No hay trabajadores registrados con esa profesión'}`);
        } catch (mysqlError) {
          console.error('❌ Error creando post:', mysqlError);
          alert('Error al crear la publicación. Verifica que MySQL esté funcionando.');
          throw mysqlError;
        }
      }

      // Volver a la pantalla anterior
      onBack();

    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error al guardar la publicación. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar paso actual
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800">Describe tu trabajo</h2>
              <p className="text-sm text-slate-600">¿Qué necesitas que hagan?</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Título del trabajo *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full bg-gray-100 focus:bg-white p-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                placeholder="Ej: Reparar tubería rota en baño"
                maxLength="100"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Profesión Requerida *
              </label>
              <select
                value={formData.specialty}
                onChange={(e) => handleInputChange('specialty', e.target.value)}
                className="w-full bg-gray-100 focus:bg-white p-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
              >
                <option value="">Selecciona la profesión...</option>
                {professions.map(profession => {
                  const icon = getProfessionIcon(profession);
                  return (
                    <option key={profession} value={profession}>
                      {icon} {profession}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-slate-500 mt-1">Solo se notificará a trabajadores de esta profesión</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Descripción detallada *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full bg-gray-100 focus:bg-white p-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all resize-none"
                rows="4"
                placeholder="Describe con detalle qué necesitas, materiales, herramientas, etc."
                maxLength="500"
              />
              <p className="text-xs text-slate-500 mt-1">{formData.description.length}/500</p>
            </div>

          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">📍</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800">Ubicación</h2>
              <p className="text-sm text-slate-600">¿Dónde se realizará el trabajo?</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Municipio *
              </label>
              <input
                type="text"
                value={formData.municipality}
                onChange={(e) => handleInputChange('municipality', e.target.value)}
                className="w-full bg-gray-100 focus:bg-white p-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                placeholder="Ej: Libertador, Chacao, Valencia"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Parroquia *
              </label>
              <input
                type="text"
                value={formData.parish}
                onChange={(e) => handleInputChange('parish', e.target.value)}
                className="w-full bg-gray-100 focus:bg-white p-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                placeholder="Ej: Petare, Chacao, El Recreo"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Sector
              </label>
              <input
                type="text"
                value={formData.sector}
                onChange={(e) => handleInputChange('sector', e.target.value)}
                className="w-full bg-gray-100 focus:bg-white p-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                placeholder="Ej: Centro, Norte, Las Mercedes"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Dirección específica *
              </label>
              <input
                type="text"
                value={formData.specific_address}
                onChange={(e) => handleInputChange('specific_address', e.target.value)}
                className="w-full bg-gray-100 focus:bg-white p-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                placeholder="Ej: Calle 5, Casa #123"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Referencias adicionales
              </label>
              <textarea
                value={formData.reference_info}
                onChange={(e) => handleInputChange('reference_info', e.target.value)}
                className="w-full bg-gray-100 focus:bg-white p-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all resize-none"
                rows="3"
                placeholder="Ej: Casa azul con portón blanco, al lado del supermercado"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800">Presupuesto y contacto</h2>
              <p className="text-sm text-slate-600">Información final para tu publicación</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Presupuesto mín.
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-600">$</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.budget_min}
                    onChange={(e) => handleInputChange('budget_min', e.target.value)}
                    className="w-full pl-8 pr-3 py-3 bg-gray-100 focus:bg-white rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Presupuesto máx.
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-600">$</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.budget_max}
                    onChange={(e) => handleInputChange('budget_max', e.target.value)}
                    className="w-full pl-8 pr-3 py-3 bg-gray-100 focus:bg-white rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                    placeholder="500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Teléfono de contacto *
              </label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                className="w-full bg-gray-100 focus:bg-white p-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                placeholder="Tu número de teléfono"
              />
            </div>

            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200/30">
              <h3 className="font-bold text-slate-800 text-sm mb-2">Fotos (opcional)</h3>
              <p className="text-xs text-slate-600 mb-3">
                Agrega fotos para mostrar mejor lo que necesitas (máximo 6)
              </p>

              {/* Botones para agregar fotos */}
              <div className="flex space-x-2 mb-3">
                <button
                  onClick={handleCameraCapture}
                  className="flex-1 flex items-center justify-center space-x-1 text-xs bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  <Camera className="w-3 h-3" />
                  <span>Cámara</span>
                </button>
                <button
                  onClick={handleGallerySelect}
                  className="flex-1 flex items-center justify-center space-x-1 text-xs bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-400 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Galería</span>
                </button>
              </div>

              {/* Grid de imágenes con carrusel cuando haya fotos */}
              {formData.images && formData.images.length > 0 ? (
                <div>
                  {/* Imagen principal con carrusel */}
                  <div className="relative mb-2">
                    <div className="w-full h-40 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={formData.images[currentImageIndex]}
                        alt={`Foto ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Navegación si hay más de 1 foto */}
                    {formData.images.length > 1 && (
                      <>
                        {/* Botón anterior */}
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Botón siguiente */}
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Indicador */}
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                          {currentImageIndex + 1} de {formData.images.length}
                        </div>
                      </>
                    )}

                    {/* Botón eliminar */}
                    <button
                      onClick={() => removeImage(currentImageIndex)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Miniaturas de todas las fotos */}
                  {formData.images.length > 1 && (
                    <div className="grid grid-cols-6 gap-1">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Foto ${index + 1}`}
                            className={`w-full h-12 object-cover rounded cursor-pointer ${
                              index === currentImageIndex
                                ? 'ring-2 ring-yellow-500'
                                : 'hover:opacity-75'
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-2 h-2" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-slate-500 mt-2">
                    {formData.images.length} de 6 fotos
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-yellow-300 rounded-lg p-6 text-center">
                  <Camera className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">No hay fotos aún</p>
                  <p className="text-xs text-slate-500">Las fotos ayudan a conseguir más respuestas</p>
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 hover:bg-yellow-300/50 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-800" />
          </button>

          <h1 className="text-lg font-bold text-slate-800">
            {editingPost ? 'Editar Publicación' : 'Nueva Publicación'}
          </h1>

          <div className="w-9 h-9"></div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">Paso {step} de 3</span>
            <span className="text-sm font-medium text-slate-700">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-yellow-200/50 rounded-full h-1">
            <div
              className="bg-yellow-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-yellow-200/30 max-w-md mx-auto">
          {renderStep()}
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto flex space-x-3">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="flex-1 py-3 bg-gray-200 text-slate-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
            >
              Anterior
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={nextStep}
              className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-800 rounded-xl font-bold hover:shadow-md transition-all duration-300"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-xl font-bold hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{editingPost ? 'Actualizando...' : 'Publicando...'}</span>
                </div>
              ) : (
                editingPost ? 'Actualizar' : 'Publicar'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NuevoPost;