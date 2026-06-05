(function () {
    const form = document.getElementById("mood-scale-form");
    if (!form) return;

    const list = document.getElementById("mood-question-list");
    const resultEl = document.getElementById("mood-result");

    const SCALE = [
        { label: "完全沒有", value: 0 },
        { label: "輕微", value: 1 },
        { label: "中等", value: 2 },
        { label: "厲害", value: 3 },
        { label: "非常厲害", value: 4 },
    ];

    const QUESTIONS = [
        { id: "q1", text: "睡眠困難，譬如難以入睡、易醒或早醒", scored: true },
        { id: "q2", text: "感覺緊張不安", scored: true },
        { id: "q3", text: "覺得容易苦惱或動怒", scored: true },
        { id: "q4", text: "感覺憂鬱、心情低落", scored: true },
        { id: "q5", text: "覺得比不上別人", scored: true },
        { id: "star", text: "有自殺的想法", scored: false, star: true },
    ];

    QUESTIONS.forEach(function (q, idx) {
        const li = document.createElement("li");
        li.className = "mood-question" + (q.star ? " mood-question--star" : "");

        const head = document.createElement("p");
        head.className = "mood-question-text";
        const no = document.createElement("span");
        no.className = "mood-no" + (q.star ? " mood-no--star" : "");
        no.textContent = q.star ? "★" : String(idx + 1);
        head.appendChild(no);
        head.appendChild(document.createTextNode(q.text));
        li.appendChild(head);

        const opts = document.createElement("div");
        opts.className = "mood-options";
        opts.setAttribute("role", "radiogroup");
        opts.setAttribute("aria-label", q.text);

        SCALE.forEach(function (s) {
            const lab = document.createElement("label");
            lab.className = "mood-option";

            const input = document.createElement("input");
            input.type = "radio";
            input.name = q.id;
            input.value = String(s.value);
            input.required = true;

            const chip = document.createElement("span");
            chip.className = "mood-chip";
            chip.textContent = String(s.value);

            const cap = document.createElement("small");
            cap.textContent = s.label;

            lab.appendChild(input);
            lab.appendChild(chip);
            lab.appendChild(cap);
            opts.appendChild(lab);
        });

        li.appendChild(opts);
        list.appendChild(li);
    });

    function interpret(total) {
        if (total <= 5) {
            return { level: "一般正常範圍", tone: "ok", advice: "情緒狀態大致平穩，保持規律作息與適度休息就好。" };
        }
        if (total <= 9) {
            return { level: "輕度情緒困擾", tone: "mild", advice: "建議找親友談談、抒發情緒，給自己一點緩衝。" };
        }
        if (total <= 14) {
            return { level: "中度情緒困擾", tone: "mid", advice: "建議尋求心理衛生或精神醫療專業諮詢。" };
        }
        return { level: "重度情緒困擾", tone: "high", advice: "建議尋求精神醫療專業諮詢，不需要獨自承受。" };
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const data = new FormData(form);

        let total = 0;
        QUESTIONS.forEach(function (q) {
            if (q.scored) total += Number(data.get(q.id) || 0);
        });
        const star = Number(data.get("star") || 0);
        const res = interpret(total);

        resultEl.innerHTML = "";

        const card = document.createElement("div");
        card.className = "mood-result-card mood-result-card--" + res.tone;

        const score = document.createElement("div");
        score.className = "mood-result-score";
        score.innerHTML = "<span>前 5 題總分</span><strong>" + total + "</strong><small>／ 20</small>";

        const body = document.createElement("div");
        body.className = "mood-result-body";
        const level = document.createElement("span");
        level.className = "mood-result-level";
        level.textContent = res.level;
        const advice = document.createElement("p");
        advice.textContent = res.advice;
        body.appendChild(level);
        body.appendChild(advice);

        card.appendChild(score);
        card.appendChild(body);
        resultEl.appendChild(card);

        if (star >= 2) {
            const alert = document.createElement("div");
            alert.className = "mood-alert";
            alert.innerHTML =
                '<svg><use href="#icon-alert-triangle"></use></svg>' +
                "<div><strong>你在「有自殺的想法」這題評為 " + star + " 分</strong>" +
                "<p>這是重要的訊號，請盡快尋求專業協助。24 小時安心專線 1925、生命線 1995；緊急狀況請撥 110 / 119。</p></div>";
            resultEl.appendChild(alert);
        }

        resultEl.hidden = false;
        resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    form.addEventListener("reset", function () {
        resultEl.hidden = true;
        resultEl.innerHTML = "";
    });
})();
