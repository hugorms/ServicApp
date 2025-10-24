import React, { useState, useEffect } from 'react';
import { ArrowLeft, Briefcase, Camera, CheckCircle, Phone } from 'lucide-react';
import { mysqlClient } from '../utils/mysqlClient';

const ProyectosTrabajador = ({ userProfile }) => {
  const [activeProjects, setActiveProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [view, setView] = useState('list'); // 'list' o 'detail'
  const [uploadingStage, setUploadingStage] = useState(null);

  // Cargar proyectos activos del trabajador
  useEffect(() => {
    loadActiveProjects();
  }, [userProfile.id]);

  const loadActiveProjects = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando proyectos activos del trabajador...');
      console.log('👤 ID del trabajador:', userProfile.id);

      // Cargar proyectos donde este trabajador fue asignado
      const projects = await mysqlClient.select(
        'active_projects',
        `worker_id = ${userProfile.id}`,
        'created_at DESC'
      );

      console.log('📦 Proyectos encontrados:', projects);
      console.log('📊 Total de proyectos:', projects.length);

      if (projects.length > 0) {
        // Enriquecer con datos del contratista
        const projectsWithContractorData = [];

        for (const project of projects) {
          try {
            // Obtener datos del contratista
            const contractors = await mysqlClient.select(
              'users',
              `users.id = ${project.contractor_id}`
            );

            if (contractors.length > 0) {
              const contractor = contractors[0];
              projectsWithContractorData.push({
                ...project,
                contractor_name: contractor.name,
                contractor_phone: contractor.phone,
                contractor_photo: contractor.profile_photo_url
              });
            }
          } catch (contractorError) {
            console.error(`Error cargando datos del contratista ${project.contractor_id}:`, contractorError);
            projectsWithContractorData.push({
              ...project,
              contractor_name: 'Contratista desconocido',
              contractor_phone: 'N/A',
              contractor_photo: null
            });
          }
        }

        console.log('✅ Proyectos activos cargados:', projectsWithContractorData);
        setActiveProjects(projectsWithContractorData);
      } else {
        console.log('📭 No hay proyectos activos');
        setActiveProjects([]);
      }
    } catch (error) {
      console.error('Error cargando proyectos activos:', error);
      setActiveProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const openProjectDetail = (project) => {
    setSelectedProject(project);
    setView('detail');
  };

  const closeProjectDetail = () => {
    setSelectedProject(null);
    setView('list');
  };

  // Subir foto de etapa
  const handlePhotoUpload = async (stageNumber) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Usar cámara trasera en móviles

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        setUploadingStage(stageNumber);

        // Convertir imagen a Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = async () => {
          const base64Image = reader.result;

          // Determinar qué campo actualizar
          const fieldName = `stage_${stageNumber}_photo`;
          const timestampField = `stage_${stageNumber}_uploaded_at`;

          console.log(`📸 Subiendo foto de etapa ${stageNumber}...`);

          // Actualizar en MySQL
          await mysqlClient.update(
            'active_projects',
            {
              [fieldName]: base64Image,
              [timestampField]: new Date().toISOString()
            },
            `id = ${selectedProject.id}`
          );

          console.log('✅ Foto subida correctamente');

          // Recargar proyecto para obtener progreso actualizado
          await loadActiveProjects();

          // Actualizar proyecto seleccionado
          const updatedProjects = await mysqlClient.select(
            'active_projects',
            `id = ${selectedProject.id}`
          );

          if (updatedProjects.length > 0) {
            const updatedProject = {
              ...updatedProjects[0],
              contractor_name: selectedProject.contractor_name,
              contractor_phone: selectedProject.contractor_phone,
              contractor_photo: selectedProject.contractor_photo
            };
            setSelectedProject(updatedProject);
          }

          alert(`✅ Etapa ${stageNumber} completada!`);
        };

        reader.onerror = () => {
          console.error('Error leyendo imagen');
          alert('Error al procesar la imagen');
        };
      } catch (error) {
        console.error('Error subiendo foto:', error);
        alert('Error al subir la foto');
      } finally {
        setUploadingStage(null);
      }
    };

    input.click();
  };

  // Obtener información de la etapa actual
  const getCurrentStage = (project) => {
    if (project.stage_3_photo) return { number: 3, label: 'Finalizado', color: 'green' };
    if (project.stage_2_photo) return { number: 2, label: 'En Curso', color: 'yellow' };
    if (project.stage_1_photo) return { number: 1, label: 'Iniciado', color: 'purple' };
    return { number: 0, label: 'Asignado', color: 'blue' };
  };

  const getNextStage = (project) => {
    if (!project.stage_1_photo) return 1;
    if (!project.stage_2_photo) return 2;
    if (!project.stage_3_photo) return 3;
    return null; // Todas las etapas completadas
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-2 text-slate-600">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  // Vista de detalle de proyecto
  if (view === 'detail' && selectedProject) {
    const currentStage = getCurrentStage(selectedProject);
    const nextStage = getNextStage(selectedProject);
    const progress = selectedProject.progress_percentage || 0;

    return (
      <div className="h-full bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <button onClick={closeProjectDetail} className="p-2 hover:bg-yellow-300 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-800" />
            </button>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 text-lg">{selectedProject.title}</h3>
              <p className="text-xs text-slate-700">{selectedProject.specialty}</p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">
          {/* Información del Contratista */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200/30">
            <h4 className="font-bold text-slate-800 mb-3 text-sm">Contratista</h4>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-slate-800 font-bold overflow-hidden">
                {selectedProject.contractor_photo ? (
                  <img src={selectedProject.contractor_photo} alt={selectedProject.contractor_name} className="w-full h-full object-cover" />
                ) : (
                  <span>{selectedProject.contractor_name?.charAt(0)?.toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{selectedProject.contractor_name}</p>
                <a href={`tel:${selectedProject.contractor_phone}`} className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center space-x-1">
                  <Phone className="w-3 h-3" />
                  <span>{selectedProject.contractor_phone}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Progreso con 3 Círculos */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200/30">
            <h4 className="font-bold text-slate-800 mb-4 text-sm">Progreso del Trabajo</h4>

            {/* 3 Círculos conectados */}
            <div className="flex items-center justify-between mb-4 px-4">
              {/* Círculo 1: Iniciado */}
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all ${
                  selectedProject.stage_1_photo
                    ? 'bg-purple-500 text-white border-purple-500'
                    : 'bg-gray-200 text-slate-400 border-gray-300'
                }`}>
                  {selectedProject.stage_1_photo ? <CheckCircle className="w-6 h-6" /> : '1'}
                </div>
                <span className="text-xs mt-1 font-medium text-slate-600">Iniciado</span>
              </div>

              {/* Línea 1 */}
              <div className={`flex-1 h-1 mx-2 rounded ${selectedProject.stage_1_photo ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>

              {/* Círculo 2: En Curso */}
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all ${
                  selectedProject.stage_2_photo
                    ? 'bg-yellow-500 text-white border-yellow-500'
                    : 'bg-gray-200 text-slate-400 border-gray-300'
                }`}>
                  {selectedProject.stage_2_photo ? <CheckCircle className="w-6 h-6" /> : '2'}
                </div>
                <span className="text-xs mt-1 font-medium text-slate-600">En Curso</span>
              </div>

              {/* Línea 2 */}
              <div className={`flex-1 h-1 mx-2 rounded ${selectedProject.stage_2_photo ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>

              {/* Círculo 3: Finalizado */}
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all ${
                  selectedProject.stage_3_photo
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-gray-200 text-slate-400 border-gray-300'
                }`}>
                  {selectedProject.stage_3_photo ? <CheckCircle className="w-6 h-6" /> : '3'}
                </div>
                <span className="text-xs mt-1 font-medium text-slate-600">Finalizado</span>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Completado</span>
                <span className="font-bold text-slate-800">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Estado actual */}
            <div className="text-center">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center space-x-1 ${
                currentStage.color === 'green' ? 'bg-green-100 text-green-700 border border-green-300' :
                currentStage.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                currentStage.color === 'purple' ? 'bg-purple-100 text-purple-700 border border-purple-300' :
                'bg-blue-100 text-blue-700 border border-blue-300'
              }`}>
                <span>Estado: {currentStage.label}</span>
              </span>
            </div>
          </div>

          {/* Botón para subir foto de siguiente etapa */}
          {nextStage && (
            <button
              onClick={() => handlePhotoUpload(nextStage)}
              disabled={uploadingStage !== null}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-800 py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-6 h-6" />
              <span>
                {uploadingStage === nextStage
                  ? 'Subiendo foto...'
                  : `📸 Subir Foto - Etapa ${nextStage}`}
              </span>
            </button>
          )}

          {/* Mensaje de proyecto completo */}
          {!nextStage && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <h4 className="font-bold text-green-700 text-lg mb-1">¡Proyecto Completado!</h4>
              <p className="text-sm text-slate-600">Todas las etapas han sido finalizadas</p>
            </div>
          )}

          {/* Galería de fotos */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200/30">
            <h4 className="font-bold text-slate-800 mb-3 text-sm">Fotos del Progreso</h4>
            <div className="grid grid-cols-3 gap-2">
              {selectedProject.stage_1_photo && (
                <div className="relative">
                  <img src={selectedProject.stage_1_photo} alt="Etapa 1" className="w-full h-24 object-cover rounded-lg" />
                  <span className="absolute top-1 left-1 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">1</span>
                </div>
              )}
              {selectedProject.stage_2_photo && (
                <div className="relative">
                  <img src={selectedProject.stage_2_photo} alt="Etapa 2" className="w-full h-24 object-cover rounded-lg" />
                  <span className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">2</span>
                </div>
              )}
              {selectedProject.stage_3_photo && (
                <div className="relative">
                  <img src={selectedProject.stage_3_photo} alt="Etapa 3" className="w-full h-24 object-cover rounded-lg" />
                  <span className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">3</span>
                </div>
              )}
            </div>
            {!selectedProject.stage_1_photo && !selectedProject.stage_2_photo && !selectedProject.stage_3_photo && (
              <p className="text-center text-sm text-slate-500 py-4">No hay fotos aún</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vista de lista de proyectos
  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-sm p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-slate-800" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Mis Proyectos</h1>
            <p className="text-xs text-slate-700">Trabajos asignados activos</p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">No tienes proyectos activos</h3>
            <p className="text-slate-600 text-sm">
              Cuando un contratista acepte tu aplicación, aparecerá aquí
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeProjects.map((project) => {
              const currentStage = getCurrentStage(project);
              const progress = project.progress_percentage || 0;

              return (
                <div
                  key={project.id}
                  onClick={() => openProjectDetail(project)}
                  className="bg-white rounded-lg p-4 shadow-sm border border-yellow-200/30 cursor-pointer hover:shadow-md transition-shadow"
                >
                  {/* Título */}
                  <h3 className="font-bold text-slate-800 mb-2">{project.title}</h3>

                  {/* Contratista */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-slate-800 font-bold text-sm overflow-hidden">
                      {project.contractor_photo ? (
                        <img src={project.contractor_photo} alt={project.contractor_name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{project.contractor_name?.charAt(0)?.toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{project.contractor_name}</p>
                      <p className="text-xs text-slate-500">{project.contractor_phone}</p>
                    </div>
                  </div>

                  {/* 3 Círculos mini */}
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      project.stage_1_photo ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {project.stage_1_photo ? '✓' : '1'}
                    </div>
                    <div className={`flex-1 h-0.5 ${project.stage_1_photo ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      project.stage_2_photo ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {project.stage_2_photo ? '✓' : '2'}
                    </div>
                    <div className={`flex-1 h-0.5 ${project.stage_2_photo ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      project.stage_3_photo ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {project.stage_3_photo ? '✓' : '3'}
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">Progreso</span>
                      <span className="font-bold text-slate-800">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      currentStage.color === 'green' ? 'bg-green-100 text-green-700' :
                      currentStage.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                      currentStage.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {currentStage.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProyectosTrabajador;
