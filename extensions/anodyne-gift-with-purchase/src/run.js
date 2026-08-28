// @ts-check
// v12 – Cart Transform is a no-op.
// Gift management is handled entirely by the theme JavaScript snippet
// (anodyne-gift-with-purchase.js) which uses the Storefront Cart API
// (/cart.js, /cart/add.js, /cart/update.js) to add exactly 1 free gift
// per type regardless of qualifying product quantity.
// lineExpand was abandoned because it multiplies every expanded item by
// the parent line's quantity (bundle behaviour), causing gift multiplication
// for qty > 1 — a fundamental platform limitation with no workaround.

export function run(_input) {
  // console.log('_input:', JSON.stringify(_input))
  // console.log("CART_TRANSFORM v12 no-op");
  return { operations: [] };
}
