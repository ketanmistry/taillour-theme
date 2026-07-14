/*
 * UPDATE ITEM QUANTITY
 * Update the quantity for a cart line item.
 */
function updateLineItemQty(el) {
  let key = el.dataset.key;
  let id = el.dataset.id;
  let quantity = el.value;
  let row = el.closest('[data-js="cart-item"]');
  if (quantity != "" && quantity >= 0) {
    let data = {
      id: key,
      quantity: quantity,
    };
    fetch("/cart/change.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((cart) => {
        // console.log(cart); // @debug
        if (quantity > 0) {
          row.querySelectorAll('[data-js="item-total"]').forEach(function (el) {
            // Get details of the updated item.
            let item = cart.items.filter(function (lineitem) {
              if (lineitem.key === key) {
                return lineitem;
              }
            });
            el.innerText = Shopify.formatMoney(item[0].final_line_price);
          });
        } else {
          row.remove();
        }
        // Update the total cart price.
        document.querySelectorAll('[data-js="cart-total"]').forEach(function (el) {
          el.innerText = Shopify.formatMoney(cart.total_price);
        });
        if (typeof window.spendMore === "function") {
          spendMore(cart);
        }
        // Update cart item count.
        _updateCartItemCount(cart.item_count);
        // Display empty cart if no items.
        if (cart.item_count == 0) {
          document.querySelector("#cart-content").innerHTML = emptyCartHtml;
        }
      });
  }
}

/*
 * Cart: Update line item on stepper click.
 */
function qtyStepperHandler(el) {
  setTimeout(updateLineItemQty, 300, el);
}
