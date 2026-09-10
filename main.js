/**
 * ====================================================================
 * EMAC - Fábrica de Móveis (UFPR)
 * Arquivo Principal de Scripts JavaScript (main.js)
 * ====================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa o Capítulo 1: Setor de Corte (se a página contiver a oficina de corte)
    initSetorDeCorte();

    // Inicializa o Capítulo 2: Setor de Montagem (se a página contiver o plano cartesiano)
    initSetorDeMontagem();

    // Inicializa o Capítulo 3: Setor de Logística (se a página contiver o sistema de inequações)
    initSetorDeLogistica();

    // Inicializa os Capítulos 4 e 5: Magnata da Fábrica (se a página contiver o jogo de otimização)
    initMagnataDaFabrica();
});


/**
 * Função utilitária para calcular a distância de um ponto (px, py)
 * a um segmento de reta que vai de (x1, y1) até (x2, y2).
 */
function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}


/* ====================================================================
   CAPÍTULO 1: SETOR DE CORTE (EPIs, Porta Lego 3D e Função Afim de Custo)
   ==================================================================== */
function initSetorDeCorte() {
    const epiStage = document.getElementById('epiStage');
    const workshopStage = document.getElementById('workshopStage');
    const corteCanvas = document.getElementById('corteChart');

    if (!epiStage || !workshopStage || !corteCanvas) return;

    // 1. Controle dos EPIs e da Porta de Segurança
    const cardOculos = document.getElementById('cardOculos');
    const txtOculos = document.getElementById('txtOculos');
    const cardLuvas = document.getElementById('cardLuvas');
    const txtLuvas = document.getElementById('txtLuvas');
    const legoDoor = document.getElementById('legoDoor');
    const doorStatusIndicator = document.getElementById('doorStatusIndicator');
    const doorStatusText = document.getElementById('doorStatusText');
    const doorHintText = document.getElementById('doorHintText');
    const btnVoltarVestiario = document.getElementById('btnVoltarVestiario');

    let hasOculos = false;
    let hasLuvas = false;
    let doorUnlocked = false;

    function toggleOculos() {
        hasOculos = !hasOculos;
        cardOculos.classList.toggle('equipped', hasOculos);
        txtOculos.textContent = hasOculos ? '✓ Óculos Equipados' : 'Equipar Óculos';
        checkSafetyGate();
    }

    function toggleLuvas() {
        hasLuvas = !hasLuvas;
        cardLuvas.classList.toggle('equipped', hasLuvas);
        txtLuvas.textContent = hasLuvas ? '✓ Luvas Equipadas' : 'Equipar Luvas';
        checkSafetyGate();
    }

    if (cardOculos) cardOculos.addEventListener('click', toggleOculos);
    if (cardLuvas) cardLuvas.addEventListener('click', toggleLuvas);

    function checkSafetyGate() {
        if (hasOculos && hasLuvas) {
            doorUnlocked = true;
            legoDoor.classList.add('unlocked');
            legoDoor.setAttribute('aria-disabled', 'false');
            doorStatusIndicator.classList.add('unlocked');
            doorStatusText.textContent = 'ACESSO LIBERADO — Clique na porta para entrar!';
            doorHintText.innerHTML = '✨ <strong>EPIs completos!</strong> Clique na porta de entrada para acessar a oficina.';
        } else {
            doorUnlocked = false;
            legoDoor.classList.remove('unlocked');
            legoDoor.setAttribute('aria-disabled', 'true');
            doorStatusIndicator.classList.remove('unlocked');
            
            const faltam = [];
            if (!hasOculos) faltam.push('Óculos');
            if (!hasLuvas) faltam.push('Luvas');
            doorStatusText.textContent = `PORTA TRANCADA — Falta equipar: ${faltam.join(' e ')}`;
            doorHintText.textContent = '🔒 Bloqueado: equipe todos os itens de proteção antes de entrar.';
        }
    }

    // Transição ao Clicar na Porta
    if (legoDoor) {
        legoDoor.addEventListener('click', () => {
            if (!doorUnlocked) return;

            legoDoor.classList.add('opening');

            setTimeout(() => {
                epiStage.classList.add('hidden');
                workshopStage.classList.remove('hidden');
                legoDoor.classList.remove('opening');

                if (window.corteChartInstance) {
                    window.corteChartInstance.resize();
                    window.corteChartInstance.update();
                }

                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 600);
        });
    }

    // Voltar para o Vestiário
    if (btnVoltarVestiario) {
        btnVoltarVestiario.addEventListener('click', () => {
            workshopStage.classList.add('hidden');
            epiStage.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 2. Simulação da Máquina de Corte & Gráfico Chart.js
    const btnLigar = document.getElementById('btnLigar');
    const btnLigarText = document.getElementById('btnLigarText');
    const btnReset = document.getElementById('btnReset');
    const statusPill = document.getElementById('statusPill');
    const statusText = document.getElementById('statusText');
    const machineStage = document.getElementById('machineStage');
    const sawWrapper = document.getElementById('sawWrapper');
    const machineHint = document.getElementById('machineHint');

    const valX = document.getElementById('valX');
    const valFixo = document.getElementById('valFixo');
    const valVar = document.getElementById('valVar');
    const valTotal = document.getElementById('valTotal');
    const eqDisplay = document.getElementById('eqDisplay');

    let isRunning = false;
    let xCorte = 0;
    const CUSTO_FIXO = 50;
    const CUSTO_UNITARIO = 15;

    // Configuração do Gráfico Chart.js
    const ctx = corteCanvas.getContext('2d');
    const chartData = {
        labels: [],
        datasets: [{
            label: 'Reta C(x) = 15x + 50 (Custo Total)',
            data: [],
            borderColor: '#d32f2f',
            backgroundColor: 'rgba(229, 57, 53, 0.15)',
            borderWidth: 4,
            pointBackgroundColor: '#ffeb3b',
            pointBorderColor: '#d32f2f',
            pointBorderWidth: 3,
            pointRadius: 7,
            pointHoverRadius: 10,
            tension: 0,
            fill: true
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 300,
            easing: 'easeOutCubic'
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    font: { family: 'Inter', size: 12, weight: '800' },
                    color: '#222'
                }
            },
            tooltip: {
                backgroundColor: '#212121',
                titleFont: { family: 'Inter', size: 12, weight: '800' },
                bodyFont: { family: 'Inter', size: 12, weight: '600' },
                padding: 10,
                borderColor: '#ffc107',
                borderWidth: 2,
                cornerRadius: 6,
                displayColors: false,
                callbacks: {
                    title: (context) => `Tábuas Cortadas (x): ${context[0].label}`,
                    label: (context) => `Custo Total: R$ ${Number(context.raw).toFixed(2).replace('.', ',')}`
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Quantidade de Tábuas Cortadas (x)',
                    font: { family: 'Inter', size: 11, weight: '800' },
                    color: '#37474f'
                },
                grid: { color: '#eceff1' },
                ticks: { font: { family: 'Inter', size: 11, weight: '700' } }
            },
            y: {
                title: {
                    display: true,
                    text: 'Custo Total em Reais (R$)',
                    font: { family: 'Inter', size: 11, weight: '800' },
                    color: '#37474f'
                },
                suggestedMin: 0,
                suggestedMax: 120,
                grid: { color: '#cfd8dc' },
                ticks: {
                    font: { family: 'Inter', size: 11, weight: '700' },
                    callback: (value) => `R$ ${value}`
                }
            }
        }
    };

    if (typeof Chart !== 'undefined') {
        window.corteChartInstance = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: chartOptions
        });
    }

    function formatBRL(valor) {
        return `R$ ${valor.toFixed(2).replace('.', ',')}`;
    }

    function updateAnalytics() {
        if (valX) valX.textContent = xCorte;
        
        if (!isRunning && xCorte === 0) {
            if (valFixo) valFixo.textContent = 'R$ 0,00';
            if (valVar) valVar.textContent = 'R$ 0,00';
            if (valTotal) valTotal.textContent = 'R$ 0,00';
            if (eqDisplay) eqDisplay.innerHTML = `Aguardando acionamento da máquina...`;
            return;
        }

        const custoVar = xCorte * CUSTO_UNITARIO;
        const total = CUSTO_FIXO + custoVar;

        if (valFixo) valFixo.textContent = formatBRL(CUSTO_FIXO);
        if (valVar) valVar.textContent = formatBRL(custoVar);
        if (valTotal) valTotal.textContent = formatBRL(total);

        if (eqDisplay) {
            eqDisplay.innerHTML = `C(<span class="eq-highlight">${xCorte}</span>) = 15 · (<span class="eq-highlight">${xCorte}</span>) + 50 = <span class="eq-result">${formatBRL(total)}</span>`;
        }
    }

    function spawnLegoSawdust(xPos, yPos) {
        const colors = ['#fbc02d', '#e53935', '#a1622b', '#ffeb3b', '#fb8c00'];
        for (let i = 0; i < 8; i++) {
            const p = document.createElement('div');
            p.className = 'lego-particle';
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            p.style.left = `${xPos}px`;
            p.style.top = `${yPos}px`;

            const tx = (Math.random() - 0.5) * 90;
            const ty = -30 - Math.random() * 60;
            const rot = (Math.random() - 0.5) * 360;

            p.style.setProperty('--tx', `${tx}px`);
            p.style.setProperty('--ty', `${ty}px`);
            p.style.setProperty('--rot', `${rot}deg`);

            machineStage.appendChild(p);

            setTimeout(() => {
                if (p.parentNode) p.parentNode.removeChild(p);
            }, 700);
        }
    }

    function spawnFloatingText(e) {
        const rect = machineStage.getBoundingClientRect();
        const floatEl = document.createElement('div');
        floatEl.className = 'floating-cost';
        floatEl.textContent = `+ R$ 15,00`;

        let xPos, yPos;
        if (e && e.clientX) {
            xPos = e.clientX - rect.left;
            yPos = e.clientY - rect.top;
        } else {
            xPos = rect.width / 2;
            yPos = rect.height / 2;
        }

        floatEl.style.left = `${xPos}px`;
        floatEl.style.top = `${yPos}px`;

        machineStage.appendChild(floatEl);
        spawnLegoSawdust(xPos, yPos);

        setTimeout(() => {
            if (floatEl.parentNode) {
                floatEl.parentNode.removeChild(floatEl);
            }
        }, 900);
    }

    // Ação 1: Ligar Serra Elétrica
    if (btnLigar) {
        btnLigar.addEventListener('click', () => {
            if (isRunning) return;

            isRunning = true;
            xCorte = 0;

            btnLigar.disabled = true;
            if (btnLigarText) btnLigarText.textContent = 'Serra Ligada (Em Operação)';
            if (statusPill) statusPill.classList.add('active');
            if (statusText) statusText.textContent = 'EM OPERAÇÃO';

            if (sawWrapper) sawWrapper.classList.add('ready', 'vibrating');
            if (machineHint) {
                machineHint.classList.add('ready-pulse');
                machineHint.innerHTML = '⚡ <strong>Serra em rotação!</strong> Clique na serra ou na tábua para cortar tábuas.';
            }

            updateAnalytics();

            if (window.corteChartInstance) {
                window.corteChartInstance.data.labels = [0];
                window.corteChartInstance.data.datasets[0].data = [CUSTO_FIXO];
                window.corteChartInstance.update();
            }
        });
    }

    // Ação 2: Cortar Tábua
    if (sawWrapper) {
        sawWrapper.addEventListener('click', (e) => {
            if (!isRunning) return;

            xCorte++;

            spawnFloatingText(e);
            updateAnalytics();

            const novoCusto = CUSTO_FIXO + (xCorte * CUSTO_UNITARIO);
            if (window.corteChartInstance) {
                window.corteChartInstance.data.labels.push(xCorte);
                window.corteChartInstance.data.datasets[0].data.push(novoCusto);
                window.corteChartInstance.update();
            }
        });
    }

    // Ação 3: Reiniciar Simulação
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            isRunning = false;
            xCorte = 0;

            if (btnLigar) btnLigar.disabled = false;
            if (btnLigarText) btnLigarText.textContent = 'Ligar Serra Elétrica';
            if (statusPill) statusPill.classList.remove('active');
            if (statusText) statusText.textContent = 'DESLIGADA';

            if (sawWrapper) sawWrapper.classList.remove('ready', 'vibrating');
            if (machineHint) {
                machineHint.classList.remove('ready-pulse');
                machineHint.innerHTML = '💡 Primeiro clique no botão <strong>"Ligar Serra Elétrica"</strong> para acionar a máquina.';
            }

            updateAnalytics();

            if (window.corteChartInstance) {
                window.corteChartInstance.data.labels = [];
                window.corteChartInstance.data.datasets[0].data = [];
                window.corteChartInstance.update();
            }
        });
    }

    // Inicialização
    updateAnalytics();
}


/* ====================================================================
   CAPÍTULO 2: SETOR DE MONTAGEM (Plano Cartesiano, Arraste e Inequações)
   ==================================================================== */
