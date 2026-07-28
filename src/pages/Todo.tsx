import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Trash2, Plus, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function Todo() {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: '' });

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const { data } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
    if (data) {
      setTodos(data);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setAdding(true);
    const { data, error } = await supabase.from('todos').insert([newTask]).select();
    if (!error && data) {
      setTodos([data[0], ...todos]);
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '' });
    } else {
      alert('Failed to add task: Ensure you run the SQL statement for the todos table first.');
    }
    setAdding(false);
  };

  const toggleComplete = async (id: string, current: boolean) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !current } : t));
    await supabase.from('todos').update({ completed: !current }).eq('id', id);
  };

  const deleteTodo = async (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
    await supabase.from('todos').delete().eq('id', id);
  };

  return (
    <div className="space-y-6 flex flex-col h-full font-sans text-slate-100">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800 px-4 md:px-8 py-4 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-4 shrink-0">
        <div className="flex items-center space-x-2 text-indigo-400">
          <CheckSquare className="w-5 h-5 font-bold" />
          <h1 className="text-xs font-bold uppercase tracking-wider text-slate-100">To-Do Tasks</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add new task form */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit sticky top-0 shadow-sm">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Add New Task</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1 block">Task Title</label>
              <input
                type="text"
                required
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 transition-colors"
                placeholder="What needs to be done?"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1 block">Description (Optional)</label>
              <textarea
                value={newTask.description}
                onChange={e => setNewTask({...newTask, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none text-slate-100 transition-colors"
                placeholder="Details..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1 block">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={e => setNewTask({...newTask, priority: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1 block">Due Date</label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={e => setNewTask({...newTask, due_date: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-slate-400"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={adding || !newTask.title.trim()}
              className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-medium text-sm transition-colors mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              {adding ? 'Adding...' : 'Add Task'}
            </button>
          </form>
        </div>

        {/* Task List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
              Loading tasks...
            </div>
          ) : todos.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <CheckSquare className="w-12 h-12 text-slate-800 mb-4" />
              <h3 className="text-slate-300 font-bold mb-1">No tasks found</h3>
              <p className="text-slate-500 text-sm">Create your first task using the form.</p>
            </div>
          ) : (
            todos.map((todo) => (
              <div 
                key={todo.id} 
                className={cn(
                  "bg-slate-900 border rounded-xl p-4 transition-all flex items-start group",
                  todo.completed ? "border-slate-800 opacity-60" : "border-slate-700 hover:border-slate-600 shadow-sm"
                )}
              >
                <button 
                  onClick={() => toggleComplete(todo.id, todo.completed)}
                  className="text-slate-400 hover:text-indigo-400 mr-4 mt-0.5 shrink-0 transition-colors"
                >
                  {todo.completed ? <CheckSquare className="w-5 h-5 text-indigo-500" /> : <Square className="w-5 h-5" />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className={cn("text-sm font-bold truncate pr-4", todo.completed ? "text-slate-500 line-through" : "text-slate-200")}>
                      {todo.title}
                    </h4>
                    <div className="flex items-center space-x-2 shrink-0">
                       <span className={cn(
                         "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest",
                         todo.priority === 'high' ? "bg-rose-500/10 text-rose-400" :
                         todo.priority === 'medium' ? "bg-amber-500/10 text-amber-400" :
                         "bg-emerald-500/10 text-emerald-400"
                       )}>
                         {todo.priority}
                       </span>
                    </div>
                  </div>
                  
                  {todo.description && (
                    <p className={cn("text-xs mt-1.5 line-clamp-2", todo.completed ? "text-slate-600" : "text-slate-400")}>
                      {todo.description}
                    </p>
                  )}
                  
                  <div className="flex items-center mt-3 text-xs text-slate-500 space-x-4">
                    {todo.due_date && (
                      <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        <span>Due {format(new Date(todo.due_date), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      Added {format(new Date(todo.created_at), 'MMM d')}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => deleteTodo(todo.id)}
                  className="ml-4 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
