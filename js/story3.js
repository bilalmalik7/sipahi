// Story, ages 41-61, and endings.
window.STORY_SRC = window.STORY_SRC || [];
window.STORY_SRC.push(`
=== 41 | office | Proof of life | id: kidnap
* 0400 hours. Your phone. Ayesha wakes, sees your face, and does not ask.
@npc dg
General Asfandyar: Bilal didn't come home last night. His car was found at the Murree turn-off with the engine running. Then this arrived.
@npc off
@cut kidnap
@cut bilal_video
@if flag.gaveFile -> k_gave
@if flag.fakeFile -> k_fake
@if flag.bilalReported -> k_rep
@goto k_demand
:k_gave
@npc dg
General Asfandyar(angry): And there is something else. The movement schedule for our northern units was used in an ambush in March. Nine soldiers. The leak came from the analysis wing. From Bilal's desk.
? He is looking straight at you.
- Tell him the truth: you gave Bilal the file. {honor+10 flag:confessedFile} -> conf
- Say nothing. {honor-6} -> k_demand
:conf
General Asfandyar(sad): ...I will deal with you afterwards. Today, we bring him home. Then you will face a board, and you will tell them exactly what you just told me.
@flag inquiry
@goto k_demand
:k_fake
@npc dg
General Asfandyar: Your fake file worked too well. We traced the lender's men to Khattak's network and arrested eleven of them. This is his reply.
@goto k_demand
:k_rep
@npc dg
General Asfandyar: Bilal came to me with you, two years ago. He was disciplined, not discharged. Khattak never forgave him for that, it seems. Or you.
:k_demand
@npc dg
General Asfandyar: His demands: release Kamran and Hasnain, and you resign your commission on national television, admitting the army is corrupt. He has given us seventy-two hours.
General Asfandyar: The Prime Minister wants to negotiate. I am ordered to tell you to stand down. I am telling you that.
? The General's face gives you nothing.
- Obey. Help the negotiators and trust the system. {honor+2 perf+3} -> obey
- Ask permission for a rescue, and plan it whether or not you get it. {courage+4 flag:rogue} -> plan
- [leadership>=60] Show him a rescue plan so good that he can't refuse it. {leadership+4 perf+5 flag:authorised} -> sanctioned
- Offer yourself in exchange for Bilal. {courage+6 honor+4 flag:offeredSelf} -> self
:obey
* The negotiations go nowhere. On the second day, Khattak sends a second video: Bilal's left hand, bandaged. The Prime Minister authorises a rescue that evening. You will lead it.
@flag authorised
@goto k_end
:plan
General Asfandyar: I didn't hear any of that, {rank}. I also didn't see you take your old team with you.
@goto k_end
:sanctioned
General Asfandyar: ...Approved. God help us both.
@goto k_end
:self
General Asfandyar(angry): Absolutely not. He doesn't want you dead, he wants you humiliated, and then dead. We go in and get him.
@flag authorised
:k_end
@npc off
@log Bilal was kidnapped by Shikari.
@history Bilal kidnapped by Shikari

=== 42 | mountain_night | The ledge | id: rescue
@outfit ssg
@vest on
@hat helmet
@title Operation Yaar | Upper Neelum, 0200 hours
@set rescue 0
* The phone that sent the video pinged a tower in the upper Neelum valley. Satellite images show a compound on a ledge at 3,000 metres.
* The approach is a goat track. You studied the route on the map for six hours. Now it is dark and the map is in your head.
@game memory {"rounds":3,"start":5,"title":"The Goat Track","kicker":"Night approach","brief":"Recall the route through the minefield: tap the safe squares in order."}
@ifwin r1
@fx health-6
* A mine detonates behind you. Nobody is killed, but now they know someone is coming.
@goto r2
:r1
@fx var.rescue+1
:r2
@cut nvg
@game sniper {"diff":3,"scene":"mountain_night","title":"The Last Sentry","kicker":"Suppressed","brief":"One sentry is still on the roof with a radio. Take him before he calls it in. Don't hit Bilal, who is being walked across the yard."}
@ifwin r3
* The sentry gets one word out over the radio before he falls.
@goto r4
:r3
@fx var.rescue+1
:r4
* Inside, a narrow corridor and a man with a knife who used to be a commando, like you. Khattak's lieutenant.
@game assault {"scene":"mountain_night","enemies":8,"hostages":1,"length":11,"diff":3,"seed":42,"boss":true,"bossName":"Khattak's lieutenant","title":"The Compound","kicker":"Operation Yaar","intro":"Bilal is held in the last building. Get him out alive."}
@ifwin r5
* He nearly kills you. Saeed's rifle ends it.
@fx health-14
@goto r6
:r5
@fx var.rescue+1
:r6
@if v.rescue>=2 -> saved
:lost
* The last room. Bilal is on the floor. He was shot when the alarm went up. He is alive, just. He grips your sleeve all the way to the helicopter.
@npc bilal sad
Bilal(sad): You came. You idiot. You actually came.
@npc off
* He loses the hand. He keeps his life.
@flag bilalHurt
@goto r_end
:saved
* The last room. Bilal looks up from the chair, squinting into your torch.
@npc bilal happy
Bilal(happy): Took your time, yaar. I was starting to think you'd become a general and forgotten me.
@npc off
@medal Sitara-e-Jurat | #b3201e | Rescue of a hostage officer, Upper Neelum
:r_end
* On the table in the last room there is a note in handwriting you have known since you were nineteen.
* "Well done, cadet. Next time, we meet in person. J.K."
@log Led the rescue of Bilal from Shikari's compound.
@history Rescued Bilal in the Upper Neelum

=== 43 | office | The board of inquiry | id: inquiry43
@cut board
@if flag.rogue && !flag.authorised -> rogue
@goto inq_haroon
:rogue
@npc dg
General Asfandyar: You conducted an unauthorised operation with army assets. The fact that it worked does not make it legal. The Chief wants to know what to do with you.
? A board of inquiry is convened.
- "I accept full responsibility, sir. My team was following my orders." {honor+6 leadership+3} -> rog_ok
- "I saved an officer's life. I'd do it again." {courage+2 perf-4} -> rog_ok
:rog_ok
@if honor>=60 -> rog_clear
* The board recommends a severe reprimand. It will sit on your file forever.
@fx perf-10
@goto inq_haroon
:rog_clear
* The board finds you acted in good faith in an emergency. "Advised to remember the chain of command." In private, three members of the board shake your hand.
:inq_haroon
@if flag.tookBribe && flag.inquiry -> haroon_inq
@if flag.confessedFile -> file_inq
@goto inq_end
:haroon_inq
@npc off
* The board turns to Seth Haroon's ledger. Your name. Twenty lakh rupees.
? There is no story that explains this away.
- Admit it and return the money with interest. {honor+8 money-2400} -> h_admit
- Deny everything. {honor-10} -> h_deny
:h_admit
@if honor>=40 -> h_demote
@end dismissed
:h_demote
@demote Accepted illegal gratification, admitted and repaid
@unflag inquiry
@goto inq_end
:h_deny
@if honor<35 -> h_cm
* There is not quite enough evidence to convict you. Everyone knows anyway.
@unflag inquiry
@fx perf-15
@goto inq_end
:h_cm
@end dismissed
:file_inq
* The board turns to the file you gave Bilal. You tell them everything, exactly as you promised the General.
@if honor>=55 -> f_demote
@end dismissed
:f_demote
@demote Unauthorised disclosure of classified information
@unflag inquiry
:inq_end
@npc off
@bg home
@if !married -> inq_fin
@npc ayesha angry
Ayesha(angry): You went up a mountain in the dark, after a man who wants you dead, and you didn't tell me. I found out from the television.
? She is shaking with anger, and fear.
- "You're right. No more secrets that big, ever." {rel.ayesha+12 honor+2}
- "It's the job, Ayesha." {rel.ayesha-12}
:inq_fin
@npc off
@unflag inquiry

=== 44 | valley | Return to the valley | id: brigade
@promote Brigadier
@title Brigade Command | Wadi-e-Noor, twenty years later
@cut valley_school
* Your brigade's area includes a valley you know. The school you used as a firebase is a school again, with a cricket pitch.
@npc elder
@if flag.promisedValley -> promised
Malik Gul Bahadur: The young captain! Older now. You did not stay, last time. But the police did, in the end.
@goto v_cont
:promised
Malik Gul Bahadur(happy): The officer who made a promise. You kept it, you know. Your battalion stayed eight months, until the police could hold. Three generations, I told you. My grandsons know your name.
@fx happy+8 honor+3
:v_cont
Malik Gul Bahadur: Now there is a new problem. Young men with nothing to do, and men with money who come at night and offer them something to do.
? How will your brigade answer?
- Raids and checkpoints. Make the valley too dangerous for recruiters. {courage+2 perf+4}
- A vocational centre and a cricket league, run by your soldiers. {leadership+4 honor+3 perf+2}
- Both, in that order: security first, then jobs. [intellect>=60] {intellect+2 leadership+3 perf+5}
@npc off

=== 45 | rubble | The earthquake | id: quake
@cut earthquake
@title 0850 hours | The northern areas
* A 7.6 magnitude earthquake. Thousands dead. Roads gone. Your brigade is the only organised force in three districts.
@game quiz {"quizId":"quake","title":"The First 72 Hours","kicker":"Disaster command","per":14}
@ifwin q_ok
* Mistakes are made in the first day, as they always are. You will carry some of those faces with you.
@fx happy-8
@goto q_end
:q_ok
* In seventy-two hours your brigade clears two roads, sets up four field hospitals and evacuates nine thousand people.
@fx perf+8 leadership+3
:q_end
@cut quake_rescue
@log Commanded earthquake relief in the northern areas.

=== 46 | home | An envelope | id: letter
@cut envelope
* An envelope with no stamp, delivered by hand to your quarters. Inside, one page in a familiar slanted handwriting.
* "{rank}. You and I are the same. We both believed the oath. The difference is that I finished reading it, and you are still on the first page. One day the system will pass you over too, and then you will remember me. J.K."
? You read it three times.
- Hand it to the Directorate's forensic team immediately. {honor+2 perf+3 flag:letterHandedIn}
- Keep it in your desk drawer. {courage+1}
- Burn it. {happy+2}
@npc rabia
Rabia Qazi: Brigadier? Rabia Qazi, from Dawn newspaper. I'm writing about the Neelum rescue. Off the record: is it true you went without orders?
? A journalist with a notebook and a good memory.
- "No comment, Ms Qazi. Write about the soldiers who went with me." {honor+2 leadership+2 flag:rabiaRespect}
- Tell her the whole story, off the record. {courage+2 perf-4 flag:rabiaStory}
- Have her escorted off the base. {perf+1 flag:rabiaHostile}
@npc off

=== 47 | village | The next generation | id: nextgen | if: kids>0
@cut son_photo
@npc son
Son: Abbu. I've decided. I'm sitting for ISSB next year. I want to go to Kakul.
? Your son, at the age you were when you first saw the photograph on the wall.
- "Your grandfather would be proud. So am I." {rel.kid1+15 happy+5 flag:sonArmy}
- "Be an engineer. One soldier in the family is enough." {rel.kid1-15 flag:sonCivil}
- "It's your life. Choose it for your reasons, not mine." {rel.kid1+10 honor+2 flag:sonArmy}
@npc off
@if kids>1 -> dau
@goto ng_end
:dau
@npc daughter
Daughter: And I've decided too, since we're deciding things. Medicine. Like Ammi. Then I'll be the one patching you up.
@fx happy+6 rel.kid2+10
:ng_end
@npc off

=== 48 | office | Two stars | id: majgen
@promote Major General
@title General Officer Commanding | Lahore
@cut flag_car
* A division of fifteen thousand men. A flag on your car. A driver who calls you "General Sahib" and has opinions about cricket.
@npc bilal
@if flag.bilalHurt -> b_hurt
Bilal: A general! I told you. You'd become a general and forget me.
@goto b_cont
:b_hurt
Bilal: A general. With all his hands, too. Show-off.
:b_cont
Bilal: I'm out, you know. Retired. I teach maths at a girls' school in Lahore now. It's the best job I've ever had.
@if flag.gaveFile -> b_guilt
@goto b_end
:b_guilt
Bilal(sad): We never talked about that car park. About the file. I've thought about it every day for ten years.
? Your oldest friend.
- "Neither of us was strong enough that day. We both pay for it. That's enough." {rel.bilal+10 honor+2}
- "Don't. I chose it. It was my sin, not yours." {rel.bilal+15}
:b_end
@npc off

=== 49 | stadium | The stadium | id: stadium
@title Shalimar Stadium | Lahore, 2105 hours
* The final of the national T20 league. Forty thousand spectators. At 2105 six gunmen seize the VIP enclosure, with the Chief Minister and three foreign ambassadors inside.
* Then a call to the crisis room. The voice is calm, educated, and you know it.
Radio: General. I told you we would meet. There is a bomb in this stadium. Not with my men. Somewhere else. Shall we play?
@game quiz {"quizId":"stadium","title":"The Crisis Room","kicker":"Command decisions","per":12}
@ifwin st_ok
* Your orders come a fraction too slowly. Two gunmen get into the crowd before your teams take them down. Eleven people are hurt in the stampede.
@fx happy-8
@goto st_bomb
:st_ok
* Your teams flow in from three gates at once, exactly as you planned it.
@fx perf+6
:st_bomb
@cut stadium
@game assault {"scene":"stadium","enemies":6,"hostages":3,"length":9,"diff":3,"seed":49,"boss":true,"bossName":"Cell leader","title":"The VIP Enclosure","kicker":"Shalimar Stadium","intro":"Lead the assault team through the enclosure. The Chief Minister and the ambassadors are inside."}
* The bomb is under the main scoreboard. The bomb disposal officer was hit by a ricochet. You are the closest person who has done this before.
@vest on
@game defuse {"time":45,"title":"Under the Scoreboard","kicker":"No time"}
@ifwin st_def
* The blast blows the scoreboard into the outfield. The stands above it had been cleared four minutes earlier. On your order.
@fx health-10
@goto st_end
:st_def
* You come out from under the scoreboard and forty thousand people, who have no idea what just happened, are singing the national anthem.
@medal Hilal-e-Imtiaz (Military) | #c9a227 | Shalimar Stadium crisis, Lahore
:st_end
@log Commanded the response to the Shalimar Stadium siege. Shikari was behind it.
@history Shalimar Stadium siege

=== 50 | dam | Kohsar Dam | id: duel
@title Kohsar Dam | Monsoon, 2300 hours
* Intercepts. Khattak's last men have been buying industrial explosives. The target is Kohsar Dam. If it breaks, the flood will reach three cities.
* You insist on going yourself. Nobody can stop a Major General who has already put his boots on.
@vest on
@hat helmet
@outfit ssg
@game stealth {"diff":3,"scene":"dam","title":"The Crest","kicker":"Kohsar Dam","brief":"Cross the dam crest between the floodlights. The lights sweep with the storm."}
@iflose d_seen
@goto d_charges
:d_seen
* A shout, gunfire, and your team pins down the guards. But Khattak knows you are here now.
:d_charges
@game defuse {"time":42,"title":"Sluice Gate Four","kicker":"The main charge"}
@ifwin d_ok
* The charge goes off. But it is only one of three. The dam shudders. Cracks, but holds. Engineers will work on it for a year.
@fx health-10
@goto d_duel
:d_ok
* The main charge is dead.
:d_duel
@cut duel
@game fight {"foe":"Shikari","diff":5,"scene":"dam","foeColor":"#030303","knife":true,"foeHp":130}
@ifwin d_won
* He is better than you. He was always better than you. He puts you on the wet concrete, raises the knife, and then he slips.
:d_won
@npc khattak sad
Khattak(sad): Your hand, cadet... Let go. It's better this way. Let the river have me.
?!9 Your hand is around his wrist. The water is forty metres below.
- Pull him up. He will face a court. {honor+10 courage+2 flag:khattakTrial} -> pull
- Let go. {courage+2 honor-6 flag:khattakFell} -> fall
- "Tell me why. Then I'll decide." {intellect+2} -> why
:why
Khattak: Why? Because I believed every word of the oath, and they still threw me away like a broken rifle. Because I wanted one of my cadets to look the system in the eye and see what I saw.
Khattak: And you did. You saw it. And you stayed anyway. Damn you.
? He's slipping.
- Pull him up. {honor+10 flag:khattakTrial} -> pull
- Let go. {honor-6 flag:khattakFell} -> fall
:pull
* You haul him onto the crest. He lies in the rain, laughing, or crying. Saeed handcuffs him.
Khattak: A soldier who obeys an unlawful order... you remembered.
@history Captured Shikari (Jamshed Khattak) alive at Kohsar Dam
@goto d_end
:fall
* His wrist slides out of your glove. The river takes him, as he asked.
@history Shikari (Jamshed Khattak) fell from Kohsar Dam
:d_end
@npc off
@log Ended Shikari at Kohsar Dam.

=== 51 | home | Ammi | id: ammi51
@cut ammi_hands
@npc ammi happy
Ammi(happy): A general. My son is a general. You know what your father said, the day you were born? He said "this one will be an officer, look at how he cries, like he's giving orders."
? Your mother's hands are thin and spotted now.
- Take her to Umrah with you, as you always promised. {money-500 happy+8 rel.ammi+15 honor+1}
- Spend a whole week in the village with her. No phones. {happy+6 rel.ammi+12 perf-3}
- "Soon, Ammi. When things calm down." {rel.ammi-8}
@npc off

=== 52 | office | Three stars | id: ltgen
@promote Lieutenant General
@title Corps Commander | Rawalpindi
@cut headlines
* A corps of sixty thousand men. Your name is in the newspapers now, in the speculation columns about who will be the next Chief.

=== 53 | office | The conversation | id: coup1 | if: rank>=9
@cut malik_room
@npc malik
General Tariq Malik: Sit, {first}. You've seen the news. The government is paralysed. The economy is in pieces. The politicians are robbing the country blind while the people eat grass.
General Tariq Malik: Four corps commanders have agreed. We need a fifth. We need you. One night, no bloodshed. A caretaker setup, elections in two years. Say three. The country will thank us.
?!14 He is not joking.
- "No. And I'm going to the Chief with this conversation." {honor+12 courage+4 flag:reportedCoup} -> report
- "I'm in." {honor-30 flag:coup} -> join
- "I'll think about it." Then say nothing to anyone. {honor-8 flag:silentCoup} -> silent
:report
General Tariq Malik(angry): Then you're a fool, and a dead man politically. Think carefully about who your friends are.
@goto c_end
:join
General Tariq Malik(happy): I knew it. A soldier who understands the country. We move in six months.
@goto c_end
:silent
General Tariq Malik: Think fast.
:c_end
@npc off

=== 54 | office | The night | id: coup2 | if: flag.coup || flag.reportedCoup || flag.silentCoup
@if flag.coup -> joined
@if flag.reportedCoup -> stopped
:silent_n
* At 0100 hours tanks from Malik's corps roll toward the Prime Minister's House. You knew. You said nothing.
* By dawn it has failed: the Chief had his own sources. An investigation begins into who else knew.
@fx perf-20 honor-6 happy-10
@flag inquiry
@log The coup attempt failed. I knew, and I said nothing.
@history Stayed silent about the coup
@goto n_end
:stopped
* Because of your warning, the Chief moved first. At 0100 a single brigade still moves on the TV station, its officers unaware the plot is already dead. You go to meet them yourself.
@npc saeed
Captain Saeed: Sir, they're young officers who think they're saving the country. If anyone fires first, it'll be a massacre.
@npc off
@bg avenue
@cut coup_tanks
@game quiz {"quizId":"coupnight","title":"The TV Station","kicker":"0100 hours","per":12}
@ifwin talked
* There is a brief exchange of fire before the brigade stands down. Two soldiers are hurt. It could have been far worse.
@goto st_end2
:talked
@cut tv_station
* You walk alone, unarmed, across the car park. You talk to a young major for twenty minutes. Then he salutes, and orders his men back to barracks.
@fx leadership+6 honor+5
:st_end2
@log Warned the Chief of the plot and stopped the coup brigade at the TV station.
@history Stopped the coup attempt
@fx perf+10
@goto n_end
:joined
@cut coup_tanks
* 0100 hours. The tanks roll. The Prime Minister is arrested in his pyjamas. The television plays patriotic songs.
* At 0600 the other generals meet. Malik is sick, they say, or nervous, or simply not trusted. They want you at the head of the table.
?!12 The chair at the head of the table. The country, if you want it.
- Take the chair. {honor-20 flag:junta} -> chair
- At the last moment, refuse, and order the troops back to barracks. {honor+15 courage+6 flag:turned} -> turn
:chair
@end junta
:turn
* You walk out of the meeting and drive to the Prime Minister's House yourself. You give the order. The tanks turn around. The others will never forgive you. History might.
@log Joined the coup, then turned it around at the last hour.
@history Turned back the coup at dawn
:n_end
@npc off

=== 55 | office | The question | id: coas_sel | if: rank==10
@cut interview
* The Chief's tenure ends in three months. The Prime Minister will choose from the five senior-most lieutenant generals. You are one of them.
@npc pm
The Prime Minister: General. One question, and I want an honest answer. If I give an order you think is wrong, what will you do?
? The most important interview of your life.
- "Tell you so, in private, sir. And if it's unlawful, refuse it in public." {honor+5 flag:pmHonest}
- "Whatever you order, Prime Minister." {honor-4 flag:pmYes}
- "Prime Minister, I serve the Constitution. So do you. We'll be on the same side." {intellect+2 honor+3 flag:pmHonest}
@npc off
@set coasScore 0
@if honor>=55 && !flag.coup && !flag.silentCoup -> sel_check
@goto not_sel
:sel_check
@if perf*0.6+leadership*0.2+honor*0.2 >= 64 || flag.reportedCoup -> selected
:not_sel
* Two weeks later the announcement is made on the nine o'clock news. Another name. Somebody calls to say they're sorry. You thank them and hang up.
@fx happy-12
@log Not selected as Chief of Army Staff.
@history Passed over for Chief of Army Staff
@goto sel_end
:selected
* Two weeks later your phone rings at 2100. It is the Prime Minister's Military Secretary. "Sir, the PM has approved your name. Congratulations, General."
@npc ayesha happy
@if married -> sel_wife
@goto sel_star
:sel_wife
Ayesha(happy): Four stars. And not a single grey hair dyed. I'm proud of you. Still not making you tea, though.
:sel_star
@npc off
@setrank 11
@history Appointed Chief of Army Staff
:sel_end

=== 56 | parade | The fourth star | id: coas | if: rank==11
@cut coas
@title Chief of Army Staff | General {name}
@npc rauf
General Rauf: The baton is heavier than it looks. Half a million soldiers and their families. Don't let anyone tell you it is about the stars. It is about the soldiers.
@npc off
? Your first order as Chief of the Army Staff.
- A full review of martyrs' families' pensions and housing. {honor+4 leadership+3 happy+4}
- A crackdown on corruption in army-run businesses. {honor+5 perf+3 flag:cleanup}
- Modernise training with the new SSG doctrine you helped write. {perf+5 intellect+2}
@if rel.gulmother>0 || flag.gaveMedal -> gul_call
@goto coas_end
:gul_call
* Among a thousand letters of congratulation there is one in shaky Pashto, from Swat. "My son's CO is now the Chief. Allah keep you. I still have your medal on my shelf."
@fx happy+6
:coas_end
@log Took command of the Pakistan Army as Chief of the Army Staff.

=== 57 | office | The offer | id: extension | if: rank==11
@cut pm_house
@npc pm
The Prime Minister: General, the country needs continuity. I'd like to give you a three-year extension. Parliament will approve it. You've earned it.
? Extensions have been given before. Many people think they shouldn't be.
- "Thank you, Prime Minister. But no. The institution is bigger than any one man." {honor+10 flag:refusedExtension}
- "If the country needs me, sir." {honor-8 flag:tookExtension}
@npc off

=== 57 | office | Retirement | id: retire_nogen | if: rank<11
@cut last_drive
* Your last day in uniform. The staff car drives you home for the last time. The driver, who has opinions about cricket, cries a little and pretends it's the dust.
@if flag.reportedCoup || flag.turned -> retire_hero
@goto retire_go
:retire_hero
* You were never Chief. But the country is still a democracy, partly because of one night at a TV station. That is not nothing.
:retire_go
@end retire

=== 58 | graveyard | Ammi | id: ammi_death | if: rel.ammi>=0
@npc ammi sad
Ammi(sad): Don't cry, General. Generals don't cry. Your father cried, though. In the car, at Kakul. I told you that, didn't I?
@npc off
@death ammi
@cut janaza
@fx happy-15
@log Ammi passed away.

=== 59 | pma | The last parade | id: lastparade | if: rank==11 && !flag.martial
@title The Last Parade | Pakistan Military Academy, Kakul
* The Commandant has invited you to review the passing out parade of a new course. The gravel square. The arches. The mountains, exactly the same.
@if flag.sonArmy -> son_par
@goto lp_go
:son_par
@npc son happy
* Your son is in the front rank. He does not look at you. He is not allowed to. His chin is very high.
:lp_go
@npc off
? You step to the microphone. Six hundred cadets wait. What do you tell them?
- "Your soldiers will follow your pips for a week. After that, they follow your character." {honor+3}
- "A soldier who obeys an unlawful order is not a soldier. Remember it when it is inconvenient." {honor+3 intellect+2}
- "Find one man who says 'no sir'. Keep him close." {honor+3 leadership+2}
@npc bilal happy
Bilal(happy): You stole all your lines from other people, you know.
ME(happy): The best ones are always borrowed, yaar.
@npc off
@cut epilogue
@end coas
`);