function initSetorDeMontagem() {
    const canvas = document.getElementById('cartesianCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const cartesianWrapper = document.getElementById('cartesianWrapper');

    // Elementos DOM de Produção
    const valMesas = document.getElementById('valMesas');
    const valCadeiras = document.getElementById('valCadeiras');
    const sliderMesas = document.getElementById('sliderMesas');
    const sliderCadeiras = document.getElementById('sliderCadeiras');
    const btnMesasDec = document.getElementById('btnMesasDec');
    const btnMesasInc = document.getElementById('btnMesasInc');
    const btnCadeirasDec = document.getElementById('btnCadeirasDec');
    const btnCadeirasInc = document.getElementById('btnCadeirasInc');

    const lblTempoMax = document.getElementById('lblTempoMax');
    const lblTempoMaxDenom = document.getElementById('lblTempoMaxDenom');
    const legendTimeText = document.getElementById('legendTimeText');
    const didacticLine1 = document.getElementById('didacticLine1');

    const cardRestricaoTempo = document.getElementById('cardRestricaoTempo');
    const badgeTempo = document.getElementById('badgeTempo');
    const calcTempoX = document.getElementById('calcTempoX');
    const calcTempoY = document.getElementById('calcTempoY');
    const calcTempoTotal = document.getElementById('calcTempoTotal');
    const meterTempo = document.getElementById('meterTempo');

    const feedbackBanner = document.getElementById('feedbackBanner');
    const feedbackBadge = document.getElementById('feedbackBadge');
    const feedbackText = document.getElementById('feedbackText');
    const assemblyStatusPill = document.getElementById('assemblyStatusPill');
    const assemblyStatusText = document.getElementById('assemblyStatusText');

    // Estado da Decisão de Produção (x: Mesas, y: Cadeiras)
    let x = 4;
    let y = 8;
    const MAX_AXIS = 30;

    // Parâmetros da Inequação de Tempo: 40x + 20y <= tempoTurno
    const TEMPO_MESA = 40;
    const TEMPO_CADEIRA = 20;
    let tempoTurno = 480; // Inicial: 480 min (8h) - Arrastável pelo usuário!

    // Controle de Interação / Arraste
    let isDraggingPoint = false;
    let isDraggingLine = false;
    let isHoveringLine = false;
    let pulseTime = 0;

    // Ajuste de DPI do Canvas
    function setupCanvasDPI() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = rect.width || 580;
        const height = Math.min(width * 0.9, 520);

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        ctx.scale(dpr, dpr);
    }

    function getPlotBounds() {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const padLeft = 45;
        const padBottom = 42;
        const padRight = 24;
        const padTop = 24;

        const plotWidth = w - padLeft - padRight;
        const plotHeight = h - padTop - padBottom;

        return {
            padLeft,
            padBottom,
            padRight,
            padTop,
            plotWidth,
            plotHeight,
            w,
            h
        };
    }

    function mathToPixel(mx, my) {
        const b = getPlotBounds();
        const px = b.padLeft + (mx / MAX_AXIS) * b.plotWidth;
        const py = b.padTop + (1 - my / MAX_AXIS) * b.plotHeight;
        return { x: px, y: py };
    }

    function pixelToMath(px, py) {
        const b = getPlotBounds();
        let mx = ((px - b.padLeft) / b.plotWidth) * MAX_AXIS;
        let my = (1 - (py - b.padTop) / b.plotHeight) * MAX_AXIS;

        mx = Math.max(0, Math.min(MAX_AXIS, Math.round(mx)));
        my = Math.max(0, Math.min(MAX_AXIS, Math.round(my)));

        return { x: mx, y: my };
    }

    function pixelToMathPrecise(px, py) {
        const b = getPlotBounds();
        let mx = ((px - b.padLeft) / b.plotWidth) * MAX_AXIS;
        let my = (1 - (py - b.padTop) / b.plotHeight) * MAX_AXIS;
        return { x: mx, y: my };
    }

    // Verificação de Factibilidade
    function checkFeasibility(mx, my) {
        const tempoVal = TEMPO_MESA * mx + TEMPO_CADEIRA * my;
        const passTempo = tempoVal <= tempoTurno;
        const passNonNeg = mx >= 0 && my >= 0;
        const isFeasible = passTempo && passNonNeg;

        return {
            tempoVal,
            passTempo,
            isFeasible
        };
    }

    // Cálculo dos Pontos da Reta de Tempo Visível no Gráfico
    function getTimeLineEndpoints() {
        const xIntercept = tempoTurno / TEMPO_MESA;
        const yIntercept = tempoTurno / TEMPO_CADEIRA;

        let p1 = { x: 0, y: yIntercept };
        let p2 = { x: xIntercept, y: 0 };

        if (yIntercept > MAX_AXIS) {
            p1 = { x: Math.min(MAX_AXIS, Math.max(0, (tempoTurno - MAX_AXIS * TEMPO_CADEIRA) / TEMPO_MESA)), y: MAX_AXIS };
        }
        if (xIntercept > MAX_AXIS) {
            p2 = { x: MAX_AXIS, y: Math.min(MAX_AXIS, Math.max(0, (tempoTurno - MAX_AXIS * TEMPO_MESA) / TEMPO_CADEIRA)) };
        }

        return {
            p1,
            p2,
            rawXIntercept: xIntercept,
            rawYIntercept: yIntercept
        };
    }

    // Distância de um ponto em pixels até o segmento de reta
    function distToSegment(px, py, x1, y1, x2, y2) {
        const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        if (l2 === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
    }

    // Renderização do Plano Cartesiano
    function renderCanvas() {
        const b = getPlotBounds();
        ctx.clearRect(0, 0, b.w, b.h);

        // Fundo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, b.w, b.h);

        // 1. Grade Milimetrada
        ctx.lineWidth = 1;
        for (let i = 0; i <= MAX_AXIS; i++) {
            const pBottom = mathToPixel(i, 0);
            const pTop = mathToPixel(i, MAX_AXIS);
            const pLeft = mathToPixel(0, i);
            const pRight = mathToPixel(MAX_AXIS, i);

            ctx.strokeStyle = (i % 5 === 0) ? '#cfd8dc' : '#f1f5f9';

            ctx.beginPath();
            ctx.moveTo(pBottom.x, pBottom.y);
            ctx.lineTo(pTop.x, pTop.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(pLeft.x, pLeft.y);
            ctx.lineTo(pRight.x, pRight.y);
            ctx.stroke();
        }

        // 2. Área Sombreada da Região Factível (100% Precisa via Clipping no 1º Quadrante)
        const status = checkFeasibility(x, y);
        const ptOrigin = mathToPixel(0, 0);
        const ptXInt = mathToPixel(tempoTurno / TEMPO_MESA, 0);
        const ptYInt = mathToPixel(0, tempoTurno / TEMPO_CADEIRA);

        ctx.save();
        // Limita o desenho à área visível do gráfico [0, MAX_AXIS] x [0, MAX_AXIS]
        ctx.beginPath();
        ctx.rect(b.padLeft, b.padTop, b.plotWidth, b.plotHeight);
        ctx.clip();

        ctx.beginPath();
        ctx.moveTo(ptOrigin.x, ptOrigin.y);
        ctx.lineTo(ptXInt.x, ptXInt.y);
        ctx.lineTo(ptYInt.x, ptYInt.y);
        ctx.closePath();

        if (status.isFeasible) {
            const glowAlpha = 0.28 + 0.08 * Math.sin(pulseTime * 0.08);
            ctx.fillStyle = `rgba(76, 175, 80, ${glowAlpha})`;
            ctx.fill();
        } else {
            ctx.fillStyle = 'rgba(2, 136, 209, 0.15)';
            ctx.fill();
        }
        ctx.restore();

        // 3. Reta de Fronteira do Tempo (Limitada ao Gráfico)
        ctx.save();
        ctx.beginPath();
        ctx.rect(b.padLeft, b.padTop, b.plotWidth, b.plotHeight);
        ctx.clip();

        if (isDraggingLine || isHoveringLine) {
            ctx.lineWidth = 9;
            ctx.strokeStyle = 'rgba(41, 182, 246, 0.4)';
            ctx.beginPath();
            ctx.moveTo(ptYInt.x, ptYInt.y);
            ctx.lineTo(ptXInt.x, ptXInt.y);
            ctx.stroke();
        }

        ctx.lineWidth = (isDraggingLine || isHoveringLine) ? 4.5 : 3.5;
        ctx.strokeStyle = (isDraggingLine || isHoveringLine) ? '#0277bd' : '#0288d1';
        ctx.beginPath();
        ctx.moveTo(ptYInt.x, ptYInt.y);
        ctx.lineTo(ptXInt.x, ptXInt.y);
        ctx.stroke();
        ctx.restore();

        // 4. Vértices e Pinos Notáveis nos Eixos
        const timeLine = getTimeLineEndpoints();
        const vertices = [];
        if (timeLine.rawYIntercept <= MAX_AXIS) vertices.push({ x: 0, y: timeLine.rawYIntercept });
        if (timeLine.rawXIntercept <= MAX_AXIS) vertices.push({ x: timeLine.rawXIntercept, y: 0 });
        vertices.forEach(v => {
            const p = mathToPixel(v.x, v.y);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#0288d1';
            ctx.stroke();
        });

        // 5. Eixos Cartesianos
        ctx.save();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#263238';
        ctx.beginPath();
        ctx.moveTo(b.padLeft, b.padTop + b.plotHeight);
        ctx.lineTo(b.w - 10, b.padTop + b.plotHeight);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(b.padLeft, b.padTop + b.plotHeight);
        ctx.lineTo(b.padLeft, 10);
        ctx.stroke();

        // Números e Marcações
        ctx.font = '700 11px Inter, sans-serif';
        ctx.fillStyle = '#455a64';
        ctx.textAlign = 'center';
        for (let i = 0; i <= MAX_AXIS; i += 5) {
            const p = mathToPixel(i, 0);
            ctx.fillText(i.toString(), p.x, p.y + 16);
        }
        ctx.textAlign = 'right';
        for (let i = 5; i <= MAX_AXIS; i += 5) {
            const p = mathToPixel(0, i);
            ctx.fillText(i.toString(), p.x - 8, p.y + 4);
        }

        // Rótulos dos Eixos
        ctx.font = '800 12px Inter, sans-serif';
        ctx.fillStyle = '#01579b';
        ctx.textAlign = 'right';
        ctx.fillText('Mesas (Eixo X) →', b.w - 16, b.padTop + b.plotHeight + 34);

        ctx.save();
        ctx.translate(14, b.padTop + 40);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#bf360c';
        ctx.textAlign = 'left';
        ctx.fillText('Cadeiras (Eixo Y) →', 0, 0);
        ctx.restore();
        ctx.restore();

        // 6. Marcador do Ponto de Decisão do Jogador (x, y)
        const playerPixel = mathToPixel(x, y);
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = status.isFeasible ? '#2e7d32' : '#d32f2f';
        ctx.beginPath();
        ctx.moveTo(playerPixel.x, playerPixel.y);
        ctx.lineTo(playerPixel.x, ptOrigin.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(playerPixel.x, playerPixel.y);
        ctx.lineTo(ptOrigin.x, playerPixel.y);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        const haloRadius = 14 + (isDraggingPoint ? 4 : 2) + Math.sin(pulseTime * 0.1) * 2;
        ctx.beginPath();
        ctx.arc(playerPixel.x, playerPixel.y, haloRadius, 0, Math.PI * 2);
        ctx.fillStyle = status.isFeasible ? 'rgba(76, 175, 80, 0.35)' : 'rgba(211, 47, 47, 0.25)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(playerPixel.x, playerPixel.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = status.isFeasible ? '#4caf50' : '#e53935';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(playerPixel.x, playerPixel.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffeb3b';
        ctx.fill();

        // Tooltip de Coordenadas (x, y)
        const tipText = `(${x}, ${y})`;
        ctx.font = '800 12px Inter, sans-serif';
        const tipWidth = ctx.measureText(tipText).width + 14;
        const tipHeight = 22;
        let tipX = playerPixel.x + 12;
        let tipY = playerPixel.y - 12;

        if (tipX + tipWidth > b.w - 10) tipX = playerPixel.x - tipWidth - 12;
        if (tipY - tipHeight < 10) tipY = playerPixel.y + 24;

        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.roundRect(tipX, tipY - tipHeight + 6, tipWidth, tipHeight, 4);
        ctx.fill();

        ctx.fillStyle = status.isFeasible ? '#69f0ae' : '#ffeb3b';
        ctx.textAlign = 'center';
        ctx.fillText(tipText, tipX + tipWidth / 2, tipY);
        ctx.restore();
    }

    // Partículas de Vitória
    function spawnVictorySparkles() {
        if (!cartesianWrapper) return;
        const colors = ['#4caf50', '#ffeb3b', '#29b6f6', '#ff9800', '#ffffff'];
        const target = mathToPixel(x, y);
        for (let i = 0; i < 16; i++) {
            const p = document.createElement('div');
            p.className = 'lego-particle';
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            p.style.left = `${target.x}px`;
            p.style.top = `${target.y}px`;
            const tx = (Math.random() - 0.5) * 140;
            const ty = (Math.random() - 0.5) * 140 - 20;
            p.style.setProperty('--tx', `${tx}px`);
            p.style.setProperty('--ty', `${ty}px`);
            cartesianWrapper.appendChild(p);
            setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, 800);
        }
    }

    // Atualização de Estado da Simulação
    function updateSimulation(source = 'general') {
        if (valMesas) valMesas.textContent = x;
        if (valCadeiras) valCadeiras.textContent = y;
        if (sliderMesas) sliderMesas.value = x;
        if (sliderCadeiras) sliderCadeiras.value = y;
        if (calcTempoX) calcTempoX.textContent = x;
        if (calcTempoY) calcTempoY.textContent = y;

        const horasTurno = (tempoTurno / 60).toFixed(1).replace('.0', '');
        if (lblTempoMax) lblTempoMax.textContent = `Máx: ${tempoTurno} min / ${horasTurno}h`;
        if (lblTempoMaxDenom) lblTempoMaxDenom.textContent = ` / ${tempoTurno} min`;
        if (legendTimeText) legendTimeText.textContent = `40x + 20y = ${tempoTurno}`;

        const xInt = (tempoTurno / TEMPO_MESA).toFixed(1).replace('.0', '');
        const yInt = (tempoTurno / TEMPO_CADEIRA).toFixed(1).replace('.0', '');
        if (didacticLine1) {
            didacticLine1.innerHTML = `• <strong>Reta de Fronteira:</strong> A equação <code>40x + 20y = ${tempoTurno}</code> liga os pontos (${xInt}, 0) e (0, ${yInt}). Ela divide o plano em dois lados.`;
        }

        const status = checkFeasibility(x, y);
        if (calcTempoTotal) calcTempoTotal.textContent = `${status.tempoVal} min`;
        const pctTempo = Math.min(100, (status.tempoVal / tempoTurno) * 100);
        if (meterTempo) meterTempo.style.width = `${pctTempo}%`;

        if (cardRestricaoTempo && badgeTempo) {
            if (status.passTempo) {
                cardRestricaoTempo.className = 'constraint-card pass';
                badgeTempo.className = 'constraint-status-badge pass';
                badgeTempo.textContent = 'Dentro do Turno';
            } else {
                cardRestricaoTempo.className = 'constraint-card fail';
                badgeTempo.className = 'constraint-status-badge fail';
                badgeTempo.textContent = 'Tempo Excedido';
            }
        }

        if (status.isFeasible) {
            if (assemblyStatusPill) assemblyStatusPill.className = 'status-pill active';
            if (assemblyStatusText) assemblyStatusText.textContent = 'PRODUÇÃO FACTÍVEL!';
            if (feedbackBanner) feedbackBanner.className = 'decision-feedback-banner feasible';
            if (feedbackBadge) feedbackBadge.textContent = '✅ PRODUÇÃO DENTRO DO TURNO!';
            if (feedbackText) {
                feedbackText.innerHTML = `Com <strong>${x} mesas</strong> e <strong>${y} cadeiras</strong>, a fábrica gasta <strong>${status.tempoVal} min ≤ ${tempoTurno} min</strong>. Esta decisão está <strong>dentro da Região Factível</strong> e respeita a capacidade total do turno!`;
            }
            if (source === 'drop' || source === 'line_drop') spawnVictorySparkles();
        } else {
            if (assemblyStatusPill) assemblyStatusPill.className = 'status-pill';
            if (assemblyStatusText) assemblyStatusText.textContent = 'TEMPO EXCEDIDO';
            if (feedbackBanner) feedbackBanner.className = 'decision-feedback-banner';
            if (feedbackBadge) feedbackBadge.textContent = '⏱️ TEMPO DE TURNO EXCEDIDO';
            if (feedbackText) {
                feedbackText.innerHTML = `Com <strong>${x} mesas</strong> e <strong>${y} cadeiras</strong>, o tempo necessário é de <strong>${status.tempoVal} min > ${tempoTurno} min</strong>. Essa produção ultrapassa o limite do turno (${tempoTurno} min) e fica <strong>fora da Região Factível</strong>!`;
            }
        }
        renderCanvas();
    }

    function animationLoop() {
        pulseTime++;
        renderCanvas();
        requestAnimationFrame(animationLoop);
    }

    // Manipulação de Eventos de Ponteiro (Mouse e Toque)
    function getPointerPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            px: clientX - rect.left,
            py: clientY - rect.top
        };
    }

    function handleLineDrag(px, py) {
        const mathPos = pixelToMathPrecise(px, py);
        let calculatedT = TEMPO_MESA * mathPos.x + TEMPO_CADEIRA * mathPos.y;
        
        calculatedT = Math.round(calculatedT / 10) * 10;
        calculatedT = Math.max(100, Math.min(720, calculatedT));

        if (calculatedT !== tempoTurno) {
            tempoTurno = calculatedT;
            updateSimulation('line_drag');
        }
    }

    function handlePointerDown(e) {
        const pos = getPointerPos(e);
        const playerPix = mathToPixel(x, y);
        const distToPoint = Math.hypot(pos.px - playerPix.x, pos.py - playerPix.y);

        const timeLine = getTimeLineEndpoints();
        const ptP1 = mathToPixel(timeLine.p1.x, timeLine.p1.y);
        const ptP2 = mathToPixel(timeLine.p2.x, timeLine.p2.y);
        const distToLine = distToSegment(pos.px, pos.py, ptP1.x, ptP1.y, ptP2.x, ptP2.y);

        if (distToLine < 26 && distToPoint >= 18) {
            isDraggingLine = true;
            isDraggingPoint = false;
            canvas.style.cursor = 'ns-resize';
            handleLineDrag(pos.px, pos.py);
        } else {
            isDraggingPoint = true;
            isDraggingLine = false;
            canvas.style.cursor = 'grabbing';
            const mathCoord = pixelToMath(pos.px, pos.py);
            x = mathCoord.x;
            y = mathCoord.y;
            updateSimulation('drag');
        }
    }

    function handlePointerMove(e) {
        const pos = getPointerPos(e);

        if (isDraggingPoint) {
            const mathCoord = pixelToMath(pos.px, pos.py);
            if (mathCoord.x !== x || mathCoord.y !== y) {
                x = mathCoord.x;
                y = mathCoord.y;
                updateSimulation('drag');
            }
        } else if (isDraggingLine) {
            handleLineDrag(pos.px, pos.py);
        } else {
            const playerPix = mathToPixel(x, y);
            const distToPoint = Math.hypot(pos.px - playerPix.x, pos.py - playerPix.y);

            const timeLine = getTimeLineEndpoints();
            const ptP1 = mathToPixel(timeLine.p1.x, timeLine.p1.y);
            const ptP2 = mathToPixel(timeLine.p2.x, timeLine.p2.y);
            const distToLine = distToSegment(pos.px, pos.py, ptP1.x, ptP1.y, ptP2.x, ptP2.y);

            if (distToPoint < 20) {
                canvas.style.cursor = 'grab';
                isHoveringLine = false;
            } else if (distToLine < 24) {
                canvas.style.cursor = 'ns-resize';
                isHoveringLine = true;
            } else {
                canvas.style.cursor = 'crosshair';
                isHoveringLine = false;
            }
        }
    }

    function handlePointerUp() {
        if (isDraggingPoint || isDraggingLine) {
            const wasLine = isDraggingLine;
            isDraggingPoint = false;
            isDraggingLine = false;
            canvas.style.cursor = 'crosshair';
            updateSimulation(wasLine ? 'line_drop' : 'drop');
        }
    }

    canvas.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    canvas.addEventListener('touchstart', (e) => {
        handlePointerDown(e);
        e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (isDraggingPoint || isDraggingLine) {
            handlePointerMove(e);
        }
    }, { passive: false });

    window.addEventListener('touchend', handlePointerUp);

    // Controles de Botões (+ / -) e Sliders
    if (btnMesasDec) {
        btnMesasDec.addEventListener('click', () => {
            if (x > 0) { x--; updateSimulation('drop'); }
        });
    }
    if (btnMesasInc) {
        btnMesasInc.addEventListener('click', () => {
            if (x < MAX_AXIS) { x++; updateSimulation('drop'); }
        });
    }
    if (sliderMesas) {
        sliderMesas.addEventListener('input', (e) => {
            x = parseInt(e.target.value, 10);
            updateSimulation('drag');
        });
        sliderMesas.addEventListener('change', () => {
            updateSimulation('drop');
        });
    }

    if (btnCadeirasDec) {
        btnCadeirasDec.addEventListener('click', () => {
            if (y > 0) { y--; updateSimulation('drop'); }
        });
    }
    if (btnCadeirasInc) {
        btnCadeirasInc.addEventListener('click', () => {
            if (y < MAX_AXIS) { y++; updateSimulation('drop'); }
        });
    }
    if (sliderCadeiras) {
        sliderCadeiras.addEventListener('input', (e) => {
            y = parseInt(e.target.value, 10);
            updateSimulation('drag');
        });
        sliderCadeiras.addEventListener('change', () => {
            updateSimulation('drop');
        });
    }

    // Redimensionamento de Janela
    window.addEventListener('resize', () => {
        setupCanvasDPI();
        renderCanvas();
    });

    // Inicialização
    setupCanvasDPI();
    updateSimulation('init');
    animationLoop();
}


