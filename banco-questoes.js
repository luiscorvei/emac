/**
 * =======================================================================
 * BANCO DE DADOS DE QUESTÕES - CENTRO DE TREINAMENTO EMAC
 * =======================================================================
 * 
 * GUIA DE COMO CRIAR QUESTÕES PARA UM CAPÍTULO:
 * 
 * No final deste arquivo, você encontra o objeto principal `BANCO_QUESTOES_EMAC`.
 * Cada número (1 a 5) representa um capítulo da fábrica de móveis:
 *   1 = Capítulo 1: Setor de Corte
 *   2 = Capítulo 2: Setor de Montagem
 *   3 = Capítulo 3: Setor de Logística
 *   4 = Capítulo 4: Setor de Vendas
 *   5 = Capítulo 5: Otimização de Lucro
 * 
 * Para personalizar um capítulo (por exemplo, o Capítulo 3), substitua:
 *   3: criarQuestoesPadrao(3),
 * 
 * por uma lista com as suas próprias questões entre colchetes:
 *   3: [
 *       // Cole aqui suas questões usando os arquétipos abaixo!
 *   ],
 * 
 * DICA: Coloque pelo menos 5 questões (o sistema sorteia 5 aleatórias a cada rodada).
 * 
 * -----------------------------------------------------------------------
 * ARQUÉTIPO 1: QUESTÃO DE MÚLTIPLA ESCOLHA ('choice')
 * -----------------------------------------------------------------------
 * Copie e cole o modelo abaixo dentro da lista do capítulo desejado:
 * 
 * {
 *     id: 301,                                // Número de identificação único
 *     type: 'choice',                         // Tipo: sempre 'choice' para múltipla escolha
 *     topic: 'Tema da Questão',               // Título curto exibido no topo do card
 *     statement: `
 *         <p>Enunciado da questão aqui. Pode usar <strong>negrito</strong>.</p>
 *         <div class="math-formula-box">x + y ≤ 50</div>
 *     `,
 *     options: [                              // As 4 opções de resposta
 *         'Alternativa A',                    // Índice 0
 *         'Alternativa B',                    // Índice 1
 *         'Alternativa C',                    // Índice 2
 *         'Alternativa D'                     // Índice 3
 *     ],
 *     correctIndex: 1,                        // Índice da correta no seu código: 0 = A, 1 = B, 2 = C, 3 = D
 *                                             // NOTA: Na tela do site, o sistema embaralha a posição das
 *                                             // alternativas automaticamente para que nunca fique na mesma letra!
 *     explanation: `Explicação detalhada da resolução exibida após a verificação.`
 * },
 * 
 * -----------------------------------------------------------------------
 * ARQUÉTIPO 2: QUESTÃO DE ENTRADA EXATA ('input')
 * -----------------------------------------------------------------------
 * Copie e cole o modelo abaixo para perguntas onde o aluno deve digitar um número:
 * 
 * {
 *     id: 302,                                // Número de identificação único
 *     type: 'input',                          // Tipo: sempre 'input' para digitação
 *     topic: 'Tema da Questão',               // Título curto
 *     statement: `
 *         <p>Enunciado do problema de cálculo.</p>
 *         <p>Qual é o valor final calculado?</p>
 *     `,
 *     placeholder: 'Ex: 10',                  // Dica cinza que aparece dentro do campo
 *     unitPrefix: 'R$',                       // Prefixo antes do campo (ex: 'R$' ou '')
 *     unitSuffix: 'peças',                    // Sufixo depois do campo (ex: 'kg', 'horas' ou '')
 *     answer: 10,                             // Resposta correta principal
 *     acceptedAnswers: [10, '10', '10.0'],    // Formatos aceitos automaticamente
 *     explanation: `Passo a passo com o cálculo da resolução.`
 * },
 * =======================================================================
 */

