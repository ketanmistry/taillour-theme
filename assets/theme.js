// Define a convenience method and use it like
// ready(() => {...});
var ready = (callback) => {
  if (document.readyState != "loading") callback();
  else document.addEventListener("DOMContentLoaded", callback);
};

/*
 * HISTORY STATE
 * Check if window.history is supported
 */
function historyState() {
  return window.history && window.history.replaceState;
};

/*
 * GET URL PARAMETER
 * Checks for url parameter called `name`.
 */
function getParam(name) {
  if ('URLSearchParams' in window) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  } else {
    // Polyfill for IE11
    var params = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (params == null) {
      return null;
    } else {
      return decodeURI(params[1]) || 0;
    }
  }
}

/*
 * FORMAT MONEY
 * Formats the passed value as money with
 * currency symbol.
 */
function moneyWithCurrency(value) {
  if (value != undefined) {
    let $string = parseFloat(value).toLocaleString("en-GB", { style: "currency", currency: window.Shopify.currency.active });
    return $string;
  }
}

ready(function() {
  /*
   * OPTION SELECTOR
   * Works the variant option dropdowns used on the
   * product page template.
   */
  var variant;
  var options = [];
  options[1] = null;
  options[2] = null;
  options[3] = null;

  var variantOptions = document.querySelectorAll(".js--variant-option");
  variantOptions.forEach(function(el) {
    el.addEventListener("change", function(event) {
      variantOptions.forEach(function(opt) {
        if (opt.tagName.toLowerCase() == 'input' && opt.checked == true) {
          var optionName = opt.getAttribute("name");
          var optionPos = parseInt(optionName.replace("option", ""));
          var optionValue = opt.value;
          options[optionPos] = optionValue;
        }
      });

      variants.filter(function(v) {
        if (v.option1 == options[1] && v.option2 == options[2] && v.option3 == options[3]) {
          variant = v;

          // Update variant id and prices
          var variantPrice = (v.price / 100).toFixed(2);
          document.querySelector("input#js--variant-id").value = v.id;
          document.querySelectorAll(".js--variant-price").forEach(function(el) {
            el.innerHTML = moneyWithCurrency(variantPrice);
          });

          if (v.compare_at_price > v.price) {
            var variantCompareAtPrice = (v.compare_at_price / 100).toFixed(2);
            document.querySelectorAll(".js--variant-compareatprice").forEach(function(el) {
              el.innerText = moneyWithCurrency(variantCompareAtPrice);
            });
          } else {
            document.querySelectorAll(".js--variant-compareatprice").forEach(function(el) {
              el.innerText = "";
            });
          }

          // Update SKU
          document.querySelectorAll('.js--variant-sku').forEach(function(el) {
            el.innerText = variant.sku;
          });

          // Disable the buy button if product is unavailable
          if (v.available === false) {
            document.querySelector("#js--addtocart").disabled = true;
            document.querySelector("#js--addtocart").innerText = "Unavailable";
          } else {
            document.querySelector("#js--addtocart").disabled = false;
            document.querySelector("#js--addtocart").innerText = "Add to cart";
          }

          // Update image
          var imageId = (v.featured_image != null) ? v.featured_image.id : default_image;
          var imageIndex = document
            .querySelector('.product-image-item[data-imageid="' + imageId + '"]')
            .getAttribute("data-index");
          var sliderContainer = document.querySelector(".product-images-component");
          goToImage(imageIndex, sliderContainer);

          // Append the variant ID as a url parameter
          if (v != undefined) {
            if (historyState()) {
              window.history.replaceState({}, document.title, "?variant=" + v.id);
            }
          }
        }
      });
    });
  });
});

/*
 * TOGGLE MOBILE NAV
 * Open/close main nav on mobile. This just applies a class
 * and the rest is done in CSS.
 */
function toggleNav() {
  let nav = document.querySelector('#header-nav');
  nav.classList.toggle('nav-open');
}