const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');

function showTab(id) {
  tabButtons.forEach((btn) => {
    const isActive = btn.dataset.tabTarget === id;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  tabPanels.forEach((panel) => {
    const shouldShow = panel.dataset.tabContent === id;
    panel.toggleAttribute('hidden', !shouldShow);
  });
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    showTab(button.dataset.tabTarget);
  });
});

showTab('calculators');

// --- BMI & BFP calculator logic ---
const calcForm = document.getElementById('calc-form');
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
function bfpDeurenberg(bmiValue, age, isMale) {
  const sex = isMale ? 1 : 0;
  return 1.2 * bmiValue + 0.23 * age - 10.8 * sex - 5.4;
}
function bmiCat(value) {
  if (value < 18.5) return 'Underweight';
  if (value < 25) return 'Normal';
  if (value < 30) return 'Overweight';
  return 'Obese';
}
function bfpCat(isMale, value) {
  if (isMale) {
    if (value < 2) return 'Below essential';
    if (value <= 5) return 'Essential';
    if (value <= 13) return 'Athletes';
    if (value <= 17) return 'Fitness';
    if (value <= 24) return 'Average';
    return 'Obese';
  }
  if (value < 10) return 'Below essential';
  if (value <= 13) return 'Essential';
  if (value <= 20) return 'Athletes';
  if (value <= 24) return 'Fitness';
  if (value <= 31) return 'Average';
  return 'Obese';
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

calcForm?.addEventListener('submit', (e) => {
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
  const bmiScore = bmi(kg, cm);
  const bfpScore = bfpDeurenberg(bmiScore, age, isMale);
  const bCat = bmiCat(bmiScore);
  const fCat = bfpCat(isMale, bfpScore);

  bmiValue.textContent = fmt1(bmiScore);
  bmiCategory.textContent = bCat;
  bfpValue.textContent = fmt1(bfpScore);
  bfpCategory.textContent = fCat;
  setCatClass(bmiCategory, bCat);
  setCatClass(bfpCategory, fCat);
});

resetBtn?.addEventListener('click', () => {
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

document.querySelectorAll('input[name="units"]').forEach((radio) => {
  radio.addEventListener('change', updateUnitLabels);
});
updateUnitLabels();

// --- Workout Finder logic ---
const workoutForm = document.getElementById('workout-form');
const workoutResults = document.getElementById('workout-results');
const workoutFeedback = document.getElementById('workout-feedback');
const workoutReset = document.getElementById('workout-reset');
const workoutSubmitButton = workoutForm?.querySelector('button[type="submit"]');

const recipeForm = document.getElementById('recipe-form');
const recipeResults = document.getElementById('recipe-results');
const recipeFeedback = document.getElementById('recipe-feedback');
const recipeReset = document.getElementById('recipe-reset');
const recipeSubmitButton = recipeForm?.querySelector('button[type="submit"]');

const nutritionForm = document.getElementById('nutrition-form');
const nutritionResults = document.getElementById('nutrition-results');
const nutritionFeedback = document.getElementById('nutrition-feedback');
const nutritionReset = document.getElementById('nutrition-reset');
const nutritionSubmitButton = nutritionForm?.querySelector('button[type="submit"]');

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '';

function setFeedback(target, message, variant) {
  if (!target) return;
  target.textContent = message;
  target.className = 'feedback';
  if (variant) {
    target.classList.add(variant);
  }
}

function toggleButton(button, disabled) {
  if (button) button.disabled = disabled;
}

function createMetaTag(label, value) {
  const span = document.createElement('span');
  span.textContent = `${label}: ${value}`;
  return span;
}

function renderExercises(exercises) {
  workoutResults.innerHTML = '';
  if (!exercises.length) {
    setFeedback(workoutFeedback, 'No exercises matched your filters. Try adjusting the search.', 'error');
    return;
  }

  const fragment = document.createDocumentFragment();

  exercises.forEach((exercise) => {
    const item = document.createElement('li');
    item.className = 'exercise';

    const title = document.createElement('h3');
    title.textContent = exercise.name;
    item.appendChild(title);

    const metaContainer = document.createElement('div');
    metaContainer.appendChild(createMetaTag('Muscle', exercise.muscle || 'n/a'));
    metaContainer.appendChild(createMetaTag('Type', exercise.type || 'n/a'));
    metaContainer.appendChild(createMetaTag('Difficulty', exercise.difficulty || 'n/a'));
    item.appendChild(metaContainer);

    if (exercise.instructions) {
      const paragraph = document.createElement('p');
      paragraph.textContent = exercise.instructions;
      item.appendChild(paragraph);
    }

    fragment.appendChild(item);
  });

  workoutResults.appendChild(fragment);
  setFeedback(workoutFeedback, `Found ${exercises.length} exercise(s).`, 'success');
}

async function fetchExercises(query) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.append(key, value.trim());
  });

  if (!params.toString()) {
    setFeedback(workoutFeedback, 'Add at least one filter before searching.', 'error');
    return;
  }

  const url = `${API_BASE_URL}/api/exercises?${params.toString()}`;
  setFeedback(workoutFeedback, 'Searching for exercises...', null);
  workoutResults.innerHTML = '';

  try {
    toggleButton(workoutSubmitButton, true);
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json'
      }
    });

    const body = await response.json();
    if (!response.ok) {
      const message = typeof body?.error === 'string' ? body.error : 'Unable to fetch exercises.';
      setFeedback(workoutFeedback, message, 'error');
      return;
    }

    renderExercises(Array.isArray(body) ? body : []);
  } catch (error) {
    console.error('Failed to fetch exercises', error);
    setFeedback(workoutFeedback, 'Something went wrong while contacting the server.', 'error');
  } finally {
    toggleButton(workoutSubmitButton, false);
  }
}

workoutForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(workoutForm);
  const query = Object.fromEntries(formData.entries());
  fetchExercises(query);
});

workoutReset?.addEventListener('click', () => {
  workoutResults.innerHTML = '';
  setFeedback(workoutFeedback, '', null);
});

// --- Recipe Finder ---
function createRecipeItem(recipe) {
  const item = document.createElement('li');
  item.className = 'recipe';

  const title = document.createElement('h3');
  title.textContent = recipe.title || 'Untitled recipe';
  item.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'recipe-meta';
  if (recipe.servings) {
    meta.appendChild(createMetaTag('Servings', recipe.servings));
  }
  if (recipe.ready_in_minutes) {
    meta.appendChild(createMetaTag('Ready in', `${recipe.ready_in_minutes} min`));
  }
  if (meta.childElementCount > 0) {
    item.appendChild(meta);
  }

  if (recipe.ingredients) {
    const ingredientsTitle = document.createElement('strong');
    ingredientsTitle.textContent = 'Ingredients';
    item.appendChild(ingredientsTitle);

    const ingredientsList = document.createElement('ul');
    ingredientsList.className = 'recipe-ingredients';
    recipe.ingredients.split(/[\n\r|]+/).forEach((entry) => {
      const trimmed = entry.trim();
      if (trimmed) {
        const li = document.createElement('li');
        li.textContent = trimmed;
        ingredientsList.appendChild(li);
      }
    });
    item.appendChild(ingredientsList);
  }

  if (recipe.instructions) {
    const instructions = document.createElement('p');
    instructions.textContent = recipe.instructions;
    item.appendChild(instructions);
  }

  return item;
}

