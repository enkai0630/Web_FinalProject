const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const statusBadge = document.querySelector('.status-badge');
const sentimentBadge = document.querySelector('.sentiment-badge');
const sentimentScore = document.querySelector('.sentiment-score');
const keywordList = document.querySelector('.keyword-list');
const suggestionList = document.querySelector('.suggestion-list');

chatForm.addEventListener('submit', handleSend);
updateStatusText('待命中', 'var(--color-accent)');

async function handleSend(e) {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    chatInput.value = '';

    const loadingElement = showLoading();

    try {
        updateStatusText('分析中...', 'var(--color-accent)');

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error?.message || '聊天服務發生錯誤，請稍後再試。');
        }

        const { reply, analysis, suggestions } = result.data;
        removeLoading(loadingElement);
        typeWriterEffect(reply, analysis);
        updateStatus(analysis);
        updateSentiment(analysis);
        updateBackground(analysis);
        updateRecommendations(analysis, suggestions);
    } catch (error) {
        removeLoading(loadingElement);
        appendMessage('ai', error.message || '發生未知錯誤，請稍後再試。');
        updateStatusText('發生錯誤', 'var(--color-danger-soft)');
    }
}

function appendMessage(sender, text, analysis = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-message--${sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'ai' ? 'AI' : '你';

    const content = document.createElement('div');
    content.className = 'message-content';

    const textP = document.createElement('p');
    textP.textContent = text;
    content.appendChild(textP);

    if (analysis && sender === 'ai') {
        content.appendChild(createSentimentBadge(analysis));
    }

    content.appendChild(createMessageMeta());
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function showLoading() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message chat-message--ai';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'AI';

    const content = document.createElement('div');
    content.className = 'message-content';

    const textP = document.createElement('p');
    textP.className = 'loading-dots';
    textP.textContent = '思考中';
    content.appendChild(textP);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();

    return messageDiv;
}

function removeLoading(loadingElement) {
    if (loadingElement?.parentNode) {
        loadingElement.parentNode.removeChild(loadingElement);
    }
}

function typeWriterEffect(text, analysis = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message chat-message--ai';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'AI';

    const content = document.createElement('div');
    content.className = 'message-content';

    const textP = document.createElement('p');
    content.appendChild(textP);

    if (analysis) {
        content.appendChild(createSentimentBadge(analysis));
    }

    content.appendChild(createMessageMeta());
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);

    let index = 0;
    const speed = 24;

    function type() {
        if (index < text.length) {
            textP.textContent += text.charAt(index);
            index += 1;
            scrollToBottom();
            setTimeout(type, speed);
        }
    }
    type();
}

function createSentimentBadge(analysis) {
    const badge = document.createElement('span');
    badge.className = 'sentiment-badge';
    badge.textContent = `情緒：${analysis.sentiment}`;
    return badge;
}

function createMessageMeta() {
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    const time = document.createElement('time');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString();
    meta.appendChild(time);
    return meta;
}

function updateStatus(analysis) {
    if (!analysis) {
        updateStatusText('待命中', 'var(--color-accent)');
        return;
    }

    const label = analysis.mode === 'negative' ? '情緒支持模式' : '食品安全模式';
    updateStatusText(
        `目前：${label}`,
        analysis.mode === 'negative' ? 'var(--color-danger-soft)' : 'var(--color-primary-soft)'
    );
}

function updateStatusText(text, background) {
    statusBadge.textContent = text;
    statusBadge.style.background = background;
}

function updateSentiment(analysis) {
    if (!analysis) return;
    sentimentBadge.textContent = analysis.sentiment;
    sentimentScore.textContent = `分數: ${Number(analysis.score).toFixed(2)}`;
}

function updateRecommendations(analysis, suggestions = []) {
    if (!analysis) return;

    const isSupportMode = analysis.mode === 'negative';
    const fallbackItems = isSupportMode
        ? ['先聊聊今天讓你不舒服的事情', '暫時不分析食物也沒關係', '等心情穩定後再看食品標示']
        : ['前往食品標示分析頁上傳圖片', '詢問糖、鈉與脂肪怎麼看', '了解食品添加物與保存方式'];

    renderList(keywordList, isSupportMode
        ? ['情緒支持', '壓力整理', '陪伴對話']
        : ['食品營養標示', '糖、鈉與脂肪', '食品添加物']
    );
    renderList(suggestionList, suggestions.length ? suggestions : fallbackItems);
}

function renderList(listElement, items) {
    listElement.innerHTML = '';
    items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        listElement.appendChild(li);
    });
}

function updateBackground(analysis) {
    if (analysis?.mode === 'negative') {
        document.body.style.background = 'var(--color-danger-soft)';
    } else if (Number(analysis?.score) > 0.85) {
        document.body.style.background = 'var(--color-primary-soft)';
    } else {
        document.body.style.background = 'var(--color-bg)';
    }
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
