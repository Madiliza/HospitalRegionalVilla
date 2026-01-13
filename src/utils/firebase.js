// ============================================
// OPERAÇÕES COM FIREBASE
// ============================================

import { salvarDados, lerDados, deletarDados } from '../../config/firebase-config.js';

export async function carregarDadosFirebase() {
    try {
        console.log('Carregando dados do Firebase...');
        
        // Carregar todas as coleções em paralelo
        const [pacientes, consultas, exames, medicamentos, cargos, usuarios, medicamentosConfig] = await Promise.all([
            lerDados('pacientes'),
            lerDados('consultas'),
            lerDados('exames'),
            lerDados('medicamentos'),
            lerDados('cargos'),
            lerDados('usuarios'),
            lerDados('medicamentosConfig')
        ]);

        // Converter objetos do Firebase para arrays
        const converterParaArray = (dados) => {
            if (!dados) return [];
            if (Array.isArray(dados)) return dados;
            return Object.values(dados);
        };

        const dadosCarregados = {
            pacientes: converterParaArray(pacientes),
            consultas: converterParaArray(consultas),
            exames: converterParaArray(exames),
            medicamentos: converterParaArray(medicamentos),
            cargos: converterParaArray(cargos),
            usuarios: converterParaArray(usuarios),
            medicamentosConfig: converterParaArray(medicamentosConfig)
        };

        console.log('Dados carregados do Firebase:', dadosCarregados);
        return dadosCarregados;
    } catch (erro) {
        console.error('Erro ao carregar dados do Firebase:', erro);
        return {
            pacientes: [],
            consultas: [],
            exames: [],
            medicamentos: [],
            cargos: [],
            usuarios: [],
            medicamentosConfig: []
        };
    }
}

export async function salvarNoFirebase(colecao, dados) {
    try {
        console.log(`Salvando dados em ${colecao}:`, dados);
        // Salvar usando o ID do item como chave
        await salvarDados(`${colecao}/${dados.id}`, dados);
        console.log(`Dados salvos com sucesso em ${colecao}`);
    } catch (erro) {
        console.error(`Erro ao salvar em ${colecao}:`, erro);
        throw erro;
    }
}

export async function deletarDoFirebase(colecao, id) {
    try {
        console.log(`Deletando ${id} de ${colecao}`);
        await deletarDados(`${colecao}/${id}`);
        console.log(`Item ${id} deletado com sucesso de ${colecao}`);
    } catch (erro) {
        console.error(`Erro ao deletar de ${colecao}:`, erro);
        throw erro;
    }
}
