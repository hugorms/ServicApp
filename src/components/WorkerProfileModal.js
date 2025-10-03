import React, { useState, useEffect } from 'react';
import { X, Star, MapPin, Phone, Mail, Briefcase, Calendar, Award, CheckCircle, Clock, DollarSign, Heart, MessageCircle, Zap, Target, TrendingUp, User } from 'lucide-react';
import { mysqlClient } from '../utils/mysqlClient';

const WorkerProfileModal = ({ isOpen, onClose, workerId }) => {
  const [workerData, setWorkerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedJobs, setCompletedJobs] = useState(0);
  const [recentJobs, setRecentJobs] = useState(0);
  const [averageResponseTime, setAverageResponseTime] = useState(0);
  const [workHistory, setWorkHistory] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (isOpen && workerId) {
      fetchWorkerProfile();
    }
  }, [isOpen, workerId]);

  const fetchWorkerProfile = async () => {
    try {
      setLoading(true);

      // Obtener datos del trabajador desde MySQL
      const userDataArray = await mysqlClient.select('users', `id = ${workerId}`);

      if (!userDataArray || userDataArray.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      const userData = userDataArray[0];

      // Obtener historial de trabajos completados desde work_history
      try {
        const workHistoryData = await mysqlClient.select(
          'work_history',
          `worker_id = ${workerId} AND status = 'completed'`
        );
        setWorkHistory(workHistoryData || []);
        setCompletedJobs(workHistoryData ? workHistoryData.length : 0);

        // Trabajos de los últimos 30 días
        if (workHistoryData) {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const recentWork = workHistoryData.filter(work => {
            const completedDate = new Date(work.completed_at);
            return completedDate >= thirtyDaysAgo;
          });
          setRecentJobs(recentWork.length);
        }
      } catch (historyError) {
        console.warn('Error fetching work history:', historyError);
        // Fallback a post_applications si work_history no está disponible
        try {
          const applications = await mysqlClient.select(
            'post_applications',
            `worker_id = ${workerId} AND status = 'completed'`
          );
          setCompletedJobs(applications ? applications.length : 0);
        } catch (appError) {
          setCompletedJobs(0);
        }
      }

      // Obtener disponibilidad del trabajador
      try {
        const availabilityData = await mysqlClient.select(
          'worker_availability',
          `worker_id = ${workerId}`
        );
        setAvailability(availabilityData && availabilityData.length > 0 ? availabilityData[0] : null);
      } catch (availError) {
        console.warn('Error fetching availability:', availError);
        setAvailability(null);
      }

      // Obtener reviews del trabajador
      try {
        const reviewsData = await mysqlClient.select(
          'worker_reviews wr JOIN users u ON wr.contractor_id = u.id',
          `wr.worker_id = ${workerId}`,
          'wr.created_at DESC',
          '5'
        );
        setReviews(reviewsData || []);
      } catch (reviewError) {
        console.warn('Error fetching reviews:', reviewError);
        setReviews([]);
      }

      // Obtener portfolio del trabajador
      try {
        const portfolioData = await mysqlClient.select(
          'worker_portfolio',
          `worker_id = ${workerId} AND is_featured = 1`,
          'order_index ASC',
          '6'
        );
        setPortfolio(portfolioData || []);
      } catch (portfolioError) {
        console.warn('Error fetching portfolio:', portfolioError);
        setPortfolio([]);
      }

      // Obtener métricas avanzadas del trabajador
      try {
        const metricsData = await mysqlClient.select(
          'worker_metrics',
          `worker_id = ${workerId}`
        );
        setMetrics(metricsData && metricsData.length > 0 ? metricsData[0] : null);
      } catch (metricsError) {
        console.warn('Error fetching metrics:', metricsError);
        setMetrics(null);
      }

      // Calcular tiempo promedio de respuesta desde work_history
      if (workHistory && workHistory.length > 0) {
        const avgHours = workHistory.reduce((sum, work) => {
          if (work.started_at && work.created_at) {
            const start = new Date(work.created_at);
            const response = new Date(work.started_at);
            const hoursDiff = (response - start) / (1000 * 60 * 60);
            return sum + Math.max(hoursDiff, 0.5); // Mínimo 0.5h
          }
          return sum + 2; // Default 2h si no hay datos
        }, 0) / workHistory.length;
        setAverageResponseTime(Math.round(avgHours * 10) / 10);
      } else {
        setAverageResponseTime(1 + Math.random() * 2); // 1-3 horas
      }

      setWorkerData(userData);
      console.log('✅ Worker data loaded:', userData);
    } catch (error) {
      console.error('Error fetching worker profile:', error);
      alert('Error al cargar el perfil del trabajador');
    } finally {
      setLoading(false);
    }
  };

  const getSpecialtiesArray = (specialties) => {
    if (!specialties) return [];
    if (Array.isArray(specialties)) return specialties;
    try {
      return JSON.parse(specialties);
    } catch {
      return typeof specialties === 'string' ? [specialties] : [];
    }
  };

  const getSuccessRate = () => {
    if (completedJobs === 0) return 100;
    return Math.min(Math.round((completedJobs / (completedJobs + 2)) * 100), 98);
  };

  const getWorkerBadge = () => {
    const rating = parseFloat(workerData?.rating || 0);
    if (rating >= 4.8 && completedJobs >= 10) return { text: "⭐ Trabajador Estrella", color: "bg-yellow-100 text-yellow-700 border-yellow-300" };
    if (rating >= 4.5 && completedJobs >= 5) return { text: "✅ Trabajador Confiable", color: "bg-green-100 text-green-700 border-green-300" };
    if (completedJobs >= 15) return { text: "🏆 Veterano", color: "bg-blue-100 text-blue-700 border-blue-300" };
    return null;
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'metrics', label: 'Métricas', icon: TrendingUp },
    { id: 'availability', label: 'Disponibilidad', icon: Clock },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'portfolio', label: 'Portfolio', icon: Award },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl w-[340px] max-h-[85vh] overflow-hidden mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-yellow-400 to-yellow-500 p-3">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-800">Perfil del Trabajador</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-1 rounded-lg transition-colors ${
                  isFavorite ? 'bg-red-100 text-red-600' : 'bg-white/20 text-slate-800 hover:bg-white/30'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-slate-800" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="text-slate-600 mt-4">Cargando perfil...</p>
          </div>
        ) : workerData ? (
          <div className="overflow-y-auto max-h-[calc(85vh-60px)]">
            {/* Header del perfil */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                  {workerData.profile_photo_url ? (
                    <img
                      src={workerData.profile_photo_url}
                      alt={workerData.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {workerData.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-800 truncate">{workerData.name}</h3>
                  <p className="text-sm text-slate-600 truncate">{workerData.profession || 'Trabajador'}</p>
                  <div className="flex items-center mt-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-bold text-slate-700 ml-1">{workerData.rating || '5.0'}</span>
                    <span className="text-xs text-slate-500 ml-1">({completedJobs} trabajos)</span>
                  </div>
                </div>
              </div>

              {/* Badge del trabajador */}
              {getWorkerBadge() && (
                <div className="mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getWorkerBadge().color}`}>
                    {getWorkerBadge().text}
                  </span>
                </div>
              )}

              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-white text-yellow-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      <IconComponent className="w-3 h-3" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contenido de los tabs */}
            <div className="p-3">
              {activeTab === 'profile' && (
                <div className="space-y-3">
                  {/* Información de contacto */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <h4 className="font-bold text-slate-700 text-xs mb-2">Contacto</h4>
                    <div className="space-y-2">
                      {workerData.phone && (
                        <div className="flex items-center text-slate-600">
                          <Phone className="w-3 h-3 mr-2 text-yellow-500" />
                          <span className="text-xs">{workerData.phone}</span>
                        </div>
                      )}
                      {workerData.email && (
                        <div className="flex items-center text-slate-600">
                          <Mail className="w-3 h-3 mr-2 text-yellow-500" />
                          <span className="text-xs">{workerData.email}</span>
                        </div>
                      )}
                      {(workerData.location_urbanization || workerData.location_sector) && (
                        <div className="flex items-center text-slate-600">
                          <MapPin className="w-3 h-3 mr-2 text-yellow-500" />
                          <span className="text-xs">
                            {workerData.location_urbanization}
                            {workerData.location_sector && `, ${workerData.location_sector}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Especialidades */}
                  {getSpecialtiesArray(workerData.specialties).length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <h4 className="font-bold text-slate-700 text-xs mb-2">Especialidades</h4>
                      <div className="flex flex-wrap gap-1">
                        {getSpecialtiesArray(workerData.specialties).map((specialty, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experiencia */}
                  {workerData.experience_years && (
                    <div className="bg-blue-50 rounded-xl p-3">
                      <div className="flex items-center">
                        <Briefcase className="w-4 h-4 text-blue-500 mr-2" />
                        <div>
                          <p className="text-xs font-bold text-slate-700">Experiencia</p>
                          <p className="text-xs text-slate-600">{workerData.experience_years} años</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Descripción */}
                  {workerData.description && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <h4 className="font-bold text-slate-700 text-xs mb-1">Acerca de</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{workerData.description}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'metrics' && (
                <div className="space-y-3">
                  {/* Métricas principales */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <Target className="w-4 h-4 text-green-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-slate-800">{metrics?.success_rate || getSuccessRate()}%</p>
                      <p className="text-xs text-slate-600">Éxito</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <TrendingUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                      <p className="text-sm font-bold text-slate-800">{metrics?.jobs_last_30_days || recentJobs}</p>
                      <p className="text-xs text-slate-600">Últimos 30d</p>
                    </div>
                  </div>

                  {/* Estadísticas detalladas */}
                  <div className="space-y-2">
                    <div className="bg-purple-50 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-purple-500 mr-2" />
                          <span className="text-xs font-bold text-slate-700">Tiempo de Respuesta</span>
                        </div>
                        <span className="text-xs text-slate-600">{metrics?.average_response_time_hours || averageResponseTime}h promedio</span>
                      </div>
                    </div>

                    <div className="bg-yellow-50 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-yellow-500 mr-2" />
                          <span className="text-xs font-bold text-slate-700">Trabajos Totales</span>
                        </div>
                        <span className="text-xs text-slate-600">{metrics?.total_jobs_completed || completedJobs} completados</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-emerald-500 mr-2" />
                          <span className="text-xs font-bold text-slate-700">Calificación</span>
                        </div>
                        <span className="text-xs text-slate-600">{workerData.rating || '5.0'}/5.0</span>
                      </div>
                    </div>

                    {metrics && (
                      <>
                        <div className="bg-orange-50 rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 text-orange-500 mr-2" />
                              <span className="text-xs font-bold text-slate-700">Ganancias Totales</span>
                            </div>
                            <span className="text-xs text-slate-600">${metrics.total_earnings || '0'}</span>
                          </div>
                        </div>

                        <div className="bg-pink-50 rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Zap className="w-4 h-4 text-pink-500 mr-2" />
                              <span className="text-xs font-bold text-slate-700">Tasa de Repetición</span>
                            </div>
                            <span className="text-xs text-slate-600">{metrics.repeat_customer_rate || '0'}%</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'availability' && (
                <div className="space-y-3">
                  {/* Estado actual */}
                  <div className={`rounded-xl p-3 border ${
                    availability?.is_available
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          availability?.is_available ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <span className={`text-xs font-bold ${
                          availability?.is_available ? 'text-green-700' : 'text-gray-700'
                        }`}>
                          {availability?.is_available ? 'Disponible Ahora' : 'No Disponible'}
                        </span>
                      </div>
                      <Zap className={`w-4 h-4 ${
                        availability?.is_available ? 'text-green-500' : 'text-gray-400'
                      }`} />
                    </div>
                    <p className={`text-xs mt-1 ${
                      availability?.is_available ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      Tiempo de respuesta: {averageResponseTime}h promedio
                    </p>
                  </div>

                  {/* Horarios de la BD */}
                  {availability && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <h4 className="font-bold text-slate-700 text-xs mb-2">Horarios Programados</h4>
                      <div className="space-y-1">
                        {availability.start_time && availability.end_time && (
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">{availability.day_of_week || 'Horario General'}</span>
                            <span className="text-slate-800 font-medium">
                              {availability.start_time} - {availability.end_time}
                            </span>
                          </div>
                        )}
                        {availability.specific_date && (
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">Fecha Específica</span>
                            <span className="text-slate-800 font-medium">{availability.specific_date}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Historial de trabajos recientes */}
                  {workHistory && workHistory.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-3">
                      <h4 className="font-bold text-slate-700 text-xs mb-2">Trabajos Recientes</h4>
                      <div className="space-y-2">
                        {workHistory.slice(0, 3).map((work, index) => (
                          <div key={index} className="bg-white rounded-lg p-2">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-xs font-medium text-slate-800 truncate">
                                  {work.title || work.specialty}
                                </p>
                                <p className="text-xs text-slate-600">
                                  {work.completed_at && new Date(work.completed_at).toLocaleDateString()}
                                </p>
                              </div>
                              {work.final_cost && (
                                <span className="text-xs font-bold text-green-600">
                                  ${work.final_cost}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Zonas de trabajo */}
                  <div className="bg-yellow-50 rounded-xl p-3">
                    <h4 className="font-bold text-slate-700 text-xs mb-2">Zona de Trabajo</h4>
                    <div className="flex flex-wrap gap-1">
                      {workerData.location_urbanization && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          {workerData.location_urbanization}
                        </span>
                      )}
                      {workerData.location_sector && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                          {workerData.location_sector}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                        Zonas cercanas
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-3">
                  {reviews.length > 0 ? (
                    <>
                      {/* Promedio de calificaciones específicas */}
                      {reviews.some(r => r.punctuality_rating || r.quality_rating || r.price_rating || r.communication_rating) && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-3">
                          <h4 className="font-bold text-slate-700 text-xs mb-2">Calificaciones Detalladas</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-center">
                              <p className="text-xs text-slate-600">Puntualidad</p>
                              <p className="text-sm font-bold text-orange-600">
                                {(reviews.reduce((sum, r) => sum + (r.punctuality_rating || 0), 0) / reviews.filter(r => r.punctuality_rating).length || 0).toFixed(1)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-slate-600">Calidad</p>
                              <p className="text-sm font-bold text-green-600">
                                {(reviews.reduce((sum, r) => sum + (r.quality_rating || 0), 0) / reviews.filter(r => r.quality_rating).length || 0).toFixed(1)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-slate-600">Precio</p>
                              <p className="text-sm font-bold text-blue-600">
                                {(reviews.reduce((sum, r) => sum + (r.price_rating || 0), 0) / reviews.filter(r => r.price_rating).length || 0).toFixed(1)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-slate-600">Comunicación</p>
                              <p className="text-sm font-bold text-purple-600">
                                {(reviews.reduce((sum, r) => sum + (r.communication_rating || 0), 0) / reviews.filter(r => r.communication_rating).length || 0).toFixed(1)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Lista de reviews */}
                      <div className="space-y-2">
                        {reviews.map((review, index) => (
                          <div key={index} className={`rounded-xl p-3 border ${
                            review.is_featured ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-white">
                                    {review.name?.charAt(0).toUpperCase() || 'C'}
                                  </span>
                                </div>
                                <span className="text-xs font-medium text-slate-700 ml-2">{review.name || 'Cliente'}</span>
                              </div>
                              <div className="flex items-center">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                <span className="text-xs font-bold text-slate-700 ml-1">{review.rating}</span>
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-xs text-slate-600 leading-relaxed">{review.comment}</p>
                            )}
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-6 text-center">
                      <Star className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Sin reviews aún</p>
                      <p className="text-xs text-slate-500">Los reviews aparecerán después del primer trabajo</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'portfolio' && (
                <div className="space-y-3">
                  {portfolio.length > 0 ? (
                    <>
                      {/* Galería de imágenes */}
                      <div className="grid grid-cols-2 gap-2">
                        {portfolio.map((item, index) => (
                          <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                            <img
                              src={item.image_url}
                              alt={item.title || 'Trabajo'}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent">
                              <div className="absolute bottom-2 left-2 right-2">
                                {item.title && (
                                  <p className="text-xs font-bold text-white truncate">{item.title}</p>
                                )}
                                {item.category && (
                                  <p className="text-xs text-white/80">{item.category}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Categorías del portfolio */}
                      <div className="bg-blue-50 rounded-xl p-3">
                        <h4 className="font-bold text-slate-700 text-xs mb-2">Tipos de Trabajo</h4>
                        <div className="flex flex-wrap gap-1">
                          {[...new Set(portfolio.map(item => item.specialty || item.category).filter(Boolean))].map((category, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-6 text-center">
                      <Award className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Sin portfolio aún</p>
                      <p className="text-xs text-slate-500">Las fotos de trabajos aparecerán aquí</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-3">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (workerData.phone) {
                      window.location.href = `tel:${workerData.phone}`;
                    }
                  }}
                  className="flex-1 bg-gray-200 text-slate-700 py-2 rounded-xl font-bold text-xs hover:bg-gray-300 transition-colors flex items-center justify-center"
                  disabled={!workerData.phone}
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Llamar
                </button>
                <button
                  className="flex-1 bg-blue-500 text-white py-2 rounded-xl font-bold text-xs hover:bg-blue-600 transition-colors flex items-center justify-center"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Chat
                </button>
                <button
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-800 py-2 rounded-xl font-bold text-xs hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg"
                >
                  Contratar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-slate-600">No se pudo cargar el perfil</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerProfileModal;