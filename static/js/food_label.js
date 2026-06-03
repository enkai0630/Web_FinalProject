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
    analyzeButtonText.textContent = isAnalyzing ? '整理中...' : '開始分析健康程度';
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
    title.textContent = '正在整理食品標示';

    const detail = document.createElement('p');
    detail.textContent = `目前處理：${filename}。會先讀取圖片文字，再判斷熱量、糖、鈉、脂肪與成分風險。`;

    const progress = document.createElement('div');
    progress.className = 'quiet-progress';
    progress.setAttribute('aria-hidden', 'true');

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
    content.appendChild(progress);
    content.appendChild(steps);
    loading.appendChild(spinner);
    loading.appendChild(content);
    foodLabelResult.appendChild(loading);
    startLoadingStepProgress(steps);
}

function renderFoodLabelResult(analysis) {
    clearLoadingStepTimer();
    const normalizedAnalysis = normalizeFoodAnalysis(analysis);

    foodLabelResult.innerHTML = '';
    foodLabelResult.appendChild(createReportHeader(normalizedAnalysis));
    foodLabelResult.appendChild(createReportMetrics(normalizedAnalysis));
    foodLabelResult.appendChild(createNutritionRadar(normalizedAnalysis));
    foodLabelResult.appendChild(createReportSections(normalizedAnalysis));
    foodLabelResult.appendChild(createAdvicePanel(normalizedAnalysis.advice));

    if (normalizedAnalysis.ocrText) {
        foodLabelResult.appendChild(createOcrDetails(normalizedAnalysis.ocrText));
    }

    foodLabelResult.hidden = false;
    foodLabelResult.classList.remove('is-revealed');
    requestAnimationFrame(() => foodLabelResult.classList.add('is-revealed'));
}

function normalizeFoodAnalysis(analysis = {}) {
    const hasScore = analysis.score !== null && analysis.score !== undefined && !Number.isNaN(Number(analysis.score));
    const score = hasScore ? Math.round(Number(analysis.score)) : null;
    const risks = safeTextList(analysis.detected_risks);

    return {
        grade: analysis.grade || '無法判斷',
        score,
        scoreText: score === null ? '無法評分' : `${score} / 100`,
        summary: analysis.summary || '這份標示的資訊不足，建議搭配 OCR 文字與實際成分再判斷。',
        reasons: safeTextList(analysis.reasons),
        risks,
        advice: analysis.advice || '建議搭配份量、頻率與個人健康狀況一起判斷。',
        ocrText: analysis.ocr_text || '',
        attentionLevel: getAttentionLevel(analysis.grade, score, risks)
    };
}

function safeTextList(items) {
    return Array.isArray(items)
        ? items.map((item) => String(item).trim()).filter(Boolean)
        : [];
}

