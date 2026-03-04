/* AI Health Risk Detector — App Logic */
(function () {
    'use strict';

    /* ---- Symptom Data ---- */
    const SYMPTOMS = [
        { id: 'fever',       name: 'Fever',              icon: '🌡️', weight: 8 },
        { id: 'cough',       name: 'Cough',              icon: '😷', weight: 5 },
        { id: 'headache',    name: 'Headache',            icon: '🤕', weight: 4 },
        { id: 'chest_pain',  name: 'Chest Pain',          icon: '💔', weight: 15 },
        { id: 'vomiting',    name: 'Vomiting',            icon: '🤢', weight: 7 },
        { id: 'fatigue',     name: 'Fatigue',             icon: '😴', weight: 4 },
        { id: 'runny_nose',  name: 'Runny Nose',          icon: '🤧', weight: 2 },
        { id: 'sore_throat', name: 'Sore Throat',         icon: '🗣️', weight: 3 },
        { id: 'breathing',   name: 'Breathing Difficulty', icon: '🫁', weight: 18 },
        { id: 'dizziness',   name: 'Dizziness',           icon: '😵', weight: 6 },
        { id: 'body_pain',   name: 'Body Pain',           icon: '🦴', weight: 5 },
    ];

    /* ---- Recommendation Data ---- */
    const RECOMMENDATIONS = {
        low: {
            text: 'Your symptoms suggest a low health risk. This may indicate a common cold or minor ailment that typically resolves on its own with proper rest and hydration.',
            tips: [
                { icon: '💧', text: 'Stay hydrated — drink at least 8 glasses of water daily' },
                { icon: '😴', text: 'Get plenty of rest — aim for 7-9 hours of sleep' },
                { icon: '🍋', text: 'Boost immunity with vitamin C-rich foods' },
                { icon: '📋', text: 'Monitor symptoms for the next 48 hours' },
            ]
        },
        moderate: {
            text: 'Your symptoms indicate a moderate health risk. While not immediately dangerous, these symptoms combined warrant attention and may require medical consultation if they persist.',
            tips: [
                { icon: '👨‍⚕️', text: 'Schedule a doctor appointment within 2-3 days' },
                { icon: '💊', text: 'Consider over-the-counter symptom relief medication' },
                { icon: '🌡️', text: 'Keep track of your temperature regularly' },
                { icon: '🚫', text: 'Avoid strenuous physical activity until symptoms improve' },
            ]
        },
        high: {
            text: 'Your symptoms suggest a high health risk. The combination of your symptoms requires prompt medical attention. Please consult with a healthcare professional as soon as possible.',
            tips: [
                { icon: '🏥', text: 'Visit a doctor or urgent care clinic today' },
                { icon: '📝', text: 'Document all symptoms and when they started' },
                { icon: '🛑', text: 'Do not ignore worsening symptoms' },
                { icon: '👥', text: 'Have someone stay with you in case symptoms escalate' },
            ]
        },
        critical: {
            text: 'Your symptoms indicate a critical health risk requiring immediate medical attention. Please seek emergency care right away. Do not delay treatment.',
            tips: [
                { icon: '🚑', text: 'Call emergency services or go to the ER immediately' },
                { icon: '⚠️', text: 'Do not drive yourself — ask someone to take you' },
                { icon: '📱', text: 'Keep your phone charged and accessible at all times' },
                { icon: '💊', text: 'Bring a list of any medications you are currently taking' },
            ]
        }
    };

    /* ---- State ---- */
    let selectedSymptoms = new Set();
    let currentScreen = 'screen-welcome';
    let riskScore = 0;

    /* ---- DOM Refs ---- */
    const $ = (sel) => document.querySelector(sel);
    const grid = $('#symptom-grid');
    const countEl = $('#symptom-count');
    const analyzeBtn = $('#btn-analyze');

    /* ---- Build Symptom Cards ---- */
    SYMPTOMS.forEach(s => {
        const card = document.createElement('div');
        card.className = 'symptom-card';
        card.dataset.id = s.id;
        card.innerHTML = `
            <div class="check-mark">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <div class="symptom-icon">${s.icon}</div>
            <span class="symptom-name">${s.name}</span>`;
        card.addEventListener('click', () => toggleSymptom(s.id, card));
        grid.appendChild(card);
    });

    /* ---- Symptom Toggle ---- */
    function toggleSymptom(id, card) {
        if (selectedSymptoms.has(id)) {
            selectedSymptoms.delete(id);
            card.classList.remove('selected');
        } else {
            selectedSymptoms.add(id);
            card.classList.add('selected');
        }
        countEl.textContent = selectedSymptoms.size;
        analyzeBtn.disabled = selectedSymptoms.size === 0;
    }

    /* ---- Screen Navigation ---- */
    function goTo(screenId) {
        const prev = $(`.screen.active`);
        const next = $(`#${screenId}`);
        if (prev) {
            prev.classList.add('exit-left');
            prev.classList.remove('active');
            setTimeout(() => prev.classList.remove('exit-left'), 500);
        }
        setTimeout(() => {
            next.classList.add('active');
            currentScreen = screenId;
        }, 80);
    }

    function goBack(screenId) {
        const prev = $(`.screen.active`);
        const next = $(`#${screenId}`);
        if (prev) { prev.classList.remove('active'); }
        next.style.transform = 'translateX(-60px)';
        next.offsetHeight; // force reflow
        next.style.transform = '';
        next.classList.add('active');
        currentScreen = screenId;
    }

    /* ---- Risk Calculation ---- */
    function calculateRisk() {
        let totalWeight = 0;
        selectedSymptoms.forEach(id => {
            const sym = SYMPTOMS.find(s => s.id === id);
            if (sym) totalWeight += sym.weight;
        });
        const maxPossible = SYMPTOMS.reduce((a, s) => a + s.weight, 0);
        return Math.min(100, Math.round((totalWeight / maxPossible) * 130));
    }

    function getRiskLevel(score) {
        if (score <= 25)  return { level: 'low',      label: 'Low Risk',      color: '#4ade80' };
        if (score <= 50)  return { level: 'moderate',  label: 'Moderate Risk',  color: '#facc15' };
        if (score <= 75)  return { level: 'high',      label: 'High Risk',      color: '#f97316' };
        return                   { level: 'critical',  label: 'Critical Risk',  color: '#ef4444' };
    }

    /* ---- Animate Risk Score ---- */
    function showResult(score) {
        const overlay = $('#analyzing-overlay');
        const card = $('#result-card');
        const bottom = $('#result-bottom');
        overlay.classList.remove('hidden');
        card.style.opacity = '0';
        bottom.style.opacity = '0';

        setTimeout(() => {
            overlay.classList.add('hidden');
            card.style.opacity = '1';
            bottom.style.opacity = '1';
            animateScore(score);
        }, 2200);
    }

    function animateScore(score) {
        const info = getRiskLevel(score);
        const fill = $('#meter-fill');
        const numEl = $('#risk-score-number');
        const circumference = 534.07;
        const offset = circumference - (score / 100) * circumference;

        // gradient colors
        $('#grad-stop-1').setAttribute('stop-color', info.color);
        $('#grad-stop-2').setAttribute('stop-color', info.color);
        fill.style.strokeDashoffset = offset;

        // level badge
        $('#risk-level-dot').style.background = info.color;
        $('#risk-level-text').textContent = info.label;

        // bar indicator
        $('#risk-bar-indicator').style.left = score + '%';
        $('#risk-bar-indicator').style.borderColor = info.color;

        // animate number
        let current = 0;
        const duration = 1800;
        const start = performance.now();
        function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            current = Math.round(eased * score);
            numEl.textContent = current;
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);

        riskScore = score;
    }

    /* ---- Populate Recommendation ---- */
    function showRecommendation(score) {
        const info = getRiskLevel(score);
        const rec = RECOMMENDATIONS[info.level];

        $('#rec-risk-icon').style.background = info.color + '22';
        $('#rec-risk-icon').style.color = info.color;
        $('#rec-risk-value').textContent = `${info.label} — Score ${score}`;
        $('#rec-card-text').textContent = rec.text;

        const tipsList = $('#rec-tips');
        tipsList.innerHTML = '';
        rec.tips.forEach(tip => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="tip-icon">${tip.icon}</span><span>${tip.text}</span>`;
            tipsList.appendChild(li);
        });
    }

    /* ---- Reset ---- */
    function resetApp() {
        selectedSymptoms.clear();
        grid.querySelectorAll('.symptom-card').forEach(c => c.classList.remove('selected'));
        countEl.textContent = '0';
        analyzeBtn.disabled = true;
        $('#meter-fill').style.strokeDashoffset = '534.07';
        $('#risk-score-number').textContent = '0';
        $('#risk-bar-indicator').style.left = '0%';
        goTo('screen-welcome');
    }

    /* ---- Event Listeners ---- */
    $('#btn-start').addEventListener('click', () => goTo('screen-symptoms'));
    $('#btn-back-symptoms').addEventListener('click', () => goBack('screen-welcome'));

    $('#btn-analyze').addEventListener('click', () => {
        const score = calculateRisk();
        goTo('screen-result');
        showResult(score);
    });

    $('#btn-back-result').addEventListener('click', () => goBack('screen-symptoms'));

    $('#btn-recommendation').addEventListener('click', () => {
        showRecommendation(riskScore);
        goTo('screen-recommendation');
    });

    $('#btn-back-recommendation').addEventListener('click', () => goBack('screen-result'));

    $('#btn-call-doctor').addEventListener('click', () => {
        alert('📞 Connecting you to a healthcare professional...\n\nIn a real app, this would initiate a call to your registered doctor or a telemedicine service.');
    });

    
    $('#btn-hospital').addEventListener('click', () => {
    alert('🏥 Finding nearby hospitals...');
    });

    $('#btn-restart').addEventListener('click', resetApp);
})();
// Voice Recognition Setup
const btnVoice = document.getElementById("btn-voice");
const otherDiseasesInput = document.getElementById("other-diseases");
const voiceStatus = document.getElementById("voice-status");

let recognition;
let isRecording = false;

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
        isRecording = true;
        btnVoice.classList.add("recording");
        voiceStatus.textContent = "Listening...";
    };

    recognition.onend = () => {
        isRecording = false;
        btnVoice.classList.remove("recording");
        voiceStatus.textContent = "Tap mic to speak";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        otherDiseasesInput.value = transcript;
    };
}

btnVoice.addEventListener("click", () => {
    if (!recognition) {
        alert("Voice recognition not supported in this browser.");
        return;
    }

    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
    }
});

