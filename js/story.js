// Characters and story, ages 16-24. Story lines use a small script format parsed by engine.js:
//   === AGE | scene | title | if: cond      starts an event
//   Name(mood): line      ME: line      * narration      :label      @command args
//   ? prompt  followed by  - option text {stat+n flag:x} -> label
window.NPCS = {
  abba: { name: 'Abba', role: 'Father', look: S => ({ outfit: 'elder', color: '#efece2', hat: 'topi', beard: 'white', gray: .95, skin: S.skin, hair: S.hair, age: 58 + (S.age - 16) }) },
  ammi: { name: 'Ammi', role: 'Mother', look: S => ({ outfit: 'female', female: true, hat: 'hijab', hijabC: '#7a3d5a', color: '#a65a7a', skin: S.skin, age: 44 + (S.age - 16), dupatta: '#c98aa6' }) },
  zainab: { name: 'Zainab', role: 'Younger sister', look: S => ({ outfit: 'female', female: true, color: '#2f8a6a', hair: S.hair, skin: S.skin, age: 12 + (S.age - 16), dupatta: S.age > 20 ? '#e8d27a' : null }) },
  sabir: { name: 'Sabir', look: { outfit: 'student', hair: '#2a1c12', skin: '#c38c60', beard: 'stubble', age: 17 } },
  qadeer: { name: 'Sir Qadeer', look: { outfit: 'kurta', color: '#8d939a', waistcoat: '#2e3440', hair: '#2a2a2a', gray: .6, glasses: true, moustache: true, skin: '#c99468', age: 55 } },
  chacha: { name: 'Chacha Rafiq', role: 'Uncle', look: S => ({ outfit: 'kurta', color: '#8a6a4a', waistcoat: '#2a2a2a', hair: S.hair, gray: .5, moustache: true, skin: S.skin, age: 50 + (S.age - 16) }) },
  deputy: { name: 'Brigadier Hashmi', look: { outfit: 'dress', rank: 8, hat: 'gencap', moustache: true, gray: .6, skin: '#d4a07a', age: 52, medals: ['#0b6b3a', '#c9a227', '#b3201e', '#2f6fd6', '#fff'] } },
  nida: { name: 'Major Nida', look: { outfit: 'combat', female: true, rank: 5, hat: 'beret', beretC: '#1f2a1c', hair: '#1a1410', skin: '#e0b48c', age: 34, medals: ['#0b6b3a', '#2f6fd6'] } },
  fawad: { name: 'Senior Fawad', look: { outfit: 'cadet', rank: 1, hat: 'beret', beretC: '#1a1a1a', hair: '#1a1410', skin: '#b98258', age: 21 } },
  bilal: { name: 'Bilal', role: 'Best friend', look: S => {
    const r = S.rank;
    const civ = S.vars.bilalCivil;
    return { outfit: r <= 1 ? 'cadet' : civ ? 'suit' : 'combat', rank: r <= 1 ? 1 : Math.min(r, 9), hat: r <= 1 ? 'beret' : civ ? 'none' : 'beret', beretC: '#1a1a1a', hair: '#24180f', skin: '#c38c60', moustache: S.age >= 25, gray: Math.max(0, (S.age - 42) / 25), age: S.age, glasses: S.age >= 46, medals: r >= 4 ? ['#0b6b3a', '#c9a227'] : [] };
  } },
  khattak: { name: 'Major Khattak', look: S => S.flags.shikariKnown
    ? { outfit: 'black', hat: 'wrap', wrapC: '#2a2420', scar: true, moustache: true, beard: 'full', gray: .7, skin: '#b58058', age: S.age + 16 }
    : { outfit: S.age >= 30 ? 'kurta' : 'ssg', color: '#4a4a42', rank: 5, hat: S.age >= 30 ? 'none' : 'beret', beretC: '#6e1526', scar: true, moustache: true, gray: Math.min(.8, .15 + (S.age - 19) / 30), skin: '#b58058', age: S.age + 16, medals: ['#b3201e', '#0b6b3a', '#c9a227', '#2f6fd6'] } },
  shikari: { name: 'Shikari', look: { outfit: 'black', hat: 'wrap', wrapC: '#1a1714', mask: '#2a2420', skin: '#b58058', scar: true, age: 55 } },
  cmdt: { name: 'The Commandant', look: { outfit: 'dress', rank: 9, hat: 'gencap', moustache: true, gray: .75, skin: '#c99468', age: 56, medals: ['#0b6b3a', '#c9a227', '#b3201e', '#2f6fd6', '#fff', '#5b1f24'] } },
  sherkhan: { name: 'Havildar Sher Khan', look: S => ({ outfit: 'combat', rank: 0, hat: S.vars.scene === 'snowpost' ? 'helmet' : 'beret', beretC: '#1f2a1c', moustache: true, beard: 'stubble', gray: .35, skin: '#b07a52', age: 42, medals: ['#0b6b3a'] }) },
  co: { name: 'Colonel Rizvi', look: { outfit: 'combat', rank: 6, hat: 'beret', beretC: '#1f2a1c', moustache: true, glasses: true, gray: .45, skin: '#d4a07a', age: 44, medals: ['#0b6b3a', '#c9a227', '#2f6fd6'] } },
  ayesha: { name: 'Ayesha', role: 'Friend', look: S => ({ outfit: S.wife ? 'female' : 'doctor', female: true, color: S.wife ? '#7a2d4a' : '#2f5d7c', dupatta: S.wife ? '#e0b45a' : null, hair: '#1d140e', skin: '#e2b48e', age: S.age - 1, glasses: S.age >= 48, gray: Math.max(0, (S.age - 46) / 30) }) },
  elder: { name: 'Malik Gul Bahadur', look: { outfit: 'kurta', color: '#7a6a52', hat: 'wrap', wrapC: '#d8d2c0', beard: 'white', gray: .9, skin: '#b07a52', age: 70 } },
  prisoner: { name: 'The prisoner', look: { outfit: 'kurta', color: '#5c5a52', hat: 'wrap', wrapC: '#3b322a', beard: 'stubble', skin: '#b58058', age: 19 } },
  nadia: { name: 'Nadia', look: { outfit: 'female', female: true, color: '#4a2f66', dupatta: '#b9a0d8', hair: '#140e0a', skin: '#d6a47c', age: 29 } },
  dg: { name: 'General Asfandyar', look: { outfit: 'suit', rank: 10, moustache: true, glasses: true, gray: .8, hair: '#2a2a2a', skin: '#d8ab84', age: 58 } },
  kamran: { name: 'Kamran', look: { outfit: 'suit', beard: 'stubble', hair: '#1a1410', skin: '#c38c60', scar: false, age: 33 } },
  saeed: { name: 'Captain Saeed', look: S => ({ outfit: 'combat', rank: 4, hat: 'beret', beretC: S.flags.ssg ? '#6e1526' : '#1f2a1c', hair: '#1a1410', skin: '#caa07a', age: 28 }) },
  gul: { name: 'Sepoy Gul Zaman', look: { outfit: 'combat', rank: 0, hat: 'helmet', hair: '#1a1410', skin: '#c99468', age: 20 } },
  gulmother: { name: 'Gul Zaman\'s mother', look: { outfit: 'female', female: true, hat: 'hijab', hijabC: '#efece2', color: '#5a5a52', skin: '#b58058', age: 60 } },
  haroon: { name: 'Seth Haroon', look: { outfit: 'kurta', color: '#e8e2d0', waistcoat: '#3a2a1a', moustache: true, glasses: true, gray: .4, skin: '#d8ab84', age: 52 } },
  nwosu: { name: 'Colonel Nwosu', look: { outfit: 'combat', female: true, rank: 7, hat: 'beret', beretC: '#3b7fd0', hair: '#100c0a', skin: '#6a4430', age: 45 } },
  militia: { name: 'Commander Dube', look: { outfit: 'black', hat: 'wrap', wrapC: '#5a4a2a', beard: 'stubble', skin: '#5a3a28', age: 40 } },
  rabia: { name: 'Rabia Qazi', look: { outfit: 'female', female: true, color: '#2d3e5a', hair: '#1a1410', skin: '#e2b48e', glasses: true, age: 36 } },
  malik: { name: 'General Tariq Malik', look: { outfit: 'dress', rank: 10, hat: 'gencap', moustache: true, gray: .65, skin: '#d4a07a', age: 57, medals: ['#0b6b3a', '#c9a227', '#b3201e', '#2f6fd6', '#fff'] } },
  pm: { name: 'The Prime Minister', look: { outfit: 'suit', gray: .7, glasses: true, hair: '#2a2a2a', skin: '#d8ab84', age: 64 } },
  rauf: { name: 'General Rauf', look: { outfit: 'dress', rank: 11, hat: 'gencap', moustache: true, gray: .85, glasses: true, skin: '#c99468', age: 62, medals: ['#0b6b3a', '#c9a227', '#b3201e', '#2f6fd6', '#fff', '#5b1f24', '#e2ae48', '#3b7fd0'] } },
  son: { name: 'Hamza', role: 'Son', look: S => { const k = S.kids.find(x => x.g === 'm'); const a = k ? S.age - k.born : 10; return { outfit: a >= 19 && S.flags.sonArmy ? 'cadet' : a >= 18 ? 'kurta' : 'student', color: '#d8d3c3', rank: 1, hat: a >= 19 && S.flags.sonArmy ? 'beret' : 'none', beretC: '#1a1a1a', hair: S.hair, skin: S.skin, age: a, moustache: a >= 22 }; } },
  daughter: { name: 'Mahnoor', role: 'Daughter', look: S => { const k = S.kids.find(x => x.g === 'f'); const a = k ? S.age - k.born : 8; return { outfit: a >= 22 ? 'doctor' : 'female', female: true, color: '#c0567a', hair: S.hair, skin: S.skin, age: a }; } },
};
// NPC display names that depend on state
window.NPCS.son.name = S => (S.kids.find(k => k.g === 'm') || {}).name || 'Your son';
window.NPCS.daughter.name = S => (S.kids.find(k => k.g === 'f') || {}).name || 'Your daughter';
window.NPCS.khattak.name = S => S.flags.shikariKnown ? 'Jamshed Khattak' : (S.age >= 30 ? 'Colonel Khattak (Retd)' : 'Major Khattak');

