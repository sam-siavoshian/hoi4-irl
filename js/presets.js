// Persona presets and the vocabulary of life areas the offline judge understands.
// Pure data and tiny helpers: no DOM, no imports, safe under node.
//
// Word lists: a plain word matches whole, plus its regular inflections ("exam" also matches "exams",
// "study" matches "studied"), never as a fragment of another word ("class" does not match "classic",
// "ill" does not match "skill"). A trailing * marks a stem ("procrastinat*"). Entries with a space or a
// hyphen are phrases and win over the single words inside them ("blood test" is health, not school).

// Presets are written for the seven front slots, in the order a scenario lists its fronts. These are the first scenario's ids,
// kept so a preset can still be read by them (labels.afg and so on).
const FRONT_IDS = ['afg', 'cau', 'tks', 'irq', 'raj', 'tur', 'glf'];

// `match` decides which areas a label belongs to (a label may belong to several: "Gym & Health").
// `near` is where an area's words go when no front carries that area: the first area in the list that has a front.
export const AREAS = [
  { id: 'school', name: 'School & study', suggest: ['School', 'Studies', 'Classes', 'Thesis', 'University'],
    match: /school|\bstud(y|ies|ent)|\bclass(es)?\b|\buni(versity)?\b|college|academ|thesis|dissertation|\bphd\b|degree|exam|homework|course|grades?\b/i,
    near: ['reading', 'work', 'self'],
    words: ['school', 'class', 'exam', 'test', 'quiz', 'midterm', 'final', 'finals', 'homework', 'assignment', 'grade', 'teacher', 'professor', 'lecture', 'study', 'essay', 'gpa', 'college', 'university', 'uni', 'course', 'coursework', 'semester', 'paper', 'lab', 'tutor', 'thesis', 'dissertation', 'seminar', 'campus', 'syllabus', 'lesson', 'classmate', 'degree', 'phd', 'masters', 'revision', 'revise', 'calculus', 'math', 'maths', 'chemistry', 'physics', 'biology', 'algebra', 'geometry', 'student', 'textbook', 'flashcard', 'advisor', 'pset', 'recitation', 'graduat*', 'office hours', 'report card', 'problem set', 'study group', 'lab report', 'pop quiz'] },
  { id: 'work', name: 'Work & job', suggest: ['Work', 'Job', 'Career'],
    match: /\bwork\b|\bjobs?\b|career|office|profession|employ/i,
    near: ['startup', 'jobhunt', 'project', 'money', 'self'],
    words: ['work', 'job', 'boss', 'manager', 'office', 'colleague', 'coworker', 'meeting', 'shift', 'client', 'promotion', 'promoted', 'deadline', 'presentation', 'report', 'career', 'team', 'workload', 'overtime', 'standup', 'email', 'inbox', 'hr', 'commute', 'supervisor', 'stakeholder', 'workplace', 'onboarding', 'payroll', 'quarter', 'co-worker', 'stand-up', 'performance review', 'on call', 'laid off', 'day job', 'my desk', 'work trip'] },
  { id: 'startup', name: 'Startup & business', suggest: ['Startup', 'Business', 'Company'],
    match: /start.?up|business|company|venture|founder|\bshop\b|\bstore\b|freelanc|agency/i,
    near: ['work', 'project', 'money', 'self'],
    words: ['startup', 'company', 'product', 'launch', 'ship', 'shipped', 'user', 'customer', 'revenue', 'investor', 'funding', 'pitch', 'cofounder', 'founder', 'code', 'coding', 'bug', 'deploy', 'feature', 'app', 'mrr', 'arr', 'demo', 'business', 'sales', 'vc', 'runway', 'churn', 'churned', 'beta', 'waitlist', 'signup', 'prototype', 'mvp', 'accelerator', 'pilot', 'release', 'fundraise', 'fundraising', 'co-founder', 'seed round', 'term sheet', 'burn rate', 'landing page', 'paying customer', 'sign-up', 'pitch deck', 'freelance'] },
  { id: 'jobhunt', name: 'Job search', suggest: ['Job search', 'Applications', 'Interviews'],
    match: /job.?(search|hunt|seek)|applications?|interview|career prep|recruit|intern/i,
    near: ['work', 'startup', 'money', 'self'],
    words: ['application', 'applied', 'apply', 'resume', 'cv', 'interview', 'interviewed', 'recruiter', 'offer', 'rejection', 'linkedin', 'internship', 'vacancy', 'hiring', 'referral', 'screening', 'cover letter', 'job offer', 'job search', 'job hunt', 'phone screen', 'final round', 'second round', 'first round', 'take-home', 'job application', 'job board', 'heard back', 'hear back', 'hiring manager'] },
  { id: 'money', name: 'Money & finance', suggest: ['Money', 'Finances', 'Savings', 'Budget'],
    match: /money|financ|saving|budget|income|debt|invest|wealth|\bcash\b|\bbills?\b/i,
    near: ['self', 'work', 'home'],
    words: ['money', 'budget', 'savings', 'rent', 'bill', 'debt', 'loan', 'bank', 'invest', 'investment', 'stocks', 'salary', 'paycheck', 'tax', 'taxes', 'expense', 'spend', 'spent', 'spending', 'afford', 'finance', 'financial', 'mortgage', 'overdraft', 'overdrawn', 'income', 'cash', 'refund', 'purchase', 'wallet', 'pension', 'invoice', 'overspent', 'broke', 'bought', 'saved up', 'saving up', 'saved money', 'credit card', 'got paid', 'pay off', 'paid off', 'emergency fund', 'net worth', 'impulse buy', 'side income', 'a raise', 'out of money'] },
  { id: 'family', name: 'Family', suggest: ['Family', 'Parents', 'Home life'],
    match: /famil|\bparents?\b|relatives|\bmom\b|\bdad\b|sibling/i,
    near: ['home', 'friends', 'self'],
    words: ['family', 'mom', 'mum', 'mother', 'dad', 'father', 'parents', 'parent', 'brother', 'sister', 'sibling', 'grandma', 'grandpa', 'grandmother', 'grandfather', 'grandparents', 'uncle', 'aunt', 'cousin', 'nephew', 'niece', 'relatives', 'stepdad', 'stepmom', 'mama', 'papa', 'in-laws', 'mother-in-law', 'father-in-law', 'my folks', 'family dinner'] },
  { id: 'partner', name: 'Partner & romance', suggest: ['Partner', 'Relationship', 'Dating', 'Marriage'],
    match: /partner|relationship|girlfriend|boyfriend|\blove\b|romanc|dating|\bwife\b|husband|marriage|spouse/i,
    near: ['self', 'family', 'friends'],
    words: ['girlfriend', 'gf', 'boyfriend', 'bf', 'partner', 'relationship', 'date', 'babe', 'anniversary', 'breakup', 'wife', 'wives', 'husband', 'fiance', 'fiancee', 'spouse', 'marriage', 'married', 'crush', 'romantic', 'romance', 'tinder', 'hinge', 'bumble', 'dumped', 'valentine', 'broke up', 'date night', 'my ex', 'love life', 'couples therapy', 'asked her out', 'asked him out', 'asked them out', 'first date', 'second date'] },
  { id: 'kids', name: 'Kids & parenting', suggest: ['Kids', 'Parenting', 'Children'],
    match: /\bkids?\b|child|parenting|\bbaby\b|\bsons?\b|daughter|toddler/i,
    near: ['family', 'home', 'self'],
    words: ['kid', 'child', 'children', 'son', 'daughter', 'baby', 'toddler', 'teen', 'teenager', 'daycare', 'nursery', 'preschool', 'kindergarten', 'bedtime', 'tantrum', 'diaper', 'nappy', 'playdate', 'parenting', 'babysitter', 'nanny', 'newborn', 'stroller', 'pediatrician', 'twins', 'day care', 'school run', 'pick-up', 'drop-off', 'parent-teacher', 'story time', 'bath time', 'potty training', 'my boy', 'my girl', 'the little one', 'homework with'] },
  { id: 'friends', name: 'Friends & social', suggest: ['Friends', 'Social life', 'Community'],
    match: /friend|social|communit|\bpeople\b|network/i,
    near: ['self', 'family'],
    words: ['friend', 'buddy', 'party', 'hangout', 'social', 'bro', 'guys', 'roommate', 'flatmate', 'mate', 'pal', 'bestie', 'invite', 'invited', 'reunion', 'neighbour', 'neighbor', 'club', 'socialis*', 'socializ*', 'hang out', 'hung out', 'hanging out', 'group chat', 'best friend', 'game night', 'get-together', 'the boys', 'the girls', 'caught up with', 'catch up with', 'night out', 'birthday party', 'house party'] },
  { id: 'health', name: 'Health & medical', suggest: ['Health', 'Body', 'Medical'],
    match: /health|\bbody\b|medical|wellness|illness|physio|chronic/i,
    near: ['fitness', 'sleep', 'recovery', 'self'],
    words: ['health', 'sick', 'ill', 'illness', 'flu', 'fever', 'doctor', 'dentist', 'hospital', 'medication', 'meds', 'medicine', 'injury', 'injured', 'pain', 'headache', 'migraine', 'surgery', 'checkup', 'symptom', 'covid', 'virus', 'infection', 'allergy', 'physio', 'physiotherapy', 'nausea', 'cough', 'clinic', 'diagnosis', 'diagnosed', 'prescription', 'asthma', 'sprained', 'ankle', 'knee', 'body', 'concussion', 'a cold', 'check-up', 'blood test', 'blood pressure', 'back pain', 'threw up', 'my back', 'pulled a muscle', 'food poisoning', 'stomach bug'] },
  { id: 'fitness', name: 'Fitness & gym', suggest: ['Gym', 'Fitness', 'Running', 'Training', 'Marathon'],
    match: /\bgym\b|fitness|workout|exercis|\blift|\brun(s|ning)?\b|marathon|training|\bsports?\b|\byoga\b|cycling|\bswim|triathl|climb|strength|cardio/i,
    near: ['health', 'sport', 'self'],
    words: ['gym', 'workout', 'lift', 'lifting', 'run', 'ran', 'running', 'jog', 'jogging', 'pr', 'pb', 'bench', 'squat', 'deadlift', 'cardio', 'weights', 'training', 'trained', 'exercise', 'swim', 'swam', 'swimming', 'cycle', 'cycling', 'bike', 'biked', 'yoga', 'pilates', 'hike', 'hiked', 'marathon', '5k', '10k', 'mile', 'miles', 'km', 'steps', 'reps', 'stretch', 'stretching', 'treadmill', 'crossfit', 'climbing', 'climbed', 'trainer', 'walk', 'walked', 'tempo', 'sport', 'worked out', 'work out', 'working out', 'leg day', 'rest day', 'personal best', 'personal record', 'long run', 'half marathon', 'new pr'] },
  { id: 'sport', name: 'Sport & competition', suggest: ['Competition', 'Matches', 'Racing', 'Team sport'],
    match: /competi|\bmatch(es)?\b|\brac(e|es|ing)\b|tournament|league|football|soccer|basketball|tennis|\bgames?\b/i,
    near: ['fitness', 'hobby', 'health', 'self'],
    words: ['match', 'game', 'race', 'raced', 'tournament', 'competition', 'compete', 'competed', 'league', 'season', 'coach', 'teammate', 'championship', 'scored', 'referee', 'opponent', 'podium', 'medal', 'qualifier', 'qualified', 'ranking', 'ranked', 'playoff', 'football', 'soccer', 'basketball', 'tennis', 'volleyball', 'rugby', 'cricket', 'hockey', 'baseball', 'golf', 'boxing', 'wrestling', 'judo', 'karate', 'scrimmage', 'sparring', 'bout', 'regatta', 'practice', 'track meet', 'swim meet', 'the meet', 'time trial', 'starting lineup', 'first place', 'race day'] },
  { id: 'sleep', name: 'Sleep & energy', suggest: ['Sleep', 'Energy', 'Rest'],
    match: /sleep|energy|\brest\b/i,
    near: ['health', 'mental', 'self', 'fitness'],
    words: ['sleep', 'slept', 'asleep', 'nap', 'napped', 'insomnia', 'bed', 'woke', 'overslept', 'tired', 'exhausted', 'energy', 'rested', 'alarm', 'snooze', 'fatigue', 'drained', 'sleepless', 'all-nighter', 'all nighter', 'stayed up', 'woke up', 'lie-in', 'jet lag', 'sleep schedule', 'slept in', 'slept through', 'worn out', 'wiped out'] },
  { id: 'mental', name: 'Mind & mood', suggest: ['Mind', 'Mood', 'Mental health'],
    match: /\bmind\b|mental|\bmood\b|therapy|wellbeing|well-being|emotion|\bhead\b|stress|anxiety/i,
    near: ['self', 'health', 'faith'],
    words: ['mood', 'anxious', 'anxiety', 'depressed', 'depression', 'stress', 'stressed', 'therapy', 'therapist', 'panic', 'lonely', 'burnout', 'overwhelmed', 'mental', 'mindset', 'motivated', 'unmotivated', 'motivation', 'sad', 'happy', 'cried', 'cry', 'calm', 'confidence', 'confident', 'worried', 'worry', 'overthinking', 'numb', 'hopeless', 'grateful', 'gratitude', 'peaceful', 'irritable', 'emotional', 'emotions', 'feelings', 'burned out', 'burnt out', 'mental health', 'self-esteem', 'felt down', 'feeling down', 'feel down', 'my head', 'panic attack'] },
  { id: 'food', name: 'Food & diet', suggest: ['Food', 'Diet', 'Nutrition'],
    match: /\bfood\b|\bdiet\b|nutrition|eating|cooking|\bweight\b|\bmeals?\b/i,
    near: ['health', 'fitness', 'self'],
    words: ['diet', 'eat', 'ate', 'eating', 'meal', 'cook', 'cooked', 'cooking', 'protein', 'calories', 'takeout', 'takeaway', 'snack', 'snacked', 'sugar', 'vegetables', 'veggies', 'breakfast', 'lunch', 'nutrition', 'macros', 'fasting', 'weight', 'overate', 'dessert', 'soda', 'hydrated', 'hydration', 'recipe', 'binged', 'junk food', 'fast food', 'meal prep', 'lost weight', 'gained weight', 'ate clean', 'cheat meal', 'weighed in', 'ordered pizza'] },
  { id: 'home', name: 'Home & chores', suggest: ['Home', 'Chores', 'Household'],
    match: /\bhome\b|\bhouse|chores?|apartment|domestic|\bflat\b/i,
    near: ['family', 'self', 'money'],
    words: ['house', 'apartment', 'chores', 'chore', 'cleaned', 'cleaning', 'laundry', 'dishes', 'tidy', 'tidied', 'declutter', 'decluttered', 'messy', 'vacuum', 'vacuumed', 'groceries', 'grocery', 'errand', 'repair', 'landlord', 'garden', 'gardening', 'plumber', 'kitchen', 'bathroom', 'garage', 'household', 'furniture', 'lawn', 'leak', 'my room', 'the washing', 'spring clean', 'home repair', 'the flat', 'moved house', 'the move'] },
  { id: 'creative', name: 'Creative work, art & music', suggest: ['Art', 'Music', 'Band', 'Creative work', 'Guitar'],
    match: /\barts?\b|artist|music|\bband\b|creativ|guitar|piano|paint|draw|\bsing|danc|photo|\bfilm|design|craft|drum|violin|theat/i,
    near: ['hobby', 'writing', 'project', 'self'],
    words: ['art', 'paint', 'painting', 'painted', 'draw', 'drawing', 'drew', 'sketch', 'music', 'song', 'guitar', 'piano', 'band', 'gig', 'rehearsal', 'rehearse', 'sing', 'sang', 'singing', 'dance', 'danced', 'compose', 'composed', 'studio', 'album', 'photo', 'photography', 'film', 'filming', 'design', 'sculpture', 'pottery', 'canvas', 'portfolio', 'exhibition', 'gallery', 'commission', 'illustrat*', 'animation', 'craft', 'knitting', 'sewing', 'choir', 'drums', 'violin', 'audition', 'lyrics', 'melody', 'creative', 'mural', 'comic', 'practice', 'setlist', 'bandmate', 'open mic', 'art block', 'creative block', 'photo shoot', 'sound check'] },
  { id: 'writing', name: 'Writing & content', suggest: ['Writing', 'Content', 'Blog', 'Novel', 'Channel'],
    match: /writ|content|\bblog|novel|\bbook\b|newsletter|youtube|channel|podcast|audience|stream|tiktok|instagram/i,
    near: ['creative', 'project', 'work', 'self'],
    words: ['write', 'wrote', 'writing', 'written', 'draft', 'drafted', 'chapter', 'novel', 'blog', 'post', 'posted', 'article', 'newsletter', 'manuscript', 'editing', 'edited', 'publish', 'published', 'poem', 'poetry', 'script', 'screenplay', 'story', 'content', 'video', 'youtube', 'channel', 'subscriber', 'follower', 'views', 'viral', 'podcast', 'episode', 'tiktok', 'instagram', 'reel', 'stream', 'streamed', 'upload', 'uploaded', 'audience', 'substack', 'thumbnail', 'word count', 'writers block', "writer's block", 'book deal'] },
  { id: 'reading', name: 'Reading & learning', suggest: ['Reading', 'Learning', 'Skills', 'Languages'],
    match: /\bread(ing)?\b|learn|skills?\b|language|\bbooks\b|self.?study|certificat/i,
    near: ['self', 'school', 'hobby'],
    words: ['read', 'reading', 'book', 'library', 'kindle', 'audiobook', 'learn', 'learning', 'tutorial', 'duolingo', 'language', 'spanish', 'french', 'german', 'japanese', 'certificate', 'certification', 'skill', 'udemy', 'coursera', 'vocabulary', 'bootcamp', 'online course', 'book club', 'pages'] },
  { id: 'faith', name: 'Faith & spirit', suggest: ['Faith', 'Spiritual life', 'Meditation'],
    match: /faith|spirit|pray|church|mosque|temple|religio|\bgod\b|meditat|mindful/i,
    near: ['mental', 'self'],
    words: ['pray', 'prayed', 'prayer', 'church', 'mosque', 'temple', 'synagogue', 'faith', 'god', 'spiritual', 'bible', 'quran', 'scripture', 'worship', 'sermon', 'ramadan', 'mindfulness', 'devotional', 'sabbath', 'meditat*', 'quiet time'] },
  { id: 'hobby', name: 'Hobbies & play', suggest: ['Hobbies', 'Games', 'Chess', 'Fun'],
    match: /hobb|gaming|chess|\bfun\b|\bplay\b|leisure|fishing|woodwork/i,
    near: ['self', 'creative', 'friends'],
    words: ['hobby', 'gaming', 'gamed', 'chess', 'puzzle', 'lego', 'fishing', 'woodworking', 'tabletop', 'minecraft', 'xbox', 'crossword', 'video game', 'video games', 'board game', 'board games'] },
  { id: 'travel', name: 'Travel', suggest: ['Travel', 'Trips', 'Adventure'],
    match: /travel|\btrips?\b|adventur|abroad|nomad/i,
    near: ['hobby', 'self', 'friends'],
    words: ['travel', 'traveled', 'travelled', 'trip', 'flight', 'vacation', 'holiday', 'airport', 'hotel', 'passport', 'visa', 'abroad', 'backpacking', 'itinerary', 'luggage', 'sightseeing', 'airbnb', 'road trip'] },
  { id: 'project', name: 'Side project', suggest: ['Side project', 'Side hustle', 'Open source'],
    match: /project|side.?hustle|open.?source|hackathon|\bbuild/i,
    near: ['startup', 'work', 'hobby', 'creative', 'self'],
    words: ['project', 'repo', 'github', 'website', 'etsy', 'hackathon', 'side project', 'side-project', 'side hustle', 'personal project', 'open source', 'pull request', 'my app', 'my site'] },
  { id: 'recovery', name: 'Recovery & sobriety', suggest: ['Sobriety', 'Recovery', 'Quit smoking'],
    match: /sobriet|\bsober|recovery|addict|\bquit|\bclean\b|drinking|smoking|abstin/i,
    near: ['self', 'mental', 'health'],
    words: ['sober', 'sobriety', 'relapse', 'relapsed', 'craving', 'urge', 'sponsor', 'rehab', 'detox', 'drink', 'drank', 'drinking', 'drunk', 'alcohol', 'smoke', 'smoked', 'smoking', 'cigarette', 'vape', 'vaped', 'weed', 'gambling', 'gambled', 'porn', 'addiction', 'withdrawal', 'hungover', 'hangover', 'counselor', 'counsellor', 'days clean', 'stayed clean', 'weeks clean', 'months clean', 'days sober', 'aa meeting', 'na meeting', 'support group', 'step work', 'twelve steps', 'used again', 'treatment plan'] },
  { id: 'self', name: 'Self & personal life', suggest: ['Self', 'Personal life', 'Me time', 'Habits'],
    match: /\bself\b|personal|\blife\b|\bme\b|myself|habit|growth|discipline|routine/i,
    near: ['mental'],
    words: ['personal', 'life', 'habit', 'routine', 'discipline', 'journal', 'journaled', 'journaling', 'phone', 'scrolling', 'scrolled', 'doomscroll*', 'procrastinat*', 'focus', 'focused', 'productive', 'productivity', 'todo', 'goals', 'organised', 'organized', 'admin', 'lazy', 'distracted', 'screen time', 'to-do', 'morning routine', 'me time', 'alone time', 'self-care', 'self care', 'life admin', 'time management', 'social media'] },
];

