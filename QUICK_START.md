# 🏥 Sistema de Gestão Hospital Regional Villa

Uma aplicação moderna e completa para gerenciar pacientes, consultas, exames e farmácia.

## 📋 O que foi criado

✅ **Interface moderna** com Dashboard interativo
✅ **Gestão de Pacientes** - Cadastro com ID, Nome, Idade e Observações
✅ **Marcar Consultas** - Agendamento com especialidade, data e hora
✅ **Marcar Exames** - Registro de exames com tipos diversos
✅ **Controle de Farmácia** - Registro de medicamentos entregues
✅ **Calculadora de Medicamentos** - Espaço reservado para implementação
✅ **Design Responsivo** - Funciona em desktop, tablet e mobile
✅ **Integração Firebase** - Dados sincronizados em tempo real

## 🚀 Como Rodar

### 1. **Configurar Firebase**
   - Acesse [Firebase Console](https://console.firebase.google.com/)
   - Crie um novo projeto
   - Habilite **Realtime Database** e **Authentication**
   - Copie as credenciais e cole no arquivo `.env`

### 2. **Instalar Dependências**
```bash
npm install
```

### 3. **Rodar em Desenvolvimento**
```bash
npm run dev
```
A aplicação abrirá em `http://localhost:5173`

### 4. **Build para Produção**
```bash
npm run build
```

## 📁 Estrutura do Projeto

```
HospitalRegionalVilla/
├── public/           # Arquivos estáticos
│   └── index.html   # Interface (HTML + CSS Tailwind)
├── src/             # Código-fonte
│   ├── index.js     # Lógica da aplicação
│   └── styles.css   # Estilos customizados
├── config/          # Configurações
│   ├── firebase-config.js  # Firebase setup
│   └── .env         # Variáveis de ambiente
├── docs/            # Documentação
├── vite.config.js   # Configuração Vite
├── package.json     # Dependências
└── README.md        # Este arquivo
```

## 🎯 Funcionalidades Principais

### 📊 Dashboard
- Visualização rápida de estatísticas
- Total de pacientes, consultas, exames e medicamentos

### 👥 Gerenciar Pacientes
- ✏️ Adicionar novo paciente
- 📋 Visualizar lista completa
- 🗑️ Deletar paciente
- 💾 Sincronizar com Firebase

### 🏥 Marcar Consultas
- Agendar com especialidade específica
- Data e hora personalizados
- Validação de paciente existente
- Histórico completo

### 🧬 Marcar Exames
- Diversos tipos de exames
- Agendamento automático
- Vinculação com pacientes
- Gerenciamento completo

### 💊 Controle de Farmácia
- Registrar medicamentos entregues
- Quantidade em unidades
- Data de entrega
- Histórico por paciente

## 🛠️ Tecnologias

- **Frontend**: HTML5 + CSS3 + JavaScript ES6+
- **Styling**: Tailwind CSS 4.x
- **Ícones**: Font Awesome 6.x
- **Build**: Vite
- **Backend**: Firebase (Realtime Database + Auth)

## 📝 Variáveis de Ambiente

Crie um arquivo `.env` em `config/` com:

```env
FIREBASE_API_KEY=sua_chave
FIREBASE_AUTH_DOMAIN=seu_dominio
FIREBASE_DATABASE_URL=sua_url
FIREBASE_PROJECT_ID=seu_id
FIREBASE_STORAGE_BUCKET=seu_bucket
FIREBASE_MESSAGING_SENDER_ID=seu_id
FIREBASE_APP_ID=sua_app_id
```

## 💡 Dicas de Uso

1. **ID do Paciente**: Use um identificador único (pode ser um número ou código)
2. **Campos Obrigatórios**: Sempre preencha ID, Nome e Idade
3. **Validação**: O sistema valida se o paciente existe antes de agendar
4. **Notificações**: Aparecerá uma mensagem de sucesso/erro ao realizar ações
5. **Dados em Tempo Real**: Tudo é sincronizado com Firebase automaticamente

## 📊 Estrutura de Dados no Firebase

```
firebase/
├── pacientes/
│   └── {id}: { nome, idade, observacao, dataCriacao }
├── consultas/
│   └── {id}: { pacienteId, especialidade, data, hora }
├── exames/
│   └── {id}: { pacienteId, tipo, data, hora }
└── medicamentos/
    └── {id}: { nome, quantidade, pacienteId, data }
```

## 🎨 Customização

### Cores Principais
- **Azul**: #3b82f6 (Principal)
- **Verde**: #10b981 (Sucesso)
- **Roxo**: #7c3aed (Secundário)
- **Laranja**: #f97316 (Atenção)

### Adicionar Novo Módulo
1. Adicione a seção HTML no arquivo `index.html`
2. Crie funções de controle em `src/index.js`
3. Use o padrão existente para manter consistência

## 🔐 Segurança

- Credenciais do Firebase via variáveis de ambiente
- Validação de entrada de dados
- Proteção contra campos vazios
- Confirmação antes de deletar dados

## 🚦 Próximas Melhorias

- [ ] Implementar Calculadora de Medicamentos com fórmulas
- [ ] Adicionar gráficos e relatórios com Chart.js
- [ ] Sistema de autenticação de usuários
- [ ] Impressão de fichas de pacientes
- [ ] Notificações de lembretes
- [ ] Integração com SMS/Email
- [ ] Dashboard administrativo

## 📞 Suporte e Troubleshooting

### Firebase não conecta
1. Verifique se as variáveis de ambiente estão corretas
2. Confirme que o Realtime Database está habilitado
3. Verifique as regras de segurança do Firebase

### Dados não salvam
1. Verifique a conexão de internet
2. Abra o console (F12) para ver mensagens de erro
3. Confirme as credenciais do Firebase

### Problema com Tailwind
1. Rode `npm install` novamente
2. Verifique se o `vite.config.js` está correto
3. Limpe o cache (`npm run build`)

## 📄 Licença

MIT - Desenvolvido com ❤️ para Hospital Regional Villa

---

**Criado em:** 12 de Janeiro de 2026
**Versão:** 1.0.0
