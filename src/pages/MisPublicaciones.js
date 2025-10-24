import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, Clock, MapPin, ChevronDown } from 'lucide-react';
import NuevoPost from './NuevoPost';
import { mysqlClient } from '../utils/mysqlClient';

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

const MisPublicaciones = ({ userProfile, socket }) => {
  const [activeTab, setActiveTab] = useState('my-posts');
  const [showNewPost, setShowNewPost] = useState(false);
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // ✨ NUEVO: Estado para filtrar posts
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'open', 'in_progress', 'completed'
  const [showDropdown, setShowDropdown] = useState(false); // Estado del dropdown
  const dropdownRef = useRef(null); // Referencia para cerrar al hacer click fuera

  // Obtener posts del usuario desde MySQL
  const fetchMyPosts = async () => {
    const userId = userProfile?.id || 1; // Usar ID 1 como fallback para pruebas

    setLoading(true);
    try {
      console.log('🔍 MisPublicaciones - Cargando posts para user.id:', userId);
      console.log('👤 MisPublicaciones - UserProfile completo:', userProfile);

      let userPosts = [];

      // Cargar posts desde MySQL
      try {
        console.log('📊 Cargando posts desde MySQL...');
        const mysqlPosts = await mysqlClient.select('posts', `contractor_id = ${userId}`, 'created_at DESC');

        if (mysqlPosts && mysqlPosts.length > 0) {
          // Cargar imágenes y datos del trabajador asignado para cada post
          for (const post of mysqlPosts) {
            // Cargar imágenes
            try {
              const images = await mysqlClient.select('post_images', `post_id = ${post.id}`, 'order_index ASC');
              post.images = images ? images.map(img => img.image_url) : [];
            } catch (imageError) {
              console.log('⚠️ Error cargando imágenes del post:', imageError.message);
              post.images = [];
            }

            // ✨ NUEVO: Cargar datos del trabajador asignado si existe
            if (post.assigned_worker_id) {
              try {
                const workers = await mysqlClient.select('users', `id = ${post.assigned_worker_id}`);
                if (workers && workers.length > 0) {
                  post.assigned_worker = workers[0];
                  console.log(`✅ Trabajador asignado cargado para post ${post.id}:`, workers[0].name);
                }
              } catch (workerError) {
                console.log('⚠️ Error cargando trabajador asignado:', workerError.message);
                post.assigned_worker = null;
              }
            }
          }

          userPosts = mysqlPosts;
          console.log('✅ Posts cargados desde MySQL:', mysqlPosts.length);

          // ✨ NUEVO: Log detallado de estados
          console.log('📊 Estados de posts cargados:');
          mysqlPosts.forEach((post, index) => {
            console.log(`  ${index + 1}. ID:${post.id} | Título:"${post.title}" | Status:"${post.status || 'NULL'}" | Worker:${post.assigned_worker_id || 'N/A'}`);
          });
        } else {
          console.log('ℹ️ No se encontraron posts para este usuario');
          userPosts = [];
        }
      } catch (mysqlError) {
        console.error('❌ Error cargando posts desde MySQL:', mysqlError);
        userPosts = [];
      }

      // Procesar posts y mapear campos
      const postsWithImages = userPosts.map(post => ({
        ...post,
        images: post.images || [],
        category: post.specialty, // Mapear specialty a category para compatibilidad
      }));

      // Ordenar por fecha de creación (más recientes primero)
      postsWithImages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setMyPosts(postsWithImages);
      console.log('✅ Posts procesados:', postsWithImages.length);
    } catch (err) {
      console.error('❌ Error cargando posts:', err);
      setMyPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar posts cuando el componente se monta O cuando cambia el activeTab
  useEffect(() => {
    if (activeTab === 'my-posts') {
      fetchMyPosts();
    }
  }, [activeTab]); // ✨ NUEVO: Recargar cuando cambias de tab

  // ✨ NUEVO: Escuchar eventos de actualización desde otras pantallas
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 Evento de refresh detectado en MisPublicaciones');
      fetchMyPosts();
    };

    window.addEventListener('refreshMyPosts', handleRefresh);
    return () => window.removeEventListener('refreshMyPosts', handleRefresh);
  }, []);

  // ✨ NUEVO: Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  console.log('MisPublicaciones - userProfile:', userProfile);
  console.log('MisPublicaciones - mis posts:', myPosts);

  // ✨ NUEVO: Log para debug de estados
  console.log('📊 Distribución de estados:', myPosts.reduce((acc, post) => {
    const status = post.status || 'sin_status';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}));

  // Función para eliminar post
  const handleDeletePost = async (postId) => {
    try {
      console.log('🗑️ Eliminando publicación:', postId);

      // Eliminar imágenes relacionadas primero
      const images = await mysqlClient.select('post_images', `post_id = ${postId}`);
      if (images && images.length > 0) {
        console.log(`🖼️ Se encontraron ${images.length} imágenes para eliminar`);

        // Eliminar cada imagen de la tabla post_images
        for (const image of images) {
          try {
            await mysqlClient.delete('post_images', `id = ${image.id}`);
            console.log(`✅ Imagen ${image.id} eliminada`);
          } catch (imageError) {
            console.log(`⚠️ Error eliminando imagen ${image.id}:`, imageError.message);
          }
        }
      }

      // Eliminar aplicaciones relacionadas
      try {
        await mysqlClient.delete('post_applications', `post_id = ${postId}`);
        console.log('✅ Aplicaciones relacionadas eliminadas');
      } catch (appError) {
        console.log('⚠️ Error eliminando aplicaciones:', appError.message);
      }

      // Eliminar el post principal de MySQL
      await mysqlClient.delete('posts', `id = ${postId}`);
      console.log('✅ Post eliminado de MySQL');

      // Actualizar lista local
      setMyPosts(prev => prev.filter(post => post.id !== postId));

      // Disparar evento para actualización en tiempo real
      window.dispatchEvent(new CustomEvent('contractorPostsUpdated', {
        detail: { action: 'deleted', postId }
      }));

      alert('¡Publicación eliminada exitosamente! 🗑️');
      setShowDeleteConfirm(false);
      setSelectedPost(null);
    } catch (error) {
      console.error('❌ Error eliminando publicación:', error);
      alert('Error al eliminar la publicación. Verifica que MySQL esté funcionando.');
    }
  };

  // Función para editar post
  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowNewPost(true); // Reutilizar el componente NuevoPost para editar
  };

  // Función para confirmar eliminación
  const confirmDelete = (post) => {
    setSelectedPost(post);
    setShowDeleteConfirm(true);
  };


  // ✨ NUEVO: Sistema de estados del ciclo de vida del post (case-insensitive)
  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'open':
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300'; // Por defecto: abierto
    }
  };

  const getStatusText = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'completed':
        return '✅ Completado';
      case 'in_progress':
        return '🔧 En Progreso';
      case 'open':
      case 'pending':
        return '🟢 Abierto';
      case 'draft':
        return '📝 Borrador';
      default:
        return '🟢 Abierto'; // Por defecto: abierto
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '🔧';
      case 'open':
      case 'pending':
        return '🟢';
      default:
        return '🟢';
    }
  };

  // ✨ NUEVO: Contar posts por estado
  const getPostCount = (filterType) => {
    return myPosts.filter(post => {
      const postStatus = (post.status || '').toLowerCase();
      if (filterType === 'all') return true;
      if (filterType === 'open') return !post.status || postStatus === 'open' || postStatus === 'pending';
      if (filterType === 'in_progress') return postStatus === 'in_progress';
      if (filterType === 'completed') return postStatus === 'completed';
      return true;
    }).length;
  };

  // ✨ NUEVO: Obtener label del filtro actual
  const getFilterLabel = () => {
    const filters = {
      all: '📋 Todos',
      open: '🟢 Abiertos',
      in_progress: '🔧 En Progreso',
      completed: '✅ Completados'
    };
    return filters[statusFilter] || '📋 Todos';
  };

  // Si está mostrando el formulario de nuevo post, renderizar NuevoPost
  if (showNewPost) {
    return (
      <NuevoPost
        userProfile={userProfile}
        editingPost={editingPost} // Pasar post para editar si existe
        onBack={() => {
          setShowNewPost(false);
          setEditingPost(null); // Limpiar post en edición
          fetchMyPosts(); // Recargar posts cuando regrese
        }}
      />
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 shadow-sm p-4">
        <h1 className="text-xl font-bold text-slate-800">
          Mis Publicaciones
        </h1>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-yellow-200/30 px-2">
        <div className="flex justify-center items-center space-x-2">
          {[
            { id: 'my-posts', label: 'Posts' },
            { id: 'analytics', label: 'Estadísticas' },
            { id: 'settings', label: 'Configuración' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-yellow-600 border-yellow-600'
                  : 'text-slate-600 border-transparent hover:text-slate-800 hover:border-yellow-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Botón Nuevo Post */}
          <button
            onClick={() => setShowNewPost(true)}
            className="bg-gradient-to-r from-yellow-300 to-yellow-400 text-slate-800 px-3 py-2 rounded-lg text-xs font-bold hover:shadow-md transition-all duration-200 flex items-center space-x-1 shadow-sm ml-2">
            <Plus className="w-3 h-3" />
            <span>Nuevo</span>
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-4">
        {activeTab === 'my-posts' && (
          <div>
            {/* ✨ NUEVO: Dropdown de filtros elegante y compacto */}
            <div className="mb-3 relative" ref={dropdownRef}>
              {/* Botón principal del dropdown */}
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full bg-white border border-yellow-300 rounded-lg px-3 py-2 flex items-center justify-between text-left hover:border-yellow-400 transition-all shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-base">{getFilterLabel().split(' ')[0]}</span>
                  <span className="text-sm font-bold text-slate-800">
                    {getFilterLabel().split(' ').slice(1).join(' ')}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({getPostCount(statusFilter)})
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${
                    showDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Menú desplegable */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-yellow-200 rounded-lg shadow-lg overflow-hidden z-50 animate-fadeIn">
                  {[
                    { id: 'all', label: 'Todos', icon: '📋' },
                    { id: 'open', label: 'Abiertos', icon: '🟢' },
                    { id: 'in_progress', label: 'En Progreso', icon: '🔧' },
                    { id: 'completed', label: 'Completados', icon: '✅' }
                  ].map((filter, index) => {
                    const count = getPostCount(filter.id);
                    const isActive = statusFilter === filter.id;

                    return (
                      <button
                        key={filter.id}
                        onClick={() => {
                          setStatusFilter(filter.id);
                          setShowDropdown(false);
                        }}
                        className={`w-full px-3 py-2 flex items-center justify-between hover:bg-yellow-50 transition-colors ${
                          index !== 3 ? 'border-b border-gray-100' : ''
                        } ${isActive ? 'bg-yellow-50' : ''}`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{filter.icon}</span>
                          <span className={`text-sm font-bold ${isActive ? 'text-yellow-700' : 'text-slate-800'}`}>
                            {filter.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({count})
                          </span>
                        </div>
                        {isActive && (
                          <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">✓</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-2">Cargando tus publicaciones...</p>
              </div>
            ) : (
              <>
                {/* Grid moderno y estético - 2 columnas para posts más grandes */}
                <div className="grid grid-cols-2 gap-3 px-2">
                  {myPosts
                    .filter(post => {
                      // ✨ NUEVO: Aplicar filtro de estado (case-insensitive)
                      const postStatus = (post.status || '').toLowerCase();
                      if (statusFilter === 'all') return true;
                      if (statusFilter === 'open') return !post.status || postStatus === 'open' || postStatus === 'pending';
                      if (statusFilter === 'in_progress') return postStatus === 'in_progress';
                      if (statusFilter === 'completed') return postStatus === 'completed';
                      return true;
                    })
                    .map((post) => (
                    <div key={post.id} className="group">
                      {/* Card dividida en dos secciones */}
                      <div
                        className="bg-white rounded-xl overflow-hidden shadow-sm border border-yellow-200/30"
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
                                  {post.category === 'Plomería' ? '🔧' :
                                   post.category === 'Electricidad' ? '⚡' :
                                   post.category === 'Pintura' ? '🎨' :
                                   post.category === 'Carpintería' ? '🪵' :
                                   post.category === 'Fumigación' ? '🐛' :
                                   post.category === 'Mecánica' ? '🚗' :
                                   post.category === 'Jardinería' ? '🌱' :
                                   post.category === 'Limpieza' ? '🧽' :
                                   post.category === 'Refrigeración' ? '❄️' :
                                   post.category === 'Electrónica' ? '📱' :
                                   post.category === 'Cerrajero' ? '🔐' : '🔨'}
                                </span>
                              </div>

                              <h3 className="text-slate-700 font-bold text-sm text-center px-4 leading-tight relative z-10">
                                {post.title}
                              </h3>
                            </div>
                          )}

                          {/* ✨ NUEVO: Badge de estado en la esquina superior izquierda */}
                          <div className="absolute top-3 left-3">
                            <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border ${getStatusColor(post.status)}`}>
                              {getStatusText(post.status)}
                            </div>
                          </div>

                          {/* Botones de acción en la foto */}
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPost(post);
                                }}
                                className="p-2.5 bg-white/90 hover:bg-white rounded-full shadow-lg"
                                title="Editar publicación"
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(post);
                                }}
                                className="p-2.5 bg-white/90 hover:bg-white rounded-full shadow-lg"
                                title="Eliminar publicación"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>

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
                              {post.category}
                            </span>
                            {post.price && (
                              <span className="text-yellow-600 font-bold text-sm">
                                {post.price}
                              </span>
                            )}
                          </div>

                          {/* ✨ NUEVO: Mostrar trabajador asignado si existe */}
                          {post.assigned_worker && ((post.status || '').toLowerCase() === 'in_progress' || (post.status || '').toLowerCase() === 'completed') && (
                            <div className="mb-2 flex items-center space-x-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
                              <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {post.assigned_worker.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">
                                  {post.assigned_worker.name}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">
                                  {post.assigned_worker.profession || 'Trabajador'}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Metadata en una sola línea */}
                          <div className="flex items-center justify-between text-xs">
                            <span className={`flex items-center font-medium ${
                              (post.status || '').toLowerCase() === 'completed' ? 'text-green-600' :
                              (post.status || '').toLowerCase() === 'in_progress' ? 'text-yellow-600' :
                              'text-blue-600'
                            }`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                (post.status || '').toLowerCase() === 'completed' ? 'bg-green-500' :
                                (post.status || '').toLowerCase() === 'in_progress' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`}></div>
                              {getStatusIcon(post.status)} {getStatusText(post.status).replace(/[🟢🔧✅📝]/g, '').trim()}
                            </span>
                            <span className="text-slate-500">{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ✨ NUEVO: Mensaje cuando no hay posts en el filtro */}
                {myPosts.filter(post => {
                  const postStatus = (post.status || '').toLowerCase();
                  if (statusFilter === 'all') return true;
                  if (statusFilter === 'open') return !post.status || postStatus === 'open' || postStatus === 'pending';
                  if (statusFilter === 'in_progress') return postStatus === 'in_progress';
                  if (statusFilter === 'completed') return postStatus === 'completed';
                  return true;
                }).length === 0 && myPosts.length > 0 && (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-yellow-200/30 text-center">
                    <div className="text-4xl mb-3">
                      {statusFilter === 'open' && '🟢'}
                      {statusFilter === 'in_progress' && '🔧'}
                      {statusFilter === 'completed' && '✅'}
                    </div>
                    <p className="text-slate-600 font-medium">No hay publicaciones {
                      statusFilter === 'open' ? 'abiertas' :
                      statusFilter === 'in_progress' ? 'en progreso' :
                      statusFilter === 'completed' ? 'completadas' : ''
                    }</p>
                    <p className="text-xs text-slate-500 mt-1">Cambia el filtro para ver otras publicaciones</p>
                  </div>
                )}

                {myPosts.length === 0 && !loading && (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-yellow-200/30 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full flex items-center justify-center">
                      <Plus className="w-8 h-8 text-slate-800" />
                    </div>
                    <p className="text-slate-600 font-medium">No tienes publicaciones aún</p>
                    <p className="text-xs text-slate-500 mt-1">Crea tu primera publicación para comenzar</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl border border-yellow-200/30 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Estadísticas de tus Posts</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200/30">
                <p className="text-sm text-slate-600 font-medium">Vistas Totales</p>
                <p className="text-2xl font-bold text-slate-800">45</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200/30">
                <p className="text-sm text-slate-600 font-medium">Contactos Recibidos</p>
                <p className="text-2xl font-bold text-slate-800">12</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200/30">
                <p className="text-sm text-slate-600 font-medium">Posts Activos</p>
                <p className="text-2xl font-bold text-slate-800">1</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200/30">
                <p className="text-sm text-slate-600 font-medium">Tasa de Conversión</p>
                <p className="text-2xl font-bold text-slate-800">26.7%</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl border border-yellow-200/30 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Configuración de Publicaciones</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-yellow-200/30 rounded-lg bg-gradient-to-br from-yellow-50/50 to-white">
                <div>
                  <h4 className="font-bold text-slate-800">Auto-renovación</h4>
                  <p className="text-sm text-slate-600">Renueva automáticamente tus posts cada 30 días</p>
                </div>
                <button className="bg-gradient-to-r from-yellow-300 to-yellow-400 text-slate-800 px-4 py-2 rounded-lg text-sm font-bold hover:shadow-md transition-all duration-200">
                  Activar
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-yellow-200/30 rounded-lg bg-gradient-to-br from-yellow-50/50 to-white">
                <div>
                  <h4 className="font-bold text-slate-800">Notificaciones de contacto</h4>
                  <p className="text-sm text-slate-600">Recibe notificaciones cuando alguien se interese en tu servicio</p>
                </div>
                <button className="bg-gradient-to-r from-green-400 to-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:shadow-md transition-all duration-200">
                  Activo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Eliminar publicación?
              </h3>

              <p className="text-gray-600 mb-2">
                <strong>{selectedPost.title}</strong>
              </p>

              <p className="text-sm text-gray-500 mb-6">
                Esta acción no se puede deshacer. La publicación será eliminada permanentemente.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedPost(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  onClick={() => handleDeletePost(selectedPost.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisPublicaciones;