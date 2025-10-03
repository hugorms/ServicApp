import React, { useState } from 'react';
import { X, Send, DollarSign, Clock } from 'lucide-react';

const ApplicationModal = ({ isOpen, onClose, post, onApply }) => {
  const [message, setMessage] = useState('');
  const [proposedCost, setProposedCost] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      alert('Por favor escribe un mensaje para el contratista');
      return;
    }

    setIsSubmitting(true);

    const applicationData = {
      message: message.trim(),
      proposed_cost: proposedCost ? parseFloat(proposedCost) : null,
      estimated_completion_time: estimatedTime || null
    };

    await onApply(post.id, applicationData);

    // Limpiar formulario
    setMessage('');
    setProposedCost('');
    setEstimatedTime('');
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Aplicar al Trabajo</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-yellow-200/30 rounded-full"
          >
            <X className="w-5 h-5 text-slate-800" />
          </button>
        </div>

        {/* Información del trabajo */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-slate-800 mb-1">{post.title}</h3>
          <p className="text-sm text-slate-600">{post.description?.substring(0, 100)}...</p>
          <div className="flex items-center space-x-3 mt-2">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
              {post.specialty}
            </span>
            {post.budget_min && (
              <span className="text-green-600 font-bold text-sm">
                ${post.budget_min} - ${post.budget_max || 'N/A'}
              </span>
            )}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Mensaje */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mensaje para el contratista *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explica por qué eres el mejor candidato para este trabajo..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-100 focus:bg-white rounded-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-yellow-500 transition-colors"
              required
            />
          </div>

          {/* Costo propuesto */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Costo propuesto (opcional)
            </label>
            <input
              type="number"
              value={proposedCost}
              onChange={(e) => setProposedCost(e.target.value)}
              placeholder="Ej: 150"
              className="w-full px-3 py-2 bg-gray-100 focus:bg-white rounded-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-yellow-500 transition-colors"
              min="0"
              step="0.01"
            />
          </div>

          {/* Tiempo estimado */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Tiempo estimado de completación (opcional)
            </label>
            <input
              type="text"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="Ej: 2 días, 1 semana"
              className="w-full px-3 py-2 bg-gray-100 focus:bg-white rounded-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-yellow-500 transition-colors"
            />
          </div>

          {/* Nota */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 Tip: Un mensaje personalizado y detallado aumenta tus posibilidades de ser seleccionado
            </p>
          </div>

          {/* Botones */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-slate-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Aplicando...' : 'Enviar Aplicación'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationModal;