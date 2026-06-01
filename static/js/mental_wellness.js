const wellnessTopicGrid = document.getElementById('wellness-topic-grid');
const wellnessDetail = document.getElementById('wellness-detail');

const wellnessTopics = [
    {
        id: 'stress-first-aid',
        title: '壓力急救',
        iconId: 'icon-shield',
        category: '壓力太滿時',
        intensity: '立即可做',
        summary: '當腦袋很亂、心跳變快、一直想逃避時，先不要急著解決全部問題，而是把身體和注意力拉回現在。',
        signals: ['呼吸變淺', '肩頸緊繃', '一直滑手機逃避', '腦中重複想同一件事'],
        action: '做 3 回合慢呼吸：吸氣 4 秒、停 1 秒、吐氣 6 秒。吐氣比吸氣長，可以幫助身體從警戒狀態慢慢降下來。',
        practice: '每天固定找一個很短的時間練習，例如睡前或開始讀書前 2 分鐘。練習的重點不是立刻變開心，而是讓自己比較能回到可思考的狀態。',
        support: '如果壓力伴隨失眠、暴食或完全無法上課超過兩週，建議找學校諮商中心、導師或身心科討論。'
    },
    {
        id: 'sleep-reset',
        title: '睡眠重整',
        iconId: 'icon-heartbeat',
        category: '身體恢復',
        intensity: '需要連續練習',
        summary: '睡眠不是浪費時間。睡不好會讓情緒調節、記憶整理與專注力都變差，讀書效率也會下降。',
        signals: ['白天容易恍神', '越晚越清醒', '起床後仍然疲累', '咖啡越喝越多'],
        action: '今晚先做一件事：睡前 30 分鐘把手機放遠，改成洗澡、整理書包或聽固定的放鬆音樂，讓大腦建立「準備休息」的線索。',
        practice: '盡量固定起床時間，比強迫自己早睡更容易開始。白天短暫曬太陽、晚上降低螢幕刺激，也會幫助生理時鐘穩定。',
        support: '如果長期失眠、睡很多仍疲倦，或伴隨明顯焦慮與低落，建議尋求專業評估。'
    },
    {
        id: 'emotion-labeling',
        title: '情緒命名',
        iconId: 'icon-message',
        category: '理解自己',
        intensity: '五分鐘練習',
        summary: '把情緒說清楚，能降低「我整個人都不行了」的混亂感。情緒命名不是裝沒事，而是先讓問題變得可辨識。',
        signals: ['只說得出很煩', '容易對人不耐煩', '想哭但不知道原因', '對小事反應很大'],
        action: '用一句話填空：「我現在感到＿，因為＿，我需要＿。」例如：我現在感到焦慮，因為報告還沒做完，我需要先列三個小步驟。',
        practice: '可以把常見情緒分成焦慮、委屈、生氣、疲憊、失望、孤單。命名越精準，越容易找到真正需要的協助。',
        support: '如果情緒強度高到想傷害自己或他人，請立刻找可信任的人陪伴，並聯絡校安、諮商中心或當地緊急資源。'
    },
    {
        id: 'study-burnout',
        title: '讀書耗竭',
        iconId: 'icon-book',
        category: '學生常見壓力',
        intensity: '重新分配能量',
        summary: '耗竭不只是懶惰，而是長期高壓後，大腦開始用逃避來保護自己。這時需要降低啟動成本，而不是只罵自己。',
        signals: ['打開講義就想睡', '明明很多事卻動不了', '拖延後更自責', '覺得努力也沒用'],
        action: '把任務切到小到不能再小：不是「讀完一章」，而是「打開 PDF、看兩頁、寫三個關鍵字」。先恢復開始的能力。',
        practice: '用 25 分鐘專注加 5 分鐘休息，或 15 分鐘專注加 5 分鐘休息。狀態差時縮短專注區間，比硬撐更實際。',
        support: '如果你已經長期對所有事情失去興趣，或覺得自己沒有價值，這可能不只是讀書方法問題，建議找專業支持。'
    },
    {
        id: 'social-support',
        title: '支持系統',
        iconId: 'icon-leaf',
        category: '不要一個人扛',
        intensity: '建立連結',
        summary: '壓力大時，人容易覺得自己應該獨立處理。但適度求助不是能力差，而是資訊管理裡很重要的資源整合。',
        signals: ['不想回訊息', '覺得講了也沒用', '怕麻煩別人', '所有事都自己扛'],
        action: '先傳一則低負擔訊息：「我最近壓力有點大，可以找你講 10 分鐘嗎？」不用一次說完整故事。',
        practice: '把支持系統分層：同學適合討論作業，朋友適合陪伴情緒，老師或諮商師適合處理長期困擾。',
        support: '如果你身邊暫時沒有適合的人，可以優先使用學校諮商中心、導師、系辦或校安資源。'
    },
    {
        id: 'body-routine',
        title: '身體照顧',
        iconId: 'icon-scan',
        category: '基本盤',
        intensity: '低門檻',
        summary: '心理狀態常和身體狀態互相影響。吃飯、喝水、活動和休息不是大道理，而是讓大腦有能量處理問題的基礎。',
        signals: ['忘記吃飯', '整天坐著不動', '只靠咖啡撐', '頭痛或胃不舒服'],
        action: '先做一個最小身體照顧：喝水、吃一點有蛋白質的食物、走到戶外 5 分鐘，或伸展肩頸。',
        practice: '讀書或寫程式時，可以把休息設成流程的一部分。身體狀態回穩，才比較容易做出理性的判斷。',
        support: '若身體症狀明顯、反覆發作或影響日常生活，應諮詢醫師，不要只用壓力解釋所有症狀。'
    }
];

