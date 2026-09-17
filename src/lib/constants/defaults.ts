import type { EnergyLevelConfig, TaskSizeConfig, TaskTypeConfig, Project, Task, InboxItem, Note } from '../types';

export const DEFAULT_ENERGY_LEVELS: EnergyLevelConfig[] = [
  {
    id: 'E0',
    name: 'E0: Agotado',
    description: 'Baja demanda mental. Tareas automáticas o mecánicas sin esfuerzo.',
    levelNum: 0,
    color: '#EF4444',
    badgeClass: 'badge-e0'
  },
  {
    id: 'E1',
    name: 'E1: Bajo',
    description: 'Energía reducida. Tareas ligeras, lectura sencilla o capturas.',
    levelNum: 1,
    color: '#F59E0B',
    badgeClass: 'badge-e1'
  },
  {
    id: 'E2',
    name: 'E2: Funcional',
    description: 'Energía normal. Progreso sostenido en tareas estándar.',
    levelNum: 2,
    color: '#3B82F6',
    badgeClass: 'badge-e2'
  },
  {
    id: 'E3',
    name: 'E3: Alto / Claridad',
    description: 'Máxima concentración y flujo creativo. Proyectos complejos.',
    levelNum: 3,
    color: '#10B981',
    badgeClass: 'badge-e3'
  }
];

export const DEFAULT_TASK_SIZES: TaskSizeConfig[] = [
  { id: 'micro', name: 'Micro', minMinutes: 1, maxMinutes: 5, label: '1 - 5 min' },
  { id: 'small', name: 'Small', minMinutes: 5, maxMinutes: 15, label: '5 - 15 min' },
  { id: 'medium', name: 'Medium', minMinutes: 15, maxMinutes: 30, label: '15 - 30 min' },
  { id: 'large', name: 'Large', minMinutes: 30, maxMinutes: 60, label: '30 - 60 min' },
  { id: 'deep', name: 'Deep', minMinutes: 60, maxMinutes: 180, label: '60+ min' }
];

export const DEFAULT_TASK_TYPES: TaskTypeConfig[] = [
  { id: 'cognitive', name: 'Cognitivo', iconName: 'Brain', color: '#8B5CF6' },
  { id: 'mechanical', name: 'Mecánico', iconName: 'Wrench', color: '#64748B' },
  { id: 'generative', name: 'Generativo', iconName: 'Sparkles', color: '#EC4899' },
  { id: 'capture', name: 'Captura', iconName: 'Inbox', color: '#3B82F6' },
  { id: 'study', name: 'Estudio', iconName: 'BookOpen', color: '#10B981' },
  { id: 'drawing', name: 'Dibujo', iconName: 'Palette', color: '#F59E0B' },
  { id: 'programming', name: 'Programación', iconName: 'Code', color: '#6366F1' },
  { id: 'writing', name: 'Escritura', iconName: 'FileText', color: '#14B8A6' }
];

export const INITIAL_DEMO_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    user_id: 'demo-user',
    name: 'Novela Sci-Fi "Solaris II"',
    description: 'Borrador de los primeros 5 capítulos y diseño de mundo orbital.',
    area: 'writing',
    category: 'Escritura',
    status: 'active',
    color: '#2b579a',
    estimatedHours: 18,
    order: 0,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'proj-2',
    user_id: 'demo-user',
    name: 'Creative OS - Frontend Svelte',
    description: 'Desarrollo de la aplicación personal de productividad adaptativa.',
    area: 'programming',
    category: 'Proyectos',
    status: 'active',
    color: '#217346',
    estimatedHours: 10,
    order: 1,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'proj-3',
    user_id: 'demo-user',
    name: 'Estudio de Perspectiva y Anatomía',
    description: 'Cuaderno digital de bocetos de gestos y paisajes urbanos.',
    area: 'drawing',
    category: 'Diseño',
    status: 'active',
    color: '#c43e1c',
    estimatedHours: 6,
    order: 2,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const INITIAL_DEMO_TASKS: Task[] = [
  {
    id: 'task-1',
    user_id: 'demo-user',
    project_id: 'proj-2',
    title: 'Implementar filtro inteligente tiempo + energía',
    description: 'Crear el widget interactivo del dashboard para recomendar tareas compatibles.',
    status: 'in_progress',
    type_id: 'programming',
    size_id: 'medium',
    energy_level: 'E2',
    estimated_minutes: 20,
    actual_minutes: 10,
    priority: 'high',
    next_step: 'Conectar la función de filtrado con los selectores de tiempo y energía',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null
  },
  {
    id: 'task-2',
    user_id: 'demo-user',
    project_id: 'proj-1',
    title: 'Escribir escena de llegada a la estación orbital',
    description: 'Describir los sensores de la nave y la atmósfera del hangar.',
    status: 'pending',
    type_id: 'writing',
    size_id: 'large',
    energy_level: 'E3',
    estimated_minutes: 45,
    actual_minutes: 0,
    priority: 'urgent',
    next_step: 'Abrir borrador y redactar diálogo entre la capitana y la IA de estación',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null
  },
  {
    id: 'task-3',
    user_id: 'demo-user',
    project_id: 'proj-3',
    title: 'Bocetos rápidos de manos en 2 minutos',
    description: 'Práctica de gestos con cronómetro para soltar el trazo.',
    status: 'pending',
    type_id: 'drawing',
    size_id: 'small',
    energy_level: 'E1',
    estimated_minutes: 10,
    actual_minutes: 0,
    priority: 'medium',
    next_step: 'Configurar temporizador en 2m y dibujar 5 poses seguidas',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null
  },
  {
    id: 'task-4',
    user_id: 'demo-user',
    project_id: 'proj-2',
    title: 'Revisar dependencias npm y tipos TypeScript',
    description: 'Comprobar compilación limpia de la app.',
    status: 'pending',
    type_id: 'mechanical',
    size_id: 'micro',
    energy_level: 'E0',
    estimated_minutes: 5,
    actual_minutes: 0,
    priority: 'low',
    next_step: 'Ejecutar `npm run build` en la consola',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null
  }
];

export const INITIAL_DEMO_INBOX: InboxItem[] = [
  {
    id: 'inbox-1',
    user_id: 'demo-user',
    content: 'Investigar Svelte 5 Runes y su integración con stores en TypeScript.',
    category: 'Proyectos',
    project_id: 'proj-2',
    linkedProjectIds: ['proj-2'],
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'unprocessed'
  },
  {
    id: 'inbox-2',
    user_id: 'demo-user',
    content: 'Idea para capítulo 3: Revelar el secreto del reactor cuántico.',
    category: 'Escritura',
    project_id: 'proj-1',
    linkedProjectIds: ['proj-1'],
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: 'unprocessed'
  }
];

export const INITIAL_DEMO_NOTES: Note[] = [
  {
    id: 'note-1',
    user_id: 'demo-user',
    project_id: 'proj-2',
    title: 'Arquitectura de Filtros por Energía y Tiempo',
    content: `# Algoritmo de Selección Adaptativa

Creative OS filtra las tareas combinando dos restricciones:
1. **Tiempo disponible ($T_{max}$)**: Tareas con tiempo estimado $\\le T_{max}$.
2. **Nivel de energía ($E_{user}$)**: Tareas que requieran un nivel de energía $\\le E_{user}$.

Si el usuario selecciona 15m y E1 (Bajo):
* Muestra únicamente tareas de duración $\\le 15$ minutos y exigencia $E0$ o $E1$.
* Ordena por prioridad (Urgente > Alta > Media > Baja).`,
    tags: ['arquitectura', 'algoritmo', 'productividad'],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  }
];
