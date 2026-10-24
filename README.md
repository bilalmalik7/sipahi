# Sipahi se Sipahsalar

A BitLife-style life simulator with a story: you start as a 16-year-old schoolboy in a soldier's village and, year by year, try to rise to General and Chief of the Army Staff of the Pakistan Army. It is fiction: every character, operation and event is invented.

## Download for Android

**[⬇ Download SipahiSeSipahsalar.apk](https://github.com/bilalmalik7/sipahi/raw/main/release/SipahiSeSipahsalar.apk)** (version 1.2, about 1.2 MB, Android 5.0 and newer, plays fully offline). Install steps are in the [Android APK](#android-apk) section below.

## Play in a browser

Open `index.html` in a browser. No build step and no server needed. Progress saves automatically in the browser (`localStorage`).

## Version 1.2

- **Back button that stays in the game**: Back closes the top panel, pauses a mission, skips a cutscene, or goes from your life to the title screen. Only on the title screen does it ask "Press back again to exit". There are on-screen back buttons too (⌂ in a life, ◀ on character creation, ❚❚ Pause in every mission with Resume, Restart and Quit).
- **Automatic saving**: after every scene, action and year, every 20 seconds, and whenever the app goes to the background or closes. If the app is closed in the middle of a story scene, Continue replays that scene from its start. A small "✓ Saved" note shows when it saves.
- **Activities with trade-offs**: every activity shows what goes up (green), what goes down (red) and any risk before you tap it. Chai with friends raises happiness and friendships but costs money and study time; extra duty raises performance but costs health and family time; sport and night patrols can injure you; investing your savings can pay off or wipe them out.
- **Pay, perks and property**: the Career tab shows your monthly pay, savings and the perks of each rank (married quarters, staff car and driver, orderly, flag car, Army House). Officers are allotted a residential plot at Major, agricultural land at Brigadier (with a builder's tempting offer) and a second plot at Major General. Build a house to earn rent, lease the land, or sell.
- **Foreign courses and postings**: apply for courses and postings abroad, such as Fort Benning, the Turkish commando course, Sandhurst, a Saudi deputation, UN observer duty, Nanjing, Fort Leavenworth, a defence attaché post in Ankara and the Royal College of Defence Studies in London. Selection depends on Performance, Intellect and Honour; each one plays a travel cutscene and raises your promotion score.
- **Martial law branch**: as Chief of the Army Staff during an election crisis you can hold to the oath or impose martial law. Martial law plays about four and a half minutes of cutscenes: the night of the takeover, trucks, tanks and helicopters in the capital, nationwide curfew, jets over Islamabad, the address to the nation, the referendum and the oath as President, a 21-gun salute, motorcades and state visits, and the years that follow. Your decisions along the way (the Prime Minister's fate, the press, the election promise) lead to three different endings.
- **Operations decisions**: before every mission choose Cautious, By the book or Bold, which changes the mission and the pay. After each boss you decide whether to take him alive or let your men settle it; your name (⚖) changes how each region's story ends, and the final one.
- **More cutscenes**: 23 new life-story cutscenes, a cinematic intro for each Operations mission type, the foreign-posting journeys and the martial-law sequence. More than 120 in all.

## Operations: the campaign mode

Tap **Operations** on the title screen (or **⚑ Ops** in a life) for a mission-by-mission campaign you can play for hours, separate from the life story:

- **7 theatres, 56 missions**: Kakul, Siachen, the Line of Control, the Frontier, Karachi, Balochistan and Operation Sipahsalar. Each theatre is a map of 8 missions ending in a boss fight, with an intro cutscene, a boss cutscene and a victory cutscene.
- **Stars**: every mission is rated 1 to 3 stars. Later theatres open when you beat the previous boss and have enough stars in total.
- **Service Level**: every mission you play anywhere in the game (campaign, story or Training Ground) pays XP and supplies. Each level pays supplies, and every few levels a crate.
- **Armory**: 6 pieces of gear with 5 upgrades each (rifle, body armour, optics, grenades, boots, medkit). Upgrades help in every mode.
- **Squad**: 16 soldiers to recruit from supply crates (Common, Rare, Epic, Legendary). Every soldier you own adds a bonus, duplicates level them up, and your chosen buddy fights beside you in assaults and on the post.
- **Supply crates**: tap three times to break one open, then the cards flip in. Earned from bosses, level-ups, daily orders and lucky missions, or bought with supplies. There is nothing to buy with real money.
- **Daily orders**: three new tasks every day, with a Gold Crate for finishing all three.
- **Last Stand**: endless waves on a mountain post. Your best wave is saved.

New one-finger missions: **Tank Duel** (drag back and release to fire, with wind and craters), **Gunship** (hold on targets with the door gun, don't overheat, never hit civilians), **HALO Jump** (steer through rings, pull in the green zone, land on the smoke) and **Hold the Post** (tap attackers, shoot rockets out of the air, call an airstrike). They also appear in four new life-story chapters: jump wings, the night attack on Bana Top, a tank battle in the Chhamb sector and a gunship convoy escort.

## Runs smoothly on phones

- Canvas resolution is capped on phones, and scenes hidden behind a mission, cutscene or menu stop drawing.
- **Graphics** in Settings: Auto, High or Battery saver. Auto switches to Battery saver by itself if frames keep running slow, and starts there on phones with 4 or fewer CPU cores or 3 GB or less of memory. Battery saver turns off blur, bloom and grain, animates backgrounds at 30 fps and repaints scenery every third frame while soldiers, bullets and effects stay at full speed.
- In the Android app, JavaScript timers pause when the app goes to the background, after the game has saved.

## How it plays

- **Age +1** moves your life forward a year. Each year brings story scenes, a random event, salary, and stat changes.
- **Activities** (3 actions a year): PT, study, prayer, extra duty, range day (playable), sparring (playable), mentoring, check-ups, leave.
- **Family**: spend time with or give gifts to your parents, sister, best friend, wife and children. Bonds fade if you neglect them.
- **Career**: promotion boards score you on 60% Performance + 20% Leadership + 20% Honour. Get passed over three times and you are retired. Misconduct can get you reduced in rank or dismissed.
- **Story scenes**: your character stands facing you while the story plays. Choices change your stats, relationships and future scenes.
- **Missions** (14 types): tank duel, gunship, HALO jump, hold the post, hand-to-hand fight, firing range, sniper, stealth, obstacle course, cipher decryption, bomb defusal, route memorisation, find-the-mole deduction, timed command decisions.
- **Cutscenes** (more than 120): letterboxed, colour-graded cinematics with camera moves, rim-lit soldiers and fight choreography: the school fight, the night train to Kakul, boxing finals, night navigation, the avalanche, the ambush, a sniper duel, SSG hell week, the HALO jump, the bus siege, tailing a courier through Saddar, the port bomb, the car chase, the rooftop knife fight, the war game, the flood rescue, the kidnapping, the earthquake rescue, the stadium siege, the dam duel, tanks on Constitution Avenue, the standoff at the TV station, the change of command and a closing montage.
- **Look**: layered 2.5D backgrounds (fractal mountains with snow and rock shading, drifting clouds, god rays, rain, snow, mist, smoke, swaying trees, people and vehicles moving in the distance) under a slowly moving camera; characters are lit to match each scene, breathe, shift their weight, glance around, nod and gesture while talking.

## Progress that carries across lives

- **Merit Stars**: earned from every mission (1–3 star ratings, extra for a new best), achievements and the daily ration.
- **Perks** (6 perks, 3 levels each): Marksman, Commando, Iron Body, Tactician, Silver Tongue, Staff Officer. They apply to every future life.
- **Achievements**: 45, each paying Merit Stars.
- **Training Ground**: replay 13 drills, including three playable assault missions, for better ratings.
- **Daily ration**: a login streak that pays more each consecutive day.
- **Settings**: text speed, auto-advance, sound, graphics.

## Playable assault missions

Five story missions (and three drills) put you in direct control of your soldier: move, crouch behind cover, fire when enemies peek out (watch their red aim lines), reload, throw grenades, grab medkits, rescue hostages and beat the boss. Keyboard: A/D or arrows, S crouch, Space fire, R reload, G grenade. On phones, on-screen buttons.

## The life

| Age | Chapter |
| --- | --- |
| 16–18 | Village, matric exams, the school bully, ISSB Kohat |
| 19–20 | PMA Kakul, Bilal, Major Khattak, the Sword of Honour, commissioning |
| 21–24 | Point 5410 avalanche, smugglers' trail, Operation Subh-e-Noor |
| 25–29 | SSG selection, marriage, Bus 14, undercover in Karachi, the mole |
| 30–35 | Staff College, father's death, UN peacekeeping, the contractor's bribe |
| 36–43 | Battalion command, the floods, Bilal's secret, Shikari unmasked, the rescue |
| 44–52 | Brigade, earthquake, the stadium siege, the duel at Kohsar Dam |
| 53–59 | The coup plot, the Prime Minister's question, the fourth star |

Endings include Chief of the Army Staff (three variants by Honour), honourable retirement, being superseded, court martial, a civilian life, death from neglected health, and martial law.

A full life takes roughly 3–4 hours to play through with the missions; different choices open different scenes and endings.

## Files

- `js/engine.js`: life simulation, year loop, story interpreter, promotions, activities, family, saves, endings
- `js/story.js` to `js/story6.js`: characters and the story script (ages 16–59) and endings; `story5.js` and `story6.js` (the martial-law branch) also hold the cutscenes for their chapters
- `js/cutscenes2.js`: cutscenes for the later life chapters, Operations mission intros and foreign postings
- `js/events.js`: random yearly events, the mole case, timed-decision scenarios
- `js/character.js`: the front-facing SVG character (uniforms, insignia, ribbons, ageing)
- `js/scenes.js`: animated canvas backgrounds
- `js/figures.js`, `js/cutscenes.js`: skeletal fight animation and cutscenes
- `js/minigames.js`: the original ten mission types; `js/minigames2.js`: tank duel, gunship, HALO jump, hold the post
- `js/ops.js`: Operations campaign, service level, armory, squad, crates, daily orders, theatre cutscenes
- `js/audio.js`: synthesized sound effects

### Story script format

```
=== 24 | valley | Operation Subh-e-Noor | id: valley | if: rank>=2
Colonel Rizvi: Gentlemen. Wadi-e-Noor...      (an NPC speaks)
ME(determined): Look at me, not at them.        (you speak, with a mood)
* Narration.
? What do you do?
- Hold fire. Talk to him. {honor+3 leadership+3} -> talkm
- [courage>=40] Take the shot. {courage+3} -> shot
:talkm
@game fight {"foe":"Kamran","diff":3}
@ifwin won
@promote
```

## Android APK

A ready-to-install APK is in `release/SipahiSeSipahsalar.apk` (version 1.2, about 1.2 MB, Android 5.0 and newer, plays fully offline, fonts included).

Install on a phone: download the file, open it, allow "Install unknown apps" for your browser or file manager when asked, then tap Install. The app runs full screen in landscape or portrait, keeps the screen on, vibrates on hits and explosions, and the Back button closes open panels (press twice quickly to exit).

Rebuild it after changing the game: `android/build-apk.sh [versionCode] [versionName]`. The script needs only a JDK, curl, unzip, zip and python3; it downloads its tools from Maven Central (apktool-lib for aapt2 and framework resources, dalvik-dx, Android API stubs) and signs with `android/debug.keystore`. That key is a testing key with a public password: fine for sideloading and updating your own install, not for a store release. Raise `versionCode` each time so phones accept the update.

## Publishing to the Google Play Store

The game is a Progressive Web App (`manifest.webmanifest`, `sw.js` for offline play, icons in `icons/`). Two ways to ship it as an Android app:

**Option A: Trusted Web Activity (simplest)**
1. Host this folder on HTTPS (for example GitHub Pages: Settings → Pages → deploy from this branch, folder `games/sipahi-se-sipahsalar`).
2. Install Bubblewrap: `npm i -g @bubblewrap/cli`.
3. `bubblewrap init --manifest https://YOUR-HOST/games/sipahi-se-sipahsalar/manifest.webmanifest`, then `bubblewrap build`. This produces a signed `.aab`.
4. Put the generated `assetlinks.json` at `https://YOUR-HOST/.well-known/assetlinks.json` so the app runs full screen without a browser bar.
5. Upload the `.aab` in the Google Play Console (developer account required), and fill in the store listing, content rating questionnaire and data safety form (the game stores progress only on the device).

**Option B: Capacitor (fully offline, no hosting)**
1. `npm init -y && npm i @capacitor/core @capacitor/cli @capacitor/android`
2. `npx cap init "Sipahi se Sipahsalar" com.yourname.sipahsalar --web-dir .`
3. `npx cap add android && npx cap open android`, then build a signed bundle in Android Studio and upload it.

Store listing notes: the game depicts fictional military service with stylised violence (no blood or gore beyond small hit sparks), so expect a Teen-type rating. All characters, operations and the enemy network are fictional.
