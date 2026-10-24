// Story, ages 25-40.
window.STORY_SRC = window.STORY_SRC || [];
window.STORY_SRC.push(`
=== 25 | cherat | The maroon beret | id: ssg
@npc khattak
Khattak: Captain {last}. I've been reading your file. Point 5410. The smugglers' trail. Wadi-e-Noor. Why are you still in a line battalion?
Khattak: The SSG selection course starts in six weeks. Most men fail. Some men die trying. I think you might not fail.
? An invitation from the Special Service Group, the army's commandos.
- "When do I report, sir?" {courage+3 rel.khattak+8} -> go
- "My battalion needs me, sir. My men come first." {leadership+3 honor+2 rel.khattak-3} -> stay
:stay
Khattak(sad): Loyalty to your men. Good. It will get you killed one day, but it is good.
@npc off
@flag declinedSSG
@log Declined SSG selection to stay with the battalion.
@goto ssg_end
:go
@npc off
@title SSG Selection | Cherat
* Week one: you run 36 miles in under eight hours carrying a 25 kilo pack. Week two, you swim in freezing water with your hands tied. Week three, nobody tells you what week three is.
@cut hellweek
@game obstacle {"count":9,"diff":3,"lives":3,"title":"Hell Week","kicker":"SSG Selection","names":["36-mile march","Rope climb","Ten-foot wall","Water obstacle","Night crawl","Log carry","Rappel tower","Monkey bars","Final hill"]}
@iflose ssg_fail
* Day nineteen. Instructors pair candidates for combatives. Yours is a man who has failed selection twice and will not fail a third time.
@game fight {"foe":"Candidate 31","diff":3,"scene":"cherat","foeColor":"#3a3a2a"}
@iflose ssg_fail
@cut halo
@title The Maroon Beret | Special Service Group
@flag ssg
@npc khattak happy
Khattak(happy): Welcome to the brotherhood, Captain. Wear it like it costs something. It does.
@npc off
@log Passed SSG selection. Awarded the maroon beret.
@history Joined the Special Service Group
@fx perf+10 courage+5 fitness+5
@goto ssg_end
:ssg_fail
* On day sixteen you collapse on the final hill. The doctor tells you your ankle is broken in two places. You go back to your battalion on crutches.
@npc khattak
Khattak: Most men fail. Not many fail on a broken ankle. Come back next year, if you want.
@npc off
@fx health-10 happy-6
@log Failed SSG selection with a broken ankle.
:ssg_end

=== 26 | wedding | A question | id: marry | if: rel.ayesha>=35
@scene home
@bg home
* Ayesha has been posted to CMH Peshawar. You find excuses to visit Peshawar more than any infantry captain has ever needed to.
@npc ayesha happy
Ayesha(happy): You drove four hours to bring me a box of mangoes. Captain, I am a doctor. I can recognise symptoms.
? This is the moment.
- Propose. Properly, the old way: ask her family. {rel.ayesha+20 happy+10} -> yes
- Propose right now, under the hospital's one working streetlight. [courage>=40] {rel.ayesha+25 courage+2} -> yes
- Not yet. The army life is too uncertain for a wife. {rel.ayesha-15} -> no
:no
Ayesha(sad): ...Thank you for the mangoes.
@npc off
@flag notMarried
@goto m_end
:yes
@npc ayesha happy
Ayesha(happy): You know I won't quit medicine. And I won't follow you to every posting like a suitcase.
ME(happy): I'd be disappointed if you did.
@npc off
@cut wedding
@outfit sherwani
@hat kulla
@marry Ayesha
@bg wedding
@npc ammi happy
Ammi(happy): Look at him, Zainab! A groom! My little kite-flyer!
@npc abba happy
Abba(happy): Doctor, he is your responsibility now. Return him if he is defective.
@npc ayesha happy
Ayesha(happy): No refunds, Havildar Sahib. I checked the warranty.
@npc off
@fx happy+15 rel.ayesha+10 rel.abba+5 rel.ammi+5
@history Married Dr Ayesha Malik
:m_end

=== 27 | valley | Bus 14 | id: bus
@scene barracks
* The Karakoram Highway. A passenger bus with forty-one people aboard has been stopped by gunmen at a narrow bridge.
@if flag.ssg -> ssg_bus
* Your battalion's quick reaction force is the closest unit. You get there first.
@goto bus_go
:ssg_bus
* SSG is flown in. Your team goes in first.
:bus_go
@npc saeed
Captain Saeed: Sir, six gunmen. They're demanding a phone line. They asked for you by name.
@meet saeed 50
@npc off
Radio: Captain {last}. Yes, I know your name. Point 5410, Wadi-e-Noor... You have had an interesting few years.
Radio: You can call me Shikari. Today is only a little test. The bus is wired to a pressure switch. Let us see how fast you think.
?!9 Shikari's voice is calm, educated, and somehow familiar.
- Keep him talking while your team moves in. {intellect+2 leadership+2} -> talk
- "I don't negotiate. Go, go, go!" {courage+3} -> go_now
:talk
ME(determined): Why the bus, Shikari? These are farmers and students. What do you want?
Radio: What I want, Captain, is for you to understand how the game is played. You will. In time.
* The pause gives Saeed's team the forty seconds they need to get under the bus.
@fx var.busbonus+1
:go_now
@cut bus_siege
* Gunfire on the bridge. Then quiet. The last gunman runs inside the bus shouting.
@game assault {"scene":"valley","enemies":5,"hostages":2,"length":7,"diff":2,"seed":27,"title":"Bus 14","kicker":"Hostage rescue","intro":"Gunmen hold the bridge. Fight your way to the bus."}
* The pressure switch is under the driver's seat. Wires everywhere. The timer has started.
@game defuse {"time":55,"title":"Bus 14","kicker":"Pressure switch"}
@ifwin bus_ok
* The blast throws you off the bus. Twelve passengers are injured. Nobody dies, which the doctors call a miracle.
@fx health-12 happy-8
@goto bus_end
:bus_ok
* The timer stops at 0:07. Forty-one passengers get off the bus. An old woman kisses your hands and will not let go.
@medal Sitara-e-Basalat | #5b1f24 | Bus hostage rescue, Karakoram Highway
@fx perf+6
:bus_end
@log Saved the hostages on Bus 14. Shikari spoke on the radio and knew my name.
@history Bus 14 rescue; Shikari speaks
@if married -> baby
@goto bus_fin
:baby
@bg hospital
@cut birth
@npc ayesha happy
Ayesha(happy): What shall we call him?
? Name your son.
- Hamza -> h1
- Ali -> h2
- Umar -> h3
:h1
@child Hamza m
@goto bus_fin
:h2
@child Ali m
@goto bus_fin
:h3
@child Umar m
:bus_fin
@npc off

=== 28 | office | The Directorate | id: directorate
@npc dg
General Asfandyar: Sit down, Captain. You've never heard of me. That is my job. I run a directorate whose name is on no building.
General Asfandyar: For six years a man calling himself Shikari has been moving weapons, money and people across this country. He knows our patrol timings. He knew your name on that bridge.
General Asfandyar: Which means someone inside is talking to him. I need an officer nobody in Karachi knows. You.
? A deputation to intelligence means leaving uniform for a while.
- Accept. {intellect+3 perf+4 flag:directorate} -> yes
- "I'm a soldier, sir, not a spy." {honor+1} -> no
:no
General Asfandyar: So was I, once. This is not a request, Captain. I only phrase it as one to be polite.
@flag directorate
:yes
@npc off
@outfit suit
@bg karachi
@title Karachi | The Directorate
* A rented flat in Saddar. A new name, Imran Sheikh, importer of auto parts. A suit that does not fit.
@npc nadia
Nadia: So you're the soldier. You walk like a soldier. Stop it. Walk like a man who owes money.
Nadia: The courier is a man called Kamran. Every Thursday he takes an envelope from a tea stall near the port to a flat in Clifton. Follow him. Don't be seen. If he sees you, you're dead and so am I.
@npc off
@bg street
@cut karachi_tail
@game stealth {"diff":2,"scene":"street","title":"Thursday Night","kicker":"Tailing the courier"}
@ifwin tail_ok
* Kamran glances back twice and changes taxis. You lose him. Nadia does not speak to you for a week.
@fx perf-2
@goto intercept
:tail_ok
* Clifton, Block 5, flat 3B. You photograph the man who opens the door.
@fx perf+4 var.karachi+1
:intercept
* Nadia's contact at the telephone exchange brings you a printout: a coded message sent from the flat.
@game cipher {"messages":["THE SHIPMENT ARRIVES AT BERTH NINE","OUR FRIEND IN THE DIRECTORATE SAYS FRIDAY"],"time":90,"hint":"Look for the word THE."}
@ifwin code_ok
* The code defeats you. The Directorate's analysts break it four days later. Four days that matter.
@goto chase
:code_ok
ME(surprised): "Our friend in the Directorate." Nadia... the mole is one of ours.
@fx var.karachi+1
:chase
@npc nadia
Nadia(surprised): Kamran is moving. Now. Tonight. Get in the car!
@npc off
@cut chase
* Kamran's car is on its roof. He crawls out and runs into the alleys. You will catch him. But not tonight.
@log Undercover in Karachi as "Imran Sheikh". Tracked Shikari's courier network.

=== 29 | karachi | The mole | id: mole
@outfit suit
@npc dg
General Asfandyar: Four people in the Directorate knew about Friday. One of them is Shikari's friend. Find out which, quietly. If you accuse the wrong one, you destroy a loyal officer and warn the real one.
@npc off
@game deduce {"caseId":"karachi","title":"The Directorate Mole"}
@ifwin mole_ok
* You accuse the wrong man. A good officer's career is ruined. The real mole, Hasnain, disappears to Dubai two weeks later.
@fx honor-4 happy-8
@flag wrongMole
@goto port
:mole_ok
* Deputy Director Hasnain is arrested at his home at 0300. He is still in his pyjamas. He asks for a lawyer and then, quietly, for his mother.
@fx perf+8 var.karachi+1
:port
@bg karachi
* But Hasnain had already passed on one last thing: the Friday shipment is not weapons. It is a bomb, meant for a fuel tanker at berth nine.
@bg port
@cut port_bomb
@game defuse {"time":48,"title":"Berth Nine","kicker":"Port of Karachi"}
@ifwin port_ok
* The blast destroys the tanker and one berth. Three dock workers die. You were twenty metres away.
@fx health-15 happy-10
@goto roof
:port_ok
* You walk out of the tanker with the detonator in a plastic bag, and sit down on the dock, because your legs will not hold you up.
@fx courage+3
:roof
* And then you see him on the far side of the dock. Kamran. He sees you too, and he runs.
@cut rooftop
@game fight {"foe":"Kamran","diff":3,"scene":"karachi","foeColor":"#1a1a24","knife":true}
@ifwin kamran_ok
* Kamran leaves you bleeding on a rooftop and escapes. But his phone is in your hand. He dropped it in the fight.
@flag scar
@fx health-10
@goto mole_end
:kamran_ok
* Kamran is in handcuffs. The scar on your cheek is new.
@flag scar
@flag kamranCaught
@fx perf+6
:mole_end
@npc nadia
Nadia: You walk less like a soldier now. That's a compliment, by the way.
@npc off
@if v.karachi>=3 -> karachi_medal
@goto maj
:karachi_medal
@medal Tamgha-e-Imtiaz (Military) | #e2ae48 | Directorate operations, Karachi
:maj
@outfit auto
@promote The crescent and star
@log Exposed Shikari's network in Karachi.
@history Karachi operation

=== 30 | quetta | Staff College | id: staff
* The entrance exam for the Command and Staff College, Quetta. Every major in the army sits it. A third get in.
@game quiz {"quizId":"staffexam","title":"Staff College Entrance","kicker":"Examination","per":14}
@ifwin staff_ok
* You miss the cut-off by four marks. You will try again next year. You do, and get in. It costs you a year of seniority.
@fx perf-6
@goto staff_go
:staff_ok
* You come seventh in the army. The letter says Quetta, next September.
@fx perf+5 intellect+3
:staff_go
@npc bilal happy
Bilal(happy): Major {first}! With a scar! You look like a film villain. The kind who dies in the first act.
Bilal: I'm in the Directorate now too. Analysis. Satellite pictures and reports and bad coffee. I hear you caught Hasnain. Asfandyar talks about you as if you were his son.
@set bilalCivil 1
? Bilal looks tired, and there is something careful about him you don't remember.
- "Are you all right, yaar? You look like you haven't slept." {rel.bilal+8} -> askb
- Catch up about old times at Kakul. {rel.bilal+6 happy+4} -> oldb
:askb
Bilal: Me? Fine. Fine. Money troubles, that's all. Lahore houses cost more than a general's salary. It's nothing.
@flag bilalMoney
@goto staff_k
:oldb
Bilal(happy): Remember Fawad? He's a colonel now. He still can't shine boots.
:staff_k
@npc khattak
* At a friend's wedding in Peshawar you meet Major Khattak, now retired, older, thinner. He moves like a man with a grievance.
Khattak: Twenty-six years, {first}. Twenty-six years and they passed me over three times and retired me on a pension that doesn't cover my wife's medicine.
Khattak: Remember what I taught you? A soldier who obeys an unlawful order... Well. Sometimes the whole system is the unlawful order.
? Something in his voice makes the hair on your arms stand up.
- "The system has flaws, sir. We fix them from the inside." {honor+2 rel.khattak-4}
- "I'm sorry, sir. If there's anything I can do..." {rel.khattak+6}
- Change the subject and leave early. {intellect+2 flag:suspectKhattak}
@npc off
@if !married && rel.ayesha>=20 -> ayesha2
@goto staff_end
:ayesha2
@bg hospital
@npc ayesha
Ayesha: Major. You've been injured. Again. I've started a file on you. It's thicker than your service record.
? Life has given you a second chance.
- "Marry me, Doctor. You can keep the file." {rel.ayesha+20 happy+10} -> late_marry
- Smile and say nothing. {rel.ayesha-5} -> staff_end
:late_marry
@cut wedding
@marry Ayesha
@history Married Dr Ayesha Malik
@fx happy+15
:staff_end
@npc off

=== 31 | quetta | War games | id: wargame
* Command and Staff College, Quetta. The students are majors from Pakistan and from a dozen friendly countries. The final exercise is a war game: a divisional defence against a superior enemy.
@bg maproom
@cut wargame
@game quiz {"quizId":"wargame","title":"Exercise Steel Curtain","kicker":"Staff College war game","per":16}
@ifwin wg_ok
* Your division is "destroyed" on day three. The directing staff are polite about it. Polite is worse.
@goto wg_after
:wg_ok
* Your plan holds for all five days. The Commandant uses it as the model answer for the next course.
@fx perf+6 leadership+3
@medal Staff College Prize | #3a5a8a | Best solution, Exercise Steel Curtain
:wg_after
@if married -> family_q
@goto wg_end
:family_q
@npc ayesha
Ayesha: The University of Edinburgh has offered me a two-year cardiology fellowship. It's the best programme in the world. And you're about to be posted to the Line for two years.
? Two careers, one family.
- "Go. We'll manage. {child} can stay with Ammi when I'm in the field." {rel.ayesha+15 happy-3 flag:ayeshaAbroad} -> wg_end
- "Can't it wait two years?" {rel.ayesha-15 flag:ayeshaStayed} -> wait
- "Take {child} with you. I'll visit on every leave." {rel.ayesha+10 rel.kid1-5 flag:ayeshaAbroad} -> wg_end
:wait
Ayesha(sad): It can always wait two years, can't it? Fine. I'll wait. Again.
:wg_end
@npc off
@if married && kids<2 -> daughter
@goto wg_fin
:daughter
@bg hospital
* A second child, a daughter, arrives during a snowstorm in Quetta.
? Name your daughter.
- Mahnoor -> d1
- Fatima -> d2
- Zara -> d3
:d1
@child Mahnoor f
@goto wg_fin
:d2
@child Fatima f
@goto wg_fin
:d3
@child Zara f
:wg_fin

=== 32 | graveyard | Abba | id: abba_death
@bg hospital
* A phone call at 0400. It is Zainab, and she is not able to say the words.
@npc abba sad
Abba(sad): Ah, my officer... come closer. My eyes are tired.
Abba: I used to salute the young lieutenants and think, one day my son... and Allah gave me more than I asked for.
Abba: Promise me one thing. When you are a big man, with stars, and everyone says "yes sir" to everything... find one man who says "no sir". Keep him close.
? Your father's hand is very light.
- "I promise, Abba." {honor+4 rel.abba+10}
- Say nothing. Just hold his hand. {happy-2 rel.abba+10}
@npc off
@cut abba_farewell
@death abba
@cut janaza
@fx happy-20
@bg village
@npc chacha
Chacha Rafiq: Beta, I know it is a bad time. But the land. Your father's twelve acres. You're never here. I'll manage them for you, of course. Just sign here.
? Your father always said Rafiq had a gift for paperwork.
- Read every page before signing anything. {intellect+2} -> read
- Sign. He is family. {money-200 rel.chacha+10} -> sign
- Put the land in Ammi's and Zainab's names instead. {honor+4 rel.ammi+10 rel.zainab+10 rel.chacha-15} -> family
:read
* Page four transfers ownership to Rafiq, not management. You fold the papers and hand them back without a word. He does not meet your eyes at the funeral prayers.
@fx rel.chacha-20
@goto abba_end
:sign
* It takes Zainab two years and a lawyer to find out what you signed.
@flag lostLand
@goto abba_end
:family
* Ammi cries, then slaps your arm for making her cry, then cries again.
:abba_end
@npc off
@log Abba passed away. Buried in the village graveyard with full honours.

=== 33 | camp | Blue helmets | id: un
@outfit combat
@hat beret
@title UN Mission in Kivara | A peacekeeping deployment
@npc nwosu
Colonel Nwosu: Major. Your battalion has the hardest sector: the Bukele camp, eleven thousand displaced people. The militia leader, Dube, wants it. We cannot let him have it.
@npc off
* For four months it is water, food, cholera, and football matches between your soldiers and the camp's children. Your men teach them cricket. The children teach your men to lose.
@npc militia
Commander Dube: Pakistani. Your UN pays you to stand here. I will pay you more to stand somewhere else. Fifty thousand dollars. Who would know?
? He opens a briefcase.
- "Close the briefcase and leave my sector." {honor+6 courage+2} -> refuse
- [intellect>=55] Pretend to consider it, and record the whole conversation for the UN war crimes office. {intellect+4 honor+2 flag:recordedDube} -> record
:refuse
Commander Dube(angry): Then we will meet again. Tonight, maybe.
@goto un_attack
:record
* Two years later that recording helps put Dube on trial in The Hague.
:un_attack
@npc off
@cut un
@game assault {"scene":"camp","enemies":8,"hostages":3,"length":10,"diff":3,"seed":33,"title":"Bukele Camp","kicker":"Night attack","intro":"Militia have broken into the eastern sector. Push them out and bring the families back."}
@ifwin un_ok
* The line bends, but holds. You lose two men. Not one family in the camp is touched.
@fx happy-8
@goto un_end
:un_ok
* By dawn the militia are gone. Not one family in the camp has been touched.
@fx perf+6
:un_end
@medal United Nations Medal | #3b7fd0 | Peacekeeping, Kivara
@log Commanded the Bukele camp sector in the UN mission in Kivara.
@history UN peacekeeping, Kivara

=== 34 | pma | Instructor | id: instructor
* You return to Kakul as an instructor. The gravel square looks smaller than you remember.
* A cadet, eighteen, terrified, stands to attention in front of you. He has been caught covering for his roommate at roll call.
? You remember a night like this one.
- Punish him by the book. {honor+1} -> book
- Make him and his roommate report to the duty officer together, and leave it there. {leadership+4 honor+2} -> lesson
- Let it go with a warning. {rel.bilal+0 happy+2} -> warn
:book
* Fourteen days of restrictions. He'll learn. Or he'll learn to not get caught.
@goto inst_k
:lesson
* "Why didn't you just ask?" you say. He stares at you as if you had read his mind.
@goto inst_k
:warn
* He salutes so hard he nearly knocks his own beret off.
:inst_k
@npc khattak
Khattak: I was in Abbottabad. I thought I would see my old cadet. A major! A scar! And an instructor at my own academy.
Khattak: Tell me. Your old roommate, Bilal. Where is he posted these days? I'd like to send him a card. He was a good boy.
? Bilal's posting in the Directorate is not public information.
- "I'll pass on your regards, sir." {intellect+2 honor+1} -> careful
- Tell him: Bilal is in Islamabad, at the Directorate's analysis wing. {flag:toldKhattak} -> told
:careful
Khattak(happy): Careful. Good. I taught you that too.
@goto inst_end
:told
Khattak: Islamabad. Of course. Thank you, beta.
:inst_end
@npc off
@log Instructor at PMA Kakul.

=== 35 | office | The contract | id: haroon
* You are Colonel Staff at a corps headquarters. A new cantonment hospital is being built. You sign off on the contractor's quality reports.
@npc haroon happy
Seth Haroon(happy): Major Sahib! Such a pleasure. Small thing. The concrete grade in the specifications is excessive. Nobody will notice. And a little appreciation will find its way to your children's school fees. Twenty lakh.
? The hospital will treat soldiers' families. The concrete is substandard.
- Throw him out and report it in writing. {honor+8 courage+3 perf+3 flag:reportedHaroon} -> report
- [money>=0] Take the money. Everyone does. {money+2000 honor-20 flag:tookBribe} -> take
- Refuse the money, but quietly sign the report so you don't make enemies. {honor-4 flag:signedHaroon} -> sign
:report
Seth Haroon(angry): You'll regret this, Major. I play golf with very important people.
* Two important people call you that week. You write down both names in the report as well.
@goto h_end
:take
* The envelope is heavy. It sits in your cupboard, and you can hear it at night.
@goto h_end
:sign
* The hospital is built. Its roof leaks in the first monsoon.
:h_end
@npc off

=== 36 | barracks | Command | id: command
@promote Lieutenant Colonel
@title Command | Your own battalion
* Command of an infantry battalion: nine hundred men, their families, their quarrels, their weddings and their funerals. Every one of them is now your responsibility.
? Your first address to the battalion.
- "I will never ask you to do anything I haven't done, or won't do beside you." {leadership+5 courage+2}
- "Discipline, standards, results. That's all I ask." {perf+4 leadership+2}
- "Your families are my family. My door is open, any hour." {leadership+3 happy+2 honor+2}
@npc gul happy
Sepoy Gul Zaman(happy): Sepoy Gul Zaman, Sir! From Swat! Best shot in Bravo Company! Also best cook. Also best singer, but nobody agrees.
@meet gul 60
? Gul Zaman wants leave for his sister's wedding. Leave is frozen for the inspection.
- Grant it. The inspection can survive without one sepoy. {rel.gul+15 perf-2 flag:gulLeave}
- Leave is frozen. No exceptions. {rel.gul-10 perf+2}
@npc off
@if flag.tookBribe -> inquiry
@goto cmd_end
:inquiry
* A letter from the Judge Advocate General's branch. Seth Haroon has been arrested. In his ledger, there is your name and an amount.
@flag inquiry
@fx honor-10 happy-10
@log A court of inquiry was opened over Seth Haroon's ledger.
:cmd_end

=== 37 | flood | The water | id: flood
@title The Floods | Sindh, monsoon
* The Indus has burst its banks. Nine districts are underwater. Your battalion is sent south with boats, rations and two helicopters on call.
? You have two helicopters and three calls for help at the same time.
- A village of two hundred people on a shrinking embankment. {leadership+2} -> v1
- A hospital whose generators are about to flood, with patients on ventilators. {intellect+2} -> v2
- Split them: one helicopter each, and lead the boats to the third yourself. [leadership>=50] {leadership+4 courage+3} -> v3
:v1
* You save the village. The hospital's generators fail at 0300. Six patients die.
@fx happy-10
@goto flood_c
:v2
* You save the hospital. The embankment collapses at dawn, but boats reach most of the villagers. Most.
@fx happy-6
@goto flood_c
:v3
* It is the longest night of your life. By morning, every one of them is on dry ground.
@fx perf+8
:flood_c
@cut flood_rescue
@npc gul happy
Sepoy Gul Zaman(happy): Sir! There are children on the roof of the school! I'll take the boat!
@npc off
* Gul Zaman brings back four children in two trips. On the third trip the current flips his boat.
* They find him the next morning, two kilometres downstream, still wearing his life jacket. He had given his to a girl of six.
@death gul
@fx happy-15
@bg home
@cut letter
? You must write to his mother. What do you say?
- The truth: how he died, and that he died saving four children. {honor+4} -> l1
- That he died instantly and did not suffer. {happy+2 honor-1} -> l2
:l1
* You write four drafts. The fourth is one paragraph long. It is the hardest thing you have ever written.
@goto f_end
:l2
* It is a kind lie. It is still a lie. You hope it helps.
:f_end
@medal Tamgha-e-Khidmat | #2aa34f | Flood relief, Sindh
@log Flood relief in Sindh. Sepoy Gul Zaman was martyred saving four children.
@history Sepoy Gul Zaman martyred in the floods

=== 38 | home | Two visitors | id: visitors
@npc gulmother
@if !flag.gulLeave -> gul_m
Gul Zaman's mother: My son wrote about you. "My CO is a good man, Amma. He gave me leave for Saima's wedding." That's what he wrote.
:gul_m
Gul Zaman's mother: I came to ask you only one thing. Did he die a coward or a brave man?
? An old woman travelled two days on a bus to ask you this.
- "The bravest man in my battalion." {honor+2 happy+2}
- Take off your own medal for flood service and put it in her hand. {honor+5 happy+4 leadership+2 flag:gaveMedal}
@npc off
@if flag.gaveMedal -> nomedal
@goto bilal_v
:nomedal
* The ribbon stays on your record. The medal itself is now on a shelf in a mud house in Swat, next to a photograph.
:bilal_v
@npc bilal sad
Bilal(sad): I need to tell you something. And then I need you to not hit me until I'm finished.
Bilal: Two years ago I borrowed money. A lot. For the house, for my father's operation. The lender... was not a bank. They've found out where I work.
Bilal: They want one file. The movement schedule for the counter-terrorism units in the north. One file, and the debt is gone. If I don't, they say they'll... my daughter goes to school on the same road every day.
? Your oldest friend is shaking.
- "Give me the lender's name. We go to General Asfandyar. Together. Tonight." {honor+6 rel.bilal+5 flag:bilalReported} -> report
- "Give them a fake file. We'll trace who picks it up." [intellect>=55] {intellect+4 rel.bilal+12 flag:fakeFile} -> fake
- Help him: take the real schedule and give it to him. Once, and never again. {honor-25 rel.bilal+15 flag:gaveFile} -> give
- "You've made your choice. Don't drag me in." {rel.bilal-30 flag:abandonedBilal} -> leave
:report
Bilal(sad): ...They'll court-martial me.
ME(determined): Maybe. But you'll be alive, and so will your daughter. And nobody will own you.
@goto vis_end
:fake
* It takes a week to build a file that looks real and is useless. The lender's man collects it from a mosque in Rawalpindi. The Directorate follows him for a month. He leads them north.
@fx perf+5
@goto vis_end
:give
* You hand him the folder in a car park. He takes it without looking at you. Neither of you speaks.
@goto vis_end
:leave
Bilal(sad): I understand. I'd say the same. Probably.
:vis_end
@npc off

=== 39 | village | Quiet year | id: quiet
* A quiet year, if there is such a thing.
@npc zainab happy
Zainab(happy): Bhai, he's a schoolteacher, like me, and he's kind, and he makes terrible jokes, and Ammi likes him. Will you give me away?
@if flag.paidZainab -> zfees
@goto zw
:zfees
Zainab(happy): And... thank you. For the fees, all those years ago. I'm a headmistress now because of you.
@fx happy+5
:zw
? Your little sister is getting married.
- Dance at the mehndi until your knees give out. {happy+8 rel.zainab+10 fitness+1}
- Make a speech that makes the whole family cry. {leadership+2 rel.zainab+15}
@npc off
@if kids>0 -> kids_t
@goto q_end
:kids_t
@npc son
Son: Abbu, my friends say you are a commando and you have killed a hundred men. Is it true?
? Your son is waiting.
- "No, beta. I've saved more people than I've ever hurt. That's the part that counts." {honor+2 rel.kid1+10}
- "Some things I can't talk about. When you're older." {rel.kid1+3}
- "It's true. Your father is a hero." {rel.kid1+5 honor-2}
:q_end
@npc off

=== 40 | office | The Hunter's face | id: reveal
@promote Colonel
@npc dg
General Asfandyar: Kamran's phone. Hasnain's interrogation. The lender who went after Bilal. Fourteen years of reports. The voice analysts finished last night.
General Asfandyar: Shikari is a former officer. Special Service Group. Passed over three times. Retired bitter. He knows our tactics because he wrote half of them.
@flag shikariKnown
General Asfandyar: Colonel Jamshed Khattak. Your instructor at Kakul, I believe.
@cut reveal
@npc khattak angry
* In the photograph on the General's desk he is older, bearded. But the scar is the same, and so are the eyes.
? Everything in you goes cold.
- "I want this operation, sir." {courage+3 flag:wantsKhattak}
- "I need a moment, sir." {happy-6}
- [flag.toldKhattak] "Sir... I told him where Bilal was posted. Years ago. I didn't know." {honor+5 flag:confessedKhattak}
@npc dg
General Asfandyar: It's yours. But know this. He taught you. Every move you make, he has already seen.
@npc off
@log Shikari unmasked: Colonel (Retd) Jamshed Khattak, my old instructor.
@history Shikari unmasked
`);