async function fetchRecipes(query) {
  const trimmed = query.trim();
  if (!trimmed) {
    setFeedback(recipeFeedback, 'Enter a recipe keyword to search.', 'error');
    return;
  }

  const url = `${API_BASE_URL}/api/recipes?${new URLSearchParams({ query: trimmed }).toString()}`;
  setFeedback(recipeFeedback, 'Fetching recipes...', null);
  recipeResults.innerHTML = '';

  try {
    toggleButton(recipeSubmitButton, true);
    const response = await fetch(url, {
      headers: { Accept: 'application/json' }
    });
    const body = await response.json();
    if (!response.ok) {
      const message = typeof body?.error === 'string' ? body.error : 'Unable to fetch recipes.';
      setFeedback(recipeFeedback, message, 'error');
      return;
    }

    const recipes = Array.isArray(body) ? body : [];
    if (!recipes.length) {
      setFeedback(recipeFeedback, 'No recipes found. Try different ingredients.', 'error');
      return;
    }

    const fragment = document.createDocumentFragment();
    recipes.forEach((recipe) => {
      fragment.appendChild(createRecipeItem(recipe));
    });
    recipeResults.appendChild(fragment);
    setFeedback(recipeFeedback, `Found ${recipes.length} recipe(s).`, 'success');
  } catch (error) {
    console.error('Failed to fetch recipes', error);
    setFeedback(recipeFeedback, 'Something went wrong while contacting the server.', 'error');
  } finally {
    toggleButton(recipeSubmitButton, false);
  }
}

recipeForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = recipeForm.querySelector('#recipe-query')?.value || '';
  fetchRecipes(query);
});

recipeReset?.addEventListener('click', () => {
  recipeResults.innerHTML = '';
  setFeedback(recipeFeedback, '', null);
});

// --- Nutrition Lookup ---
function renderNutritionItems(items) {
  nutritionResults.innerHTML = '';
  if (!items.length) {
    setFeedback(nutritionFeedback, 'No nutrition data returned. Try a more detailed description.', 'error');
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'nutrition-card';

    const title = document.createElement('h3');
    title.textContent = item.name || 'Food item';
    card.appendChild(title);

    const summary = document.createElement('div');
    summary.className = 'nutrition-grid';

    const fields = [
      ['Calories', item.calories],
      ['Serving (g)', item.serving_size_g],
      ['Protein (g)', item.protein_g],
      ['Carbs (g)', item.carbohydrates_total_g],
      ['Fat (g)', item.fat_total_g],
      ['Fiber (g)', item.fiber_g],
      ['Sugar (g)', item.sugar_g],
      ['Sodium (mg)', item.sodium_mg],
      ['Potassium (mg)', item.potassium_mg],
      ['Cholesterol (mg)', item.cholesterol_mg],
      ['Sat Fat (g)', item.fat_saturated_g]
    ];

    fields.forEach(([label, value]) => {
      if (value === undefined || value === null || value === '') return;
      const slot = document.createElement('div');
      slot.className = 'nutrition-item';
      const numeric = Number(value);
      slot.textContent = `${label}: ${Number.isFinite(numeric) ? numeric.toFixed(1) : value}`;
      summary.appendChild(slot);
    });

    card.appendChild(summary);
    fragment.appendChild(card);
  });

  nutritionResults.appendChild(fragment);
  setFeedback(nutritionFeedback, `Found nutrition details for ${items.length} item(s).`, 'success');
}

async function fetchNutrition(query) {
  const trimmed = query.trim();
  if (!trimmed) {
    setFeedback(nutritionFeedback, 'Describe at least one food item to analyze.', 'error');
    return;
  }

  const url = `${API_BASE_URL}/api/nutrition?${new URLSearchParams({ query: trimmed }).toString()}`;
  setFeedback(nutritionFeedback, 'Calculating nutrition...', null);
  nutritionResults.innerHTML = '';

  try {
    toggleButton(nutritionSubmitButton, true);
    const response = await fetch(url, {
      headers: { Accept: 'application/json' }
    });
    const body = await response.json();
    if (!response.ok) {
      const message = typeof body?.error === 'string' ? body.error : 'Unable to fetch nutrition facts.';
      setFeedback(nutritionFeedback, message, 'error');
      return;
    }

    renderNutritionItems(Array.isArray(body) ? body : []);
  } catch (error) {
    console.error('Failed to fetch nutrition data', error);
    setFeedback(nutritionFeedback, 'Something went wrong while contacting the server.', 'error');
  } finally {
    toggleButton(nutritionSubmitButton, false);
  }
}

nutritionForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = nutritionForm.querySelector('#nutrition-query')?.value || '';
  fetchNutrition(query);
});

nutritionReset?.addEventListener('click', () => {
  nutritionResults.innerHTML = '';
  setFeedback(nutritionFeedback, '', null);
});
