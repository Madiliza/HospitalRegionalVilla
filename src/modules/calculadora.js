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
    if (dadosCarregados.valoresAtendimentos) {
        if (dadosCarregados.valoresAtendimentos.tratamentoInterno !== undefined) {
            valoresAtendimentos = dadosCarregados.valoresAtendimentos;
        }
        else if (dadosCarregados.valoresAtendimentos.valoresAtendimentos) {
            valoresAtendimentos = dadosCarregados.valoresAtendimentos.valoresAtendimentos;
        }
    }
    
    medicamentosConfig = dadosCarregados.medicamentosConfig || [];
    
    // Aguardar DOM carregar e renderizar medicamentos
    setTimeout(() => {
        renderizarMedicamentos();
    }, 500);
}

function renderizarMedicamentos() {
    const listaMedicamentos = document.getElementById('lista-medicamentos-calc');
    const listaParcerias = document.getElementById('lista-parcerias-calc');
    
    if (!listaMedicamentos || !listaParcerias) return;
    
    if (medicamentosConfig.length === 0) {
        listaMedicamentos.innerHTML = '<p class="text-gray-500 text-sm">Nenhum medicamento cadastrado</p>';
        listaParcerias.innerHTML = '<p class="text-gray-500 text-sm">Nenhum medicamento cadastrado</p>';
        return;
    }
    
    // Renderizar medicamentos normais
    listaMedicamentos.innerHTML = medicamentosConfig.map((med, index) => `
        <div class="flex items-center justify-between">
            <label class="flex items-center space-x-2 flex-1">
                <input type="checkbox" id="med-${index}" data-med-id="${med.id}" onchange="window.moduloCalculadora.calcularTotal()" class="w-4 h-4 text-blue-600 rounded">
                <span class="text-gray-700">${med.nome}</span>
                <span class="text-xs text-gray-500">(R$ ${parseFloat(med.preco).toFixed(2)})</span>
            </label>
            <input type="number" id="med-${index}-qtd" class="w-20 px-2 py-1 border border-gray-300 rounded text-center" placeholder="0" min="0" value="0" onchange="window.moduloCalculadora.calcularTotal()">
            <span class="text-gray-500 text-sm ml-1">un.</span>
        </div>
    `).join('');
    
    // Renderizar parcerias
    listaParcerias.innerHTML = medicamentosConfig.map((med, index) => `
        <div class="flex items-center justify-between">
            <label class="flex items-center space-x-2 flex-1">
                <input type="checkbox" id="parc-${index}" data-med-id="${med.id}" onchange="window.moduloCalculadora.calcularTotal()" class="w-4 h-4 text-green-600 rounded">
                <span class="text-gray-700">${med.nome}</span>
                <span class="text-xs text-gray-500">(R$ ${parseFloat(med.precoParceria || med.preco).toFixed(2)})</span>
            </label>
            <input type="number" id="parc-${index}-qtd" class="w-20 px-2 py-1 border border-gray-300 rounded text-center" placeholder="0" min="0" value="0" onchange="window.moduloCalculadora.calcularTotal()">
            <span class="text-gray-500 text-sm ml-1">un.</span>
        </div>
    `).join('');
}

export function calcularTotal() {
    // Calcular total de medicamentos (dinâmico)
    let totalMedicamentos = 0;
    medicamentosConfig.forEach((med, index) => {
        const checkbox = document.getElementById(`med-${index}`);
        const quantidade = document.getElementById(`med-${index}-qtd`);
        
        if (checkbox && checkbox.checked && quantidade) {
            const qtd = parseInt(quantidade.value) || 0;
            const valor = parseFloat(med.preco) || 0;
            totalMedicamentos += qtd * valor;
        }
    });

    // Calcular total de parcerias (dinâmico)
    let totalParcerias = 0;
    medicamentosConfig.forEach((med, index) => {
        const checkbox = document.getElementById(`parc-${index}`);
        const quantidade = document.getElementById(`parc-${index}-qtd`);
        
        if (checkbox && checkbox.checked && quantidade) {
            const qtd = parseInt(quantidade.value) || 0;
            const valor = parseFloat(med.precoParceria) || parseFloat(med.preco) || 0;
            totalParcerias += qtd * valor;
        }
    });

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

    // Limpar todas as quantidades
    document.querySelectorAll('#calculadora input[type="number"]').forEach(input => {
        input.value = '0';
    });

    calcularTotal();
}

// Exportar como global
window.moduloCalculadora = {
    calcularTotal,
    limparTudo,
    init,
    valoresAtendimentos
};
