# Diretrizes e Regras de Desenvolvimento do AtendeMy CRM

> **Importante:** Este arquivo define as diretrizes de governança e compatibilidade do **AtendeMy CRM** com o repositório upstream oficial de **Rafael Martins (`melgarafael/DeskcommCRM`)**.

---

## 1. Contexto do Projeto
- **Nome:** AtendeMy CRM
- **Origem:** Fork e personalização do projeto open-source `melgarafael/DeskcommCRM`.
- **Objetivo Principal:** Manter o CRM 100% atualizado e alinhado com as atualizações e lançamentos do repositório oficial do Rafael, incorporando as personalizações de marca, cores, temas e configurações próprias do AtendeMy.

---

## 2. 🚨 Regra de Ouro: Inviolabilidade do Código-Fonte Upstream (Rafael)

1. **Proteção contra divergência de versão (Upstream Parity):**
   - **NÃO** altere nem refatore código-fonte original do Rafael para resolver bugs ou comportamentos nativos do sistema.
   - Caso um bug seja identificado no código-fonte original do Rafael:
     - **NÃO altere o código.**
     - Explique a causa ao usuário e informe qual arquivo/linha é responsável.
     - Explique que alterar aquele código quebrará a compatibilidade com o Git e impedirá o recebimento das próximas atualizações do repositório `melgarafael/DeskcommCRM`.

2. **🔓 Exceção Única para Destravamento (Override):**
   - A alteração no código-fonte original do Rafael só é permitida se o usuário fornecer explicitamente a ordem:
     > *"Autorizo destravar e desativar atualizações do código fonte."*
   - Sem essa instrução expressa, qualquer modificação no core do Rafael é **estritamente proibida**.

---

## 3. ✅ O Que É Permitido Modificar Libremente
- **Estilo e Identidade Visual (AtendeMy Theme):**
  - Customizações em `app/globals.css` (tema dark navy `#020914`, cores vibrantes, efeitos de brilho em ícones).
  - Ícones e cores de menus na sidebar (`components/shell/Sidebar.tsx` e `components/admin/AdminSidebar.tsx`).
  - Configurações de marca e logo no banco de dados e telas de administração (`/admin/marca`).
- **Configurações de Servidor e Ambiente:**
  - Arquivos `.env` e `.env.example`.
  - Configurações de Docker, VPS, Nginx/Traefik e variáveis de execução.
- **Banco de Dados Supabase:**
  - Migrations aditivas em `supabase/migrations/` e execução via `scripts/apply_all_migrations.js`.
- **Módulos e Extensões Isoladas:**
  - Criação de novas funcionalidades via plugins/extensões declarativas sem sobrescrever o núcleo do sistema.

---

## 4. ⛔ Restrições e Proibições
- ❌ **Não editar arquivos de migração já aplicados no Supabase** (crie sempre uma nova migration aditiva).
- ❌ **Não remover ou alterar testes unitários originais** para mascarar falhas.
- ❌ **Não alterar assinaturas de endpoints ou rotas públicas da API** que possam impactar webhooks ou integrações padrão.
- ❌ **Não comitar alterações acidentais no `.env`.**

---

## 5. ⚙️ Fluxo e Qualidade
- **Verificação do Git:** Mantenha sempre o `git status` limpo antes e depois de interações.
- **Bateria de Testes:** Execute `pnpm test:unit` para validar que nenhuma alteração visual ou de configuração quebrou os gates de branding ou governança do repositório.
