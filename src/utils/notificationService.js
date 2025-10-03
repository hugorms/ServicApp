import { mysqlClient } from './mysqlClient';

// Servicio centralizado para el manejo de notificaciones
class NotificationService {

  // Crear notificación genérica
  static async createNotification(userId, type, title, message, relatedId = null) {
    try {
      const notificationData = {
        user_id: userId,
        type,
        title,
        message,
        related_id: relatedId
      };

      // Guardar en MySQL
      const result = await mysqlClient.insert('notifications', notificationData);

      if (!result.success) {
        throw new Error('Error al crear notificación en MySQL');
      }

      console.log(`✅ Notificación enviada a usuario ${userId}: ${title}`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando notificación:', error);
      return false;
    }
  }

  // Notificar nuevos trabajos por profesión
  static async notifyNewJob(profession, postTitle, postLocation, postId) {
    try {
      console.log(`🔔 Notificando nuevo trabajo de ${profession}: ${postTitle}`);

      // Buscar trabajadores con esa profesión
      let eligibleWorkers = [];

      const allWorkers = await mysqlClient.select(
        'users',
        `user_type = 'worker' AND profile_completed = 1`
      );

      if (allWorkers && allWorkers.length > 0) {
        eligibleWorkers = allWorkers.filter(worker => {
          if (!worker.professions) return false;
          const workerProfessions = JSON.parse(worker.professions || '[]');
          // Verificar si el trabajador tiene esta profesión
          return workerProfessions.some(prof =>
            prof.profession.toLowerCase() === profession.toLowerCase()
          );
        });
      }

      // Enviar notificaciones
      let notificationCount = 0;
      for (const worker of eligibleWorkers) {
        const success = await this.createNotification(
          worker.id,
          'new_job',
          `Nuevo trabajo de ${profession}`,
          `"${postTitle}" - ${postLocation || 'Ubicación no especificada'}`,
          postId
        );
        if (success) notificationCount++;
      }

      console.log(`🎉 Notificaciones de nuevo trabajo enviadas: ${notificationCount}`);
      return notificationCount;
    } catch (error) {
      console.error('❌ Error notificando nuevo trabajo:', error);
      return 0;
    }
  }

  // Notificar cambios en el estado del proyecto
  static async notifyProjectStatusChange(projectId, workerId, contractorId, newStatus, projectTitle) {
    const statusMessages = {
      'assigned': 'Tu proyecto ha sido asignado',
      'started': 'El proyecto ha comenzado',
      'in_progress': 'El proyecto está en progreso',
      'completed': 'El proyecto ha sido completado',
      'cancelled': 'El proyecto ha sido cancelado'
    };

    const message = statusMessages[newStatus] || 'El estado de tu proyecto ha cambiado';

    // Notificar al trabajador
    if (workerId) {
      await this.createNotification(
        workerId,
        'project_update',
        'Actualización de proyecto',
        `${message}: "${projectTitle}"`,
        projectId
      );
    }

    // Notificar al contratista también
    if (contractorId && newStatus === 'completed') {
      await this.createNotification(
        contractorId,
        'project_update',
        'Proyecto completado',
        `El trabajador ha completado: "${projectTitle}"`,
        projectId
      );
    }
  }

  // Notificar aplicación a trabajo
  static async notifyApplication(contractorId, workerName, postTitle, postId) {
    await this.createNotification(
      contractorId,
      'application',
      'Nueva aplicación',
      `${workerName || 'Un trabajador'} ha aplicado a tu trabajo: ${postTitle}`,
      postId
    );
  }

  // Notificar respuesta a aplicación (aceptada/rechazada)
  static async notifyApplicationResponse(workerId, isAccepted, postTitle, postId) {
    const title = isAccepted ? '¡Aplicación aceptada!' : 'Aplicación no seleccionada';
    const message = isAccepted
      ? 'Tu aplicación ha sido aceptada. El proyecto está listo para comenzar.'
      : 'Tu aplicación no fue seleccionada esta vez. ¡Sigue aplicando a otros trabajos!';

    await this.createNotification(
      workerId,
      'project_update',
      title,
      message,
      postId
    );
  }

  // Notificar vista de perfil
  static async notifyProfileView(workerId, postTitle, postId) {
    await this.createNotification(
      workerId,
      'profile_view',
      'Perfil revisado',
      `Un contratista ha revisado tu perfil para "${postTitle || 'un trabajo'}"`,
      postId
    );
  }

  // Marcar notificación como leída
  static async markAsRead(notificationId) {
    try {
      await mysqlClient.update(
        'notifications',
        { read_at: new Date().toISOString().slice(0, 19).replace('T', ' ') },
        `id = ${notificationId}`
      );
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Obtener notificaciones de un usuario
  static async getUserNotifications(userId, unreadOnly = false) {
    try {
      const condition = unreadOnly
        ? `user_id = ${userId} AND read_at IS NULL`
        : `user_id = ${userId}`;

      const notifications = await mysqlClient.select(
        'notifications',
        condition,
        'created_at DESC'
      );

      return notifications || [];
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }
}

export default NotificationService;