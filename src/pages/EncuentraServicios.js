import React, { useState, useEffect } from 'react';
import { MapPin, Star, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { mysqlClient } from '../utils/mysqlClient';
import PostDetailModal from '../components/PostDetailModal';
import ApplicationModal from '../components/ApplicationModal';
import NotificationService from '../utils/notificationService';

// Componente para carrusel automático de imágenes
const ImageCarousel = ({ images, postTitle }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); // Cambiar cada 3 segundos

    return () => clearInterval(interval);
  }, [images]);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative w-full h-full">
      <img
        src={images[currentImageIndex]}
        alt={postTitle}
        className="w-full h-full object-cover transition-opacity duration-500"
      />

      {/* Indicadores de puntos */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex
                    ? 'bg-white shadow-lg'
                    : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Contador de imágenes en la esquina */}
      {images.length > 1 && (
        <div className="absolute top-3 left-3">
          <div className="bg-black/50 text-white px-2 py-1 rounded-full text-xs font-medium">
            📷 {currentImageIndex + 1}/{images.length}
          </div>
        </div>
      )}
    </div>
  );
};

const EncuentraServicios = () => {
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appliedPosts, setAppliedPosts] = useState(new Set());
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [postToApply, setPostToApply] = useState(null);

  // Escuchar eventos de navegación desde notificaciones
  useEffect(() => {
    const handleOpenPostFromNotification = async (event) => {
      const { postId, notificationType } = event.detail;
      console.log(`🎯 Abriendo post ${postId} desde notificación tipo: ${notificationType}`);

      // Buscar el post en la lista actual
      const post = filteredPosts.find(p => p.id == postId);
      if (post) {
        // Abrir el modal de detalles directamente
        setSelectedPost(post);
        setIsModalOpen(true);
      } else {
        // Si el post no está en la lista filtrada, buscarlo en todos los posts
        const allPost = posts.find(p => p.id == postId);
        if (allPost) {
          setSelectedPost(allPost);
          setIsModalOpen(true);
        } else {
          console.log('⚠️ Post no encontrado en listas actuales');
        }
      }
    };

    // Agregar listener
    window.addEventListener('openPostFromNotification', handleOpenPostFromNotification);

    // Cleanup
    return () => {
      window.removeEventListener('openPostFromNotification', handleOpenPostFromNotification);
    };
  }, [filteredPosts, posts]);

  // Cargar aplicaciones del trabajador
  const loadMyApplications = async () => {
    if (!userProfile?.id) return;

    try {
      const applications = await mysqlClient.select(
        'post_applications',
        `worker_id = ${userProfile.id}`
      );

      if (applications && applications.length > 0) {
        const postIds = new Set(applications.map(app => app.post_id));
        setAppliedPosts(postIds);
        console.log('✅ Aplicaciones cargadas:', postIds.size);
      }
    } catch (error) {
      console.log('⚠️ Error cargando aplicaciones:', error);
    }
  };

  // Cargar posts disponibles y configurar tiempo real
  useEffect(() => {
    loadPosts();
    loadMyApplications();

    // Escuchar eventos personalizados para actualizaciones en tiempo real
    const handlePostsUpdate = (e) => {
      console.log('⚡ Evento de actualización detectado:', e.detail);
      loadPosts(true); // Refresh silencioso
    };

    window.addEventListener('contractorPostsUpdated', handlePostsUpdate);

    // Recargar desde MySQL cada 30 segundos
    const interval = setInterval(() => {
      loadPosts(true); // Refresh silencioso para evitar parpadeo
    }, 30000);

    return () => {
      window.removeEventListener('contractorPostsUpdated', handlePostsUpdate);
      clearInterval(interval);
    };
  }, []);

  // Recargar aplicaciones cuando cambie el usuario
  useEffect(() => {
    loadMyApplications();
  }, [userProfile]);

  // Filtrar posts cuando cambien los posts o las profesiones del usuario
  useEffect(() => {
    filterPostsByUserProfessions();
  }, [posts, userProfile]);

  const loadPosts = async (silentRefresh = false) => {
    try {
      // Solo mostrar loading en carga inicial, no en refresh automático
      if (!silentRefresh) {
        setLoading(true);
      }
      let contractorPosts = [];

      // Intentar MySQL primero
      try {
        console.log('🔍 Intentando cargar posts desde MySQL...');
        console.log('🔍 Usuario actual:', userProfile?.id, userProfile?.name);

        // ✨ NUEVO: Solo cargar posts abiertos (sin asignar)
        // Excluir posts con status 'in_progress' o 'completed'
        const mysqlPosts = await mysqlClient.select(
          'posts',
          '(status = "open" OR status = "Pending" OR status IS NULL)',
          'created_at DESC'
        );

        contractorPosts = mysqlPosts || [];
        console.log('✅ Posts cargados desde MySQL:', contractorPosts.length);

        if (contractorPosts.length > 0) {
          console.log('📋 Primer post:', contractorPosts[0]);
        }

        // Si MySQL está vacío, mostrar lista vacía (no usar localStorage)
        if (contractorPosts.length === 0) {
          console.log('📭 No hay posts en MySQL - mostrando lista vacía');
          setPosts([]);
          return;
        }

        // Procesar posts de MySQL y cargar imágenes
        const postsWithDetails = [];

        for (const post of contractorPosts) {
          // Cargar imágenes del post desde la tabla post_images
          let postImages = [];
          try {
            const images = await mysqlClient.select('post_images', `post_id = ${post.id}`, 'order_index ASC');
            postImages = images ? images.map(img => img.image_url) : [];
          } catch (imageError) {
            console.log('⚠️ Error cargando imágenes del post:', imageError.message);
            postImages = [];
          }

          postsWithDetails.push({
            ...post,
            category: post.specialty,
            budget_min: post.price,
            budget_max: post.price,
            location_urbanization: post.location?.split(',')[0]?.trim(),
            location_address: post.location?.split(',')[1]?.trim(),
            images: postImages, // ✅ Dejar como array directamente
            contractor: {
              name: 'Contratista',
              company_name: null,
              rating: 4.8,
              profile_photo_url: null
            }
          });
        }

        setPosts(postsWithDetails);
        console.log('✅ Posts procesados desde MySQL:', postsWithDetails.length);

      } catch (mysqlError) {
        console.log('⚠️ MySQL no disponible:', mysqlError.message);
        // No usar localStorage - solo mostrar posts que existan en MySQL
        setPosts([]);
      }

    } catch (error) {
      console.error('Error general loading posts:', error);
      setPosts([]);
    } finally {
      // Solo cambiar loading en carga inicial, no en refresh automático
      if (!silentRefresh) {
        setLoading(false);
      }
    }
  };

  const filterPostsByUserProfessions = () => {
    console.log('🔍 === INICIANDO FILTRADO ===');
    console.log('📊 Total posts a filtrar:', posts.length);
    console.log('👤 UserProfile completo:', userProfile);

    if (!userProfile || !userProfile.professions) {
      // Si no hay profesiones definidas, mostrar todos los posts
      console.log('⚠️ Usuario sin profesiones definidas, mostrando todos los posts');
      setFilteredPosts(posts);
      return;
    }

    // Parsear profesiones desde JSON
    const userProfessions = typeof userProfile.professions === 'string'
      ? JSON.parse(userProfile.professions || '[]')
      : (userProfile.professions || []);

    console.log('🔍 Profesiones del trabajador parseadas:', userProfessions);
    console.log('🔍 Número de profesiones:', userProfessions.length);

    if (userProfessions.length === 0) {
      console.log('⚠️ Array de profesiones vacío, mostrando todos los posts');
      setFilteredPosts(posts);
      return;
    }

    // Filtrar posts que coincidan con las profesiones del trabajador
    const filtered = posts.filter(post => {
      const postProfession = post.specialty; // La profesión requerida en el post
      console.log(`🔎 Comparando post "${post.title}" - Profesión requerida: "${postProfession}"`);

      const matches = userProfessions.some(prof => {
        const profName = prof.profession;
        const match = profName && profName.toLowerCase() === postProfession?.toLowerCase();
        console.log(`  └─ "${profName}" === "${postProfession}" ? ${match}`);
        return match;
      });

      if (matches) {
        console.log(`✅ POST COINCIDE: "${post.title}" - Profesión: ${postProfession}`);
      } else {
        console.log(`❌ Post NO coincide: "${post.title}"`);
      }

      return matches;
    });

    console.log(`📊 RESULTADO FINAL: ${filtered.length} posts filtrados de ${posts.length} total`);
    console.log('📋 Posts filtrados:', filtered.map(p => p.title));
    setFilteredPosts(filtered);
  };

  const formatBudget = (budget) => {
    if (!budget) return 'Presupuesto a convenir';
    return `$${parseFloat(budget).toLocaleString()} COP`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Hace menos de 1 hora';
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)} horas`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }
  };

  const openApplicationModal = (post) => {
    if (appliedPosts.has(post.id)) {
      alert('Ya has aplicado a este trabajo');
      return;
    }
    setPostToApply(post);
    setShowApplicationModal(true);
  };

  const applyToPost = async (postId, applicationInfo = {}) => {
    try {
      // Verificar primero en el estado local
      if (appliedPosts.has(postId)) {
        alert('Ya has aplicado a este trabajo');
        return;
      }

      console.log('📝 Aplicando a trabajo MySQL:', postId);

      // Verificar si ya aplicó en MySQL
      const existingApplications = await mysqlClient.select(
        'post_applications',
        `post_id = ${postId} AND worker_id = ${userProfile.id}`
      );

      if (existingApplications && existingApplications.length > 0) {
        alert('Ya has aplicado a este trabajo');
        // Actualizar estado local
        setAppliedPosts(prev => new Set([...prev, postId]));
        return;
      }

      // Crear nueva aplicación en MySQL con campos adicionales
      const applicationData = {
        post_id: postId,
        worker_id: userProfile.id,
        message: applicationInfo.message || 'Estoy interesado en este trabajo. Tengo experiencia en este tipo de servicios.',
        proposed_cost: applicationInfo.proposed_cost || null,
        estimated_completion_time: applicationInfo.estimated_completion_time || null,
        status: 'pending'
      };

      const result = await mysqlClient.insert('post_applications', applicationData);

      console.log('✅ Aplicación guardada en MySQL:', result);

      // Actualizar estado local inmediatamente
      setAppliedPosts(prev => new Set([...prev, postId]));

      // Crear notificación para el contratista usando el servicio
      try {
        const post = filteredPosts.find(p => p.id === postId);
        if (post && post.contractor_id) {
          await NotificationService.notifyApplication(
            post.contractor_id,
            userProfile.name,
            post.title,
            postId
          );
        }
      } catch (notifError) {
        console.log('Error creando notificación:', notifError);
      }

      alert('¡Aplicación enviada correctamente! 🎉\n\nEl contratista podrá ver tu solicitud en su panel.');

    } catch (error) {
      console.error('Error applying to post:', error);
      alert('Error al aplicar al trabajo. Verifica que MySQL esté funcionando.');
    }
  };

  // Funciones para el modal de detalles
  const openPostDetail = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const closePostDetail = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando trabajos...</p>
        </div>
      </div>
    );
  }

  // Obtener las profesiones del trabajador para mostrar en el header
  const userProfessions = userProfile?.professions
    ? (typeof userProfile.professions === 'string'
        ? JSON.parse(userProfile.professions || '[]')
        : (userProfile.professions || []))
    : [];

  // Extraer nombres de profesiones para mostrar
  const professionNames = userProfessions.length > 0
    ? userProfessions.map(p => p.profession)
    : ['Servicios Generales'];

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 shadow-sm p-4">
        <h1 className="text-xl font-bold text-slate-800 mb-2">
          Encuentra Trabajos
        </h1>

        {/* Mostrar profesiones del trabajador */}
        <div className="mb-3">
          <p className="text-sm text-slate-700 mb-2">Trabajos para tus profesiones:</p>
          <div className="flex flex-wrap gap-2">
            {professionNames.map((profession, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white/80 text-slate-700 rounded-full text-xs font-medium border border-yellow-200"
              >
                {profession}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Se muestran {filteredPosts.length} trabajos disponibles
        </p>
      </div>

      {/* Lista de trabajos */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay trabajos para tus profesiones
            </h3>
            <p className="text-gray-500 max-w-sm">
              No hay trabajos publicados que coincidan con tus profesiones en este momento.
              Los trabajos aparecerán aquí cuando se publiquen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-2">
            {filteredPosts.map((post) => (
              <div key={post.id} className="group">
                {/* Card dividida en dos secciones - IGUAL QUE EN MIS PUBLICACIONES */}
                <div
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-yellow-200/30 cursor-pointer"
                  onClick={() => openPostDetail(post)}
                >

                  {/* SECCIÓN 1: FOTO (80% del espacio) */}
                  <div className="relative aspect-[1/1] overflow-hidden">
                    {post.images && post.images.length > 0 ? (
                      <ImageCarousel
                        images={post.images}
                        postTitle={post.title}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-300 flex flex-col items-center justify-center relative">
                        {/* Pattern de fondo decorativo */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="w-full h-full" style={{
                            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.15) 1px, transparent 0)`,
                            backgroundSize: '20px 20px'
                          }}></div>
                        </div>

                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg mb-3 relative z-10">
                          <span className="text-white text-2xl drop-shadow-sm">
                            {post.specialty === 'Plomería' ? '🔧' :
                             post.specialty === 'Electricidad' ? '⚡' :
                             post.specialty === 'Pintura' ? '🎨' :
                             post.specialty === 'Carpintería' ? '🪵' :
                             post.specialty === 'Fumigación' ? '🐛' :
                             post.specialty === 'Mecánica Automotriz' ? '🚗' :
                             post.specialty === 'Jardinería' ? '🌱' :
                             post.specialty === 'Limpieza' ? '🧽' :
                             post.specialty === 'Refrigeración' ? '❄️' :
                             post.specialty === 'Electrónica' ? '📱' :
                             post.specialty === 'Cerrajería' ? '🔐' :
                             post.specialty === 'Construcción' ? '🏗️' :
                             post.specialty === 'Aire Acondicionado' ? '🌬️' :
                             post.specialty === 'Soldadura' ? '🔥' :
                             post.specialty === 'Albañilería' ? '🧱' :
                             post.specialty === 'Techado' ? '🏠' :
                             post.specialty === 'Herrería' ? '⚒️' :
                             post.specialty === 'Vidriería' ? '🪟' :
                             post.specialty === 'Reparaciones Generales' ? '🔨' : '🔨'}
                          </span>
                        </div>

                      </div>
                    )}

                    {/* Indicador de aplicación */}
                    {appliedPosts.has(post.id) && (
                      <div className="absolute top-3 right-3">
                        <div className="p-2.5 bg-blue-500 rounded-full shadow-lg">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}


                  </div>

                  {/* SECCIÓN 2: TEXTO (30% del espacio - más compacto) */}
                  <div className="p-3 bg-white">
                    {/* Título principal */}
                    <h3 className="font-bold text-slate-800 text-sm mb-2 line-clamp-1 leading-tight">
                      {post.title}
                    </h3>

                    {/* Info organizada horizontalmente para ahorrar espacio */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-slate-700 border border-yellow-200/30">
                        {post.specialty}
                      </span>
                      {(post.budget_min || post.budget_max) && (
                        <span className="text-yellow-600 font-bold text-sm">
                          {post.budget_min && post.budget_max ? `$${post.budget_min}-${post.budget_max}` :
                           post.budget_max ? `$${post.budget_max}` :
                           `$${post.budget_min}`}
                        </span>
                      )}
                    </div>

                    {/* Ubicación */}
                    {(post.location_urbanization || post.location_address) && (
                      <div className="flex items-center mb-2">
                        <MapPin className="w-3 h-3 text-gray-400 mr-1" />
                        <span className="text-xs text-slate-500 truncate">
                          {post.location_urbanization || post.location_address}
                        </span>
                      </div>
                    )}

                    {/* Metadata en una sola línea */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center">
                        {appliedPosts.has(post.id) ? (
                          <>
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-blue-600 font-medium">Ya aplicado</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            Disponible
                          </>
                        )}
                      </span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles del post */}
      <PostDetailModal
        isOpen={isModalOpen}
        onClose={closePostDetail}
        post={selectedPost}
        onApply={() => {
          setPostToApply(selectedPost);
          setShowApplicationModal(true);
        }}
        hasApplied={selectedPost ? appliedPosts.has(selectedPost.id) : false}
      />

      {/* Modal de aplicación mejorado */}
      <ApplicationModal
        isOpen={showApplicationModal}
        onClose={() => {
          setShowApplicationModal(false);
          setPostToApply(null);
        }}
        post={postToApply}
        onApply={applyToPost}
      />
    </div>
  );
};

export default EncuentraServicios;