function wellnessIconMarkup(iconId) {
    return `<svg aria-hidden="true"><use href="#${iconId}"></use></svg>`;
}

function renderWellnessTopics() {
    wellnessTopicGrid.innerHTML = '';

    wellnessTopics.forEach((topic, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'topic-card wellness-topic-card';
        button.dataset.topicId = topic.id;
        button.innerHTML = `
            ${wellnessIconMarkup(topic.iconId)}
            <div>
                <h3>${topic.title}</h3>
                <p>${topic.summary}</p>
            </div>
            <span class="topic-risk wellness-tag">${topic.intensity}</span>
        `;
        button.addEventListener('click', () => renderWellnessDetail(topic, button));
        wellnessTopicGrid.appendChild(button);

        if (index === 0) {
            renderWellnessDetail(topic, button);
        }
    });
}

function renderWellnessDetail(topic, selectedButton) {
    document.querySelectorAll('.wellness-topic-card').forEach((button) => {
        button.classList.toggle('is-selected', button === selectedButton);
    });

    wellnessDetail.classList.remove('is-revealed');
    wellnessDetail.innerHTML = `
        <article class="detail-card wellness-detail-card detail-card-animated">
            <div class="detail-card-header">
                <span class="detail-icon">${wellnessIconMarkup(topic.iconId)}</span>
                <div>
                    <p class="detail-category">${topic.category}</p>
                    <h2>${topic.title}</h2>
                </div>
            </div>
            <span class="detail-risk wellness-detail-tag">${topic.intensity}</span>
            <p class="detail-summary">${topic.summary}</p>
            ${createWellnessList('你可能會出現的訊號', topic.signals)}
            <section class="detail-section detail-reminder wellness-action">
                <h3>現在可以先做什麼</h3>
                <p>${topic.action}</p>
            </section>
            <section class="detail-section">
                <h3>平常可以怎麼練習</h3>
                <p>${topic.practice}</p>
            </section>
            <section class="detail-section wellness-support">
                <h3>什麼時候要找人協助</h3>
                <p>${topic.support}</p>
            </section>
        </article>
    `;
    requestAnimationFrame(() => wellnessDetail.classList.add('is-revealed'));
}

function createWellnessList(title, items) {
    const listItems = items.map((item) => `<li>${item}</li>`).join('');
    return `
        <section class="detail-section">
            <h3>${title}</h3>
            <ul>${listItems}</ul>
        </section>
    `;
}

renderWellnessTopics();
