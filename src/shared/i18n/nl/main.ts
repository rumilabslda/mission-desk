import type { Translation } from '../types';
import type { main as en } from '../en/main';

export const main: Translation<typeof en> = {
  // The app menu (Mission Desk). {app} is the app's name.
  'main.menu.about': 'Over {app}',
  'main.menu.services': 'Voorzieningen',
  'main.menu.hide': 'Verberg {app}',
  'main.menu.hideOthers': 'Verberg andere',
  'main.menu.showAll': 'Toon alles',
  'main.menu.quit': 'Stop {app}',
  'main.menu.checkForUpdates': 'Zoek naar updates…',
  'main.menu.settings': 'Instellingen…',
  'main.menu.assistant': 'Assistent',
  'main.menu.connectClaude': 'Koppel Claude…',
  // Edit
  'main.menu.edit': 'Wijzig',
  'main.menu.undo': 'Herstel',
  'main.menu.redo': 'Opnieuw',
  'main.menu.cut': 'Knip',
  'main.menu.copy': 'Kopieer',
  'main.menu.paste': 'Plak',
  'main.menu.pasteAndMatchStyle': 'Plak en pas stijl aan',
  'main.menu.selectAll': 'Selecteer alles',
  'main.menu.speech': 'Spraak',
  'main.menu.startSpeaking': 'Start met spreken',
  'main.menu.stopSpeaking': 'Stop met spreken',
  // View
  'main.menu.view': 'Weergave',
  'main.menu.reload': 'Laad opnieuw',
  'main.menu.forward': 'Vooruit',
  'main.menu.sidebarStyle': 'Stijl van navigatiekolom',
  'main.menu.sidebarFolders': 'Mappen',
  'main.menu.sidebarPanel': 'Mappen met paneel',
  'main.menu.sidebarSections': 'Secties',
  'main.menu.devTools': 'Ontwikkelaarstools voor dit account',
  'main.menu.toggleFullScreen': 'Schermvullende weergave aan/uit',
  // Accounts
  'main.menu.accounts': 'Accounts',
  'main.menu.home': 'Start',
  'main.menu.allCalendars': 'Alle agenda’s',
  'main.menu.copyMeetLink': 'Kopieer Meet-link',
  'main.menu.newEvent': 'Nieuwe activiteit',
  'main.menu.newTodo': 'Nieuwe taak',
  'main.menu.account': 'Account {n}',
  'main.menu.stopClaude': 'Stop Claude',
  // Window
  'main.menu.window': 'Venster',
  'main.menu.minimize': 'Minimaliseer',
  'main.menu.zoom': 'Zoom',
  'main.menu.front': 'Breng alles naar voren',
  // Help
  'main.menu.help': 'Help',
  'main.menu.siteMissionDesk': 'Website van Mission Desk',
  'main.menu.siteRumiLabs': 'Website van Rumi Labs',

  // An account's right-click menu.
  'main.account.edit': 'Wijzig…',
  'main.account.muteNotifications': 'Demp meldingen',
  'main.account.hibernate': 'Laat sluimeren als niet in gebruik',
  'main.account.icon': 'Symbool',
  'main.account.claudeAccess': 'Toegang voor Claude',
  'main.account.accessRead': 'Lezen',
  'main.account.accessAct': 'Lezen en handelen',
  'main.account.moveToSpace': 'Verplaats naar ruimte',
  'main.account.newSpace': 'Nieuwe ruimte…',
  'main.account.moveUp': 'Omhoog',
  'main.account.moveDown': 'Omlaag',
  'main.account.remove': 'Verwijder…',
  'main.account.removeTitle': '{name} verwijderen?',
  'main.account.removeDetail': 'Je wordt uitgelogd en de gegevens ervan op deze Mac worden verwijderd.',

  // An account's icon (right-click → Icon).
  'main.icon.sameAs': 'Zelfde als {name}',
  'main.icon.auto': 'Bedrijfslogo of foto',
  'main.icon.service': 'Logo van dienst',
  'main.icon.letter': 'Letter',
  'main.icon.chooseImage': 'Kies afbeelding…',
  'main.icon.chooseTitle': 'Kies een afbeelding voor {name}',
  'main.icon.imagesFilter': 'Afbeeldingen',
  'main.icon.openFailed': 'Die afbeelding kon niet worden geopend.',
  'main.icon.openFailedDetail': 'Probeer een PNG- of JPEG-bestand.',

  // A space's right-click menu, and the + menu.
  'main.space.rename': 'Wijzig naam…',
  'main.space.alwaysOpen': 'Altijd open',
  'main.space.shareGoogle': 'Deel Google-login',
  'main.space.googleFrom': 'Google-login van',
  'main.space.ungroup': 'Hef groep op',
  'main.add.app': 'Voeg app toe…',
  'main.add.space': 'Voeg ruimte toe…',

  // Quick actions (the ⚡ button's menu).
  'main.quick.title': 'Snelle acties',
  'main.quick.titleFor': 'Snelle acties · {name}',
  'main.quick.noGoogleInSpace': 'Voeg een Google-account toe aan deze ruimte',
  'main.quick.needGoogle': 'Voeg eerst een Google-account toe',
  'main.quick.askAssistant': 'Vraag het de assistent',

  // Copy Meet Link.
  'main.meet.noLink': 'Geen vergaderlink',
  'main.meet.noGoogle': 'Deze ruimte heeft geen Google-account. Voeg er een toe om Meet-links te maken.',
  'main.meet.creating': 'Vergaderlink aanmaken…',
  'main.meet.copied': 'Vergaderlink gekopieerd',
  /** {link}: the link without https://; {keys}: ⌘V or Ctrl+V. */
  'main.meet.copiedDetail': '{link} · {keys} om te plakken',
  'main.meet.copiedBody': '{url} — plak met {keys}.',
  'main.meet.errorSignedOut': 'Log in bij Google in deze ruimte en probeer het opnieuw.',
  'main.meet.errorOffline': 'Mission Desk is offline. Controleer je verbinding en probeer het opnieuw.',
  'main.meet.errorForbidden': 'Google weigerde een vergadering aan te maken voor dit account.',
  'main.meet.errorUnsupported': 'Google kon geen vergadering aanmaken voor dit account.',
  'main.meet.errorGeneric': 'Google kon geen vergadering aanmaken. Probeer het zo opnieuw.',
  /** The title of the event Copy Meet Link creates in the user's Google Agenda. */
  'main.meet.quickCallTitle': 'Kort gesprek',

  // The assistant asks before it keeps a note, saves a skill or creates an event. {where}: a space's name.
  'main.assistant.thisSpace': 'deze ruimte',
  'main.assistant.rememberTitle': 'Dit onthouden voor {where}?',
  'main.assistant.forgetTitle': 'Deze notitie in {where} vergeten?',
  'main.assistant.rememberDetail':
    '{note}\n\nGevraagd door de assistent. Alleen de assistent van {where} ziet deze notitie. Je kunt elke notitie bekijken en wijzigen in Instellingen → Assistent.',
  'main.assistant.forgetDetail': '{note}\n\nGevraagd door de assistent. Je kunt elke notitie bekijken en wijzigen in Instellingen → Assistent.',
  'main.assistant.remember': 'Onthoud',
  'main.assistant.forget': 'Vergeet',
  'main.assistant.saveSkillTitle': 'De skill “{name}” bewaren voor {where}?',
  'main.assistant.saveSkillDetailAlways':
    'Altijd aan: {description}\n\n{instructions}\n\nGeschreven door de assistent. De skill staat alleen aan in {where}; je kunt hem wijzigen of verwijderen in Instellingen → Skills.',
  'main.assistant.saveSkillDetailFits':
    'Gebruikt wanneer het past: {description}\n\n{instructions}\n\nGeschreven door de assistent. De skill staat alleen aan in {where}; je kunt hem wijzigen of verwijderen in Instellingen → Skills.',
  'main.assistant.createEventTitle': 'Deze activiteit aanmaken?',
  'main.assistant.createEventDetail': '{event}\n\nGevraagd door de assistent. Controleer de gasten en de beschrijving voordat je de activiteit aanmaakt.',
  'main.assistant.emailGuests': 'Stuur uitnodigingen per e-mail naar de gasten',

  // The assistant's scopes in per-space mode use common.allSpaces / common.noSpace.
  'main.scope.everything': 'Alles',

  // Claude acting in an account.
  'main.claude.consentTitle': 'Claude 30 minuten laten handelen in {name}?',
  'main.claude.consentDetail': 'Claude kan dan klikken en typen in dit account. Stop hem altijd met de stopknop of ⌘.',
  'main.claude.allow': 'Sta toe',
  'main.claude.deny': 'Weiger',
  'main.claude.socketError': 'Kan de verbinding niet openen: {error}',

  // Adding a skill by link (Settings → Skills).
  'main.skills.fetchBadLink': 'Gebruik een https-link naar een SKILL.md-bestand (een GitHub-link naar het bestand of de map werkt ook).',
  'main.skills.fetchNotFound': 'Geen SKILL.md op die link.',
  'main.skills.fetchStatus': 'De link antwoordde met {status}.',
  'main.skills.fetchNotHttps': 'De link verwijst naar een adres dat geen https is.',
  'main.skills.fetchWebPage': 'Dat is een webpagina, geen SKILL.md-bestand. Link naar het bestand zelf.',
  'main.skills.fetchTooBig': 'Dat bestand is te groot voor een skill.',
  'main.skills.fetchNotText': 'Dat is geen tekstbestand.',
  'main.skills.fetchEmpty': 'Dat bestand is leeg.',
  'main.skills.fetchTooLong': 'Die skill is langer dan Mission Desk toestaat ({max} tekens).',
  'main.skills.fetchFailed': 'Kan die link niet ophalen. Controleer het adres en je verbinding.',
  'main.skills.fetchNotAllowed': 'Niet toegestaan.',
  'main.openRouter.badKey': 'Dat lijkt geen OpenRouter-sleutel.',

  // Updates.
  'main.updates.readyTitle': 'Mission Desk {version} staat klaar',
  'main.updates.readyBody': 'Herstart Mission Desk om te voltooien, of de update wordt geïnstalleerd wanneer je de app de volgende keer stopt.',
  'main.updates.checkFailed': 'Kan GitHub niet bereiken om te controleren. Controleer je verbinding en probeer het opnieuw.',
  'main.updates.checkFailedOther': 'Kan nu niet op een nieuwe versie controleren. Probeer het later opnieuw.',
  'main.updates.downloadFailed': 'De update kon niet worden gedownload. Probeer het zo opnieuw.',
  'main.updates.installFailed': 'De update kon niet worden geïnstalleerd. Download de nieuwe versie in plaats daarvan van de website.',

  // Other windows and pages.
  'main.popup.signIn': 'Log in',
  'main.errorPage.title': 'Offline',
  'main.errorPage.message': 'Kan deze pagina niet bereiken. Controleer je verbinding.',
  'main.errorPage.retry': 'Probeer opnieuw',
  'main.store.loadWarning': 'Je bewaarde accounts konden niet worden gelezen, dus Mission Desk is leeg gestart. Er is een kopie bewaard als accounts.json.bak.',
  'main.calendar.noTitle': '(Geen titel)',

  // About. {site}: the website without https://; {license}: the license's name (kept in English).
  'main.about.credits': '{site}\n{license}. Gratis en open source.',
  'main.about.licenseSummary':
    'Gratis en open source. Iedereen, zowel mensen als bedrijven, mag het voor alles gebruiken, ook voor werk, en het aanpassen en delen. Wie Mission Desk of een aangepaste versie deelt, moet de broncode onder dezelfde licentie delen, zodat het nooit een gesloten product kan worden.',
  "main.space.memory": "Geheugen…",
  // Passkeys: the Touch ID prompt (macOS writes "Mission Desk" is trying to …; $1 is the site) and the account chooser.
  'main.passkey.promptReason': 'met een toegangssleutel in te loggen bij $1',
  'main.passkey.chooseTitle': 'Welk account wil je gebruiken op {site}?',
  'main.passkey.chooseDetail': 'Toegangssleutels die in Mission Desk op deze Mac zijn bewaard.',
  'main.passkey.account': 'Account',
};
