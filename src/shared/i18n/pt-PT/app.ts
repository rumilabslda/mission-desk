import type { Translation } from '../types';
import type { app as en } from '../en/app';

export const app: Translation<typeof en> = {
  // Welcome screen (no accounts yet)
  'app.welcome.title': 'Bem-vindo ao Mission Desk',
  'app.welcome.body': 'Adicione as apps que usa, como Google, Slack ou WhatsApp. Cada uma mantém a sua sessão iniciada à parte.',
  'app.welcome.addFirst': 'Adicionar a primeira conta',
  'app.welcome.setup': 'Ou configure espaços e apps passo a passo',

  // Sidebar
  'app.sidebar.home': 'Início',
  'app.sidebar.allCalendars': 'Todos os calendários',
  'app.sidebar.settings': 'Definições',
  'app.sidebar.muted': 'Silenciado',
  'app.sidebar.spaceClickToClose': '{name} — clique para fechar',
  'app.sidebar.quickActions': 'Ações rápidas',
  'app.sidebar.quickActionsTitle': 'Ações rápidas: link do Meet, evento, tarefa, assistente',
  'app.sidebar.updateReadyTitle': 'O Mission Desk {version} está pronto: reinicie para atualizar',
  'app.sidebar.updateReadyLabel': 'Definições. O Mission Desk {version} está pronto a instalar',
  'app.sidebar.add': 'Adicionar uma app ou um espaço',
  'app.sidebar.unread': 'Mensagens não lidas',

  // A closed space in the sidebar
  'app.spaceTile.title': '{name} ({count})',
  'app.spaceTile.titleSharesGoogle': '{name} ({count}) · partilha a sessão Google',

  // Service names that aren't brands
  'app.service.custom': 'Qualquer site',

  // Add / Edit app dialog
  'app.account.addTitle': 'Adicionar app',
  'app.account.editTitle': 'Editar conta',
  'app.account.service': 'Serviço',
  'app.account.address': 'Endereço',
  'app.account.addressPlaceholder': 'p. ex. notion.so',
  'app.account.addressError': 'Use um endereço https://.',
  'app.account.addressRequired': 'Introduza o endereço do site.',
  'app.account.name': 'Nome',
  'app.account.namePlaceholder': 'p. ex. Acme',
  'app.account.colour': 'Cor',
  'app.account.space': 'Espaço',
  'app.account.newSpace': 'Novo espaço…',
  'app.account.spaceName': 'Nome do espaço',
  'app.account.spaceNameRequired': 'Dê um nome ao novo espaço.',
  'app.account.hint.google': 'Gmail, Calendar, Drive e Meet para uma conta Google ou Workspace.',
  'app.account.hint.slack': 'Um espaço de trabalho do Slack.',
  'app.account.hint.whatsapp': 'WhatsApp Web. Vai ler um código QR com o telemóvel.',
  'app.account.hint.microsoft': 'Outlook, calendário e Teams para uma conta Microsoft profissional, escolar ou pessoal.',
  'app.account.hint.telegram': 'Telegram Web. Vai ler um código QR com o telemóvel.',
  'app.account.hint.linkedin': 'Mensagens e feed do LinkedIn para uma conta LinkedIn.',
  'app.account.hint.discord': 'Servidores e mensagens do Discord para uma conta Discord.',
  'app.account.hint.zoom': 'Team Chat, reuniões e calendário do Zoom na web, para uma conta Zoom.',
  'app.account.hint.proton': 'Proton Mail para uma conta Proton.',
  'app.account.hint.icloud': 'iCloud Mail para uma Conta Apple.',
  'app.account.hint.fastmail': 'E-mail, calendário e contactos do Fastmail para uma conta Fastmail.',
  'app.account.hint.notion': 'Uma conta Notion, com todos os seus espaços de trabalho. As páginas abertas a partir dela aparecem em separadores.',
  'app.account.hint.custom': 'Qualquer app web (Jira, HubSpot, Linear…), com a sua sessão à parte. As páginas abertas a partir dela aparecem em separadores.',

  // Space dialogs
  'app.space.name': 'Nome',
  'app.space.namePlaceholder': 'p. ex. Acme, Pessoal',
  'app.space.addTitle': 'Adicionar espaço',
  'app.space.appsInSpace': 'Apps neste espaço',
  'app.space.serviceInSpace': '{service} · em {space}',
  'app.space.newTitle': 'Novo espaço',
  'app.space.renameTitle': 'Mudar o nome do espaço',
  'app.space.rename': 'Mudar o nome',

  // Tab strip (Google, Microsoft 365, websites)
  'app.tab.calendar': 'Calendário',
  'app.tab.home': 'Início',
  'app.tab.close': 'Fechar {title}',
  'app.tab.offsite': 'Esta página está em {host}, fora de {app}',
  'app.tab.offsiteNoName': 'Esta página está em {host}, fora da app',
  'app.tab.openInBrowser': "Clique para a abrir no seu navegador.",
};
