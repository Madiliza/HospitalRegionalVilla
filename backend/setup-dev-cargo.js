/**
 * Script para configurar cargo DEV com acesso total
 * Rode este script no console do navegador (F12)
 * 
 * Copie e cole no console:
 * 
 * fetch('./config/setup-dev-cargo.js')
 *   .then(r => r.text())
 *   .then(eval)
 *   .catch(e => console.error('Erro:', e))
 */

import { salvarDados } from '../config/firebase-config.js';

export async function configurarCargoDev() {
    try {
        console.log('⚙️ Configurando cargo DEV com acesso total...');
        
        // Cargo DEV com todas as permissões
        const cargoDev = {
            id: "cargo_dev",
            nome: "DEV",
            descricao: "Desenvolvedor - Acesso Total ao Sistema",
            permissoes: {
                "paciente": ["criar", "visualizar", "editar", "apagar"],
                "consulta": ["criar", "visualizar", "editar", "apagar"],
                "exame": ["criar", "visualizar", "editar", "apagar"],
                "farmacia": ["criar", "visualizar", "editar", "apagar"],
                "cargo": ["criar", "visualizar", "editar", "apagar"]
            },
            dataCriacao: new Date().toLocaleString('pt-BR')
        };

        // Salvar cargo DEV
        await salvarDados('cargos/cargo_dev', cargoDev);
        console.log('✅ Cargo DEV criado com sucesso!');

        // Atualizar usuário DEV para usar o novo cargo
        const usuarioDev = {
            id: "2003",
            nome: "Dev",
            email: "dev@hospital.com",
            senha: "DevLiza123!",
            cargo: "DEV",
            ativo: true
        };

        await salvarDados('usuarios/2003', usuarioDev);
        console.log('✅ Usuário DEV atualizado com cargo DEV!');

        console.log('🎉 Configuração concluída! Recarregue a página para ver as mudanças.');
        console.log('📝 Faça login com: ID=2003, Senha=DevLiza123!');

        return true;
    } catch (erro) {
        console.error('❌ Erro ao configurar cargo DEV:', erro);
        return false;
    }
}

// Executar automaticamente ao importar
configurarCargoDev();
