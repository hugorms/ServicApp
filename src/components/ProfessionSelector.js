import React, { useState, useEffect } from 'react';
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { PROFESSIONS_LIST, getSpecialties, getProfessionIcon } from '../config/professionsData';

const ProfessionSelector = ({ value = [], onChange, maxProfessions = 3 }) => {
  const [selectedProfessions, setSelectedProfessions] = useState(value);
  const [expandedProfession, setExpandedProfession] = useState(null);

  useEffect(() => {
    setSelectedProfessions(value);
  }, [value]);

  const handleAddProfession = (profession) => {
    if (selectedProfessions.length >= maxProfessions) {
      alert(`Máximo ${maxProfessions} profesiones permitidas`);
      return;
    }

    if (selectedProfessions.some(p => p.profession === profession)) {
      alert('Esta profesión ya fue agregada');
      return;
    }

    const newProfession = {
      profession,
      specialties: [],
      custom_specialty: '',
      experience_years: '',
      experience_description: ''
    };

    const updated = [...selectedProfessions, newProfession];
    setSelectedProfessions(updated);
    setExpandedProfession(profession);
    onChange(updated);
  };

  const handleRemoveProfession = (profession) => {
    const updated = selectedProfessions.filter(p => p.profession !== profession);
    setSelectedProfessions(updated);
    onChange(updated);
  };

  const handleToggleSpecialty = (profession, specialty) => {
    const updated = selectedProfessions.map(p => {
      if (p.profession === profession) {
        const specialties = p.specialties.includes(specialty)
          ? p.specialties.filter(s => s !== specialty)
          : [...p.specialties, specialty];
        return { ...p, specialties };
      }
      return p;
    });
    setSelectedProfessions(updated);
    onChange(updated);
  };

  const handleCustomSpecialty = (profession, customValue) => {
    const updated = selectedProfessions.map(p => {
      if (p.profession === profession) {
        return { ...p, custom_specialty: customValue };
      }
      return p;
    });
    setSelectedProfessions(updated);
    onChange(updated);
  };

  const handleExperienceChange = (profession, field, value) => {
    const updated = selectedProfessions.map(p => {
      if (p.profession === profession) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setSelectedProfessions(updated);
    onChange(updated);
  };

  const availableProfessions = PROFESSIONS_LIST.filter(
    p => !selectedProfessions.some(sp => sp.profession === p)
  );

  const experienceOptions = [
    'Menos de 1 año', '1-2 años', '3-5 años',
    '6-10 años', 'Más de 10 años'
  ];

  return (
    <div className="space-y-2">
      {/* Profesiones seleccionadas - Diseño compacto */}
      {selectedProfessions.map((professionData, index) => {
        const { profession, specialties, custom_specialty, experience_years, experience_description } = professionData;
        const isExpanded = expandedProfession === profession;
        const professionSpecialties = getSpecialties(profession);
        const icon = getProfessionIcon(profession);

        return (
          <div key={profession} className="bg-gray-50 rounded-lg overflow-hidden">
            {/* Header compacto */}
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-base">{icon}</span>
                <span className="text-xs font-semibold text-slate-800">{profession}</span>
                {specialties.length > 0 && (
                  <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded-full font-medium">
                    {specialties.length}
                  </span>
                )}
                {experience_years && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                    {experience_years}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedProfession(isExpanded ? null : profession)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveProfession(profession)}
                  className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Especialidades y experiencia */}
            {isExpanded && (
              <div className="px-2.5 pb-2 pt-1 space-y-2">
                {/* Especialidades */}
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Especialidades:</p>
                  <div className="space-y-0.5">
                    {professionSpecialties.map(specialty => {
                      const isSelected = specialties.includes(specialty);
                      const isOther = specialty === 'Otro';

                      return (
                        <div key={specialty}>
                          <label className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-white cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSpecialty(profession, specialty)}
                              className="w-3 h-3 text-yellow-500 focus:ring-yellow-500 rounded"
                            />
                            <span className="text-[11px] text-slate-700">{specialty}</span>
                          </label>

                          {/* Campo personalizado para "Otro" */}
                          {isOther && isSelected && (
                            <input
                              type="text"
                              value={custom_specialty}
                              onChange={(e) => handleCustomSpecialty(profession, e.target.value)}
                              placeholder="Especifica"
                              className="ml-5 mt-0.5 w-full px-2 py-1 text-[11px] bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Experiencia */}
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Experiencia en {profession}:</p>
                  <select
                    value={experience_years || ''}
                    onChange={(e) => handleExperienceChange(profession, 'experience_years', e.target.value)}
                    className="w-full px-2 py-1 text-[11px] bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  >
                    <option value="">Selecciona experiencia...</option>
                    {experienceOptions.map(exp => (
                      <option key={exp} value={exp}>{exp}</option>
                    ))}
                  </select>
                </div>

                {/* Descripción de experiencia */}
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Descripción:</p>
                  <textarea
                    value={experience_description || ''}
                    onChange={(e) => handleExperienceChange(profession, 'experience_description', e.target.value)}
                    placeholder={`Describe tu experiencia en ${profession}...`}
                    className="w-full px-2 py-1 text-[11px] bg-white border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 resize-none"
                    rows="2"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Agregar nueva profesión - Compacto */}
      {selectedProfessions.length < maxProfessions && (
        <div className="border border-dashed border-gray-300 rounded-lg p-2">
          <p className="text-[10px] text-slate-500 mb-1.5">
            Agregar profesión ({selectedProfessions.length}/{maxProfessions})
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            {availableProfessions.map(profession => {
              const icon = getProfessionIcon(profession);
              return (
                <button
                  key={profession}
                  type="button"
                  onClick={() => handleAddProfession(profession)}
                  className="flex items-center gap-1.5 px-2 py-1.5 bg-white hover:bg-yellow-50 border border-gray-200 hover:border-yellow-300 rounded transition-colors text-left"
                >
                  <span className="text-sm">{icon}</span>
                  <span className="text-[11px] text-slate-700 leading-tight">{profession}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedProfessions.length === 0 && (
        <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Plus className="w-6 h-6 mx-auto text-gray-400 mb-1" />
          <p className="text-[11px] text-slate-500">Selecciona al menos una profesión</p>
        </div>
      )}
    </div>
  );
};

export default ProfessionSelector;
