// Bilingual meme captions. `te` is romanized Telugu (readable without a
// Telugu font) and `en` is the English helper line. Each page picks a key
// and we render the pair inside a meme caption bar when the user has the
// meme theme enabled.
//
// Kept deliberately short and snappy — these are *captions*, not copy.

export const MEME_CAPTIONS = {
  home: {
    te: 'GULLY lo Batting start!',
    en: "Grab a bat, we're live.",
    image: '/images/memes/meme-hero.png',
  },
  teamsEmpty: {
    te: 'Jaffa adagaledu... team kuda ledu!',
    en: 'No teams yet. Add your first squad.',
    image: '/images/memes/meme-empty.png',
  },
  teamsList: {
    te: 'Meeru kattina squads',
    en: 'Your squads, ready for war.',
  },
  createTeam: {
    te: 'Team kattu ra mawa!',
    en: 'Build your playing XI.',
  },
  createMatch: {
    te: 'Toss gelisthe sagamey match!',
    en: 'Pick sides and start scoring.',
    image: '/images/memes/meme-hero.png',
  },
  matchSetup: {
    te: 'Openers ready aa?',
    en: 'Set your openers and opening bowler.',
  },
  innings2Setup: {
    te: 'Chase chey, tension lekapoyina!',
    en: 'New innings, new target.',
  },
  liveScore: {
    te: 'Score cheppu!',
    en: 'Live — tap a button after every ball.',
  },
  wicket: {
    te: 'OUT ante OUT!',
    en: 'Bowled him over!',
    image: '/images/memes/meme-out.png',
  },
  victory: {
    te: 'Idhe ra assalu game!',
    en: "What a match!",
    image: '/images/memes/meme-celebrate.png',
  },
  draw: {
    te: 'Match draw annadu...',
    en: 'Both teams shook hands.',
  },
  matchHistoryEmpty: {
    te: 'Inka oka match aadandi!',
    en: 'No matches yet — start one.',
    image: '/images/memes/meme-empty.png',
  },
  matchHistoryList: {
    te: 'Purana matches chudamu',
    en: 'Every gully classic, archived.',
  },
  recordsEmpty: {
    te: 'Stats cheppaleda? Aadandi mundu!',
    en: 'Play a match to build stats.',
    image: '/images/memes/meme-empty.png',
  },
  recordsList: {
    te: 'Records book oka look vesko!',
    en: 'Career stats for every player.',
  },
  roster: {
    te: 'Players pool ready!',
    en: 'Your global player catalog.',
  },
  notFound: {
    te: 'Idi eedi page ra?',
    en: "This page doesn't exist.",
    image: '/images/memes/meme-empty.png',
  },
};

// Helper to pick a caption safely.
export const memeCaption = (key) => MEME_CAPTIONS[key] || null;
