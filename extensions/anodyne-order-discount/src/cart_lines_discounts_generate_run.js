import {
  DiscountClass,
  OrderDiscountSelectionStrategy,
  ProductDiscountSelectionStrategy
} from '../generated/api';

import { DISCOUNT_CODES } from '../config/discount';
import { DEFAULT_MESSAGE, MESSAGES, FREE_MESSAGES, DEFAULT_FREE_MESSAGE } from '../config/messages';

export function cartLinesDiscountsGenerateRun(input) {

  const operations = [];
  const productDiscountCandidates = [];

  if (!input.cart.lines.length) {
    return { operations };
  }

  // =========================
  // Custom Discount Data
  // =========================

  const appliedNativeDiscountCodes =
    input.enteredDiscountCodes || [];

  const websiteKey =
    input?.cart?.discount_site?.value?.trim()?.toUpperCase() || '';

  // const tempDiscountCode =
  //   input?.cart?.temp_code?.value?.trim()?.toUpperCase() || '';
  // console.log("tempDiscountCode: ", tempDiscountCode);

  const customerDiscountCode =
    input?.cart?.discount_code?.value?.trim()?.toUpperCase() || '';

  const websiteDiscountConfig =
    DISCOUNT_CODES[websiteKey] || {};


  const capCodes = websiteDiscountConfig.cap || {};

  const isCapCode =
    Object.prototype.hasOwnProperty.call(capCodes, customerDiscountCode);

  const discountPercentage = !isCapCode
    ? (websiteDiscountConfig[customerDiscountCode] || null)
    : null;

  const discountFixedAmount = isCapCode
    ? capCodes[customerDiscountCode]
    : null;

  // console.log('isCapCode:', isCapCode); //DEBUG
  // console.log('discountPercentage:', discountPercentage); //DEBUG
  // console.log('discountFixedAmount:', JSON.stringify(discountFixedAmount)); //DEBUG

  // =========================
  // Discount Class Validation
  // =========================

  const hasOrderDiscountClass =
    input.discount.discountClasses.includes(
      DiscountClass.Order
    );

  if (!hasOrderDiscountClass) {
    return { operations };
  }


  const getLines = (tag) =>
    input.cart.lines.filter(
      (line) =>
        line.merchandise?.__typename === 'ProductVariant' &&
        line.merchandise?.product?.[tag]
    );

  // Track which line IDs get a 100% free-gift discount
  const freeLineIds = new Set();

  [
    ['hasBook', 'hasFreeBook'],
    ['hasPosShirt', 'hasFreeBag'],
  ].forEach(([trigger, reward]) => {
    const rewardLines = getLines(reward);
    if (getLines(trigger).length && rewardLines.length) {
      const languageCode =
        input?.localization?.language?.isoCode ?? '';
      const discountMessage =
        FREE_MESSAGES[languageCode] || DEFAULT_FREE_MESSAGE;

      rewardLines.forEach((line) => freeLineIds.add(line.id));

      productDiscountCandidates.push(
        ...rewardLines.map((line) => ({
          message: discountMessage,
          targets: [{ cartLine: { id: line.id } }],
          value: { percentage: { value: 100 } },
        }))
      );
    }
  });

  // =========================
  // Alennus Products (37%)
  // Qty >= 2
  // =========================
  const alennusLines = input.cart.lines.filter(
    (line) =>
      line.merchandise?.__typename === 'ProductVariant' &&
      line.merchandise?.product?.hasAlennus
  );

  const alennusQuantity = alennusLines.reduce(
    (sum, line) => sum + line.quantity,
    0
  );

  const alennusLineIds = new Set();
  const alennusApplies = alennusQuantity >= 2;
  var effectivePercentage = 37;
  if (alennusApplies) {
    const languageCode =
      input?.localization?.language?.isoCode ?? '';
    const discountMessage =
      MESSAGES[languageCode] || DEFAULT_MESSAGE;

    alennusLines.forEach((line) => alennusLineIds.add(line.id));

    productDiscountCandidates.push(
      ...alennusLines.map((line) => {
        // console.log("line: ", JSON.stringify(line)); //DEBUG
        const currentPrice = parseFloat(line?.cost?.amountPerQuantity?.amount || 0);
        const compareAtPrice = line?.cost?.compareAtAmountPerQuantity?.amount
          ? parseFloat(line.cost.compareAtAmountPerQuantity.amount)
          : null;

        effectivePercentage = parseFloat(line?.merchandise?.product?.alennusPercentage?.value || 37);
        if (compareAtPrice /* && compareAtPrice > currentPrice && currentPrice > 0 */) {
          const alreadyDiscountedPercent = ((compareAtPrice - currentPrice) / compareAtPrice) * 100;
          console.log("already discounted", alreadyDiscountedPercent.toFixed(2)); //DEBUG

          const pay_percentage = (100 - effectivePercentage) / 100;
          const targetPrice = (compareAtPrice * pay_percentage);
          effectivePercentage = ((currentPrice - targetPrice) / currentPrice) * 100;

          if (effectivePercentage < 0) {
            effectivePercentage = 0;
          }
        }
        const rawPercentage = parseFloat(
          line?.merchandise?.product?.alennusPercentage?.value || 37
        );
        const finalMessage = discountMessage.replace(':percentage', rawPercentage.toFixed(0));
        return {
          message: finalMessage,
          targets: [
            {
              cartLine: {
                id: line.id,
              },
            },
          ],
          value: {
            percentage: {
              value: effectivePercentage,
            },
          },
        };
      })
    );
  }
  console.log("effectivePercentage: ", effectivePercentage); //DEBUG
  // =========================
  // Add Product Discounts
  // =========================

  if (productDiscountCandidates.length > 0) {
    operations.push({
      productDiscountsAdd: {
        candidates: productDiscountCandidates,
        selectionStrategy:
          ProductDiscountSelectionStrategy.All,
      },
    });
  }

  // =========================
  // Native Shopify Discount Found
  // Skip Custom Order Discount
  // =========================

  if (appliedNativeDiscountCodes.length > 0) {
    return { operations };
  }


  // =========================
  // Calculate true post-discount subtotal
  // =========================
  if (isCapCode) {
    const trueSubtotal = input.cart.lines.reduce((sum, line) => {
      const lineAmount = parseFloat(line?.cost?.totalAmount?.amount || 0);
      let lineDiscountPercent = 0;
      if (freeLineIds.has(line.id)) {
        lineDiscountPercent = 100;
      } else if (alennusLineIds.has(line.id)) {
        lineDiscountPercent = effectivePercentage;
      }
      const discountedLineAmount = lineAmount * (1 - lineDiscountPercent / 100);
      return sum + discountedLineAmount;
    }, 0);
    console.log('trueSubtotal', trueSubtotal); //DEBUG

    // =========================
    // Custom Order Discount
    // (percentage OR fixed cap amount)
    // =========================

    if (discountFixedAmount && Object.keys(discountFixedAmount).length) {
      if (trueSubtotal >= discountFixedAmount['min_purchase']) {
        operations.push({
          orderDiscountsAdd: {
            candidates: [
              {
                message: customerDiscountCode,
                targets: [
                  {
                    orderSubtotal: {
                      excludedCartLineIds: [],
                    },
                  },
                ],
                value: {
                  fixedAmount: {
                    amount: discountFixedAmount['discounted_value'],
                  },
                },
              },
            ],
            selectionStrategy:
              OrderDiscountSelectionStrategy.First,
          },
        });
      } else {
        console.log('cap discount not applied');
      }
    }
  } else if (discountPercentage) {
    operations.push({
      orderDiscountsAdd: {
        candidates: [
          {
            message: customerDiscountCode,
            targets: [
              {
                orderSubtotal: {
                  excludedCartLineIds: [],
                },
              },
            ],
            value: {
              percentage: {
                value: discountPercentage,
              },
            },
          },
        ],
        selectionStrategy:
          OrderDiscountSelectionStrategy.First,
      },
    });
  }

  return { operations };
}