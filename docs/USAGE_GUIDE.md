# Hospital Regional Villa - Sistema de Gestão

Um sistema moderno e completo para gerenciamento hospitalar desenvolvido com **JavaScript**, **Tailwind CSS** e **Firebase**.

## 🎯 Funcionalidades

### 📋 Dashboard
- Visualização rápida de estatísticas
- Total de pacientes, consultas, exames e medicamentos
- Cards interativos com acesso direto aos módulos

### 👥 Gestão de Pacientes
- Cadastrar novo paciente com ID, Nome, Idade e Observação
- Visualizar lista completa de pacientes
- Deletar pacientes do sistema
- Dados sincronizados com Firebase

### 🏥 Marcar Consultas
- Agendar consultas com especialidade, data e hora
- Validação de paciente existente
- Lista de consultas agendadas
- Cancelar consultas quando necessário

### 🧬 Marcar Exames
- Registrar diversos tipos de exames
- Agendar data e hora do exame
- Vinculação com pacientes
- Gerenciamento completo de exames

### 💊 Farmácia
- Registrar medicamentos entregues
- Quantidade de medicamentos
- Data de entrega
- Histórico completo de medicamentos dispensados
- Rastreamento por paciente

### 🧮 Calculadora de Medicamentos
- Espaço reservado para ferramentas de cálculo
- Pronto para implementação personalizada

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS 4.x
- **Ícones**: Font Awesome 6.x
- **Backend**: Firebase (Realtime Database + Authentication)
- **Build Tool**: Vite

## 📦 Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
# Copie as credenciais do Firebase no arquivo .env

# 3. Executar em desenvolvimento
npm run dev

# 4. Build para produção
npm run build
```

## 🔐 Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Habilite **Realtime Database** e **Authentication**
3. Copie as credenciais e adicione ao arquivo `.env`:

```env
FIREBASE_API_KEY=sua_api_key
FIREBASE_AUTH_DOMAIN=seu_auth_domain
FIREBASE_DATABASE_URL=sua_database_url
FIREBASE_PROJECT_ID=seu_project_id
FIREBASE_STORAGE_BUCKET=seu_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
FIREBASE_APP_ID=sua_app_id
```

## 📁 Estrutura do Projeto

```
HospitalRegionalVilla/
├── public/              # Arquivos estáticos
│   └── index.html      # Interface principal
├── src/                # Código fonte
│   └── index.js        # Lógica da aplicação
├── config/             # Configurações
│   ├── firebase-config.js  # Configuração do Firebase
│   └── .env           # Variáveis de ambiente
├── docs/               # Documentação
├── vite.config.js      # Configuração do Vite
├── package.json        # Dependências
└── README.md          # Este arquivo
```

## 🎨 Design

- Interface moderna e responsiva
- Cores vibrantes para melhor UX
- Animações suaves em modais
- Cards com hover effects
- Sidebar com navegação intuitiva
- Notificações em tempo real

## 💾 Armazenamento de Dados

Todos os dados são salvos no Firebase Realtime Database com a seguinte estrutura:

```
firebase/
├── pacientes/
│   ├── {pacienteId}
│   └── {...}
├── consultas/
│   ├── {consultaId}
│   └── {...}
├── exames/
│   ├── {exameId}
│   └── {...}
└── medicamentos/
    ├── {medicamentoId}
    └── {...}
```

## 🚀 Como Usar

### Cadastrar Paciente
1. Clique em "Pacientes" na sidebar
2. Clique em "Novo Paciente"
3. Preencha ID, Nome, Idade e Observação
4. Clique em "Salvar Paciente"

### Marcar Consulta
1. Clique em "Consultas" na sidebar
2. Clique em "Nova Consulta"
3. Informe ID do paciente, especialidade, data e hora
4. Clique em "Agendar Consulta"

### Marcar Exame
1. Clique em "Exames" na sidebar
2. Clique em "Novo Exame"
3. Informe ID do paciente, tipo de exame, data e hora
4. Clique em "Agendar Exame"

### Registrar Medicamento
1. Clique em "Farmácia" na sidebar
2. Clique em "Registrar Medicamento"
3. Preencha nome, quantidade, ID do paciente e data
4. Clique em "Registrar Medicamento"

## 📝 Notas Importantes

- O ID do paciente é **obrigatório** para agendar consultas, exames e medicamentos
- Verifique se a credencial do Firebase está corretamente configurada antes de usar
- A aplicação sincroniza dados em tempo real com o banco de dados
- Todas as datas são formatadas automaticamente

## 🔄 Próximas Melhorias

- [ ] Implementar Calculadora de Medicamentos
- [ ] Adicionar gráficos e relatórios
- [ ] Sistema de autenticação de usuários
- [ ] Impressão de fichas de pacientes
- [ ] Notificações de lembretes de consultas
- [ ] Integração com SMS/Email
- [ ] Dashboard administrativo

## 📞 Suporte

Para dúvidas ou problemas, verifique:
1. Configuração do Firebase
2. Variáveis de ambiente (.env)
3. Console do navegador para mensagens de erro

## 📄 Licença

MIT

---

**Desenvolvido com ❤️ para Hospital Regional Villa**