window.STORY_SRC = window.STORY_SRC || [];
window.STORY_SRC.push(`
=== 16 | village | The boy from the village | id: intro
@cut prologue
@title Sipahi se Sipahsalar | A life in uniform
* The year is {year}. The fields outside {town} smell of mustard flowers and wood smoke.
* On the wall of your house hangs a photograph: your father, young, in uniform, standing beside a snow-covered bunker.
@npc abba happy
Abba(happy): {first}! Come here, beta. Your mother says you spent the whole morning flying kites again.
ME(happy): Only one kite, Abba. And it beat every kite in the mohalla.
Abba: Twenty-two years I served, from sepoy to havildar. I never once lost a fight I chose. But I lost many I did not choose.
Abba: Your matric exams start tomorrow. Do you know what you want to become?
? Your father is waiting for an answer.
- "An officer. Like the ones you saluted." {courage+2 rel.abba+6} -> dream
- "I don't know yet, Abba." {intellect+1} -> unsure
- "Rich. A businessman in Dubai like Chacha." {happy+2 rel.abba-4} -> rich
:dream
Abba(happy): Ha! An officer! Then remember this: the men will follow your pips for a week. After that, they follow your character.
@goto after1
:unsure
Abba: Good. A man who knows he does not know can still learn. Most men never reach that point.
@goto after1
:rich
Abba(sad): Money is a good servant and a terrible master, beta. But it is your life to choose.
:after1
@npc ammi happy
Ammi(happy): Enough philosophy. The boy needs to eat. Daal and roti, and then books. Not kites.
Zainab(happy): Bhai, if you become an officer, will I get to ride in a jeep?
@npc zainab happy
ME(happy): Only if you finish your homework, Zainab.
@npc off
@bg school
@title The Examination Hall | Matric, Physics Paper II
* The ceiling fan clicks overhead. Forty boys bend over their papers. You are stuck on question four.
@npc sabir
Sabir: Psst. {first}. I have the answers. My cousin got them from the board office. Two hundred rupees and they are yours.
? The invigilator, Sir Qadeer, is looking out of the window.
- Refuse and keep working on question four yourself. {honor+5 intellect+2} -> honest
- Pay Sabir for the answers. {honor-8 perf+4 money-1} -> cheat
- Tell Sir Qadeer that answers are being sold. {honor+6 courage+3} -> report
:honest
* You stare at question four until the numbers make sense. You get it half right. Half right, and all yours.
@goto exam_end
:cheat
* The paper slides under your desk. The answers are good. You feel strangely small for the rest of the day.
@flag cheated
@goto exam_end
:report
@npc qadeer surprised
Sir Qadeer(angry): Sabir! Stand up. Empty your pockets.
* The answer sheet falls out. Sabir is marched out of the hall. As he passes your desk, he whispers that you are dead after school.
@flag reportedSabir
:exam_end
@npc off
@bg village
* After school, behind the old banyan tree.
@if flag.reportedSabir -> fight_sabir
@if flag.cheated -> no_fight
@npc sabir angry
Sabir(angry): You think you are better than us? Mr Honest. Let us see how honest your face looks after this.
@goto fight_choice
:fight_sabir
@npc sabir angry
Sabir(angry): You got me thrown out of the exam! My father will kill me. But first, I will kill you.
:fight_choice
?!7 Sabir and two friends block the path. Your bag is still on your shoulder.
- Stand your ground and fight. {courage+3} -> fight
- Try to talk him down. {leadership+2} -> talk
- Run home. Live to fight another day. {courage-3 happy-2} -> run
:talk
ME(determined): Sabir, three against one proves nothing. If you want to fight, it's just you and me. Or we walk away.
@if leadership>=22 -> talk_ok
Sabir(angry): Talk, talk, talk. Enough!
@goto fight
:talk_ok
* His friends look at each other. One of them steps back. Sabir spits on the ground, then grins despite himself.
Sabir: Fine. Just you and me. Like men.
:fight
@cut school_fight
@game fight {"foe":"Sabir","diff":1,"scene":"village","foeColor":"#e8e4da","pColor":"#efece4","pBeret":null,"foeHp":70}
@ifwin won_sabir
* You end up in the dust with a split lip. Sabir walks away laughing. But he walks away.
@fx happy-3
@goto day_end
:won_sabir
* Sabir is on his back, blinking at the sky. His friends help him up. Nobody laughs.
@fx courage+3 happy+3
@log Fought the school bully Sabir behind the banyan tree, and won.
@goto day_end
:run
* You run until your lungs burn. Shame follows you all the way home.
@goto day_end
:no_fight
* Sabir finds you after school, but only to collect a second payment for "keeping quiet". You pay. That is how it works.
@fx money-1 honor-2
:day_end
@bg home
@npc abba
Abba: Your lip is bleeding. Or your pocket is empty. Something happened today.
? Tell Abba the truth?
- Tell him everything. {honor+3 rel.abba+6} -> truth
- "Nothing, Abba. I fell." {honor-2} -> lie
:truth
Abba: Hmm. Fear is not shameful. Doing nothing with it is. You will be all right, beta.
@goto night
:lie
Abba(sad): Fell. Yes. I also used to fall a lot at your age. Usually onto someone's fist.
:night
* That night, through the window, you watch the lights of a convoy moving along the GT Road toward the north.
@log Wrote the matric exams. {first} is sixteen and already being tested.

=== 17 | village | The fork in the road | id: fork
@cut results_day
* The matric results arrive. You pass with good marks, good enough for pre-engineering FSc at the college in town.
@npc chacha happy
Chacha Rafiq(happy): {first}! My nephew the scholar! Listen. In Dubai my company needs boys who can read and write English. Forty thousand dirhams a year after training. Think of it.
@npc abba
Abba: The boy is seventeen, Rafiq. Let him finish college first.
Chacha Rafiq: The army will pay him peanuts and send him to die on some glacier. Look at you, bhai. Twenty-two years and what? A pension and a bad knee.
? Everyone looks at you.
- "I want to try for the army. I'll register at the selection centre." {courage+2 rel.abba+8 rel.chacha-6 flag:wantsArmy} -> army
- "Let me finish FSc first. Then I'll decide." {intellect+2} -> later
- "Dubai sounds good, Chacha." {happy+3 rel.chacha+8 rel.abba-8} -> dubai
:army
@npc abba happy
Abba(happy): That is my son.
Chacha Rafiq(sad): A family of stubborn mules. Fine, fine. The offer stays open, beta.
@goto study
:later
Abba: A wise answer. Wiser than his uncle's, at least.
@goto study
:dubai
@npc abba sad
Abba(sad): ...If that is what you want.
* That night your father sits alone on the charpai in the courtyard for a long time.
@flag dubaiLean
:study
@npc off
@bg school
* FSc is hard. Physics, chemistry and maths, then evening tuition, then homework by lamplight when the electricity goes.
@npc qadeer
Sir Qadeer: The army selection centre is holding its initial tests next month. I have seen your marks, {first}. And I saw what you did in the exam hall last year.
@if flag.reportedSabir -> qadeer_proud
@goto qadeer_go
:qadeer_proud
Sir Qadeer(happy): It takes a certain kind of boy to stand up in a silent room. The army needs that kind.
:qadeer_go
? Will you sit the initial tests at the Army Selection and Recruitment Centre?
- Yes. Register for the initial tests. {flag:wantsArmy} -> tests
- No. Concentrate on engineering entrance exams. {intellect+3} -> no_tests
:no_tests
@if flag.dubaiLean -> civilian_end
* You put the army out of your mind. For now.
@set armyLater 1
@goto study_end
:civilian_end
? Chacha's ticket to Dubai is booked for next month. This is your last chance to change your mind.
- Take the ticket. A different life. {happy+5} -> gone
- Tear up the ticket. Register for the tests. {courage+4 rel.abba+10 flag:wantsArmy} -> tests
:gone
@end civilian
:tests
@title Initial Tests | Army Selection & Recruitment Centre
* A hall full of nervous boys. A verbal and non-verbal intelligence test, then a medical, then a run.
* The final section is a pattern test. Squares on a grid light up in a sequence, and you must repeat it.
@game memory {"rounds":3,"start":4,"title":"Intelligence Test","kicker":"Initial tests","brief":"Watch the pattern, then tap the squares in the same order."}
@ifwin tests_pass
* You lose the pattern on the last round. The officer marks your sheet. "Borderline. You will go to ISSB, but you will need to do better there."
@set issb -1
@goto study_end
:tests_pass
* The officer looks at your sheet twice. "Good. Very good. You will receive your call letter for ISSB Kohat."
@set issb 1
:study_end
@log Started FSc. The army selection centre has your name.

=== 18 | issb | Inter Services Selection Board | id: issb | if: flag.wantsArmy || v.armyLater
@if v.armyLater -> later_join
@goto issb_go
:later_join
* Your engineering entrance result is a near-miss. Sitting on the charpai, you find your father's old beret in a trunk. You register for the army after all.
@flag wantsArmy
:issb_go
@cut issb
@title Four Days at Kohat | ISSB
@set issbpts 0
@npc nida
Major Nida: Candidate number 112. You are being observed from now until you leave. How you eat, how you speak to the cook, how you lose. Everything.
@npc off
* DAY ONE. Written intelligence tests, a picture story test, and a word association test. Words flash on a screen and you write the first sentence that comes to mind.
? The word on the screen is: ENEMY.
- "An enemy is someone I have not understood yet." {intellect+2 var.issbpts+1}
- "Enemies must be destroyed." {courage+1}
- "My enemy is my own laziness." {honor+1 var.issbpts+1}
? The next word is: FAILURE.
- "Failure teaches what success hides." {var.issbpts+1 intellect+1}
- "I am afraid of failure." {honor+1}
- "Failure is not an option." {courage+1}
* DAY TWO. The Group Testing Officer gives your group of nine a problem. A bridge has collapsed, an injured man is on the other side, and you have two planks, a rope and a drum.
? The group is arguing loudly. Nobody is listening to anyone.
- Raise your voice and take charge of the plan. {leadership+3 var.issbpts+1} -> gto_lead
- Quietly propose a plan to the quietest boy, and build support. {leadership+2 intellect+2 var.issbpts+2} -> gto_smart
- Wait and support whoever wins the argument. {leadership-1} -> gto_follow
:gto_lead
* Some boys follow you, some resent it. The plan half-works. The GTO writes something down without looking up.
@goto gto2
:gto_smart
* By the time the loud boys run out of breath, half the group is already on your plan. It works. The GTO's eyebrows go up a fraction.
@goto gto2
:gto_follow
* The loudest boy's plan fails. You are not blamed. You are not noticed either.
:gto2
* Then the individual obstacles: ten obstacles, ninety seconds, each scored by difficulty.
@game obstacle {"count":7,"diff":1,"title":"Individual Obstacles","kicker":"ISSB Day Two","names":["Double ditch","Zig-zag balance","Burma bridge","Tarzan swing","Tiger leap","Commando walk","Screen jump"]}
@ifwin obs_ok
@goto day3
:obs_ok
@fx var.issbpts+2
:day3
* DAY THREE. The interview with the Deputy President.
@npc deputy
Brigadier Hashmi: Sit. Your father was a havildar. Why should the army make his son an officer, when it could make another man's son instead?
? Answer the Brigadier.
- "Because I grew up seeing what a good officer means to a soldier's family." {var.issbpts+2 honor+2}
- "Because I am better than the other candidates, sir." {courage+1 var.issbpts-1}
- "I don't know if you should, sir. But I will work harder than anyone you choose." {var.issbpts+1 honor+1}
Brigadier Hashmi: Hmm. Tell me the last time you lied.
? He is watching your hands, not your face.
- Tell him the truth, even if it is embarrassing. {honor+3 var.issbpts+2}
- "I don't lie, sir." {honor-2 var.issbpts-1}
@if flag.cheated -> cheat_q
@goto day4
:cheat_q
Brigadier Hashmi: And in your matric exams? Your file has a note from a teacher about answer sheets being sold. Did you buy one?
? The room is very quiet.
- "Yes, sir. I did. I have regretted it ever since." {honor+5 var.issbpts+2 flag:!cheated} -> confess
- "No, sir." {honor-6 var.issbpts-2 flag:liedIssb}
@goto day4
:confess
Brigadier Hashmi: Hm. Most boys lie to me. You did not. Write that down, Nida.
:day4
@npc off
* DAY FOUR. The conference. You stand before the full board in your chest number. Nobody tells you anything. You go home and wait.
@if v.issbpts>=5 -> issb_pass
@if v.issbpts>=3 && v.issb>=1 -> issb_pass
:issb_fail
@bg home
* Three weeks later a thin envelope arrives. NOT RECOMMENDED.
@npc abba sad
Abba(sad): Many good officers failed their first ISSB, beta. The board does not decide who you are. You do.
@flag issbFail
@fx happy-12
@log Not recommended by ISSB on the first attempt.
@history Failed first ISSB
@goto issb_end
:issb_pass
@bg home
* Three weeks later a fat envelope arrives with a green crest on it. RECOMMENDED. Joining instructions: Pakistan Military Academy, Kakul.
@npc ammi happy
Ammi(happy): Ya Allah! My son! Zainab, run and tell the whole street!
@npc abba happy
Abba(happy): ...Your grandfather would have stood up for this. So I will stand up.
@fx happy+12 rel.abba+10 rel.ammi+6
@flag recommended
@log Recommended by ISSB Kohat. Joining Pakistan Military Academy.
@history Recommended by ISSB
:issb_end

=== 19 | issb | Second attempt | id: issb2 | if: flag.issbFail && !flag.recommended
@cut second_chance
* A year of PT, newspapers, and practice tests. Your second call letter arrives. Kohat again.
@npc deputy
Brigadier Hashmi: I remember you, number 112. What did you do with the year?
? Answer.
- "I ran every morning, sir, read every editorial, and learned to lose without sulking." {var.issbpts+2 honor+2}
- "I prepared, sir." {var.issbpts+1}
@game obstacle {"count":7,"diff":1,"title":"Individual Obstacles","kicker":"ISSB, second attempt"}
@ifwin re_ok
@goto re_check
:re_ok
@fx var.issbpts+2
:re_check
@if v.issbpts>=6 || fitness>=45 || intellect>=45 -> re_pass
* NOT RECOMMENDED, again. You are now too old to try a third time.
@end civilian2
:re_pass
* RECOMMENDED. Pakistan Military Academy, Kakul.
@flag recommended
@npc abba happy
Abba(happy): You see? The board did not decide. You did.
@log Recommended by ISSB on the second attempt.
@history Recommended by ISSB (second attempt)

=== 19 | pma | The first term | id: pma1 | if: flag.recommended
@cut train
@cut pma
@setrank 1
@log Joined the Pakistan Military Academy, Kakul, as a Gentleman Cadet.
@history Joined PMA Kakul
* The first week is a blur of shouting, running, polishing and more running. You sleep four hours a night and dream about sleeping.
@npc fawad angry
Senior Fawad(angry): Junior! Your boots are a disgrace. My grandmother could shine boots better than this, and she is blind.
Senior Fawad: Forty front rolls across the square. Now. And take your roommate with you.
@npc bilal surprised
Bilal(happy): I am Bilal. From Lahore. I think we are going to be friends, because I think we are going to die together.
@meet bilal 55
* You roll forty times across the gravel. Bilal rolls beside you, laughing until Fawad screams at him to stop smiling.
@npc off
? That night, Bilal shows you a smuggled packet of samosas from the cookhouse.
- Eat the samosas with him. Rules are made to be bent. {happy+3 rel.bilal+8 honor-1}
- Refuse. If you're caught, you'll both be punished. {honor+1 rel.bilal+2}
@bg pma
@title Tactics Hall | Major Jamshed Khattak, SSG
@npc khattak
Khattak: My name is Major Jamshed Khattak. I have served eleven years in the Special Service Group. I have killed men, and I have kept other men alive. Today I will teach you which is harder.
Khattak: A soldier who obeys an unlawful order is not a soldier. He is a weapon in someone else's hand. Remember that, cadets. Remember it when it is inconvenient.
@meet khattak 45
? Major Khattak points at you. "You. What do you do when your orders are wrong?"
- "Question them through the proper channel, sir, and refuse anything unlawful." {honor+3 rel.khattak+6 intellect+1}
- "Obey, sir. The officer above me knows more." {rel.khattak-4}
- "Do what is right, sir, whatever the orders say." {courage+2 rel.khattak+8}
Khattak(happy): Hm. Interesting. We will see if you still believe that in twenty years.
@npc off
* Term boxing finals. Your name is drawn against the man who has made your life hell: Senior Fawad.
@bg ring
@cut boxing
@game fight {"foe":"Senior Fawad","diff":2,"scene":"ring","foeColor":"#a02020","pColor":"#1f3fa0","pBeret":null,"foeHp":90}
@ifwin beat_fawad
* Fawad wins on points. Afterwards, to your surprise, he shakes your hand. "Not bad, junior. Not bad."
@fx rel.bilal+3
@goto pma_secret
:beat_fawad
* The whole hall roars. Fawad gets up slowly, touches gloves, and says loud enough for everyone to hear: "This junior has a spine."
@fx perf+5 courage+2
@log Beat Senior Fawad in the term boxing finals.
:pma_secret
@bg barracks
* 0200 hours. You wake up to see Bilal climbing out of the window.
@npc bilal sad
Bilal(sad): My mother is in hospital in Abbottabad. They won't give me leave until Sunday. I just need two hours. Please, yaar. Don't say anything.
? The Honour Code says a cadet does not lie, cheat or steal, nor tolerate those who do.
- Cover for him at the morning roll call. {rel.bilal+15 honor-4 flag:coveredBilal} -> cover
- Tell him to go to the duty officer and ask properly. Walk with him. {honor+4 leadership+3 rel.bilal+5} -> proper
- Report him to the duty officer. {honor+2 rel.bilal-25 flag:reportedBilal} -> report_b
:cover
* Bilal makes it back at 0545. At roll call you answer "Present" for an empty bed. Nobody notices. Your stomach notices.
@goto pma_end
:proper
* The duty officer is a tired captain who listens, then sighs, and signs a two-hour pass. "Why didn't you just ask?" Bilal hugs you in the corridor.
@goto pma_end
:report_b
* Bilal gets fourteen days of restrictions. He does not speak to you for a month. When he finally does, it is only to say: "You were right. I hate that you were right."
:pma_end
@npc off
@log Survived the first year at PMA Kakul.

=== 20 | pma | Passing out | id: pma2 | if: rank==1
* Final term. You are a senior now. Juniors roll across the gravel while you try not to smile.
* Night exercise: infiltrate the "enemy" camp held by Major Khattak's instructors and steal their flag.
@bg forest_night
@cut night_nav
@game stealth {"diff":1,"scene":"forest_night","title":"Night Exercise","kicker":"Final term"}
@ifwin ex_ok
@npc khattak
Khattak: Caught by a cook with a torch. Your stealth needs work, cadet. Your attitude does not. Try again in real life.
@goto shoot_comp
:ex_ok
@npc khattak happy
Khattak(happy): The flag. In my own tent. While I was in it. Get out before I promote you.
@fx rel.khattak+8 perf+4
:shoot_comp
@npc off
@title Inter-Company Shooting | The Quaid-e-Azam Trophy
@game shoot {"diff":2,"need":13,"total":18,"title":"Shooting Competition","kicker":"PMA final term"}
@ifwin shoot_win
@goto parents
:shoot_win
* Your company wins the trophy. Your name goes on a wooden board in the mess that will outlive you.
@fx perf+5
:parents
@npc abba happy
Abba(happy): I saw the board in the corridor. I touched your name. Don't tell your mother. She will think I'm getting soft.
@npc ammi happy
Ammi(happy): He cried, {first}. He cried in the car.
@npc off
? Choose your arm of service and regiment.
- Infantry: the Frontier Force Regiment ("Piffers"). {courage+2} -> ff
- Infantry: the Baloch Regiment. {leadership+2} -> baloch
- Infantry: the Punjab Regiment, the oldest of them all. {honor+2} -> punjab
:ff
@regiment Frontier Force Regiment
@goto parade
:baloch
@regiment Baloch Regiment
@goto parade
:punjab
@regiment Punjab Regiment
:parade
@cut passing_out
@if perf>=62 && honor>=60 -> sword
@goto commission
:sword
@npc cmdt happy
The Commandant(happy): The Sword of Honour, awarded to the best all-round Gentleman Cadet of the course: {name}!
@medal Sword of Honour | #c9a227 | Best all-round cadet of the course
@flag swordOfHonour
@npc off
:commission
@setrank 2
@set commAge 20
@log Commissioned into the {regiment} as a Second Lieutenant.
@history Commissioned, {regiment}
@npc bilal happy
Bilal(happy): Second Lieutenant {first}. Second Lieutenant Bilal. God help Pakistan.
@if flag.reportedBilal -> bilal_forgive
@goto pma_done
:bilal_forgive
Bilal: About that night in first term... I'd have reported me too. Probably. Friends?
? He holds out his hand.
- Take it. "Friends. Always." {rel.bilal+20}
- "Friends. But I'd do it again." {rel.bilal+10 honor+2}
:pma_done
@npc off

=== 21 | snowpost | Point 5410 | id: post1 | if: rank>=2
@scene snowpost
@title Point 5410 | Northern Areas, 16,000 feet
@cut sherkhan
* Your first posting: a post so high that water boils at 80 degrees, and so cold that your rifle bolt freezes if you leave it outside.
@npc sherkhan
Havildar Sher Khan: Salaam, Sahib. Havildar Sher Khan. Nineteen years in the battalion. Three young lieutenants before you. Two were good. One cried a lot.
? How do you greet the most experienced soldier on the post?
- "Havildar Sahib, I know the manuals. You know the mountain. Teach me." {leadership+4 rel.sherkhan+12}
- "I'm in command now, Havildar. I'll tell you what I need." {leadership-2 rel.sherkhan-6}
- "Which of the three did you like best?" {happy+2 rel.sherkhan+6}
@meet sherkhan 55
Havildar Sher Khan(happy): Hm. The mountain does not care about pips, Sahib. Neither do I. But I care about men who listen.
@npc off
@cut avalanche
* The avalanche buries the forward bunker. When the snow settles, you count. Eleven men. One is missing: Sepoy Rehmat, nineteen years old.
@npc sherkhan
Havildar Sher Khan: Sahib, protocol says wait for the rescue team. Another slide could come any minute. If we dig and it comes, we lose all of us.
?!10 Every second counts under the snow.
- Lead the digging yourself. Now. {courage+5 leadership+3 health-8} -> dig
- Follow protocol and wait for the rescue team. {honor-1 perf+2} -> wait
- [leadership>=26] Rope everyone together, post a slide watch, and dig in shifts. {leadership+5 intellect+2 courage+2} -> smart
:dig
* You dig with your hands until they stop feeling like hands. At minute twenty-two, someone screams: a glove.
* Rehmat is blue but breathing. You carry him on your back down to the medical post.
@flag savedRehmat
@fx rel.sherkhan+10 perf+6
@goto post_end
:smart
* Your plan works. A second slide does come, but your watch shouts, and everyone is clear. At minute eighteen you find Rehmat, alive.
@flag savedRehmat
@fx rel.sherkhan+15 perf+8
@log Organised the avalanche rescue at Point 5410. Sepoy Rehmat survived.
@goto post_end
:wait
* The rescue team arrives after two hours. They dig Rehmat out. He is alive, barely, and loses three toes.
@fx happy-6
:post_end
@npc off
@if flag.savedRehmat -> commend
@goto lt
:commend
@medal Commander's Commendation | #8a7b52 | Avalanche rescue at Point 5410
:lt
@promote First pip on the shoulder

=== 22 | mountain_night | The smugglers' trail | id: ambush
@scene barracks
* Intelligence says weapons are moving over an old smugglers' trail, with men paid well and armed better.
@npc sherkhan
Havildar Sher Khan: Night patrol, Sahib. Ten men. If they come, they come at 0300 when the moon goes down.
@npc off
@cut ambush
@title Contact! | 0312 hours
* In the confusion one of the smugglers charges your position with a knife.
@game fight {"foe":"Smuggler","diff":2,"scene":"mountain_night","foeColor":"#2a1a10","knife":true,"scarf":true}
@ifwin amb_win
* He gets past you and is stopped by Sher Khan's rifle butt. "Sahib, are you hurt?" Your arm is bleeding. You'll live.
@fx health-10
@goto sniper
:amb_win
* You disarm him and pin him down. Bilal would never believe it.
:sniper
* A sniper on the ridge pins down your section. Sher Khan is hit in the leg. He needs to be evacuated and nobody can move.
@npc sherkhan sad
Havildar Sher Khan(sad): Sahib... the ridge. Third rock from the left. He reloads every five shots.
@npc off
@cut sniper_duel
@game sniper {"diff":2,"scene":"mountain_night","title":"The Ridge","kicker":"Counter-sniper"}
@ifwin sniper_ok
* Your shots miss. It takes an hour and a gunship to clear the ridge. Sher Khan loses a lot of blood, but he is a hard man to kill.
@goto prisoner
:sniper_ok
* The rifle on the ridge goes silent. You carry Sher Khan down yourself.
@fx rel.sherkhan+15
@medal Imtiazi Sanad | #b3201e | Gallantry under fire on the smugglers' trail
:prisoner
* At dawn your men bring in a wounded smuggler. He is barely twenty.
@npc prisoner sad
The prisoner(sad): They paid us ten thousand each. A man called Shikari. The Hunter. He knows your patrol timings, Sahib. He knows everything.
? Your men want to rough him up for what happened to Sher Khan.
- Forbid it. He gets medical care and goes to the intelligence people. {honor+4 leadership+2} -> humane
- Look away for five minutes. {honor-8 courage+1 flag:lookedAway} -> harsh
:humane
* The intelligence officer who collects him writes down one word in his notebook and underlines it twice: SHIKARI.
@goto amb_end
:harsh
* The boy tells you nothing more, because he knows nothing more. You never forget the sound.
@fx happy-6
:amb_end
@npc off
@log Ambushed on the smugglers' trail. First heard the name "Shikari".
@history First heard the name Shikari

=== 23 | hospital | Leave | id: leave1
@scene village
* Your first long leave. Then a phone call from Zainab: Abba collapsed in the fields. They have taken him to CMH Rawalpindi.
@cut cmh_rush
@npc abba sad
Abba(sad): Don't make that face, beta. A heart that carried sixty kilo packs up mountains is allowed to complain a little.
@npc ayesha
Ayesha: Captain Dr Ayesha Malik. I'm his cardiologist. Your father has been telling the entire ward that you single-handedly defeated an army of smugglers.
@meet ayesha 30
? She is trying very hard not to smile.
- "Only half an army. The other half ran away." {rel.ayesha+10 happy+3}
- "How is he really, Doctor?" {rel.ayesha+6 honor+1}
- "He exaggerates. It was a patrol." {rel.ayesha+4}
Ayesha: A mild infarction. He needs a stent, fewer parathas and more walking. And less smoking, which I gather he has been doing secretly since 1998.
@npc abba happy
Abba(happy): Traitor! Doctor, my son is a trained killer. Be careful.
@npc ayesha happy
Ayesha(happy): I have met trained killers, Havildar Sahib. They usually faint when they see the needle.
@npc off
* Over the next week you visit every day. You tell yourself it is for your father.
? Ayesha is finishing a night shift as you arrive.
- Bring her a cup of chai from the canteen. {rel.ayesha+10}
- Ask her to dinner when your father is discharged. [courage>=34] {rel.ayesha+15 courage+1 flag:askedAyesha}
- Keep it professional. You'll be back on the mountain in a month. {rel.ayesha+2}
@npc zainab
Zainab: Bhai. The college fees for my BSc are due. Abba's hospital bills ate everything. I can stop studying. It's fine. Really.
? Your sister wants to be a teacher. Your savings are thin.
- [money>=300] Pay her fees in full. {money-300 rel.zainab+20 honor+2 happy+3 flag:paidZainab}
- Pay what you can and promise the rest. {money-120 rel.zainab+10 flag:paidZainab}
- "Maybe next year, Zainab." {rel.zainab-12}
@npc off
@log Abba recovered from a heart attack at CMH Rawalpindi. Met Dr Ayesha Malik.

=== 24 | valley | Operation Subh-e-Noor | id: valley
@scene barracks
@npc co
Colonel Rizvi: Gentlemen. Wadi-e-Noor. Militants have taken over three villages and are taxing the farmers at gunpoint. Their commander is in a compound here. Your company goes in at 0445.
Colonel Rizvi: One more thing. There are families inside. Positive identification before every shot. I will not have this battalion remembered for the wrong reasons.
@npc off
@cut raid
@title Operation Subh-e-Noor | Wadi-e-Noor
* Inside the outer wall. Guards patrol the courtyard with torches. The commander is in the far building.
@game assault {"scene":"valley","enemies":7,"hostages":2,"length":9,"diff":2,"seed":24,"title":"The Courtyard","kicker":"Operation Subh-e-Noor","intro":"Clear the compound courtyard. Two families are held inside the walls."}
@ifwin inside
* A guard shouts. A firefight erupts in the courtyard. You win it, but the commander escapes out of the back.
@fx perf-2
@flag commanderEscaped
@goto room
:inside
* You reach the far building unseen.
:room
* You kick open a door. Three militants with rifles, and behind them a woman and two children pressed against the wall. One militant drags a child in front of him.
?!8 Your finger is on the trigger. Your men are behind you.
- [courage>=40] Take the precise shot past the child. {courage+3} -> shot
- Hold fire. Talk to him. {honor+3 leadership+3} -> talkm
- Fire a flashbang and rush them. {courage+2} -> flash
:shot
@game sniper {"diff":3,"scene":"valley","title":"One Shot","kicker":"Hostage","brief":"You have one clean line of sight. Steady your breath. Hit only the armed man."}
@ifwin shot_ok
* Your round goes wide. The room explodes into chaos. When it is over, the child is alive. One of your men is not.
@fx happy-10 honor-2
@flag lostMan
@goto room_end
:shot_ok
* One shot. The child runs to her mother. The other two militants drop their weapons.
@fx perf+8
@goto room_end
:talkm
ME(determined): Look at me, not at them. You're surrounded. Nobody else has to die today. Put the child down.
@if leadership>=34 || honor>=62 -> talk_win
* He hesitates too long. His friend fires. Your men fire back. The child is unhurt, by a miracle.
@goto room_end
:talk_win
* For a long moment nothing happens. Then he lowers the child and the rifle together. He is crying. He is seventeen.
@fx leadership+3 perf+6
@flag talkedDown
@goto room_end
:flash
* The flashbang turns the room white. When your vision clears, the militants are down and the family is screaming but alive.
@fx perf+4
:room_end
@bg valley
@npc elder
Malik Gul Bahadur: Six months those men took our wheat and our sons. And now you come, and tomorrow you go, and next month they come back. Tell me why I should help you, young officer.
? The village elder is waiting.
- "We'll stay until your own police can hold the valley. I give you my word." {honor+2 leadership+3 flag:promisedValley}
- "Because the alternative is them." {intellect+1}
- [rel.sherkhan>=60] Let Sher Khan, a Pashtun from the next valley, speak to him in his own words. {leadership+4 flag:sherKhanSpoke}
Malik Gul Bahadur: Hmm. We will see. In this valley, a promise is remembered for three generations. So is a lie.
@npc off
@if flag.talkedDown || flag.sherKhanSpoke -> medal_v
@goto capt
:medal_v
@medal Tamgha-e-Basalat | #2f6fd6 | Operation Subh-e-Noor, Wadi-e-Noor
:capt
@promote Third pip
@log Led a company in Operation Subh-e-Noor in Wadi-e-Noor.
@history Operation Subh-e-Noor
`);
