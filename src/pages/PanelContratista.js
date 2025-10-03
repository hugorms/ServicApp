import React, { useState, useEffect } from 'react';
import { Search, Bell, MapPin, Star, Clock, CheckCircle, Users, X, AlertCircle, Info, CheckCircle2, ArrowLeft, ChevronRight } from 'lucide-react';
import { mysqlClient } from '../utils/mysqlClient';
import WorkerProfileModal from '../components/WorkerProfileModal';
import NotificationCenter from '../components/NotificationCenter';
import NotificationService from '../utils/notificationService';

const PanelContratista = ({ userProfile, socket, onNavigateToPost }) => {
  const [activeTab, setActiveTab] = useState('applications');
  const [searchTerm, setSearchTerm] = useState('');
  const [workers, setWorkers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showWorkerModal, setShowWorkerModal] = useState(false);

  // Estados para navegación con transiciones
  const [applicationView, setApplicationView] = useState('posts'); // 'posts', 'applicants', 'profile'
  const [selectedPost, setSelectedPost] = useState(null);
  const [postApplicants, setPostApplicants] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [slideDirection, setSlideDirection] = useState('');

  // Estados para proyectos activos
  const [activeProjects, setActiveProjects] = useState([]);


  // Cargar trabajadores desde MySQL
  const loadWorkers = async () => {
    setLoading(true);
    try {
      // Cargar trabajadores desde MySQL
      let filteredWorkers = await mysqlClient.select(
        'users',
        `user_type = 'worker' AND profile_completed = 1`,
        'rating DESC'
      );

      filteredWorkers = filteredWorkers || [];

      // Filtrar por término de búsqueda
      if (searchTerm) {
        filteredWorkers = filteredWorkers.filter(worker =>
          worker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          worker.profession?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setWorkers(filteredWorkers.slice(0, 20)); // Limitar a 20
      console.log('✅ Trabajadores cargados desde MySQL:', filteredWorkers.length);
    } catch (error) {
      console.error('❌ Error loading workers:', error);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar publicaciones con aplicaciones agrupadas
  const loadApplicationsGrouped = async () => {
    try {
      // Cargar todos los posts del contratista
      const allPosts = await mysqlClient.select(
        'posts',
        `contractor_id = ${userProfile.id}`,
        'created_at DESC'
      );

      // Contar aplicaciones para cada post
      const postsWithCounts = [];
      for (const post of allPosts) {
        const applications = await mysqlClient.select(
          'post_applications',
          `post_id = ${post.id}`
        );

        if (applications.length > 0) {
          postsWithCounts.push({
            ...post,
            application_count: applications.length
          });
        }
      }

      console.log('✅ Posts con aplicaciones:', postsWithCounts);
      setApplications(postsWithCounts);
    } catch (error) {
      console.error('Error loading posts with applications:', error);
      setApplications([]);
    }
  };

  // Cargar aplicantes de una publicación específica
  const loadPostApplicants = async (postId) => {
    try {
      // Cargar aplicaciones de la publicación específica
      const applications = await mysqlClient.select(
        'post_applications',
        `post_applications.post_id = ${postId}`,
        'post_applications.applied_at DESC'
      );

      console.log(`🎯 Buscando aplicaciones para post_id: ${postId}`);

      if (applications.length > 0) {
        console.log('🔍 Aplicaciones encontradas:', applications);

        // Obtener información de cada usuario desde MySQL
        const applicantsWithUserInfo = [];

        for (const app of applications) {
          try {
            console.log(`🔍 Buscando usuario con ID: ${app.worker_id} en MySQL...`);

            // Consultar usuario desde MySQL
            const users = await mysqlClient.select(
              'users',
              `users.id = ${app.worker_id}`
            );

            if (users.length > 0) {
              const user = users[0];
              console.log('✅ Usuario encontrado en MySQL:', user);

              applicantsWithUserInfo.push({
                ...app,
                name: user.name || 'Usuario sin nombre',
                profession: user.profession || 'N/A',
                email: user.email || 'N/A',
                phone: user.phone || 'N/A',
                rating: Number(user.rating) || 5.0,
                profile_photo_url: user.profile_photo_url,
                specialties: user.specialties,
                location_urbanization: user.location_urbanization
              });
            } else {
              console.log(`⚠️ Usuario con ID ${app.worker_id} no encontrado en MySQL`);

              // Si no se encuentra el usuario, usar datos básicos de la aplicación
              applicantsWithUserInfo.push({
                ...app,
                name: 'Usuario desconocido',
                profession: 'N/A',
                email: 'N/A',
                phone: 'N/A',
                rating: 5.0,
                profile_photo_url: null,
                specialties: null,
                location_urbanization: null
              });
            }
          } catch (userError) {
            console.error(`Error consultando usuario ${app.worker_id}:`, userError);

            // Si falla MySQL, usar datos básicos
            applicantsWithUserInfo.push({
              ...app,
              name: 'Error cargando usuario',
              profession: 'N/A',
              email: 'N/A',
              phone: 'N/A',
              rating: 5.0,
              profile_photo_url: null,
              specialties: null,
              location_urbanization: null
            });
          }
        }

        console.log('✅ Aplicantes con datos completos:', applicantsWithUserInfo);
        setPostApplicants(applicantsWithUserInfo);
      } else {
        console.log('📭 No hay aplicantes para esta publicación');
        setPostApplicants([]);
      }
    } catch (error) {
      console.error('Error cargando aplicantes:', error);
      setPostApplicants([]);
    }
  };

  // Cargar proyectos activos reales desde MySQL
  const loadActiveProjects = async () => {
    try {
      console.log('🔍 Cargando proyectos activos del contratista...');

      // Cargar proyectos activos del contratista
      const projects = await mysqlClient.select(
        'active_projects',
        `contractor_id = ${userProfile.id}`,
        'created_at DESC'
      );

      if (projects.length > 0) {
        // Enriquecer con datos del trabajador
        const projectsWithWorkerData = [];

        for (const project of projects) {
          try {
            // Obtener datos del trabajador
            const workers = await mysqlClient.select(
              'users',
              `users.id = ${project.worker_id}`
            );

            if (workers.length > 0) {
              const worker = workers[0];
              projectsWithWorkerData.push({
                ...project,
                worker_name: worker.name,
                worker_profession: worker.profession,
                worker_rating: Number(worker.rating) || 5.0,
                worker_photo: worker.profile_photo_url
              });
            }
          } catch (workerError) {
            console.error(`Error cargando datos del trabajador ${project.worker_id}:`, workerError);
            // Agregar proyecto sin datos del trabajador
            projectsWithWorkerData.push({
              ...project,
              worker_name: 'Trabajador desconocido',
              worker_profession: 'N/A',
              worker_rating: 5.0,
              worker_photo: null
            });
          }
        }

        console.log('✅ Proyectos activos cargados:', projectsWithWorkerData);
        setActiveProjects(projectsWithWorkerData);
      } else {
        console.log('📭 No hay proyectos activos');
        setActiveProjects([]);
      }
    } catch (error) {
      console.error('Error cargando proyectos activos:', error);
      setActiveProjects([]);
    }
  };

  // Effect para cargar datos
  useEffect(() => {
    if (activeTab === 'applications') {
      loadApplicationsGrouped();
      setApplicationView('posts'); // Reset view
    } else if (activeTab === 'projects') {
      loadActiveProjects();
    }
  }, [activeTab, searchTerm, userProfile.id]);

  // Responder a aplicación
  const respondToApplication = async (applicationId, status, message = '') => {
    try {
      console.log(`🔄 Actualizando aplicación ${applicationId} a status: ${status}`);

      // Solo actualizar el status
      const updateData = {
        status: status
      };

      await mysqlClient.update('post_applications', updateData, `id = ${applicationId}`);

      console.log('✅ Status actualizado correctamente');

      // Obtener datos de la aplicación y el trabajador para notificaciones
      const applications = await mysqlClient.select(
        'post_applications',
        `id = ${applicationId}`
      );

      let workerData = null;
      if (applications.length > 0) {
        const application = applications[0];

        // Obtener datos del trabajador
        const workers = await mysqlClient.select(
          'users',
          `id = ${application.worker_id}`
        );
        if (workers.length > 0) {
          workerData = workers[0];
        }
      }

      // Si es aceptado, crear trabajo activo y redirigir
      if (status === 'accepted') {
        console.log('🎯 Trabajo aceptado - creando proyecto activo');

        try {
          if (applications.length > 0) {
            const application = applications[0];
            console.log('📋 Datos de aplicación:', application);

            // Crear proyecto activo con datos básicos
            const projectData = {
              post_id: application.post_id,
              contractor_id: userProfile.id,
              worker_id: application.worker_id,
              application_id: applicationId,
              title: 'Trabajo Aceptado', // Título básico por ahora
              description: application.message || 'Proyecto aceptado del trabajador',
              specialty: 'General',
              location: 'Por definir',
              budget_min: 0,
              budget_max: 0,
              status: 'assigned',
              progress_percentage: 0,
              accepted_at: new Date().toISOString()
            };

            await mysqlClient.insert('active_projects', projectData);
            console.log('✅ Proyecto activo creado en MySQL');

            // Crear notificación para el trabajador aceptado usando el servicio
            if (workerData) {
              await NotificationService.notifyApplicationResponse(
                workerData.id,
                true, // aceptada
                'Trabajo aceptado',
                application.post_id
              );
            }
          }
        } catch (projectError) {
          console.error('Error creando proyecto activo:', projectError);
        }

        // Cambiar automáticamente al tab de Proyectos
        setActiveTab('projects');

        // Mostrar mensaje de éxito
        alert('¡Trabajador aceptado! Proyecto creado y trabajador notificado. Ahora puedes ver el progreso en Proyectos.');
      } else {
        // Notificar al trabajador que fue rechazado usando el servicio
        if (workerData) {
          await NotificationService.notifyApplicationResponse(
            workerData.id,
            false, // rechazada
            'Aplicación no seleccionada',
            applications[0].post_id
          );
        }
        alert('Aplicación rechazada. El trabajador ha sido notificado.');
      }

      // Recargar aplicaciones
      loadApplicationsGrouped();
    } catch (error) {
      console.error('Error responding to application:', error);
      console.error('Error details:', error.message);
      alert('Error al responder a la aplicación: ' + error.message);
    }
  };

  // Ver perfil del trabajador
  const viewWorkerProfile = (worker) => {
    setSelectedWorker(worker);
    setShowWorkerModal(true);
  };

  // Navegación con transiciones simples
  const goToApplicants = (post) => {
    setSelectedPost(post);
    loadPostApplicants(post.id);
    setApplicationView('applicants');
  };

  const goToApplicantProfile = async (applicant) => {
    setSelectedApplicant(applicant);
    setApplicationView('profile');

    // Notificar al trabajador que el contratista vio su perfil usando el servicio
    await NotificationService.notifyProfileView(
      applicant.worker_id,
      selectedPost?.title,
      selectedPost?.id
    );
  };

  const goBackToPosts = () => {
    setApplicationView('posts');
    setSelectedPost(null);
    setPostApplicants([]);
  };

  const goBackToApplicants = () => {
    setApplicationView('applicants');
    setSelectedApplicant(null);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Ahora mismo';
    if (diffInHours < 24) return `Hace ${Math.floor(diffInHours)}h`;
    if (diffInHours < 48) return 'Ayer';

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">Panel Contratista</h1>
          <div className="flex items-center space-x-2">
            <NotificationCenter
              userId={userProfile.id}
              userType={userProfile.user_type}
              onNavigateToPost={onNavigateToPost}
            />
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-slate-800 text-lg font-bold">
              {userProfile.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-yellow-200/30 px-2">
        <div className="flex justify-center items-center space-x-2">
          {[
            { id: 'applications', label: 'Aplicaciones', icon: Users },
            { id: 'projects', label: 'Proyectos', icon: Clock },
            { id: 'history', label: 'Historial', icon: CheckCircle }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-yellow-600 border-yellow-600'
                    : 'text-slate-600 border-transparent hover:text-slate-800 hover:border-yellow-200'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">

        {activeTab === 'applications' && (
          <div className="h-full">
            {/* Vista 1: Lista de Posts */}
            {applicationView === 'posts' && (
              <div className="p-4 space-y-4 h-full overflow-y-auto">
                {applications.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes aplicaciones aún
                </h3>
                <p className="text-gray-500">
                  Cuando publiques trabajos, las aplicaciones aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((post, index) => (
                  <div key={`post-${post.id}-${index}`}
                       onClick={() => goToApplicants(post)}
                       className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200/30 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800">{post.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{post.description?.substring(0, 60)}...</p>

                        <div className="flex items-center space-x-2 mt-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {post.specialty}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                            {post.application_count} aplicaciones
                          </span>
                        </div>

                        {(post.budget_min || post.budget_max) && (
                          <p className="text-green-600 font-bold text-sm mt-1">
                            ${post.budget_min || 0} - ${post.budget_max || 'N/A'}
                          </p>
                        )}
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
              </div>
            )}

            {/* Vista 2: Lista de Aplicantes */}
            {applicationView === 'applicants' && (
              <div className="h-full flex flex-col animate-slideLeft">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 p-4">
                  <div className="flex items-center space-x-3">
                    <button onClick={goBackToPosts} className="p-2 hover:bg-gray-100 rounded-full">
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800">{selectedPost?.title}</h3>
                      <p className="text-sm text-slate-600">{postApplicants.length} aplicantes</p>
                    </div>
                  </div>
                </div>

                {/* Lista */}
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  {postApplicants.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Cargando aplicantes...</p>
                    </div>
                  ) : (
                    postApplicants.map((applicant, index) => (
                      <div key={`applicant-${applicant.id}-${index}`}
                           onClick={() => goToApplicantProfile(applicant)}
                           className="bg-white rounded-lg p-3 shadow-sm border border-yellow-200/30 cursor-pointer hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3">
                          {/* Foto */}
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-slate-800 font-bold overflow-hidden">
                            {applicant.profile_photo_url ? (
                              <img src={applicant.profile_photo_url} alt={applicant.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{applicant.name?.charAt(0)?.toUpperCase()}</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800">{applicant.name}</h4>
                            <p className="text-sm text-slate-600">{applicant.profession}</p>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-bold text-slate-700">{Number(applicant.rating).toFixed(1) || '5.0'}</span>
                              </div>
                              {applicant.proposed_cost && (
                                <span className="text-xs font-bold text-green-600">
                                  ${applicant.proposed_cost}
                                </span>
                              )}
                            </div>
                          </div>

                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Vista 3: Perfil del Aplicante */}
            {applicationView === 'profile' && selectedApplicant && (
              <div className="h-full flex flex-col animate-slideLeft">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 p-4">
                  <div className="flex items-center space-x-3">
                    <button onClick={goBackToApplicants} className="p-2 hover:bg-gray-100 rounded-full">
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800">Perfil Completo</h3>
                      <p className="text-sm text-slate-600">{selectedApplicant.name}</p>
                    </div>
                  </div>
                </div>

                {/* Contenido del perfil */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {/* Foto y datos principales */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200/30 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-slate-800 text-2xl font-bold mx-auto mb-3 overflow-hidden">
                      {selectedApplicant.profile_photo_url ? (
                        <img src={selectedApplicant.profile_photo_url} alt={selectedApplicant.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{selectedApplicant.name?.charAt(0)?.toUpperCase()}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">{selectedApplicant.name}</h3>
                    <p className="text-slate-600">{selectedApplicant.profession}</p>
                    <div className="flex items-center justify-center space-x-1 mt-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span className="font-bold text-slate-700">{Number(selectedApplicant.rating).toFixed(1) || '5.0'}</span>
                    </div>
                  </div>

                  {/* Información de contacto */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200/30">
                    <h4 className="font-bold text-slate-800 mb-3">Contacto</h4>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="font-medium">Email:</span> {selectedApplicant.email}</p>
                      <p className="text-sm"><span className="font-medium">Teléfono:</span> {selectedApplicant.phone}</p>
                      {selectedApplicant.location_urbanization && (
                        <p className="text-sm"><span className="font-medium">Ubicación:</span> {selectedApplicant.location_urbanization}</p>
                      )}
                    </div>
                  </div>

                  {/* Mensaje de aplicación */}
                  {selectedApplicant.message && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200/30">
                      <h4 className="font-bold text-slate-800 mb-3">Mensaje</h4>
                      <p className="text-slate-600 italic bg-gray-50 p-3 rounded">
                        "{selectedApplicant.message}"
                      </p>
                    </div>
                  )}

                  {/* Propuesta económica y tiempo */}
                  {(selectedApplicant.proposed_cost || selectedApplicant.estimated_completion_time) && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200/30">
                      <h4 className="font-bold text-slate-800 mb-3">Propuesta del Trabajador</h4>
                      <div className="space-y-2">
                        {selectedApplicant.proposed_cost && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Costo propuesto:</span>
                            <span className="font-bold text-green-600">${selectedApplicant.proposed_cost}</span>
                          </div>
                        )}
                        {selectedApplicant.estimated_completion_time && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Tiempo estimado:</span>
                            <span className="font-bold text-blue-600">{selectedApplicant.estimated_completion_time}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        respondToApplication(selectedApplicant.id, 'accepted');
                        goBackToApplicants();
                      }}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Aceptar</span>
                    </button>
                    <button
                      onClick={() => {
                        respondToApplication(selectedApplicant.id, 'rejected');
                        goBackToApplicants();
                      }}
                      className="flex-1 flex items-center justify-center space-x-2 bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Proyectos Activos</h2>

            {/* Lista de proyectos activos reales */}
            {activeProjects.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes proyectos activos
                </h3>
                <p className="text-gray-500 text-sm">
                  Los trabajos aceptados aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeProjects.map((project, index) => {
                  // Determinar estado visual
                  const getStatusInfo = (status, progress) => {
                    switch(status) {
                      case 'assigned':
                        return { text: 'Asignado', color: 'bg-yellow-100 text-yellow-700', step: 0 };
                      case 'started':
                        return { text: 'Iniciado', color: 'bg-blue-100 text-blue-700', step: 1 };
                      case 'in_progress':
                        return { text: 'En Progreso', color: 'bg-blue-100 text-blue-700', step: 2 };
                      case 'completed':
                        return { text: 'Finalizado', color: 'bg-green-100 text-green-700', step: 3 };
                      default:
                        return { text: 'Asignado', color: 'bg-gray-100 text-gray-700', step: 0 };
                    }
                  };

                  const statusInfo = getStatusInfo(project.status, project.progress_percentage);

                  return (
                    <div key={`project-${project.id}-${index}`} className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200/30">
                      {/* Header del proyecto */}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-800">{project.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </div>

                      {/* Información del trabajador */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-slate-800 font-bold overflow-hidden">
                          {project.worker_photo ? (
                            <img src={project.worker_photo} alt={project.worker_name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{project.worker_name?.charAt(0)?.toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{project.worker_name}</p>
                          <p className="text-sm text-slate-600">{project.worker_profession}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-bold text-slate-700">{project.worker_rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progreso del trabajo */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Progreso del trabajo</span>
                          <span className="font-bold text-slate-800">{project.progress_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{width: `${project.progress_percentage}%`}}>
                          </div>
                        </div>
                      </div>

                      {/* Información adicional */}
                      <div className="text-sm text-slate-600 mb-4">
                        <p><span className="font-medium">Especialidad:</span> {project.specialty}</p>
                        <p><span className="font-medium">Ubicación:</span> {project.location}</p>
                        {(project.budget_min || project.budget_max) && (
                          <p><span className="font-medium">Presupuesto:</span> ${project.budget_min || 0} - ${project.budget_max || 'N/A'}</p>
                        )}
                      </div>

                      {/* Estados del proceso */}
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {[
                          { step: 0, label: 'Asignado', status: 'assigned' },
                          { step: 1, label: 'Iniciado', status: 'started' },
                          { step: 2, label: 'En Curso', status: 'in_progress' },
                          { step: 3, label: 'Finalizado', status: 'completed' }
                        ].map((stepInfo) => {
                          const isActive = statusInfo.step >= stepInfo.step;
                          const isCurrent = project.status === stepInfo.status;

                          return (
                            <div key={stepInfo.step} className="text-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                                isActive
                                  ? (isCurrent ? 'bg-blue-500' : 'bg-green-500')
                                  : 'bg-gray-300'
                              }`}>
                                {isActive ? (
                                  <CheckCircle className="w-4 h-4 text-white" />
                                ) : (
                                  <Clock className="w-4 h-4 text-gray-500" />
                                )}
                              </div>
                              <span className={`text-xs font-medium ${
                                isActive
                                  ? (isCurrent ? 'text-blue-600' : 'text-green-600')
                                  : 'text-gray-500'
                              }`}>
                                {stepInfo.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Fechas importantes */}
                      <div className="text-xs text-slate-500 mt-3 space-y-1">
                        <p>Aceptado: {new Date(project.accepted_at).toLocaleDateString('es-ES')}</p>
                        {project.started_at && (
                          <p>Iniciado: {new Date(project.started_at).toLocaleDateString('es-ES')}</p>
                        )}
                        {project.completed_at && (
                          <p>Completado: {new Date(project.completed_at).toLocaleDateString('es-ES')}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Historial de Trabajos</h2>

            {/* Lista de trabajos completados */}
            <div className="space-y-3">
              {/* Ejemplo de trabajo completado */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800">Reparación de plomería</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    ✅ Completado
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-slate-800 font-bold">
                      C
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Carlos Herrera</p>
                      <p className="text-sm text-slate-600">Plomero</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-bold text-slate-700">4.9</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-600">Completado</p>
                    <p className="text-xs text-slate-500">15 Sep 2025</p>
                    <p className="font-bold text-green-600">$150</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Tu calificación:</span>
                  <div className="flex items-center space-x-1">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Otro ejemplo */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800">Instalación eléctrica</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    ✅ Completado
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-slate-800 font-bold">
                      M
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">María Rodríguez</p>
                      <p className="text-sm text-slate-600">Electricista</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-bold text-slate-700">4.7</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-600">Completado</p>
                    <p className="text-xs text-slate-500">10 Sep 2025</p>
                    <p className="font-bold text-green-600">$220</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Tu calificación:</span>
                  <div className="flex items-center space-x-1">
                    {[1,2,3,4].map(star => (
                      <Star key={star} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                    <Star className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas del historial */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200/30">
              <h3 className="font-bold text-slate-800 mb-3">Estadísticas</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">12</p>
                  <p className="text-xs text-slate-600">Trabajos Completados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">$2,340</p>
                  <p className="text-xs text-slate-600">Total Invertido</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">4.8</p>
                  <p className="text-xs text-slate-600">Rating Promedio</p>
                </div>
              </div>
            </div>

            {/* Mensaje si no hay historial */}
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">
                Los trabajos completados aparecerán aquí
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de perfil de trabajador */}
      <WorkerProfileModal
        isOpen={showWorkerModal}
        onClose={() => setShowWorkerModal(false)}
        workerId={selectedWorker?.id}
      />
    </div>
  );
};

export default PanelContratista;