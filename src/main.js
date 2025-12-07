import './style.css'

// .env 파일에서 GPT API Key 불러오기
const GPT_API_KEY = import.meta.env.VITE_GPT_API_KEY;
const GPT_API_URL = 'https://api.openai.com/v1/chat/completions';

// API Key 확인 함수
function checkAPIKey() {
  if (!GPT_API_KEY) {
    return { valid: false, message: 'GPT API Key가 로드되지 않았습니다. Vite 개발 서버를 재시작해주세요.' };
  }
  if (GPT_API_KEY === 'your-api-key-here' || GPT_API_KEY.trim() === '') {
    return { valid: false, message: 'GPT API Key가 설정되지 않았습니다. .env 파일에 VITE_GPT_API_KEY를 설정해주세요.' };
  }
  return { valid: true, message: 'GPT API Key가 설정되었습니다.' };
}

// API Key 상태 확인 (초기 로드 시)
const initialApiKeyStatus = checkAPIKey();
console.log('API Key 상태:', initialApiKeyStatus.message);
if (!initialApiKeyStatus.valid) {
  console.warn('⚠️', initialApiKeyStatus.message);
}

// 애플리케이션 HTML 구조
document.querySelector('#app').innerHTML = `
  <div class="chat-container">
    <h1>GPT Chat</h1>
    <div id="chat-messages" class="chat-messages"></div>
    <div class="chat-input-container">
      <input 
        type="text" 
        id="chat-input" 
        class="chat-input" 
        placeholder="메시지를 입력하세요..."
        autocomplete="off"
      />
      <button id="send-button" class="send-button">전송</button>
    </div>
    <div id="error-message" class="error-message"></div>
    <div id="api-key-status" class="api-key-status"></div>
  </div>
`

// DOM 요소 가져오기
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const errorMessage = document.getElementById('error-message');
const apiKeyStatusElement = document.getElementById('api-key-status');

// API Key 상태 표시
const status = checkAPIKey();
if (status.valid) {
  apiKeyStatusElement.textContent = '✓ API Key가 설정되었습니다';
  apiKeyStatusElement.className = 'api-key-status valid';
} else {
  apiKeyStatusElement.textContent = '⚠ ' + status.message;
  apiKeyStatusElement.className = 'api-key-status invalid';
}

// 메시지 추가 함수
function addMessage(content, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
  messageDiv.textContent = content;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 에러 메시지 표시
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 5000);
}

// GPT API 호출 함수
async function callGPTAPI(userMessage) {
  const status = checkAPIKey();
  if (!status.valid) {
    throw new Error(status.message);
  }

  try {
    const response = await fetch(GPT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GPT_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API 호출에 실패했습니다.');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    throw error;
  }
}

// 메시지 전송 함수
async function sendMessage() {
  const message = chatInput.value.trim();
  
  if (!message) {
    return;
  }

  // 사용자 메시지 표시
  addMessage(message, true);
  chatInput.value = '';
  sendButton.disabled = true;
  sendButton.textContent = '전송 중...';

  try {
    // GPT API 호출
    const response = await callGPTAPI(message);
    addMessage(response, false);
  } catch (error) {
    console.error('Error:', error);
    showError(`오류: ${error.message}`);
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = '전송';
    chatInput.focus();
  }
}

// 이벤트 리스너
sendButton.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// 초기 포커스
chatInput.focus();
