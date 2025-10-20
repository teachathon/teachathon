// // background.js - Runs in background

// // Listen for messages from content scripts
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.type === 'SAVE_CONVERSATION') {
//     saveToStorage(request.data)
//       .then(() => sendResponse({ success: true }))
//       .catch(err => sendResponse({ success: false, error: err.message }));
//     return true; // Async response
//   }
// });

// async function saveToStorage(conversationData) {
//   // Get existing conversations
//   const result = await chrome.storage.local.get(['conversations']);
//   const conversations = result.conversations || [];
  
//   // Add new conversation
//   const conversationId = generateId();
//   conversations.push({
//     id: conversationId,
//     ...conversationData
//   });
  
//   // Save back to storage
//   await chrome.storage.local.set({ conversations: conversations });
  
//   console.log('Conversation saved:', conversationId);
// }

// function generateId() {
//   return Date.now().toString(36) + Math.random().toString(36).substr(2);
// }

// // Optional: Expose API via chrome.runtime for external access
// chrome.runtime.onMessageExternal.addListener(
//   (request, sender, sendResponse) => {
//     if (request.type === 'GET_CONVERSATIONS') {
//       chrome.storage.local.get(['conversations'], (result) => {
//         sendResponse({ conversations: result.conversations || [] });
//       });
//       return true;
//     }
//   }
// );

importScripts("../modules/store.js")

// import {settingsEnum, readSettings} from "../modules/store.js";

const messagesExample = [
  {"conv_id": 0, "role": "user", "content": "Hey, can you tell me a bit about dinosaurs?"},
  {"conv_id": 0, "role": "assistant", "content": "Of course! 🦖 Dinosaurs are one of the most fascinating groups of animals in Earth’s history — here’s a quick breakdown:\n\n🦕 What They Were\n\nDinosaurs were reptiles that dominated the planet for over 160 million years, from about 230 million to 66 million years ago, during the Mesozoic Era (which is split into three periods — Triassic, Jurassic, and Cretaceous).\n\nThey weren’t all huge monsters — they came in all shapes and sizes, from chicken-sized raptors to towering sauropods the length of a football field.\n\n🧬 Types of Dinosaurs\n\nScientists usually split them into two main groups based on their hip structure:\n\nSaurischians (“lizard-hipped”)\n\nIncluded theropods (like Tyrannosaurus rex and Velociraptor) and sauropods (like Brachiosaurus).\n\nInterestingly, birds evolved from small theropod dinosaurs — meaning technically, birds are modern dinosaurs.\n\nOrnithischians (“bird-hipped”)\n\nIncluded plant-eaters like Stegosaurus, Triceratops, and Ankylosaurus.\n\nDespite the name “bird-hipped,” birds didn’t come from this group!\n\n🌍 How They Lived\n\nDinosaurs lived in almost every kind of environment — forests, deserts, plains — and were found on every continent (yes, even Antarctica).\nThey laid eggs, and many species are thought to have cared for their young. Some were warm-blooded, some cold-blooded, and some possibly a mix depending on their size and activity.\n\n💥 The Extinction\n\nAround 66 million years ago, a mass extinction event wiped out most dinosaurs. The leading theory is an asteroid impact near what is now Chicxulub, Mexico, which caused massive climate shifts.\nHowever, birds survived, carrying the dinosaur legacy into the modern age.\n\n🔬 Fun Facts\n\nThe largest known dinosaur is probably Argentinosaurus, estimated at over 30 meters (100 ft) long.\n\nThe smallest was Microraptor, about the size of a crow.\n\nSome dinosaurs had feathers, not just scales.\n\nThey communicated, migrated, and possibly even danced to attract mates.\n\nWould you like me to focus on a particular area next — like predators, feathered dinosaurs, the extinction, or how we know what they looked like?"},
  {"conv_id": 0, "role": "user", "content": "What were the different periods when dinosaurs lived?"},
  {"conv_id": 0, "role": "assistant", "content": "Excellent question — that’s one of the best ways to understand the dinosaur timeline! 🦕\n\nDinosaurs lived during the Mesozoic Era, which lasted from about 252 to 66 million years ago.\nThis era is often called “The Age of Dinosaurs”, and it’s split into three major periods:\n\n🟥 1. Triassic Period (≈ 252 – 201 million years ago)\n\nKey facts:\n\nDinosaurs first appeared near the end of the Triassic, around 230 million years ago.\n\nThe world was mostly one giant supercontinent called Pangaea, so dinosaurs could spread widely.\n\nEarly dinosaurs were relatively small and fast, like Eoraptor and Coelophysis.\n\nThe first mammals and flying reptiles (pterosaurs) also appeared.\n\nEnded with a mass extinction, wiping out many early reptiles and clearing the way for dinosaurs to dominate.\n\n🟩 2. Jurassic Period (≈ 201 – 145 million years ago)\n\nKey facts:\n\nDinosaurs became the dominant land animals.\n\nPangaea split into two continents: Laurasia (north) and Gondwana (south).\n\nThe famous giant sauropods (like Brachiosaurus and Diplodocus) and predators (like Allosaurus) appeared.\n\nThe first birds evolved from small theropods — Archaeopteryx is a famous example.\n\nThe climate was warm and lush, leading to huge forests and lots of plant life.\n\n🟦 3. Cretaceous Period (≈ 145 – 66 million years ago)\n\nKey facts:\n\nDinosaurs reached their greatest diversity.\n\nIconic species like Tyrannosaurus rex, Triceratops, and Velociraptor lived during this time.\n\nFlowering plants (angiosperms) appeared and began changing ecosystems.\n\nContinents drifted closer to their modern positions.\n\nEnded with the mass extinction (the asteroid impact) that wiped out most dinosaurs.\n\n🌍 Summary Timeline\nPeriod\tTime (million years ago)\tHighlights\nTriassic\t252–201\tFirst dinosaurs appear\nJurassic\t201–145\tDinosaurs dominate, first birds\nCretaceous\t145–66\tPeak diversity, ends with mass extinction\n\nWould you like me to show you a visual timeline or a map of how the continents looked during those periods? It really helps to picture how their world changed."},
  {"conv_id": 0, "role": "user", "content": "How big were the largest dinosaurs?"},
  {"conv_id": 0, "role": "assistant", "content": "The largest dinosaurs were absolutely gigantic, some of the most massive land animals to ever walk the Earth. Let’s break it down:\n\n🦕 Sauropods – The Giants of Size\n\nThese were the long-necked, long-tailed plant-eaters. They weren’t fast, but they were colossal.\n\nArgentinosaurus\n\nLength: ~30–35 meters (100–115 ft)\n\nWeight: ~70–100 tons\n\nLived in South America during the Late Cretaceous.\n\nPatagotitan\n\nLength: ~31 meters (102 ft)\n\nWeight: ~70 tons\n\nAnother South American giant, very similar to Argentinosaurus.\n\nDiplodocus\n\nLength: ~27 meters (88 ft)\n\nWeight: ~15–20 tons\n\nLonger than most but much lighter than Argentinosaurus, with a slender body.\n\nBrachiosaurus\n\nLength: ~25 meters (82 ft)\n\nWeight: ~35–40 tons\n\nStood taller than other sauropods because of its long neck and upright posture.\n\n🦖 Largest Predators\n\nEven the big meat-eaters, while huge, were smaller than the largest sauropods:\n\nSpinosaurus\n\nLength: ~15–18 meters (50–60 ft)\n\nWeight: ~7–20 tons\n\nSemi-aquatic hunter from the Cretaceous of North Africa.\n\nTyrannosaurus rex\n\nLength: ~12–13 meters (40–43 ft)\n\nWeight: ~8–10 tons\n\nThe classic apex predator of the Late Cretaceous in North America.\n\nGiganotosaurus\n\nLength: ~13 meters (43 ft)\n\nWeight: ~8 tons\n\nLived in South America, slightly bigger than T. rex in length, but lighter.\n\n⚖️ Perspective\n\nA single Argentinosaurus could weigh as much as 10 elephants.\n\nA T. rex was about the size of a school bus, while Argentinosaurus could stretch over 3 school buses long.\n\nIf you want, I can make a visual comparison chart showing the largest dinosaurs next to humans and modern animals — it’s mind-blowing how massive they were. Do you want me to do that?"},
  {"conv_id": 0, "role": "user", "content": "What about the most famous predators?"},
  {"conv_id": 0, "role": "assistant", "content": "Ah, now we’re getting into the “scary and cool” side of dinosaurs 🦖🔥. The most famous predators were mostly theropods, the bipedal meat-eaters. Here’s a rundown:\n\n1. Tyrannosaurus rex (“T. rex”)\n\nTime: Late Cretaceous (~68–66 million years ago)\n\nLocation: North America\n\nSize: ~12–13 m (40–43 ft) long, 8–10 tons\n\nDiet: Large herbivores (like Triceratops)\n\nFun fact: Had one of the strongest bite forces of any land animal ever — enough to crush bones!\n\n2. Velociraptor\n\nTime: Late Cretaceous (~75–71 million years ago)\n\nLocation: Mongolia\n\nSize: ~2 m (6–7 ft) long, 15–20 kg\n\nDiet: Small animals, possibly hunted in packs\n\nFun fact: Contrary to movies, they were feathered and about the size of a turkey, not a human.\n\n3. Spinosaurus\n\nTime: Cretaceous (~112–93 million years ago)\n\nLocation: North Africa\n\nSize: ~15–18 m (50–60 ft) long, 7–20 tons\n\nDiet: Fish and other aquatic animals — semi-aquatic predator\n\nFun fact: It had a long, crocodile-like snout and a distinctive sail on its back.\n\n4. Giganotosaurus\n\nTime: Late Cretaceous (~98 million years ago)\n\nLocation: Argentina\n\nSize: ~13 m (43 ft) long, ~8 tons\n\nDiet: Large herbivores, like sauropods\n\nFun fact: Slightly bigger than T. rex in length, but not as heavy or powerful.\n\n5. Allosaurus\n\nTime: Late Jurassic (~155–145 million years ago)\n\nLocation: North America and Europe\n\nSize: ~8–12 m (26–39 ft) long\n\nDiet: Medium-sized herbivores\n\nFun fact: Sometimes called the “T. rex of the Jurassic” — it was a top predator of its time.\n\n🔥 Key Predator Traits\n\nSharp teeth and claws\n\nBipedal for speed and agility\n\nExcellent vision and sense of smell\n\nMany were active hunters, some may have scavenged too\n\nIf you want, I can make a visual lineup of the most famous predators to show just how they compare in size — humans included for scale. It’s really eye-opening.\n\nDo you want me to do that?"},
  {"conv_id": 0, "role": "user", "content": "Thanks for all this information! This was really helpful."},
  {"conv_id": 0, "role": "assistant", "content": "You’re very welcome! 😄 I’m glad it was helpful — dinosaurs are endlessly fascinating, and there’s always more to discover about them.\n\nIf you ever want, we can dive into weird dinosaur facts, feathered species, or even how scientists figure out what they looked like. Or, I can make some visual comparisons that really show how massive or strange they were.\n\nDo you want to explore any of those next?"}
]

readSettings().then((settingValues) => {
  const requestBody = {
    "user_email": settingValues[settingsEnum.EMAIL_KEY],
    "num_mcq": settingValues[settingsEnum.MCQ_KEY],
    "num_open": settingValues[settingsEnum.OPEN_ENDED_KEY],
    "messages": messagesExample
  }
  return fetch("http://127.0.0.1:8000/receive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  }).then((response) => {
    console.log(response);
  });
});
