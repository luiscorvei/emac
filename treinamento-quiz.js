/**
 * EMAC - Centro de Treinamento - Motor de Quizzes e Atividades
 * Suporta questões de Múltipla Escolha e Entrada Numérica Exata
 * Seleção aleatória de 5 questões por rodada do banco de questões
 * Sistema de Domínio Khan Academy integrado com localStorage
 */

const EMACTreinamento = (function () {
    const MASTERY_LEVELS = [
        { id: 0, label: 'Não iniciado', class: 'badge-level-0', meterClass: '' },
        { id: 1, label: 'Tentou', class: 'badge-level-1', meterClass: 'meter-fill-1' },
        { id: 2, label: 'Familiar', class: 'badge-level-2', meterClass: 'meter-fill-2' },
        { id: 3, label: 'Proficiente', class: 'badge-level-3', meterClass: 'meter-fill-3' },
        { id: 4, label: '👑 Dominado', class: 'badge-level-4', meterClass: 'meter-fill-4' }
    ];

    // Embaralha um array (Fisher-Yates)
    function shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // Normaliza respostas de input de texto/número
    function normalizeInput(val) {
        if (val === undefined || val === null) return '';
        let str = String(val).trim().toLowerCase();
        str = str.replace(/r\$\s*/g, '');
        str = str.replace(/(peças|pecas|horas|h|unidades|unidade|reais|kg|m3|m³|m2|m²)/g, '').trim();
        str = str.replace(',', '.');
        return str;
    }

    function checkInputAnswer(userVal, correctVal, acceptedList) {
        const normUser = normalizeInput(userVal);
        if (!normUser) return false;

        // Se houver lista de aceitos
        if (Array.isArray(acceptedList)) {
            for (let acc of acceptedList) {
                if (compareValues(normUser, normalizeInput(acc))) return true;
            }
        }

        // Comparação com valor correto principal
        return compareValues(normUser, normalizeInput(correctVal));
    }

    function compareValues(a, b) {
        if (a === b) return true;
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) {
            return Math.abs(numA - numB) < 0.001;
        }
        return false;
    }

    // Carrega progresso do localStorage
    function getStoredProgress() {
        try {
            const saved = localStorage.getItem('emac_chapters_mastery');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error('Erro ao ler progresso do localStorage:', e);
        }
        return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }

    // Salva progresso no localStorage
    function saveProgress(progress) {
        try {
            localStorage.setItem('emac_chapters_mastery', JSON.stringify(progress));
        } catch (e) {
            console.error('Erro ao salvar progresso:', e);
        }
    }

    // Funções utilitárias globais para sorteio de parâmetros dinâmicos em questões
    if (typeof window !== 'undefined') {
        window.randomInt = function (min, max, step = 1) {
            const range = Math.floor((max - min) / step);
            return min + Math.floor(Math.random() * (range + 1)) * step;
        };

        window.randomChoice = function (list) {
            if (!Array.isArray(list) || list.length === 0) return null;
            return list[Math.floor(Math.random() * list.length)];
        };
    }

    class QuizInstance {
        constructor(config) {
            this.chapterId = config.chapterId;
            this.chapterTitle = config.chapterTitle;
            this.chapterSubtitle = config.chapterSubtitle;
            this.accentColor = config.accentColor || '#2563eb';
            this.fullQuestionBank = config.questions || [];
            this.selectedQuestions = [];
            this.currentIndex = 0;
            this.score = 0;
            this.answersHistory = [];
            this.selectedOptionIndex = null;
            this.isAnswerChecked = false;

            this.initElements();
            this.startNewQuiz();
        }

        initElements() {
            this.container = document.getElementById('quiz-app-container');
            if (!this.container) {
                console.error('Elemento #quiz-app-container não encontrado na página.');
                return;
            }
        }

        startNewQuiz() {
            // Seleciona 5 questões aleatórias
            const shuffled = shuffleArray(this.fullQuestionBank);
            const picked = shuffled.slice(0, Math.min(5, shuffled.length));

            // Instancia cada questão sorteada:
            // 1. Executa gerador dinâmico de parâmetros (q.generate), se existir
            // 2. Embaralha aleatoriamente as alternativas de múltipla escolha na tela,
            //    mantendo o correctIndex original do código mapeado para a nova posição!
            this.selectedQuestions = picked.map(q => {
                let instantiated = { ...q };

                // Se a questão possuir gerador dinâmico de parâmetros
                if (typeof q.generate === 'function') {
                    try {
                        const dynamicData = q.generate();
                        instantiated = { ...instantiated, ...dynamicData };
                    } catch (err) {
                        console.error('Erro ao gerar parâmetros dinâmicos da questão id ' + q.id + ':', err);
                    }
                }

                // Se for questão de múltipla escolha, embaralha a ordem das alternativas na tela
                if (instantiated.type === 'choice' && Array.isArray(instantiated.options)) {
                    const originalCorrectIdx = (instantiated.correctIndex !== undefined) ? instantiated.correctIndex : 0;
                    
                    // Vincula cada texto de alternativa ao booleano de acerto original
                    const optionsWithMeta = instantiated.options.map((optText, idx) => ({
                        text: optText,
                        isCorrect: (idx === originalCorrectIdx)
                    }));

                    // Embaralha as alternativas aleatoriamente (Fisher-Yates)
                    const shuffledOptions = shuffleArray(optionsWithMeta);

                    // Descobre a nova posição onde a resposta correta foi parar
                    const newCorrectIdx = shuffledOptions.findIndex(o => o.isCorrect);

                    // Salva as alternativas embaralhadas e o novo índice da correta para esta rodada
                    instantiated.options = shuffledOptions.map(o => o.text);
                    instantiated.correctIndex = (newCorrectIdx !== -1) ? newCorrectIdx : 0;
                }

                return instantiated;
            });

            this.currentIndex = 0;
            this.score = 0;
            this.answersHistory = [];
            this.selectedOptionIndex = null;
            this.isAnswerChecked = false;

            this.renderQuestionScreen();
        }

        renderQuestionScreen() {
            const q = this.selectedQuestions[this.currentIndex];
            const qNum = this.currentIndex + 1;
            const totalQ = this.selectedQuestions.length;

            // Progresso dos 5 passos (ícones de status)
            let stepsHtml = '';
            for (let i = 0; i < totalQ; i++) {
                let statusClass = 'step-pending';
                let iconContent = i + 1;
                if (i < this.answersHistory.length) {
                    const isCorrect = this.answersHistory[i].isCorrect;
                    statusClass = isCorrect ? 'step-correct' : 'step-incorrect';
                    iconContent = isCorrect ? '✓' : '✗';
                } else if (i === this.currentIndex) {
                    statusClass = 'step-active';
                }
                stepsHtml += `<div class="quiz-step-dot ${statusClass}" title="Questão ${i + 1}">${iconContent}</div>`;
            }

            // Input / Options markup
            let interactionMarkup = '';
            if (q.type === 'choice') {
                const letters = ['A', 'B', 'C', 'D'];
                interactionMarkup = `
                    <div class="quiz-options-list" id="quizOptionsList">
                        ${q.options.map((opt, idx) => `
                            <button type="button" class="quiz-option-btn" data-index="${idx}">
                                <span class="option-letter">${letters[idx]}</span>
                                <span class="option-text">${opt}</span>
                            </button>
                        `).join('')}
                    </div>
                `;
            } else if (q.type === 'input') {
                interactionMarkup = `
                    <div class="quiz-input-container">
                        <label class="quiz-input-label" for="exactAnswerInput">Digite sua resposta numérica exata:</label>
                        <div class="quiz-input-wrapper">
                            ${q.unitPrefix ? `<span class="quiz-unit-prefix">${q.unitPrefix}</span>` : ''}
                            <input type="text" id="exactAnswerInput" class="quiz-text-input" placeholder="${q.placeholder || 'Digite o valor...'}" autocomplete="off">
                            ${q.unitSuffix ? `<span class="quiz-unit-suffix">${q.unitSuffix}</span>` : ''}
                        </div>
                        <small class="quiz-input-hint">Dica: digite apenas o número correspondente (ex: 25 ou 12.5). Use ponto ou vírgula para decimais.</small>
                    </div>
                `;
            }

            const typeBadgeText = q.type === 'choice' ? 'Múltipla Escolha' : 'Entrada Exata';
            const typeBadgeIcon = q.type === 'choice' ? '🔘' : '✏️';

            this.container.innerHTML = `
                <div class="quiz-card">
                    <div class="quiz-card-header">
                        <div class="quiz-card-header-left">
                            <span class="quiz-meta-tag">${typeBadgeIcon} ${typeBadgeText}</span>
                            <span class="quiz-meta-sector">${q.topic || this.chapterSubtitle}</span>
                        </div>
                        <div class="quiz-step-tracker">
                            ${stepsHtml}
                        </div>
                    </div>

                    <div class="quiz-question-counter">
                        <span>Questão <strong>${qNum}</strong> de <strong>${totalQ}</strong></span>
                    </div>

                    <div class="quiz-statement">
                        ${q.statement}
                    </div>

                    ${interactionMarkup}

                    <div id="quizFeedbackArea" class="quiz-feedback-box" style="display: none;"></div>

                    <div class="quiz-card-footer">
                        <button type="button" id="btnQuizAction" class="quiz-btn-primary" disabled>
                            Verificar Resposta
                        </button>
                    </div>
                </div>
            `;

            this.bindQuestionEvents(q);
        }

        bindQuestionEvents(q) {
            const btnAction = document.getElementById('btnQuizAction');
            const feedbackArea = document.getElementById('quizFeedbackArea');

            if (q.type === 'choice') {
                const optionBtns = this.container.querySelectorAll('.quiz-option-btn');
                optionBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (this.isAnswerChecked) return;
                        optionBtns.forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        this.selectedOptionIndex = parseInt(btn.getAttribute('data-index'), 10);
                        btnAction.disabled = false;
                    });
                });
            } else if (q.type === 'input') {
                const inputEl = document.getElementById('exactAnswerInput');
                if (inputEl) {
                    inputEl.focus();
                    inputEl.addEventListener('input', () => {
                        if (this.isAnswerChecked) return;
                        btnAction.disabled = inputEl.value.trim().length === 0;
                    });
                    inputEl.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && !btnAction.disabled && !this.isAnswerChecked) {
                            btnAction.click();
                        }
                    });
                }
            }

            btnAction.addEventListener('click', () => {
                if (!this.isAnswerChecked) {
                    // Verificar resposta
                    this.checkAnswer(q, btnAction, feedbackArea);
                } else {
                    // Avançar para a próxima questão ou resultado
                    this.nextQuestion();
                }
            });
        }

        checkAnswer(q, btnAction, feedbackArea) {
            let isCorrect = false;
            let userAnswerLabel = '';
            let correctAnswerLabel = '';

            if (q.type === 'choice') {
                const selectedIdx = this.selectedOptionIndex;
                isCorrect = (selectedIdx === q.correctIndex);
                userAnswerLabel = q.options[selectedIdx];
                correctAnswerLabel = q.options[q.correctIndex];

                const optionBtns = this.container.querySelectorAll('.quiz-option-btn');
                optionBtns.forEach((btn, idx) => {
                    btn.classList.remove('selected');
                    if (idx === q.correctIndex) {
                        btn.classList.add('option-correct');
                    } else if (idx === selectedIdx && !isCorrect) {
                        btn.classList.add('option-incorrect');
                    }
                });
            } else if (q.type === 'input') {
                const inputEl = document.getElementById('exactAnswerInput');
                const rawVal = inputEl ? inputEl.value : '';
                userAnswerLabel = rawVal.trim();
                correctAnswerLabel = `${q.unitPrefix || ''}${q.answer}${q.unitSuffix ? ' ' + q.unitSuffix : ''}`;
                isCorrect = checkInputAnswer(rawVal, q.answer, q.acceptedAnswers);

                if (inputEl) {
                    inputEl.disabled = true;
                    inputEl.classList.add(isCorrect ? 'input-correct' : 'input-incorrect');
                }
            }

            if (isCorrect) {
                this.score++;
            }

            this.answersHistory.push({
                question: q,
                isCorrect: isCorrect,
                userAnswer: userAnswerLabel,
                correctAnswer: correctAnswerLabel
            });

            this.isAnswerChecked = true;

            // Exibir feedback com explicação passo a passo
            feedbackArea.style.display = 'block';
            feedbackArea.className = `quiz-feedback-box ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;
            feedbackArea.innerHTML = `
                <div class="feedback-header">
                    <span class="feedback-icon">${isCorrect ? '🎉' : '⚠️'}</span>
                    <strong class="feedback-title">${isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta'}</strong>
                </div>
                <div class="feedback-content">
                    ${!isCorrect ? `<p class="feedback-correct-answer"><strong>Gabarito:</strong> ${correctAnswerLabel}</p>` : ''}
                    <div class="feedback-explanation">
                        <strong>Passo a passo da resolução:</strong>
                        <div class="explanation-text">${q.explanation}</div>
                    </div>
                </div>
            `;

            // Atualiza tracker do topo
            const dots = this.container.querySelectorAll('.quiz-step-dot');
            if (dots[this.currentIndex]) {
                dots[this.currentIndex].className = `quiz-step-dot ${isCorrect ? 'step-correct' : 'step-incorrect'}`;
                dots[this.currentIndex].innerHTML = isCorrect ? '✓' : '✗';
            }

            // Atualiza botão de ação
            const isLast = this.currentIndex === this.selectedQuestions.length - 1;
            btnAction.textContent = isLast ? 'Ver Resultado do Treinamento 🏆' : 'Próxima Questão ➔';
            btnAction.disabled = false;
        }

        nextQuestion() {
            this.currentIndex++;
            this.selectedOptionIndex = null;
            this.isAnswerChecked = false;

            if (this.currentIndex < this.selectedQuestions.length) {
                this.renderQuestionScreen();
            } else {
                this.renderCompletionScreen();
            }
        }

        renderCompletionScreen() {
            const totalQuestions = this.selectedQuestions.length;
            const correctCount = this.score;
            const isPerfect = (correctCount === totalQuestions);

            // Obter e atualizar progresso Khan Academy
            const progress = getStoredProgress();
            const prevLevel = progress[this.chapterId] || 0;
            let newLevel = prevLevel;

            if (isPerfect) {
                // Acertou todas: sobe de nível (máx 4)
                newLevel = Math.min(4, prevLevel + 1);
            } else {
                // Errou alguma: cai 1 nível (mín 0)
                newLevel = Math.max(0, prevLevel - 1);
            }

            progress[this.chapterId] = newLevel;
            saveProgress(progress);

            const prevLevelInfo = MASTERY_LEVELS[prevLevel];
            const newLevelInfo = MASTERY_LEVELS[newLevel];

            let masteryResultHtml = '';
            if (isPerfect) {
                masteryResultHtml = `
                    <div class="mastery-update-card update-card-up">
                        <div class="mastery-update-badge">NÍVEL DE DOMÍNIO SUBIU! 🚀</div>
                        <div class="mastery-comparison">
                            <span class="status-badge-current ${prevLevelInfo.class}">${prevLevelInfo.label} (${prevLevel}/4)</span>
                            <span class="mastery-arrow">➔</span>
                            <span class="status-badge-current ${newLevelInfo.class}">${newLevelInfo.label} (${newLevel}/4)</span>
                        </div>
                        <p class="mastery-msg">Excelente trabalho! Acertando 100% das questões, seu nível de domínio neste setor subiu de nível!</p>
                        <div class="mastery-meter ${newLevelInfo.meterClass}" style="max-width: 320px; margin: 12px auto 0;">
                            <div class="meter-segment"></div>
                            <div class="meter-segment"></div>
                            <div class="meter-segment"></div>
                            <div class="meter-segment"></div>
                        </div>
                    </div>
                `;
            } else {
                masteryResultHtml = `
                    <div class="mastery-update-card update-card-down">
                        <div class="mastery-update-badge badge-attention">ATENÇÃO AO DOMÍNIO 📉</div>
                        <div class="mastery-comparison">
                            <span class="status-badge-current ${prevLevelInfo.class}">${prevLevelInfo.label} (${prevLevel}/4)</span>
                            <span class="mastery-arrow">➔</span>
                            <span class="status-badge-current ${newLevelInfo.class}">${newLevelInfo.label} (${newLevel}/4)</span>
                        </div>
                        <p class="mastery-msg">No método de domínio, errar qualquer questão reduz o nível em 1 ponto (${newLevel}/4). Revise os passos das questões e tente novamente para recuperar seu nível!</p>
                        <div class="mastery-meter ${newLevelInfo.meterClass}" style="max-width: 320px; margin: 12px auto 0;">
                            <div class="meter-segment"></div>
                            <div class="meter-segment"></div>
                            <div class="meter-segment"></div>
                            <div class="meter-segment"></div>
                        </div>
                    </div>
                `;
            }

            // Lista detalhada das 5 questões respondidas
            const reviewListHtml = this.answersHistory.map((item, idx) => `
                <div class="review-item ${item.isCorrect ? 'review-item-correct' : 'review-item-incorrect'}">
                    <div class="review-header">
                        <span class="review-status-icon">${item.isCorrect ? '✓' : '✗'}</span>
                        <strong>Questão ${idx + 1}: ${item.question.topic || ''}</strong>
                    </div>
                    <div class="review-body">
                        <p class="review-statement">${item.question.statement}</p>
                        <div class="review-answers">
                            <span class="review-user-ans"><strong>Sua resposta:</strong> ${item.userAnswer || '(Em branco)'}</span>
                            ${!item.isCorrect ? `<span class="review-correct-ans"><strong>Correta:</strong> ${item.correctAnswer}</span>` : ''}
                        </div>
                        <div class="review-explanation-toggle">
                            <details>
                                <summary>Ver explicação matemática</summary>
                                <div class="review-explanation-content">${item.question.explanation}</div>
                            </details>
                        </div>
                    </div>
                </div>
            `).join('');

            this.container.innerHTML = `
                <div class="quiz-card completion-card">
                    <div class="completion-header">
                        <div class="completion-trophy">${isPerfect ? '🏆' : (correctCount >= 3 ? '👏' : '📚')}</div>
                        <h2 class="completion-title">Treinamento Concluído!</h2>
                        <div class="completion-score-pill">
                            Acertos: <strong>${correctCount}</strong> de <strong>${totalQuestions}</strong> (${Math.round((correctCount / totalQuestions) * 100)}%)
                        </div>
                    </div>

                    ${masteryResultHtml}

                    <div class="completion-actions">
                        <button type="button" id="btnRestartQuiz" class="quiz-btn-primary">
                            🔄 Tentar Novamente (Novas Questões)
                        </button>
                        <a href="centrodetreinamento.html" class="quiz-btn-secondary">
                            ⬅️ Voltar ao Centro de Treinamento
                        </a>
                    </div>

                    <div class="completion-review-section">
                        <h3 class="review-section-title">Revisão Detalhada das Questões</h3>
                        <div class="review-list">
                            ${reviewListHtml}
                        </div>
                    </div>
                </div>
            `;

            const btnRestart = document.getElementById('btnRestartQuiz');
            if (btnRestart) {
                btnRestart.addEventListener('click', () => {
                    this.startNewQuiz();
                });
            }
        }
    }

    return {
        init: function (config) {
            return new QuizInstance(config);
        },
        getStoredProgress: getStoredProgress,
        saveProgress: saveProgress,
        MASTERY_LEVELS: MASTERY_LEVELS
    };
})();
