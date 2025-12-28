import React, { useState, useMemo } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, Status, Priority } from '../types';
import { cn, getPriorityColor, getStatusColor } from '../utils';
import { Plus, MoreVertical, Calendar, Flag, Tag, Folder, Filter, Hash, LayoutGrid, List, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KanbanBoardProps {
  tasks: Task[];
  onMoveTask: (taskId: string, newStatus: Status) => void;
  onAddTask: (status: Status) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
}

interface KanbanColumnProps {
  status: Status;
  tasks: Task[];
  onAddTask: () => void;
  onTaskClick: (t: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, tasks, onAddTask, onTaskClick, onDeleteTask }) => {
  const { setNodeRef } = useDroppable({ id: status });

  // Subtle indicators instead of full backgrounds
  const statusColors = {
    [Status.BACKLOG]: 'bg-slate-100/50',
    [Status.TODO]: 'bg-brand-50/30',
    [Status.IN_PROGRESS]: 'bg-purple-50/30',
    [Status.DONE]: 'bg-emerald-50/30',
  };
  
  const headerColors = {
      [Status.BACKLOG]: 'text-slate-600 border-slate-200',
      [Status.TODO]: 'text-brand-600 border-brand-200',
      [Status.IN_PROGRESS]: 'text-purple-600 border-purple-200',
      [Status.DONE]: 'text-emerald-600 border-emerald-200',
  };

  return (
    <div className={cn("flex flex-col h-full rounded-2xl min-w-[280px] w-[300px] lg:w-full transition-colors", statusColors[status])}>
      <div className={cn("p-4 flex justify-between items-center border-b-2 mx-2", headerColors[status].split(' ')[1])}>
        <div className="flex items-center gap-2.5">
            <h3 className={cn("font-bold text-sm uppercase tracking-wider", headerColors[status].split(' ')[0])}>{status}</h3>
            <span className="bg-white text-slate-600 px-2 py-0.5 rounded-md text-xs font-bold shadow-sm border border-slate-100">{tasks.length}</span>
        </div>
        <button onClick={onAddTask} className="text-slate-400 hover:text-slate-700 hover:bg-white p-1.5 rounded-lg transition-all shadow-sm opacity-0 group-hover:opacity-100">
          <Plus size={16} />
        </button>
      </div>
      
      <div ref={setNodeRef} className="flex-1 p-2 overflow-y-auto space-y-3 custom-scrollbar">
        {tasks.map(task => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
            onDelete={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
            }}
          />
        ))}
        {tasks.length === 0 && (
            <div className="h-32 border-2 border-dashed border-slate-200/50 rounded-xl flex flex-col items-center justify-center text-slate-300 text-sm gap-2 mt-2">
                <Plus size={24} className="opacity-50" />
                <span className="font-medium">Vazio</span>
            </div>
        )}
        <button onClick={onAddTask} className="w-full py-2 text-xs font-medium text-slate-400 hover:text-brand-600 hover:bg-white/50 rounded-lg transition-all flex items-center justify-center gap-1 opacity-0 hover:opacity-100">
            <Plus size={14} /> Adicionar
        </button>
      </div>
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  isOverlay?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onDelete, isOverlay }) => {
  const priorityColors = {
      [Priority.LOW]: 'text-slate-500 bg-slate-100',
      [Priority.MEDIUM]: 'text-amber-600 bg-amber-50',
      [Priority.HIGH]: 'text-orange-600 bg-orange-50',
      [Priority.URGENT]: 'text-red-600 bg-red-50'
  };

  return (
    <div
      className={cn(
        "bg-white p-4 rounded-xl shadow-card border border-transparent group relative transition-all duration-200",
        isOverlay ? "rotate-2 shadow-xl scale-105 cursor-grabbing" : "hover:-translate-y-1 hover:shadow-card-hover hover:border-brand-100"
      )}
    >
        {/* Action Buttons */}
        {!isOverlay && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick?.();
                    }}
                    className="p-1.5 hover:bg-brand-50 rounded-lg text-brand-600 transition-colors"
                    title="Editar"
                >
                    <Edit size={14} />
                </button>
                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(e);
                        }}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                        title="Deletar"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        )}

        {/* Project Tag */}
        {task.project && (
            <div className="mb-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase text-slate-400">
                    {task.project}
                </span>
            </div>
        )}

      <h4 className={cn("text-sm font-semibold text-slate-800 mb-3 leading-snug", task.status === Status.DONE && "line-through text-slate-400")}>
        {task.title}
      </h4>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2">
            <span className={cn("text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider", priorityColors[task.priority])}>
                {task.priority}
            </span>
            {task.dueDate && (
                <div className={cn("flex items-center gap-1 text-xs", new Date(task.dueDate) < new Date() && task.status !== Status.DONE ? "text-red-500 font-medium" : "text-slate-400")}>
                    <Calendar size={12} />
                    <span>{format(new Date(task.dueDate), 'dd/MM')}</span>
                </div>
            )}
        </div>
        
        {task.routineId && (
            <div className="flex items-center text-brand-500" title="Tarefa de Rotina">
               <div className="p-1 bg-brand-50 rounded-full">
                    <Hash size={10} strokeWidth={3} />
               </div>
            </div>
        )}
      </div>
    </div>
  );
};

