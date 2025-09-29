// currency converter (works without API key using exchangerate.host)
const currencyFirstEl = document.getElementById("currency-first");
const worthFirstEl = document.getElementById("worth-first");
const currencySecondEl = document.getElementById("currency-second");
const worthSecondEl = document.getElementById("worth-second");
const exchangeRateEl = document.getElementById("exchange-rate");
const swapBtn = document.getElementById("swap-btn");

// runtime state
let currentRate = null;      // rate = 1 firstCurrency = currentRate * secondCurrency
let lastEdited = "first";    // "first" or "second"
const rateCache = {};        // simple in-memory cache by base currency

// fetch full rates for a base currency (uses exchangerate.host — free, no key)
async function fetchRates(base) {
  if (rateCache[base]) return rateCache[base];
  const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Network error: ${res.status}`);
  const data = await res.json();
  if (!data || !data.rates) throw new Error("Invalid response from rates API");
  rateCache[base] = data.rates;
  return data.rates;
}

async function updateRateAndValues() {
  const base = currencyFirstEl.value;
  const target = currencySecondEl.value;
  try {
    exchangeRateEl.innerText = "Loading…";
    const rates = await fetchRates(base);
    const rate = rates[target];
    if (rate == null) throw new Error(`Rate not available for ${base} -> ${target}`);
    currentRate = Number(rate);
    exchangeRateEl.innerText = `1 ${base} = ${currentRate.toFixed(6)} ${target}`;

    // compute depending on which field the user last edited
    if (lastEdited === "first") {
      const a = parseFloat(worthFirstEl.value);
      if (Number.isFinite(a)) worthSecondEl.value = (a * currentRate).toFixed(2);
      else worthSecondEl.value = "";
    } else {
      const b = parseFloat(worthSecondEl.value);
      if (Number.isFinite(b)) worthFirstEl.value = (b / currentRate).toFixed(2);
      else worthFirstEl.value = "";
    }
  } catch (err) {
    console.error(err);
    exchangeRateEl.innerText = "⚠️ Error fetching rates";
    // clear result to avoid confusion
    if (lastEdited === "first") worthSecondEl.value = "";
    else worthFirstEl.value = "";
  }
}

// Events
currencyFirstEl.addEventListener("change", () => {
  // when base changes we should re-fetch rates for new base
  currentRate = null;
  updateRateAndValues();
});
currencySecondEl.addEventListener("change", () => {
  currentRate = null;
  updateRateAndValues();
});

worthFirstEl.addEventListener("input", () => {
  lastEdited = "first";
  if (currentRate != null) {
    const a = parseFloat(worthFirstEl.value);
    worthSecondEl.value = Number.isFinite(a) ? (a * currentRate).toFixed(2) : "";
  } else {
    updateRateAndValues();
  }
});

worthSecondEl.addEventListener("input", () => {
  lastEdited = "second";
  if (currentRate != null) {
    const b = parseFloat(worthSecondEl.value);
    worthFirstEl.value = Number.isFinite(b) ? (b / currentRate).toFixed(2) : "";
  } else {
    // fetch then compute
    updateRateAndValues();
  }
});

// Swap button: swap the currency selections AND swap the numeric values so the shown amounts keep meaning
swapBtn.addEventListener("click", () => {
  const tmpCurrency = currencyFirstEl.value;
  currencyFirstEl.value = currencySecondEl.value;
  currencySecondEl.value = tmpCurrency;

  const tmpVal = worthFirstEl.value;
  worthFirstEl.value = worthSecondEl.value;
  worthSecondEl.value = tmpVal;

  currentRate = null;
  lastEdited = "first";
  updateRateAndValues();
});

// initial load
updateRateAndValues();
