// Application State
let currentUser = '';
let tasks = [];
let currentView = 'overview';
let streak = 0;
let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}'); // Store username:password pairs (persisted)

const productivityTips = [
  'Focus on one task at a time for better results',
  'Take regular breaks to maintain productivity',
  'Set realistic deadlines for your goals',
  'Celebrate small wins to stay motivated',
  'Use the Pomodoro technique for deep focus',
  'Prioritize tasks by importance, not urgency',
  'Break large tasks into smaller, manageable steps'
];

const categories = {
  work: { icon: '💼', color: '#4F46E5' },
  learning: { icon: '📚', color: '#059669' },
  personal: { icon: '🏠', color: '#DC2626' },
  health: { icon: '💪', color: '#7C3AED' }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
  initializeParticles();
  loadSampleData();
});

function initializeApp() {
  updateCurrentDate();
  setInterval(updateCurrentDate, 60000);
  showRandomTip();
}

function loadSampleData() {
  tasks = [
    {
      id: Date.now() + 1,
      text: 'Complete Java full-stack project',
      priority: 'high',
      category: 'work',
      completed: false,
      dueDate: '2025-10-30',
      createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 2,
      text: 'Learn Spring Boot framework',
      priority: 'medium',
      category: 'learning',
      completed: false,
      dueDate: '2025-11-05',
      createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 3,
      text: 'Practice database queries',
      priority: 'low',
      category: 'learning',
      completed: true,
      dueDate: '2025-10-25',
      createdAt: new Date().toISOString()
    }
  ];
}

function setupEventListeners() {
  // Login and Registration
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('showRegisterBtn').addEventListener('click', showRegisterScreen);
  document.getElementById('showLoginBtn').addEventListener('click', showLoginScreen);
  
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => switchView(item.dataset.view));
  });
  
  // Header buttons
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  
  // Task form
  document.getElementById('addTaskForm').addEventListener('submit', handleAddTask);
  document.getElementById('searchInput').addEventListener('input', filterTasks);
  document.getElementById('filterCategory').addEventListener('change', filterTasks);
  document.getElementById('filterPriority').addEventListener('change', filterTasks);
  document.getElementById('aiSuggestBtn').addEventListener('click', showAISuggestions);
  
  // Quick actions
  document.getElementById('addQuickTask').addEventListener('click', () => switchView('tasks'));
  document.getElementById('nextTipBtn').addEventListener('click', showRandomTip);
  
  // Settings
  document.getElementById('changePasswordBtn').addEventListener('click', handlePasswordChange);
}

// Login and Registration
function showRegisterScreen(e) {
  e.preventDefault();
  document.getElementById('loginScreen').classList.remove('active');
  document.getElementById('registerScreen').classList.add('active');
}

function showLoginScreen(e) {
  e.preventDefault();
  document.getElementById('registerScreen').classList.remove('active');
  document.getElementById('loginScreen').classList.add('active');
}

function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (password !== confirmPassword) {
    showNotification('Passwords do not match!');
    return;
  }
  
  if (registeredUsers[username]) {
    showNotification('Username already exists!');
    return;
  }
  
  registeredUsers[username] = password;
  // persist
  localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
  showNotification('Account created successfully! Please login.');
  showLoginScreen(e);
  
  // Clear form
  document.getElementById('registerForm').reset();
}

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  
  // Validate credentials against registered users
  if (!username || !password) {
    showNotification('Please enter username and password');
    return;
  }

  // If there are no registered users yet, allow any login (development fallback)
  if (Object.keys(registeredUsers).length === 0) {
    currentUser = username;
  } else {
    if (registeredUsers[username] && registeredUsers[username] === password) {
      currentUser = username;
    } else {
      showNotification('Invalid username or password');
      return;
    }
  }

  document.getElementById('sidebarUsername').textContent = currentUser;
  document.getElementById('displayUsername').value = currentUser;
  document.getElementById('loginScreen').classList.remove('active');
  document.getElementById('registerScreen').classList.remove('active');
  document.getElementById('mainDashboard').classList.add('active');
  
  showNotification(`Welcome, ${currentUser}! 👋`);
  updateDashboard();
}

function handleLogout() {
  currentUser = '';
  document.getElementById('mainDashboard').classList.remove('active');
  document.getElementById('loginScreen').classList.add('active');
  document.getElementById('loginForm').reset();
  showNotification('Logged out successfully');
}

