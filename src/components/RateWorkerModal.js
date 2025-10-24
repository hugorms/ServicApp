import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { mysqlClient } from '../utils/mysqlClient';

const RateWorkerModal = ({ project, onClose, onRatingSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }

    try {
      setSubmitting(true);
      console.log('📝 Guardando calificación del trabajador...');

      // 1. Guardar la reseña en worker_reviews
      const reviewData = {
        worker_id: project.worker_id,
        contractor_id: project.contractor_id,
        post_id: project.post_id,
        rating: rating,
        comment: comment || null,
        punctuality_rating: rating, // Usar mismo rating por ahora
        quality_rating: rating,
        price_rating: rating,
        communication_rating: rating,
        is_featured: false
      };

      await mysqlClient.insert('worker_reviews', reviewData);
      console.log('✅ Reseña guardada');

      // 2. Calcular nuevo rating promedio del trabajador
      const reviews = await mysqlClient.select(
        'worker_reviews',
        `worker_id = ${project.worker_id}`
      );

      let totalRating = 0;
      for (const review of reviews) {
        totalRating += Number(review.rating);
      }
      const averageRating = (totalRating / reviews.length).toFixed(1);

      console.log(`📊 Nuevo rating promedio: ${averageRating} (${reviews.length} reseñas)`);

      // 3. Actualizar rating del trabajador en users
      await mysqlClient.update(
        'users',
        { rating: averageRating },
        `id = ${project.worker_id}`
      );

      console.log('✅ Rating del trabajador actualizado');

      // 4. Marcar proyecto como calificado (opcional: agregar campo rated: true)
      await mysqlClient.update(
        'active_projects',
        { status: 'paid' }, // Cambiar a "paid" después de calificar
        `id = ${project.id}`
      );

      console.log('✅ Proyecto marcado como pagado');

      // 5. ✨ NUEVO: Cerrar la publicación original
      await mysqlClient.update(
        'posts',
        {
          status: 'completed',
          completed_at: new Date().toISOString()
        },
        `id = ${project.post_id}`
      );

      console.log('✅ Publicación marcada como completada');

      // ✨ NUEVO: Disparar evento para refrescar MisPublicaciones
      window.dispatchEvent(new CustomEvent('refreshMyPosts', {
        detail: { postId: project.post_id, status: 'completed' }
      }));
      console.log('📡 Evento refreshMyPosts disparado');

      alert('✅ Calificación enviada exitosamente');

      if (onRatingSubmitted) {
        onRatingSubmitted();
      }

      onClose();
    } catch (error) {
      console.error('Error guardando calificación:', error);
      alert('Error al enviar la calificación. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg">Calificar Trabajo</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-yellow-300 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-800" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Info del trabajador */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-slate-800 font-bold overflow-hidden">
                {project.worker_photo ? (
                  <img src={project.worker_photo} alt={project.worker_name} className="w-full h-full object-cover" />
                ) : (
                  <span>{project.worker_name?.charAt(0)?.toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="font-bold text-slate-800">{project.worker_name}</p>
                <p className="text-sm text-slate-600">{project.worker_profession}</p>
              </div>
            </div>
          </div>

          {/* Proyecto */}
          <div>
            <p className="text-sm text-slate-600 mb-1">Proyecto:</p>
            <p className="font-medium text-slate-800">{project.title}</p>
          </div>

          {/* Sistema de estrellas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Calificación del Trabajo *
            </label>
            <div className="flex items-center justify-center space-x-2 py-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm font-medium text-slate-700 mt-2">
              {rating === 0 && 'Selecciona una calificación'}
              {rating === 1 && '⭐ Muy malo'}
              {rating === 2 && '⭐⭐ Malo'}
              {rating === 3 && '⭐⭐⭐ Regular'}
              {rating === 4 && '⭐⭐⭐⭐ Bueno'}
              {rating === 5 && '⭐⭐⭐⭐⭐ Excelente'}
            </p>
          </div>

          {/* Comentario */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Comentario (Opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="¿Cómo fue tu experiencia con este trabajador?"
              className="w-full px-3 py-2 bg-gray-100 focus:bg-white rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Este comentario será visible en el perfil del trabajador
            </p>
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 bg-gray-200 text-slate-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-800 py-3 rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enviando...' : 'Enviar Calificación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RateWorkerModal;
