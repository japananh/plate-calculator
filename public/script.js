const MODES = Object.freeze({
  single: "single",
  range: "range",
});

let mode = "";
let barbels = [];
let plates = [];
let result = {};

setup();

$(document).on("keypress", handlePressEnter);
$('input[name="mode"]').on("keypress", handlePressEnter);
$('input[name="barbels"]').on("keypress", handlePressEnter);
$('input[name="plates"]').on("keypress", handlePressEnter);

$('input[name="mode"]').on("click", handleMode);
$('input[name="barbels"]').on("click", handleBarbels);
$('input[name="plates"]').on("change", handlePlates);

$("#submit").on("click", submit);

function setup() {
  mode = getLocalStorage("mode") || MODES.single;
  barbels = getLocalStorage("barbels") || [15];
  plates = getLocalStorage("plates") || [
    [25, 0],
    [20, 2],
    [15, 2],
    [10, 2],
    [5, 2],
    [2.5, 0],
    [2, 4],
    [1, 2],
    [0.5, 2],
    [0.25, 0],
  ];

  $(`#input-${mode}`).prop("checked", true);
  barbels.forEach((item) => {
    $(`#barbel${item}`).prop("checked", true);
  });

  genWeightInput(mode);

  plates.forEach((plate, _) => {
    $(`#${genId(plate[0])}`).val(plate[1]);
  });
}

function handlePressEnter(e) {
  if (e.which == 13) {
    submit(e);
    saveSettings();
  }
}

function genWeightInput(mode) {
  const $el = $("#mode");

  if (mode === MODES.single) {
    const target = getLocalStorage("target") || null;
    const $singleDiv = `<div class="single mb-3 input-group input-group-sm">
      <label for="target" class="input-group-text">Target weight (kg): </label>
      <input id="target" class="form-control" value="${target}" min="15" step="0.5" type="number" autofocus required></input><br>
    </div>`;

    $(".single").remove();
    $(".range").remove();
    $el.after($singleDiv);
    return;
  }

  if (mode === MODES.range) {
    const from = getLocalStorage("from") || null;
    const to = getLocalStorage("to") || null;

    const $rangeDiv = `<div class="range mb-3">
      <div class="input-group input-group-sm mb-1">
        <label for="from" class="input-group-text">From (kg) </label>
        <input id="from" class="form-control" value="${from}" min="15" step="0.5" type="number" autofocus required></input><br>
      </div>

      <div class="input-group input-group-sm mb-1">
        <label for="to" class="input-group-text">To (kg) </label>
        <input id="to" class="form-control" value="${to}" min="15" step="0.5" type="number" autofocus required></input><br>
      </div>
    </div>`;

    $(".single").remove();
    $(".range").remove();
    $el.after($rangeDiv);
    return;
  }
}

function handleMode(e) {
  const target = e.currentTarget;

  if ($(target).is(":checked")) {
    mode = $(target).val();
    genWeightInput(mode);
  }

  saveToLocalStorage("mode", mode);
}

function handleBarbels(e) {
  const target = e.currentTarget;
  const val = Number($(target).val() || 0);

  if ($(target).is(":checked")) {
    if (val && !barbels.includes(val)) {
      barbels.push(val);
      barbels = barbels.sort((a, b) => b - a);
    }
  } else {
    barbels = barbels.filter((item) => item !== val);
  }

  saveToLocalStorage("barbels", barbels);
}

function handlePlates(e) {
  const target = e.currentTarget;
  const val = Number($(target).val() || 0);
  const id = $(target).attr("id");
  const index = plates.findIndex((plate) => genId(plate[0]) === id);
  plates[index][1] = val;

  saveToLocalStorage("plates", plates);
}

function submit(e) {
  e.preventDefault();

  $(".result").remove();

  if (mode === MODES.range) {
    const from = Number($("#from").val());
    const to = Number($("#to").val());
    let invalidList = [];
    for (let i = from; i <= to; i++) {
      const result = calculate(i, barbels, plates);
      if (result.length === 0) invalidList.push(i);
    }
    genInvalidResult(invalidList);
  } else if (mode === MODES.single) {
    const target = Number($("#target").val());
    const result = calculate(target, barbels, plates);
    genUI(result);
  }

  saveSettings();
}

function calculate(target, barbels, plates) {
  const result = [];

  if (!target || !barbels || !plates || barbels.length === 0) {
    return result;
  }

  let holder = target;

  barbels.every((barbel) => {
    if (barbel <= target) {
      holder -= barbel;
      result.push([barbel, 1]);
      return false;
    }
    return true;
  });

  if (holder === target) return result;

  plates.forEach((plate) => {
    const weight = plate[0];
    let amount = 0;

    while (amount <= plate[1] - 2 && holder >= weight * 2) {
      holder -= weight * 2;
      amount += 2;
    }

    if (amount) {
      result.push([weight, amount]);
    }
  });

  if (holder === 0) return result;

  return [];
}

function genUI(result) {
  const classname = "result";

  if (result.length === 0) {
    $(".container").append(
      `<div class="${classname} mt-3 text-danger">Cannot calculate result from your plates!</div>`
    );
    return;
  }

  $(".container").append(`<div class="${classname} mt-3"></div>`);

  result.forEach((item, i) => {
    const weight = item[0];
    let amount = item[1];

    while (amount >= 1) {
      amount -= i === 0 ? 1 : 2;
      const $div = $("<div>", {
        class: i === 0 ? `barbel barbel${weight}` : `plate plate${weight}-${i}`,
        css: { height: i === 0 ? "" : genHeight(weight) },
        text: weight,
      });
      $(`.${classname}`).append($div);
    }
  });
}

function genInvalidResult(invalidList) {
  if (invalidList.length === 0) {
    return $(".container").append(
      `<div class="result mt-3 text-success">No weight cannot be calculated. Great jobs!</div>`
    );
  }
  $(".container").append(`
        <div class="result mt-3 d-block">
          These <b>${invalidList.length}</b> weights can not be calculated:
          <div class="text-secondary">${invalidList.join(", ")}</div>
        </div>`);
}

function genHeight(weight) {
  if (weight >= 10) return weight * 9;
  if (weight === 0.25) return weight * 65;
  if (weight === 0.5) return weight * 45;
  if (weight === 1) return weight * 35;
  if (weight === 2.5) return weight * 20;
  if (weight === 2) return weight * 20;
  return weight * 13;
}

function genId(weight) {
  return String(weight).replace(".", "-");
}

function saveSettings() {
  saveToLocalStorage("mode", mode);
  saveToLocalStorage("plates", plates);
  saveToLocalStorage("barbels", barbels);

  if (mode === MODES.range) {
    const from = Number($("#from").val());
    const to = Number($("#to").val());
    saveToLocalStorage("from", from);
    saveToLocalStorage("to", to);
  } else if (mode === MODES.single) {
    const target = Number($("#target").val());
    saveToLocalStorage("target", target);
  }
}

function saveToLocalStorage(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function getLocalStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (_e) {
    return "";
  }
}
