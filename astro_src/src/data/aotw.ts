/**
 * Album of the Week — scheduled data
 *
 * Add future entries here and push. The site auto-rebuilds every Monday
 * (via GitHub Actions cron) and displays whichever album has the most
 * recent `weekOf` date that is on or before today.
 *
 * Rules:
 *   - `weekOf` is the Monday of that week, in YYYY-MM-DD format.
 *   - Keep entries sorted newest → oldest (makes the file easier to read).
 *   - Future entries are safe to commit — they won't appear until their week.
 *   - `spotifyId` is the ID from the Spotify album URL:
 *       https://open.spotify.com/album/<spotifyId>
 */

export interface Album {
  weekOf: string;       // "YYYY-MM-DD" — Monday of the week
  spotifyId: string;    // Spotify album ID
  title: string;
  artist: string;
  description: string;  // 2–5 sentences on why you picked it
  genre: string;        // e.g. "Alternative / Indie Rock · Midwest Emo"
  year: number;
}

export const albums: Album[] = [
  {
    weekOf: '2026-04-07',
    spotifyId: '78fVrBMf6FqWT9d1siaFLn',
    title: 'For Posterity',
    artist: 'Dryjacket',
    description: `I first discovered Dryjacket when they opened for Aaron West and the Roaring Twenties
      in Providence, RI — and I was hooked from the first song. Their blend of math-emo guitar
      work and polished pop sensibilities hit me immediately in a live setting, and
      <em>For Posterity</em> bottles that energy perfectly. The playful, clever lyrics paired
      with laid-back vocals give the whole record a cool effortlessness that keeps it in
      constant rotation. 33 minutes, 11 tracks — put it on, don't skip a thing.`,
    genre: 'Alternative / Indie Rock · Midwest Emo · Math Rock',
    year: 2017,
  },
  {
    weekOf: '2026-04-14',
    spotifyId: '2gToC0XAblE9h3UZD6aAaQ',
    title: 'Third Eye Blind',
    artist: 'Third Eye Blind',
    description: `This is the first album I remember seeing in my house growing up, which is surprising given my dad's questionable taste in music in the '90s. "Semi-Charmed Life," "Jumper," and "How's It Going to Be" are the obvious entry points, but the whole thing front to back is pretty much perfect. What really shaped my idea of what a successful album looks like are those last two tracks — this record knows how to stick the landing. If you've never gone past the singles, this is the week to fix that.`,
    genre: 'Alternative Rock · Post-Grunge',
    year: 1997,
  },
  {
    weekOf: '2026-04-21',
    spotifyId: '6l3mTuQHtjeqoyYWkTxld8',
    title: 'Nearer My God',
    artist: 'Foxing',
    description: `I first got into Foxing through their debut, The Albatross (2013), which kept showing up in my Spotify recommendations until I finally gave in — and immediately understood why. Since then they never left my top 5 artists, and Nearer My God is the record that cemented that. Foxing has always built their albums as full listening experiences rather than collections of singles, and this one is no exception — every track earns its place. Whenever they came through Madison or the surrounding area, I always made sure to catch them live, and they absolutely delivered every time.`,
    genre: 'Indie Rock · Emo',
    year: 2018,
  },
  {
    weekOf: '2026-04-28',
    spotifyId: '2Qr40p1sv6NYrf9NPehsrO',
    title: 'Carnavas',
    artist: 'Silversun Pickups',
    description: `I actually first heard Silversun Pickups when they opened for Muse — years after this album had already come out — and thought they were good without fully appreciating what I was watching. It wasn't until I went back and listened to Carnavas specifically because of "Lazy Eye" that it clicked. That song absolutely detonates, but it was actually the opening track "Melatonin" that really hooked me — those fuzzy, beautiful melodies set the tone for the whole record and I was locked in from there.`,
    genre: 'Alternative Rock · Shoegaze',
    year: 2006,
  },
  {
    weekOf: '2026-05-05',
    spotifyId: '5Gs6TUCuOnRYyqYHwDLAAW',
    title: 'Clarity',
    artist: 'Jimmy Eat World',
    description: `This is the seminal album for me — and I didn't even find it until 2015, well past the years when most people cement their musical identity. Like a lot of people, I knew Jimmy Eat World from "The Middle" and assumed I had them figured out. Clarity completely dismantled that assumption. This record has shaped my musical taste more than anything else over the last decade and it remains a go-to regardless of mood. Do yourself a favor and put this one on with the lights a little lower than normal.`,
    genre: 'Alternative Rock · Emo',
    year: 1999,
  },
  {
    weekOf: '2026-05-12',
    spotifyId: '0RADUK8yTUBidzBke6Eszq',
    title: 'Dude Ranch',
    artist: 'blink-182',
    description: `Dude Ranch was the album I most wanted to replicate when I was playing in bands growing up. Tom DeLonge's guitar riffs are so iconic for the genre, and his vocals in this era are something I don't think gets talked about enough. If you want to hear what 90s pop punk perfection sounds like, put on "Enthused" and tell me I'm wrong.`,
    genre: 'Pop Punk · Skate Punk',
    year: 1997,
  },
  {
    weekOf: '2026-05-19',
    spotifyId: '1yW5dI0y4ckpC2646nakvc',
    title: 'Hotel California',
    artist: 'Eagles',
    description: `There's a reason this album never leaves the cultural conversation — it's just genuinely, undeniably great. "Hotel California" the song is a masterpiece of atmosphere, and the rest of the record holds up right alongside it. "Wasted Time" is one of my all-time favorite songs — it's got this gorgeous, aching quality that never gets old. And the riff in "Victim of Love" hits me to the core every single time. I grew up hearing this in the background and it took me years to actually sit down and listen front-to-back, but when I did, I understood why it's considered one of the all-timers.`,
    genre: 'Rock · Soft Rock',
    year: 1976,
  },
  {
    weekOf: '2026-05-26',
    spotifyId: '3jWhmYMAWw5NvHTTeiQtfl',
    title: 'Pinkerton',
    artist: 'Weezer',
    description: `Pinkerton is the album that split Weezer fans in half, and I side firmly with Pinkerton. I wasn't listening to it in 1996, but I've continued to love it for the last 20 years. It's rawer and more confessional than the Blue Album — Rivers Cuomo basically poured everything uncomfortable and embarrassing about himself into these songs, and the result is something that feels startlingly personal. "El Scorcho," "Across the Sea," and "Butterfly" are all brilliant in completely different ways. This one gets better every time I revisit it.`,
    genre: 'Alternative Rock · Emo',
    year: 1996,
  },
  {
    weekOf: '2026-06-02',
    spotifyId: '0FZK97MXMm5mUQ8mtudjuK',
    title: 'The Black Parade',
    artist: 'My Chemical Romance',
    description: `I know "Welcome to the Black Parade" is a cultural monument at this point, but The Black Parade as a full album is something else entirely. This record is super introspective while also getting right in your face, and that dichotomy is a big part of what makes it so special. One of my favorite musical moments on any album is Liza Minnelli's cameo at the end of "Mama" — it's theatrical and bizarre and somehow completely perfect, and it tells you everything you need to know about what MCR was going for here.`,
    genre: 'Alternative Rock · Pop Punk',
    year: 2006,
  },
  {
    weekOf: '2026-06-09',
    spotifyId: '5YsF3JhLsMZDUXPlqnEw81',
    title: 'Supernatural',
    artist: 'Santana',
    description: `This was our skiing album — we'd put it on every weekend on the way to the mountain, and it never got old. Carlos Santana is one of my favorite guitarists, and what he pulled off here is remarkable: he brought in Dave Matthews, Rob Thomas, Lauryn Hill, and Eric Clapton — a dozen different perspectives and voices — and his smooth, fluid guitar is the thread that ties it all together seamlessly. By all logic this album shouldn't work as a cohesive record, but it absolutely does, and that's a testament to how special Carlos Santana is.`,
    genre: 'Latin Rock · Pop Rock',
    year: 1999,
  },
  // ── Add future entries above this line, keeping newest → oldest order ──
];
