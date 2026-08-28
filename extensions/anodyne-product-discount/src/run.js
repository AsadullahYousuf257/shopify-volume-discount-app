// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
// Discount message translations keyed by ISO 639-1 language code.
// Add more entries here whenever a new store/language is onboarded.
const MESSAGES = {
  DA: "Mængderabat spar 37%",           // Danish
  FI: "Volyymialennus säästää 37%",        // Finnish
  FR: "Remise en volume - 37% de réduction", // French
  NL: "Volumekorting bespaart 37%",      // Dutch
  DE: "Mengenrabatt spart 37%",         // German
  EN: "Volume discount save 37%",       // English
  SV: "Volymrabatt sparar 37%",          // Swedish
  NB: "Mengderabatt spar 37%",          // Norwegian (Bokmål)
};

const DEFAULT_MESSAGE = "Volume discount save 37%";

export function run(input) {
  return
  const discounts = [];
  const lines = input?.cart?.lines ?? [];

  // 1st priority: admin-set custom message on the discount
  // 2nd priority: auto-detect from store language
  const customMessage = input?.discountNode?.discountMessage?.value?.trim();
  const langCode = input?.localization?.language?.isoCode ?? "";
  const message = customMessage || MESSAGES[langCode] || DEFAULT_MESSAGE;
  console.log("LANG:" + langCode + " CUSTOM:" + (customMessage || "none") + " MSG:" + message);

  // ---- Alennus lines ----
  const alennusLines = lines.filter((line) => {
    if (line.merchandise.__typename !== "ProductVariant") return false;
    const product = line.merchandise.product;
    return product?.hasAlennus === true;
  });

  const totalQty = alennusLines.reduce((sum, l) => sum + l.quantity, 0);
  console.log("ALENNUS_QTY:" + totalQty);

  // Apply 37% when 2+ Alennus items are in the cart.
  // DiscountApplicationStrategy.All allows coupon codes that have
  // "Product discounts" enabled in their Combinations setting to stack
  // with this discount automatically — no extra code needed here.
  if (totalQty >= 2) {
    for (const line of alennusLines) {
      discounts.push({
        targets: [{ cartLine: { id: line.id } }],
        value: { percentage: { value: "37.0" } },
        message,
      });
    }
  }

  return {
    discounts,
    discountApplicationStrategy: DiscountApplicationStrategy.All,
  };
}