// Função auxiliar que gera questões padrão (usada enquanto o capítulo não tiver questões personalizadas)
function criarQuestoesPadrao(capituloNum) {
    return [
        {
            id: capituloNum * 100 + 1,
            type: 'choice',
            topic: 'Atividade 1',
            statement: `
                <p>Enunciado da questão.</p>
                <p><strong>Resposta correta: Alternativa B</strong></p>
            `,
            options: [
                'Alternativa A',
                'Alternativa B',
                'Alternativa C',
                'Alternativa D'
            ],
            correctIndex: 1,
            explanation: `Explicação da resolução da questão.`
        },
        {
            id: capituloNum * 100 + 2,
            type: 'input',
            topic: 'Atividade 2',
            statement: `
                <p>Enunciado da questão.</p>
                <p><strong>Resposta correta: 10</strong></p>
            `,
            placeholder: 'Digite a resposta...',
            unitPrefix: '',
            unitSuffix: '',
            answer: 10,
            acceptedAnswers: [10, '10'],
            explanation: `Explicação da resolução da questão.`
        },
        {
            id: capituloNum * 100 + 3,
            type: 'choice',
            topic: 'Atividade 3',
            statement: `
                <p>Enunciado da questão.</p>
                <p><strong>Resposta correta: Alternativa C</strong></p>
            `,
            options: [
                'Alternativa A',
                'Alternativa B',
                'Alternativa C',
                'Alternativa D'
            ],
            correctIndex: 2,
            explanation: `Explicação da resolução da questão.`
        },
        {
            id: capituloNum * 100 + 4,
            type: 'input',
            topic: 'Atividade 4',
            statement: `
                <p>Enunciado da questão.</p>
                <p><strong>Resposta correta: 50</strong></p>
            `,
            placeholder: 'Digite a resposta...',
            unitPrefix: '',
            unitSuffix: '',
            answer: 50,
            acceptedAnswers: [50, '50'],
            explanation: `Explicação da resolução da questão.`
        },
        {
            id: capituloNum * 100 + 5,
            type: 'choice',
            topic: 'Atividade 5',
            statement: `
                <p>Enunciado da questão.</p>
                <p><strong>Resposta correta: Alternativa A</strong></p>
            `,
            options: [
                'Alternativa A',
                'Alternativa B',
                'Alternativa C',
                'Alternativa D'
            ],
            correctIndex: 0,
            explanation: `Explicação da resolução da questão.`
        },
        {
            id: capituloNum * 100 + 6,
            type: 'input',
            topic: 'Atividade 6',
            statement: `
                <p>Enunciado da questão.</p>
                <p><strong>Resposta correta: 25</strong></p>
            `,
            placeholder: 'Digite a resposta...',
            unitPrefix: '',
            unitSuffix: '',
            answer: 25,
            acceptedAnswers: [25, '25'],
            explanation: `Explicação da resolução da questão.`
        },
        {
            id: capituloNum * 100 + 7,
            type: 'choice',
            topic: 'Atividade 7',
            statement: `
                <p>Enunciado da questão.</p>
                <p><strong>Resposta correta: Alternativa D</strong></p>
            `,
            options: [
                'Alternativa A',
                'Alternativa B',
                'Alternativa C',
                'Alternativa D'
            ],
            correctIndex: 3,
            explanation: `Explicação da resolução da questão.`
        }
    ];
}

/**
 * =======================================================================
 * MAPEAMENTO DAS QUESTÕES POR CAPÍTULO
 * =======================================================================
 * Para personalizar um capítulo, basta trocar `criarQuestoesPadrao(X)`
 * por um array `[ ... ]` contendo as questões que você criar.
 */
const BANCO_QUESTOES_EMAC = {
    1: criarQuestoesPadrao(1),
    2: criarQuestoesPadrao(2),
    3: criarQuestoesPadrao(3),
    4: criarQuestoesPadrao(4),
    5: criarQuestoesPadrao(5)
};