function handlePasswordChange() {
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmNewPassword').value;
  
  if (!newPassword || !confirmPassword) {
    showNotification('Please fill in all fields');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showNotification('Passwords do not match!');
    return;
  }
  
  // Update password
  if (registeredUsers[currentUser]) {
    registeredUsers[currentUser] = newPassword;
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
  }
  
  showNotification('Password updated successfully! ✅');
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmNewPassword').value = '';
}

// View Management
function switchView(viewName) {
  currentView = viewName;
  
  // Update navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });
  
  // Update content
  document.querySelectorAll('.view-content').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(`${viewName}View`).classList.add('active');
  
  // Update title
  const titles = {
    overview: 'Dashboard Overview',
    tasks: 'All Tasks',
    completed: 'Completed Tasks',
    settings: 'Settings'
  };
  document.getElementById('viewTitle').textContent = titles[viewName];
  
  // Load view-specific data
  if (viewName === 'tasks') {
    renderTasks();
  } else if (viewName === 'completed') {
    renderCompletedTasks();
  } else if (viewName === 'overview') {
    updateDashboard();
  }
}

// Task Management
function handleAddTask(e) {
  e.preventDefault();
  
  const text = document.getElementById('taskInput').value;
  const priority = document.getElementById('taskPriority').value;
  const category = document.getElementById('taskCategory').value;
  const dueDate = document.getElementById('taskDueDate').value;
  
  const task = {
    id: Date.now(),
    text,
    priority,
    category,
    dueDate,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  tasks.push(task);
  
  // Reset form
  e.target.reset();
  
  showNotification('Task added successfully! ✅');
  renderTasks();
  updateDashboard();
}

function toggleTaskComplete(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    
    if (task.completed) {
      showNotification('Task completed! 🎉');
      incrementStreak();
    }
    
    renderTasks();
    updateDashboard();
  }
}

function deleteTask(taskId) {
  tasks = tasks.filter(t => t.id !== taskId);
  showNotification('Task deleted');
  renderTasks();
  updateDashboard();
}

