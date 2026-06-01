const foodLabelForm = document.getElementById('food-label-form');
const foodLabelInput = document.getElementById('food-label-image');
const foodLabelPreview = document.getElementById('food-label-preview');
const foodLabelStatus = document.getElementById('food-label-status');
const foodLabelResult = document.getElementById('food-label-result');
const analyzeButton = foodLabelForm.querySelector('.analyze-button');
const analyzeButtonText = analyzeButton.querySelector('span');
let loadingStepTimer = null;

foodLabelForm.addEventListener('submit', handleFoodLabelAnalyze);
foodLabelInput.addEventListener('change', handleFoodLabelPreview);

function handleFoodLabelPreview() {
    const file = foodLabelInput.files?.[0];
    foodLabelResult.hidden = true;
    foodLabelResult.innerHTML = '';
    foodLabelStatus.textContent = '';
    clearLoadingStepTimer();

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

    setAnalyzing(true);
    showFoodAnalysisLoading(file.name);

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
        clearLoadingStepTimer();
        foodLabelStatus.textContent = error.message || '食品標示分析失敗，請稍後再試。';
        foodLabelResult.hidden = true;
        foodLabelResult.innerHTML = '';
    } finally {
        clearLoadingStepTimer();
        setAnalyzing(false);
    }
}

function setAnalyzing(isAnalyzing) {
    foodLabelInput.disabled = isAnalyzing;
    analyzeButton.disabled = isAnalyzing;
    analyzeButtonText.textContent = isAnalyzing ? '分析中...' : '開始分析健康程度';
}

function showFoodAnalysisLoading(filename) {
    clearLoadingStepTimer();
    foodLabelStatus.textContent = '正在處理圖片，請稍候。';
    foodLabelResult.hidden = false;
    foodLabelResult.innerHTML = '';

    const loading = document.createElement('div');
    loading.className = 'food-analysis-loading';

    const spinner = document.createElement('div');
    spinner.className = 'food-analysis-spinner';
    spinner.setAttribute('aria-hidden', 'true');

    const content = document.createElement('div');
    const title = document.createElement('strong');
    title.className = 'loading-dots';
    title.textContent = 'AI 正在分析食品標示';

    const detail = document.createElement('p');
    detail.textContent = `目前處理：${filename}。系統會先讀取圖片文字，再判斷熱量、糖、鈉、脂肪與成分風險。`;

    const steps = document.createElement('ul');
    ['讀取圖片', '辨識 OCR 文字', '分析營養標示', '產生健康分級與理由'].forEach((step, index) => {
        const item = document.createElement('li');
        item.textContent = step;
        item.dataset.step = String(index);
        if (index === 0) {
            item.className = 'is-current';
        }
        steps.appendChild(item);
    });

    content.appendChild(title);
    content.appendChild(detail);
    content.appendChild(steps);
    loading.appendChild(spinner);
    loading.appendChild(content);
    foodLabelResult.appendChild(loading);
    startLoadingStepProgress(steps);
}

function renderFoodLabelResult(analysis) {
    clearLoadingStepTimer();
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
    foodLabelResult.classList.remove('is-revealed');
    requestAnimationFrame(() => foodLabelResult.classList.add('is-revealed'));
}

function startLoadingStepProgress(steps) {
    const items = Array.from(steps.querySelectorAll('li'));
    let currentStep = 0;

    loadingStepTimer = window.setInterval(() => {
        items[currentStep]?.classList.remove('is-current');
        items[currentStep]?.classList.add('is-done');
        currentStep = Math.min(currentStep + 1, items.length - 1);
        items[currentStep]?.classList.add('is-current');

        if (currentStep === items.length - 1) {
            clearLoadingStepTimer();
        }
    }, 900);
}

function clearLoadingStepTimer() {
    if (loadingStepTimer !== null) {
        window.clearInterval(loadingStepTimer);
        loadingStepTimer = null;
    }
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
