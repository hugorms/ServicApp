import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X, Briefcase, MessageSquare, Calendar, Check, UserCheck, Eye, TrendingUp } from 'lucide-react';
import { mysqlClient } from '../utils/mysqlClient';

const NotificationCenter = ({ userId, userType, onNavigateToPost }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    new_jobs: true,
    messages: true,
    appointments: true
  });

  // Cargar notificaciones desde MySQL
  const loadNotifications = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const mysqlNotifications = await mysqlClient.select(
        'notifications',
        `user_id = ${userId} AND read_at IS NULL`,
        'created_at DESC'
      );

      setNotifications(mysqlNotifications || []);
      setUnreadCount(mysqlNotifications?.length || 0);
      console.log('✅ Notificaciones cargadas desde MySQL:', mysqlNotifications?.length || 0);
    } catch (error) {
      console.error('❌ Error cargando notificaciones:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Manejar clic en notificación
  const handleNotificationClick = async (notification) => {
    // Marcar como leída
    await markAsRead(notification.id);

    // Cerrar panel de notificaciones
    setShowNotifications(false);

    // Navegar según el tipo de notificación
    if (onNavigateToPost && notification.related_id &&
        ['new_job', 'application', 'project_update', 'profile_view'].includes(notification.type)) {
      onNavigateToPost(notification.related_id, notification.type);
    }
  };

  // Marcar notificación como leída
  const markAsRead = async (notificationId) => {
    try {
      await mysqlClient.update(
        'notifications',
        { read_at: new Date().toISOString().slice(0, 19).replace('T', ' ') },
        `id = ${notificationId}`
      );
      console.log('✅ Notificación marcada como leída en MySQL');

      // Actualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ Error marcando notificación como leída:', error);
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      await mysqlClient.update(
        'notifications',
        { read_at: new Date().toISOString().slice(0, 19).replace('T', ' ') },
        `user_id = ${userId} AND read_at IS NULL`
      );
      console.log('✅ Todas las notificaciones marcadas como leídas en MySQL');

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('❌ Error marcando todas como leídas:', error);
    }
  };

  // Cargar preferencias de notificación desde MySQL
  const loadPreferences = async () => {
    if (!userId) return;

    try {
      const user = await mysqlClient.select('users', `id = ${userId}`);
      if (user && user.length > 0 && user[0].notification_preferences) {
        const prefs = typeof user[0].notification_preferences === 'string'
          ? JSON.parse(user[0].notification_preferences)
          : user[0].notification_preferences;

        setPreferences({
          new_jobs: prefs.new_applications ?? true,
          messages: prefs.messages ?? true,
          appointments: prefs.job_updates ?? true
        });
      }
    } catch (error) {
      console.error('❌ Error cargando preferencias:', error);
      // Set default preferences on error
      setPreferences({
        new_jobs: true,
        messages: true,
        appointments: true
      });
    }
  };

  // Actualizar preferencias
  const updatePreferences = async (newPrefs) => {
    try {
      await apiClient.put(`/notification-preferences/${userId}`, newPrefs);

      setPreferences(newPrefs);
      alert('Preferencias actualizadas exitosamente');
    } catch (error) {
      console.error('Error actualizando preferencias:', error);
      handleApiError(error);
      alert('Error al actualizar preferencias');
    }
  };

  // Suscribirse a nuevas notificaciones en tiempo real
  useEffect(() => {
    if (!userId) return;

    loadNotifications();
    loadPreferences();

    // TODO: Implementar real-time notifications con MySQL
    console.log('Setting up real-time notifications for user:', userId);

    // Pedir permisos de notificación del navegador
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      console.log('Cleaning up notifications subscription');
    };
  }, [userId]);

  // Recargar notificaciones cada 30 segundos
  useEffect(() => {
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Obtener icono según tipo de notificación
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_job':
        return <Briefcase className="w-5 h-5 text-yellow-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'appointment':
        return <Calendar className="w-5 h-5 text-green-500" />;
      case 'application':
        return <UserCheck className="w-5 h-5 text-purple-500" />;
      case 'project_update':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'profile_view':
        return <Eye className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES');
  };

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 hover:bg-yellow-200/30 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6 text-slate-800" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {showNotifications && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 p-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Notificaciones</h3>
            <button
              onClick={() => setShowNotifications(false)}
              className="p-1 hover:bg-yellow-200/30 rounded-full"
            >
              <X className="w-4 h-4 text-slate-800" />
            </button>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No tienes notificaciones nuevas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-slate-800">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer con opciones */}
          {notifications.length > 0 && (
            <div className="border-t p-2">
              <button
                onClick={markAllAsRead}
                className="w-full text-center text-sm text-yellow-600 hover:text-yellow-700 py-2 hover:bg-yellow-50 rounded"
              >
                Marcar todas como leídas
              </button>
            </div>
          )}

          {/* Preferencias (solo para trabajadores) */}
          {userType === 'worker' && (
            <div className="border-t p-3 bg-gray-50">
              <p className="text-xs font-medium text-gray-700 mb-2">Preferencias:</p>
              <div className="space-y-1">
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={preferences.new_jobs}
                    onChange={(e) => updatePreferences({
                      ...preferences,
                      new_jobs: e.target.checked
                    })}
                    className="mr-2"
                  />
                  Nuevos trabajos
                </label>
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={preferences.messages}
                    onChange={(e) => updatePreferences({
                      ...preferences,
                      messages: e.target.checked
                    })}
                    className="mr-2"
                  />
                  Mensajes
                </label>
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={preferences.appointments}
                    onChange={(e) => updatePreferences({
                      ...preferences,
                      appointments: e.target.checked
                    })}
                    className="mr-2"
                  />
                  Citas
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;