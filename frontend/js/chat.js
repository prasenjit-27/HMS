const user = requireAuth();
if (!user) window.location.href = '/';
const urlParams = new URLSearchParams(window.location.search);
const consultationId = urlParams.get('id');
if (!consultationId) {
  showToast('No consultation ID provided.', 'error');
  setTimeout(() => history.back(), 1000);
}
let socket = null;
let consultationData = null;
document.addEventListener('DOMContentLoaded', () => {
  setBackLink();
  loadChat();
});
function setBackLink() {
  const backBtn = document.getElementById('chat-back-btn');
  backBtn.href = user.role === 'doctor' ? '/doctor-dashboard.html' : '/patient-dashboard.html';
}
async function loadChat() {
  try {
    const res = await api.get(`/chat/${consultationId}/messages`);
    consultationData = res.data.consultation;
    const messages = res.data.messages;
    const isDoctor = user.role === 'doctor';
    const partner = isDoctor ? consultationData.patientId : consultationData.doctorId;
    const partnerName = partner?.name || 'Chat Partner';
    
    document.getElementById('chat-partner-name').textContent = 
      isDoctor ? partnerName : `Dr. ${partnerName}`;
    document.getElementById('chat-avatar').textContent = getInitials(partnerName);
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    messages.forEach(msg => renderMessage(msg));
    scrollToBottom();
    if (consultationData.status === 'closed') {
      markAsClosed();
    } else if (consultationData.status === 'accepted') {
      document.getElementById('chat-status').textContent = 'Online';
      if (user.role === 'doctor') {
        document.getElementById('chat-header-actions').innerHTML = `
          <button class="btn btn-danger btn-sm" onclick="closeChat()"> Close Consultation</button>
        `;
      }
      connectSocket();
    } else {
      document.getElementById('chat-status').textContent = `Status: ${consultationData.status}`;
      document.getElementById('chat-input-area').classList.add('hidden');
    }
  } catch (error) {
    showToast(error.message, 'error');
    document.getElementById('chat-messages').innerHTML = `
      <div class="empty-state">
        <div class="icon"></div>
        <h3>Error Loading Chat</h3>
        <p>${escapeHtml(error.message)}</p>
      </div>`;
  }
}
function connectSocket() {
  socket = io({
    auth: { token: getToken() },
  });
  socket.on('connect', () => {
    console.log('Socket connected');
    socket.emit('join_consultation', consultationId);
  });
  socket.on('joined_consultation', (data) => {
    console.log('Joined consultation room:', data);
  });
  socket.on('receive_message', (msg) => {
    renderMessage(msg);
    scrollToBottom();
  });
  socket.on('consultation_closed', () => {
    showToast('Consultation has been closed.', 'info');
    markAsClosed();
  });
  socket.on('error_message', (data) => {
    showToast(data.message, 'error');
  });
  socket.on('disconnect', () => {
    document.getElementById('chat-status').textContent = 'Reconnecting...';
  });
  socket.on('reconnect', () => {
    document.getElementById('chat-status').textContent = 'Online';
    socket.emit('join_consultation', consultationId);
  });
}
function renderMessage(msg) {
  const container = document.getElementById('chat-messages');
  const isSent = msg.senderId?._id === user.id || msg.senderId === user.id;
  const div = document.createElement('div');
  div.className = `chat-message ${isSent ? 'sent' : 'received'}`;
  let content = '';
  if (msg.content) {
    content = `<div class="message-bubble">${escapeHtml(msg.content)}</div>`;
  }
  if (msg.fileUrl) {
    const isImage = msg.fileType && msg.fileType.startsWith('image/');
    if (isImage) {
      content += `
        <div class="message-bubble" style="padding: 0.5rem;">
          <img src="${msg.fileUrl}" alt="Shared image" style="max-width: 240px; border-radius: 8px; cursor: pointer;" onclick="window.open('${msg.fileUrl}', '_blank')">
        </div>`;
    } else {
      content += `
        <div class="message-bubble">
          <a href="${msg.fileUrl}" target="_blank" class="message-file" style="color: inherit; text-decoration: none;">
             ${escapeHtml(msg.fileName || 'File')}
          </a>
        </div>`;
    }
  }
  const senderName = msg.senderId?.name || 'You';
  const time = formatTime(msg.createdAt);
  div.innerHTML = `
    ${content}
    <div class="message-meta">
      <span>${isSent ? 'You' : senderName}</span>
      <span>•</span>
      <span>${time}</span>
    </div>
  `;
  container.appendChild(div);
}
function sendMessage() {
  const input = document.getElementById('message-input');
  const content = input.value.trim();
  if (!content || !socket) return;
  socket.emit('send_message', {
    consultationId,
    content,
  });
  input.value = '';
  input.focus();
}
function handleInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    showToast('File size must be less than 10MB.', 'error');
    return;
  }
  const formData = new FormData();
  formData.append('file', file);
  try {
    showToast('Uploading file...', 'info', 2000);
    await api.upload(`/chat/${consultationId}/upload`, formData);
  } catch (error) {
    showToast(error.message, 'error');
  }
  e.target.value = '';
}
async function closeChat() {
  const confirmed = await showConfirm('Close this consultation? The chat will become read-only.');
  if (!confirmed) return;
  try {
    await api.put(`/doctor/consultations/${consultationId}/close`);
    showToast('Consultation closed.', 'info');
    markAsClosed();
  } catch (error) {
    showToast(error.message, 'error');
  }
}
function markAsClosed() {
  document.getElementById('chat-status').textContent = 'Closed';
  document.getElementById('chat-closed-banner').classList.remove('hidden');
  document.getElementById('chat-input-area').classList.add('hidden');
  document.getElementById('chat-header-actions').innerHTML = '';
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
function scrollToBottom() {
  const container = document.getElementById('chat-messages');
  container.scrollTop = container.scrollHeight;
}
