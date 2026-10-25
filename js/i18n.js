(function (root) {
'use strict';

/* English and Spanish interface text. Robot's replies and the commands stay in English in every language,
   because the game is about writing precise instructions for one fixed vocabulary. */
var EN = {
  'nav.play': 'Play', 'nav.daily': 'Bug of the Day', 'nav.sandbox': 'Sandbox', 'nav.gallery': 'Collection', 'nav.create': 'Create',
  'sound.on': 'Sound on', 'sound.off': 'Sound off', 'lang.label': 'Language',

  'home.eyebrow': 'A puzzle game for careful thinkers',
  'home.tag': 'Give the robot instructions in plain words. It does exactly what you wrote, and nothing else.',
  'home.begin': "Let's begin", 'home.continue': 'Continue', 'home.free': 'Free play',
  'home.pokeLabel': 'Or say one word to the robot first', 'home.pokePh': 'try: jump', 'home.pokeBtn': 'Say it',
  'home.canvasAria': 'A small robot in a room, waking up. Click it to poke it.',
  'home.robotTitle': 'Your robot', 'home.nameLabel': 'Name', 'home.colorLabel': 'Color',
  'home.collectionTitle': 'Collection', 'home.openCollection': 'Open collection',
  'home.collectionSum': '{a} of {b} discoveries and {c} of {d} badges.',
  'hero.hello': 'Hello. I am {name}. I do exactly what you write, and nothing else.',

  'poke.hello': 'Hello. I am {name}. I am a robot who takes things literally.',
  'poke.jump': 'I jumped. Technically I only hop. I am a little embarrassed.',
  'poke.dance': 'I do not know the steps. I am improvising.',
  'poke.sleep': 'Sleeping. Please keep your instructions down.',
  'poke.stay': 'Staying right here. This is the thing I am best at.',
  'poke.sing': 'Beep boop. That was my singing. It was my best.',
  'poke.name': 'My name is {name}. You can change it in the box below.',
  'poke.love': 'Thank you. That is the nicest instruction I have received.',
  'poke.rude': 'I take everything literally. That one hurt a little.',
  'poke.task': 'That sounds like a whole job. Press Let’s begin and give me proper steps.',
  'poke.empty': 'You said nothing. I did nothing. We are a great team.',
  'poke.unknown': 'I do not know the word "{word}". In the game I know only a few verbs, and I need you to use them carefully.',
  'poke.tap0': 'Hey.', 'poke.tap1': 'Please do not poke the robot.', 'poke.tap2': 'That tickles.', 'poke.tap3': 'I am going to remember this.',

  'col.yellow': 'Yellow', 'col.blue': 'Blue', 'col.pink': 'Pink', 'col.green': 'Green', 'col.purple': 'Purple', 'col.red': 'Red',

  'daily.eyebrow': 'Bug of the Day #{n}', 'daily.tileTitle': "Today's broken program", 'daily.solved': 'Solved today',
  'daily.streak': 'Streak: {n} days', 'daily.play': "Fix today's bug", 'daily.again': 'Play again',
  'daily.heading': 'Find the bug',
  'daily.goal': 'This program has a bug. Fix it so that this is true: {job} {goal}',
  'daily.greet': 'Somebody wrote this program and it does not work. Run it and watch where I go wrong. Fewer tries is better.',

  'map.title': 'Choose a level', 'map.sub': 'Finish a level to open the next one. Fewer lines earns more stars.',
  'map.build': 'Build your own level', 'map.locked': 'Finish the previous level to unlock this one.',

  'game.back': 'Back to levels', 'game.backHome': 'Back home', 'game.backEditor': 'Back to the editor',
  'game.instructions': 'Instructions', 'game.tabType': 'Type', 'game.tabBlocks': 'Blocks',
  'game.run': 'Run', 'game.running': 'Running', 'game.pause': 'Pause', 'game.resume': 'Resume', 'game.step': 'Step', 'game.stepBack': 'Back',
  'game.reset': 'Reset room', 'game.hint': 'Hint', 'game.voice': 'Speak', 'game.listening': 'Listening…', 'game.ai': 'Ask a real AI',
  'game.log': 'What Robot did', 'game.dict': "Robot's dictionary", 'game.dictNote': 'Robot understands English commands only, in every language.',
  'game.levelOf': 'Level {n} of {total}', 'game.canvasAria': 'Isometric room for {title} with a robot.',
  'dict.places': 'Places here:', 'dict.things': 'Things here:',
  'log.empty': "Robot's steps show up here as it runs.",
  'msg.empty': 'There is nothing to do. Robot is delighted and also bored. Write a line first.',
  'msg.sandboxDone': 'Robot finished all {n} lines. No goal here, so no judgment.',
  'msg.unmet': 'Robot finished every line, but the job is not done: {why}.',
  'msg.win': 'Job done. Robot is thrilled and slightly confused about how.',
  'hint.label': 'Hint {i} of {n}: {text}',

  'win.next': 'Next level', 'win.toMap': 'Back to the map', 'win.share': 'Copy result', 'win.challenge': 'Challenge a friend', 'win.toEditor': 'Back to the editor',
  'win.stars3': 'Perfect. {n} lines. That is as short as it gets.',
  'win.stars12': 'Done. {n} lines. Can you do it in {opt}?',
  'win.custom': 'Solved in {n} lines.',
  'win.editor': 'Your level works. Solved in {n} lines, which is now the target for players.',
  'win.daily1': 'Bug squashed on the first try. Streak: {streak}.',
  'win.daily': 'Bug squashed in {n} tries. Streak: {streak}.',
  'win.beat': '{name} needed {theirs} lines. You used {n}. You win!',
  'win.tied': '{name} needed {theirs} lines. You used {n}. A tie!',
  'win.lost': '{name} needed {theirs} lines. You used {n}. Try for fewer.',
  'challenge.banner': '{name} solved this in {n} lines. Can you beat that?', 'challenge.friend': 'A friend',
  'challenge.msg': 'I solved "{title}" in {n} lines in Literal Robot. Can you beat it? {link}',
  'share.text': 'Literal Robot, Bug of the Day #{n}\n{grid}\n{tries}', 'share.try1': 'Solved in 1 try', 'share.tries': 'Solved in {n} tries',
  'copy.ok': 'Copied.', 'copy.manual': 'Could not copy automatically. Select and copy this: {text}',
  'shared.bad': 'That level code or link is not valid.',

  'banner.daily': 'Bug of the Day #{n} · tries ', 'banner.test': 'Testing your level. Solve it to unlock sharing.',
  'banner.custom': 'A level built by another player', 'banner.sandbox': 'Sandbox. No goal, no stars.', 'banner.customLabel': 'Custom level',

  'blk.up': 'Move up', 'blk.down': 'Move down', 'blk.indent': 'Indent (put inside the repeat above)', 'blk.outdent': 'Remove indent', 'blk.del': 'Delete block',
  'blk.raw': 'Instruction text', 'blk.empty': 'Click a block above, or drag it here, to start.', 'blk.add': 'Add',

  'ai.intro': 'A real language model can fill in the gaps that Robot never will. It rewrites your instructions into lines Robot understands, then you can run them.',
  'ai.key': 'Anthropic API key', 'ai.model': 'Model', 'ai.remember': 'Remember the key in this browser',
  'ai.privacy': 'Your key and instructions go only from this browser to api.anthropic.com. Do not remember a key on a shared computer.',
  'ai.ask': 'Ask the AI', 'ai.result': 'The AI suggests', 'ai.use': 'Use these lines', 'ai.run': 'Use and run',
  'ai.needKey': 'Paste an API key first.', 'ai.thinking': 'Thinking…',
  'ai.errHttp': 'The API said no ({status}). {msg}', 'ai.errNet': 'Could not reach the API. Check your connection. This does not work inside some embedded previews.',
  'ai.empty': 'The AI sent back nothing usable.',
  'voice.err': 'Voice input did not work here. You can still type.',

  'gallery.title': 'Collection', 'gallery.sub': 'Every way Robot has misunderstood you, and every badge you have earned.',
  'gallery.blunders': 'Blunders', 'gallery.quirks': 'Happy accidents', 'gallery.badges': 'Badges', 'gallery.clue': 'Show clue',
  'toast.badge': 'Badge unlocked', 'toast.newEntry': 'New in your collection',

  'ach.first_win.t': 'First job done', 'ach.first_win.d': 'Finish any level.',
  'ach.three_stars.t': 'Neat work', 'ach.three_stars.d': 'Earn three stars on a level.',
  'ach.all_levels.t': 'Graduate', 'ach.all_levels.d': 'Finish all five levels.',
  'ach.perfect.t': 'Perfectionist', 'ach.perfect.d': 'Three stars on every level.',
  'ach.loop_master.t': 'Loop master', 'ach.loop_master.d': 'Three stars on the Cookie Jar.',
  'ach.blunders_10.t': 'Professional breaker', 'ach.blunders_10.d': 'Discover 10 blunders.',
  'ach.blunders_all.t': 'Every mistake', 'ach.blunders_all.d': 'Discover every blunder.',
  'ach.quirks_all.t': 'Happy little accidents', 'ach.quirks_all.d': 'Discover every happy accident.',
  'ach.daily_first.t': 'Bug squasher', 'ach.daily_first.d': 'Solve a Bug of the Day.',
  'ach.streak_3.t': 'On a roll', 'ach.streak_3.d': 'Solve the Bug of the Day three days in a row.',
  'ach.poke_10.t': 'Chatterbox', 'ach.poke_10.d': 'Poke or talk to the robot 10 times.',
  'ach.stepper.t': 'Slow and steady', 'ach.stepper.d': 'Use Step 10 times.',
  'ach.builder.t': 'Level builder', 'ach.builder.d': 'Build a level and solve it yourself.',
  'ach.sharer.t': 'Show off', 'ach.sharer.d': 'Copy a level link, challenge or result.',
  'ach.named.t': 'Family', 'ach.named.d': 'Give your robot a name.',

  'create.title': 'Build a level', 'create.sub': 'Design a room, set a goal, solve it yourself, then share it with a link or a code.',
  'create.canvasAria': 'Preview of your level.', 'create.name': 'Level name', 'create.job': 'Instruction for the player (optional)',
  'create.furniture': 'Furniture', 'create.items': 'Items and where they start', 'create.goals': 'Goals (all must be true)',
  'create.test': 'Test my level', 'create.clear': 'Start over', 'create.shareTitle': 'Share your level', 'create.link': 'Link', 'create.code': 'Level code', 'create.copy': 'Copy',
  'create.loadTitle': 'Have a level code?', 'create.loadPh': 'Paste a code or link', 'create.loadPlay': 'Play it', 'create.loadEdit': 'Edit it',
  'create.startsAt': 'Starts at', 'create.needFurniture': 'Add some furniture first.',
  'create.goalKind': 'Goal type', 'create.goalItem': 'Item', 'create.goalTarget': 'Where', 'create.removeGoal': 'Remove this goal', 'create.addGoal': 'Add a goal',
  'create.goalPrefix': 'Goal:', 'create.notReady': 'Not ready yet:',
  'create.shareNote': 'Tested and solved in {n} lines. If the link does not open for someone, they can paste the code under "Have a level code?".',
  'goal.at': 'is at', 'goal.in': 'is inside', 'goal.on': 'is on top of', 'goal.toasted': 'bread is toasted', 'goal.lit': 'candle is lit', 'goal.watered': 'plant is watered', 'goal.full': 'can is full',

  'foot': 'Fewer lines earns more stars. Your progress is saved in this browser.'
};

var ES = {
  'nav.play': 'Jugar', 'nav.daily': 'Error del día', 'nav.sandbox': 'Taller libre', 'nav.gallery': 'Colección', 'nav.create': 'Crear',
  'sound.on': 'Sonido activado', 'sound.off': 'Sonido apagado', 'lang.label': 'Idioma',

  'home.eyebrow': 'Un juego de ingenio para mentes cuidadosas',
  'home.tag': 'Dale instrucciones al robot con palabras sencillas. Hace exactamente lo que escribes, y nada más.',
  'home.begin': 'Empecemos', 'home.continue': 'Continuar', 'home.free': 'Juego libre',
  'home.pokeLabel': 'O dile una palabra al robot primero', 'home.pokePh': 'prueba: jump', 'home.pokeBtn': 'Decirlo',
  'home.canvasAria': 'Un robot pequeño en una habitación, despertando. Haz clic para tocarlo.',
  'home.robotTitle': 'Tu robot', 'home.nameLabel': 'Nombre', 'home.colorLabel': 'Color',
  'home.collectionTitle': 'Colección', 'home.openCollection': 'Abrir colección',
  'home.collectionSum': '{a} de {b} descubrimientos y {c} de {d} insignias.',
  'hero.hello': 'Hola. Soy {name}. Hago exactamente lo que escribes, y nada más.',

  'poke.hello': 'Hola. Soy {name}. Soy un robot que se toma todo al pie de la letra.',
  'poke.jump': 'Salté. Técnicamente solo doy brincos. Me da un poco de vergüenza.',
  'poke.dance': 'No me sé los pasos. Estoy improvisando.',
  'poke.sleep': 'Durmiendo. Por favor, instrucciones en voz baja.',
  'poke.stay': 'Me quedo aquí. Es lo que mejor se me da.',
  'poke.sing': 'Bip bop. Eso era cantar. Es lo mejor que tengo.',
  'poke.name': 'Me llamo {name}. Puedes cambiarlo en el cuadro de abajo.',
  'poke.love': 'Gracias. Es la instrucción más amable que he recibido.',
  'poke.rude': 'Me tomo todo literalmente. Esa dolía un poquito.',
  'poke.task': 'Eso suena a un trabajo entero. Pulsa Empecemos y dame pasos de verdad.',
  'poke.empty': 'No dijiste nada. No hice nada. Somos un gran equipo.',
  'poke.unknown': 'No conozco la palabra "{word}". En el juego solo sé unos pocos verbos, y necesito que los uses con cuidado.',
  'poke.tap0': 'Eh.', 'poke.tap1': 'Por favor, no toques al robot.', 'poke.tap2': 'Me hace cosquillas.', 'poke.tap3': 'Voy a recordar esto.',

  'col.yellow': 'Amarillo', 'col.blue': 'Azul', 'col.pink': 'Rosa', 'col.green': 'Verde', 'col.purple': 'Morado', 'col.red': 'Rojo',

  'daily.eyebrow': 'Error del día n.º {n}', 'daily.tileTitle': 'El programa roto de hoy', 'daily.solved': 'Resuelto hoy',
  'daily.streak': 'Racha: {n} días', 'daily.play': 'Arreglar el error de hoy', 'daily.again': 'Jugar otra vez',
  'daily.heading': 'Encuentra el error',
  'daily.goal': 'Este programa tiene un error. Arréglalo para que se cumpla: {job} {goal}',
  'daily.greet': 'Alguien escribió este programa y no funciona. Ejecútalo y mira dónde me equivoco. Cuantos menos intentos, mejor.',

  'map.title': 'Elige un nivel', 'map.sub': 'Termina un nivel para abrir el siguiente. Menos líneas dan más estrellas.',
  'map.build': 'Crea tu propio nivel', 'map.locked': 'Termina el nivel anterior para desbloquear este.',

  'game.back': 'Volver a los niveles', 'game.backHome': 'Volver al inicio', 'game.backEditor': 'Volver al editor',
  'game.instructions': 'Instrucciones', 'game.tabType': 'Escribir', 'game.tabBlocks': 'Bloques',
  'game.run': 'Ejecutar', 'game.running': 'Ejecutando', 'game.pause': 'Pausa', 'game.resume': 'Seguir', 'game.step': 'Paso', 'game.stepBack': 'Atrás',
  'game.reset': 'Reiniciar sala', 'game.hint': 'Pista', 'game.voice': 'Hablar', 'game.listening': 'Escuchando…', 'game.ai': 'Preguntar a una IA real',
  'game.log': 'Lo que hizo Robot', 'game.dict': 'Diccionario de Robot', 'game.dictNote': 'Robot solo entiende comandos en inglés, en todos los idiomas.',
  'game.levelOf': 'Nivel {n} de {total}', 'game.canvasAria': 'Sala isométrica de {title} con un robot.',
  'dict.places': 'Lugares:', 'dict.things': 'Cosas:',
  'log.empty': 'Los pasos de Robot aparecen aquí mientras se ejecuta.',
  'msg.empty': 'No hay nada que hacer. Robot está encantado y también aburrido. Escribe una línea primero.',
  'msg.sandboxDone': 'Robot terminó las {n} líneas. Aquí no hay meta, así que no hay juicio.',
  'msg.unmet': 'Robot terminó todas las líneas, pero el trabajo no está hecho: {why}.',
  'msg.win': 'Trabajo hecho. Robot está feliz y un poco confundido sobre cómo.',
  'hint.label': 'Pista {i} de {n}: {text}',

  'win.next': 'Siguiente nivel', 'win.toMap': 'Volver al mapa', 'win.share': 'Copiar resultado', 'win.challenge': 'Retar a un amigo', 'win.toEditor': 'Volver al editor',
  'win.stars3': 'Perfecto. {n} líneas. Más corto no se puede.',
  'win.stars12': 'Hecho. {n} líneas. ¿Puedes hacerlo en {opt}?',
  'win.custom': 'Resuelto en {n} líneas.',
  'win.editor': 'Tu nivel funciona. Resuelto en {n} líneas, que ahora es la meta para los jugadores.',
  'win.daily1': 'Error aplastado al primer intento. Racha: {streak}.',
  'win.daily': 'Error aplastado en {n} intentos. Racha: {streak}.',
  'win.beat': '{name} necesitó {theirs} líneas. Tú usaste {n}. ¡Ganas!',
  'win.tied': '{name} necesitó {theirs} líneas. Tú usaste {n}. ¡Empate!',
  'win.lost': '{name} necesitó {theirs} líneas. Tú usaste {n}. Intenta con menos.',
  'challenge.banner': '{name} lo resolvió en {n} líneas. ¿Puedes superarlo?', 'challenge.friend': 'Un amigo',
  'challenge.msg': 'Resolví "{title}" en {n} líneas en Literal Robot. ¿Puedes superarlo? {link}',
  'share.text': 'Literal Robot, Error del día n.º {n}\n{grid}\n{tries}', 'share.try1': 'Resuelto en 1 intento', 'share.tries': 'Resuelto en {n} intentos',
  'copy.ok': 'Copiado.', 'copy.manual': 'No se pudo copiar automáticamente. Selecciona y copia esto: {text}',
  'shared.bad': 'Ese código o enlace de nivel no es válido.',

  'banner.daily': 'Error del día n.º {n} · intentos ', 'banner.test': 'Probando tu nivel. Resuélvelo para poder compartirlo.',
  'banner.custom': 'Un nivel creado por otro jugador', 'banner.sandbox': 'Taller libre. Sin meta, sin estrellas.', 'banner.customLabel': 'Nivel personalizado',

  'blk.up': 'Subir', 'blk.down': 'Bajar', 'blk.indent': 'Sangrar (meter dentro del repeat de arriba)', 'blk.outdent': 'Quitar sangría', 'blk.del': 'Borrar bloque',
  'blk.raw': 'Texto de la instrucción', 'blk.empty': 'Haz clic en un bloque de arriba, o arrástralo aquí, para empezar.', 'blk.add': 'Añadir',

  'ai.intro': 'Un modelo de lenguaje real puede rellenar los huecos que Robot nunca rellenará. Reescribe tus instrucciones en líneas que Robot entiende, y luego puedes ejecutarlas.',
  'ai.key': 'Clave de API de Anthropic', 'ai.model': 'Modelo', 'ai.remember': 'Recordar la clave en este navegador',
  'ai.privacy': 'Tu clave y tus instrucciones solo van de este navegador a api.anthropic.com. No recuerdes una clave en un ordenador compartido.',
  'ai.ask': 'Preguntar a la IA', 'ai.result': 'La IA sugiere', 'ai.use': 'Usar estas líneas', 'ai.run': 'Usar y ejecutar',
  'ai.needKey': 'Pega primero una clave de API.', 'ai.thinking': 'Pensando…',
  'ai.errHttp': 'La API respondió que no ({status}). {msg}', 'ai.errNet': 'No se pudo conectar con la API. Revisa tu conexión. No funciona dentro de algunas vistas previas incrustadas.',
  'ai.empty': 'La IA no devolvió nada útil.',
  'voice.err': 'La entrada de voz no funcionó aquí. Todavía puedes escribir.',

  'gallery.title': 'Colección', 'gallery.sub': 'Cada forma en que Robot te ha malentendido, y cada insignia que has ganado.',
  'gallery.blunders': 'Metidas de pata', 'gallery.quirks': 'Accidentes felices', 'gallery.badges': 'Insignias', 'gallery.clue': 'Ver pista',
  'toast.badge': 'Insignia desbloqueada', 'toast.newEntry': 'Nuevo en tu colección',

  'ach.first_win.t': 'Primer trabajo hecho', 'ach.first_win.d': 'Termina cualquier nivel.',
  'ach.three_stars.t': 'Trabajo limpio', 'ach.three_stars.d': 'Consigue tres estrellas en un nivel.',
  'ach.all_levels.t': 'Graduado', 'ach.all_levels.d': 'Termina los cinco niveles.',
  'ach.perfect.t': 'Perfeccionista', 'ach.perfect.d': 'Tres estrellas en todos los niveles.',
  'ach.loop_master.t': 'Maestro de bucles', 'ach.loop_master.d': 'Tres estrellas en el Tarro de galletas.',
  'ach.blunders_10.t': 'Rompedor profesional', 'ach.blunders_10.d': 'Descubre 10 metidas de pata.',
  'ach.blunders_all.t': 'Todos los errores', 'ach.blunders_all.d': 'Descubre todas las metidas de pata.',
  'ach.quirks_all.t': 'Pequeños accidentes felices', 'ach.quirks_all.d': 'Descubre todos los accidentes felices.',
  'ach.daily_first.t': 'Cazaerrores', 'ach.daily_first.d': 'Resuelve un Error del día.',
  'ach.streak_3.t': 'En racha', 'ach.streak_3.d': 'Resuelve el Error del día tres días seguidos.',
  'ach.poke_10.t': 'Parlanchín', 'ach.poke_10.d': 'Toca o habla con el robot 10 veces.',
  'ach.stepper.t': 'Despacito', 'ach.stepper.d': 'Usa Paso 10 veces.',
  'ach.builder.t': 'Creador de niveles', 'ach.builder.d': 'Crea un nivel y resélvelo tú mismo.',
  'ach.sharer.t': 'Presumido', 'ach.sharer.d': 'Copia un enlace de nivel, un reto o un resultado.',
  'ach.named.t': 'De la familia', 'ach.named.d': 'Ponle nombre a tu robot.',

  'create.title': 'Crea un nivel', 'create.sub': 'Diseña una sala, fija una meta, resélvela tú mismo y compártela con un enlace o un código.',
  'create.canvasAria': 'Vista previa de tu nivel.', 'create.name': 'Nombre del nivel', 'create.job': 'Instrucción para el jugador (opcional)',
  'create.furniture': 'Muebles', 'create.items': 'Objetos y dónde empiezan', 'create.goals': 'Metas (todas deben cumplirse)',
  'create.test': 'Probar mi nivel', 'create.clear': 'Empezar de nuevo', 'create.shareTitle': 'Comparte tu nivel', 'create.link': 'Enlace', 'create.code': 'Código del nivel', 'create.copy': 'Copiar',
  'create.loadTitle': '¿Tienes un código de nivel?', 'create.loadPh': 'Pega un código o enlace', 'create.loadPlay': 'Jugarlo', 'create.loadEdit': 'Editarlo',
  'create.startsAt': 'Empieza en', 'create.needFurniture': 'Añade primero algunos muebles.',
  'create.goalKind': 'Tipo de meta', 'create.goalItem': 'Objeto', 'create.goalTarget': 'Dónde', 'create.removeGoal': 'Quitar esta meta', 'create.addGoal': 'Añadir una meta',
  'create.goalPrefix': 'Meta:', 'create.notReady': 'Aún no está listo:',
  'create.shareNote': 'Probado y resuelto en {n} líneas. Si el enlace no abre a alguien, puede pegar el código en "¿Tienes un código de nivel?".',
  'goal.at': 'está en', 'goal.in': 'está dentro de', 'goal.on': 'está encima de', 'goal.toasted': 'el pan está tostado', 'goal.lit': 'la vela está encendida', 'goal.watered': 'la planta está regada', 'goal.full': 'la regadera está llena',

  'foot': 'Menos líneas dan más estrellas. Tu progreso se guarda en este navegador.'
};

/* Level text overrides. English comes from the level objects themselves. */
var ES_LEVELS = {
  toast: {
    title: 'Tostada', job: 'Pon una tostada en el plato.',
    goal: 'El pan empieza en la encimera. Termina con pan tostado en el plato.',
    greet: 'Hola. Hago exactamente lo que escribes, nada más. Pulsa Ejecutar y mira qué significa "make toast" para mí.',
    hints: ['Robot solo conoce unos pocos verbos. Abre el diccionario debajo del registro.', 'Robot solo puede recoger algo cuando está junto a él.', 'Orden de trabajo: traer el pan, tostarlo, sacarlo y ponerlo en el plato.']
  },
  plant: {
    title: 'Planta sedienta', job: 'Riega la planta.',
    goal: 'La regadera está en el estante. El grifo está en el fregadero. La planta está al otro lado de la sala.',
    greet: 'La planta parece sedienta. Seguiré tus palabras al pie de la letra. Pulsa Ejecutar para ver cómo sale.',
    hints: ['Robot no puede llenar una regadera que no está sujetando.', 'Robot solo tiene un par de manos. Trae primero la regadera y luego ve al agua.', 'Estante, recoger la regadera, fregadero, llenarla, planta, verterla sobre la planta.']
  },
  candle: {
    title: 'Vela de cumpleaños', job: 'Pon una vela encendida en la tarta.',
    goal: 'La tarta está en la mesa. La vela y las cerillas están en el cajón.',
    greet: 'Es el cumpleaños de alguien. No tengo bolsillos y solo un par de manos. Pulsa Ejecutar para probar tu primera idea.',
    hints: ['Robot solo puede llevar una cosa a la vez. Espera dos viajes al cajón.', 'La vela va primero sobre la tarta. Luego trae las cerillas.', 'Robot debe sujetar las cerillas y estar junto a la vela para encenderla.']
  },
  lunchbox: {
    title: 'Arregla la fiambrera', job: 'Depura este programa para que los dos tentempiés acaben en la fiambrera.',
    goal: 'El sándwich y la manzana están en la encimera. La fiambrera está en la mesa. Lee el programa, ejecútalo y encuentra la línea que falla.',
    greet: 'Alguien escribió este programa para mí y creo que no funciona. Pulsa Ejecutar y mira dónde me atasco.',
    hints: ['Lee el programa como lo hace Robot: una línea cada vez, sin adivinar.', 'Robot tiene un par de manos. Un tentempié por viaje.', 'Cuando el primer tentempié esté en la fiambrera, vuelve a la encimera por el segundo.']
  },
  cookies: {
    title: 'Tarro de galletas', job: 'Pon las cuatro galletas en el tarro.',
    goal: 'Las galletas están en la encimera y el tarro en la mesa. Robot tiene un par de manos, así que necesita cuatro viajes. ¿Puedes decirlo en menos líneas?',
    greet: 'Cuatro galletas. Un par de manos. Podría hacerlo con dieciséis líneas, pero me han dicho que existe un atajo llamado repeat.',
    hints: ['Escribir las mismas cuatro líneas cuatro veces funciona, pero da menos estrellas.', 'Prueba "repeat 4 times" y luego sangra con dos espacios las líneas a repetir.', 'Las líneas sangradas pertenecen al repeat de arriba. Las líneas sin sangría se ejecutan una vez, después del bucle.']
  },
  sandbox: {
    title: 'Taller libre', job: 'Juego libre. Sin meta, sin estrellas.',
    goal: 'Todos los objetos están en la sala. Prueba cosas, rompe cosas y mira qué hace Robot. Todo lo que encuentres va a tu colección.',
    greet: 'Toda la sala es tuya. Haré lo que me digas, exactamente como me lo digas.',
    hints: ['Prueba con la tarta, la tostadora y la planta. Robot reacciona distinto a cada una.', 'Prueba a pulsar el grifo sin sujetar la regadera.', 'Prueba repeat 3 times con líneas sangradas debajo.']
  }
};

var DICTS = { en: EN, es: ES };
var lang = 'en';

function t(key, vars) {
  var s = (DICTS[lang] && DICTS[lang][key]);
  if (s === undefined) s = EN[key];
  if (s === undefined) return key;
  if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] === undefined ? m : String(vars[k]); });
  return s;
}
function setLang(l) { lang = DICTS[l] ? l : 'en'; }
function apply(rootEl) {
  var n, i, list;
  list = rootEl.querySelectorAll('[data-i18n]');
  for (i = 0; i < list.length; i++) { n = list[i]; n.textContent = t(n.getAttribute('data-i18n')); }
  list = rootEl.querySelectorAll('[data-i18n-ph]');
  for (i = 0; i < list.length; i++) { n = list[i]; n.setAttribute('placeholder', t(n.getAttribute('data-i18n-ph'))); }
  list = rootEl.querySelectorAll('[data-i18n-aria]');
  for (i = 0; i < list.length; i++) { n = list[i]; n.setAttribute('aria-label', t(n.getAttribute('data-i18n-aria'))); }
}
function levelText(id, field) {
  if (lang === 'en') return null;
  var o = ES_LEVELS[id];
  return o && o[field] ? o[field] : null;
}

root.I18N = { t: t, setLang: setLang, apply: apply, levelText: levelText, get lang() { return lang; }, _dicts: DICTS, _levels: ES_LEVELS };
})(typeof window !== 'undefined' ? window : globalThis);
