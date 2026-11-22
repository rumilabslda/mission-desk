import type { Translation } from '../types';
import type { setup as en } from '../en/setup';

export const setup: Translation<typeof en> = {
  // Names the setup gives (src/shared/setup.ts)
  'setup.app.website': 'Site',
  'setup.spaces.tooLong': 'Use menos de {max} caracteres.',
  'setup.spaces.taken': '{name} já existe.',

  // What each service brings (the tiles)
  'setup.service.googleWhat': 'Gmail, Agenda, Drive',
  'setup.service.slackWhat': 'Um workspace',
  'setup.service.whatsappWhat': 'Suas conversas',
  'setup.service.telegramWhat': 'Suas conversas',
  'setup.service.linkedinWhat': 'Mensagens, feed',
  'setup.service.discordWhat': 'Servidores, DMs',
  'setup.service.zoomWhat': 'Team Chat, reuniões',
  'setup.service.notionWhat': 'Páginas, wikis',
  'setup.service.protonWhat': 'E-mail privado',
  'setup.service.icloudWhat': 'E-mail da Apple',
  'setup.service.fastmailWhat': 'E-mail, calendário',

  // Example and suggested space names
  'setup.spaceName.personal': 'Pessoal',
  'setup.spaceName.work': 'Trabalho',
  'setup.spaceName.sideProject': 'Projeto paralelo',

  // Progress and navigation
  'setup.stage.welcome': 'Boas-vindas',
  'setup.stage.assistant': 'Assistente',
  'setup.stage.spaces': 'Espaços',
  'setup.stage.apps': 'Apps',
  'setup.stage.ready': 'Pronto',
  'setup.progressLabel': 'Etapa {step} de {total}: {stage}',
  'setup.skip': 'Pular configuração',
  'setup.skipTitle': 'Você pode fazer a configuração de novo em Ajustes → Geral',
  'setup.nav.aboutAMinute': 'Leva cerca de um minuto.',
  'setup.nav.needSpace': 'Adicione um espaço ou mantenha tudo junto.',
  'setup.nav.getStarted': 'Começar',
  'setup.nav.settingUp': 'Configurando…',
  'setup.nav.startSigningIn': 'Começar a fazer login',
  'setup.nav.openMissionDesk': 'Abrir o Mission Desk',
  'setup.nav.continue': 'Continuar',
  'setup.finishError': 'O Mission Desk não conseguiu adicioná-los. Volte e confira os nomes dos espaços e os endereços web, depois tente novamente.',
  'setup.remove': 'Remover {name}',

  // Welcome
  'setup.welcome.title': 'Boas-vindas ao Mission Desk',
  'setup.welcome.titleAgain': 'Configure mais do Mission Desk',
  'setup.welcome.lede':
    'Todos os seus apps lado a lado, organizados em espaços, com um Início para o seu dia e um assistente que conhece cada espaço.',
  'setup.welcome.ledeAgain': 'Adicione espaços e apps do mesmo jeito que da primeira vez. O que você já tem fica como está.',
  'setup.welcome.accountsTitle': 'Cada conta com o próprio login',
  'setup.welcome.accountsText': 'Duas contas do Google, três workspaces do Slack: cada um mantém o próprio login.',
  'setup.welcome.homeTitle': 'O Início mostra o que vem a seguir',
  'setup.welcome.homeText': 'Suas reuniões, tarefas e mensagens não lidas, e um clique para entrar em uma chamada.',
  'setup.welcome.assistantTitle': 'Um assistente que fica no seu espaço',
  'setup.welcome.assistantText': 'Ele só lê os apps que você compartilha com ele, e só naquele espaço.',

  // Assistant
  'setup.assistant.title': 'Quer um assistente?',
  'setup.assistant.lede':
    'Ele faz um resumo do seu dia, descobre quem está esperando por você e prepara suas reuniões, a partir dos apps que você compartilha com ele.',
  'setup.assistant.groupLabel': 'Assistente',
  'setup.assistant.claudeHint': 'Usa o seu plano do Claude, pelo Claude Code neste Mac.',
  'setup.assistant.codexHint': 'Usa o seu plano do ChatGPT, pelo Codex neste Mac.',
  'setup.assistant.openrouterHint': 'GPT, Gemini, Llama e outros, com a sua própria chave do OpenRouter.',
  'setup.assistant.offName': 'Agora não',
  'setup.assistant.offHint': 'Você pode adicionar um depois em Ajustes.',

  // Connecting the assistant
  'setup.engine.checking': 'Verificando o {name}…',
  'setup.engine.readyOpenRouter': 'O OpenRouter está conectado. O {name} está pronto.',
  'setup.engine.readySignedIn': 'O login no {app} foi feito neste Mac. O {name} está pronto.',
  'setup.engine.keyLabel': 'Sua chave do OpenRouter',
  'setup.engine.checkingKey': 'Verificando…',
  'setup.engine.connect': 'Conectar',
  'setup.engine.keyRefused': 'O OpenRouter recusou esta chave. Confira e tente novamente.',
  'setup.engine.keyHelp':
    'Crie uma em <link>openrouter.ai/keys</link>. O macOS a mantém criptografada neste Mac; o OpenRouter cobra o que você usar.',
  'setup.engine.finishInBrowser': 'Conclua o login no navegador…',
  'setup.engine.installed': 'O {app} está instalado. Faça login uma vez, com sua conta do {account}.',
  'setup.engine.signIn': 'Fazer login',
  'setup.engine.installClaude': 'O Claude precisa do Claude Code neste Mac. Abra o Terminal, cole isto e pressione Return:',
  'setup.engine.installCodex':
    'O OpenAI Codex precisa da ferramenta de linha de comando do Codex neste Mac. Abra o Terminal, cole isto e pressione Return:',
  'setup.engine.copy': 'Copiar',
  'setup.engine.copied': 'Copiado',
  'setup.engine.npmMissing': 'Se o Terminal disser que o npm não foi encontrado, instale antes o Node.js em nodejs.org.',
  'setup.engine.installedIt': 'Já instalei',
  'setup.engine.later': 'Você também pode concluir isso depois, em Ajustes → Integrações.',

  // Spaces
  'setup.spaces.title': 'Como você quer organizar seu trabalho?',
  'setup.spaces.lede': 'Um espaço para cada empresa, projeto ou parte da sua vida, como Pessoal, Acme ou Projeto paralelo.',
  'setup.spaces.listLabel': 'Seus espaços',
  'setup.spaces.placeholderFirst': 'Dê um nome ao espaço, como Acme',
  'setup.spaces.placeholderMore': 'Outro espaço',
  'setup.spaces.nameLabel': 'Nome do espaço',
  'setup.spaces.full': {
    one: 'É {count} espaço, o máximo que a configuração cria. Você pode adicionar mais depois.',
    other: 'São {count} espaços, o máximo que a configuração cria. Você pode adicionar mais depois.',
  },
  'setup.spaces.ideas': 'Ideias:',
  'setup.spaces.togetherTitle': 'Manter tudo junto',
  'setup.spaces.togetherText': 'Todos os seus apps em uma lista, sem espaços. Você pode criar espaços depois.',

  // Apps
  'setup.apps.title': 'Quais apps você usa?',
  'setup.apps.titleSpace': 'Quais apps vão em {name}?',
  'setup.apps.lede': 'Escolha quantos quiser. Você vai fazer login em cada um no final.',
  'setup.apps.ledeSpace': 'Escolha quantos quiser. {name} é o espaço {n} de {total}. Você vai fazer login em cada um no final.',
  'setup.apps.accounts': { one: '{count} conta', other: '{count} contas' },
  'setup.apps.oneFewer': 'Uma conta do {name} a menos',
  'setup.apps.another': 'Outra conta do {name}',
  'setup.apps.anyWebsite': 'Qualquer site',
  'setup.apps.sitesAdded': { one: '{count} adicionado', other: '{count} adicionados' },
  'setup.apps.badAddress': 'Isso não parece um endereço web. Tente algo como notion.so.',
  'setup.apps.alreadyListed': 'Ele já está na lista.',
  'setup.apps.addressPlaceholder': 'Endereço web, como notion.so',
  'setup.apps.addressLabel': 'Endereço web',
  'setup.apps.full': {
    one: 'É {count} app, o máximo para um espaço aqui. Você pode adicionar mais depois.',
    other: 'São {count} apps, o máximo para um espaço aqui. Você pode adicionar mais depois.',
  },
  'setup.apps.needsOne': 'Um espaço precisa de pelo menos um app. Sem nenhum, {name} fica de fora; você pode criá-lo depois.',

  // Ready
  'setup.ready.nothingTitle': 'Nada para adicionar ainda',
  'setup.ready.nothingText':
    'Você não escolheu nenhum app. Volte para escolher alguns, ou abra o Mission Desk e adicione um por um com o + na barra lateral.',
  'setup.ready.title': 'Pronto para fazer login',
  'setup.ready.lede': {
    one: 'O Mission Desk adiciona seu app e abre primeiro o {first}. Faça login em cada um uma vez; o login fica salvo neste Mac.',
    other:
      'O Mission Desk adiciona seus {count} apps e abre primeiro o {first}. Faça login em cada um uma vez; o login fica salvo neste Mac.',
  },
  'setup.ready.ledeSpaces':
    'O Mission Desk adiciona seus {count} apps em {spaces} espaços e abre primeiro o {first}. Faça login em cada um uma vez; o login fica salvo neste Mac.',
  'setup.ready.alreadyThere': 'Já existe: será complementado',
  'setup.ready.readsTitle': 'Permitir que o {name} leia estes apps',
  'setup.ready.readsText':
    'Assim ele pode resumir o seu dia e descobrir quem está esperando por você. Ele não pode digitar, clicar nem enviar nada neles. Você pode mudar isso por app em Ajustes.',

  // The sidebar preview
  'setup.dock.home': 'Início',
  'setup.dock.appsHere': 'Seus apps vão aparecer aqui.',
  'setup.dock.spacesHere': 'Seus espaços vão aparecer aqui.',
  'setup.dock.example': 'Um exemplo. O seu vai tomando forma conforme você responde.',
  'setup.dock.yours': 'Seu Mission Desk',
};
