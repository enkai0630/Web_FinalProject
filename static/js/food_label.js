const foodLabelForm = document.getElementById('food-label-form');
const foodLabelInput = document.getElementById('food-label-image');
const foodLabelPreview = document.getElementById('food-label-preview');
const foodLabelStatus = document.getElementById('food-label-status');
const foodLabelResult = document.getElementById('food-label-result');

foodLabelForm.addEventListener('submit', handleFoodLabelAnalyze);
foodLabelInput.addEventListener('change', handleFoodLabelPreview);

function handleFoodLabelPreview() {
    const file = foodLabelInput.files?.[0];
    foodLabelResult.hidden = true;
    foodLabelResult.innerHTML = '';
    foodLabelStatus.textContent = '';

    if (!file) {
        foodLabelPreview.hidden = true;
        foodLabelPreview.removeAttribute('src');
        return;
    }

    if (!file.type.startsWith('image/')) {
        foodLabelStatus.textContent = '請選擇圖片檔案。';
        foodLabelPreview.hidden = true;
        return;
    }

    foodLabelPreview.src = URL.createObjectURL(file);
    foodLabelPreview.hidden = false;
}

async function handleFoodLabelAnalyze(e) {
    e.preventDefault();
    const file = foodLabelInput.files?.[0];

    if (!file) {
        foodLabelStatus.textContent = '請先選擇一張食品成分表圖片。';
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    foodLabelStatus.textContent = '正在讀取圖片並分析營養標示...';
    foodLabelResult.hidden = true;
    foodLabelResult.innerHTML = '';

    try {
        const response = await fetch('/api/analyze-food-label', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error?.message || '食品標示分析失敗，請稍後再試。');
        }

        renderFoodLabelResult(result.data.analysis);
        foodLabelStatus.textContent = `已分析：${result.data.filename}`;
    } catch (error) {
        foodLabelStatus.textContent = error.message || '食品標示分析失敗，請稍後再試。';
    }
}

function renderFoodLabelResult(analysis) {
    const scoreText = analysis.score === null || analysis.score === undefined
        ? '無法評分'
        : `${Math.round(Number(analysis.score))} / 100`;

    foodLabelResult.innerHTML = '';
    foodLabelResult.appendChild(createResultHeader(analysis.grade, scoreText));
    foodLabelResult.appendChild(createResultParagraph(analysis.summary));
    foodLabelResult.appendChild(createResultList('判斷理由', analysis.reasons));
    foodLabelResult.appendChild(createResultList('注意風險', analysis.detected_risks));
    foodLabelResult.appendChild(createResultParagraph(analysis.advice, 'food-label-advice'));

    if (analysis.ocr_text) {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        const pre = document.createElement('pre');
        summary.textContent = '查看 OCR 文字';
        pre.textContent = analysis.ocr_text;
        details.appendChild(summary);
        details.appendChild(pre);
        foodLabelResult.appendChild(details);
    }

    foodLabelResult.hidden = false;
}

function createResultHeader(grade, scoreText) {
    const header = document.createElement('div');
    header.className = 'food-label-result-header';

    const gradeBadge = document.createElement('span');
    gradeBadge.className = `food-grade food-grade--${getGradeClass(grade)}`;
    gradeBadge.textContent = grade || '無法判斷';

    const score = document.createElement('span');
    score.className = 'food-score';
    score.textContent = scoreText;

    header.appendChild(gradeBadge);
    header.appendChild(score);
    return header;
}

function createResultParagraph(text, className = '') {
    const paragraph = document.createElement('p');
    paragraph.className = className;
    paragraph.textContent = text || '未提供說明。';
    return paragraph;
}

function createResultList(title, items = []) {
    const wrapper = document.createElement('div');
    const heading = document.createElement('strong');
    const list = document.createElement('ul');
    heading.textContent = title;
    wrapper.appendChild(heading);

    const safeItems = items.length ? items : ['沒有明顯資料。'];
    safeItems.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
    });

    wrapper.appendChild(list);
    return wrapper;
}

function getGradeClass(grade) {
    if (grade === '健康') return 'healthy';
    if (grade === '可以偶爾吃') return 'moderate';
    if (grade === '不健康') return 'unhealthy';
    return 'unknown';
}