// ---------- endings ----------
window.ENDINGS = {
  civilian: S => ({ kicker: 'A different life', title: 'The Road Not Taken', text: `${S.name} boarded a flight to Dubai at seventeen and built a comfortable life selling generators. Sometimes, watching the Defence Day parade on television, he would go very quiet. His father kept the old beret in a trunk until the day he died.` }),
  civilian2: S => ({ kicker: 'A different life', title: 'Not Recommended', text: `Twice not recommended by the board, ${S.name} became a schoolteacher in ${S.town}. Every year he coached the boys who wanted to sit for ISSB. Eleven of them became officers. One became a general and sent him a card every Eid.` }),
  superseded: (S, R) => ({ kicker: 'Superseded', title: 'The Long Wait', text: `Passed over three times, ${S.name} retired as a ${R[S.rank].n}. He grew roses, argued about cricket, and told his grandchildren stories that grew a little taller every year. The army forgot him. His soldiers did not.` }),
  illness: (S, R) => ({ kicker: 'A life cut short', title: 'Fade Away', text: `Years of mountains, missions and not enough sleep took their toll. ${S.name} died at ${S.age}, a ${R[S.rank].n}. At the funeral, a havildar from his first post stood at attention in the rain for the whole service.`, cut: 'janaza' }),
  dismissed: (S, R) => ({ kicker: 'Court martial', title: 'Dismissed from Service', text: `The court found ${S.name} guilty. Stripped of rank and pension, he went home to ${S.town}, where nobody mentioned it to his face. Some nights he took out the old photograph of his father beside the snowy bunker, and could not look at it for long.` }),
  junta: S => ({ kicker: 'Martial law', title: 'The Iron Chair', text: `General ${S.name} ruled for nine years. There were roads and there were arrests, there was order and there was fear. When he finally left office, the crowds in the streets were not cheering for him. In the history books, his chapter is short and the word used most often is "regrettably".`, cut: 'sunset' }),
  retire: (S, R) => {
    const good = S.honor >= 65;
    return { kicker: 'Retired', title: good ? 'An Honest Soldier' : 'Pension and Roses', text: `${S.name} retired as a ${R[S.rank].n} after ${Math.max(0, S.age - (S.vars.commAge || 20))} years of service. ${good ? 'Junior officers he had never met told stories about him. He pretended not to know about them, and enjoyed every one.' : 'It had been a full career, with things he was proud of and things he did not talk about.'} ${S.wife ? S.wife + ' finally got the holiday he had promised her twenty years earlier.' : ''}`, cut: 'sunset' };
  },
  coas: S => {
    const h = S.honor;
    const title = h >= 75 ? "The Soldier's General" : h >= 55 ? 'Sipahsalar' : 'The Iron General';
    const text = h >= 75
      ? `General ${S.name}, a havildar's son from ${S.town}, retired as Chief of the Army Staff${S.flags.refusedExtension ? ', having refused an extension,' : ''} and went home to the village. Cadets at Kakul still quote him without knowing whose words they are quoting. On the wall of his house hangs a photograph of his father beside a snowy bunker, and next to it, one of a boy with a kite.`
      : h >= 55
      ? `General ${S.name} commanded the army through hard years, made some calls history will praise and some it will argue about. He went home to ${S.town} with four stars and a quiet mind, mostly.`
      : `General ${S.name} reached the very top. Few loved him. Many feared him. In the end he had everything his younger self wanted, and he was not entirely sure what to do with it.`;
    return { kicker: 'Chief of the Army Staff (Retd)', title, text };
  },
};
