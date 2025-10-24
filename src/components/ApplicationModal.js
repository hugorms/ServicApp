import React, { useState } from 'react';
import { X, Send, DollarSign, Clock } from 'lucide-react';

const ApplicationModal = ({ isOpen, onClose, post, onApply }) => {
  const defaultMessage = 'Hola, estoy muy interesado en este trabajo. Cuento con experiencia en este tipo de servicios y me gustaría poder ayudarte. Estoy disponible para coordinar los detalles.';

  const [message, setMessage] = useState(defaultMessage);
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

    // Limpiar formulario y restaurar mensaje por defecto
    setMessage(defaultMessage);
    setProposedCost('');
    setEstimatedTime('');
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen || !post) return null;

  return (
    <div className="absolute inset-0 bg-black/50 z-[60] flex items-center justify-center">
      <div className="bg-white rounded-xl w-[90%] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 px-4 py-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Aplicar al Trabajo</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-yellow-200/30 rounded-full"
          >
            <X className="w-4 h-4 text-slate-800" />
          </button>
        </div>

        {/* Información del trabajo */}
        <div className="px-4 py-2 border-b border-gray-200">
          <h3 className="font-bold text-slate-800 text-sm mb-1">{post.title}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
              {post.specialty}
            </span>
            {post.budget_min && (
              <span className="text-green-600 font-bold text-xs">
                ${post.budget_min} - ${post.budget_max || 'N/A'}
              </span>
            )}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-4 py-3 space-y-3">
          {/* Mensaje */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Mensaje para el contratista *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Puedes editar este mensaje o escribir uno personalizado..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-100 focus:bg-white rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-yellow-500 transition-colors"
              required
            />
            <p className="text-xs text-slate-500 mt-0.5">
              💬 Puedes editar el mensaje
            </p>
          </div>

          {/* Costo propuesto y Tiempo estimado en una fila */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                💵 Costo (opcional)
              </label>
              <input
                type="number"
                value={proposedCost}
                onChange={(e) => setProposedCost(e.target.value)}
                placeholder="150"
                className="w-full px-3 py-2 bg-gray-100 focus:bg-white rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-yellow-500 transition-colors"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ⏱️ Tiempo (opcional)
              </label>
              <input
                type="text"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="2 días"
                className="w-full px-3 py-2 bg-gray-100 focus:bg-white rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-yellow-500 transition-colors"
              />
            </div>
          </div>

          {/* Nota */}
          <div className="bg-blue-50 px-3 py-2 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 Un mensaje personalizado aumenta tus posibilidades
            </p>
          </div>

          {/* Botones */}
          <div className="flex space-x-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2.5 bg-gray-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3 h-3" />
              <span>{isSubmitting ? 'Enviando...' : 'Enviar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationModal;