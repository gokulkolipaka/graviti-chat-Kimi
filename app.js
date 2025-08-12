/* eslint-disable no-console */
/* global localStorage */

/* =========================================================
   GravitiCorp Messenger – GitHub Pages Edition
   No backend, no server – 100 % browser / localStorage
   ========================================================= */

class MessagingApp {
  constructor() {
    this.currentUser = null;
    this.currentChat = null;
    this.users = [];
    this.groups = [];
    this.messages = [];
    this.settings = {};
    this.notifications = [];

    this.init();
  }

  init() {
    this.loadData();
    this.checkNetworkRestriction();
    this.showAuthPage();
    setTimeout(() => {
      this.setupEventListeners();
      this.setupGlobalFunctions();
    }, 100);
  }

  /* ---------- Data Layer (localStorage) ---------- */
  loadData() {
    const sampleData = {
      users: [
        {
          id: 'admin',
          phoneNumber: 'admin',
          email: 'admin@company.com',
          name: 'System Administrator',
          profilePic: '',
          lastSeen: new Date().toISOString(),
          isOnline: true,
          isAdmin: true,
          passwordChanged: false,
          password: 'GravitiAdmin2025!'
        },
        {
          id: 'user1',
          phoneNumber: '+1234567890',
          email: 'john@company.com',
          name: 'John Smith',
          profilePic: '',
          lastSeen: new Date().toISOString(),
          isOnline: true,
          isAdmin: false,
          password: 'password123'
        },
        {
          id: 'user2',
          phoneNumber: '+1234567891',
          email: 'jane@company.com',
          name: 'Jane Doe',
          profilePic: '',
          lastSeen: new Date().toISOString(),
          isOnline: false,
          isAdmin: false,
          password: 'password123'
        }
      ],
      groups: [
        {
          id: 'group1',
          name: 'General Discussion',
          members: ['admin', 'user1', 'user2'],
          createdBy: 'admin',
          createdAt: new Date().toISOString()
        }
      ],
      messages: [
        {
          id: 'msg1',
          sender: 'admin',
          receiver: 'group1',
          content: 'Welcome to the company messaging platform!',
          timestamp: new Date().toISOString(),
          type: 'text',
          status: 'read',
          mentions: []
        },
        {
          id: 'msg2',
          sender: 'user1',
          receiver: 'group1',
          content: 'Thanks for setting this up @admin!',
          timestamp: new Date().toISOString(),
          type: 'text',
          status: 'read',
          mentions: ['admin']
        }
      ],
      settings: {
        companyName: 'GravitiCorp',
        logoUrl: '',
        allowedIPs: ['192.168.1.0/24', '10.0.0.0/8'],
        appDisabled: false,
        disableUntil: null
      }
    };

    this.users = JSON.parse(localStorage.getItem('messaging_users') || JSON.stringify(sampleData.users));
    this.groups = JSON.parse(localStorage.getItem('messaging_groups') || JSON.stringify(sampleData.groups));
    this.messages = JSON.parse(localStorage.getItem('messaging_messages') || JSON.stringify(sampleData.messages));
    this.settings = JSON.parse(localStorage.getItem('messaging_settings') || JSON.stringify(sampleData.settings));
  }

  saveData() {
    localStorage.setItem('messaging_users', JSON.stringify(this.users));
    localStorage.setItem('messaging_groups', JSON.stringify(this.groups));
    localStorage.setItem('messaging_messages', JSON.stringify(this.messages));
    localStorage.setItem('messaging_settings', JSON.stringify(this.settings));
  }

  /* ---------- UI ---------- */
  checkNetworkRestriction() {
    // Always allow on GitHub Pages
    document.getElementById('networkWarning')?.classList.add('hidden');
    return true;
  }

  showAuthPage() {
    document.getElementById('authPage')?.classList.remove('hidden');
    document.getElementById('chatApp')?.classList.add('hidden');
    this.updateBrandingDisplay();
  }

  updateBrandingDisplay() {
    const logoEls = ['authLogo', 'appLogo'];
    logoEls.forEach(id => {
      const el = document.getElementById(id);
      if (el && this.settings.logoUrl) {
        el.src = this.settings.logoUrl;
        el.classList.remove('hidden');
      } else if (el) {
        el.classList.add('hidden');
      }
    });

    const nameEls = ['authCompanyName', 'appCompanyName'];
    nameEls.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = this.settings.companyName || 'GravitiCorp';
    });
  }

  /* ---------- Auth ---------- */
  login(phoneNumber, password) {
    const user = this.users.find(u => u.phoneNumber === phoneNumber && u.password === password);
    if (!user) return this.showNotification('Invalid credentials', 'error');

    this.currentUser = user;
    user.isOnline = true;
    user.lastSeen = new Date().toISOString();
    this.saveData();

    document.getElementById('authPage')?.classList.add('hidden');
    document.getElementById('chatApp')?.classList.remove('hidden');

    if (user.isAdmin) {
      document.getElementById('adminBtn')?.style.setProperty('display', 'block');
      if (!user.passwordChanged) setTimeout(() => this.showModal('passwordModal'), 500);
    }

    this.loadChatInterface();
    this.showNotification('Login successful', 'success');
  }

  register(name, phoneNumber, email, password) {
    if (this.users.some(u => u.phoneNumber === phoneNumber)) {
      return this.showNotification('Phone already registered', 'error');
    }

    this.users.push({
      id: 'user_' + Date.now(),
      phoneNumber,
      email,
      name,
      profilePic: '',
      lastSeen: new Date().toISOString(),
      isOnline: true,
      isAdmin: false,
      password
    });
    this.saveData();
    this.showNotification('Registration successful – please login', 'success');
    this.switchAuthTab('login');
  }

  logout() {
    if (this.currentUser) {
      this.currentUser.isOnline = false;
      this.currentUser.lastSeen = new Date().toISOString();
      this.saveData();
    }
    this.currentUser = null;
    this.currentChat = null;
    this.showAuthPage();
  }

  /* ---------- Chat Interface ---------- */
  loadChatInterface() {
    this.updateBrandingDisplay();
    this.loadChatList();
    this.showWelcomeScreen();
  }

  loadChatList() {
    const chatList = document.getElementById('chatList');
    if (!chatList) return;
    chatList.innerHTML = '';

    this.users
      .filter(u => u.id !== this.currentUser.id)
      .forEach(u => this.createChatItem(u, 'user'));

    this.groups
      .filter(g => g.members.includes(this.currentUser.id))
      .forEach(g => this.createChatItem(g, 'group'));
  }

  createChatItem(chat, type) {
    const chatList = document.getElementById('chatList');
    if (!chatList) return;
    const item = document.createElement('div');
    item.className = 'chat-item';
    item.addEventListener('click', () => this.selectChat(chat, type));

    const lastMsg = this.getLastMessage(chat.id);
    const unread = this.getUnreadCount(chat.id);

    item.innerHTML = `
      <div class="avatar ${type === 'user' && chat.isOnline ? 'online-indicator' : ''}">
        <i class="fas fa-${type === 'group' ? 'users' : 'user'}"></i>
      </div>
      <div class="chat-item-content">
        <div class="chat-item-header">
          <span class="chat-item-name">${chat.name}</span>
          <span class="chat-item-time">${lastMsg ? this.formatTime(lastMsg.timestamp) : ''}</span>
        </div>
        <div class="chat-item-message">${lastMsg ? lastMsg.content.substring(0, 30) : 'No messages yet'}</div>
      </div>
      ${unread > 0 ? `<div class="unread-count">${unread}</div>` : ''}
    `;
    chatList.appendChild(item);
  }

  selectChat(chat, type) {
    this.currentChat = { ...chat, type };
    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.chat-item').forEach(el => {
      if (el.querySelector('.chat-item-name').textContent === chat.name) el.classList.add('active');
    });

    document.getElementById('welcomeScreen')?.classList.add('hidden');
    document.getElementById('chatWindow')?.classList.remove('hidden');

    document.getElementById('chatTitle').textContent = chat.name;
    document.getElementById('chatStatus').textContent =
      type === 'group'
        ? `${chat.members?.length || 0} members`
        : chat.isOnline
        ? 'Online'
        : `Last seen ${this.formatTime(chat.lastSeen)}`;

    this.loadMessages();
    this.markAsRead(chat.id);
  }

  showWelcomeScreen() {
    document.getElementById('welcomeScreen')?.classList.remove('hidden');
    document.getElementById('chatWindow')?.classList.add('hidden');
  }

  /* ---------- Messaging ---------- */
  sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    if (!content || !this.currentChat) return;

    const msg = {
      id: 'msg_' + Date.now(),
      sender: this.currentUser.id,
      receiver: this.currentChat.id,
      content,
      timestamp: new Date().toISOString(),
      type: 'text',
      status: 'sent',
      mentions: this.extractMentions(content)
    };

    this.messages.push(msg);
    this.saveData();
    input.value = '';
    this.loadMessages();
    this.loadChatList();

    // Simulate delivery
    setTimeout(() => {
      msg.status = 'delivered';
      this.saveData();
      this.loadMessages();
    }, 1000);
    setTimeout(() => {
      msg.status = 'read';
      this.saveData();
      this.loadMessages();
    }, 3000);
  }

  extractMentions(text) {
    const regex = /@(\w+)/g;
    const mentions = [];
    let m;
    while ((m = regex.exec(text)) !== null) {
      const user = this.users.find(u => u.name.toLowerCase().includes(m[1].toLowerCase()));
      if (user) mentions.push(user.id);
    }
    return mentions;
  }

  loadMessages() {
    if (!this.currentChat) return;
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    container.innerHTML = '';

    const msgs = this.messages.filter(
      m =>
        m.receiver === this.currentChat.id ||
        (this.currentChat.type === 'user' &&
          ((m.sender === this.currentUser.id && m.receiver === this.currentChat.id) ||
            (m.sender === this.currentChat.id && m.receiver === this.currentUser.id)))
    );

    msgs.forEach(m => this.createMessageElement(m));
    container.scrollTop = container.scrollHeight;
  }

  createMessageElement(msg) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    const div = document.createElement('div');
    const isSent = msg.sender === this.currentUser.id;
    div.className = `message ${isSent ? 'sent' : 'received'}`;
    const sender = this.users.find(u => u.id === msg.sender);
    const processed = msg.content.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    div.innerHTML = `
      <div class="message-bubble">
        ${
          !isSent && this.currentChat.type === 'group'
            ? `<div class="message-sender">${sender?.name || 'Unknown'}</div>`
            : ''
        }
        <p class="message-content">${processed}</p>
        <div class="message-time">
          ${this.formatTime(msg.timestamp)}
          ${
            isSent
              ? `<span class="message-status">
                   <i class="fas fa-${msg.status === 'read' ? 'check-double' : 'check'}"></i>
                 </span>`
              : ''
          }
        </div>
      </div>
    `;
    container.appendChild(div);
  }

  markAsRead(chatId) {
    this.messages.forEach(m => {
      if (m.receiver === chatId && m.sender !== this.currentUser.id) m.status = 'read';
    });
    this.saveData();
  }

  getLastMessage(chatId) {
    const msgs = this.messages.filter(m => m.receiver === chatId || m.sender === chatId);
    return msgs[msgs.length - 1];
  }

  getUnreadCount(chatId) {
    return this.messages.filter(
      m => m.receiver === chatId && m.sender !== this.currentUser.id && m.status !== 'read'
    ).length;
  }

  /* ---------- Event Listeners ---------- */
  setupEventListeners() {
    // auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', e => {
        e.preventDefault();
        this.switchAuthTab(e.target.textContent.includes('Sign In') ? 'login' : 'register');
      });
    });

    // forms
    document.getElementById('loginForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const phone = document.getElementById('loginPhone').value;
      const pass = document.getElementById('loginPassword').value;
      this.login(phone, pass);
    });

    document.getElementById('registerForm')?.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('registerName').value;
      const phone = document.getElementById('registerPhone').value;
      const email = document.getElementById('registerEmail').value;
      const pass = document.getElementById('registerPassword').value;
      this.register(name, phone, email, pass);
    });

    // message input
    document.getElementById('messageInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  setupGlobalFunctions() {
    // expose to window for onclick handlers
    window.switchAuthTab = tab => this.switchAuthTab(tab);
    window.showModal = id => this.showModal(id);
    window.closeModal = id => this.closeModal(id);
    window.logout = () => this.logout();
    window.sendMessage = () => this.sendMessage();
    window.showForgotPassword = () => this.showModal('forgotPasswordModal');
    window.showAdminPanel = () => this.showAdminPanel();
    window.switchAdminTab = tab => this.switchAdminTab(tab);
    window.updateBranding = () => this.updateBranding();
    window.updateSettings = () => this.updateSettings();
    window.toggleAppDisable = () => this.toggleAppDisable();
    window.createGroup = () => this.createGroup();
    window.showCreateGroup = () => this.showCreateGroup();
    window.changePassword = () => this.changePassword();
    window.skipPasswordChange = () => this.skipPasswordChange();
    window.resetPassword = () => this.resetPassword();
    window.showProfile = () => this.showProfile();
    window.updateProfile = () => this.updateProfile();
    window.changeUserPassword = () => this.changeUserPassword();
    window.showChatInfo = () => this.showChatInfo();
    window.selectFile = () => this.showNotification('File uploads disabled in demo', 'info');
    window.toggleAttachmentMenu = () => this.toggleAttachmentMenu();
    window.toggleEmojiPicker = () => this.toggleEmojiPicker();
  }

  /* ---------- Admin & Misc ---------- */
  showAdminPanel() {
    if (!this.currentUser?.isAdmin) return;
    this.switchAdminTab('branding');
    this.showModal('adminModal');
  }

  switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`${tabName}Tab`)?.classList.add('active');
    document.querySelectorAll('.admin-tab').forEach(t => {
      if (t.textContent.toLowerCase().includes(tabName.toLowerCase())) t.classList.add('active');
    });
    if (tabName === 'users') this.loadUsersTab();
  }

  loadUsersTab() {
    const container = document.getElementById('usersList');
    if (!container) return;
    container.innerHTML = '';
    this.users.forEach(u => {
      const div = document.createElement('div');
      div.className = 'user-item';
      div.innerHTML = `
        <div class="user-info">
          <div class="user-name">${u.name}</div>
          <div class="user-phone">${u.phoneNumber}</div>
        </div>
        <div class="user-status">
          <span class="status-indicator ${u.isOnline ? '' : 'offline'}"></span>
          ${u.isOnline ? 'Online' : 'Offline'}
        </div>
        <button class="btn btn--outline btn--sm" onclick="app.deleteUser('${u.id}')" ${
        u.id === this.currentUser.id ? 'disabled' : ''
      }>
          <i class="fas fa-trash"></i>
        </button>
      `;
      container.appendChild(div);
    });
  }

  deleteUser(id) {
    if (id === this.currentUser.id) return this.showNotification('Cannot delete own account', 'error');
    if (confirm('Delete this user?')) {
      this.users = this.users.filter(u => u.id !== id);
      this.messages = this.messages.filter(m => m.sender !== id);
      this.groups.forEach(g => (g.members = g.members.filter(m => m !== id)));
      this.saveData();
      this.loadUsersTab();
      this.loadChatList();
      this.showNotification('User deleted', 'success');
    }
  }

  updateBranding() {
    const name = document.getElementById('companyNameInput').value.trim();
    const file = document.getElementById('logoUpload').files[0];
    if (name) this.settings.companyName = name;
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        this.settings.logoUrl = e.target.result;
        this.saveData();
        this.updateBrandingDisplay();
        this.showNotification('Branding updated', 'success');
      };
      reader.readAsDataURL(file);
    } else {
      this.saveData();
      this.updateBrandingDisplay();
      this.showNotification('Company name updated', 'success');
    }
  }

  updateSettings() {
    const ips = document.getElementById('allowedIPs').value
      .split('\n')
      .map(ip => ip.trim())
      .filter(Boolean);
    this.settings.allowedIPs = ips;
    this.saveData();
    this.showNotification('Settings updated', 'success');
  }

  toggleAppDisable() {
    const until = document.getElementById('disableUntil').value;
    if (this.settings.appDisabled) {
      this.settings.appDisabled = false;
      this.settings.disableUntil = null;
      this.showNotification('App enabled', 'success');
    } else if (until) {
      this.settings.appDisabled = true;
      this.settings.disableUntil = until;
      this.showNotification(`App disabled until ${new Date(until).toLocaleString()}`, 'warning');
    }
    this.saveData();
  }

  createGroup() {
    const name = document.getElementById('groupName').value.trim();
    const members = Array.from(document.querySelectorAll('.user-checkbox input:checked')).map(
      cb => cb.value
    );
    if (!name) return this.showNotification('Enter a group name', 'error');
    if (!members.length) return this.showNotification('Select at least one member', 'error');

    this.groups.push({
      id: 'group_' + Date.now(),
      name,
      members: [this.currentUser.id, ...members],
      createdBy: this.currentUser.id,
      createdAt: new Date().toISOString()
    });
    this.saveData();
    document.getElementById('groupName').value = '';
    document.querySelectorAll('.user-checkbox input').forEach(cb => (cb.checked = false));
    this.closeModal('groupModal');
    this.loadChatList();
    this.showNotification('Group created', 'success');
  }

  changePassword() {
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    if (newPass !== confirmPass) return this.showNotification('Passwords do not match', 'error');
    if (newPass.length < 8) return this.showNotification('≥ 8 characters', 'error');
    this.currentUser.password = newPass;
    this.currentUser.passwordChanged = true;
    this.saveData();
    this.closeModal('passwordModal');
    this.showNotification('Password changed', 'success');
  }

  showProfile() {
    document.getElementById('profileName').value = this.currentUser.name;
    document.getElementById('profileEmail').value = this.currentUser.email;
    this.showModal('profileModal');
  }

  updateProfile() {
    const name = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    if (name) this.currentUser.name = name;
    if (email) this.currentUser.email = email;
    this.saveData();
    this.closeModal('profileModal');
    this.loadChatList();
    this.showNotification('Profile updated', 'success');
  }

  /* ---------- Utilities ---------- */
  showModal(id) {
    document.getElementById(id)?.classList.remove('hidden');
  }

  closeModal(id) {
    document.getElementById(id)?.classList.add('hidden');
  }

  toggleAttachmentMenu() {
    document.getElementById('attachmentMenu')?.classList.toggle('hidden');
  }

  toggleEmojiPicker() {
    document.getElementById('emojiPicker')?.classList.toggle('hidden');
  }

  formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString();
  }

  showNotification(text, type = 'info') {
    const box = document.getElementById('notifications');
    if (!box) return;
    const note = document.createElement('div');
    note.className = `notification ${type}`;
    note.textContent = text;
    box.appendChild(note);
    setTimeout(() => note.remove(), 3000);
  }

  switchAuthTab(tab) {
    document.getElementById('loginForm')?.classList.toggle('active', tab === 'login');
    document.getElementById('registerForm')?.classList.toggle('active', tab === 'register');
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-tab').forEach(t => {
      if (
        (tab === 'login' && t.textContent.includes('Sign In')) ||
        (tab === 'register' && t.textContent.includes('Register'))
      )
        t.classList.add('active');
    });
  }
}

/* ---------- Boot ---------- */
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new MessagingApp();
});
