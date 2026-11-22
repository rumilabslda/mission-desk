import type { Translation } from '../types';
import type { home as en } from '../en/home';

export const home: Translation<typeof en> = {
  // Greeting by time of day (src/shared/today.ts).
  'home.greeting.morning': 'Bom dia',
  'home.greeting.afternoon': 'Boa tarde',
  'home.greeting.evening': 'Boa noite',

  // How long ago a message came, on its line (src/shared/messages.ts).
  'home.ago.now': 'agora',
  'home.ago.minutes': { one: '{count} min', other: '{count} min' },
  'home.ago.hours': { one: '{count} h', other: '{count} h' },

  // Lengths of time: "12 min", "2 h", "1 h 5 min"; on the timeline "1 h 15".
  'home.duration.minutes': { one: '{count} min', other: '{count} min' },
  'home.duration.hours': { one: '{count} h', other: '{count} h' },
  'home.duration.hoursMinutes': '{hours} h {minutes} min',
  'home.duration.hoursMinutesShort': '{hours} h {minutes}',

  // The page's head.
  'home.today.meetingsLeft': { one: 'Falta {count} reunião', other: 'Faltam {count} reuniões' },
  'home.today.todos': { one: '{count} tarefa', other: '{count} tarefas' },
  'home.today.unread': { one: '{count} não lida', other: '{count} não lidas' },
  'home.today.briefMe': 'Resumo do dia',
  'home.today.briefMeTitle': 'Um resumo do seu dia em todos os seus apps: o que é urgente e quem está esperando por você',

  // To-dos.
  'home.todo.title': 'Tarefas',
  'home.todo.addPlaceholder': 'Adicione uma tarefa e pressione Enter',
  'home.todo.space': 'Espaço',
  'home.todo.carriedFrom': 'de {day}',
  'home.todo.empty': 'Nada ainda. O que precisa acontecer hoje?',
  'home.todo.clearDone': 'Limpar concluídas',

  // Agenda.
  'home.agenda.title': 'Agenda',
  'home.agenda.openCalendar': 'Abrir calendário',
  'home.agenda.noGoogle': 'Adicione uma conta do Google para ver suas reuniões aqui.',
  'home.agenda.openInCalendars': 'Abrir em Todos os calendários',
  'home.agenda.join': 'Entrar no {provider}',
  'home.agenda.endsIn': 'Termina em {duration}',
  'home.agenda.startingNow': 'Começando agora',
  'home.agenda.startsIn': 'Em {duration}',
  'home.agenda.endsInSub': 'termina em {duration}',
  'home.agenda.startingNowSub': 'começando agora',
  'home.agenda.startsInSub': 'em {duration}',
  'home.agenda.notAnswered': 'sem resposta',
  'home.agenda.anotherAccount': 'outra conta',
  'home.agenda.clashWith': 'Conflito com {names}',
  'home.agenda.problemSignedOut': 'Calendário de {name}: sessão encerrada. Algumas reuniões podem estar faltando.',
  'home.agenda.problemOffline': 'Calendário de {name}: offline. Algumas reuniões podem estar faltando.',
  'home.agenda.problemError': 'Calendário de {name}: não foi possível carregar. Algumas reuniões podem estar faltando.',
  'home.agenda.now': 'Agora',
  'home.agenda.upNext': 'A seguir',
  'home.agenda.rowNow': 'agora',
  'home.agenda.nextHours': 'Próximas horas',
  'home.agenda.hideEarlier': 'Ocultar anteriores',
  'home.agenda.earlierToday': 'Mais cedo hoje ({count})',
  'home.agenda.showLess': 'Mostrar menos',
  'home.agenda.laterToday': { one: 'Mais {count} hoje', other: 'Mais {count} hoje' },
  'home.agenda.noMore': 'Não há mais reuniões hoje.',

  // Timeline.
  'home.timeline.free': 'Livre',
  'home.timeline.freeFor': '{duration} livre',

  // Messages.
  'home.messages.title': 'Mensagens',
  'home.messages.clearAll': 'Limpar tudo',
  'home.messages.empty': 'Nenhuma mensagem nova. Conversas e e-mails aparecem aqui assim que chegam.',
  'home.messages.showFewer': 'Mostrar menos',
  'home.messages.showAll': { one: 'Mostrar todas ({count})', other: 'Mostrar todas ({count})' },
  'home.messages.alsoUnread': 'Também não lidas',
  'home.messages.unread': 'Não lidas',
  'home.messages.unreadCount': { one: '{name}: {count} não lida', other: '{name}: {count} não lidas' },
  'home.messages.unreadCountIn': {
    one: '{name}, {where}: {count} não lida',
    other: '{name}, {where}: {count} não lidas',
  },
  'home.messages.unreadDot': '{name}: não lidas',
  'home.messages.unreadDotIn': '{name}, {where}: não lidas',
  'home.messages.nameIn': '{name}, {where}',
  'home.messages.mailHint': 'Para ver cada e-mail aqui, ative as notificações na área de trabalho nos ajustes do Gmail ou do Outlook.',
  'home.messages.openIn': 'Abrir no {name}',
  'home.messages.dismiss': 'Descartar',
  'home.messages.dismissNamed': 'Descartar {name}',

  // The ⚡ quick actions' menu.
  'home.dial.label': 'Ações rápidas',
  'home.dial.for': 'Para {label}',
  'home.dial.meet': 'Novo link de reunião',
  'home.dial.event': 'Novo evento',
  'home.dial.todo': 'Nova tarefa',
  'home.dial.assistant': 'Perguntar ao assistente',

  // The quick pop-ups: a new to-do.
  'home.quick.newTodo': 'Nova tarefa',
  'home.quick.todoPlaceholder': 'O que precisa ser feito?',
  'home.quick.space': 'Espaço',
  'home.quick.todoHint': '<kbd>↵</kbd> para adicionar · <kbd>esc</kbd> para fechar',
  'home.quick.addTodo': 'Adicionar tarefa',
  'home.quick.todoAdded': 'Tarefa adicionada',

  // The quick pop-ups: a new event.
  'home.quick.newEvent': 'Novo evento',
  'home.quick.account': 'Conta',
  'home.quick.titlePlaceholder': 'Adicione um título',
  'home.quick.titleLabel': 'Título',
  'home.quick.day': 'Dia',
  'home.quick.starts': 'Início',
  'home.quick.ends': 'Fim',
  'home.quick.allDay': 'Dia inteiro',
  'home.quick.removeGuest': 'Remover {email}',
  'home.quick.addAnother': 'Adicionar outro',
  'home.quick.addGuests': 'Adicione convidados por e-mail',
  'home.quick.guests': 'Convidados',
  'home.quick.badEmail': 'Isso não é um endereço de e-mail.',
  'home.quick.calendar': 'Calendário',
  'home.quick.location': 'Local',
  'home.quick.locationPlaceholder': 'Adicione um local',
  'home.quick.notes': 'Notas',
  'home.quick.notesPlaceholder': 'Adicione uma descrição',
  'home.quick.moreOptions': 'Mais opções: calendário, local, notas',
  'home.quick.eventHint': '<kbd>{keys}</kbd> para salvar · <kbd>esc</kbd> para fechar',
  'home.quick.saving': 'Salvando…',
  'home.quick.saveEvent': 'Salvar evento',
  'home.quick.eventSaved': 'Evento salvo',
  'home.quick.sendTitle': 'Enviar convites por e-mail aos convidados?',
  'home.quick.sendMessage': 'Os convidados recebem um e-mail do Google.',
  'home.quick.send': 'Enviar',
  'home.quick.dontSend': 'Não enviar',
  'home.quick.errorSignedOut': 'A sessão dessa conta do Google foi encerrada. Faça login novamente e tente de novo.',
  'home.quick.errorForbidden': 'Você não pode adicionar eventos a esse calendário.',
  'home.quick.errorOffline': 'Não foi possível acessar o Google. Verifique sua conexão e tente novamente.',
  'home.quick.errorUnsupported': 'Este evento precisa ser criado no Google Agenda.',
  'home.quick.errorGeneric': 'Não foi possível salvar o evento. Tente novamente.',
};
