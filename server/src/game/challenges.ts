// ============================================================================
// Challenge bank. In production this is meant to be read from Supabase
// PostgreSQL (see database/schema.sql + database/seed.sql for the same
// records) — this in-memory copy lets the server run and be tested with zero
// external dependencies, and is used as a fallback if Supabase env vars are
// absent. Audio URLs point at /audio/placeholder/<category>.txt — see
// README "Audio Assets" section for how to wire in real licensed clips.
// ============================================================================

import type { CategoryId, Challenge, Difficulty } from "../../../shared/types";

function placeholderUrl(category: CategoryId, slug: string): string {
  return `/challenges/${category}/${slug}.mp3`;
}

export const CHALLENGES: Challenge[] = [
  // ---- Animals ----
  { id: "an-cat", name: "Cat", category: "animals", difficulty: 1, audioUrl: placeholderUrl("animals", "cat"), duration: 2, tags: ["meow"], emoji: "🐱" },
  { id: "an-dog", name: "Dog", category: "animals", difficulty: 1, audioUrl: placeholderUrl("animals", "dog"), duration: 2, tags: ["bark"], emoji: "🐶" },
  { id: "an-cow", name: "Cow", category: "animals", difficulty: 1, audioUrl: placeholderUrl("animals", "cow"), duration: 3, tags: ["moo"], emoji: "🐄" },
  { id: "an-duck", name: "Duck", category: "animals", difficulty: 1, audioUrl: placeholderUrl("animals", "duck"), duration: 2, tags: ["quack"], emoji: "🦆" },
  { id: "an-monkey", name: "Monkey", category: "animals", difficulty: 2, audioUrl: placeholderUrl("animals", "monkey"), duration: 2, tags: ["ooh-ooh"], emoji: "🐵" },
  { id: "an-lion", name: "Lion", category: "animals", difficulty: 2, audioUrl: placeholderUrl("animals", "lion"), duration: 3, tags: ["roar"], emoji: "🦁" },
  { id: "an-wolf", name: "Wolf", category: "animals", difficulty: 2, audioUrl: placeholderUrl("animals", "wolf"), duration: 3, tags: ["howl"], emoji: "🐺" },
  { id: "an-horse", name: "Horse", category: "animals", difficulty: 2, audioUrl: placeholderUrl("animals", "horse"), duration: 2, tags: ["neigh"], emoji: "🐴" },
  { id: "an-elephant", name: "Elephant", category: "animals", difficulty: 3, audioUrl: placeholderUrl("animals", "elephant"), duration: 3, tags: ["trumpet"], emoji: "🐘" },
  { id: "an-rooster", name: "Rooster", category: "animals", difficulty: 1, audioUrl: placeholderUrl("animals", "rooster"), duration: 2, tags: ["crow"], emoji: "🐓" },

  // ---- Vehicles ----
  { id: "ve-car", name: "Car Engine", category: "vehicles", difficulty: 1, audioUrl: placeholderUrl("vehicles", "car"), duration: 3, tags: ["vroom"], emoji: "🚗" },
  { id: "ve-motorcycle", name: "Motorcycle", category: "vehicles", difficulty: 2, audioUrl: placeholderUrl("vehicles", "motorcycle"), duration: 3, tags: ["revving"], emoji: "🏍️" },
  { id: "ve-train", name: "Train", category: "vehicles", difficulty: 2, audioUrl: placeholderUrl("vehicles", "train"), duration: 3, tags: ["chugga"], emoji: "🚂" },
  { id: "ve-airplane", name: "Airplane", category: "vehicles", difficulty: 2, audioUrl: placeholderUrl("vehicles", "airplane"), duration: 3, tags: ["jet"], emoji: "✈️" },
  { id: "ve-boat", name: "Boat", category: "vehicles", difficulty: 1, audioUrl: placeholderUrl("vehicles", "boat"), duration: 3, tags: ["horn"], emoji: "🚤" },
  { id: "ve-helicopter", name: "Helicopter", category: "vehicles", difficulty: 3, audioUrl: placeholderUrl("vehicles", "helicopter"), duration: 3, tags: ["chop"], emoji: "🚁" },
  { id: "ve-truck", name: "Truck Horn", category: "vehicles", difficulty: 1, audioUrl: placeholderUrl("vehicles", "truck"), duration: 2, tags: ["honk"], emoji: "🚚" },
  { id: "ve-bicyclebell", name: "Bicycle Bell", category: "vehicles", difficulty: 1, audioUrl: placeholderUrl("vehicles", "bicyclebell"), duration: 1, tags: ["ring"], emoji: "🚲" },
  { id: "ve-ambulance", name: "Ambulance Siren", category: "vehicles", difficulty: 3, audioUrl: placeholderUrl("vehicles", "ambulance"), duration: 3, tags: ["siren"], emoji: "🚑" },
  { id: "ve-rocket", name: "Rocket Launch", category: "vehicles", difficulty: 3, audioUrl: placeholderUrl("vehicles", "rocket"), duration: 3, tags: ["blastoff"], emoji: "🚀" },

  // ---- Technology ----
  { id: "te-oldpc", name: "Old Computer Startup", category: "technology", difficulty: 2, audioUrl: placeholderUrl("technology", "oldpc"), duration: 3, tags: ["boot"], emoji: "🖥️" },
  { id: "te-notification", name: "Notification Sound", category: "technology", difficulty: 1, audioUrl: placeholderUrl("technology", "notification"), duration: 1, tags: ["ping"], emoji: "🔔" },
  { id: "te-robot", name: "Robot Voice", category: "technology", difficulty: 2, audioUrl: placeholderUrl("technology", "robot"), duration: 2, tags: ["beep-boop"], emoji: "🤖" },
  { id: "te-printer", name: "Printer", category: "technology", difficulty: 2, audioUrl: placeholderUrl("technology", "printer"), duration: 3, tags: ["whirr"], emoji: "🖨️" },
  { id: "te-modem", name: "Dial-up Modem", category: "technology", difficulty: 3, audioUrl: placeholderUrl("technology", "modem"), duration: 3, tags: ["screech"], emoji: "📠" },
  { id: "te-keyboard", name: "Mechanical Keyboard", category: "technology", difficulty: 1, audioUrl: placeholderUrl("technology", "keyboard"), duration: 2, tags: ["clack"], emoji: "⌨️" },
  { id: "te-camera", name: "Camera Shutter", category: "technology", difficulty: 1, audioUrl: placeholderUrl("technology", "camera"), duration: 1, tags: ["click"], emoji: "📷" },
  { id: "te-phone", name: "Old Phone Ring", category: "technology", difficulty: 2, audioUrl: placeholderUrl("technology", "phone"), duration: 2, tags: ["ring"], emoji: "☎️" },
  { id: "te-drone", name: "Drone", category: "technology", difficulty: 2, audioUrl: placeholderUrl("technology", "drone"), duration: 3, tags: ["buzz"], emoji: "🛸" },
  { id: "te-lowbattery", name: "Low Battery Beep", category: "technology", difficulty: 1, audioUrl: placeholderUrl("technology", "lowbattery"), duration: 1, tags: ["beep"], emoji: "🔋" },

  // ---- Household ----
  { id: "ho-vacuum", name: "Vacuum Cleaner", category: "household", difficulty: 1, audioUrl: placeholderUrl("household", "vacuum"), duration: 3, tags: ["hum"], emoji: "🧹" },
  { id: "ho-doorbell", name: "Doorbell", category: "household", difficulty: 1, audioUrl: placeholderUrl("household", "doorbell"), duration: 1, tags: ["ding-dong"], emoji: "🔔" },
  { id: "ho-alarm", name: "Alarm Clock", category: "household", difficulty: 1, audioUrl: placeholderUrl("household", "alarm"), duration: 2, tags: ["beeping"], emoji: "⏰" },
  { id: "ho-blender", name: "Blender", category: "household", difficulty: 2, audioUrl: placeholderUrl("household", "blender"), duration: 3, tags: ["whir"], emoji: "🧃" },
  { id: "ho-washingmachine", name: "Washing Machine", category: "household", difficulty: 2, audioUrl: placeholderUrl("household", "washingmachine"), duration: 3, tags: ["spin"], emoji: "🧺" },
  { id: "ho-kettle", name: "Boiling Kettle", category: "household", difficulty: 2, audioUrl: placeholderUrl("household", "kettle"), duration: 3, tags: ["whistle"], emoji: "🫖" },
  { id: "ho-microwave", name: "Microwave Beep", category: "household", difficulty: 1, audioUrl: placeholderUrl("household", "microwave"), duration: 1, tags: ["beep"], emoji: "📻" },
  { id: "ho-toaster", name: "Toaster Pop", category: "household", difficulty: 1, audioUrl: placeholderUrl("household", "toaster"), duration: 1, tags: ["pop"], emoji: "🍞" },
  { id: "ho-creakydoor", name: "Creaky Door", category: "household", difficulty: 2, audioUrl: placeholderUrl("household", "creakydoor"), duration: 2, tags: ["creak"], emoji: "🚪" },
  { id: "ho-clock", name: "Ticking Clock", category: "household", difficulty: 1, audioUrl: placeholderUrl("household", "clock"), duration: 3, tags: ["tick-tock"], emoji: "🕰️" },

  // ---- Funny ----
  { id: "fu-cartoonlaugh", name: "Cartoon Laugh", category: "funny", difficulty: 1, audioUrl: placeholderUrl("funny", "cartoonlaugh"), duration: 2, tags: ["haha"], emoji: "😂" },
  { id: "fu-confused", name: "Confused Person", category: "funny", difficulty: 2, audioUrl: placeholderUrl("funny", "confused"), duration: 2, tags: ["huh"], emoji: "🤨" },
  { id: "fu-sneeze", name: "Sneeze", category: "funny", difficulty: 1, audioUrl: placeholderUrl("funny", "sneeze"), duration: 1, tags: ["achoo"], emoji: "🤧" },
  { id: "fu-scream", name: "Dramatic Scream", category: "funny", difficulty: 2, audioUrl: placeholderUrl("funny", "scream"), duration: 2, tags: ["ahh"], emoji: "😱" },
  { id: "fu-tinyvoice", name: "Tiny Voice", category: "funny", difficulty: 2, audioUrl: placeholderUrl("funny", "tinyvoice"), duration: 2, tags: ["squeak"], emoji: "🐭" },
  { id: "fu-babytalk", name: "Baby Talk", category: "funny", difficulty: 2, audioUrl: placeholderUrl("funny", "babytalk"), duration: 2, tags: ["goo-goo"], emoji: "👶" },
  { id: "fu-evillaugh", name: "Evil Laugh", category: "funny", difficulty: 2, audioUrl: placeholderUrl("funny", "evillaugh"), duration: 2, tags: ["muahaha"], emoji: "😈" },
  { id: "fu-hiccup", name: "Hiccup", category: "funny", difficulty: 1, audioUrl: placeholderUrl("funny", "hiccup"), duration: 1, tags: ["hic"], emoji: "😵" },
  { id: "fu-yawn", name: "Big Yawn", category: "funny", difficulty: 1, audioUrl: placeholderUrl("funny", "yawn"), duration: 2, tags: ["ahh-hmm"], emoji: "🥱" },
  { id: "fu-nervouslaugh", name: "Nervous Laugh", category: "funny", difficulty: 2, audioUrl: placeholderUrl("funny", "nervouslaugh"), duration: 2, tags: ["heh"], emoji: "😅" },

  // ---- Monsters ----
  { id: "mo-alien", name: "Alien", category: "monsters", difficulty: 3, audioUrl: placeholderUrl("monsters", "alien"), duration: 2, tags: ["blip"], emoji: "👽" },
  { id: "mo-growl", name: "Monster Growl", category: "monsters", difficulty: 2, audioUrl: placeholderUrl("monsters", "growl"), duration: 2, tags: ["grr"], emoji: "👹" },
  { id: "mo-zombie", name: "Zombie", category: "monsters", difficulty: 2, audioUrl: placeholderUrl("monsters", "zombie"), duration: 2, tags: ["groan"], emoji: "🧟" },
  { id: "mo-roar", name: "Creature Roar", category: "monsters", difficulty: 3, audioUrl: placeholderUrl("monsters", "roar"), duration: 2, tags: ["roar"], emoji: "🦖" },
  { id: "mo-ghost", name: "Ghost", category: "monsters", difficulty: 2, audioUrl: placeholderUrl("monsters", "ghost"), duration: 2, tags: ["ooooh"], emoji: "👻" },
  { id: "mo-witch", name: "Witch Cackle", category: "monsters", difficulty: 2, audioUrl: placeholderUrl("monsters", "witch"), duration: 2, tags: ["cackle"], emoji: "🧙" },
  { id: "mo-vampire", name: "Vampire Hiss", category: "monsters", difficulty: 2, audioUrl: placeholderUrl("monsters", "vampire"), duration: 2, tags: ["hiss"], emoji: "🧛" },
  { id: "mo-goblin", name: "Goblin", category: "monsters", difficulty: 2, audioUrl: placeholderUrl("monsters", "goblin"), duration: 2, tags: ["cackle"], emoji: "👺" },
  { id: "mo-kraken", name: "Sea Monster", category: "monsters", difficulty: 3, audioUrl: placeholderUrl("monsters", "kraken"), duration: 3, tags: ["roar"], emoji: "🐙" },
  { id: "mo-werewolf", name: "Werewolf Howl", category: "monsters", difficulty: 3, audioUrl: placeholderUrl("monsters", "werewolf"), duration: 2, tags: ["howl"], emoji: "🐺" },

  // ---- Human ----
  { id: "hu-laugh", name: "Laugh", category: "human", difficulty: 1, audioUrl: placeholderUrl("human", "laugh"), duration: 2, tags: ["haha"], emoji: "😆" },
  { id: "hu-cry", name: "Cry", category: "human", difficulty: 2, audioUrl: placeholderUrl("human", "cry"), duration: 2, tags: ["sob"], emoji: "😢" },
  { id: "hu-whistle", name: "Whistle", category: "human", difficulty: 2, audioUrl: placeholderUrl("human", "whistle"), duration: 2, tags: ["tune"], emoji: "😗" },
  { id: "hu-snore", name: "Snore", category: "human", difficulty: 1, audioUrl: placeholderUrl("human", "snore"), duration: 2, tags: ["zzz"], emoji: "😴" },
  { id: "hu-cough", name: "Cough", category: "human", difficulty: 1, audioUrl: placeholderUrl("human", "cough"), duration: 1, tags: ["ahem"], emoji: "🤒" },
  { id: "hu-gasp", name: "Gasp", category: "human", difficulty: 1, audioUrl: placeholderUrl("human", "gasp"), duration: 1, tags: ["gasp"], emoji: "😮" },
  { id: "hu-burp", name: "Burp", category: "human", difficulty: 1, audioUrl: placeholderUrl("human", "burp"), duration: 1, tags: ["urp"], emoji: "🫃" },
  { id: "hu-whisper", name: "Whisper", category: "human", difficulty: 3, audioUrl: placeholderUrl("human", "whisper"), duration: 2, tags: ["shh"], emoji: "🤫" },
  { id: "hu-humming", name: "Humming", category: "human", difficulty: 2, audioUrl: placeholderUrl("human", "humming"), duration: 2, tags: ["hmm"], emoji: "🎵" },
  { id: "hu-clap", name: "Clapping", category: "human", difficulty: 1, audioUrl: placeholderUrl("human", "clap"), duration: 2, tags: ["clap"], emoji: "👏" },
];

export function getChallengePool(categories: CategoryId[] | "mixed", difficulty: Difficulty): Challenge[] {
  let pool = CHALLENGES;
  if (categories !== "mixed" && categories.length > 0) {
    pool = pool.filter((c) => categories.includes(c.category));
  }
  if (difficulty !== "mixed") {
    const target = difficulty === "easy" ? 1 : 3;
    pool = pool.filter((c) => c.difficulty === target || c.difficulty === 2);
  }
  return pool.length > 0 ? pool : CHALLENGES;
}

export function pickRandomChallenges(count: number, categories: CategoryId[] | "mixed", difficulty: Difficulty): Challenge[] {
  const pool = [...getChallengePool(categories, difficulty)];
  const picked: Challenge[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
    if (pool.length === 0) pool.push(...getChallengePool(categories, difficulty)); // wrap if rounds > pool size
  }
  return picked;
}
