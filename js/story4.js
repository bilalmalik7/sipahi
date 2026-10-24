// Story threads added in round three: Abba's compass, the glacier, Khattak's call, Nadia, the rival,
// Shikari's midnight call, the trial, Ammi's last Eid and the next generation.
window.NPCS.danish = {
  name: 'Danish Mirza', role: 'Rival',
  look: S => ({ outfit: S.rank >= 9 ? 'dress' : 'combat', rank: Math.min(10, Math.max(2, S.rank + (S.age >= 44 && S.age < 52 ? 1 : 0))), hat: S.rank >= 9 ? 'gencap' : 'beret', beretC: '#1f2a1c', hair: '#0e0b08', skin: '#e2b48e', moustache: true, glasses: S.age >= 48, gray: Math.max(0, (S.age - 44) / 30), age: S.age, tape: 'MIRZA', medals: ['#0b6b3a', '#c9a227', '#3b7fd0'] }),
};

window.STORY_SRC.push(`
=== 18 | home | The compass | id: compass | if: flag.recommended
@cut compass_gift
Abba: In 1999 I was on the glacier. Twenty thousand feet. In a blizzard you cannot see your own hand. This little thing brought me home.
Abba: There was a boy with me that night. A sepoy. I carried him a long way. I never found out what happened to him.
? Abba presses the compass into your hand.
- "I'll bring it home, Abba. Every time." {rel.abba+10 honor+2 flag:compass}
- "Tell me about that night. The boy." {rel.abba+6 intellect+1 flag:compass} -> ask
- "Keep it, Abba. You might need it." {rel.abba+4} -> keep
@goto c_end
:ask
Abba(sad): Some nights are not for telling, beta. Maybe one day someone else will tell you.
@goto c_end
:keep
Abba(happy): Stubborn. Like your mother. Fine. Then come home and use mine whenever you like.
:c_end
@npc off
@log Abba gave me his old compass from the glacier.
@tease Kakul. Two years. A roommate who will become your brother, and an instructor who will become something else.

=== 22 | barracks | The fire | id: sherkhan_tale | if: rel.sherkhan>=0
* Late. The post is quiet. Havildar Sher Khan sits by the stove with his leg stretched out, the one that still aches in the cold.
@npc sherkhan
Havildar Sher Khan: Sahib, your father. Havildar? Served on the glacier?
ME(surprised): Siachen, 1999. How do you know that?
@if flag.compass -> compass_seen
Havildar Sher Khan: Your face. Your way of standing. I knew the moment you arrived. I was waiting until I was sure.
@goto tale
:compass_seen
Havildar Sher Khan(surprised): That compass in your pocket. Brass, the glass cracked in one corner. I would know it with my eyes shut. I watched that needle for eleven kilometres.
:tale
@cut glacier_1999
@npc sherkhan sad
Havildar Sher Khan(sad): I was the boy, Sahib. The sepoy with the bullet in his leg. He never knew my name. He carried me anyway.
? The fire crackles. The old soldier is crying, and pretending he is not.
- Call your father on the satellite phone, right now. {rel.sherkhan+20 rel.abba+15 happy+10 flag:glacierCall} -> call
- "Then he did his duty, and so will I." Shake his hand. {rel.sherkhan+15 honor+3} -> shake
:call
* The line crackles. Your father's voice, sleepy and alarmed. You hand the phone over.
Havildar Sher Khan: Havildar Sahib... it's the sepoy. From the glacier. The one with the leg.
* For a long time nobody on either end of the line says anything at all.
@log Found out Havildar Sher Khan was the sepoy my father carried off the glacier in 1999.
@goto t_end
:shake
@log Found out Havildar Sher Khan was the sepoy my father carried off the glacier in 1999.
:t_end
@npc off
@history Sher Khan's secret: the glacier, 1999

=== 26 | cherat | The phone call | id: overheard | if: flag.ssg
* You cannot sleep. You walk out past the instructors' lines for some air. One window is lit. A voice you know is on the phone.
@cut overheard
?!10 Major Khattak is still on the call. He has not seen you.
- Report it to the Directorate in writing tomorrow. {honor+4 courage+2 flag:reportedCall} -> rep
- Step into the light and ask him what the Consortium is. {courage+4 flag:confronted} -> conf
- Walk away. It is not your business. Yet. {flag:heardCall} -> walk
:rep
* Your report goes into a file. The file goes into a cabinet. It will stay there for fourteen years.
@goto o_end
:conf
@npc khattak
Khattak(happy): The Consortium? A security firm, cadet. They want an old soldier to give lectures for money. Is that a crime now?
Khattak: Go to bed. You have a twenty-mile march at dawn. And captain... don't wander in the dark. Even here.
@fx rel.khattak-10
@goto o_end
:walk
* You lie awake until reveille, hearing the word over and over. Consortium.
:o_end
@npc off
@log Overheard Major Khattak on a late-night call about "the Consortium".
@tease Karachi. A city of sixteen million, and somewhere in it, a man who knows your name.

=== 27 | hospital | A new life | id: birth_scene | if: married && kids==1
@cut birth
@npc ayesha happy
Ayesha(happy): The nurses already call him "the little colonel". I told them he will be a doctor. We will see who wins.
@npc off

=== 29 | street | Nadia | id: nadia_fate | if: flag.directorate
* 2310 hours. A text from Nadia's number. Three words. "They are outside."
@npc nadia
?!8 Her flat is twelve minutes away. Backup is forty.
- Go now. Alone if you have to. {courage+5} -> go
- Call it in and wait for the team. {perf+2} -> wait
:go
@npc off
@game assault {"scene":"street","enemies":5,"hostages":1,"length":7,"diff":3,"seed":29,"title":"Saddar Stairwell","kicker":"No backup","intro":"Kamran's men are on the stairs. Nadia is on the fourth floor."}
@iflose lost_n
@cut nadia_saved
@flag nadiaSaved
@log Got Nadia out of Karachi alive. She flew to Toronto under a new name.
@history Saved Nadia
@goto n_end
:wait
* The team arrives at 2351. The door is open.
:lost_n
@cut nadia_end
@flag nadiaDead
@fx happy-15 courage+3
@log Nadia was killed by Kamran's men. It was meant as a message to me.
@history Nadia killed in Saddar
:n_end
@npc off
@tease Staff College, Quetta. The army's brightest majors. And one of them already hates you.

=== 30 | quetta | The rival | id: rival
@cut rival
@meet danish 30
@npc danish happy
Danish Mirza(happy): They say you caught a mole in Karachi. With a suit that didn't fit. Fascinating.
? Every major in the mess is watching.
- "The suit was borrowed. The mole wasn't." Smile and walk on. {honor+2 leadership+2} -> cool
- "Fifty thousand rupees says I beat you in the war game." {courage+2 flag:betDanish} -> bet
- "And your father caught what, exactly, for you?" {happy+4 rel.danish-15} -> burn
:cool
Danish Mirza: Hm. Composure. They'll like that in your annual report.
@goto r_end
:bet
Danish Mirza(happy): Done. I'll spend it on something you can't afford.
@goto r_end
:burn
Danish Mirza(angry): Careful, havildar's son. My father remembers names.
:r_end
@npc off

=== 31 | quetta | Paying up | id: bet_paid | if: flag.betDanish
@if win -> won_bet
@npc danish happy
Danish Mirza(happy): Fifty thousand. I'll take it in cash. Better luck in the real war, Major.
@fx money-50 happy-4
@goto b_end
:won_bet
@npc danish angry
Danish Mirza(angry): Fifty thousand. Count it if you like. Enjoy it. It's the last thing you'll ever beat me at.
@fx money+50 happy+6 rel.danish-10
:b_end
@npc off

=== 40 | office | The Cherat file | id: cherat_file | if: flag.reportedCall || flag.heardCall || flag.confronted
@npc dg
@if flag.reportedCall -> rep_payoff
General Asfandyar: You heard him on the phone in Cherat fourteen years ago, didn't you? And you told nobody.
? The General is not angry. That is worse.
- "I should have reported it, sir. I was young." {honor+3}
- "I had no proof, sir." {honor-1}
@goto cf_end
:rep_payoff
General Asfandyar: I found your report from Cherat, {rankS}. Fourteen years in a cabinet. Nobody read it. If they had...
General Asfandyar: You saw him first. Before any of us. Remember that, when you start doubting yourself.
@fx honor+5 perf+5
:cf_end
@npc off
@tease He knows you know. And he knows where your best friend lives.

=== 44 | office | Doors that open | id: rival2
@npc danish happy
Danish Mirza(happy): Brigadier Mirza, since March. Six months ahead of you. Don't take it personally, it's just how the world works.
Danish Mirza: Join us. My father's circle. Dinners, golf, the right word in the right ear at the right board. Doors open.
? He holds out a gold-edged invitation card.
- Decline politely. You will get there on your own record. {honor+5 rel.danish-8} -> no
- Accept. You have waited long enough. {perf+8 honor-7 flag:danishCircle} -> yes
:no
Danish Mirza(angry): Pride. Very charming. Very expensive.
@goto d_end
:yes
Danish Mirza(happy): Wise. Saturday, nine o'clock. Wear something without a scar on it.
:d_end
@npc off

=== 47 | home | Midnight call | id: shikari_call_ev | if: !flag.khattakTrial && !flag.khattakFell
@cut shikari_call
@npc khattak angry
Khattak(angry): Do you know what I miss, General? The certainty. Every morning in uniform I knew which side I was on.
@if flag.nadiaDead -> nadia_line
@goto call_q
:nadia_line
Khattak: The girl in Karachi. Nadia. That was Kamran's idea, not mine. I want you to know that. I don't kill teachers.
@react angry
:call_q
?!10 The line is still open. Every second gives the trace team more time.
- Keep him talking. Ask him about the old days at Kakul. {intellect+3 flag:traced} -> trace
- "What do you want?" {courage+2} -> want
- Hang up. {} -> hang
:trace
ME(determined): Do you remember the first lecture you gave us, sir? About unlawful orders?
Khattak: Every word. I meant every word. That is the tragedy, cadet.
* Across the room, your signals officer gives you a thumbs up. The call came from the Kohsar valley.
@fx perf+6
@log Traced Shikari's call to the Kohsar valley.
@goto call_end
:want
Khattak: To be understood. Nobody ever wants that from a soldier. Goodnight.
@goto call_end
:hang
* You put the phone face down on the table. It rings again. You let it ring until morning.
:call_end
@npc off
@tease Kohsar Dam. A storm is coming, and so is he.

=== 49 | pma | The next sword | id: son_parade_ev | if: flag.sonArmy
@cut son_parade
@npc son happy
Son(happy): Abbu. Salute me properly. I outrank you today. It's my day.
@if flag.compass -> compass_hand
? Your son is a second lieutenant.
- Salute him, in front of everyone. {happy+10 rel.kid1+15}
- Hug him, in front of everyone, which is worse. {happy+10 rel.kid1+20}
@goto s_end
:compass_hand
? You still have Abba's compass. Forty years in your pocket.
- Give it to him. "It pointed your grandfather home. And me." {happy+12 rel.kid1+25 honor+3 flag:compassPassed}
- Keep it one more year. {rel.kid1+5}
:s_end
@npc off
@log My son passed out of Kakul as a second lieutenant.
@history Son commissioned from PMA Kakul

=== 51 | office | The trial | id: trial_ev | if: flag.khattakTrial
@cut trial
? After the verdict, the prison allows one visitor.
- Visit him. {honor+3 rel.khattak+10} -> visit
- Do not go. Some doors stay shut. {} -> stay
:visit
@bg office
@npc khattak sad
Khattak(sad): You came. Of course you came. I taught you that too, didn't I. Loyalty.
Khattak: Here. My wings from 1987. I wore them badly at the end. Wear them better.
@medal Khattak's SSG Wings | #d8a840 | Given by his old instructor, in prison
@npc off
@goto tr_end
:stay
* He is sentenced to life. On the first day of every month, a letter arrives from Adiala jail. You never open them. You never throw them away.
:tr_end

=== 51 | dam | The river | id: river_ev | if: flag.khattakFell
* A letter in a girl's handwriting. Khattak's daughter, a medical student in Peshawar.
* "Sir, I know what my father became. But I also know what he was before. He kept your photograph from Kakul in his desk. Please tell me he was a good teacher."
? What do you write back?
- "He was the best teacher I ever had. That is why it hurt so much." {honor+4 happy+2}
- Do not write back. {}

=== 53 | office | The messenger | id: messenger | if: flag.coup || flag.silentCoup || flag.reportedCoup
@npc danish
@if flag.danishCircle -> circle
Danish Mirza: Malik sent me. He wants to know where you stand. So do I, frankly.
@goto msg_q
:circle
Danish Mirza(happy): Saturday dinners, golf, the right word in the right ear. You took the invitation, remember? Now the invitation takes you.
@fx honor-3
:msg_q
?!10 Danish waits for an answer, smiling.
- "Tell Malik my answer is the Constitution." {honor+6 courage+3 rel.danish-20}
- "Tell him I'm thinking." {honor-2}
@npc off

=== 57 | village | Ammi's last Eid | id: eid_ev | if: rel.ammi>=0
@cut eid
@npc ammi happy
Ammi(happy): General Sahib, you have flour on your uniform. Your father would have laughed until he cried.
? Your mother is very old, and very happy.
- Help her in the kitchen all day. {happy+10 rel.ammi+15}
- Sit with her on the charpai and listen to the old stories. {happy+8 rel.ammi+15 intellect+1}
@npc off
`);