/* ====================================================================
   CAPÍTULO 3: SETOR DE LOGÍSTICA (SISTEMA DE INEQUAÇÕES LINEARES)
   ==================================================================== */
function initSetorDeLogistica() {
    const canvas = document.getElementById('logisticaCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const cartesianWrapper = document.getElementById('cartesianWrapperLog');

    // Elementos de Controle (Mesas e Cadeiras)
    const valMesas = document.getElementById('valMesasLog');
    const valCadeiras = document.getElementById('valCadeirasLog');
    const btnMesasDec = document.getElementById('btnMesasDecLog');
    const btnMesasInc = document.getElementById('btnMesasIncLog');
    const btnCadeirasDec = document.getElementById('btnCadeirasDecLog');
    const btnCadeirasInc = document.getElementById('btnCadeirasIncLog');
    const sliderMesas = document.getElementById('sliderMesasLog');
    const sliderCadeiras = document.getElementById('sliderCadeirasLog');

    // Cards de Restrições (3 Inequações)
    // 1. Peso Mínimo (5x + 2y >= minWeightLimit)
    const cardMinWeight = document.getElementById('cardMinWeight');
    const badgeMinWeight = document.getElementById('badgeMinWeight');
    const calcMinWeightX = document.getElementById('calcMinWeightX');
    const calcMinWeightY = document.getElementById('calcMinWeightY');
    const calcMinWeightTotal = document.getElementById('calcMinWeightTotal');
    const lblMinWeightTarget = document.getElementById('lblMinWeightTarget');
    const valMinWeightLimit = document.getElementById('valMinWeightLimit');
    const sliderMinWeightLimit = document.getElementById('sliderMinWeightLimit');
    const btnMinWeightDec = document.getElementById('btnMinWeightDec');
    const btnMinWeightInc = document.getElementById('btnMinWeightInc');
    const meterMinWeight = document.getElementById('meterMinWeight');

    // 2. Peso Máximo (5x + 2y <= maxWeightLimit)
    const cardMaxWeight = document.getElementById('cardMaxWeight');
    const badgeMaxWeight = document.getElementById('badgeMaxWeight');
    const calcMaxWeightX = document.getElementById('calcMaxWeightX');
    const calcMaxWeightY = document.getElementById('calcMaxWeightY');
    const calcMaxWeightTotal = document.getElementById('calcMaxWeightTotal');
    const lblMaxWeightTarget = document.getElementById('lblMaxWeightTarget');
    const valMaxWeightLimit = document.getElementById('valMaxWeightLimit');
    const sliderMaxWeightLimit = document.getElementById('sliderMaxWeightLimit');
    const btnMaxWeightDec = document.getElementById('btnMaxWeightDec');
    const btnMaxWeightInc = document.getElementById('btnMaxWeightInc');
    const meterMaxWeight = document.getElementById('meterMaxWeight');

    // 3. Capacidade do Baú (x + y <= maxSpaceLimit)
    const cardMaxSpace = document.getElementById('cardMaxSpace');
    const badgeMaxSpace = document.getElementById('badgeMaxSpace');
    const calcSpaceX = document.getElementById('calcSpaceX');
    const calcSpaceY = document.getElementById('calcSpaceY');
    const calcSpaceTotal = document.getElementById('calcSpaceTotal');
    const lblMaxSpaceTarget = document.getElementById('lblMaxSpaceTarget');
    const valMaxSpaceLimit = document.getElementById('valMaxSpaceLimit');
    const sliderMaxSpaceLimit = document.getElementById('sliderMaxSpaceLimit');
    const btnMaxSpaceDec = document.getElementById('btnMaxSpaceDec');
    const btnMaxSpaceInc = document.getElementById('btnMaxSpaceInc');
    const meterMaxSpace = document.getElementById('meterMaxSpace');

    // Botão de Ação: Despachar Caminhão
    const btnDespachar = document.getElementById('btnDespachar');
    const btnDespacharIcon = document.getElementById('btnDespacharIcon');
    const btnDespacharText = document.getElementById('btnDespacharText');
    const dispatchStatusNote = document.getElementById('dispatchStatusNote');

    // Feedback e Status
    const feedbackBanner = document.getElementById('feedbackBannerLog');
    const feedbackBadge = document.getElementById('feedbackBadgeLog');
    const feedbackText = document.getElementById('feedbackTextLog');
    const logisticsStatusPill = document.getElementById('logisticsStatusPill');
    const logisticsStatusText = document.getElementById('logisticsStatusText');

    // Toggles de Camadas
    const toggleMinWeight = document.getElementById('toggleMinWeight');
    const toggleMaxWeight = document.getElementById('toggleMaxWeight');
    const toggleSpace = document.getElementById('toggleSpace');
    const labelToggleMinWeight = document.getElementById('labelToggleMinWeight');
    const labelToggleMaxWeight = document.getElementById('labelToggleMaxWeight');
    const labelToggleSpace = document.getElementById('labelToggleSpace');
    const tagMinWeightFormula = document.getElementById('tagMinWeightFormula');
    const tagMaxWeightFormula = document.getElementById('tagMaxWeightFormula');
    const tagSpaceFormula = document.getElementById('tagSpaceFormula');
    const legendMinWeightText = document.getElementById('legendMinWeightText');
    const legendMaxWeightText = document.getElementById('legendMaxWeightText');
    const legendSpaceText = document.getElementById('legendSpaceText');

    // Modal de Despacho
    const dispatchModal = document.getElementById('dispatchModal');
    const btnModalClose = document.getElementById('btnModalClose');
    const modalMesas = document.getElementById('modalMesas');
    const modalCadeiras = document.getElementById('modalCadeiras');
    const modalPeso = document.getElementById('modalPeso');
    const modalEspaco = document.getElementById('modalEspaco');

    // Constantes do Modelo e Valores Padrão Originais
    const MAX_AXIS = 80;
    const PESO_MESA = 5;
    const PESO_CADEIRA = 2;
    const DEFAULT_MIN_WEIGHT = 100;
    const DEFAULT_MAX_WEIGHT = 250;
    const DEFAULT_MAX_SPACE = 60;

    // Limites Dinâmicos das Restrições
    let minWeightLimit = DEFAULT_MIN_WEIGHT; // Piso financeiro (30 a 180 kg)
    let maxWeightLimit = DEFAULT_MAX_WEIGHT; // Teto da polícia (120 a 380 kg)
    let maxSpaceLimit = DEFAULT_MAX_SPACE;   // Capacidade do baú (20 a 80 móveis)

    // Estado da Simulação
    let x = 10;
    let y = 10;
    let dragMode = null; // 'point' | 'lineMin' | 'lineMax' | 'lineSpace' | null
    let pulseTime = 0;

    let showMinWeight = true;
    let showMaxWeight = true;
    let showSpace = true;

    // Configuração DPI do Canvas
    function setupCanvasDPI() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const width = rect.width || 600;
        const height = Math.min(width * 0.9, 520);

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }

    function getPlotBounds() {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const padLeft = 45;
        const padBottom = 42;
        const padRight = 24;
        const padTop = 24;

        const plotWidth = w - padLeft - padRight;
        const plotHeight = h - padTop - padBottom;

        return { padLeft, padBottom, padRight, padTop, plotWidth, plotHeight, w, h };
    }

    function mathToPixel(mx, my) {
        const b = getPlotBounds();
        const px = b.padLeft + (mx / MAX_AXIS) * b.plotWidth;
        const py = b.padTop + (1 - my / MAX_AXIS) * b.plotHeight;
        return { x: px, y: py };
    }

    function pixelToMath(px, py) {
        const b = getPlotBounds();
        let mx = ((px - b.padLeft) / b.plotWidth) * MAX_AXIS;
        let my = (1 - (py - b.padTop) / b.plotHeight) * MAX_AXIS;

        mx = Math.max(0, Math.min(MAX_AXIS, Math.round(mx)));
        my = Math.max(0, Math.min(MAX_AXIS, Math.round(my)));

        return { x: mx, y: my };
    }

    function pixelToMathPrecise(px, py) {
        const b = getPlotBounds();
        let mx = ((px - b.padLeft) / b.plotWidth) * MAX_AXIS;
        let my = (1 - (py - b.padTop) / b.plotHeight) * MAX_AXIS;
        return { x: mx, y: my };
    }

    // Geometria e Clipping de Polígonos Convexos (Sutherland-Hodgman)
    const BOX = [
        { x: 0, y: 0 },
        { x: MAX_AXIS, y: 0 },
        { x: MAX_AXIS, y: MAX_AXIS },
        { x: 0, y: MAX_AXIS }
    ];

    function clipPolygon(poly, a, b, c, isGreater) {
        if (!poly || poly.length === 0) return [];
        const isInside = (p) => {
            const val = a * p.x + b * p.y;
            return isGreater ? (val >= c - 1e-6) : (val <= c + 1e-6);
        };

        const intersection = (p1, p2) => {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const denom = a * dx + b * dy;
            if (Math.abs(denom) < 1e-9) return { x: p1.x, y: p1.y };
            const t = (c - (a * p1.x + b * p1.y)) / denom;
            return {
                x: Math.max(0, Math.min(MAX_AXIS, p1.x + t * dx)),
                y: Math.max(0, Math.min(MAX_AXIS, p1.y + t * dy))
            };
        };

        const output = [];
        let s = poly[poly.length - 1];
        for (let i = 0; i < poly.length; i++) {
            const p = poly[i];
            if (isInside(p)) {
                if (!isInside(s)) {
                    output.push(intersection(s, p));
                }
                output.push(p);
            } else if (isInside(s)) {
                output.push(intersection(s, p));
            }
            s = p;
        }
        return output;
    }

    function getLineEndpointsInBox(a, b, c) {
        const candidates = [];
        if (Math.abs(b) > 1e-9) {
            const y0 = c / b;
            if (y0 >= -1e-6 && y0 <= MAX_AXIS + 1e-6) {
                candidates.push({ x: 0, y: Math.max(0, Math.min(MAX_AXIS, y0)) });
            }
            const yMax = (c - a * MAX_AXIS) / b;
            if (yMax >= -1e-6 && yMax <= MAX_AXIS + 1e-6) {
                candidates.push({ x: MAX_AXIS, y: Math.max(0, Math.min(MAX_AXIS, yMax)) });
            }
        }
        if (Math.abs(a) > 1e-9) {
            const x0 = c / a;
            if (x0 >= -1e-6 && x0 <= MAX_AXIS + 1e-6) {
                candidates.push({ x: Math.max(0, Math.min(MAX_AXIS, x0)), y: 0 });
            }
            const xMax = (c - b * MAX_AXIS) / a;
            if (xMax >= -1e-6 && xMax <= MAX_AXIS + 1e-6) {
                candidates.push({ x: Math.max(0, Math.min(MAX_AXIS, xMax)), y: MAX_AXIS });
            }
        }

        const unique = [];
        for (const pt of candidates) {
            if (!unique.some(u => Math.hypot(u.x - pt.x, u.y - pt.y) < 1e-3)) {
                unique.push(pt);
            }
        }

        return unique.length >= 2 ? [unique[0], unique[1]] : null;
    }

    function drawPolygon(points, fillStyle, strokeStyle, isDashed = false) {
        if (!points || points.length < 3) return;
        ctx.save();
        ctx.beginPath();
        const start = mathToPixel(points[0].x, points[0].y);
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < points.length; i++) {
            const p = mathToPixel(points[i].x, points[i].y);
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }
        if (strokeStyle) {
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = strokeStyle;
            if (isDashed) ctx.setLineDash([5, 4]);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawBoundaryLine(pts, strokeStyle) {
        if (!pts || pts.length < 2) return;
        const p1 = mathToPixel(pts[0].x, pts[0].y);
        const p2 = mathToPixel(pts[1].x, pts[1].y);
        ctx.save();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = strokeStyle;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
    }

    // Avaliação de Conformidade das Restrições
    function checkLogisticsFeasibility(mx, my) {
        const peso = PESO_MESA * mx + PESO_CADEIRA * my;
        const espaco = mx + my;

        const passMinWeight = peso >= minWeightLimit;
        const passMaxWeight = peso <= maxWeightLimit;
        const passSpace = espaco <= maxSpaceLimit;
        const passNonNeg = mx >= 0 && my >= 0;

        const isFeasible = passMinWeight && passMaxWeight && passSpace && passNonNeg;

        return {
            peso,
            espaco,
            passMinWeight,
            passMaxWeight,
            passSpace,
            isFeasible
        };
    }

    // Renderização no Canvas
    function renderCanvas() {
        const b = getPlotBounds();
        if (b.plotWidth <= 0 || b.plotHeight <= 0) return;

        ctx.clearRect(0, 0, b.w, b.h);

        // 1. Grade de Fundo (A cada 10 unidades)
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#e2e8f0';
        for (let i = 10; i <= MAX_AXIS; i += 10) {
            const pX = mathToPixel(i, 0);
            ctx.beginPath();
            ctx.moveTo(pX.x, b.padTop);
            ctx.lineTo(pX.x, b.padTop + b.plotHeight);
            ctx.stroke();

            const pY = mathToPixel(0, i);
            ctx.beginPath();
            ctx.moveTo(b.padLeft, pY.y);
            ctx.lineTo(b.padLeft + b.plotWidth, pY.y);
            ctx.stroke();
        }
        ctx.restore();

        // Limita o desenho à área útil do primeiro quadrante
        ctx.save();
        ctx.beginPath();
        ctx.rect(b.padLeft, b.padTop, b.plotWidth, b.plotHeight);
        ctx.clip();

        // 2. Camada 1: Verde (Peso Mínimo >= minWeightLimit)
        if (showMinWeight) {
            const polyMin = clipPolygon(BOX, 5, 2, minWeightLimit, true);
            drawPolygon(polyMin, 'rgba(46, 125, 50, 0.22)', null);
            const lineMin = getLineEndpointsInBox(5, 2, minWeightLimit);
            drawBoundaryLine(lineMin, '#2e7d32');
        }

        // 3. Camada 2: Vermelha (Peso Máximo <= maxWeightLimit)
        if (showMaxWeight) {
            const polyMax = clipPolygon(BOX, 5, 2, maxWeightLimit, false);
            drawPolygon(polyMax, 'rgba(239, 83, 80, 0.22)', null);
            const lineMax = getLineEndpointsInBox(5, 2, maxWeightLimit);
            drawBoundaryLine(lineMax, '#c62828');
        }

        // 4. Camada 3: Amarela (Capacidade Máxima <= maxSpaceLimit)
        if (showSpace) {
            const polySpace = clipPolygon(BOX, 1, 1, maxSpaceLimit, false);
            drawPolygon(polySpace, 'rgba(234, 179, 8, 0.22)', null);
            const lineSpace = getLineEndpointsInBox(1, 1, maxSpaceLimit);
            drawBoundaryLine(lineSpace, '#ca8a04');
        }

        // 5. Destaque Especial da Região Factível (Interseção das 3 Inequações)
        if (showMinWeight && showMaxWeight && showSpace) {
            let feasiblePoly = BOX;
            feasiblePoly = clipPolygon(feasiblePoly, 5, 2, minWeightLimit, true);
            feasiblePoly = clipPolygon(feasiblePoly, 5, 2, maxWeightLimit, false);
            feasiblePoly = clipPolygon(feasiblePoly, 1, 1, maxSpaceLimit, false);

            if (feasiblePoly.length >= 3) {
                drawPolygon(feasiblePoly, 'rgba(34, 197, 94, 0.16)', '#15803d', true);

                let cx = 0, cy = 0;
                for (const pt of feasiblePoly) {
                    cx += pt.x;
                    cy += pt.y;
                }
                cx /= feasiblePoly.length;
                cy /= feasiblePoly.length;

                const labelPos = mathToPixel(cx, cy);
                ctx.save();
                ctx.font = '800 11px Inter, sans-serif';
                ctx.fillStyle = '#14532d';
                ctx.textAlign = 'center';
                ctx.fillText('REGIÃO FACTÍVEL', labelPos.x, labelPos.y);
                ctx.restore();
            }
        }

        ctx.restore(); // Fecha o clip da área do gráfico

        // 6. Eixos Cartesianos e Escalas
        ctx.save();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#263238';
        ctx.beginPath();
        // Eixo X
        ctx.moveTo(b.padLeft, b.padTop + b.plotHeight);
        ctx.lineTo(b.w - 10, b.padTop + b.plotHeight);
        ctx.stroke();
        // Eixo Y
        ctx.beginPath();
        ctx.moveTo(b.padLeft, b.padTop + b.plotHeight);
        ctx.lineTo(b.padLeft, 10);
        ctx.stroke();

        // Numeração dos Eixos (A cada 10 unidades)
        ctx.font = '700 11px Inter, sans-serif';
        ctx.fillStyle = '#455a64';
        ctx.textAlign = 'center';
        for (let i = 0; i <= MAX_AXIS; i += 10) {
            const p = mathToPixel(i, 0);
            ctx.fillText(i.toString(), p.x, p.y + 16);
        }

        ctx.textAlign = 'right';
        for (let i = 10; i <= MAX_AXIS; i += 10) {
            const p = mathToPixel(0, i);
            ctx.fillText(i.toString(), p.x - 8, p.y + 4);
        }

        // Rótulos dos Eixos
        ctx.font = '800 12px Inter, sans-serif';
        ctx.fillStyle = '#01579b';
        ctx.textAlign = 'right';
        ctx.fillText('Mesas (Eixo X) →', b.w - 16, b.padTop + b.plotHeight + 34);

        ctx.save();
        ctx.translate(14, b.padTop + 40);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#bf360c';
        ctx.textAlign = 'left';
        ctx.fillText('Cadeiras (Eixo Y) →', 0, 0);
        ctx.restore();
        ctx.restore();

        // 7. Marcador da Decisão Atual (x, y)
        const status = checkLogisticsFeasibility(x, y);
        const playerPixel = mathToPixel(x, y);
        const ptOrigin = mathToPixel(0, 0);

        // Linhas de Projeção tracejadas
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = status.isFeasible ? '#16a34a' : '#dc2626';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(playerPixel.x, playerPixel.y);
        ctx.lineTo(playerPixel.x, ptOrigin.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(playerPixel.x, playerPixel.y);
        ctx.lineTo(ptOrigin.x, playerPixel.y);
        ctx.stroke();
        ctx.restore();

        // Halo pulsante
        ctx.save();
        const haloRadius = 14 + (dragMode === 'point' ? 4 : 2) + Math.sin(pulseTime * 0.1) * 2;
        ctx.beginPath();
        ctx.arc(playerPixel.x, playerPixel.y, haloRadius, 0, Math.PI * 2);
        ctx.fillStyle = status.isFeasible ? 'rgba(74, 222, 128, 0.4)' : 'rgba(248, 113, 113, 0.35)';
        ctx.fill();

        // Ponto Principal
        ctx.beginPath();
        ctx.arc(playerPixel.x, playerPixel.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = status.isFeasible ? '#16a34a' : '#dc2626';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(playerPixel.x, playerPixel.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffeb3b';
        ctx.fill();

        // Tooltip Informativo
        const tipText = `(${x}, ${y}) • ${status.peso} kg • ${status.espaco} un`;
        ctx.font = '800 11px Inter, sans-serif';
        const tipWidth = ctx.measureText(tipText).width + 16;
        const tipHeight = 22;
        let tipX = playerPixel.x + 12;
        let tipY = playerPixel.y - 12;

        if (tipX + tipWidth > b.w - 10) tipX = playerPixel.x - tipWidth - 12;
        if (tipY - tipHeight < 10) tipY = playerPixel.y + 26;

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(tipX, tipY - tipHeight + 6, tipWidth, tipHeight, 5);
        ctx.fill();

        ctx.fillStyle = status.isFeasible ? '#4ade80' : '#fca5a5';
        ctx.textAlign = 'center';
        ctx.fillText(tipText, tipX + tipWidth / 2, tipY);
        ctx.restore();
    }

    // Partículas de Sucesso
    function spawnLogisticsSparkles() {
        if (!cartesianWrapper) return;
        const colors = ['#22c55e', '#ffeb3b', '#3b82f6', '#f97316', '#ffffff'];
        const target = mathToPixel(x, y);
        for (let i = 0; i < 24; i++) {
            const p = document.createElement('div');
            p.className = 'lego-particle';
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            p.style.left = `${target.x}px`;
            p.style.top = `${target.y}px`;
            const tx = (Math.random() - 0.5) * 180;
            const ty = (Math.random() - 0.5) * 180 - 20;
            p.style.setProperty('--tx', `${tx}px`);
            p.style.setProperty('--ty', `${ty}px`);
            cartesianWrapper.appendChild(p);
            setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, 900);
        }
    }

    // Atualização de Interface
    function updateSimulation(source = 'general') {
        if (valMesas) valMesas.textContent = x;
        if (valCadeiras) valCadeiras.textContent = y;
        if (sliderMesas) sliderMesas.value = x;
        if (sliderCadeiras) sliderCadeiras.value = y;

        // Atualização dos Limites Dinâmicos
        if (lblMinWeightTarget) lblMinWeightTarget.textContent = minWeightLimit;
        if (valMinWeightLimit) valMinWeightLimit.textContent = `${minWeightLimit} kg`;
        if (sliderMinWeightLimit) sliderMinWeightLimit.value = minWeightLimit;
        if (tagMinWeightFormula) tagMinWeightFormula.textContent = `5x + 2y ≥ ${minWeightLimit} kg (Regra Financeira)`;

        if (lblMaxWeightTarget) lblMaxWeightTarget.textContent = maxWeightLimit;
        if (valMaxWeightLimit) valMaxWeightLimit.textContent = `${maxWeightLimit} kg`;
        if (sliderMaxWeightLimit) sliderMaxWeightLimit.value = maxWeightLimit;
        if (tagMaxWeightFormula) tagMaxWeightFormula.textContent = `5x + 2y ≤ ${maxWeightLimit} kg (Regra da Polícia)`;

        if (lblMaxSpaceTarget) lblMaxSpaceTarget.textContent = maxSpaceLimit;
        if (valMaxSpaceLimit) valMaxSpaceLimit.textContent = `${maxSpaceLimit} móveis`;
        if (sliderMaxSpaceLimit) sliderMaxSpaceLimit.value = maxSpaceLimit;
        if (tagSpaceFormula) tagSpaceFormula.textContent = `x + y ≤ ${maxSpaceLimit} móveis (Regra do Baú)`;

        // Atualização da Legenda do Gráfico
        if (legendMinWeightText) legendMinWeightText.textContent = `5x + 2y ≥ ${minWeightLimit} (Mín. ${minWeightLimit}kg)`;
        if (legendMaxWeightText) legendMaxWeightText.textContent = `5x + 2y ≤ ${maxWeightLimit} (Máx. ${maxWeightLimit}kg)`;
        if (legendSpaceText) legendSpaceText.textContent = `x + y ≤ ${maxSpaceLimit} (Máx. ${maxSpaceLimit} un)`;

        const status = checkLogisticsFeasibility(x, y);

        // 1. Atualização: Regra Financeira (Mín. minWeightLimit kg)
        if (calcMinWeightX) calcMinWeightX.textContent = x;
        if (calcMinWeightY) calcMinWeightY.textContent = y;
        if (calcMinWeightTotal) calcMinWeightTotal.textContent = `${status.peso} kg`;
        const pctMinWeight = Math.min(100, (status.peso / minWeightLimit) * 100);
        if (meterMinWeight) meterMinWeight.style.width = `${pctMinWeight}%`;

        if (cardMinWeight && badgeMinWeight) {
            if (status.passMinWeight) {
                cardMinWeight.className = 'constraint-card pass';
                badgeMinWeight.className = 'constraint-status-badge pass';
                badgeMinWeight.textContent = `Atingido (≥ ${minWeightLimit} kg)`;
            } else {
                cardMinWeight.className = 'constraint-card fail';
                badgeMinWeight.className = 'constraint-status-badge fail';
                badgeMinWeight.textContent = `Abaixo do Mínimo (< ${minWeightLimit} kg)`;
            }
        }

        // 2. Atualização: Regra da Polícia (Máx. maxWeightLimit kg)
        if (calcMaxWeightX) calcMaxWeightX.textContent = x;
        if (calcMaxWeightY) calcMaxWeightY.textContent = y;
        if (calcMaxWeightTotal) calcMaxWeightTotal.textContent = `${status.peso} kg`;
        const pctMaxWeight = Math.min(100, (status.peso / maxWeightLimit) * 100);
        if (meterMaxWeight) meterMaxWeight.style.width = `${pctMaxWeight}%`;

        if (cardMaxWeight && badgeMaxWeight) {
            if (status.passMaxWeight) {
                cardMaxWeight.className = 'constraint-card pass';
                badgeMaxWeight.className = 'constraint-status-badge pass';
                badgeMaxWeight.textContent = `Peso Permitido (≤ ${maxWeightLimit} kg)`;
            } else {
                cardMaxWeight.className = 'constraint-card fail';
                badgeMaxWeight.className = 'constraint-status-badge fail';
                badgeMaxWeight.textContent = `Excesso de Peso (> ${maxWeightLimit} kg)`;
            }
        }

        // 3. Atualização: Regra do Baú (Máx. maxSpaceLimit móveis)
        if (calcSpaceX) calcSpaceX.textContent = x;
        if (calcSpaceY) calcSpaceY.textContent = y;
        if (calcSpaceTotal) calcSpaceTotal.textContent = `${status.espaco} móveis`;
        const pctSpace = Math.min(100, (status.espaco / maxSpaceLimit) * 100);
        if (meterMaxSpace) meterMaxSpace.style.width = `${pctSpace}%`;

        if (cardMaxSpace && badgeMaxSpace) {
            if (status.passSpace) {
                cardMaxSpace.className = 'constraint-card pass';
                badgeMaxSpace.className = 'constraint-status-badge pass';
                badgeMaxSpace.textContent = `Cabe no Baú (≤ ${maxSpaceLimit} un)`;
            } else {
                cardMaxSpace.className = 'constraint-card fail';
                badgeMaxSpace.className = 'constraint-status-badge fail';
                badgeMaxSpace.textContent = `Baú Lotado (> ${maxSpaceLimit} un)`;
            }
        }

        // Atualização do Botão "Despachar Caminhão" e Banners de Decisão
        if (status.isFeasible) {
            if (btnDespachar) {
                btnDespachar.disabled = false;
                btnDespachar.classList.add('ready');
            }
            if (btnDespacharIcon) btnDespacharIcon.textContent = '🚚';
            if (btnDespacharText) btnDespacharText.textContent = 'Despachar Caminhão';
            if (dispatchStatusNote) {
                dispatchStatusNote.className = 'dispatch-status-note ready';
                dispatchStatusNote.textContent = '✅ Carga aprovada em todas as restrições! Pronto para despachar.';
            }

            if (logisticsStatusPill) logisticsStatusPill.className = 'status-pill active';
            if (logisticsStatusText) logisticsStatusText.textContent = 'CARGA FACTÍVEL!';

            if (feedbackBanner) feedbackBanner.className = 'decision-feedback-banner feasible';
            if (feedbackBadge) feedbackBadge.textContent = '✅ CARGA FACTÍVEL APROVADA!';
            if (feedbackText) {
                feedbackText.innerHTML = `Com <strong>${x} mesas</strong> e <strong>${y} cadeiras</strong>: o peso é de <strong>${status.peso} kg</strong> (entre ${minWeightLimit} kg e ${maxWeightLimit} kg) e o volume é de <strong>${status.espaco} de ${maxSpaceLimit} móveis</strong>. O ponto <strong>(${x}, ${y}) está na Região Factível</strong>!`;
            }

            if (source === 'drop') spawnLogisticsSparkles();
        } else {
            if (btnDespachar) {
                btnDespachar.disabled = true;
                btnDespachar.classList.remove('ready');
            }
            if (btnDespacharIcon) btnDespacharIcon.textContent = '🔒';
            if (btnDespacharText) btnDespacharText.textContent = 'Despachar Caminhão (Bloqueado)';
            if (dispatchStatusNote) {
                dispatchStatusNote.className = 'dispatch-status-note';
                dispatchStatusNote.textContent = '⚠️ Para liberar o despacho, a carga deve cumprir as 3 regras simultaneamente (Região Factível).';
            }

            if (logisticsStatusPill) logisticsStatusPill.className = 'status-pill';
            if (logisticsStatusText) logisticsStatusText.textContent = 'CARGA BLOQUEADA';

            if (feedbackBanner) feedbackBanner.className = 'decision-feedback-banner';
            if (feedbackBadge) feedbackBadge.textContent = '⚠️ CARGA FORA DOS LIMITES';

            const falhas = [];
            if (!status.passMinWeight) falhas.push(`o peso atual de ${status.peso} kg é inferior ao piso financeiro de ${minWeightLimit} kg`);
            if (!status.passMaxWeight) falhas.push(`o peso atual de ${status.peso} kg ultrapassa o teto policial de ${maxWeightLimit} kg`);
            if (!status.passSpace) falhas.push(`o total de ${status.espaco} móveis excede o baú de ${maxSpaceLimit} unidades`);

            if (feedbackText) {
                feedbackText.innerHTML = `A combinação de <strong>${x} mesas</strong> e <strong>${y} cadeiras</strong> não pode ser despachada pois ${falhas.join(' e ')}. O ponto <strong>(${x}, ${y}) está fora da Região Factível</strong>!`;
            }
        }

        renderCanvas();
    }

    function animationLoop() {
        pulseTime++;
        renderCanvas();
        requestAnimationFrame(animationLoop);
    }

    // Interações de Ponteiro (Mouse e Touch no Canvas)
    function getPointerPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            px: clientX - rect.left,
            py: clientY - rect.top
        };
    }

    function detectTarget(px, py) {
        const playerPix = mathToPixel(x, y);
        if (Math.hypot(px - playerPix.x, py - playerPix.y) < 18) {
            return 'point';
        }
        // Test lines in order: MinWeight, MaxWeight, Space
        if (showMinWeight) {
            const l = getLineEndpointsInBox(5, 2, minWeightLimit);
            if (l) {
                const p1 = mathToPixel(l[0].x, l[0].y);
                const p2 = mathToPixel(l[1].x, l[1].y);
                if (distToSegment(px, py, p1.x, p1.y, p2.x, p2.y) < 10) return 'lineMin';
            }
        }
        if (showMaxWeight) {
            const l = getLineEndpointsInBox(5, 2, maxWeightLimit);
            if (l) {
                const p1 = mathToPixel(l[0].x, l[0].y);
                const p2 = mathToPixel(l[1].x, l[1].y);
                if (distToSegment(px, py, p1.x, p1.y, p2.x, p2.y) < 10) return 'lineMax';
            }
        }
        if (showSpace) {
            const l = getLineEndpointsInBox(1, 1, maxSpaceLimit);
            if (l) {
                const p1 = mathToPixel(l[0].x, l[0].y);
                const p2 = mathToPixel(l[1].x, l[1].y);
                if (distToSegment(px, py, p1.x, p1.y, p2.x, p2.y) < 10) return 'lineSpace';
            }
        }
        return null;
    }

    function handlePointerDown(e) {
        const pos = getPointerPos(e);
        const target = detectTarget(pos.px, pos.py);
        if (target) {
            dragMode = target;
        } else {
            dragMode = 'point';
            const mathCoord = pixelToMath(pos.px, pos.py);
            x = mathCoord.x;
            y = mathCoord.y;
            updateSimulation('drag');
        }
    }

    function handlePointerMove(e) {
        const pos = getPointerPos(e);
        if (dragMode) {
            const precise = pixelToMathPrecise(pos.px, pos.py);
            if (dragMode === 'point') {
                const mathCoord = pixelToMath(pos.px, pos.py);
                if (mathCoord.x !== x || mathCoord.y !== y) {
                    x = mathCoord.x;
                    y = mathCoord.y;
                    updateSimulation('drag');
                }
            } else if (dragMode === 'lineMin') {
                const rawVal = 5 * precise.x + 2 * precise.y;
                const rounded = Math.round(rawVal / 5) * 5;
                const clamped = Math.max(30, Math.min(180, rounded));
                if (clamped !== minWeightLimit) {
                    minWeightLimit = clamped;
                    updateSimulation('drag');
                }
            } else if (dragMode === 'lineMax') {
                const rawVal = 5 * precise.x + 2 * precise.y;
                const rounded = Math.round(rawVal / 10) * 10;
                const clamped = Math.max(120, Math.min(380, rounded));
                if (clamped !== maxWeightLimit) {
                    maxWeightLimit = clamped;
                    updateSimulation('drag');
                }
            } else if (dragMode === 'lineSpace') {
                const rawVal = precise.x + precise.y;
                const rounded = Math.round(rawVal / 5) * 5;
                const clamped = Math.max(20, Math.min(80, rounded));
                if (clamped !== maxSpaceLimit) {
                    maxSpaceLimit = clamped;
                    updateSimulation('drag');
                }
            }
        } else {
            const target = detectTarget(pos.px, pos.py);
            if (target === 'point') {
                canvas.style.cursor = 'grab';
            } else if (target) {
                canvas.style.cursor = 'ns-resize';
            } else {
                canvas.style.cursor = 'crosshair';
            }
        }
    }

    function handlePointerUp() {
        if (dragMode) {
            dragMode = null;
            canvas.style.cursor = 'crosshair';
            updateSimulation('drop');
        }
    }

    canvas.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    canvas.addEventListener('touchstart', (e) => {
        handlePointerDown(e);
        e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (dragMode) {
            handlePointerMove(e);
        }
    }, { passive: false });

    window.addEventListener('touchend', handlePointerUp);

    // Controles de Steppers e Sliders das Variáveis (Mesas e Cadeiras)
    if (btnMesasDec) {
        btnMesasDec.addEventListener('click', () => {
            if (x > 0) { x--; updateSimulation('drop'); }
        });
    }
    if (btnMesasInc) {
        btnMesasInc.addEventListener('click', () => {
            if (x < MAX_AXIS) { x++; updateSimulation('drop'); }
        });
    }
    if (sliderMesas) {
        sliderMesas.addEventListener('input', (e) => {
            x = parseInt(e.target.value, 10);
            updateSimulation('drag');
        });
        sliderMesas.addEventListener('change', () => {
            updateSimulation('drop');
        });
    }

    if (btnCadeirasDec) {
        btnCadeirasDec.addEventListener('click', () => {
            if (y > 0) { y--; updateSimulation('drop'); }
        });
    }
    if (btnCadeirasInc) {
        btnCadeirasInc.addEventListener('click', () => {
            if (y < MAX_AXIS) { y++; updateSimulation('drop'); }
        });
    }
    if (sliderCadeiras) {
        sliderCadeiras.addEventListener('input', (e) => {
            y = parseInt(e.target.value, 10);
            updateSimulation('drag');
        });
        sliderCadeiras.addEventListener('change', () => {
            updateSimulation('drop');
        });
    }

    // Controles de Sliders e Steppers dos Limites das Restrições
    // 1. Limite Mínimo de Peso
    if (btnMinWeightDec) {
        btnMinWeightDec.addEventListener('click', () => {
            if (minWeightLimit > 30) {
                minWeightLimit = Math.max(30, minWeightLimit - 5);
                updateSimulation('drop');
            }
        });
    }
    if (btnMinWeightInc) {
        btnMinWeightInc.addEventListener('click', () => {
            if (minWeightLimit < 180) {
                minWeightLimit = Math.min(180, minWeightLimit + 5);
                updateSimulation('drop');
            }
        });
    }
    if (sliderMinWeightLimit) {
        sliderMinWeightLimit.addEventListener('input', (e) => {
            minWeightLimit = parseInt(e.target.value, 10);
            updateSimulation('drag');
        });
        sliderMinWeightLimit.addEventListener('change', () => {
            updateSimulation('drop');
        });
    }

    // 2. Limite Máximo de Peso
    if (btnMaxWeightDec) {
        btnMaxWeightDec.addEventListener('click', () => {
            if (maxWeightLimit > 120) {
                maxWeightLimit = Math.max(120, maxWeightLimit - 10);
                updateSimulation('drop');
            }
        });
    }
    if (btnMaxWeightInc) {
        btnMaxWeightInc.addEventListener('click', () => {
            if (maxWeightLimit < 380) {
                maxWeightLimit = Math.min(380, maxWeightLimit + 10);
                updateSimulation('drop');
            }
        });
    }
    if (sliderMaxWeightLimit) {
        sliderMaxWeightLimit.addEventListener('input', (e) => {
            maxWeightLimit = parseInt(e.target.value, 10);
            updateSimulation('drag');
        });
        sliderMaxWeightLimit.addEventListener('change', () => {
            updateSimulation('drop');
        });
    }

    // 3. Capacidade Máxima do Baú
    if (btnMaxSpaceDec) {
        btnMaxSpaceDec.addEventListener('click', () => {
            if (maxSpaceLimit > 20) {
                maxSpaceLimit = Math.max(20, maxSpaceLimit - 5);
                updateSimulation('drop');
            }
        });
    }
    if (btnMaxSpaceInc) {
        btnMaxSpaceInc.addEventListener('click', () => {
            if (maxSpaceLimit < 80) {
                maxSpaceLimit = Math.min(80, maxSpaceLimit + 5);
                updateSimulation('drop');
            }
        });
    }
    if (sliderMaxSpaceLimit) {
        sliderMaxSpaceLimit.addEventListener('input', (e) => {
            maxSpaceLimit = parseInt(e.target.value, 10);
            updateSimulation('drag');
        });
        sliderMaxSpaceLimit.addEventListener('change', () => {
            updateSimulation('drop');
        });
    }

    // Toggles de Camadas de Inequações
    if (toggleMinWeight) {
        toggleMinWeight.addEventListener('change', (e) => {
            showMinWeight = e.target.checked;
            if (labelToggleMinWeight) labelToggleMinWeight.classList.toggle('active', showMinWeight);
            renderCanvas();
        });
    }
    if (toggleMaxWeight) {
        toggleMaxWeight.addEventListener('change', (e) => {
            showMaxWeight = e.target.checked;
            if (labelToggleMaxWeight) labelToggleMaxWeight.classList.toggle('active', showMaxWeight);
            renderCanvas();
        });
    }
    if (toggleSpace) {
        toggleSpace.addEventListener('change', (e) => {
            showSpace = e.target.checked;
            if (labelToggleSpace) labelToggleSpace.classList.toggle('active', showSpace);
            renderCanvas();
        });
    }

    // Ação: Despachar Caminhão
    if (btnDespachar) {
        btnDespachar.addEventListener('click', () => {
            const status = checkLogisticsFeasibility(x, y);
            if (!status.isFeasible) return;

            // Preenche o manifesto do modal com a carga despachada
            if (modalMesas) modalMesas.textContent = `${x} un (${PESO_MESA * x} kg)`;
            if (modalCadeiras) modalCadeiras.textContent = `${y} un (${PESO_CADEIRA * y} kg)`;
            if (modalPeso) modalPeso.textContent = `${status.peso} kg (${minWeightLimit} kg ≤ Peso ≤ ${maxWeightLimit} kg)`;
            if (modalEspaco) modalEspaco.textContent = `${status.espaco} / ${maxSpaceLimit} móveis`;

            if (dispatchModal) dispatchModal.classList.add('open');
            spawnLogisticsSparkles();

            // Reinicia todas as restrições para o padrão original (como se o envio tivesse sido concluído)
            minWeightLimit = DEFAULT_MIN_WEIGHT;
            maxWeightLimit = DEFAULT_MAX_WEIGHT;
            maxSpaceLimit = DEFAULT_MAX_SPACE;

            // Caminhão enviado: pátio esvaziado para o próximo carregamento
            x = 0;
            y = 0;

            // Restaura as 3 camadas translúcidas para ativas
            showMinWeight = true;
            showMaxWeight = true;
            showSpace = true;
            if (toggleMinWeight) toggleMinWeight.checked = true;
            if (toggleMaxWeight) toggleMaxWeight.checked = true;
            if (toggleSpace) toggleSpace.checked = true;
            if (labelToggleMinWeight) labelToggleMinWeight.classList.add('active');
            if (labelToggleMaxWeight) labelToggleMaxWeight.classList.add('active');
            if (labelToggleSpace) labelToggleSpace.classList.add('active');

            // Atualiza os controles, fórmulas, medidores e o gráfico em tempo real
            updateSimulation('dispatch');
        });
    }

    if (btnModalClose) {
        btnModalClose.addEventListener('click', () => {
            if (dispatchModal) dispatchModal.classList.remove('open');
        });
    }

    if (dispatchModal) {
        dispatchModal.addEventListener('click', (e) => {
            if (e.target === dispatchModal) {
                dispatchModal.classList.remove('open');
            }
        });
    }

    // Redimensionamento
    window.addEventListener('resize', () => {
        setupCanvasDPI();
        renderCanvas();
    });

    // Inicialização
    setupCanvasDPI();
    updateSimulation('init');
    animationLoop();
}

/* ====================================================================
   CAPÍTULOS 4 E 5: MAGNATA DA FÁBRICA (OTIMIZAÇÃO LINEAR ROGUELIKE)
   ==================================================================== */
function initMagnataDaFabrica() {
    const canvas = document.getElementById('vendasCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // ── DOM Elements ─────────────────────────────────────────────
    const hudCashValue = document.getElementById('hudCashValue');
    const hudHearts = document.getElementById('hudHearts');
    const hudTimerValue = document.getElementById('hudTimerValue');
    const hudTimerBar = document.getElementById('hudTimerBar');
    const hudRoundValue = document.getElementById('hudRoundValue');
    const gameStatusPill = document.getElementById('gameStatusPill');
    const gameStatusText = document.getElementById('gameStatusText');
    const marketPriceA = document.getElementById('marketPriceA');
    const marketPriceB = document.getElementById('marketPriceB');
    const formulaZLabel = document.getElementById('formulaZLabel');
    const formulaZDisplay = document.getElementById('formulaZDisplay');
    const sliderVarrerLucro = document.getElementById('sliderVarrerLucro');
    const sliderZValue = document.getElementById('sliderZValue');
    const sliderMaxLabel = document.getElementById('sliderMaxLabel');
    const btnValidarProducao = document.getElementById('btnValidarProducao');
    const btnValidarIcon = document.getElementById('btnValidarIcon');
    const btnValidarText = document.getElementById('btnValidarText');
    const btnIniciarJogo = document.getElementById('btnIniciarJogo');
    const constraintsList = document.getElementById('constraintsList');
    const canvasLegend = document.getElementById('canvasLegend');
    const axisRangeLabel = document.getElementById('axisRangeLabel');

    // Modals
    const shopModal = document.getElementById('shopModal');
    const upgradeCardsGrid = document.getElementById('upgradeCardsGrid');
    const shopCashDisplay = document.getElementById('shopCashDisplay');
    const btnComprarUpgrade = document.getElementById('btnComprarUpgrade');
    const btnPularLoja = document.getElementById('btnPularLoja');

    const gameOverModal = document.getElementById('gameOverModal');
    const goStatRounds = document.getElementById('goStatRounds');
    const goStatCash = document.getElementById('goStatCash');
    const goStatPerfect = document.getElementById('goStatPerfect');
    const goStatBestRound = document.getElementById('goStatBestRound');
    const btnJogarNovamente = document.getElementById('btnJogarNovamente');

    const perfectModal = document.getElementById('perfectModal');
    const perfectBonusValue = document.getElementById('perfectBonusValue');
    const coinRain = document.getElementById('coinRain');

    const legendRed = document.getElementById('legendRed');
    const legendBlue = document.getElementById('legendBlue');

    // Novos Elementos: Eventos de Mercado, Finanças e Modal de Reprovação
    const marketEventBanner = document.getElementById('marketEventBanner');
    const marketEventIcon = document.getElementById('marketEventIcon');
    const marketEventTitle = document.getElementById('marketEventTitle');
    const marketEventDesc = document.getElementById('marketEventDesc');
    const roundOpCostDisplay = document.getElementById('roundOpCostDisplay');
    const roundMinEffDisplay = document.getElementById('roundMinEffDisplay');
    const roundToleranceDisplay = document.getElementById('roundToleranceDisplay');
    const shopInflationBadge = document.getElementById('shopInflationBadge');
    const perfectFinanceBreakdown = document.getElementById('perfectFinanceBreakdown');
    const rejectModal = document.getElementById('rejectModal');
    const rejectIcon = document.getElementById('rejectIcon');
    const rejectTitle = document.getElementById('rejectTitle');
    const rejectReason = document.getElementById('rejectReason');
    const rejectPenalty = document.getElementById('rejectPenalty');
    const compassStatusBadge = document.getElementById('compassStatusBadge');
    const graphHelpTip = document.getElementById('graphHelpTip');
    const zeroToleranceBanner = document.getElementById('zeroToleranceBanner');
    const zeroToleranceModal = document.getElementById('zeroToleranceModal');
    const btnFecharZeroTolerance = document.getElementById('btnFecharZeroTolerance');

    // ── Game State ───────────────────────────────────────────────
    let state = {
        round: 0,
        cash: 300, // Caixa inicial moderado para cobrir o primeiro aluguel
        lives: 3,
        timeLeft: 24,
        maxTime: 24,
        bonusMaxTime: 0, // Upgrades de tempo (+5s)
        timerInterval: null,
        phase: 'idle', // 'playing', 'result', 'shop', 'gameover'
        constraints: [],
        objA: 0,
        objB: 0,
        currentZ: 0,
        polygon: [],
        optimalVertex: null,
        maxZ: 0,
        perfectHits: 0,
        bestRoundProfit: 0,
        selectedUpgrade: null,

        // Bússola Interativa e Modo Cego
        playerCompass: null,      // { x, y, a, b, angle } posicionado pelo jogador
        isBlindMode: false,       // ativado a partir da rodada 13 (pós-rodada 12)

        // Mecânicas de Dificuldade Gradativa e Economia
        operationalCost: 0,
        minEfficiencyRequired: 0, // 0%, 60% ou 75%
        currentTolerance: 0.08,   // 8% caindo até 0.3% na rodada 12+
        storeInflationFactor: 1.0,// Sobe +12% a cada visita à loja
        currentEvent: null,       // Evento climático de mercado da rodada
        opCostDiscount: 0,        // Se comprou upgrade de automação (-25%)
    };

    const DEFAULT_CONSTRAINTS = [
        { a: 2, b: 1, c: 100, type: 'leq', label: 'Blocos Vermelhos', color: '#ef5350', chipClass: 'red-chip', emoji: '🔴' },
        { a: 1, b: 2, c: 80,  type: 'leq', label: 'Blocos Azuis',    color: '#42a5f5', chipClass: 'blue-chip', emoji: '🔵' },
    ];

    const MARKET_EVENTS = [
        {
            id: 'normal',
            icon: '☀️',
            title: 'Mercado Estável',
            desc: 'Condições normais de operação na fábrica.',
            className: 'normal-market',
        },
        {
            id: 'boom',
            icon: '⚡',
            title: 'Boom de Demanda',
            desc: 'Preços +50%, mas clientes exigem agilidade (-30% de tempo)!',
            className: 'boom-market',
        },
        {
            id: 'crisis',
            icon: '📉',
            title: 'Crise de Insumos',
            desc: 'Estoque de blocos vermelhos reduzido em 25% nesta rodada!',
            className: 'crisis-market',
        },
        {
            id: 'fog',
            icon: '🌫️',
            title: 'Nevoeiro de Mercado',
            desc: 'Bússola visual oculta! Calcule a inclinação mentalmente pela fórmula.',
            className: 'fog-market',
        }
    ];

    // ── Audio (Web Audio API, no external files) ─────────────────
    let audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    }

    function playTone(freq, duration, type) {
        try {
            const ac = getAudioCtx();
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.type = type || 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.15, ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.start(ac.currentTime);
            osc.stop(ac.currentTime + duration);
        } catch(e) {}
    }

    function playSoundSuccess() {
        playTone(523, 0.12, 'square');
        setTimeout(() => playTone(659, 0.12, 'square'), 100);
        setTimeout(() => playTone(784, 0.2, 'square'), 200);
    }

    function playSoundPerfect() {
        playTone(523, 0.1, 'square');
        setTimeout(() => playTone(659, 0.1, 'square'), 80);
        setTimeout(() => playTone(784, 0.1, 'square'), 160);
        setTimeout(() => playTone(1047, 0.3, 'square'), 240);
    }

    function playSoundFail() {
        playTone(330, 0.15, 'sawtooth');
        setTimeout(() => playTone(220, 0.3, 'sawtooth'), 120);
    }

    function playSoundTick() {
        playTone(880, 0.05, 'sine');
    }

    function playSoundWarning() {
        playTone(440, 0.15, 'sawtooth');
        setTimeout(() => playTone(370, 0.15, 'sawtooth'), 120);
        setTimeout(() => playTone(311, 0.25, 'sawtooth'), 240);
    }

    // ── Math Engine ──────────────────────────────────────────────

    /**
     * Compute intersection of line (a1*x + b1*y = c1) and (a2*x + b2*y = c2)
     * Returns {x, y} or null if parallel.
     */
    function lineIntersection(a1, b1, c1, a2, b2, c2) {
        const det = a1 * b2 - a2 * b1;
        if (Math.abs(det) < 1e-10) return null;
        return {
            x: (c1 * b2 - c2 * b1) / det,
            y: (a1 * c2 - a2 * c1) / det,
        };
    }

    /**
     * Check if point (px, py) satisfies constraint {a, b, c, type}.
     * type 'leq': a*px + b*py <= c
     * type 'geq': a*px + b*py >= c
     */
    function satisfiesConstraint(px, py, con) {
        const val = con.a * px + con.b * py;
        if (con.type === 'leq') return val <= con.c + 1e-6;
        if (con.type === 'geq') return val >= con.c - 1e-6;
        return true;
    }

    /**
     * Compute the feasible polygon (convex intersection of half-planes).
     * Uses Sutherland-Hodgman clipping starting from a large bounding box.
     */
    function computeFeasiblePolygon(constraints) {
        // Start with a large box
        const BIG = 500;
        let poly = [
            { x: 0, y: 0 },
            { x: BIG, y: 0 },
            { x: BIG, y: BIG },
            { x: 0, y: BIG },
        ];

        // Always clip by x >= 0, y >= 0
        const allConstraints = [
            { a: -1, b: 0, c: 0, type: 'leq' }, // -x <= 0 → x >= 0
            { a: 0, b: -1, c: 0, type: 'leq' }, // -y <= 0 → y >= 0
            ...constraints.map(con => {
                // Normalize to leq form: a*x + b*y <= c
                if (con.type === 'geq') return { a: -con.a, b: -con.b, c: -con.c, type: 'leq' };
                return { a: con.a, b: con.b, c: con.c, type: 'leq' };
            }),
        ];

        for (const con of allConstraints) {
            poly = clipPolygon(poly, con);
            if (poly.length === 0) return [];
        }

        return poly;
    }

    /**
     * Sutherland-Hodgman clip polygon by half-plane a*x + b*y <= c.
     */
    function clipPolygon(poly, con) {
        if (poly.length === 0) return [];
        const result = [];
        const n = poly.length;

        for (let i = 0; i < n; i++) {
            const curr = poly[i];
            const next = poly[(i + 1) % n];
            const currVal = con.a * curr.x + con.b * curr.y;
            const nextVal = con.a * next.x + con.b * next.y;
            const currInside = currVal <= con.c + 1e-8;
            const nextInside = nextVal <= con.c + 1e-8;

            if (currInside) {
                result.push(curr);
                if (!nextInside) {
                    // Exiting: add intersection
                    const t = (con.c - currVal) / (nextVal - currVal);
                    result.push({
                        x: curr.x + t * (next.x - curr.x),
                        y: curr.y + t * (next.y - curr.y),
                    });
                }
            } else if (nextInside) {
                // Entering: add intersection
                const t = (con.c - currVal) / (nextVal - currVal);
                result.push({
                    x: curr.x + t * (next.x - curr.x),
                    y: curr.y + t * (next.y - curr.y),
                });
            }
        }

        return result;
    }

    /**
     * Find the vertex of the polygon that maximizes Z = a*x + b*y.
     */
    function findOptimalVertex(vertices, a, b) {
        if (vertices.length === 0) return null;
        let best = vertices[0];
        let bestZ = a * best.x + b * best.y;
        for (let i = 1; i < vertices.length; i++) {
            const z = a * vertices[i].x + b * vertices[i].y;
            if (z > bestZ) {
                bestZ = z;
                best = vertices[i];
            }
        }
        return { vertex: best, z: bestZ };
    }

    /**
     * Ray-casting point-in-polygon test.
     */
    function isPointInPolygon(px, py, poly) {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i].x, yi = poly[i].y;
            const xj = poly[j].x, yj = poly[j].y;
            if ((yi > py) !== (yj > py) &&
                px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
                inside = !inside;
            }
        }
        return inside;
    }

    /**
     * Given Z = a*x + b*y = zVal, find the intersection of line ax+by=zVal
     * with the polygon. Returns two endpoints for drawing, or null.
     */
    function getZLineInRect(a, b, zVal, maxAxis) {
        const points = [];
        // Intersect with x=0: by = zVal → y = zVal/b
        if (Math.abs(b) > 1e-10) {
            const y0 = zVal / b;
            if (y0 >= -0.5 && y0 <= maxAxis + 0.5) points.push({ x: 0, y: y0 });
        }
        // Intersect with y=0: ax = zVal → x = zVal/a
        if (Math.abs(a) > 1e-10) {
            const x0 = zVal / a;
            if (x0 >= -0.5 && x0 <= maxAxis + 0.5) points.push({ x: x0, y: 0 });
        }
        // Intersect with x=maxAxis: a*maxAxis + by = zVal → y = (zVal - a*maxAxis)/b
        if (Math.abs(b) > 1e-10) {
            const ym = (zVal - a * maxAxis) / b;
            if (ym >= -0.5 && ym <= maxAxis + 0.5) points.push({ x: maxAxis, y: ym });
        }
        // Intersect with y=maxAxis: ax + b*maxAxis = zVal → x = (zVal - b*maxAxis)/a
        if (Math.abs(a) > 1e-10) {
            const xm = (zVal - b * maxAxis) / a;
            if (xm >= -0.5 && xm <= maxAxis + 0.5) points.push({ x: xm, y: 0 });
        }
        // Deduplicate close points
        const unique = [];
        for (const p of points) {
            const dup = unique.find(u => Math.abs(u.x - p.x) < 0.01 && Math.abs(u.y - p.y) < 0.01);
            if (!dup) unique.push(p);
        }
        if (unique.length >= 2) return [unique[0], unique[1]];
        return null;
    }

    /**
     * Where does line ax+by=zVal intersect the edges of the viewport?
     * Returns array of 2 points for drawing the full line across the canvas.
     */
    function getLineEndpoints(a, b, zVal, maxAxis) {
        const pts = [];
        const edges = [
            // x = 0
            { check: () => Math.abs(b) > 1e-10, point: () => ({ x: 0, y: zVal / b }) },
            // y = 0
            { check: () => Math.abs(a) > 1e-10, point: () => ({ x: zVal / a, y: 0 }) },
            // x = maxAxis
            { check: () => Math.abs(b) > 1e-10, point: () => ({ x: maxAxis, y: (zVal - a * maxAxis) / b }) },
            // y = maxAxis
            { check: () => Math.abs(a) > 1e-10, point: () => ({ x: (zVal - b * maxAxis) / a, y: maxAxis }) },
        ];

        for (const edge of edges) {
            if (edge.check()) {
                const p = edge.point();
                if (p.x >= -1 && p.x <= maxAxis + 1 && p.y >= -1 && p.y <= maxAxis + 1) {
                    const dup = pts.find(u => Math.abs(u.x - p.x) < 0.01 && Math.abs(u.y - p.y) < 0.01);
                    if (!dup) pts.push(p);
                }
            }
        }
        if (pts.length >= 2) return [pts[0], pts[1]];
        return null;
    }


    // ── Canvas Rendering ─────────────────────────────────────────

    let MAX_AXIS = 60;
    let animFrame = 0;

    function computeMaxAxis() {
        // Auto-adjust axis based on constraints
        let maxVal = 60;
        for (const con of state.constraints) {
            if (con.a > 0) maxVal = Math.max(maxVal, con.c / con.a);
            if (con.b > 0) maxVal = Math.max(maxVal, con.c / con.b);
        }
        MAX_AXIS = Math.ceil(maxVal / 10) * 10 + 10;
        if (MAX_AXIS < 60) MAX_AXIS = 60;
        if (MAX_AXIS > 200) MAX_AXIS = 200;
        if (axisRangeLabel) axisRangeLabel.textContent = 'Eixos: 0 a ' + MAX_AXIS;
    }

    function setupCanvasDPI() {
        const dpr = window.devicePixelRatio || 1;
        const wrapper = document.getElementById('cartesianWrapperVendas');
        const rect = wrapper ? wrapper.getBoundingClientRect() : { width: 600 };
        const width = rect.width || 600;
        const height = Math.min(width * 0.9, 520);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }

    function getPlotBounds() {
        const w = parseFloat(canvas.style.width) || 600;
        const h = parseFloat(canvas.style.height) || 520;
        const padLeft = 45, padBottom = 42, padRight = 24, padTop = 24;
        return {
            padLeft, padBottom, padRight, padTop,
            plotWidth: w - padLeft - padRight,
            plotHeight: h - padTop - padBottom,
            canvasW: w,
            canvasH: h,
        };
    }

    function mathToPixel(mx, my) {
        const b = getPlotBounds();
        return {
            px: b.padLeft + (mx / MAX_AXIS) * b.plotWidth,
            py: b.padTop + b.plotHeight - (my / MAX_AXIS) * b.plotHeight,
        };
    }

    function pixelToMath(px, py) {
        const b = getPlotBounds();
        return {
            mx: Math.max(0, ((px - b.padLeft) / b.plotWidth) * MAX_AXIS),
            my: Math.max(0, ((b.padTop + b.plotHeight - py) / b.plotHeight) * MAX_AXIS),
        };
    }

    function renderCanvas() {
        const b = getPlotBounds();
        ctx.clearRect(0, 0, b.canvasW, b.canvasH);

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, b.canvasW, b.canvasH);

        // Grid
        ctx.strokeStyle = '#e8e6e1';
        ctx.lineWidth = 0.5;
        const gridStep = MAX_AXIS <= 80 ? 10 : 20;
        for (let i = 0; i <= MAX_AXIS; i += gridStep) {
            const p = mathToPixel(i, 0);
            ctx.beginPath();
            ctx.moveTo(p.px, b.padTop);
            ctx.lineTo(p.px, b.padTop + b.plotHeight);
            ctx.stroke();

            const p2 = mathToPixel(0, i);
            ctx.beginPath();
            ctx.moveTo(b.padLeft, p2.py);
            ctx.lineTo(b.padLeft + b.plotWidth, p2.py);
            ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.padLeft, b.padTop);
        ctx.lineTo(b.padLeft, b.padTop + b.plotHeight);
        ctx.lineTo(b.padLeft + b.plotWidth, b.padTop + b.plotHeight);
        ctx.stroke();

        // Axis labels
        ctx.fillStyle = '#333';
        ctx.font = '600 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        for (let i = 0; i <= MAX_AXIS; i += gridStep) {
            if (i === 0) continue;
            const p = mathToPixel(i, 0);
            ctx.fillText(i.toString(), p.px, b.padTop + b.plotHeight + 16);
            const p2 = mathToPixel(0, i);
            ctx.textAlign = 'right';
            ctx.fillText(i.toString(), b.padLeft - 8, p2.py + 4);
            ctx.textAlign = 'center';
        }

        // Axis arrows
        const arrowSize = 8;
        // X-axis arrow
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(b.padLeft + b.plotWidth, b.padTop + b.plotHeight);
        ctx.lineTo(b.padLeft + b.plotWidth - arrowSize, b.padTop + b.plotHeight - arrowSize / 2);
        ctx.lineTo(b.padLeft + b.plotWidth - arrowSize, b.padTop + b.plotHeight + arrowSize / 2);
        ctx.fill();
        // Y-axis arrow
        ctx.beginPath();
        ctx.moveTo(b.padLeft, b.padTop);
        ctx.lineTo(b.padLeft - arrowSize / 2, b.padTop + arrowSize);
        ctx.lineTo(b.padLeft + arrowSize / 2, b.padTop + arrowSize);
        ctx.fill();

        // Axis titles
        ctx.font = '700 12px Inter, sans-serif';
        ctx.fillStyle = '#0288d1';
        ctx.textAlign = 'center';
        ctx.fillText('Mesas (x)', b.padLeft + b.plotWidth / 2, b.padTop + b.plotHeight + 34);
        ctx.save();
        ctx.translate(14, b.padTop + b.plotHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#e65100';
        ctx.fillText('Cadeiras (y)', 0, 0);
        ctx.restore();

        // Draw constraint regions (translucent)
        for (const con of state.constraints) {
            drawConstraintRegion(con);
        }

        // Draw feasible polygon
        if (state.polygon.length >= 3) {
            ctx.beginPath();
            const p0 = mathToPixel(state.polygon[0].x, state.polygon[0].y);
            ctx.moveTo(p0.px, p0.py);
            for (let i = 1; i < state.polygon.length; i++) {
                const p = mathToPixel(state.polygon[i].x, state.polygon[i].y);
                ctx.lineTo(p.px, p.py);
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 235, 59, 0.28)';
            ctx.fill();
            ctx.strokeStyle = '#f9a825';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([]);
            ctx.stroke();
        }

        // Draw constraint boundary lines
        for (const con of state.constraints) {
            drawConstraintLine(con);
        }

        // Draw vertices
        for (const v of state.polygon) {
            const p = mathToPixel(v.x, v.y);
            ctx.beginPath();
            ctx.arc(p.px, p.py, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#f9a825';
            ctx.fill();
            ctx.strokeStyle = '#e65100';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Highlight optimal vertex with pulsing glow (somente rodadas 1 e 2 de aprendizado!)
        if (state.optimalVertex && state.phase === 'playing' && state.round <= 2) {
            const p = mathToPixel(state.optimalVertex.vertex.x, state.optimalVertex.vertex.y);
            const pulse = 6 + 3 * Math.sin(animFrame * 0.08);
            ctx.beginPath();
            ctx.arc(p.px, p.py, pulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
            ctx.fill();
            ctx.strokeStyle = '#7c3aed';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Draw compass arrow (gradient direction vector)
        if (state.phase === 'playing' && state.objA > 0 && state.objB > 0) {
            drawCompassArrow();
        }

        // Draw Z line (iso-profit line perpendicular to gradient)
        if (state.phase === 'playing' && state.currentZ > 0) {
            drawZLine();
        }
    }

    function drawConstraintRegion(con) {
        // Draw the half-plane as a translucent region
        const pts = [];
        const lineEndpoints = getLineEndpoints(con.a, con.b, con.c, MAX_AXIS);
        if (!lineEndpoints) return;

        // Fill the feasible side of the constraint
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = con.color;

        // Determine which side is feasible by checking a test point
        if (con.type === 'leq') {
            // ax + by <= c → origin (0,0) is usually inside
            // Build a polygon for the feasible side within the viewport
            const clipPoly = computeConstraintVisibleRegion(con);
            if (clipPoly.length >= 3) {
                ctx.beginPath();
                const p0 = mathToPixel(clipPoly[0].x, clipPoly[0].y);
                ctx.moveTo(p0.px, p0.py);
                for (let i = 1; i < clipPoly.length; i++) {
                    const p = mathToPixel(clipPoly[i].x, clipPoly[i].y);
                    ctx.lineTo(p.px, p.py);
                }
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.restore();
    }

    function computeConstraintVisibleRegion(con) {
        // Clip the viewport box [0, MAX_AXIS] x [0, MAX_AXIS] by the constraint
        let box = [
            { x: 0, y: 0 },
            { x: MAX_AXIS, y: 0 },
            { x: MAX_AXIS, y: MAX_AXIS },
            { x: 0, y: MAX_AXIS },
        ];
        const normalized = con.type === 'geq'
            ? { a: -con.a, b: -con.b, c: -con.c, type: 'leq' }
            : { a: con.a, b: con.b, c: con.c, type: 'leq' };
        return clipPolygon(box, normalized);
    }

    function drawConstraintLine(con) {
        const endpts = getLineEndpoints(con.a, con.b, con.c, MAX_AXIS);
        if (!endpts) return;

        const p1 = mathToPixel(endpts[0].x, endpts[0].y);
        const p2 = mathToPixel(endpts[1].x, endpts[1].y);

        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.strokeStyle = con.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.stroke();

        // Label on the line
        const midX = (p1.px + p2.px) / 2;
        const midY = (p1.py + p2.py) / 2;
        ctx.font = '700 10px Inter, sans-serif';
        ctx.fillStyle = con.color;
        ctx.textAlign = 'center';
        const labelText = con.a + 'x+' + con.b + 'y=' + con.c;
        ctx.fillText(labelText, midX, midY - 8);
    }

    function drawCompassArrow() {
        // Se estiver no Modo Cego (Rodada > 12) e em fase de jogo: NÃO desenha nada!
        if (state.round > 12 && state.phase === 'playing') {
            return;
        }

        ctx.save();

        // Se a rodada acabou e estava no modo cego, mostra a revelação
        if (state.round > 12 && state.phase === 'result') {
            const mag = Math.sqrt(state.objA * state.objA + state.objB * state.objB) || 1;
            const len = Math.min(MAX_AXIS * 0.3, 25);
            const tA = (state.objA / mag) * len;
            const tB = (state.objB / mag) * len;
            const p0 = mathToPixel(0, 0);
            const pTip = mathToPixel(tA, tB);

            ctx.beginPath();
            ctx.moveTo(p0.px, p0.py);
            ctx.lineTo(pTip.px, pTip.py);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.font = '800 11px Inter, sans-serif';
            ctx.fillStyle = '#059669';
            ctx.fillText('Revelação ∇Z', pTip.px + 8, pTip.py - 4);
            ctx.restore();
            return;
        }

        // Se houver nevoeiro no mercado, reduz opacidade
        if (state.currentEvent && state.currentEvent.id === 'fog') {
            ctx.globalAlpha = 0.12;
        }

        // Desenhar a bússola automática a partir de (a, b)
        const a = state.objA;
        const b = state.objB;
        const mag = Math.sqrt(a * a + b * b) || 1;
        const arrowLen = Math.min(MAX_AXIS * 0.32, 28);
        const normA = (a / mag) * arrowLen;
        const normB = (b / mag) * arrowLen;

        const origin = mathToPixel(0, 0);
        const tip = mathToPixel(normA, normB);

        // Flecha
        ctx.beginPath();
        ctx.moveTo(origin.px, origin.py);
        ctx.lineTo(tip.px, tip.py);
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Ponta da flecha
        const angle = Math.atan2(origin.py - tip.py, tip.px - origin.px);
        const headLen = 13;
        ctx.beginPath();
        ctx.moveTo(tip.px, tip.py);
        ctx.lineTo(
            tip.px - headLen * Math.cos(angle - Math.PI / 6),
            tip.py + headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            tip.px - headLen * Math.cos(angle + Math.PI / 6),
            tip.py + headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = '#7c3aed';
        ctx.fill();

        // Label
        ctx.font = '800 11px Inter, sans-serif';
        ctx.fillStyle = '#5b21b6';
        ctx.textAlign = 'left';
        ctx.fillText('Bússola ∇Z', tip.px + 8, tip.py - 4);
        ctx.restore();
    }

    function drawZLine() {
        const a = state.objA;
        const b = state.objB;
        const z = state.currentZ;

        const endpts = getLineEndpoints(a, b, z, MAX_AXIS);
        if (!endpts) return;

        const p1 = mathToPixel(endpts[0].x, endpts[0].y);
        const p2 = mathToPixel(endpts[1].x, endpts[1].y);

        // Dashed line
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Z value label floating near the line
        const midX = (p1.px + p2.px) / 2;
        const midY = (p1.py + p2.py) / 2;

        ctx.save();
        const labelText = 'Z = R$ ' + Math.round(z);
        ctx.font = '800 12px Inter, sans-serif';
        const textWidth = ctx.measureText(labelText).width;

        // Background pill
        ctx.fillStyle = 'rgba(124, 58, 237, 0.9)';
        const pillX = midX - textWidth / 2 - 8;
        const pillY = midY - 20;
        const pillW = textWidth + 16;
        const pillH = 22;
        ctx.beginPath();
        ctx.fillRect(pillX, pillY, pillW, pillH);

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(labelText, midX, midY - 6);
        ctx.restore();
    }

    // ── HUD Updates ──────────────────────────────────────────────

    function updateHUD() {
        if (hudCashValue) {
            hudCashValue.textContent = 'R$ ' + Math.round(state.cash);
            if (state.cash < 0) {
                hudCashValue.style.color = '#dc2626';
            } else {
                hudCashValue.style.color = '';
            }
        }

        // Hearts
        if (hudHearts) {
            const hearts = hudHearts.querySelectorAll('.heart-icon');
            hearts.forEach((h, i) => {
                if (i < state.lives) {
                    h.classList.remove('lost');
                } else {
                    h.classList.add('lost');
                }
            });
        }

        // Timer
        if (hudTimerValue) {
            hudTimerValue.textContent = state.timeLeft + 's';
            hudTimerValue.className = 'hud-stat-value timer-value';
            if (state.timeLeft <= 5) hudTimerValue.classList.add('danger');
            else if (state.timeLeft <= 10) hudTimerValue.classList.add('warning');
        }
        if (hudTimerBar) {
            const pct = Math.max(0, (state.timeLeft / state.maxTime) * 100);
            hudTimerBar.style.width = pct + '%';
            hudTimerBar.className = 'timer-bar-fill';
            if (state.timeLeft <= 5) hudTimerBar.classList.add('danger');
            else if (state.timeLeft <= 10) hudTimerBar.classList.add('warning');
        }

        // Round
        if (hudRoundValue) {
            hudRoundValue.textContent = '#' + state.round;
        }

        // Status pill
        if (gameStatusPill && gameStatusText) {
            gameStatusPill.className = 'status-pill';
            if (state.phase === 'playing') {
                gameStatusPill.classList.add('active');
                gameStatusText.textContent = 'RODADA ' + state.round;
            } else if (state.phase === 'shop') {
                gameStatusText.textContent = 'LOJA';
            } else if (state.phase === 'gameover') {
                gameStatusText.textContent = 'GAME OVER';
            } else {
                gameStatusText.textContent = 'AGUARDANDO';
            }
        }

        // Finanças da rodada
        if (roundOpCostDisplay) {
            roundOpCostDisplay.textContent = '-R$ ' + Math.round(state.operationalCost);
        }
        if (roundMinEffDisplay) {
            roundMinEffDisplay.textContent = state.minEfficiencyRequired > 0 
                ? '≥ ' + Math.round(state.minEfficiencyRequired * 100) + '%' 
                : 'Sem Cota';
        }
        if (roundToleranceDisplay) {
            if (state.round >= 12) {
                roundToleranceDisplay.textContent = '0% (EXATO)';
                roundToleranceDisplay.classList.add('zero-tolerance');
            } else {
                roundToleranceDisplay.textContent = '±' + (state.currentTolerance * 100).toFixed(1) + '%';
                roundToleranceDisplay.classList.remove('zero-tolerance');
            }
        }

        // Banner de tolerância zero
        if (zeroToleranceBanner) {
            if (state.round >= 12 && state.phase === 'playing') {
                zeroToleranceBanner.style.display = 'flex';
            } else {
                zeroToleranceBanner.style.display = 'none';
            }
        }

        // Status da bússola
        updateCompassStatus();

        // Evento de mercado
        updateEventBanner();
    }

    function updateCompassStatus() {
        if (!compassStatusBadge) return;
        if (state.round > 12 && state.phase === 'playing') {
            compassStatusBadge.style.display = 'inline-flex';
            compassStatusBadge.className = 'compass-status-badge blind';
            compassStatusBadge.textContent = '🙈 Modo Cego Ativo';
        } else {
            compassStatusBadge.style.display = 'none';
        }
    }

    function updateEventBanner() {
        if (!marketEventBanner || !state.currentEvent) return;
        marketEventBanner.className = 'market-event-banner ' + state.currentEvent.className;
        if (marketEventIcon) marketEventIcon.textContent = state.currentEvent.icon;
        if (marketEventTitle) marketEventTitle.textContent = state.currentEvent.title;
        if (marketEventDesc) marketEventDesc.textContent = state.currentEvent.desc;
    }

    function updateMarket() {
        if (marketPriceA) marketPriceA.textContent = 'R$ ' + state.objA.toFixed(0);
        if (marketPriceB) marketPriceB.textContent = 'R$ ' + state.objB.toFixed(0);
        if (formulaZLabel) formulaZLabel.textContent = 'Z = ' + state.objA.toFixed(0) + 'x + ' + state.objB.toFixed(0) + 'y';
    }

    function updateFormulaDisplay() {
        if (formulaZDisplay) {
            formulaZDisplay.textContent = 'Z = R$ ' + Math.round(state.currentZ);
        }
    }

    function updateSlider() {
        if (sliderVarrerLucro) {
            sliderVarrerLucro.max = Math.ceil(state.maxZ * 1.4);
            if (sliderMaxLabel) sliderMaxLabel.textContent = 'Z = ' + sliderVarrerLucro.max;
        }
        if (sliderZValue) {
            sliderZValue.textContent = 'Z = R$ ' + Math.round(state.currentZ);
        }
    }

    function updateConstraintsDisplay() {
        if (!constraintsList) return;
        let html = '';
        for (const con of state.constraints) {
            const sign = con.type === 'leq' ? '≤' : '≥';
            const label = con.a + 'x + ' + con.b + 'y ' + sign + ' ' + con.c;
            html += '<div class="constraint-chip ' + (con.chipClass || 'gray-chip') + '">' + (con.emoji || '') + ' ' + label + '</div>';
        }
        html += '<div class="constraint-chip gray-chip">x ≥ 0, y ≥ 0</div>';
        constraintsList.innerHTML = html;
    }

    function updateLegend() {
        if (legendRed && state.constraints[0]) {
            const c = state.constraints[0];
            legendRed.textContent = c.a + 'x + ' + c.b + 'y ≤ ' + c.c + ' (' + c.label + ')';
        }
        if (legendBlue && state.constraints[1]) {
            const c = state.constraints[1];
            legendBlue.textContent = c.a + 'x + ' + c.b + 'y ≤ ' + c.c + ' (' + c.label + ')';
        }
    }


    // ── Game Logic ───────────────────────────────────────────────

    function resetGame() {
        state.round = 0;
        state.cash = 300; // Reserva inicial para pagar custos operacionais da primeira rodada
        state.lives = 3;
        state.timeLeft = 24;
        state.maxTime = 24;
        state.bonusMaxTime = 0;
        state.phase = 'idle';
        state.perfectHits = 0;
        state.bestRoundProfit = 0;
        state.currentZ = 0;
        state.objA = 0;
        state.objB = 0;
        state.selectedUpgrade = null;
        state.playerCompass = null;
        state.isBlindMode = false;
        state.operationalCost = 0;
        state.minEfficiencyRequired = 0;
        state.currentTolerance = 0.08;
        state.storeInflationFactor = 1.0;
        state.currentEvent = MARKET_EVENTS[0];
        state.opCostDiscount = 0;

        if (canvas) canvas.classList.remove('targeting');

        state.constraints = DEFAULT_CONSTRAINTS.map(c => ({ ...c }));

        if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }

        // Reset UI
        if (btnIniciarJogo) btnIniciarJogo.classList.remove('hidden');
        if (btnValidarProducao) {
            btnValidarProducao.disabled = true;
            btnValidarIcon.textContent = '🔒';
            btnValidarText.textContent = 'Validar Produção';
        }
        if (sliderVarrerLucro) sliderVarrerLucro.value = 0;
        if (marketPriceA) marketPriceA.textContent = 'R$ —';
        if (marketPriceB) marketPriceB.textContent = 'R$ —';
        if (zeroToleranceBanner) zeroToleranceBanner.style.display = 'none';
        if (zeroToleranceModal) zeroToleranceModal.classList.remove('open');

        computeMaxAxis();
        state.polygon = computeFeasiblePolygon(state.constraints);

        updateHUD();
        updateConstraintsDisplay();
        updateLegend();
        updateFormulaDisplay();
        updateSlider();

        setupCanvasDPI();
        renderCanvas();
    }

    function checkAutomaticProgression() {
        // Rodada 3+: Injeção automática da restrição de transporte (Caminhão)
        if (state.round >= 3 && !state.constraints.find(c => c.label === 'Caminhão')) {
            state.constraints.push({
                a: 1, b: 1, c: 60, type: 'leq', label: 'Caminhão',
                color: '#ff9800', chipClass: 'yellow-chip', emoji: '🚚'
            });
        }

        // Rodada 5+: Injeção automática de contrato mínimo de mesas
        if (state.round >= 5 && !state.constraints.find(c => c.label === 'Mín. Mesas')) {
            state.constraints.push({
                a: 1, b: 0, c: 10, type: 'geq', label: 'Mín. Mesas',
                color: '#26a69a', chipClass: 'green-chip', emoji: '📋'
            });
        }

        // Rodada 7+: Injeção automática de acabamento/pintura
        if (state.round >= 7 && !state.constraints.find(c => c.label === 'Pintura')) {
            state.constraints.push({
                a: 2.5, b: 1.5, c: 120, type: 'leq', label: 'Pintura',
                color: '#ab47bc', chipClass: 'purple-chip', emoji: '🎨'
            });
        }

        // Rodada 9+: Injeção automática de contrato mínimo de cadeiras
        if (state.round >= 9 && !state.constraints.find(c => c.label === 'Mín. Cadeiras')) {
            state.constraints.push({
                a: 0, b: 1, c: 10, type: 'geq', label: 'Mín. Cadeiras',
                color: '#26a69a', chipClass: 'green-chip', emoji: '📋'
            });
        }
    }

    function startRound() {
        state.round++;
        state.phase = 'playing';
        state.playerCompass = null;
        state.isBlindMode = (state.round > 12);

        // 1. Inserir novas restrições automáticas conforme a rodada avança
        checkAutomaticProgression();

        // 2. Curva de Dificuldade de Tempo Extrema (24s até 4s na rodada 20/21)
        const baseTime = Math.max(4, 25 - state.round);
        state.maxTime = baseTime + state.bonusMaxTime;

        // 3. Tolerância Progressiva até a Rodada 12 (Tolerância Zero a partir da R12!)
        if (state.round >= 12) {
            state.currentTolerance = 0.0035; // Praticamente 0% (exato no inteiro do vértice!)
            state.minEfficiencyRequired = 0.99; // Exige vértice ótimo exato
        } else if (state.round <= 2) {
            state.currentTolerance = 0.08; // 8% (fase tutorial)
            state.minEfficiencyRequired = 0;
        } else if (state.round <= 5) {
            state.currentTolerance = 0.05; // 5% (fase intermediária)
            state.minEfficiencyRequired = 0.60;
        } else if (state.round <= 8) {
            state.currentTolerance = 0.035;// 3.5% (fase avançada)
            state.minEfficiencyRequired = 0.75;
        } else {
            state.currentTolerance = 0.02; // 2% (alta precisão)
            state.minEfficiencyRequired = 0.75;
        }

        // 4. Custo Fixo Operacional da Rodada (Aluguel da fábrica)
        let rawCost = 120 + 35 * (state.round - 1);
        if (state.opCostDiscount > 0) {
            rawCost *= (1 - state.opCostDiscount);
        }
        state.operationalCost = Math.round(rawCost);

        // 5. Sorteio de Evento de Mercado
        if (state.round <= 3) {
            state.currentEvent = MARKET_EVENTS[0]; // Mercado Estável
        } else {
            // 50% de chance de normal, 50% de um evento climático
            const roll = Math.random();
            if (roll < 0.5) {
                state.currentEvent = MARKET_EVENTS[0];
            } else {
                const specialEvents = MARKET_EVENTS.slice(1);
                state.currentEvent = specialEvents[Math.floor(Math.random() * specialEvents.length)];
            }
        }

        // 6. Geração de Preços Rebalanceada (Escala controlada: R$ 14 a R$ 38)
        let priceA = Math.round(14 + Math.random() * 24);
        let priceB = Math.round(14 + Math.random() * 24);

        // Aplicação de modificadores do evento
        if (state.currentEvent.id === 'boom') {
            priceA = Math.round(priceA * 1.5);
            priceB = Math.round(priceB * 1.5);
            state.maxTime = Math.max(4, Math.round(state.maxTime * 0.7)); // Tempo -30% (mínimo 4s)
        }

        state.objA = priceA;
        state.objB = priceB;
        state.timeLeft = state.maxTime;

        // Se houver evento de crise, reduz temporariamente a capacidade de blocos vermelhos
        if (state.currentEvent.id === 'crisis') {
            const redCon = state.constraints.find(c => c.label === 'Blocos Vermelhos');
            if (redCon && !redCon._origC) {
                redCon._origC = redCon.c;
                redCon.c = Math.round(redCon.c * 0.75);
            }
        } else {
            const redCon = state.constraints.find(c => c.label === 'Blocos Vermelhos');
            if (redCon && redCon._origC) {
                redCon.c = redCon._origC;
                delete redCon._origC;
            }
        }

        // Atualizar dica visual didática
        if (graphHelpTip) {
            if (state.round > 12) {
                graphHelpTip.innerHTML = '☠️ <strong>TOLERÂNCIA ZERO & MODO CEGO:</strong> Bússola oculta e valor EXATO de Z* obrigatório! Qualquer desvio perde 1 vida.';
            } else if (state.round === 12) {
                graphHelpTip.innerHTML = '☠️ <strong>TOLERÂNCIA ZERO:</strong> Encontre o valor EXATO de Z* com o slider! Qualquer desvio perde 1 vida.';
            } else {
                graphHelpTip.innerHTML = '🎯 <strong>Dica:</strong> Deslize o slider <strong>"Varrer Lucro (Z)"</strong> até o último vértice do polígono!';
            }
        }

        // Recalcular polígono e vértice ótimo
        computeMaxAxis();
        state.polygon = computeFeasiblePolygon(state.constraints);
        state.optimalVertex = findOptimalVertex(state.polygon, state.objA, state.objB);
        state.maxZ = state.optimalVertex ? state.optimalVertex.z : 500;

        // Reset slider
        state.currentZ = 0;
        if (sliderVarrerLucro) sliderVarrerLucro.value = 0;

        // Enable controls
        if (btnIniciarJogo) btnIniciarJogo.classList.add('hidden');
        if (btnValidarProducao) {
            btnValidarProducao.disabled = false;
            btnValidarIcon.textContent = '✅';
            btnValidarText.textContent = 'Validar Produção';
        }

        // Update UI
        updateMarket();
        updateHUD();
        updateSlider();
        updateFormulaDisplay();
        updateConstraintsDisplay();
        updateLegend();
        renderCanvas();

        // Start timer
        function startRoundCountdown() {
            if (state.timerInterval) clearInterval(state.timerInterval);
            state.timerInterval = setInterval(() => {
                state.timeLeft--;
                if (state.timeLeft <= 5) playSoundTick();
                updateHUD();
                if (state.timeLeft <= 0) {
                    clearInterval(state.timerInterval);
                    state.timerInterval = null;
                    handleTimeout();
                }
            }, 1000);
        }

        if (state.round === 12) {
            showZeroToleranceModal(() => {
                startRoundCountdown();
            });
        } else {
            startRoundCountdown();
        }
    }

    function handleTimeout() {
        state.phase = 'result';
        playSoundFail();
        showRejectModal('Tempo Esgotado!', 'Você demorou demais para decidir a programação de produção.', '-1 Vida ❤️');
    }

    function validateProduction() {
        if (state.phase !== 'playing') return;

        // Stop timer
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }

        state.phase = 'result';
        const z = state.currentZ;
        const a = state.objA;
        const b = state.objB;
        const maxFeasZ = state.maxZ;

        // 1. Verificar se Z está na faixa plausível do polígono
        if (z < 0 || z > maxFeasZ * 1.05) {
            playSoundFail();
            showRejectModal('Fora da Região Factível!', 'Sua reta de lucro ultrapassa todos os limites de recursos da fábrica.', '-1 Vida ❤️');
            return;
        }

        // 2. Verificar se a reta de lucro intersecta o polígono viável
        let touchesPolygon = false;
        if (state.polygon.length >= 3) {
            for (let i = 0; i < state.polygon.length; i++) {
                const v1 = state.polygon[i];
                const v2 = state.polygon[(i + 1) % state.polygon.length];
                const zV1 = a * v1.x + b * v1.y;
                const zV2 = a * v2.x + b * v2.y;
                if ((Math.min(zV1, zV2) - 1.5) <= z && z <= (Math.max(zV1, zV2) + 1.5)) {
                    touchesPolygon = true;
                    break;
                }
            }
        }

        if (!touchesPolygon && Math.abs(z) > 1) {
            playSoundFail();
            showRejectModal('Fora da Região Factível!', 'A reta de lucro não toca nenhum ponto do polígono de restrições.', '-1 Vida ❤️');
            return;
        }

        // 3. Checar Meta Mínima de Eficiência dos Acionistas
        if (state.minEfficiencyRequired > 0 && z < maxFeasZ * state.minEfficiencyRequired) {
            playSoundFail();
            const minAllowed = Math.round(maxFeasZ * state.minEfficiencyRequired);
            showRejectModal(
                'Produção Reprovada!', 
                'Lucro insuficiente (R$ ' + Math.round(z) + '). Os acionistas exigem pelo menos ' + Math.round(state.minEfficiencyRequired * 100) + '% do ótimo (R$ ' + minAllowed + ').',
                '-1 Vida ❤️'
            );
            return;
        }

        // 4. Tolerância Zero a partir da Rodada 12 (Ponto Exato Obrigatório)
        if (state.round >= 12) {
            const diffZ = Math.abs(z - maxFeasZ);
            const strictLimit = Math.max(2, maxFeasZ * 0.0035);
            if (diffZ > strictLimit) {
                playSoundFail();
                showRejectModal(
                    'Tolerância Zero (Rodada 12+)!',
                    'A diretoria exige o ponto exato! Z = R$ ' + Math.round(z) + ' não é o vértice ótimo exato (Z* = R$ ' + Math.round(maxFeasZ) + ').',
                    '-1 Vida ❤️'
                );
                return;
            }
        }

        // 5. Verificar se é Vértice Ótimo
        const isOptimal = Math.abs(z - maxFeasZ) <= (maxFeasZ * state.currentTolerance);

        if (isOptimal) {
            // Acerto Crítico / Perfeito!
            const bonus = Math.round(maxFeasZ * 0.5);
            const grossProfit = Math.round(maxFeasZ + bonus);
            const netProfit = grossProfit - state.operationalCost;

            state.cash += netProfit;
            state.perfectHits++;
            if (grossProfit > state.bestRoundProfit) state.bestRoundProfit = grossProfit;

            playSoundPerfect();
            showPerfectModal(bonus, Math.round(maxFeasZ), state.operationalCost, netProfit);
            animateCashPop();

        } else {
            // Acerto Normal (Viável, mas sub-ótimo)
            const grossProfit = Math.round(z);
            const netProfit = grossProfit - state.operationalCost;

            state.cash += netProfit;
            if (grossProfit > state.bestRoundProfit) state.bestRoundProfit = grossProfit;

            playSoundSuccess();
            animateCashPop();

            // Se a operação deu prejuízo líquido
            if (netProfit < 0) {
                const hud = document.getElementById('gameHud');
                if (hud) {
                    hud.style.borderColor = '#f59e0b';
                    setTimeout(() => hud.style.borderColor = '', 800);
                }
            }

            // Checar falência
            if (state.cash < 0) {
                setTimeout(() => showGameOver(), 1000);
                return;
            }

            // Seguir para a próxima etapa
            setTimeout(() => proceedAfterRound(), 1400);
        }

        updateHUD();
        renderCanvas();
    }

    function loseLife() {
        state.lives--;
        updateHUD();

        // Screen shake
        const container = document.querySelector('.container');
        if (container) {
            container.classList.add('shake');
            setTimeout(() => container.classList.remove('shake'), 500);
        }

        // Flash HUD red
        const hud = document.getElementById('gameHud');
        if (hud) {
            hud.style.borderColor = '#ef4444';
            hud.style.boxShadow = '0 6px 0 #dc2626, 0 0 30px rgba(239, 68, 68, 0.4)';
            setTimeout(() => {
                hud.style.borderColor = '';
                hud.style.boxShadow = '';
            }, 600);
        }

        if (state.lives <= 0) {
            setTimeout(() => showGameOver(), 800);
        } else {
            setTimeout(() => proceedAfterRound(), 1500);
        }
    }

    function proceedAfterRound() {
        // Every 2 rounds, open shop
        if (state.round > 0 && state.round % 2 === 0) {
            showShop();
        } else {
            startRound();
        }
    }

    function animateCashPop() {
        if (hudCashValue) {
            hudCashValue.classList.add('cash-pop');
            setTimeout(() => hudCashValue.classList.remove('cash-pop'), 400);
        }
    }

    // ── Shop (Upgrades) ──────────────────────────────────────────

    const UPGRADE_POOL = [
        {
            id: 'expand_red_1', icon: '🔴', name: 'Expansão de Estoque Vermelho',
            desc: 'Aumenta limite de 2x+y para +30 unidades',
            baseCost: 1600,
            apply: () => {
                const c = state.constraints.find(c => c.label === 'Blocos Vermelhos');
                if (c) c.c += 30;
            }
        },
        {
            id: 'expand_blue_1', icon: '🔵', name: 'Expansão de Estoque Azul',
            desc: 'Aumenta limite de x+2y para +30 unidades',
            baseCost: 1600,
            apply: () => {
                const c = state.constraints.find(c => c.label === 'Blocos Azuis');
                if (c) c.c += 30;
            }
        },
        {
            id: 'mega_red', icon: '🟥', name: 'Mega Silo Vermelho',
            desc: 'Aumenta limite de 2x+y para +60 unidades',
            baseCost: 3800,
            apply: () => {
                const c = state.constraints.find(c => c.label === 'Blocos Vermelhos');
                if (c) c.c += 60;
            }
        },
        {
            id: 'mega_blue', icon: '🟦', name: 'Mega Silo Azul',
            desc: 'Aumenta limite de x+2y para +60 unidades',
            baseCost: 3800,
            apply: () => {
                const c = state.constraints.find(c => c.label === 'Blocos Azuis');
                if (c) c.c += 60;
            }
        },
        {
            id: 'extra_time', icon: '⏱️', name: '+5s Tempo Adicional',
            desc: 'Aumenta o tempo base de todas as próximas rodadas em +5 segundos',
            baseCost: 2400,
            apply: () => {
                state.bonusMaxTime = Math.min(state.bonusMaxTime + 5, 20);
            }
        },
        {
            id: 'extra_life', icon: '❤️', name: '+1 Coração / Vida',
            desc: 'Recupera 1 coração perdido (máximo 3)',
            baseCost: 3200,
            apply: () => {
                state.lives = Math.min(state.lives + 1, 3);
            }
        },
        {
            id: 'automation', icon: '⚙️', name: 'Automação da Fábrica',
            desc: 'Reduz os custos operacionais (aluguel) em 25% permanentemente',
            baseCost: 2900,
            apply: () => {
                state.opCostDiscount = Math.min(0.50, state.opCostDiscount + 0.25);
            }
        },
        {
            id: 'relax_red', icon: '🔓', name: 'Otimização de Corte',
            desc: 'Melhora o corte: 1.5x+y ≤ C (era 2x+y)',
            baseCost: 4500,
            apply: () => {
                const c = state.constraints.find(c => c.label === 'Blocos Vermelhos');
                if (c) c.a = Math.max(1, c.a - 0.5);
            }
        },
    ];

    function showShop() {
        state.phase = 'shop';
        state.selectedUpgrade = null;

        // Inflação progressiva da loja a cada ciclo: +12%
        if (state.round > 2) {
            state.storeInflationFactor = Number((state.storeInflationFactor * 1.12).toFixed(2));
        }

        if (shopInflationBadge) {
            if (state.storeInflationFactor > 1.0) {
                const pct = Math.round((state.storeInflationFactor - 1) * 100);
                shopInflationBadge.textContent = '📈 Inflação +' + pct + '%';
                shopInflationBadge.style.display = 'inline-block';
            } else {
                shopInflationBadge.style.display = 'none';
            }
        }

        // Pick 3 random unique upgrades
        const shuffled = [...UPGRADE_POOL].sort(() => Math.random() - 0.5);
        const cards = shuffled.slice(0, 3);

        // Render cards
        if (upgradeCardsGrid) {
            upgradeCardsGrid.innerHTML = '';
            cards.forEach((card, idx) => {
                const actualCost = Math.round(card.baseCost * state.storeInflationFactor);
                const tooExpensive = actualCost > state.cash;
                const div = document.createElement('div');
                div.className = 'upgrade-card' + (tooExpensive ? ' too-expensive' : '');
                div.dataset.index = idx;
                div.innerHTML = '<div class="upgrade-card-icon">' + card.icon + '</div>' +
                    '<div class="upgrade-card-name">' + card.name + '</div>' +
                    '<div class="upgrade-card-desc">' + card.desc + '</div>' +
                    '<div class="upgrade-card-cost">R$ ' + actualCost + '</div>';

                if (!tooExpensive) {
                    div.addEventListener('click', () => {
                        upgradeCardsGrid.querySelectorAll('.upgrade-card').forEach(c => c.classList.remove('selected'));
                        div.classList.add('selected');
                        state.selectedUpgrade = { ...card, cost: actualCost };
                        if (btnComprarUpgrade) btnComprarUpgrade.disabled = false;
                    });
                }

                upgradeCardsGrid.appendChild(div);
            });
        }

        if (shopCashDisplay) shopCashDisplay.textContent = 'R$ ' + Math.round(state.cash);
        if (btnComprarUpgrade) btnComprarUpgrade.disabled = true;

        if (shopModal) shopModal.classList.add('open');
        updateHUD();
    }

    function buyUpgrade() {
        if (!state.selectedUpgrade) return;
        if (state.selectedUpgrade.cost > state.cash) return;

        state.cash -= state.selectedUpgrade.cost;
        state.selectedUpgrade.apply();
        state.selectedUpgrade = null;

        closeShop();
    }

    function closeShop() {
        if (shopModal) shopModal.classList.remove('open');

        // Recalculate polygon with new constraints
        computeMaxAxis();
        state.polygon = computeFeasiblePolygon(state.constraints);

        updateHUD();
        updateConstraintsDisplay();
        updateLegend();
        renderCanvas();

        // Next round after brief delay
        setTimeout(() => startRound(), 600);
    }

    // ── Modals ───────────────────────────────────────────────────

    function showRejectModal(title, reason, penalty) {
        if (rejectTitle) rejectTitle.textContent = title;
        if (rejectReason) rejectReason.textContent = reason;
        if (rejectPenalty) rejectPenalty.textContent = penalty;

        if (rejectModal) rejectModal.classList.add('open');

        setTimeout(() => {
            if (rejectModal) rejectModal.classList.remove('open');
            loseLife();
        }, 2200);
    }

    function showPerfectModal(bonus, optimalZ, opCost, netProfit) {
        if (perfectBonusValue) perfectBonusValue.textContent = '+R$ ' + bonus;

        if (perfectFinanceBreakdown) {
            perfectFinanceBreakdown.innerHTML = 
                '<div>📈 <strong>Lucro Otimizado:</strong> R$ ' + optimalZ + '</div>' +
                '<div>⭐ <strong>Bônus de Precisão (+50%):</strong> +R$ ' + bonus + '</div>' +
                '<div>🏢 <strong>Custos Fixos da Rodada:</strong> -R$ ' + opCost + '</div>' +
                '<div style="margin-top:6px; font-size: 0.95rem; font-weight:800; color:' + (netProfit >= 0 ? '#16a34a' : '#dc2626') + ';">' +
                '💰 <strong>Lucro Líquido no Caixa:</strong> ' + (netProfit >= 0 ? '+' : '') + 'R$ ' + netProfit + '</div>';
        }

        // Spawn coin rain
        if (coinRain) {
            coinRain.innerHTML = '';
            for (let i = 0; i < 15; i++) {
                const coin = document.createElement('span');
                coin.className = 'coin';
                coin.textContent = '🪙';
                coin.style.left = (Math.random() * 100) + '%';
                coin.style.animationDelay = (Math.random() * 0.6) + 's';
                coin.style.fontSize = (1 + Math.random() * 1) + 'rem';
                coinRain.appendChild(coin);
            }
        }

        if (perfectModal) perfectModal.classList.add('open');

        // Auto-close after 2.8s
        setTimeout(() => {
            if (perfectModal) perfectModal.classList.remove('open');
            proceedAfterRound();
        }, 2800);
    }

    let onZeroToleranceConfirmCallback = null;

    function showZeroToleranceModal(onConfirm) {
        onZeroToleranceConfirmCallback = onConfirm;
        if (zeroToleranceModal) {
            zeroToleranceModal.classList.add('open');
            playSoundWarning();
        } else if (onConfirm) {
            onConfirm();
        }
    }

    function closeZeroToleranceModal() {
        if (zeroToleranceModal) {
            zeroToleranceModal.classList.remove('open');
        }
        if (onZeroToleranceConfirmCallback) {
            const cb = onZeroToleranceConfirmCallback;
            onZeroToleranceConfirmCallback = null;
            cb();
        }
    }

    function showGameOver() {
        state.phase = 'gameover';

        if (goStatRounds) goStatRounds.textContent = state.round;
        if (goStatCash) goStatCash.textContent = 'R$ ' + Math.round(state.cash);
        if (goStatPerfect) goStatPerfect.textContent = state.perfectHits;
        if (goStatBestRound) goStatBestRound.textContent = 'R$ ' + Math.round(state.bestRoundProfit);

        if (gameOverModal) gameOverModal.classList.add('open');
        updateHUD();
    }

    // ── Event Listeners ──────────────────────────────────────────

    if (btnIniciarJogo) {
        btnIniciarJogo.addEventListener('click', () => {
            resetGame();
            startRound();
        });
    }

    if (btnValidarProducao) {
        btnValidarProducao.addEventListener('click', () => {
            validateProduction();
        });
    }

    if (sliderVarrerLucro) {
        sliderVarrerLucro.addEventListener('input', () => {
            state.currentZ = parseFloat(sliderVarrerLucro.value);
            updateFormulaDisplay();
            updateSlider();
            renderCanvas();
        });
    }

    if (btnComprarUpgrade) {
        btnComprarUpgrade.addEventListener('click', () => {
            buyUpgrade();
        });
    }

    if (btnPularLoja) {
        btnPularLoja.addEventListener('click', () => {
            closeShop();
        });
    }

    if (btnJogarNovamente) {
        btnJogarNovamente.addEventListener('click', () => {
            if (gameOverModal) gameOverModal.classList.remove('open');
            resetGame();
            startRound();
        });
    }

    if (btnFecharZeroTolerance) {
        btnFecharZeroTolerance.addEventListener('click', () => {
            playSoundTick();
            closeZeroToleranceModal();
        });
    }

    // O gradiente é posicionado automaticamente; o jogador interage apenas com o slider de lucro Z.

    // Close modals on backdrop click
    [shopModal, gameOverModal, rejectModal, zeroToleranceModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal && state.phase !== 'shop') {
                    if (modal === zeroToleranceModal) {
                        closeZeroToleranceModal();
                    } else {
                        modal.classList.remove('open');
                    }
                }
            });
        }
    });

    // Resize
    window.addEventListener('resize', () => {
        setupCanvasDPI();
        renderCanvas();
    });

    // Animation loop
    function animationLoop() {
        animFrame++;
        if (state.phase === 'playing') {
            renderCanvas();
        }
        requestAnimationFrame(animationLoop);
    }

    // ── Initialization ───────────────────────────────────────────
    resetGame();
    animationLoop();
}
