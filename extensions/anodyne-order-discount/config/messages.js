const DEFAULT_MESSAGE = "Volume discount save 37%";
const DEFAULT_FREE_MESSAGE = "Free Gift";

const FREE_MESSAGES = {
  DA: "Gratis produkter",
  DE: "Kostenlose Produkte",
  NL: "Gratis producten",
  FR: "Produits gratuits",
  FI: "Ilmaiset tuotteet",
  SV: "Gratis produkter",
}


const MESSAGES = {
  DA: "Mængderabat spar :percentage%",           // Danish
  FI: "Volyymialennus säästää :percentage%",        // Finnish
  FR: "Remise en volume - :percentage% de réduction", // French
  NL: "Volumekorting bespaart :percentage%",      // Dutch
  DE: "Mengenrabatt spart :percentage%",         // German
  EN: "Volume discount save :percentage%",       // English
  SV: "Volymrabatt sparar :percentage%",          // Swedish
  NB: "Mengderabatt spar :percentage%",          // Norwegian (Bokmål)
};

export {
  DEFAULT_MESSAGE,
  DEFAULT_FREE_MESSAGE,
  MESSAGES,
  FREE_MESSAGES
}