function getAttentionLevel(grade, score, risks = []) {
    if (grade === '不健康' || Number(score) < 55 || risks.length >= 3) {
        return {
            label: '高注意',
            description: '建議降低頻率，並留意同一天其他高糖、高鈉或高油食品。',
            className: 'high'
        };
    }

    if (grade === '可以偶爾吃' || Number(score) < 75 || risks.length > 0) {
        return {
            label: '中度注意',
            description: '可以偶爾食用，但份量與頻率會影響整體負擔。',
            className: 'medium'
        };
    }

    if (grade === '健康') {
        return {
            label: '低注意',
            description: '目前沒有明顯高風險訊號，仍建議搭配均衡飲食。',
            className: 'low'
        };
    }

    return {
        label: '資訊不足',
        description: '標示內容可能不完整，建議重新拍攝或補充營養數字。',
        className: 'unknown'
    };
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

function createReportHeader(analysis) {
    const wrapper = document.createElement('section');
    wrapper.className = `food-report food-report--${getGradeClass(analysis.grade)}`;

    const header = document.createElement('div');
    header.className = 'food-label-result-header';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'food-report-title';

    const label = document.createElement('span');
    label.className = 'report-kicker';
    label.textContent = 'Analysis Report';

    const title = document.createElement('h3');
    title.textContent = '食品標示分析報告';

    const summary = document.createElement('p');
    summary.textContent = analysis.summary;

    titleGroup.appendChild(label);
    titleGroup.appendChild(title);
    titleGroup.appendChild(summary);

    const gradePanel = document.createElement('div');
    gradePanel.className = 'food-grade-panel';

    const gradeBadge = document.createElement('span');
    gradeBadge.className = `food-grade food-grade--${getGradeClass(analysis.grade)}`;
    gradeBadge.textContent = analysis.grade;

    const score = document.createElement('span');
    score.className = 'food-score';
    score.textContent = analysis.scoreText;

    gradePanel.appendChild(gradeBadge);
    gradePanel.appendChild(score);

    header.appendChild(titleGroup);
    header.appendChild(gradePanel);
    wrapper.appendChild(header);
    return wrapper;
}

function createReportMetrics(analysis) {
    const metrics = document.createElement('div');
    metrics.className = 'food-report-metrics';

    metrics.appendChild(createMetricCard('總分', analysis.scoreText, getScoreDescription(analysis.score)));
    metrics.appendChild(createMetricCard('注意等級', analysis.attentionLevel.label, analysis.attentionLevel.description, analysis.attentionLevel.className));
    metrics.appendChild(createMetricCard('風險項目', `${analysis.risks.length} 項`, analysis.risks.length ? '已偵測到需要留意的標示內容。' : '目前沒有明顯高風險項目。'));

    return metrics;
}

function createNutritionRadar(analysis) {
    const section = document.createElement('section');
    section.className = 'food-radar-panel';

    const copy = document.createElement('div');
    copy.className = 'food-radar-copy';

    const kicker = document.createElement('span');
    kicker.textContent = 'Label Balance';

    const heading = document.createElement('h4');
    heading.textContent = '標示雷達';

    const note = document.createElement('p');
    note.textContent = '用五個面向快速看這份食品標示的整體輪廓，分數越靠外代表該面向越穩定。';

    copy.appendChild(kicker);
    copy.appendChild(heading);
    copy.appendChild(note);
    section.appendChild(copy);
    section.appendChild(buildRadarChart(getRadarMetrics(analysis)));

    return section;
}

function getRadarMetrics(analysis) {
    const baseScore = analysis.score ?? 58;
    const riskText = analysis.risks.join(' ');

    const metrics = [
        { label: '營養平衡', value: baseScore },
        { label: '低糖', value: baseScore - riskPenalty(riskText, ['糖', '含糖', '甜']) },
        { label: '低鈉', value: baseScore - riskPenalty(riskText, ['鈉', '鹽']) },
        { label: '低油脂', value: baseScore - riskPenalty(riskText, ['脂肪', '飽和脂肪', '反式脂肪', '油']) },
        { label: '成分單純', value: baseScore - riskPenalty(riskText, ['添加物', '防腐', '色素', '香料', '成分']) }
    ];

    return metrics.map((metric) => ({
        ...metric,
        value: Math.max(18, Math.min(96, Math.round(metric.value)))
    }));
}

function riskPenalty(text, keywords) {
    return keywords.some((keyword) => text.includes(keyword)) ? 26 : 4;
}

function buildRadarChart(metrics) {
    const wrapper = document.createElement('div');
    wrapper.className = 'food-radar-chart';

    const size = 260;
    const center = size / 2;
    const radius = 82;
    const axisCount = metrics.length;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `食品標示雷達圖：${metrics.map((item) => `${item.label}${item.value}分`).join('，')}`);

    [0.35, 0.7, 1].forEach((scale) => {
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        ring.setAttribute('points', getRadarPoints(metrics.map(() => scale * 100), center, radius));
        ring.setAttribute('class', 'radar-ring');
        svg.appendChild(ring);
    });

    metrics.forEach((metric, index) => {
        const axisPoint = getRadarPoint(index, axisCount, 100, center, radius);
        const axis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        axis.setAttribute('x1', String(center));
        axis.setAttribute('y1', String(center));
        axis.setAttribute('x2', String(axisPoint.x));
        axis.setAttribute('y2', String(axisPoint.y));
        axis.setAttribute('class', 'radar-axis');
        svg.appendChild(axis);

        const labelPoint = getRadarPoint(index, axisCount, 122, center, radius);
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', String(labelPoint.x));
        label.setAttribute('y', String(labelPoint.y));
        label.setAttribute('class', 'radar-label');
        label.setAttribute('text-anchor', labelPoint.x < center - 8 ? 'end' : labelPoint.x > center + 8 ? 'start' : 'middle');
        label.textContent = metric.label;
        svg.appendChild(label);
    });

    const area = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    area.setAttribute('points', getRadarPoints(metrics.map((metric) => metric.value), center, radius));
    area.setAttribute('class', 'radar-area');
    svg.appendChild(area);

    metrics.forEach((metric, index) => {
        const point = getRadarPoint(index, axisCount, metric.value, center, radius);
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', String(point.x));
        dot.setAttribute('cy', String(point.y));
        dot.setAttribute('r', '4');
        dot.setAttribute('class', 'radar-dot');
        svg.appendChild(dot);
    });

    const list = document.createElement('dl');
    list.className = 'food-radar-list';
    metrics.forEach((metric) => {
        const group = document.createElement('div');
        const term = document.createElement('dt');
        const description = document.createElement('dd');
        term.textContent = metric.label;
        description.textContent = `${metric.value} 分`;
        group.appendChild(term);
        group.appendChild(description);
        list.appendChild(group);
    });

    wrapper.appendChild(svg);
    wrapper.appendChild(list);
    return wrapper;
}

