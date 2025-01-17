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
 * Formats the passed value as money with currency symbol.
 * Referenced from https://gist.github.com/stewartknapman/8d8733ea58d2314c373e94114472d44c
 */
var Shopify = Shopify || {};
Shopify.money_format = "${{amount}}";
Shopify.formatMoney = function(cents, format) {
  if (typeof cents == 'string') { cents = cents.replace('.', ''); }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = (format || this.money_format);

  function defaultOption(opt, def) {
    return (typeof opt == 'undefined' ? def : opt);
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ',');
    decimal = defaultOption(decimal, '.');

    if (isNaN(number) || number == null) { return 0; }

    number = (number / 100.0).toFixed(precision);

    var parts = number.split('.'),
      dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
      cents = parts[1] ? (decimal + parts[1]) : '';

    return dollars + cents;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
  }

  return formatString.replace(placeholderRegex, value);
};


/*
 * OPTION SELECTOR
 * Works the variant option dropdowns used on the
 * product page template.
 */
ready(function() {
  var variant;
  var options = [];
  options[1] = null;
  options[2] = null;
  options[3] = null;

  var variantOptions = document.querySelectorAll(".js--variant-option");
  variantOptions.forEach(function(el) {
    el.addEventListener("change", function(event) {
      // Disable non-existent variant options.
      checkVariants();

      // Set the chosen options.
      variantOptions.forEach(function(opt) {
        if (opt.tagName.toLowerCase() == 'input' && opt.checked == true) {
          var optionName = opt.getAttribute("name");
          var optionPos = parseInt(optionName.replace("option", ""));
          var optionValue = opt.value;
          options[optionPos] = optionValue;
        }
      });

      // Loop through the variants and get the selected one.
      variants.filter(function(v) {
        if (v.option1 == options[1] && v.option2 == options[2] && v.option3 == options[3]) {
          variant = v;

          // Update variant id and prices
          document.querySelector("input#js--variant-id").value = v.id;
          // The following is used for the "purchase together" feature.
          document.querySelectorAll('input[type="checkbox"].js--variant-id').forEach(function(el) {
            el.value = v.id;
            el.setAttribute('data-price', v.price);
            if (v.available == true) {
              el.checked = true;
              el.disabled = false;
            } else {
              el.checked = false;
              el.disabled = true;
            }
          });
          document.querySelectorAll(".js--variant-price").forEach(function(el) {
            el.innerHTML = Shopify.formatMoney(v.price);
          });

          if (v.compare_at_price > v.price) {
            document.querySelectorAll(".js--variant-compareatprice").forEach(function(el) {
              el.innerText = Shopify.formatMoney(v.compare_at_price);
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
 * CHECK VARIANT EXISTS
 * This checks if the variant actually exists - e.g you may have small, medium,
 * and large in blue and black, but blue/medium is not a variant. Disables the
 * related inputs.
 */
function checkVariants() {
  let $this = event.target;
  if ($this !== undefined) {
    let availableVariants = new Set();
    variants.filter(function(variant, k) {
      if (variant[$this.name] == $this.value) {
        availableVariants.add(variant);
      }
    });

    // Loop through the array above to create an array containing available
    // option values.
    let optionGroups = {};
    availableVariants.forEach(function(variant) {
      let options = Object.entries(variant);
      for (const [key, value] of options) {
        if (value != null) {
          if (optionGroups[key] == undefined) {
            optionGroups[key] = [];
          }
          if (optionGroups[key].includes(value) == false) {
            optionGroups[key].push(value);
          }
        }
      }
    });

    // Then, loop through each input and check if its value is in the optionGroups
    // array created above, ignoring the clicked option group.
    document.querySelectorAll(".js--variant-option").forEach(function(input) {
      if (input.name != $this.name) {
        if (optionGroups[input.name].includes(input.value) == false) {
          input.disabled = true;
          input.checked = false;
        } else {
          input.disabled = false;
        }
      }
    });
  }

  // Check a valid option is selected for each group.
  document.querySelectorAll(".js--variant-options").forEach(function(group) {
    let firstAvailable = null;
    let checkedOptions = group.querySelectorAll('.js--variant-option:checked').length;
    if (checkedOptions == 0) {
      firstAvailable = group.querySelectorAll(".js--variant-option:not(:disabled)")[0];
    }
    if (firstAvailable != null) {
      firstAvailable.checked = true;
    }
  });
}

/*
 * TOGGLE MOBILE NAV
 * Open/close main nav on mobile. This just applies a class
 * and the rest is done in CSS.
 */
function toggleNav() {
  let nav = document.querySelector('#header-nav');
  nav.classList.toggle('nav-open');
}