const P = (id, name, blurb, rows, examples, off = []) => ({
  id, name, blurb,
  slots: rows.map(r => r[0]), slotNotes: rows.map(r => r[1]), // seven labels and notes, by slot
  labels: Object.fromEntries(FRONT_IDS.map((f, i) => [f, rows[i][0]])),
  notes: Object.fromEntries(FRONT_IDS.map((f, i) => [f, rows[i][1]])),
  off, examples,
});

// rows are in slot order: the scenario's first front to its seventh
export const PRESETS = [
  P('general', 'General', 'A bit of everything: work, people, health, money, yourself.', [
    ['Money', 'income, spending, saving, bills, debt'],
    ['Family', 'parents, siblings, relatives'],
    ['Partner', 'dating, relationship, marriage'],
    ['Work', 'job, career, studies or business'],
    ['Health', 'body, fitness, sleep, food, doctor'],
    ['Friends', 'friends, social plans, community'],
    ['Self', 'mood, habits, hobbies, growth'],
  ], [
    'Got a raise at work, and I finally paid off my credit card.',
    'Had a fight with my sister. My girlfriend and I had a great date night.',
    'Slept badly and skipped my run. Dinner with friends was fun. I kept my journaling habit going.',
  ]),
  P('student', 'Student', 'Classes and exams first, with room for the rest of life.', [
    ['Classes', 'lectures, homework, exams, grades'],
    ['Family', 'parents, siblings, relatives'],
    ['Dating', 'partner, relationship, crushes'],
    ['Career prep', 'internships, applications, interviews'],
    ['Health & Fitness', 'gym, sport, sleep, food, illness'],
    ['Friends', 'friends, roommates, clubs, parties'],
    ['Self & Money', 'mood, habits, hobbies, budget'],
  ], [
    'Aced my chemistry midterm, but I overslept and missed a lecture yesterday.',
    'My mom and I argued on the phone. Went on a great second date. The internship interview went well.',
    'Skipped the gym all week. Game night with my roommates was fun. I blew my budget on takeout.',
  ]),
  P('founder', 'Founder', 'The company, and everything it tends to crowd out.', [
    ['Learning', 'reading, courses, new skills'],
    ['Family', 'parents, siblings, kids, relatives'],
    ['Partner', 'relationship, marriage, dating'],
    ['Startup', 'product, customers, fundraising, team, revenue'],
    ['Health & Sleep', 'exercise, sleep, food, doctor'],
    ['Friends', 'friends, social plans'],
    ['Self & Money', 'mood, habits, personal finances'],
  ], [
    'We closed our first paying customer, huge. An investor turned us down though.',
    'Barely slept this week. I missed my dad\'s birthday dinner. My wife and I talked it out.',
    'Read two chapters of a book on pricing. Caught up with an old friend, which was nice. I am anxious about my savings.',
  ]),
  P('professional', 'Professional', 'A job, a household and a life outside both.', [
    ['Skills & Learning', 'courses, certifications, reading'],
    ['Family', 'parents, siblings, kids, relatives'],
    ['Partner', 'relationship, marriage, dating'],
    ['Job', 'projects, boss, colleagues, promotion'],
    ['Fitness', 'exercise, sleep, food, health'],
    ['Friends', 'friends, social plans'],
    ['Money & Home', 'budget, savings, bills, chores'],
  ], [
    'My boss praised my presentation. I passed the certification exam.',
    'Had a lovely anniversary with my husband. My brother and I argued about money.',
    'Skipped my workout again. Drinks with friends were fun. I finally cleaned the garage.',
  ]),
  P('athlete', 'Athlete', 'Training, competition and the body that carries them.', [
    ['Training', 'sessions, workouts, technique, volume'],
    ['Family', 'parents, siblings, partner, relatives'],
    ['Nutrition', 'meals, diet, weight, hydration'],
    ['Competition', 'races, matches, results, selection'],
    ['Body & Sleep', 'injuries, physio, sleep, illness'],
    ['Friends', 'friends, teammates off the field'],
    ['Mind & Life', 'confidence, nerves, school or job, money'],
  ], [
    'Great tempo run this morning. I won my match on Saturday.',
    'My knee is sore and I slept badly. I ate junk food all weekend.',
    'My dad came to watch, which was great. Had fun with friends at the party. I feel anxious and low on confidence.',
  ]),
  P('creator', 'Creator / Artist', 'Making the work, finding the audience, paying the rent.', [
    ['Content & Audience', 'posts, videos, newsletter, followers'],
    ['Family & Friends', 'family, friends, social plans'],
    ['Partner', 'relationship, marriage, dating'],
    ['Art & Craft', 'making the work: practice, studio, pieces'],
    ['Health', 'body, sleep, exercise, food'],
    ['Income', 'commissions, sales, clients, rent'],
    ['Self', 'mood, habits, rest, inspiration'],
  ], [
    'Finished the painting I was stuck on, finally. My video went viral.',
    'A client paid for the commission. I had a fight with my boyfriend.',
    'Had a lovely dinner with my sister. I was sick all week. I feel unmotivated and lazy.',
  ]),
  P('parent', 'Parent', 'The kids, the house, the job, and a little left for you.', [
    ['Home', 'chores, cleaning, repairs, errands'],
    ['Kids', 'children, school runs, bedtime, parenting'],
    ['Partner', 'relationship, marriage, date nights'],
    ['Work', 'job, career, colleagues'],
    ['Health', 'body, sleep, exercise, food'],
    ['Friends & Family', 'friends, parents, siblings, relatives'],
    ['Me time', 'mood, hobbies, rest, reading'],
  ], [
    'My daughter had a tantrum at bedtime and I lost my temper. I finally did the laundry.',
    'Date night with my husband was great. My manager praised my report.',
    'Went for a run, felt good. My mom helped me with the school run. I read a book for an hour, lovely.',
  ]),
  P('jobseeker', 'Job seeker', 'The search, the skills, and staying steady meanwhile.', [
    ['Skills', 'courses, portfolio pieces, practice, certifications'],
    ['Family', 'parents, siblings, kids, relatives'],
    ['Partner', 'relationship, marriage, dating'],
    ['Job search', 'applications, interviews, recruiters, offers'],
    ['Health', 'body, sleep, exercise, food'],
    ['Friends', 'friends, social plans'],
    ['Money & Mood', 'budget, savings, confidence, routine'],
  ], [
    'I got rejected after the final round interview. I finished the online course, great.',
    'My parents keep criticizing me. My partner was supportive and we had a good evening.',
    'Went to the gym, good session. Coffee with a friend was nice. I am stressed about rent.',
  ]),
  P('recovery', 'Recovery / Health first', 'Getting well comes first; the rest is built around it.', [
    ['Recovery', 'sobriety or healing: clean days, cravings, meetings, treatment'],
    ['Family', 'parents, siblings, kids, relatives'],
    ['Partner', 'relationship, marriage, dating'],
    ['Work & Money', 'job, studies, bills, budget'],
    ['Body', 'sleep, food, movement, medication, doctor'],
    ['Friends', 'friends, social plans'],
    ['Mind', 'mood, therapy, anxiety, stress'],
  ], [
    'Thirty days sober today, proud. I had a strong craving but did not drink.',
    'Slept well and took my medication. My sister forgave me and we made peace. Therapy was hard and I cried.',
    'My boss was happy with my work. My girlfriend and I argued. Had a good time with friends.',
  ]),
];

export const DEFAULT_PRESET = 'general';
export const presetById = id => PRESETS.find(p => p.id === id) || null;
// Fresh copies, so the caller can edit them without touching the preset.
// With a map: keyed by that map's front ids, slot by slot. Without one: keyed by the first scenario's ids, as before.
// `off` entries may be slot numbers or the first scenario's ids.
export const applyPreset = (preset, map = null) => {
  const p = typeof preset === 'string' ? presetById(preset) : preset; if (!p) throw new Error('Unknown preset');
  const ids = map ? map.fronts.map(f => f.id) : FRONT_IDS;
  const slot = x => (typeof x === 'number' ? x : FRONT_IDS.indexOf(x));
  const by = list => Object.fromEntries(ids.map((id, i) => [id, list[i]]).filter(([, v]) => v != null));
  return { labels: by(p.slots), notes: by(p.slotNotes), off: (p.off || []).map(x => ids[slot(x)]).filter(Boolean) };
};
// Which life areas a label belongs to, e.g. "Gym & Health" → ['health', 'fitness'].
export const areasForLabel = label => AREAS.filter(a => a.match.test(String(label || ''))).map(a => a.id);