function getRadarPoints(values, center, radius) {
    return values
        .map((value, index) => {
            const point = getRadarPoint(index, values.length, value, center, radius);
            return `${point.x},${point.y}`;
        })
        .join(' ');
}

function getRadarPoint(index, total, value, center, radius) {
    const angle = (Math.PI * 2 * index / total) - Math.PI / 2;
    const scaledRadius = radius * (value / 100);
    return {
        x: Number((center + Math.cos(angle) * scaledRadius).toFixed(2)),
        y: Number((center + Math.sin(angle) * scaledRadius).toFixed(2))
    };
}

function createMetricCard(label, value, detail, tone = '') {
    const card = document.createElement('article');
    card.className = `food-report-metric ${tone ? `food-report-metric--${tone}` : ''}`;

    const labelElement = document.createElement('span');
    labelElement.textContent = label;

    const valueElement = document.createElement('strong');
    valueElement.textContent = value;

    const detailElement = document.createElement('p');
    detailElement.textContent = detail;

    card.appendChild(labelElement);
    card.appendChild(valueElement);
    card.appendChild(detailElement);
    return card;
}

function getScoreDescription(score) {
    if (score === null) return 'OCR 或標示資訊不足，因此沒有產生數字分數。';
    if (score >= 75) return '分數偏高，代表目前標示沒有明顯集中風險。';
    if (score >= 55) return '分數中等，適合偶爾食用並控制份量。';
    return '分數偏低，建議降低頻率或尋找替代品。';
}

function createReportSections(analysis) {
    const grid = document.createElement('div');
    grid.className = 'food-report-grid';

    grid.appendChild(createResultList('判斷理由', analysis.reasons, 'reason'));
    grid.appendChild(createResultList('注意風險', analysis.risks, 'risk'));
    return grid;
}

function createResultList(title, items = [], type = '') {
    const wrapper = document.createElement('div');
    wrapper.className = `food-report-section ${type ? `food-report-section--${type}` : ''}`;

    const heading = document.createElement('strong');
    const list = document.createElement('ul');
    heading.textContent = title;
    wrapper.appendChild(heading);

    const fallbackText = type === 'risk' ? '目前沒有明顯高風險項目。' : '目前沒有足夠資料產生明確理由。';
    const safeItems = items.length ? items : [fallbackText];
    safeItems.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
    });

    wrapper.appendChild(list);
    return wrapper;
}

function createAdvicePanel(advice) {
    const panel = document.createElement('section');
    panel.className = 'food-label-advice';

    const heading = document.createElement('strong');
    heading.textContent = '日常食用建議';

    const paragraph = document.createElement('p');
    paragraph.textContent = advice;

    panel.appendChild(heading);
    panel.appendChild(paragraph);
    return panel;
}

function createOcrDetails(ocrText) {
    const details = document.createElement('details');
    details.className = 'food-report-ocr';

    const summary = document.createElement('summary');
    const pre = document.createElement('pre');
    summary.textContent = '查看 OCR 辨識文字';
    pre.textContent = ocrText;
    details.appendChild(summary);
    details.appendChild(pre);
    return details;
}

function getGradeClass(grade) {
    if (grade === '健康') return 'healthy';
    if (grade === '可以偶爾吃') return 'moderate';
    if (grade === '不健康') return 'unhealthy';
    return 'unknown';
}