function renderTasks() {
  const tasksList = document.getElementById('tasksList');
  const filteredTasks = getFilteredTasks();
  
  if (filteredTasks.length === 0) {
    tasksList.innerHTML = `
      <div class="glass-effect" style="padding: 40px; text-align: center;">
        <i class="fas fa-tasks" style="font-size: 48px; opacity: 0.3; margin-bottom: 16px;"></i>
        <p style="color: var(--text-secondary);">No tasks found. Create your first task!</p>
      </div>
    `;
    return;
  }
  
  tasksList.innerHTML = filteredTasks.map(task => `
    <div class="task-item ${task.completed ? 'completed' : ''}" draggable="true" data-task-id="${task.id}">
      <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTaskComplete(${task.id})">
        ${task.completed ? '<i class="fas fa-check"></i>' : ''}
      </div>
      <div class="task-content">
        <div class="task-title ${task.completed ? 'completed' : ''}">${task.text}</div>
        <div class="task-meta">
          <span class="task-priority priority-${task.priority}">${getPriorityEmoji(task.priority)} ${task.priority.toUpperCase()}</span>
          <span class="task-category">${categories[task.category].icon} ${task.category}</span>
          ${task.dueDate ? `<span class="task-due"><i class="fas fa-calendar"></i> ${formatDate(task.dueDate)}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="task-btn" onclick="editTask(${task.id})" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="task-btn delete" onclick="deleteTask(${task.id})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
  
  // Add drag and drop
  setupDragAndDrop();
}

function getFilteredTasks() {
  let filtered = [...tasks];
  
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const categoryFilter = document.getElementById('filterCategory').value;
  const priorityFilter = document.getElementById('filterPriority').value;
  
  if (searchTerm) {
    filtered = filtered.filter(task => 
      task.text.toLowerCase().includes(searchTerm)
    );
  }
  
  if (categoryFilter !== 'all') {
    filtered = filtered.filter(task => task.category === categoryFilter);
  }
  
  if (priorityFilter !== 'all') {
    filtered = filtered.filter(task => task.priority === priorityFilter);
  }
  
  return filtered;
}

function filterTasks() {
  renderTasks();
}

function getPriorityEmoji(priority) {
  const emojis = { high: '🔴', medium: '🟡', low: '🟢' };
  return emojis[priority] || '⚪';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 0) return 'Overdue';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function editTask(taskId) {
  showNotification('Edit feature coming soon! 🔧');
}

function renderCompletedTasks() {
  const completedTasksList = document.getElementById('completedTasksList');
  const completedTasks = tasks.filter(t => t.completed);
  
  if (completedTasks.length === 0) {
    completedTasksList.innerHTML = `
      <div class="glass-effect" style="padding: 40px; text-align: center;">
        <i class="fas fa-check-circle" style="font-size: 48px; opacity: 0.3; margin-bottom: 16px;"></i>
        <p style="color: var(--text-secondary);">No completed tasks yet. Keep working!</p>
      </div>
    `;
    return;
  }
  
  completedTasksList.innerHTML = completedTasks.map(task => `
    <div class="task-item completed" data-task-id="${task.id}">
      <div class="task-checkbox checked" onclick="toggleTaskComplete(${task.id})">
        <i class="fas fa-check"></i>
      </div>
      <div class="task-content">
        <div class="task-title completed">${task.text}</div>
        <div class="task-meta">
          <span class="task-priority priority-${task.priority}">${getPriorityEmoji(task.priority)} ${task.priority.toUpperCase()}</span>
          <span class="task-category">${categories[task.category].icon} ${task.category}</span>
          ${task.dueDate ? `<span class="task-due"><i class="fas fa-calendar"></i> ${formatDate(task.dueDate)}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="task-btn delete" onclick="deleteTask(${task.id})" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// Dashboard Updates
function updateDashboard() {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  document.getElementById('totalTasks').textContent = totalTasks;
  document.getElementById('completedTasks').textContent = completedTasks;
  document.getElementById('streakDays').textContent = streak;
  document.getElementById('completionRate').textContent = completionRate + '%';
  
  // Update progress bar
  document.getElementById('weeklyProgressBar').style.width = completionRate + '%';
  document.getElementById('weeklyProgressText').textContent = completionRate + '% Complete';
  
  // Update today's tasks
  updateTodayTasks();
}

function updateTodayTasks() {
  const todayTasksList = document.getElementById('todayTasksList');
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.dueDate === today).slice(0, 5);
  
  if (todayTasks.length === 0) {
    todayTasksList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No tasks due today 🎉</p>';
    return;
  }
  
  todayTasksList.innerHTML = todayTasks.map(task => `
    <div class="task-mini ${task.completed ? 'completed' : ''}">
      <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTaskComplete(${task.id})" style="width: 20px; height: 20px;">
        ${task.completed ? '<i class="fas fa-check" style="font-size: 12px;"></i>' : ''}
      </div>
      <div style="flex: 1;">
        <div>${task.text}</div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
          ${categories[task.category].icon} ${task.category}
        </div>
      </div>
    </div>
  `).join('');
}

function updateCurrentDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

function showRandomTip() {
  const randomTip = productivityTips[Math.floor(Math.random() * productivityTips.length)];
  document.getElementById('productivityTip').textContent = randomTip;
}

function incrementStreak() {
  streak++;
  document.getElementById('streakDays').textContent = streak;
}



// AI Suggestions
function showAISuggestions() {
  const suggestions = [
    'Review and update your resume',
    'Practice coding algorithms',
    'Read a technical article',
    'Work on side project',
    'Learn a new framework'
  ];
  
  const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
  document.getElementById('taskInput').value = randomSuggestion;
  showNotification('AI suggested a task! 🤖');
}



function showNotification(message) {
  const toast = document.getElementById('notificationToast');
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Drag and Drop
function setupDragAndDrop() {
  const taskItems = document.querySelectorAll('.task-item');
  
  taskItems.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);
  });
}

let draggedItem = null;

function handleDragStart(e) {
  draggedItem = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  if (this !== draggedItem) {
    const rect = this.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    
    if (e.clientY < midpoint) {
      this.parentNode.insertBefore(draggedItem, this);
    } else {
      this.parentNode.insertBefore(draggedItem, this.nextSibling);
    }
  }
}

function handleDrop(e) {
  e.preventDefault();
}

function handleDragEnd() {
  this.classList.remove('dragging');
  draggedItem = null;
}

// Particles Animation
function initializeParticles() {
  const canvas = document.getElementById('particlesCanvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const particleCount = 50;
  
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 1;
      this.speedX = Math.random() * 0.5 - 0.25;
      this.speedY = Math.random() * 0.5 - 0.25;
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      
      if (this.x > canvas.width) this.x = 0;
      if (this.x < 0) this.x = canvas.width;
      if (this.y > canvas.height) this.y = 0;
      if (this.y < 0) this.y = canvas.height;
    }
    
    draw() {
      ctx.fillStyle = 'rgba(14, 165, 233, 0.3)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    
    // Draw connections
    particles.forEach((a, i) => {
      particles.slice(i + 1).forEach(b => {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          ctx.strokeStyle = `rgba(14, 165, 233, ${0.2 - distance / 500})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      });
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
  
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}