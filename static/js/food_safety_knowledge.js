const bubbleStage = document.getElementById('bubble-stage');
const knowledgeDetail = document.getElementById('knowledge-detail');

const knowledgeTopics = [
    {
        id: 'sudan-red',
        title: '蘇丹紅',
        icon: '辣',
        category: '非法工業染料',
        riskLevel: '高',
        summary: '蘇丹紅是工業染料，不是合法食品添加物。近年台灣辣椒粉、咖哩粉與調味粉供應鏈曾出現相關事件。',
        possibleFoods: ['辣椒粉', '咖哩粉', '調味粉', '辣味加工食品', '部分醬料'],
        harm: '不應進入食品。長期或大量暴露可能增加健康疑慮，重點風險在於非法添加與供應鏈管理失靈。',
        reminder: '購買顏色鮮紅的粉末類調味品時，優先選擇來源清楚、標示完整、有檢驗紀錄的產品。',
        sourceName: 'Taiwan News: Sudan Red chili powder case',
        sourceUrl: 'https://www.taiwannews.com.tw/en/news/5106832',
        tone: 'red'
    },
    {
        id: 'bongkrekic-acid',
        title: '米酵菌酸',
        icon: '酸',
        category: '細菌毒素',
        riskLevel: '極高',
        summary: '米酵菌酸與受污染的澱粉類、發酵或濕熱保存食品有關。2024 年台灣寶林茶室事件讓大眾注意到這類罕見但嚴重的食物中毒。',
        possibleFoods: ['粿條', '河粉', '米製品', '濕熱保存的澱粉類食品', '保存不當的發酵食品'],
        harm: '可能造成嚴重中毒，影響肝臟、腎臟與神經系統，嚴重時可能危及生命。',
        reminder: '熟食與米製品不要長時間放在室溫；外食時留意店家環境、保存方式與食材周轉。',
        sourceName: 'Taipei Times: Bongkrekic acid suspected poison source',
        sourceUrl: 'https://www.taipeitimes.com/News/front/archives/2024/03/29/2003815630',
        tone: 'orange'
    },
    {
        id: 'melamine',
        title: '三聚氰胺',
        icon: '奶',
        category: '非法摻偽物',
        riskLevel: '高',
        summary: '三聚氰胺曾被非法用來偽裝蛋白質含量，最有名的是奶粉與乳製品相關食安事件。',
        possibleFoods: ['奶粉', '乳製品', '蛋白粉', '含奶加工食品'],
        harm: '可能傷害腎臟與泌尿系統，嬰幼兒與兒童對相關風險更敏感。',
        reminder: '嬰幼兒食品要選擇可信品牌與正式通路，避免購買來源不明或標示不完整的奶粉。',
        sourceName: 'WHO: Melamine-contamination event background',
        sourceUrl: 'https://www.who.int/emergencies/situations/melamine-contamination-event',
        tone: 'blue'
    },
    {
        id: 'listeria',
        title: '李斯特菌',
        icon: '菌',
        category: '食品中毒細菌',
        riskLevel: '中高',
        summary: '李斯特菌可在低溫環境存活，常和即食食品、冷藏熟食、沙拉或熟食加工環境有關。',
        possibleFoods: ['即食餐盒', '熟食沙拉', '冷藏肉品', '未充分殺菌乳製品', '預製義大利麵餐'],
        harm: '一般人可能出現腸胃不適；孕婦、長者、免疫力較弱者可能有更嚴重感染風險。',
        reminder: '冷藏不是萬能保護。即食食品要注意保存期限、冷藏溫度與加熱方式。',
        sourceName: 'FDA: Listeria outbreak in ready-to-eat foods',
        sourceUrl: 'https://www.fda.gov/food/outbreaks-foodborne-illness/outbreak-investigation-listeria-monocytogenes-ready-eat-foods-may-2025',
        tone: 'green'
    },
    {
        id: 'hydrogen-peroxide',
        title: '工業級雙氧水',
        icon: '漂',
        category: '違法加工化學品',
        riskLevel: '高',
        summary: '食品加工可以使用合法規格與限量的加工助劑，但工業級化學品不能拿來處理食品。台灣曾有豬腸檢出工業級過氧化氫的召回事件。',
        possibleFoods: ['豬腸', '水產加工品', '漂白外觀的加工食材', '來源不明的散裝食品'],
        harm: '若使用不當或殘留過量，可能刺激消化道，也代表加工來源與衛生管理有問題。',
        reminder: '看到異常潔白、來源不明或價格明顯偏低的加工食材，要提高警覺。',
        sourceName: 'Taiwan News: Pork intestines recall',
        sourceUrl: 'https://www.taiwannews.com.tw/en/news/6213949',
        tone: 'purple'
    },
    {
        id: 'lead',
        title: '鉛污染',
        icon: '鉛',
        category: '重金屬污染',
        riskLevel: '高',
        summary: '鉛不應出現在食品中。2025 年中國幼兒園鉛中毒事件提醒我們，漂亮顏色或不明粉末可能隱藏嚴重風險。',
        possibleFoods: ['來路不明的彩色點心', '使用非法色素的食品', '受污染的水或農產品', '來源不明的兒童食品'],
        harm: '鉛會影響神經系統與發育，兒童、孕婦是高風險族群。',
        reminder: '兒童食品不要只看顏色與造型，應重視來源、標示與是否由合格業者製作。',
        sourceName: 'AP News: China kindergarten lead poisoning',
        sourceUrl: 'https://apnews.com/article/26e13879806d4abe44c7dae892c191c0',
        tone: 'yellow'
    }
];

