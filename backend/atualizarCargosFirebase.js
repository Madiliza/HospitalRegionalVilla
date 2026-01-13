/**
 * Script para atualizar cargos no Firebase com a permissão 'usuario'
 * Copie e cole no console do navegador (F12):
 * 
 * import('./backend/atualizarCargosFirebase.js').then(m => m.atualizarCargos());
 */

import { salvarDados } from '../config/firebase-config.js';

export async function atualizarCargos() {
    try {
        
        // Cargo DEV
        const cargoDev = {
            id: "cargo_dev",
            nome: "DEV",
            descricao: "Desenvolvedor - Acesso Total ao Sistema",
            permissoes: {
                "paciente": ["criar", "visualizar", "editar", "apagar"],
                "consulta": ["criar", "visualizar", "editar", "apagar"],
                "exame": ["criar", "visualizar", "editar", "apagar"],
                "farmacia": ["criar", "visualizar", "editar", "apagar"],
                "cargo": ["criar", "visualizar", "editar", "apagar"],
                "usuario": ["criar", "visualizar", "editar", "apagar"]
            },
            dataCriacao: new Date().toLocaleString('pt-BR')
        };

        // Cargo Diretor
        const cargoDiretor = {
            id: "cargo_diretor",
            nome: "Diretor",
            descricao: "Diretor - Acesso Total",
            permissoes: {
                "paciente": ["criar", "visualizar", "editar", "apagar"],
                "consulta": ["criar", "visualizar", "editar", "apagar"],
                "exame": ["criar", "visualizar", "editar", "apagar"],
                "farmacia": ["criar", "visualizar", "editar", "apagar"],
                "cargo": ["criar", "visualizar", "editar", "apagar"],
                "usuario": ["criar", "visualizar", "editar", "apagar"]
            },
            dataCriacao: new Date().toLocaleString('pt-BR')
        };

        // Salvar cargos
        await salvarDados('cargos/cargo_dev', cargoDev);

        await salvarDados('cargos/cargo_diretor', cargoDiretor);

        return true;
    } catch (erro) {
        return false;
    }
}

// Executar automaticamente se importado como módulo
if (import.meta.url === `file://${import.meta.url.split('?')[0]}`) {
    atualizarCargos();
}
