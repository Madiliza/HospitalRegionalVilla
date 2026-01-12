# Projeto Firebase com JavaScript

Um projeto básico para integração com Firebase usando JavaScript. Inclui autenticação de usuários, leitura e escrita de dados em tempo real.

## Estrutura do Projeto

```
projeto/
├── index.html              # Interface web
├── index.js                # Arquivo principal (Node.js)
├── firebase-config.js      # Configuração e funções Firebase
├── package.json            # Dependências do projeto
└── README.md               # Este arquivo
```

## Funcionalidades

- ✅ Autenticação de usuários (criar conta, login, logout)
- ✅ Realtime Database (salvar e carregar dados)
- ✅ Interface web responsiva
- ✅ Suporte para Node.js e navegador

## Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Firebase

Obtenha suas credenciais do Firebase Console (https://console.firebase.google.com/):

1. Crie um novo projeto no Firebase
2. Ative a autenticação por email/senha
3. Ative o Realtime Database
4. Copie suas configurações

### 3. Adicionar credenciais

**Para uso no navegador** (index.html):
- Abra o arquivo `index.html`
- Procure por `SUA_API_KEY` e substitua pela sua configuração do Firebase

**Para uso no Node.js** (index.js):
- Abra o arquivo `firebase-config.js`
- Procure por `SUA_API_KEY` e substitua pela sua configuração do Firebase

## Uso

### Usar no Navegador

```bash
# Abra o arquivo index.html em um navegador
# Ou use uma extensão como Live Server no VS Code
```

### Usar no Node.js

```bash
# Executar o arquivo principal
npm start

# Ou em modo desenvolvimento (com auto-reload)
npm run dev
```

## Exemplos de Código

### Criar Usuário

```javascript
import { criarUsuario } from './firebase-config.js';

await criarUsuario('usuario@exemplo.com', 'senha123');
```

### Fazer Login

```javascript
import { fazerLogin } from './firebase-config.js';

await fazerLogin('usuario@exemplo.com', 'senha123');
```

### Salvar Dados

```javascript
import { salvarDados } from './firebase-config.js';

await salvarDados('usuarios/user1', {
  nome: 'João Silva',
  idade: 30
});
```

### Carregar Dados

```javascript
import { lerDados } from './firebase-config.js';

const dados = await lerDados('usuarios/user1');
```

### Fazer Logout

```javascript
import { fazerLogout } from './firebase-config.js';

await fazerLogout();
```

## Configuração do Firebase Console

1. **Criar Projeto:**
   - Acesse https://console.firebase.google.com/
   - Clique em "Criar projeto"
   - Siga as instruções

2. **Ativar Autenticação:**
   - No painel esquerdo, vá para "Autenticação"
   - Clique em "Começar"
   - Selecione "Email/Senha"
   - Ative a opção

3. **Ativar Realtime Database:**
   - No painel esquerdo, vá para "Realtime Database"
   - Clique em "Criar banco de dados"
   - Escolha a localização
   - Inicie em modo de teste (desenvolvimento)

4. **Copiar Credenciais:**
   - Vá para "Configurações do Projeto" (ícone de engrenagem)
   - Selecione "Apps"
   - Clique em "Firebase SDK snippet"
   - Copie a configuração e adicione ao projeto

## Segurança

**⚠️ IMPORTANTE:** Nunca compartilhe suas chaves de API ou credenciais. Para produção:

1. Use variáveis de ambiente
2. Configure as regras de segurança do Firebase
3. Use Firebase Cloud Functions para operações sensíveis

### Exemplo de arquivo `.env` (Node.js)

```env
FIREBASE_API_KEY=sua_chave_aqui
FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
FIREBASE_DATABASE_URL=https://seu-projeto.firebaseio.com
FIREBASE_PROJECT_ID=seu-projeto
```

## Recursos

- [Documentação Firebase](https://firebase.google.com/docs)
- [Firebase JavaScript SDK](https://firebase.google.com/docs/web/setup)
- [Autenticação Firebase](https://firebase.google.com/docs/auth)
- [Realtime Database](https://firebase.google.com/docs/database)

## Licença

MIT
