const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const statusBadge = document.querySelector('.status-badge');
const sentimentBadge = document.querySelector('.sentiment-badge');
const sentimentScore = document.querySelector('.sentiment-score');
const keywordList = document.querySelector('.keyword-list');
const suggestionList = document.querySelector('.suggestion-list');
const promptCards = document.querySelectorAll('.prompt-card[data-prompt]');
const chatToolSection = document.getElementById('chat-tool');
const chatWorkspace = document.querySelector('.chat-workspace');

chatForm.addEventListener('submit', handleSend);
promptCards.forEach((card) => {
    card.addEventListener('click', () => {
        chatInput.value = card.dataset.prompt || '';
        promptCards.forEach((item) => item.classList.toggle('is-selected', item === card));
        chatToolSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        chatWorkspace?.classList.remove('is-highlighted');
        window.setTimeout(() => chatWorkspace?.classList.add('is-highlighted'), 120);
        window.setTimeout(() => chatWorkspace?.classList.remove('is-highlighted'), 1300);
        chatInput.focus();
    });
});
updateStatusText('待命中', 'var(--accent)');

async function handleSend(e) {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    chatInput.value = '';

    const loadingElement = showLoading();

    try {
        updateStatusText('整理中...', 'var(--accent)');

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
        typeWriterEffect(reply, analysis, suggestions);
        updateStatus(analysis);
        updateSentiment(analysis);
        updateBackground(analysis);
        updateRecommendations(analysis, suggestions);
    } catch (error) {
        removeLoading(loadingElement);
        appendMessage('ai', error.message || '發生未知錯誤，請稍後再試。');
        updateStatusText('發生錯誤', 'var(--danger-soft)');
    }
}

function appendMessage(sender, text, analysis = null, suggestions = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-message--${sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'ai' ? 'NOTE' : 'YOU';

    const content = document.createElement('div');
    content.className = 'message-content';

    const textP = document.createElement('p');
    textP.textContent = text;
    content.appendChild(textP);

    if (analysis && sender === 'ai') {
        content.appendChild(createSentimentBadge(analysis));
        content.appendChild(createConsultationSummary(analysis, suggestions));
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
    avatar.textContent = 'NOTE';

    const content = document.createElement('div');
    content.className = 'message-content';

    const textP = document.createElement('p');
    textP.className = 'loading-dots';
    textP.textContent = '正在整理';
    content.appendChild(textP);

    const pulse = document.createElement('div');
    pulse.className = 'thinking-pulse';
    pulse.setAttribute('aria-hidden', 'true');
    ['一', '二', '三'].forEach((label) => {
        const dot = document.createElement('span');
        dot.textContent = label;
        pulse.appendChild(dot);
    });
    content.appendChild(pulse);

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

function typeWriterEffect(text, analysis = null, suggestions = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message chat-message--ai';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'NOTE';

    const content = document.createElement('div');
    content.className = 'message-content';

    const kicker = document.createElement('span');
    kicker.className = 'message-kicker';
    kicker.textContent = 'Consultation Result';
    content.appendChild(kicker);

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
        } else if (analysis) {
            content.appendChild(createConsultationSummary(analysis, suggestions));
            scrollToBottom();
        }
    }
    type();
}

function createSentimentBadge(analysis) {
    const badge = document.createElement('span');
    badge.className = 'sentiment-badge';
    badge.textContent = `狀態：${analysis.sentiment}`;
    return badge;
}

function createConsultationSummary(analysis, suggestions = []) {
    const isSupportMode = analysis.mode === 'negative';
    const summary = document.createElement('div');
    summary.className = 'consult-summary';

    const nextStep = suggestions[0] || (isSupportMode
        ? '先把今天最困擾的一件事寫下來，暫時不用急著做飲食判斷。'
        : '如果有食品標示圖片，可以到標示分析頁取得更完整的判讀。');

    const cards = [
        {
            title: '重點',
            text: isSupportMode ? '目前比較適合先整理身心狀態。' : '目前比較適合從食品安全與標示判讀切入。'
        },
        {
            title: '提醒',
            text: isSupportMode ? '壓力下的食物選擇不需要一次做到完美。' : '營養數字要搭配份量與食用頻率一起看。'
        },
        {
            title: '下一步',
            text: nextStep
        }
    ];

    cards.forEach((item) => {
        const card = document.createElement('article');
        const title = document.createElement('strong');
        const text = document.createElement('span');
        title.textContent = item.title;
        text.textContent = item.text;
        card.appendChild(title);
        card.appendChild(text);
        summary.appendChild(card);
    });

    return summary;
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
        updateStatusText('待命中', 'var(--accent)');
        return;
    }

    const label = analysis.mode === 'negative' ? '情緒整理' : '食安整理';
    updateStatusText(
        `目前：${label}`,
        analysis.mode === 'negative' ? 'var(--danger-soft)' : 'var(--primary-soft)'
    );
}

function updateStatusText(text, background) {
    if (!statusBadge) return;
    statusBadge.textContent = text;
    statusBadge.style.background = background;
}

function updateSentiment(analysis) {
    if (!analysis) return;
    if (!sentimentBadge || !sentimentScore) return;
    sentimentBadge.textContent = analysis.sentiment;
    sentimentScore.textContent = `分數: ${Number(analysis.score).toFixed(2)}`;
}

function updateRecommendations(analysis, suggestions = []) {
    if (!analysis) return;

    const isSupportMode = analysis.mode === 'negative';
    const fallbackItems = isSupportMode
        ? ['先聊聊今天讓你不舒服的事情', '暫時不分析食物也沒關係', '等心情穩定後再看食品標示']
        : ['前往食品標示分析頁上傳圖片', '詢問糖、鈉與脂肪怎麼看', '了解食品添加物與保存方式'];

    if (keywordList) {
        renderList(keywordList, isSupportMode
            ? ['情緒支持', '壓力整理', '陪伴對話']
            : ['食品營養標示', '糖、鈉與脂肪', '食品添加物']
        );
    }

    if (suggestionList) {
        renderList(suggestionList, suggestions.length ? suggestions : fallbackItems);
    }
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
        document.body.style.background = 'var(--danger-soft)';
    } else if (Number(analysis?.score) > 0.85) {
        document.body.style.background = 'var(--primary-soft)';
    } else {
        document.body.style.background = 'var(--bg)';
    }
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