function renderBubbles() {
    bubbleStage.innerHTML = '';

    knowledgeTopics.forEach((topic, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `knowledge-bubble knowledge-bubble--${topic.tone}`;
        button.style.setProperty('--bubble-delay', `${index * -1.4}s`);
        button.style.setProperty('--bubble-x', `${(index % 3) * 9 - 8}px`);
        button.innerHTML = `
            <span class="bubble-icon">${topic.icon}</span>
            <span class="bubble-title">${topic.title}</span>
            <span class="bubble-risk">風險 ${topic.riskLevel}</span>
        `;
        button.addEventListener('click', () => renderDetail(topic, button));
        bubbleStage.appendChild(button);
    });
}

function renderDetail(topic, selectedButton) {
    document.querySelectorAll('.knowledge-bubble').forEach((button) => {
        button.classList.toggle('is-selected', button === selectedButton);
    });

    knowledgeDetail.innerHTML = `
        <article class="detail-card">
            <div class="detail-card-header">
                <span class="detail-icon detail-icon--${topic.tone}">${topic.icon}</span>
                <div>
                    <p class="detail-category">${topic.category}</p>
                    <h2>${topic.title}</h2>
                </div>
                <span class="detail-risk">風險 ${topic.riskLevel}</span>
            </div>
            <p class="detail-summary">${topic.summary}</p>
            ${createDetailList('可能藏在哪些食物', topic.possibleFoods)}
            <section class="detail-section">
                <h3>對人體可能造成的影響</h3>
                <p>${topic.harm}</p>
            </section>
            <section class="detail-section detail-reminder">
                <h3>日常提醒</h3>
                <p>${topic.reminder}</p>
            </section>
            <a class="detail-source" href="${topic.sourceUrl}" target="_blank" rel="noopener noreferrer">
                查看來源：${topic.sourceName}
            </a>
        </article>
    `;
}

function createDetailList(title, items) {
    const listItems = items.map((item) => `<li>${item}</li>`).join('');
    return `
        <section class="detail-section">
            <h3>${title}</h3>
            <ul>${listItems}</ul>
        </section>
    `;
}

renderBubbles();
