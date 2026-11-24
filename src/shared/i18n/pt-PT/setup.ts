import type { Translation } from '../types';
import type { setup as en } from '../en/setup';

export const setup: Translation<typeof en> = {
  // Names the setup gives (src/shared/setup.ts)
  'setup.app.website': 'Site',
  'setup.spaces.tooLong': 'Use menos de {max} caracteres.',
  'setup.spaces.taken': '{name} já existe.',

  // What each service brings (the tiles)
  'setup.service.googleWhat': 'Gmail, Calendar, Drive',
  'setup.service.slackWhat': 'Um espaço de trabalho',
  'setup.service.whatsappWhat': 'As suas conversas',
  'setup.service.telegramWhat': 'As suas conversas',
  'setup.service.linkedinWhat': 'Mensagens, feed',
  'setup.service.discordWhat': 'Servidores, mensagens diretas',
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
  'setup.progressLabel': 'Passo {step} de {total}: {stage}',
  'setup.skip': 'Saltar a configuração',
  'setup.skipTitle': 'Pode repetir a configuração em Definições → Geral',
  'setup.nav.aboutAMinute': 'Demora cerca de um minuto.',
  'setup.nav.needSpace': 'Adicione um espaço ou mantenha tudo junto.',
  'setup.nav.getStarted': 'Começar',
  'setup.nav.settingUp': 'A configurar…',
  'setup.nav.startSigningIn': 'Iniciar sessões',
  'setup.nav.openMissionDesk': 'Abrir o Mission Desk',
  'setup.nav.continue': 'Continuar',
  'setup.finishError': 'O Mission Desk não conseguiu adicioná-las. Volte atrás, verifique os nomes dos espaços e os endereços web e tente novamente.',
  'setup.remove': 'Remover {name}',

  // Welcome
  'setup.welcome.nameLabel': 'O seu nome (opcional)',
  'setup.welcome.namePlaceholder': 'Como quer ser tratado',
  'setup.welcome.title': 'Bem-vindo ao Mission Desk',
  'setup.welcome.titleAgain': 'Acrescente mais ao Mission Desk',
  'setup.welcome.lede':
    'Todas as suas apps lado a lado, organizadas em espaços, com um Início para o seu dia e um assistente que conhece cada espaço.',
  'setup.welcome.ledeAgain': 'Adicione espaços e apps como da primeira vez. O que já tem fica como está.',
  'setup.welcome.accountsTitle': 'Cada conta com a sua própria sessão',
  'setup.welcome.accountsText': 'Duas contas Google, três espaços de trabalho do Slack: cada um mantém a sua sessão.',
  'setup.welcome.homeTitle': 'O Início mostra o que vem a seguir',
  'setup.welcome.homeText': 'As suas reuniões, tarefas e mensagens não lidas, e um clique para entrar numa chamada.',
  'setup.welcome.assistantTitle': 'Um assistente que fica no seu espaço',
  'setup.welcome.assistantText': 'Só lê as apps que partilhar com ele, e só nesse espaço.',
  'setup.welcome.meetingsTitle': 'Reuniões transcritas no seu Mac',
  'setup.welcome.meetingsText': 'No Meet, Teams e Zoom, com o resumo e as suas tarefas quando acaba. O áudio nunca sai do seu Mac.',

  // Assistant
  'setup.assistant.title': 'Quer um assistente?',
  'setup.assistant.lede':
    'Faz o ponto da situação do seu dia, descobre quem está à sua espera e prepara as suas reuniões, a partir das apps que partilhar com ele.',
  'setup.assistant.groupLabel': 'Assistente',
  'setup.assistant.claudeHint': 'Usa o seu plano Claude, através do Claude Code neste Mac.',
  'setup.assistant.codexHint': 'Usa o seu plano ChatGPT, através do Codex neste Mac.',
  'setup.assistant.openrouterHint': 'GPT, Gemini, Llama e outros, com a sua própria chave do OpenRouter.',
  'setup.assistant.offName': 'Agora não',
  'setup.assistant.offHint': 'Pode adicionar um mais tarde nas Definições.',
  'setup.assistant.addAnother': '+ Adicionar outra conta',
  'setup.assistant.perSpaceTitle': 'Escolher um assistente para cada espaço',
  'setup.assistant.perSpaceText': 'Por exemplo, outra conta Claude para o trabalho. Um espaço que deixe como está usa o de cima.',
  'setup.assistant.spaceLabel': 'Assistente de {name}',
  'setup.assistant.sameAsAbove': 'Igual ao de cima ({name})',
  'setup.assistant.meetings': 'As suas apps têm chamadas: quando uma reunião acaba, o assistente do espaço pode escrever o resumo e as suas tarefas.',
  'setup.assistant.readsTitle': 'Permitir que o assistente leia estas apps',
  'setup.assistant.signInAgain': '{name} não tem sessão iniciada.',

  // Connecting the assistant
  'setup.engine.checking': 'A verificar {name}…',
  'setup.engine.readyOpenRouter': 'O OpenRouter está ligado. {name} está pronto.',
  'setup.engine.readySignedIn': '{app} tem sessão iniciada neste Mac. {name} está pronto.',
  'setup.engine.keyLabel': 'A sua chave do OpenRouter',
  'setup.engine.checkingKey': 'A verificar…',
  'setup.engine.connect': 'Ligar',
  'setup.engine.keyRefused': 'O OpenRouter recusou esta chave. Verifique-a e tente novamente.',
  'setup.engine.keyHelp':
    'Crie uma em <link>openrouter.ai/keys</link>. O macOS guarda-a encriptada neste Mac; o OpenRouter fatura o que usar.',
  'setup.engine.finishInBrowser': 'Termine o início de sessão no navegador…',
  'setup.engine.installed': '{app} está instalado. Inicie sessão uma vez, com a sua conta {account}.',
  'setup.engine.signIn': 'Iniciar sessão',
  'setup.engine.installClaude': 'O Claude precisa do Claude Code neste Mac. Abra o Terminal, cole isto e prima Return:',
  'setup.engine.installCodex':
    'O OpenAI Codex precisa da ferramenta de linha de comandos do Codex neste Mac. Abra o Terminal, cole isto e prima Return:',
  'setup.engine.copy': 'Copiar',
  'setup.engine.copied': 'Copiado',
  'setup.engine.npmMissing': 'Se o Terminal disser que o npm não foi encontrado, instale primeiro o Node.js a partir de nodejs.org.',
  'setup.engine.installedIt': 'Já instalei',
  'setup.engine.later': 'Também pode terminar isto mais tarde, em Definições → Integrações.',

  // Spaces
  'setup.spaces.title': 'Como gostaria de organizar o seu trabalho?',
  'setup.spaces.lede': 'Um espaço para cada empresa, projeto ou área da sua vida, como Pessoal, Acme ou Projeto paralelo.',
  'setup.spaces.listLabel': 'Os seus espaços',
  'setup.spaces.placeholderFirst': 'Dê nome a um espaço, como Acme',
  'setup.spaces.placeholderMore': 'Outro espaço',
  'setup.spaces.nameLabel': 'Nome do espaço',
  'setup.spaces.full': {
    one: 'É {count} espaço, o máximo que a configuração cria. Pode adicionar mais depois.',
    other: 'São {count} espaços, o máximo que a configuração cria. Pode adicionar mais depois.',
  },
  'setup.spaces.ideas': 'Ideias:',
  'setup.spaces.togetherTitle': 'Manter tudo junto',
  'setup.spaces.togetherText': 'Todas as suas apps numa só lista, sem espaços. Pode criar espaços mais tarde.',

  // Apps
  'setup.apps.title': 'Que apps usa?',
  'setup.apps.titleSpace': 'Que apps ficam em {name}?',
  'setup.apps.lede': 'Escolha as que quiser. No fim, inicia sessão em cada uma.',
  'setup.apps.ledeSpace': 'Escolha as que quiser. {name} é o espaço {n} de {total}. No fim, inicia sessão em cada uma.',
  'setup.apps.accounts': { one: '{count} conta', other: '{count} contas' },
  'setup.apps.oneFewer': 'Menos uma conta {name}',
  'setup.apps.another': 'Outra conta {name}',
  'setup.apps.anyWebsite': 'Qualquer site',
  'setup.apps.sitesAdded': { one: '{count} adicionado', other: '{count} adicionados' },
  'setup.apps.badAddress': 'Isso não parece um endereço web. Experimente algo como notion.so.',
  'setup.apps.alreadyListed': 'Já está na lista.',
  'setup.apps.addressPlaceholder': 'Endereço web, como notion.so',
  'setup.apps.addressLabel': 'Endereço web',
  'setup.apps.full': {
    one: 'É {count} app, o máximo para um espaço aqui. Pode adicionar mais depois.',
    other: 'São {count} apps, o máximo para um espaço aqui. Pode adicionar mais depois.',
  },
  'setup.apps.needsOne': 'Um espaço precisa de pelo menos uma app. Sem nenhuma, {name} fica de fora; pode criá-lo mais tarde.',

  // Ready
  'setup.ready.nothingTitle': 'Ainda nada para adicionar',
  'setup.ready.nothingText':
    'Não escolheu nenhuma app. Volte atrás para escolher algumas, ou abra o Mission Desk e adicione-as uma a uma com o + da barra lateral.',
  'setup.ready.title': 'Pronto para iniciar sessão',
  'setup.ready.lede': {
    one: 'O Mission Desk adiciona a sua app e abre primeiro {first}. Basta iniciar sessão uma vez; a sessão mantém-se neste Mac.',
    other:
      'O Mission Desk adiciona as suas {count} apps e abre primeiro {first}. Basta iniciar sessão uma vez em cada uma; a sessão mantém-se neste Mac.',
  },
  'setup.ready.ledeSpaces':
    'O Mission Desk adiciona as suas {count} apps em {spaces} espaços e abre primeiro {first}. Basta iniciar sessão uma vez em cada uma; a sessão mantém-se neste Mac.',
  'setup.ready.alreadyThere': 'Já existe: as apps são acrescentadas',
  'setup.ready.noAssistant': 'Sem assistente',
  'setup.ready.keepsAssistant': 'Mantém o seu assistente',
  'setup.ready.readsText':
    'Assim pode fazer o ponto da situação e descobrir quem está à sua espera. Não pode escrever, clicar nem enviar nada nelas. Pode alterar isto para cada app nas Definições.',

  // The sidebar preview
  'setup.dock.home': 'Início',
  'setup.dock.appsHere': 'As suas apps vão aparecer aqui.',
  'setup.dock.spacesHere': 'Os seus espaços vão aparecer aqui.',
  'setup.dock.example': 'Um exemplo. O seu ganha forma à medida que responde.',
  'setup.dock.yours': 'O seu Mission Desk',
};