interface DraggableTaskCardProps {
  task: Task;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({ task, onClick, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  if (isDragging) {
      return <div ref={setNodeRef} style={style} className="opacity-30 grayscale"><TaskCard task={task} /></div>
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCard task={task} onClick={onClick} onDelete={onDelete} />
    </div>
  );
};

// --- TABLE VIEW COMPONENT ---
type SortConfig = { key: keyof Task | 'dueDate', direction: 'asc' | 'desc' } | null;

const TaskListView: React.FC<{ tasks: Task[], onTaskClick: (t: Task) => void }> = ({ tasks, onTaskClick }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);

    const sortedTasks = useMemo(() => {
        let sortableItems = [...tasks];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle null/undefined values
                if (!aValue && !bValue) return 0;
                if (!aValue) return 1;
                if (!bValue) return -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [tasks, sortConfig]);

    const requestSort = (key: keyof Task) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ colKey }: { colKey: keyof Task }) => {
        if (sortConfig?.key !== colKey) return <ArrowUpDown size={12} className="opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-brand-600" /> : <ArrowDown size={12} className="text-brand-600" />;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div 
                    onClick={() => requestSort('title')} 
                    className="col-span-5 flex items-center gap-2 cursor-pointer hover:text-slate-700 select-none"
                >
                    Nome da tarefa <SortIcon colKey="title" />
                </div>
                <div 
                    onClick={() => requestSort('status')}
                    className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-slate-700 select-none"
                >
                    Status <SortIcon colKey="status" />
                </div>
                <div 
                    onClick={() => requestSort('dueDate')}
                    className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-slate-700 select-none"
                >
                    Prazo <SortIcon colKey="dueDate" />
                </div>
                <div 
                    onClick={() => requestSort('priority')}
                    className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-slate-700 select-none"
                >
                    Prioridade <SortIcon colKey="priority" />
                </div>
                <div className="col-span-1"></div>
            </div>
            <div className="divide-y divide-slate-100">
                {sortedTasks.length > 0 ? sortedTasks.map(task => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== Status.DONE;
                    
                    return (
                        <div 
                            key={task.id} 
                            onClick={() => onTaskClick(task)}
                            className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors cursor-pointer text-sm"
                        >
                            <div className="col-span-5 font-medium text-slate-700 truncate pr-4">
                                {task.title}
                            </div>
                            <div className="col-span-2">
                                <span className={cn("px-2 py-1 rounded-md text-xs font-bold", getStatusColor(task.status))}>
                                    {task.status}
                                </span>
                            </div>
                            <div className="col-span-2 text-slate-500 text-xs">
                                {task.dueDate ? (
                                    <div className={cn(isOverdue && "text-red-500 font-bold")}>
                                        <p>{format(new Date(task.dueDate), 'dd/MM/yyyy')}</p>
                                        <p className="text-[10px] opacity-70">{format(new Date(task.dueDate), 'HH:mm')}</p>
                                    </div>
                                ) : '-'}
                            </div>
                            <div className="col-span-2">
                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", getPriorityColor(task.priority))}>
                                    {task.priority}
                                </span>
                            </div>
                            <div className="col-span-1 text-right">
                                {isOverdue && (
                                    <span className="text-[10px] text-red-500 flex items-center justify-end gap-1 font-bold">
                                        <Calendar size={10} /> Vencido
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="p-8 text-center text-slate-400">Nenhuma tarefa encontrada.</div>
                )}
            </div>
        </div>
    );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onMoveTask, onAddTask, onEditTask, onDeleteTask }) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Configure sensors to distinguish between click (edit) and drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Mouse needs to move 5px to start dragging
      },
    })
  );

  // Extract unique projects
  const projects = useMemo(() => {
    return Array.from(new Set(tasks.map(t => t.project).filter(Boolean))) as string[];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (!selectedProject) return tasks;
    return tasks.filter(t => t.project === selectedProject);
  }, [tasks, selectedProject]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(event.active.data.current?.task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (over && active.id !== over.id) {
        const newStatus = over.id as Status;
        if (Object.values(Status).includes(newStatus)) {
             onMoveTask(active.id as string, newStatus);
        }
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Filters & View Switcher Bar */}
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
              {/* Project Filter */}
              <div className="flex items-center gap-3 bg-white p-1 pr-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="bg-slate-50 p-1.5 rounded-lg text-slate-500">
                    <Filter size={16} />
                </div>
                <select 
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="bg-transparent text-slate-700 text-sm font-medium outline-none cursor-pointer hover:text-brand-600 transition-colors"
                >
                    <option value="">Todos os Projetos</option>
                    {projects.map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                  <button 
                    onClick={() => setViewMode('board')}
                    className={cn(
                        "p-1.5 rounded-lg transition-all",
                        viewMode === 'board' ? "bg-brand-50 text-brand-600 shadow-sm" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    )}
                    title="Visualização em Quadro"
                  >
                      <LayoutGrid size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={cn(
                        "p-1.5 rounded-lg transition-all",
                        viewMode === 'list' ? "bg-brand-50 text-brand-600 shadow-sm" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    )}
                    title="Visualização em Lista"
                  >
                      <List size={18} />
                  </button>
              </div>
          </div>
          
          <div className="text-sm text-slate-400 font-medium">
              {filteredTasks.length} tarefas
          </div>
      </div>

      {viewMode === 'board' ? (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-6 h-full overflow-x-auto pb-4 snap-x">
              {Object.values(Status).map(status => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={filteredTasks.filter(t => t.status === status)}
                  onAddTask={() => onAddTask(status)}
                  onTaskClick={onEditTask}
                  onDeleteTask={onDeleteTask}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
      ) : (
          <div className="h-full overflow-y-auto custom-scrollbar">
              <TaskListView tasks={filteredTasks} onTaskClick={onEditTask} />
          </div>
      )}
    </div>
  );
};