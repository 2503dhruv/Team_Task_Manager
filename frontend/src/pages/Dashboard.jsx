import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Menu, LayoutDashboard, CheckSquare, Users, LogOut, Edit2, X, Calendar as CalendarIcon, Clock, AlertTriangle, Trash2, Folder } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Calendar as ReactBigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import API from '../api';

const COLORS = ['#10b981', '#f59e0b', '#64748b']; 
const localizer = momentLocalizer(moment);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]); 
  const [allUsers, setAllUsers] = useState([]); 
  const [meetings, setMeetings] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState('all');
  
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [newTask, setNewTask] = useState({ title: '', dueDate: '', project: '', assignedTo: '', priority: 'Mild' });
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', details: '', participants: [] });
  const [editingUser, setEditingUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user'));

  useEffect(() => {
    if (!user) return navigate('/login');
    fetchData();
  }, []);

const fetchData = async () => {
    try {
      const [projRes, memRes, meetRes] = await Promise.all([
        API.get('/projects'),
        user.role === 'Admin' ? API.get('/auth/users') : Promise.resolve({ data: [] }),
        API.get('/meetings').catch(() => ({ data: [] }))
      ]);
      
      const allTasks = [];
      for (const p of projRes.data) {
        const tRes = await API.get(`/tasks/project/${p._id}`);
        allTasks.push(...tRes.data);
      }

      let displayTasks = allTasks;
      let displayProjects = projRes.data;

      // NEW: If the user is NOT an Admin, filter the data to only show what belongs to them
      if (user.role !== 'Admin') {
        const currentUserId = user._id || user.id; // Handle depending on how your schema names the ID

        // 1. Only keep tasks assigned to the logged-in user
        displayTasks = allTasks.filter(t => {
          const assigneeId = typeof t.assignedTo === 'object' ? t.assignedTo?._id : t.assignedTo;
          return assigneeId === currentUserId;
        });

        // 2. Only keep projects that contain at least one task assigned to this user
        const userProjectIds = new Set(displayTasks.map(t => typeof t.project === 'object' ? t.project._id : t.project));
        displayProjects = projRes.data.filter(p => userProjectIds.has(p._id));
      }

      // Set the filtered data to state
      setTasks(displayTasks);
      setProjects(displayProjects);
      
      setMembers(memRes.data);
      setMeetings(meetRes.data);

      if (user.role === 'Admin') {
        const allUsrRes = await API.get('/auth/all-users');
        setAllUsers(allUsrRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    await API.post('/projects', newProject);
    setNewProject({ name: '', description: '' });
    fetchData();
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    await API.post('/tasks', newTask);
    setNewTask({ title: '', dueDate: '', project: '', assignedTo: '', priority: 'Mild' });
    fetchData();
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    await API.post('/meetings', newMeeting);
    setNewMeeting({ title: '', date: '', details: '', participants: [] });
    fetchData();
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    if (window.confirm(`Are you sure you want to delete this ${selectedEvent.type.toLowerCase()}?`)) {
      try {
        if (selectedEvent.type === 'Meeting') {
          await API.delete(`/meetings/${selectedEvent.resource._id}`);
        } else {
          await API.delete(`/tasks/${selectedEvent.resource._id}`);
        }
        setSelectedEvent(null);
        fetchData();
      } catch (err) {
        alert('Failed to delete.');
      }
    }
  };

  const handleRemoveUserFromProject = async (projectId, userId) => {
    if (!window.confirm('Are you sure you want to remove this user from the project? This will unassign them from all tasks within this project.')) return;

    try {
      
      const tasksToUpdate = tasks.filter(t => 
        (typeof t.project === 'object' ? t.project._id : t.project) === projectId && 
        (typeof t.assignedTo === 'object' ? t.assignedTo._id : t.assignedTo) === userId
      );

      
      await Promise.all(
        tasksToUpdate.map(t => API.put(`/tasks/${t._id}`, { assignedTo: null }))
      );

      fetchData(); 
    } catch (err) {
      console.error(err);
      alert('Failed to remove user from project.');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    await API.put(`/tasks/${taskId}`, { status: newStatus });
  };

  const handleUpdateMeetingParticipants = async (meetingId, newParticipants) => {
    try {
      await API.put(`/meetings/${meetingId}`, { participants: newParticipants });
      fetchData();
      
      // Update selectedEvent optimistically
      const updatedParticipants = newParticipants.map(id => members.find(m => m._id === id));
      setSelectedEvent(prev => ({
        ...prev,
        resource: { ...prev.resource, participants: updatedParticipants }
      }));
    } catch (err) {
      alert('Failed to update meeting people.');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/auth/users/${editingUser._id}`, editingUser);
      setEditingUser(null);
      fetchData();
      alert('User details updated successfully!');
    } catch (err) {
      alert('Failed to update user');
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination || user.role !== 'Admin') return; // Only Admin can Drag/Drop anywhere usually, or Members can too if they own it. For now we assume Admin.

    const { source, destination, draggableId } = result;

    if (source.droppableId !== destination.droppableId) {
      // Optimistic update
      const updatedTasks = Array.from(tasks);
      const taskIndex = updatedTasks.findIndex(t => t._id === draggableId);
      if (taskIndex > -1) {
        updatedTasks[taskIndex].status = destination.droppableId;
        setTasks(updatedTasks);
        await handleUpdateTaskStatus(draggableId, destination.droppableId);
      }
    }
  };

  const pieData = useMemo(() => {
    const counts = { Completed: 0, 'In Progress': 0, Pending: 0 };
    tasks.forEach(t => counts[t.status] = (counts[t.status] || 0) + 1);
    return [
      { name: 'Completed', value: counts['Completed'] },
      { name: 'In Progress', value: counts['In Progress'] },
      { name: 'Pending', value: counts['Pending'] }
    ];
  }, [tasks]);

  const barData = useMemo(() => {
    return projects.map(p => {
      const projTasks = tasks.filter(t => t.project === p._id);
      return {
        name: p.name,
        Total: projTasks.length,
        Completed: projTasks.filter(t => t.status === 'Completed').length
      };
    });
  }, [projects, tasks]);

  const calendarEvents = [
    ...meetings.map(m => ({
      title: `📅 ${m.title} (Meeting)`,
      start: new Date(m.date),
      end: new Date(new Date(m.date).getTime() + 60*60*1000), // 1 hour meeting
      allDay: false,
      type: 'Meeting',
      resource: m
    })),
    ...tasks.map(t => ({
      title: `📝 ${t.title} [${t.status}]`,
      start: new Date(t.dueDate),
      end: new Date(t.dueDate),
      allDay: true,
      type: 'Task',
      resource: t
    }))
  ];

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className={`transition-all duration-300 bg-slate-800 border-r border-slate-700 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex items-center justify-between p-4 h-20 border-b border-slate-700">
          {sidebarOpen && <span className="text-xl font-bold text-white tracking-tight flex items-center"><span className="text-indigo-400 mr-2 border border-indigo-400/30 bg-indigo-500/10 p-1 rounded">TT</span> Task.io</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 text-white shadow-sm">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-3 mt-4">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}>
            <LayoutDashboard size={20} /> {sidebarOpen && <span className="font-semibold">Overview</span>}
          </button>
          
          <button onClick={() => setActiveTab('tasks')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}>
            <CheckSquare size={20} /> {sidebarOpen && <span className="font-semibold">Kanban Board</span>}
          </button>

          <button onClick={() => setActiveTab('calendar')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}>
            <CalendarIcon size={20} /> {sidebarOpen && <span className="font-semibold">Calendar</span>}
          </button>

          {user.role === 'Admin' && (
            <>
              <button onClick={() => setActiveTab('team')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'team' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}>
                <Users size={20} /> {sidebarOpen && <span className="font-semibold">Manage Team</span>}
              </button>

            
              <button onClick={() => setActiveTab('projects')} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'projects' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}>
                <Folder size={20} /> {sidebarOpen && <span className="font-semibold">Project Details</span>}
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className={`mb-4 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl flex items-center gap-3 text-sm shadow-inner transition-all ${!sidebarOpen && 'justify-center'}`}>
            <div className={`w-3 h-3 flex-shrink-0 rounded-full ${user.role === 'Admin' ? 'bg-indigo-400' : 'bg-emerald-400'} animate-pulse`}></div>
            {sidebarOpen && (
              <div className="flex flex-col truncate">
                <span className="text-xs text-slate-400">Welcome</span>
                <span className="font-bold text-white truncate">{user.name}</span>
                <span className="text-xs text-indigo-300 font-semibold">{user.role}</span>
              </div>
            )}
          </div>
           <button onClick={() => { sessionStorage.clear(); window.location.href = '/login'; }} className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-bold">
            <LogOut size={20} /> {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto w-full relative">
        <header className="h-20 flex items-center px-8 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 justify-between">
            <h1 className="text-2xl font-black capitalize text-slate-100">{activeTab.replace('-', ' ')}</h1>
        </header>

        <div className="p-8">
          
          {/* TAB 1: OVERVIEW GRAPHS */}
          {activeTab === 'overview' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-200">Task Status Distribution</h2>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-200">Tasks per Project</h2>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="name" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} cursor={{fill: '#334155'}} />
                          <Bar dataKey="Total" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
               </div>
             </div>
          )}

          {/* TAB 2: TASKS AND BOARD */}
          {activeTab === 'tasks' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               {user.role === 'Admin' && (
                <div className="grid gap-6 mb-8 md:grid-cols-2">
                  {/* Create Project Form - Reduced padding/height slightly to make room */}
                  <div className="p-5 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl">
                    <h2 className="mb-4 text-lg font-bold border-b border-slate-700 pb-2">1. Create Project</h2>
                    <form onSubmit={handleCreateProject} className="flex flex-col gap-3">
                      <input type="text" placeholder="Project Name" required className="p-2.5 bg-slate-900 border border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
                      <button type="submit" className="p-2.5 text-white font-bold bg-indigo-600 hover:bg-indigo-500 rounded-xl">Create Project</button>
                    </form>
                  </div>
                  
                  {/* Assign Task Form with Priority added */}
                  <div className="p-5 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl">
                    <h2 className="mb-4 text-lg font-bold border-b border-slate-700 pb-2">2. Assign Task</h2>
                    <form onSubmit={handleCreateTask} className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Task Title" required className="col-span-2 p-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                      <select required className="p-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white" value={newTask.project} onChange={e => setNewTask({...newTask, project: e.target.value})}>
                        <option value="">Project...</option>
                        {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                      <select required className="p-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white" value={newTask.assignedTo} onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}>
                        <option value="">Assignee...</option>
                        {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                      </select>
                      <select className="col-span-1 p-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                        <option value="Mild">Mild</option>
                        <option value="Important">Important</option>
                        <option value="Very Important">Very Important</option>
                      </select>
                      <input type="date" required className="col-span-1 p-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white color-scheme-dark" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                      <button type="submit" className="col-span-2 p-2.5 text-white font-bold bg-purple-600 hover:bg-purple-500 rounded-xl">Assign Task</button>
                    </form>
                  </div>
                </div>
              )}

              {/* View Filters */}
              <div className="mb-6 flex gap-4">
                 <select className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold outline-none" value={activeProjectId} onChange={(e) => setActiveProjectId(e.target.value)}>
                    <option value="all">🗓 View All Projects</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                 </select>
                 {user.role === 'Admin' && <span className="p-3 text-slate-400 text-sm flex items-center gap-2"><AlertTriangle size={16}/> Drag and drop tasks to update status!</span>}
              </div>

              {/* Kanban Interactive Board */}
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['Pending', 'In Progress', 'Completed'].map(status => {
                    const columnTasks = tasks.filter(t => (activeProjectId === 'all' || t.project === activeProjectId) && t.status === status);
                    
                    return (
                      <Droppable droppableId={status} key={status}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className={`p-5 rounded-2xl border-2 flex flex-col ${snapshot.isDraggingOver ? 'bg-slate-800/80 border-indigo-500/50' : 'bg-slate-900 border-slate-800'}`}>
                            <h3 className="text-lg font-black mb-4 flex items-center justify-between text-slate-200 uppercase tracking-widest border-b border-slate-700 pb-3">
                              {status}
                              <span className="bg-slate-800 text-xs px-2 py-1 rounded-md text-slate-400">{columnTasks.length}</span>
                            </h3>
                            
                            <div className="flex-1 space-y-4 min-h-[200px]">
                              {columnTasks.map((task, index) => {
                                const pColor = task.priority === 'Very Important' ? 'border-red-500/50 bg-red-500/10 text-red-400' 
                                              : task.priority === 'Important' ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                                              : 'border-blue-500/30 bg-blue-500/10 text-blue-400';
                                
                                return (
                                  <Draggable key={task._id} draggableId={task._id} index={index} isDragDisabled={user.role !== 'Admin'} >
                                    {(provided, snapshot) => (
                                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} 
                                           className={`p-4 rounded-xl border ${snapshot.isDragging ? 'shadow-2xl scale-105 border-indigo-500 z-50 bg-slate-800' : 'border-slate-700 bg-slate-800'}`}>
                                        
                                        <div className="flex justify-between items-start mb-2">
                                          <h4 className="font-bold text-white text-md pr-2">{task.title}</h4>
                                          <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-1 rounded-full border ${pColor}`}>
                                            {task.priority || 'Mild'}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-400 bg-slate-900/50 w-fit px-2 py-1 rounded-lg">
                                           <span>👤 {task.assignedTo?.name || 'Unassigned'}</span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-700">
                                          <span className="flex items-center gap-1 text-slate-500 font-medium"><Clock size={12}/> {new Date(task.dueDate).toLocaleDateString()}</span>
                                          {/* Fallback combobox for members who can't drag-drop */}
                                          {user.role !== 'Admin' && (
                                            <select className="bg-slate-900 text-slate-300 border border-slate-700 rounded px-1 py-1 outline-none" value={task.status} onChange={(e) => {
                                              const u = [...tasks];
                                              const idx = u.findIndex(x => x._id === task._id);
                                              u[idx].status = e.target.value; setTasks(u);
                                              handleUpdateTaskStatus(task._id, e.target.value);
                                            }}>
                                              <option value="Pending">Pending</option>
                                              <option value="In Progress">In Progress</option>
                                              <option value="Completed">Completed</option>
                                            </select>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          </div>
                        )}
                      </Droppable>
                    );
                  })}
                </div>
              </DragDropContext>
             </div>
          )}

    
          {/* TAB 3: CALENDAR */}
          {activeTab === 'calendar' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col min-h-[calc(100vh-160px)]">
               {user.role === 'Admin' && (
                  <div className="mb-6 p-5 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl self-start w-full">
                    <h2 className="mb-4 text-lg font-bold border-b border-slate-700 pb-2">Schedule a Meeting</h2>
                    <form onSubmit={handleCreateMeeting} className="flex flex-col gap-4">
                      
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-xs font-bold text-slate-400 mb-1 block">Meeting Title</label>
                          <input type="text" required className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white" value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-bold text-slate-400 mb-1 block">Date & Time</label>
                          <input type="datetime-local" required className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white color-scheme-dark" value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} />
                        </div>
                      </div>

                      <div className="flex gap-4">
                         <div className="flex-1">
                           <label className="text-xs font-bold text-slate-400 mb-1 block">Meeting Details</label>
                           <textarea className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white resize-none" rows="2" placeholder="Agenda, meeting links, etc." value={newMeeting.details} onChange={e => setNewMeeting({...newMeeting, details: e.target.value})}></textarea>
                         </div>
                         <div className="flex-1">
                            <label className="text-xs font-bold text-slate-400 mb-1 block">Invite Participants</label>
                            <select className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-xl text-white" value="" onChange={e => {
                               if (!e.target.value) return;
                               if (!newMeeting.participants.includes(e.target.value)) {
                                 setNewMeeting({...newMeeting, participants: [...newMeeting.participants, e.target.value]});
                               }
                            }}>
                              <option value="">Select members...</option>
                              {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                            </select>

                            <div className="flex flex-wrap gap-2 mt-2">
                              {newMeeting.participants.map(pId => {
                                const mem = members.find(m => m._id === pId);
                                return mem ? (
                                  <span key={pId} className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                                    {mem.name} 
                                    <button type="button" onClick={() => setNewMeeting(prev => ({...prev, participants: prev.participants.filter(id => id !== pId)}))} className="text-red-400 hover:text-red-300 ml-1">x</button>
                                  </span>
                                ) : null;
                              })}
                            </div>
                         </div>
                      </div>

                      <button type="submit" className="p-2.5 px-6 self-end text-white font-bold bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">Host Meeting & Invite</button>
                    </form>
                  </div>
               )}

               <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl overflow-hidden calendar-wrapper h-[600px] w-full">
                 <style dangerouslySetInnerHTML={{__html: `
                    .rbc-calendar { font-family: inherit; color: #f1f5f9; min-height: 500px; }
                    .rbc-toolbar button { color: #f1f5f9; border-color: #334155; }
                    .rbc-toolbar button:active, .rbc-toolbar button.rbc-active { background-color: #4f46e5 !important; border-color: #4f46e5; color: white !important; }
                    .rbc-month-view, .rbc-time-view, .rbc-header, .rbc-month-row, .rbc-day-bg, .rbc-time-content, .rbc-timeslot-group, .rbc-agenda-view, .rbc-agenda-content { border-color: #334155 !important; }
                    .rbc-off-range-bg { background-color: #0f172a; }
                    .rbc-today { background-color: #1e293b !important; }
                    .rbc-event { background-color: transparent; border: none; padding: 0; }
                    .event-meeting { background-color: #8b5cf6; padding: 2px 6px; border-radius: 4px; font-size: 12px; border: 1px solid #7c3aed; }
                    .event-task { background-color: #10b981; padding: 2px 6px; border-radius: 4px; font-size: 12px; border: 1px solid #059669; }
                    .rbc-date-cell { padding-right: 8px; font-size: 14px; font-weight: bold; }
                 `}} />
                 <ReactBigCalendar
                    localizer={localizer}
                    events={calendarEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%', minHeight: '500px' }}
                    views={['month', 'week', 'day', 'agenda']}
                    defaultView="month"
                    onSelectEvent={(event) => setSelectedEvent(event)}
                    components={{
                      event: ({ event }) => (
                        <div className={event.type === 'Meeting' ? 'event-meeting' : 'event-task'}>
                           {event.title}
                        </div>
                      )
                    }}
                 />
               </div>

               {/* Event Information Modal */}
               {selectedEvent && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                      <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/80">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                           {selectedEvent.type === 'Meeting' ? '📅 Meeting Details' : '📝 Task Details'}
                        </h3>
                        <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Title</label>
                           <p className="text-slate-200 font-medium text-lg leading-tight">{selectedEvent.resource.title}</p>
                        </div>
                        
                        {selectedEvent.type === 'Task' && (
                           <>
                             <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Status</label>
                                  <span className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-300 shadow-inner block w-fit">{selectedEvent.resource.status}</span>
                               </div>
                               <div>
                                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Priority</label>
                                  <span className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-300 shadow-inner block w-fit">{selectedEvent.resource.priority || 'Mild'}</span>
                               </div>
                             </div>
                             <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Due Date</label>
                                <p className="text-slate-200 bg-slate-900/50 p-2 rounded-lg border border-slate-700 shadow-inner text-sm inline-block">{new Date(selectedEvent.resource.dueDate).toLocaleDateString()}</p>
                             </div>
                             {selectedEvent.resource.assignedTo && (
                                <div>
                                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Assignee</label>
                                  <p className="text-slate-200 bg-slate-900/50 p-2 rounded-lg border border-slate-700 shadow-inner text-sm inline-block">👤 {selectedEvent.resource.assignedTo.name}</p>
                                </div>
                             )}
                           </>
                        )}
                        
                        {selectedEvent.type === 'Meeting' && (
                           <div className="space-y-4">
                              <div>
                                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Date & Time</label>
                                 <p className="text-slate-200 bg-slate-900/50 p-2 rounded-lg border border-slate-700 shadow-inner text-sm inline-block">🕒 {new Date(selectedEvent.resource.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                              </div>
                              {selectedEvent.resource.details && (
                                <div>
                                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Details / Agenda</label>
                                   <p className="text-slate-200 bg-slate-900/50 p-3 rounded-lg border border-slate-700 shadow-inner text-sm whitespace-pre-wrap">{selectedEvent.resource.details}</p>
                                </div>
                              )}
                              {selectedEvent.resource.participants && selectedEvent.resource.participants.length > 0 && (
                                <div>
                                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Participants</label>
                                   <div className="flex flex-wrap gap-2 mb-2">
                                     {selectedEvent.resource.participants.map(p => (
                                       <span key={p._id || p} className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                         {p.name || 'Member'}
                                         {user.role === 'Admin' && (
                                            <button onClick={() => {
                                                const currentIds = selectedEvent.resource.participants.map(mp => mp._id);
                                                handleUpdateMeetingParticipants(selectedEvent.resource._id, currentIds.filter(id => id !== p._id));
                                            }} className="text-indigo-400 hover:text-indigo-200 font-bold ml-1" title="Remove">×</button>
                                         )}
                                       </span>
                                     ))}
                                   </div>
                                </div>
                              )}
                              
                              {user.role === 'Admin' && (
                                 <div className="mt-2">
                                     <select className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm" value="" onChange={(e) => {
                                         if (!e.target.value) return;
                                         const currentIds = selectedEvent.resource.participants ? selectedEvent.resource.participants.map(mp => mp._id) : [];
                                         if (!currentIds.includes(e.target.value)) {
                                            handleUpdateMeetingParticipants(selectedEvent.resource._id, [...currentIds, e.target.value]);
                                         }
                                     }}>
                                        <option value="">+ Invite someone else...</option>
                                        {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                     </select>
                                 </div>
                              )}
                           </div>
                        )}
                        
                        {user.role === 'Admin' && (
                          <div className="pt-4 mt-2 border-t border-slate-700">
                             <button onClick={handleDeleteEvent} className="w-full flex items-center justify-center gap-2 p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl border border-rose-500/30 transition-colors shadow-sm">
                                <Trash2 size={16} /> Delete {selectedEvent.type}
                             </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
               )}
             </div>
          )}

          {/* TAB 4: ADMIN PROJECT DETAILS */}
          {/* TAB 5: ADMIN PROJECT DETAILS */}
          {activeTab === 'projects' && user.role === 'Admin' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-1 gap-6">
                 {projects.length === 0 && <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 text-slate-400">No projects created yet.</div>}
                 
                 {projects.map((project) => {
                   // 1. Find all tasks belonging to this project
                   const projectTasks = tasks.filter(t => t.project === project._id);
                   
                   // 2. Extract unique members assigned to these tasks
                   const assignedIds = [...new Set(projectTasks.map(t => t.assignedTo?._id || t.assignedTo).filter(Boolean))];
                   const assignedPeople = assignedIds.map(id => members.find(m => m._id === id)).filter(Boolean);

                   return (
                     <div key={project._id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                       <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                         <Folder className="text-indigo-400" size={24} /> {project.name}
                       </h2>
                       {project.description && <p className="text-slate-400 text-sm mb-6">{project.description}</p>}
                       
                       <div className="grid md:grid-cols-2 gap-8 mt-6">
                         {/* Assigned Team Members Column */}
                         <div>
                           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-700 pb-2">
                             People Assigned ({assignedPeople.length})
                           </h3>
                           {assignedPeople.length > 0 ? (
                             <div className="flex flex-wrap gap-2">
                               {assignedPeople.map(person => (
                                 <div key={person._id} className="flex items-center gap-2 bg-slate-900 border border-slate-700 pl-3 pr-1 py-1 rounded-lg shadow-inner group transition-all">
                                   <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                   <span className="text-sm text-slate-200 font-semibold">{person.name}</span>
                                   
                                   {/* Deassign Button */}
                                   <button 
                                     onClick={() => handleRemoveUserFromProject(project._id, person._id)}
                                     className="p-1 ml-1 text-slate-500 hover:bg-rose-500/20 hover:text-rose-400 rounded opacity-50 hover:opacity-100 transition-all"
                                     title={`Remove ${person.name} from project`}
                                   >
                                     <X size={14} strokeWidth={3} />
                                   </button>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <span className="text-sm text-slate-500 italic bg-slate-900/50 p-2 rounded-lg inline-block border border-slate-800">
                               No team members assigned yet.
                             </span>
                           )}
                         </div>

                         {/* Task Breakdown Column */}
                         <div>
                           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-700 pb-2">
                             Project Status ({projectTasks.length} Tasks)
                           </h3>
                           <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                             <div className="flex justify-between items-center text-sm">
                               <span className="text-slate-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-500"></div> Pending</span>
                               <span className="text-white font-black bg-slate-800 px-2 py-0.5 rounded">{projectTasks.filter(t => t.status === 'Pending').length}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                               <span className="text-blue-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> In Progress</span>
                               <span className="text-white font-black bg-slate-800 px-2 py-0.5 rounded">{projectTasks.filter(t => t.status === 'In Progress').length}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                               <span className="text-emerald-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Completed</span>
                               <span className="text-white font-black bg-slate-800 px-2 py-0.5 rounded">{projectTasks.filter(t => t.status === 'Completed').length}</span>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
          )}

          {/* TAB 5: ADMIN TEAM MANAGEMENT */}
          {activeTab === 'team' && user.role === 'Admin' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
                 <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Users className="text-indigo-400"/> User Directory</h2>
                    <p className="text-slate-400 text-sm mt-1">Manage team members, modify roles, and enforce password resets.</p>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900/50 text-slate-400 text-sm tracking-widest uppercase">
                          <th className="p-4 font-medium">Name</th>
                          <th className="p-4 font-medium">Email</th>
                          <th className="p-4 font-medium">Role</th>
                          <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {allUsers.map((u) => (
                          <tr key={u._id} className="hover:bg-slate-700/20 transition-colors">
                            <td className="p-4 font-medium text-slate-200">{u.name}</td>
                            <td className="p-4 text-slate-400">{u.email}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 text-xs font-bold rounded-md ${u.role === 'Admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}>{u.role}</span>
                            </td>
                            <td className="p-4 text-right">
                              <button onClick={() => setEditingUser(u)} className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors inline-flex items-center gap-2 text-sm font-semibold">
                                <Edit2 size={16} /> Manage User
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               </div>

               {/* Admin Edit Modal */}
               {editingUser && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                      <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/80">
                        <h3 className="font-bold text-white text-lg">Edit Team Member</h3>
                        <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                      </div>
                      <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Full Name</label>
                          <input type="text" className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl text-white" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} required />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Permissions / Role</label>
                          <select className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl text-white" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}>
                            <option value="Member">Student / Member</option>
                            <option value="Admin">Administrator</option>
                          </select>
                        </div>
                        <div className="pt-2 border-t border-slate-700">
                          <label className="text-xs font-bold text-rose-400 uppercase mb-1 block">Reset Password</label>
                          <input type="text" className="w-full p-3 bg-slate-900 border border-rose-500/50 rounded-xl text-white" placeholder="Type new password..." onChange={e => setEditingUser({...editingUser, password: e.target.value})} />
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button type="submit" className="flex-1 p-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg">Save Changes</button>
                        </div>
                      </form>
                    </div>
                  </div>
               )}
             </div>
          )}
        </div>
      </main>
    </div>
  );
}