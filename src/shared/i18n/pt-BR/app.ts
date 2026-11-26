import type { Translation } from '../types';
import type { app as en } from '../en/app';

export const app: Translation<typeof en> = {
  // Welcome screen (no accounts yet)
  'app.welcome.title': 'Boas-vindas ao Mission Desk',
  'app.welcome.body': 'Adicione os apps que você usa, como Google, Slack ou WhatsApp. Cada um mantém o próprio login.',
  'app.welcome.addFirst': 'Adicione sua primeira conta',
  'app.welcome.setup': 'Ou configure espaços e apps passo a passo',

  // Sidebar
  'app.sidebar.home': 'Início',
  'app.sidebar.allCalendars': 'Todos os calendários',
  'app.sidebar.settings': 'Ajustes',
  'app.sidebar.muted': 'Silenciado',
  'app.sidebar.spaceClickToClose': '{name} — clique para fechar',
  'app.sidebar.quickActions': 'Ações rápidas',
  'app.sidebar.quickActionsTitle': 'Ações rápidas: link do Meet, evento, tarefa, assistente',
  'app.sidebar.updateReadyTitle': 'O Mission Desk {version} está pronto: reinicie para atualizar',
  'app.sidebar.updateReadyLabel': 'Ajustes. O Mission Desk {version} está pronto para instalar',
  'app.sidebar.add': 'Adicionar um app ou um espaço',
  'app.sidebar.unread': 'Mensagens não lidas',

  // A closed space in the sidebar
  'app.spaceTile.title': '{name} ({count})',
  'app.spaceTile.titleSharesGoogle': '{name} ({count}) · compartilha o login do Google',

  // Service names that aren't brands
  'app.service.custom': 'Qualquer site',

  // Add / Edit app dialog
  'app.account.addTitle': 'Adicionar app',
  'app.account.editTitle': 'Editar conta',
  'app.account.service': 'Serviço',
  'app.account.address': 'Endereço',
  'app.account.addressPlaceholder': 'ex.: notion.so',
  'app.account.addressError': 'Use um endereço https://.',
  'app.account.addressRequired': 'Digite o endereço do site.',
  'app.account.name': 'Nome',
  'app.account.namePlaceholder': 'ex.: Acme',
  'app.account.colour': 'Cor',
  'app.account.space': 'Espaço',
  'app.account.newSpace': 'Novo espaço…',
  'app.account.spaceName': 'Nome do espaço',
  'app.account.spaceNameRequired': 'Dê um nome ao novo espaço.',
  'app.account.hint.google': 'Gmail, Agenda, Drive e Meet de uma conta do Google ou do Workspace.',
  'app.account.hint.slack': 'Um workspace do Slack.',
  'app.account.hint.whatsapp': 'WhatsApp Web. Você vai escanear um código QR com o celular.',
  'app.account.hint.microsoft': 'Outlook, Calendário e Teams de uma conta Microsoft pessoal, corporativa ou de estudante.',
  'app.account.hint.telegram': 'Telegram Web. Você vai escanear um código QR com o celular.',
  'app.account.hint.linkedin': 'Mensagens e feed do LinkedIn de uma conta do LinkedIn.',
  'app.account.hint.discord': 'Servidores e mensagens do Discord de uma conta do Discord.',
  'app.account.hint.zoom': 'Team Chat, reuniões e calendário do Zoom na web, de uma conta do Zoom.',
  'app.account.hint.proton': 'Proton Mail de uma conta Proton.',
  'app.account.hint.icloud': 'Mail do iCloud de uma Conta Apple.',
  'app.account.hint.fastmail': 'E-mail, calendário e contatos do Fastmail de uma conta Fastmail.',
  'app.account.hint.notion': 'Uma conta do Notion, com todos os workspaces dela. As páginas que ela abre viram abas.',
  'app.account.hint.custom': 'Qualquer app da web (Jira, HubSpot, Linear…), com o próprio login. As páginas que ele abre viram abas.',

  // Space dialogs
  'app.space.name': 'Nome',
  'app.space.namePlaceholder': 'ex.: Acme, Pessoal',
  'app.space.addTitle': 'Adicionar espaço',
  'app.space.appsInSpace': 'Apps neste espaço',
  'app.space.serviceInSpace': '{service} · em {space}',
  'app.space.newTitle': 'Novo espaço',
  'app.space.renameTitle': 'Renomear espaço',
  'app.space.rename': 'Renomear',

  // Tab strip (Google, Microsoft 365, websites)
  'app.tab.calendar': 'Calendário',
  'app.tab.home': 'Início',
  'app.tab.close': 'Fechar {title}',
  'app.tab.offsite': 'Esta página está em {host}, fora do {app}',
  'app.tab.offsiteNoName': 'Esta página está em {host}, fora do app',
  'app.tab.openInBrowser': "Clique para abrir no seu navegador.",
};
