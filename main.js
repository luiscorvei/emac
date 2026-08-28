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
});


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