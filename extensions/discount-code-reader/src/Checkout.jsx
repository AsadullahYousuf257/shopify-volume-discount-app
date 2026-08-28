import '@shopify/ui-extensions/preact';
import { render } from "preact";
import { useState, useEffect } from "preact/hooks";

export default async () => {
  render(<LineItemPrice />, document.body);
};

function LineItemPrice() {
  const line = shopify.target.value;
  const [compareAtPerUnit, setCompareAtPerUnit] = useState(null);

  // useEffect(() => {
  //   async function fetchCompareAtPrice() {
  //     const variantId = line?.merchandise?.id;
  //     if (!variantId) return;

  //     try {
  //       const result = await shopify.query(
  //         `query getVariantCompareAt($id: ID!) {
  //           node(id: $id) {
  //             ... on ProductVariant {
  //               compareAtPrice {
  //                 amount
  //               }
  //             }
  //           }
  //         }`,
  //         { variables: { id: variantId } }
  //       );

  //       const data = /** @type {any} */ (result)?.data;
  //       const amount = data?.node?.compareAtPrice?.amount;
  //       if (amount) {
  //         setCompareAtPerUnit(parseFloat(amount));
  //       }
  //     } catch (err) {
  //       console.error("compareAtPrice fetch failed:", err);
  //     }
  //   }

  //   fetchCompareAtPrice();
  // }, [line?.merchandise?.id]);

  const currentTotal = Number(line?.cost?.totalAmount?.amount || 0);

  if (!compareAtPerUnit) {
    return null;
  }

  const compareAtTotal = compareAtPerUnit * line.quantity;

  if (compareAtTotal <= currentTotal) {
    return null;
  }

  const currencyCode = line?.cost?.totalAmount?.currencyCode || "";
  const savings = (compareAtTotal - currentTotal).toFixed(2);

  return (
    <s-stack direction="inline" alignItems="center">
      {/* <s-text color="subdued">
        Original Amount: <s-text type="redundant">{compareAtTotal.toFixed(2)} {currencyCode}</s-text>
      </s-text> */}
    </s-stack>
  );
}