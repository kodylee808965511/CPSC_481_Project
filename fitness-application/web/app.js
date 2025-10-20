(function () {
  const form = document.getElementById('calc-form');
  const units = () => document.querySelector('input[name="units"]:checked').value;
  const ageEl = document.getElementById('age');
  const sexEl = document.getElementById('sex');
  const heightEl = document.getElementById('height');
  const weightEl = document.getElementById('weight');
  const heightUnit = document.getElementById('height-unit');
  const weightUnit = document.getElementById('weight-unit');
  const bmiValue = document.getElementById('bmi-value');
  const bmiCategory = document.getElementById('bmi-category');
  const bfpValue = document.getElementById('bfp-value');
  const bfpCategory = document.getElementById('bfp-category');
  const resetBtn = document.getElementById('reset');

  function parsePositive(el) {
    const v = Number(el.value);
    return Number.isFinite(v) && v > 0 ? v : null;
  }

  function toKg(w, metric) { return metric ? w : w * 0.45359237; }
  function toCm(h, metric) { return metric ? h : h * 2.54; }
  function bmi(weightKg, heightCm) {
    const m = heightCm / 100;
    return weightKg / (m * m);
  }
  function bfpDeurenberg(bmi, age, isMale) {
    const sex = isMale ? 1 : 0;
    return 1.20 * bmi + 0.23 * age - 10.8 * sex - 5.4;
  }
  function bmiCat(b) {
    if (b < 18.5) return 'Underweight';
    if (b < 25) return 'Normal';
    if (b < 30) return 'Overweight';
    return 'Obese';
  }
  function bfpCat(isMale, b) {
    if (isMale) {
      if (b < 2) return 'Below essential';
      if (b <= 5) return 'Essential';
      if (b <= 13) return 'Athletes';
      if (b <= 17) return 'Fitness';
      if (b <= 24) return 'Average';
      return 'Obese';
    } else {
      if (b < 10) return 'Below essential';
      if (b <= 13) return 'Essential';
      if (b <= 20) return 'Athletes';
      if (b <= 24) return 'Fitness';
      if (b <= 31) return 'Average';
      return 'Obese';
    }
  }
  function fmt1(x) { return x.toFixed(1); }
  function setCatClass(el, label) {
    el.classList.remove('cat-ok', 'cat-warn', 'cat-bad');
    const l = label.toLowerCase();
    if (l.includes('normal') || l.includes('fitness') || l.includes('athlete')) el.classList.add('cat-ok');
    else if (l.includes('overweight') || l.includes('average') || l.includes('essential')) el.classList.add('cat-warn');
    else if (l.includes('obese') || l.includes('below')) el.classList.add('cat-bad');
  }

  function updateUnitLabels() {
    const metric = units() === 'metric';
    heightUnit.textContent = metric ? 'cm' : 'in';
    weightUnit.textContent = metric ? 'kg' : 'lb';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const metric = units() === 'metric';
    const age = Number(ageEl.value);
    const isMale = sexEl.value === 'male';
    const h = parsePositive(heightEl);
    const w = parsePositive(weightEl);

    if (!h || !w || !age || age <= 0) {
      alert('Please enter valid positive values for age, height and weight.');
      return;
    }

    const cm = toCm(h, metric);
    const kg = toKg(w, metric);
    const b = bmi(kg, cm);
    const bfp = bfpDeurenberg(b, age, isMale);
    const bCat = bmiCat(b);
    const fCat = bfpCat(isMale, bfp);

    bmiValue.textContent = fmt1(b);
    bmiCategory.textContent = bCat;
    bfpValue.textContent = fmt1(bfp);
    bfpCategory.textContent = fCat;
    setCatClass(bmiCategory, bCat);
    setCatClass(bfpCategory, fCat);
  });

  resetBtn.addEventListener('click', () => {
    document.querySelector('input[name="units"][value="metric"]').checked = true;
    ageEl.value = 25;
    sexEl.value = 'female';
    heightEl.value = '';
    weightEl.value = '';
    bmiValue.textContent = '-';
    bmiCategory.textContent = '-';
    bfpValue.textContent = '-';
    bfpCategory.textContent = '-';
    bmiCategory.classList.remove('cat-ok', 'cat-warn', 'cat-bad');
    bfpCategory.classList.remove('cat-ok', 'cat-warn', 'cat-bad');
    updateUnitLabels();
  });

  document.querySelectorAll('input[name="units"]').forEach(r => r.addEventListener('change', updateUnitLabels));
  updateUnitLabels();
})();

