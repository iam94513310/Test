(() => {
  const displayEl = document.getElementById("display");
  const expressionEl = document.getElementById("expression");
  const keypad = document.getElementById("keypad");

  const state = {
    current: "0",
    previous: null,
    operator: null,
    overwrite: false,
  };

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "Error";
    const asString = String(value);
    if (asString.includes("e")) return asString;

    const [whole, fraction] = asString.split(".");
    const formattedWhole = Number(whole).toLocaleString("en-US");
    if (fraction === undefined) return formattedWhole;

    const trimmed = fraction.replace(/0+$/, "");
    return trimmed ? `${formattedWhole}.${trimmed}` : formattedWhole;
  }

  function updateDisplay() {
    displayEl.textContent = state.current;
    displayEl.classList.remove("pulse");
    void displayEl.offsetWidth;
    displayEl.classList.add("pulse");

    if (state.previous !== null && state.operator) {
      expressionEl.textContent = `${formatNumber(Number(state.previous))} ${state.operator}`;
    } else {
      expressionEl.textContent = "";
    }
  }

  function inputDigit(digit) {
    if (state.overwrite) {
      state.current = digit;
      state.overwrite = false;
      updateDisplay();
      return;
    }

    if (state.current === "0" && digit !== "0") {
      state.current = digit;
    } else if (state.current === "0" && digit === "0") {
      state.current = "0";
    } else if (state.current.replace(".", "").length >= 12) {
      return;
    } else {
      state.current += digit;
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (state.overwrite) {
      state.current = "0.";
      state.overwrite = false;
      updateDisplay();
      return;
    }
    if (!state.current.includes(".")) {
      state.current += ".";
      updateDisplay();
    }
  }

  function clearAll() {
    state.current = "0";
    state.previous = null;
    state.operator = null;
    state.overwrite = false;
    updateDisplay();
  }

  function toggleSign() {
    if (state.current === "0" || state.current === "Error") return;
    state.current = state.current.startsWith("-")
      ? state.current.slice(1)
      : `-${state.current}`;
    updateDisplay();
  }

  function percent() {
    const value = Number(state.current);
    if (!Number.isFinite(value)) return;
    state.current = String(value / 100);
    state.overwrite = true;
    updateDisplay();
  }

  function compute(a, op, b) {
    switch (op) {
      case "+":
        return a + b;
      case "−":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  }

  function setOperator(op) {
    const currentValue = Number(state.current);
    if (!Number.isFinite(currentValue) && state.current !== "Error") return;

    if (state.operator && state.previous !== null && !state.overwrite) {
      const result = compute(Number(state.previous), state.operator, currentValue);
      if (!Number.isFinite(result)) {
        state.current = "Error";
        state.previous = null;
        state.operator = null;
        state.overwrite = true;
        updateDisplay();
        return;
      }
      state.current = String(Number(result.toPrecision(12)));
      state.previous = state.current;
    } else {
      state.previous = state.current;
    }

    state.operator = op;
    state.overwrite = true;
    updateDisplay();
  }

  function equals() {
    if (state.operator === null || state.previous === null) return;

    const result = compute(
      Number(state.previous),
      state.operator,
      Number(state.current)
    );

    if (!Number.isFinite(result)) {
      state.current = "Error";
    } else {
      state.current = String(Number(result.toPrecision(12)));
    }

    state.previous = null;
    state.operator = null;
    state.overwrite = true;
    expressionEl.textContent = "";
    updateDisplay();
  }

  function pressVisual(button) {
    button.classList.add("is-pressed");
    window.setTimeout(() => button.classList.remove("is-pressed"), 120);
  }

  keypad.addEventListener("click", (event) => {
    const button = event.target.closest("button.key");
    if (!button) return;
    pressVisual(button);

    if (button.dataset.digit !== undefined) {
      inputDigit(button.dataset.digit);
      return;
    }
    if (button.dataset.op) {
      setOperator(button.dataset.op);
      return;
    }

    switch (button.dataset.action) {
      case "clear":
        clearAll();
        break;
      case "sign":
        toggleSign();
        break;
      case "percent":
        percent();
        break;
      case "decimal":
        inputDecimal();
        break;
      case "equals":
        equals();
        break;
      default:
        break;
    }
  });

  const keyMap = {
    Escape: "clear",
    Enter: "equals",
    "=": "equals",
    "%": "percent",
    ".": "decimal",
    "+": "+",
    "-": "−",
    "*": "×",
    "/": "÷",
    x: "×",
    X: "×",
  };

  window.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const { key } = event;

    if (/^\d$/.test(key)) {
      event.preventDefault();
      const button = keypad.querySelector(`[data-digit="${key}"]`);
      if (button) pressVisual(button);
      inputDigit(key);
      return;
    }

    const mapped = keyMap[key];
    if (!mapped) return;
    event.preventDefault();

    if (mapped === "clear") {
      pressVisual(keypad.querySelector('[data-action="clear"]'));
      clearAll();
      return;
    }
    if (mapped === "equals") {
      pressVisual(keypad.querySelector('[data-action="equals"]'));
      equals();
      return;
    }
    if (mapped === "percent") {
      pressVisual(keypad.querySelector('[data-action="percent"]'));
      percent();
      return;
    }
    if (mapped === "decimal") {
      pressVisual(keypad.querySelector('[data-action="decimal"]'));
      inputDecimal();
      return;
    }

    const opButton = keypad.querySelector(`[data-op="${mapped}"]`);
    if (opButton) pressVisual(opButton);
    setOperator(mapped);
  });

  updateDisplay();
})();