// "coming up" hooks at the end of existing years
(() => {
  const add = (marker, line) => {
    for (let i = 0; i < window.STORY_SRC.length; i++) {
      const s = window.STORY_SRC[i];
      if (s.includes(marker)) { window.STORY_SRC[i] = s.replace(marker, marker + '\n' + line); return; }
    }
  };
  add('@log Wrote the matric exams. {first} is sixteen and already being tested.', '@tease Your uncle has an offer from Dubai. Your father has a dream. Only one of them can win.');
  add('@history Commissioned, {regiment}', '@tease First posting: a bunker at sixteen thousand feet, and a havildar who has seen three lieutenants come and go.');
  add('@history Operation Subh-e-Noor', '@tease A man from the Special Service Group has been reading your file.');
  add('@history Bus 14 rescue; Shikari speaks', '@tease A general whose name is on no building wants to meet you.');
  add('@history Bilal kidnapped by Shikari', '@tease Seventy-two hours. A ledge at three thousand metres. One chance.');
  add('* A corps of sixty thousand men. Your name is in the newspapers now, in the speculation columns about who will be the next Chief.', '@tease A fellow general wants a quiet word. About the country. About one particular night.');
  add('@history Shalimar Stadium siege', '@tease He has run out of men. He has not run out of explosives.');
})();
