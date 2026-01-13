// ============================================
// MÓDULO DE CALCULADORA
// ============================================

import { mostrarNotificacao } from '../utils/dialogs.js';

export let valoresAtendimentos = {
    tratamentoInterno: 0,
    atendimentoExternoSul: 0,
    atendimentoExternoNorte: 0,
    consulta: 0,
    exame: 0
};

export let medicamentosConfig = [];

export function init(dadosCarregados) {
    valoresAtendimentos = dadosCarregados.valoresAtendimentos || {
        tratamentoInterno: 0,
        atendimentoExternoSul: 0,
        atendimentoExternoNorte: 0,
        consulta: 0,
        exame: 0
    };
    
    medicamentosConfig = dadosCarregados.medicamentosConfig || [];
}

function obterValorMedicamento(nomeMedicamento, isParceria = false) {
    const med = medicamentosConfig.find(m => m.nome === nomeMedicamento);
    if (!med) return 0;
    
    if (isParceria) {
        return parseFloat(med.precoParceria) || parseFloat(med.preco) || 0;
    }
    return parseFloat(med.preco) || 0;
}

export function calcularTotal() {
    // Medicamentos
    const medicamentos = {
        bandagem: {
            checkbox: document.getElementById('med-bandagem'),
            quantidade: document.getElementById('med-bandagem-qtd'),
            nome: 'Bandagem'
        },
        analgesico: {
            checkbox: document.getElementById('med-analgesico'),
            quantidade: document.getElementById('med-analgesico-qtd'),
            nome: 'Analgésico'
        },
        kit: {
            checkbox: document.getElementById('med-kit'),
            quantidade: document.getElementById('med-kit-qtd'),
            nome: 'Kit Médico'
        }
    };

    // Parcerias
    const parcerias = {
        bandagem: {
            checkbox: document.getElementById('parc-bandagem'),
            quantidade: document.getElementById('parc-bandagem-qtd'),
            nome: 'Bandagem'
        },
        analgesico: {
            checkbox: document.getElementById('parc-analgesico'),
            quantidade: document.getElementById('parc-analgesico-qtd'),
            nome: 'Analgésico'
        },
        kit: {
            checkbox: document.getElementById('parc-kit'),
            quantidade: document.getElementById('parc-kit-qtd'),
            nome: 'Kit Médico'
        }
    };

    // Atendimentos
    const atendimentos = {
        interno: {
            checkbox: document.getElementById('atend-interno'),
            quantidade: document.getElementById('atend-interno-qtd')
        },
        externoSul: {
            checkbox: document.getElementById('atend-externo-sul'),
            quantidade: document.getElementById('atend-externo-sul-qtd')
        },
        externoNorte: {
            checkbox: document.getElementById('atend-externo-norte'),
            quantidade: document.getElementById('atend-externo-norte-qtd')
        },
        consulta: {
            checkbox: document.getElementById('atend-consulta'),
            quantidade: document.getElementById('atend-consulta-qtd')
        },
        exame: {
            checkbox: document.getElementById('atend-exame'),
            quantidade: document.getElementById('atend-exame-qtd')
        }
    };

    // Calcular total de medicamentos
    let totalMedicamentos = 0;
    Object.values(medicamentos).forEach(med => {
        if (med.checkbox && med.quantidade && med.checkbox.checked) {
            const qtd = parseInt(med.quantidade.value) || 0;
            const valor = obterValorMedicamento(med.nome, false);
            totalMedicamentos += qtd * valor;
        }
    });

    // Calcular total de parcerias
    let totalParcerias = 0;
    Object.values(parcerias).forEach(parc => {
        if (parc.checkbox && parc.quantidade && parc.checkbox.checked) {
            const qtd = parseInt(parc.quantidade.value) || 0;
            const valor = obterValorMedicamento(parc.nome, true);
            totalParcerias += qtd * valor;
        }
    });

    // Calcular total de atendimentos
    let totalAtendimentos = 0;
    const nomesCampos = {
        interno: 'tratamentoInterno',
        externoSul: 'atendimentoExternoSul',
        externoNorte: 'atendimentoExternoNorte',
        consulta: 'consulta',
        exame: 'exame'
    };

    Object.entries(atendimentos).forEach(([key, atend]) => {
        if (atend.checkbox && atend.checkbox.checked && atend.quantidade) {
            const quantidade = parseInt(atend.quantidade.value) || 0;
            const valorConfiguracao = valoresAtendimentos[nomesCampos[key]] || 0;
            totalAtendimentos += quantidade * valorConfiguracao;
        }
    });

    // Atualizar totais na tela
    const totalGeral = totalMedicamentos + totalParcerias + totalAtendimentos;

    const elemTotalMedicamentos = document.getElementById('total-medicamentos');
    const elemTotalParcerias = document.getElementById('total-parcerias');
    const elemTotalAtendimentos = document.getElementById('total-atendimentos');
    const elemTotalGeral = document.getElementById('total-geral');

    if (elemTotalMedicamentos) elemTotalMedicamentos.textContent = totalMedicamentos.toFixed(2);
    if (elemTotalParcerias) elemTotalParcerias.textContent = totalParcerias.toFixed(2);
    if (elemTotalAtendimentos) elemTotalAtendimentos.textContent = totalAtendimentos.toFixed(2);
    if (elemTotalGeral) elemTotalGeral.textContent = totalGeral.toFixed(2);
}

export function limparTudo() {
    // Desmarcar todos os checkboxes
    document.querySelectorAll('#calculadora input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Limpar quantidades de medicamentos e parcerias
    document.querySelectorAll('#calculadora input[type="number"][id*="-qtd"]').forEach(input => {
        if (!input.id.includes('atend-')) {
            input.value = '0';
        }
    });

    // Limpar quantidades de atendimentos
    document.querySelectorAll('#calculadora input[type="number"][id*="atend-"][id*="-qtd"]').forEach(input => {
        input.value = '0';
    });

    calcularTotal();
}

// Exportar como global
window.moduloCalculadora = {
    calcularTotal,
    limparTudo,
    init
};
