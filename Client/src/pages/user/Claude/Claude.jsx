import React, { useState, useEffect } from 'react';
import { IndianFoods } from '../../../data/data';
import './Claude.css'; // Import the CSS file

const Claude = () => {
  // ... (keep all your state variables and functions as they are) ...
  const [currentWeight, setCurrentWeight] = useState(0);
  const [targetWeight, setTargetWeight] = useState(0);
  const [height, setHeight] = useState(0);
  const [age, setAge] = useState(0);
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [fitnessGoal, setFitnessGoal] = useState('maintain');
  const [vegetarian, setVegetarian] = useState(false);

  const [proteinGoal, setProteinGoal] = useState(0);
  const [carbGoal, setCarbGoal] = useState(0);
  const [fatGoal, setFatGoal] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(0);

  const [selectedFoods, setSelectedFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // const [optimizedQuantities, setOptimizedQuantities] = useState({}); // Removed if not used
  const [isRecommending, setIsRecommending] = useState(false);
  // const [bestFoodCombination, setBestFoodCombination] = useState([]); // Removed if mealPlan is primary
  const [mealPlan, setMealPlan] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });

  const [totalDailyCost, setTotalDailyCost] = useState(0); // Recalculated on render instead
  const [budgetConstraint, setBudgetConstraint] = useState(0);

  const indianFoods = IndianFoods;

  // ... (keep calculateNutritionGoals function as is) ...
    const calculateNutritionGoals = () => {
        if (!currentWeight || !height || !age) {
        return;
        }

        let bmr;
        if (gender === 'male') {
        bmr = 10 * currentWeight + 6.25 * height - 5 * age + 5;
        } else {
        bmr = 10 * currentWeight + 6.25 * height - 5 * age - 161;
        }

        const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        veryActive: 1.9
        };

        let tdee = bmr * activityMultipliers[activityLevel];

        let dailyCalories;
        switch (fitnessGoal) {
        case 'bulk':
            dailyCalories = tdee + 500;
            break;
        case 'cut':
            dailyCalories = Math.max(1200, tdee - 500);
            break;
        default: // maintain
            dailyCalories = tdee;
        }

        let proteinRatio, carbRatio, fatRatio;

        if (fitnessGoal === 'bulk') {
        proteinRatio = 0.25; fatRatio = 0.25; carbRatio = 0.5;
        } else if (fitnessGoal === 'cut') {
        proteinRatio = 0.4; fatRatio = 0.3; carbRatio = 0.3;
        } else { // maintain
        proteinRatio = 0.3; fatRatio = 0.3; carbRatio = 0.4;
        }

        const proteinCalories = dailyCalories * proteinRatio;
        const carbCalories = dailyCalories * carbRatio;
        const fatCalories = dailyCalories * fatRatio;

        const proteinGrams = Math.round(proteinCalories / 4);
        const carbGrams = Math.round(carbCalories / 4);
        const fatGrams = Math.round(fatCalories / 9);

        setCalorieGoal(Math.round(dailyCalories));
        setProteinGoal(proteinGrams);
        setCarbGoal(carbGrams);
        setFatGoal(fatGrams);
    };

  // ... (keep generateMealPlan function as is, just ensure it uses the correct state) ...
   const generateMealPlan = () => {
    setIsRecommending(true);
    setLoading(true);
    setError(null);

    try {
      let availableFoods = indianFoods;
      if (vegetarian) {
        availableFoods = availableFoods.filter(food => food.vegetarian);
      }

      // Define meal target ratios (adjust as needed)
      const mealTargets = {
        breakfast: { macro: { protein: 0.2, carbs: 0.3, fat: 0.2 }, calorie: 0.25 },
        lunch:     { macro: { protein: 0.4, carbs: 0.35, fat: 0.3 }, calorie: 0.35 },
        dinner:    { macro: { protein: 0.3, carbs: 0.25, fat: 0.35 }, calorie: 0.30 },
        snacks:    { macro: { protein: 0.1, carbs: 0.1, fat: 0.15 }, calorie: 0.10 }
      };

      // Function to get foods suitable for a meal
      const getMealFoods = (mealName) => availableFoods.filter(food =>
        food.mealPreference.includes(mealName)
      );

      // Select foods for each meal
      const breakfast = selectFoodsForMeal(getMealFoods("breakfast"), mealTargets.breakfast.macro, mealTargets.breakfast.calorie, "breakfast");
      const lunch = selectFoodsForMeal(getMealFoods("lunch"), mealTargets.lunch.macro, mealTargets.lunch.calorie, "lunch");
      const dinner = selectFoodsForMeal(getMealFoods("dinner"), mealTargets.dinner.macro, mealTargets.dinner.calorie, "dinner");
      const snacks = selectFoodsForMeal(getMealFoods("snacks"), mealTargets.snacks.macro, mealTargets.snacks.calorie, "snacks");

      // Combine all selected foods (including quantities)
      const allSelectedFoodsWithQuantities = [
          ...breakfast,
          ...lunch,
          ...dinner,
          ...snacks
      ];

      // Use a Map to aggregate quantities for unique foods
      const aggregatedFoodsMap = new Map();
      allSelectedFoodsWithQuantities.forEach(food => {
        if (aggregatedFoodsMap.has(food.id)) {
          const existing = aggregatedFoodsMap.get(food.id);
          existing.quantity += food.quantity; // Sum quantities
        } else {
          // Store a copy to avoid modifying the original food objects in mealPlan
          aggregatedFoodsMap.set(food.id, { ...food });
        }
      });

      const uniqueAggregatedFoods = Array.from(aggregatedFoodsMap.values());

      setSelectedFoods(uniqueAggregatedFoods); // Update state with unique foods and total quantities

      setMealPlan({ breakfast, lunch, dinner, snacks }); // Keep meal breakdown separate

      // Recalculate total cost here based on selectedFoods if needed,
      // or rely on the calculateTotals function called during render.

    } catch (err) {
      setError(err.message || 'Failed to generate meal plan');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setIsRecommending(false);
    }
  };


  // ... (keep selectFoodsForMeal helper function as is) ...
  const selectFoodsForMeal = (availableFoods, macroRatios, calorieRatio, mealName) => {
        if (!availableFoods || availableFoods.length === 0 || calorieGoal <= 0) return [];

        const mealProteinTarget = proteinGoal * macroRatios.protein;
        const mealCarbTarget = carbGoal * macroRatios.carbs;
        const mealFatTarget = fatGoal * macroRatios.fat;
        const mealCalorieTarget = calorieGoal * calorieRatio;
        const mealBudget = budgetConstraint > 0 ? budgetConstraint * calorieRatio : Infinity;

        let selectedFoods = [];
        let currentProtein = 0;
        let currentCarbs = 0;
        let currentFat = 0;
        let currentCalories = 0;
        let currentCost = 0;

        // Prioritize diverse, suitable foods
        const sortedFoods = [...availableFoods].sort((a, b) => {
            // Basic sorting: prefer foods matching the meal, then maybe by cost/nutrient density
            const aPref = a.mealPreference.includes(mealName) ? 0 : 1;
            const bPref = b.mealPreference.includes(mealName) ? 0 : 1;
            if (aPref !== bPref) return aPref - bPref;
            return (a.costPer100g / a.nutrients.calories) - (b.costPer100g / b.nutrients.calories); // Example: calorie density per cost
        });

        // Simple greedy selection (can be improved significantly)
        // Aim for 2-4 items per meal typically
        const maxItems = mealName === 'snacks' ? 2 : 4;
        let attempts = 0;
        const maxAttempts = sortedFoods.length * 2; // Limit iterations

        while (selectedFoods.length < maxItems && attempts < maxAttempts && sortedFoods.length > 0) {
            attempts++;
            // Pick a random suitable food to add diversity? Or cycle through sorted?
            const foodToAddIndex = Math.floor(Math.random() * sortedFoods.length);
            const foodToAdd = sortedFoods[foodToAddIndex];
            sortedFoods.splice(foodToAddIndex, 1); // Remove from available for this meal selection

            // Determine quantity (this is the tricky part without optimization)
            // Start with a reasonable default quantity (e.g., 100g), then adjust.
            let quantity = 100; // Default serving size?
            // Crude adjustment based on remaining calorie needs
            const remainingCalories = mealCalorieTarget - currentCalories;
            if (foodToAdd.nutrients.calories > 0 && remainingCalories > 0) {
                quantity = Math.min(250, Math.max(30, Math.round((remainingCalories * 0.3 * 100) / foodToAdd.nutrients.calories))); // Try to fill 30% of remaining calories
            }

             // Ensure quantity respects budget and doesn't overshoot calories too much
            const costForQuantity = (foodToAdd.costPer100g * quantity) / 100;
            const caloriesForQuantity = (foodToAdd.nutrients.calories * quantity) / 100;
            const proteinForQuantity = (foodToAdd.nutrients.protein * quantity) / 100;
            const carbsForQuantity = (foodToAdd.nutrients.carbs * quantity) / 100;
            const fatForQuantity = (foodToAdd.nutrients.fat * quantity) / 100;

            if (
                quantity > 10 && // Minimum sensible quantity
                currentCost + costForQuantity <= mealBudget &&
                currentCalories + caloriesForQuantity <= mealCalorieTarget * 1.2 // Allow slight overshoot
             ) {
                 // Check if adding this food improves balance (optional complexity)
                 selectedFoods.push({ ...foodToAdd, quantity });
                 currentCalories += caloriesForQuantity;
                 currentProtein += proteinForQuantity;
                 currentCarbs += carbsForQuantity;
                 currentFat += fatForQuantity;
                 currentCost += costForQuantity;
            } else {
                 // Maybe try a smaller quantity if budget/calories were the issue
                 quantity = 50;
                 const costForSmallerQuantity = (foodToAdd.costPer100g * quantity) / 100;
                 const caloriesForSmallerQuantity = (foodToAdd.nutrients.calories * quantity) / 100;
                 const proteinForSmallerQuantity = (foodToAdd.nutrients.protein * quantity) / 100;
                 const carbsForSmallerQuantity = (foodToAdd.nutrients.carbs * quantity) / 100;
                 const fatForSmallerQuantity = (foodToAdd.nutrients.fat * quantity) / 100;

                 if (
                    quantity > 10 &&
                    currentCost + costForSmallerQuantity <= mealBudget &&
                    currentCalories + caloriesForSmallerQuantity <= mealCalorieTarget * 1.2
                 ) {
                     selectedFoods.push({ ...foodToAdd, quantity });
                     currentCalories += caloriesForSmallerQuantity;
                     currentProtein += proteinForSmallerQuantity;
                     currentCarbs += carbsForSmallerQuantity;
                     currentFat += fatForSmallerQuantity;
                     currentCost += costForSmallerQuantity;
                 }
                 // If still not added, skip this food for now
            }
        }


        // This is a very basic selection. A real optimizer (linear programming)
        // would be needed for truly optimal results based on multiple constraints.
        return selectedFoods;
    };

  // ... (keep useEffect for calculateNutritionGoals as is) ...
   useEffect(() => {
    calculateNutritionGoals();
  }, [currentWeight, targetWeight, height, age, gender, activityLevel, fitnessGoal]);


  // ... (keep calculateWeightChangeTimeline function as is) ...
  const calculateWeightChangeTimeline = () => {
    if (!currentWeight || !targetWeight || currentWeight === targetWeight || calorieGoal <= 0) {
      return null;
    }

    const weightDifferenceKg = targetWeight - currentWeight;
    const calorieDeficitOrSurplus = calorieGoal - (10 * currentWeight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161)) * {sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9}[activityLevel];

    // Approx 7700 kcal per kg of body weight change
    const kcalPerKg = 7700;

    if (calorieDeficitOrSurplus === 0) return null; // No change expected

    // Avoid division by zero or unrealistic scenarios
    if ((weightDifferenceKg > 0 && calorieDeficitOrSurplus <= 0) || (weightDifferenceKg < 0 && calorieDeficitOrSurplus >= 0)) {
        // Goal contradicts calorie plan
        return { weeks: Infinity, months: Infinity, possible: false };
    }


    const daysToGoal = (weightDifferenceKg * kcalPerKg) / calorieDeficitOrSurplus;

    if (daysToGoal <= 0 || !isFinite(daysToGoal)) return null; // Safety check

    const weeksToGoal = daysToGoal / 7;
    const monthsToGoal = daysToGoal / 30.44; // Average days in month

    // Add realistic constraints (e.g., max safe weight loss/gain per week)
    const maxWeeklyChangeKg = fitnessGoal === 'cut' ? 1.0 : 0.5; // Max 1kg loss, 0.5kg gain per week
    const minWeeksBasedOnSafety = Math.abs(weightDifferenceKg) / maxWeeklyChangeKg;

    const realisticWeeks = Math.max(weeksToGoal, minWeeksBasedOnSafety);
    const realisticMonths = realisticWeeks / 4.33;


    return {
      weeks: Math.round(realisticWeeks),
      months: realisticMonths.toFixed(1),
      possible: true
    };
  };


  // ... (keep kgToLbs and lbsToKg functions as is) ...
  const kgToLbs = kg => (kg * 2.20462).toFixed(1);
  const lbsToKg = lbs => (lbs / 2.20462).toFixed(1);


  // ... (keep calculateTotals function as is) ...
   const calculateTotals = () => {
        let proteinTotal = 0;
        let carbTotal = 0;
        let fatTotal = 0;
        let calorieTotal = 0;
        let costTotal = 0;

        // Ensure selectedFoods contains the aggregated list for the day
        selectedFoods.forEach(food => {
          // Ensure quantity is a number
          const quantity = Number(food.quantity) || 0;
          if (quantity > 0 && food.nutrients) {
             proteinTotal += (food.nutrients.protein * quantity / 100);
             carbTotal += (food.nutrients.carbs * quantity / 100);
             fatTotal += (food.nutrients.fat * quantity / 100);
             calorieTotal += (food.nutrients.calories * quantity / 100);
             costTotal += (food.costPer100g * quantity / 100);
          }
        });

        return {
        protein: Math.round(proteinTotal),
        carbs: Math.round(carbTotal),
        fat: Math.round(fatTotal),
        calories: Math.round(calorieTotal),
        cost: Math.round(costTotal) // Round cost at the end
        };
    };

  // ... (keep getPercentOfGoal function as is) ...
    const getPercentOfGoal = (current, goal) => {
        if (!goal || goal <= 0) return 0;
        return Math.min(100, Math.round((current / goal) * 100));
    };

  // ... (keep formatCurrency function as is) ...
   const formatCurrency = (amount) => {
        // Ensure amount is a number, default to 0 if not
        const numericAmount = Number(amount) || 0;
        // Format to 2 decimal places for currency often looks better, but integer is fine too
        return `₹${numericAmount.toFixed(0)}`; // Using toFixed(0) to match previous Math.round behavior
    };


  // ... (keep handleSubmit function as is) ...
   const handleSubmit = (e) => {
        e.preventDefault();
        // Optional: Add validation check here before generating
        if (currentWeight > 0 && height > 0 && age > 0 && targetWeight > 0) {
             generateMealPlan();
        } else {
            setError("Please fill in all required metric fields (Weight, Target Weight, Height, Age).");
        }
    };

  const timeline = calculateWeightChangeTimeline();
  const totals = selectedFoods.length > 0 ? calculateTotals() : { protein: 0, carbs: 0, fat: 0, calories: 0, cost: 0 };

  return (
    // Replace all className props with the new CSS class names
    <div className="claude-container">
      <h1 className="claude-main-title">Indian Fitness Meal Planner</h1>

      {/* User Input Form */}
      <div className="claude-card">
        <h2 className="claude-card-title">Your Metrics</h2>
        <form onSubmit={handleSubmit}>
          <div className="claude-form-grid">
            <div className="claude-form-group">
              <label className="claude-label">Current Weight (kg)</label>
              <input
                type="number"
                min="30"
                max="200"
                step="0.1"
                className="claude-input"
                value={currentWeight || ''}
                onChange={(e) => setCurrentWeight(Number(e.target.value))}
                required
              />
              <p className="claude-input-hint">{currentWeight ? `${kgToLbs(currentWeight)} lbs` : ''}</p>
            </div>

            <div className="claude-form-group">
              <label className="claude-label">Target Weight (kg)</label>
              <input
                type="number"
                min="30"
                max="200"
                 step="0.1"
                className="claude-input"
                value={targetWeight || ''}
                onChange={(e) => setTargetWeight(Number(e.target.value))}
                required
              />
              <p className="claude-input-hint">{targetWeight ? `${kgToLbs(targetWeight)} lbs` : ''}</p>
            </div>

            <div className="claude-form-group">
              <label className="claude-label">Height (cm)</label>
              <input
                type="number"
                min="100"
                max="250"
                className="claude-input"
                value={height || ''}
                onChange={(e) => setHeight(Number(e.target.value))}
                required
              />
            </div>

            <div className="claude-form-group">
              <label className="claude-label">Age</label>
              <input
                type="number"
                min="15"
                max="100"
                className="claude-input"
                value={age || ''}
                onChange={(e) => setAge(Number(e.target.value))}
                required
              />
            </div>

            <div className="claude-form-group">
              <label className="claude-label">Gender</label>
              <select
                className="claude-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="claude-form-group">
              <label className="claude-label">Activity Level</label>
              <select
                className="claude-select"
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                required
              >
                <option value="sedentary">Sedentary (little or no exercise)</option>
                <option value="light">Light (light exercise 1-3 days/week)</option>
                <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
                <option value="active">Active (hard exercise 6-7 days/week)</option>
                <option value="veryActive">Very Active (hard daily exercise & physical job)</option>
              </select>
            </div>

            <div className="claude-form-group">
              <label className="claude-label">Fitness Goal</label>
              <select
                className="claude-select"
                value={fitnessGoal}
                onChange={(e) => setFitnessGoal(e.target.value)}
                required
              >
                <option value="maintain">Maintain Weight</option>
                <option value="cut">Lose Weight</option>
                <option value="bulk">Gain Weight</option>
              </select>
            </div>

            <div className="claude-form-group">
              <label className="claude-label">Daily Budget (INR, optional)</label>
              <input
                type="number"
                min="0"
                className="claude-input"
                value={budgetConstraint || ''}
                onChange={(e) => setBudgetConstraint(Number(e.target.value))}
              />
              <p className="claude-input-hint">Leave empty for no budget constraint</p>
            </div>

            <div className="claude-checkbox-group">
              <input
                type="checkbox"
                id="vegetarian"
                className="claude-checkbox"
                checked={vegetarian}
                onChange={(e) => setVegetarian(e.target.checked)}
              />
              <label htmlFor="vegetarian" className="claude-label" style={{ marginBottom: 0 }}>Vegetarian</label> {/* Inline style to override default margin */}
            </div>
          </div>

          <div> {/* Container for the button */}
            <button
              type="submit"
              className="claude-submit-button"
              disabled={loading || isRecommending}
            >
              {loading ? 'Generating...' : 'Generate Meal Plan'}
            </button>
          </div>
        </form>
      </div>

      {/* Nutrition Goals */}
      {calorieGoal > 0 && (
        <div className="claude-card">
          <h2 className="claude-card-title">Your Nutrition Goals</h2>

          <div className="claude-goals-grid">
            <div className="claude-goal-item claude-goal-item--calories">
              <h3>Daily Calories</h3>
              <p>{calorieGoal} kcal</p>
              <p> </p> {/* Placeholder for consistent height */}
            </div>

            <div className="claude-goal-item claude-goal-item--protein">
              <h3>Protein</h3>
              <p>{proteinGoal}g</p>
              <p>{calorieGoal > 0 ? Math.round((proteinGoal * 4) / calorieGoal * 100) : 0}% of total calories</p>
            </div>

            <div className="claude-goal-item claude-goal-item--carbs">
              <h3>Carbohydrates</h3>
              <p>{carbGoal}g</p>
               <p>{calorieGoal > 0 ? Math.round((carbGoal * 4) / calorieGoal * 100) : 0}% of total calories</p>
            </div>

            <div className="claude-goal-item claude-goal-item--fat">
              <h3>Fat</h3>
              <p>{fatGoal}g</p>
              <p>{calorieGoal > 0 ? Math.round((fatGoal * 9) / calorieGoal * 100) : 0}% of total calories</p>
            </div>
          </div>

          {timeline && timeline.possible === false && (
             <div className="claude-timeline-card" style={{backgroundColor: '#fff5f5', borderColor: '#fed7d7'}}> {/* Reddish tint */}
                <h3 style={{color: '#c53030'}}>Goal Timeline</h3>
                <p style={{fontSize: '1rem'}}>
                    Your current nutrition goals (based on activity/goal) may not lead towards your target weight. Adjust your fitness goal or activity level if needed.
                </p>
            </div>
          )}
          {timeline && timeline.possible !== false && timeline.weeks !== Infinity && (
            <div className="claude-timeline-card">
              <h3>Expected Timeline to Goal</h3>
              <p>
                Based on your metrics and goals, it may take approximately
                <strong> {timeline.weeks} weeks</strong>
                ({timeline.months} months) to reach your target weight of {targetWeight}kg.
              </p>
              <p>
                This estimate assumes consistent adherence to the calculated calorie target. Actual results may vary.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Meal Plan Results */}
      {/* Render only if mealPlan has been generated (check one of the arrays) */}
      {mealPlan.breakfast.length > 0 || mealPlan.lunch.length > 0 || mealPlan.dinner.length > 0 || mealPlan.snacks.length > 0 ? (
        <div className="claude-card">
          <h2 className="claude-card-title">Your Indian Meal Plan</h2>

          {/* Progress towards daily goals */}
          <div className="claude-results-section">
            <h3 className="claude-progress-title">Daily Progress</h3>
            <div className="claude-results-grid"> {/* Use responsive grid */}
              {/* Calories Progress */}
              <div className="claude-progress-item">
                <div>
                  <span>Calories: {totals.calories} / {calorieGoal} kcal</span>
                  <span>{getPercentOfGoal(totals.calories, calorieGoal)}%</span>
                </div>
                <div className="claude-progress-track">
                  <div
                    className="claude-progress-fill claude-progress-fill--calories"
                    style={{ width: `${getPercentOfGoal(totals.calories, calorieGoal)}%` }}
                  ></div>
                </div>
              </div>

              {/* Protein Progress */}
               <div className="claude-progress-item">
                 <div>
                   <span>Protein: {totals.protein} / {proteinGoal}g</span>
                   <span>{getPercentOfGoal(totals.protein, proteinGoal)}%</span>
                 </div>
                 <div className="claude-progress-track">
                   <div
                     className="claude-progress-fill claude-progress-fill--protein"
                     style={{ width: `${getPercentOfGoal(totals.protein, proteinGoal)}%` }}
                   ></div>
                 </div>
               </div>

              {/* Carbs Progress */}
               <div className="claude-progress-item">
                 <div>
                   <span>Carbs: {totals.carbs} / {carbGoal}g</span>
                   <span>{getPercentOfGoal(totals.carbs, carbGoal)}%</span>
                 </div>
                 <div className="claude-progress-track">
                   <div
                     className="claude-progress-fill claude-progress-fill--carbs"
                     style={{ width: `${getPercentOfGoal(totals.carbs, carbGoal)}%` }}
                   ></div>
                 </div>
               </div>

              {/* Fat Progress */}
               <div className="claude-progress-item">
                 <div>
                   <span>Fat: {totals.fat} / {fatGoal}g</span>
                   <span>{getPercentOfGoal(totals.fat, fatGoal)}%</span>
                 </div>
                 <div className="claude-progress-track">
                   <div
                     className="claude-progress-fill claude-progress-fill--fat"
                     style={{ width: `${getPercentOfGoal(totals.fat, fatGoal)}%` }}
                   ></div>
                 </div>
               </div>
            </div> {/* End results grid */}

            {/* Cost Progress */}
            <div className="claude-cost-section">
              <div>
                <span>Daily Cost: {formatCurrency(totals.cost)}</span>
                {budgetConstraint > 0 && (
                  <span>{getPercentOfGoal(totals.cost, budgetConstraint)}% of budget ({formatCurrency(budgetConstraint)})</span>
                )}
              </div>
              {budgetConstraint > 0 && (
                <div className="claude-progress-track">
                  <div
                    className="claude-progress-fill claude-progress-fill--cost"
                    style={{ width: `${getPercentOfGoal(totals.cost, budgetConstraint)}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div> {/* End progress section */}


          {/* Meal-by-meal breakdown */}
          <div className="claude-meal-sections-container">
            {/* Breakfast */}
            {mealPlan.breakfast && mealPlan.breakfast.length > 0 && (
                <div className="claude-meal-section">
                <h3 className="claude-meal-title claude-meal-title--breakfast">Breakfast</h3>
                 <div className="claude-meal-content claude-meal-content--breakfast">
                    <div className="claude-table-container">
                        <table className="claude-table">
                        <thead>
                            <tr>
                            <th className="claude-table-cell">Food</th>
                            <th className="claude-table-cell">Quantity</th>
                            <th className="claude-table-cell">Protein</th>
                            <th className="claude-table-cell">Carbs</th>
                            <th className="claude-table-cell">Fat</th>
                            <th className="claude-table-cell">Calories</th>
                            <th className="claude-table-cell">Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mealPlan.breakfast.map((food) => (
                            <tr key={`${food.id}-breakfast`}>
                                <td className="claude-table-cell">{food.description}</td>
                                <td className="claude-table-cell">{food.quantity}g</td>
                                <td className="claude-table-cell">{Math.round(food.nutrients.protein * food.quantity / 100)}g</td>
                                <td className="claude-table-cell">{Math.round(food.nutrients.carbs * food.quantity / 100)}g</td>
                                <td className="claude-table-cell">{Math.round(food.nutrients.fat * food.quantity / 100)}g</td>
                                <td className="claude-table-cell">{Math.round(food.nutrients.calories * food.quantity / 100)} kcal</td>
                                <td className="claude-table-cell">{formatCurrency(food.costPer100g * food.quantity / 100)}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                 </div>
                </div>
            )}

             {/* Lunch */}
            {mealPlan.lunch && mealPlan.lunch.length > 0 && (
                <div className="claude-meal-section">
                <h3 className="claude-meal-title claude-meal-title--lunch">Lunch</h3>
                 <div className="claude-meal-content claude-meal-content--lunch">
                    <div className="claude-table-container">
                        <table className="claude-table">
                        <thead>
                            <tr>
                            <th className="claude-table-cell">Food</th>
                            <th className="claude-table-cell">Quantity</th>
                            <th className="claude-table-cell">Protein</th>
                            <th className="claude-table-cell">Carbs</th>
                            <th className="claude-table-cell">Fat</th>
                            <th className="claude-table-cell">Calories</th>
                            <th className="claude-table-cell">Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mealPlan.lunch.map((food) => (
                            <tr key={`${food.id}-lunch`}>
                                <td className="claude-table-cell">{food.description}</td>
                                <td className="claude-table-cell">{food.quantity}g</td>
                                <td className="claude-table-cell">{Math.round(food.nutrients.protein * food.quantity / 100)}g</td>
                                <td className="claude-table-cell">{Math.round(food.nutrients.carbs * food.quantity / 100)}g</td>
                                <td className="claude-table-cell">{Math.round(food.nutrients.fat * food.quantity / 100)}g</td>
                                <td className="claude-table-cell">{Math.round(food.nutrients.calories * food.quantity / 100)} kcal</td>
                                <td className="claude-table-cell">{formatCurrency(food.costPer100g * food.quantity / 100)}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                 </div>
                </div>
            )}

             {/* Dinner */}
            {mealPlan.dinner && mealPlan.dinner.length > 0 && (
                <div className="claude-meal-section">
                <h3 className="claude-meal-title claude-meal-title--dinner">Dinner</h3>
                 <div className="claude-meal-content claude-meal-content--dinner">
                    <div className="claude-table-container">
                        <table className="claude-table">
                        <thead>
                            <tr>
                            <th className="claude-table-cell">Food</th>
                            <th className="claude-table-cell">Quantity</th>
                            <th className="claude-table-cell">Protein</th>
                            <th className="claude-table-cell">Carbs</th>
                            <th className="claude-table-cell">Fat</th>
                            <th className="claude-table-cell">Calories</th>
                            <th className="claude-table-cell">Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mealPlan.dinner.map((food) => (
                            <tr key={`${food.id}-dinner`}>
                                <td className="claude-table-cell">{food.description}</td>
                                <td className="claude-table-cell">{food.quantity}g</td>
                                <td className="claude-table-cell">{Math.round(food.nutrients.protein * food.quantity / 100)}g</td>
                                <td className="claude-table-cell">{Math.round(food.nutrients.carbs * food.quantity / 100)}g</td>
                                <td className="claude-table-cell">{Math.round(food.nutrients.fat * food.quantity / 100)}g</td>
                                <td className="claude-table-cell">{Math.round(food.nutrients.calories * food.quantity / 100)} kcal</td>
                                <td className="claude-table-cell">{formatCurrency(food.costPer100g * food.quantity / 100)}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                 </div>
                </div>
            )}

             {/* Snacks */}
            {mealPlan.snacks && mealPlan.snacks.length > 0 && (
                <div className="claude-meal-section">
                <h3 className="claude-meal-title claude-meal-title--snacks">Snacks</h3>
                 <div className="claude-meal-content claude-meal-content--snacks">
                    <div className="claude-table-container">
                        <table className="claude-table">
                        <thead>
                            <tr>
                            <th className="claude-table-cell">Food</th>
                            <th className="claude-table-cell">Quantity</th>
                            <th className="claude-table-cell">Protein</th>
                            <th className="claude-table-cell">Carbs</th>
                            <th className="claude-table-cell">Fat</th>
                            <th className="claude-table-cell">Calories</th>
                            <th className="claude-table-cell">Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mealPlan.snacks.map((food) => (
                            <tr key={`${food.id}-snacks`}>
                                <td className="claude-table-cell">{food.description}</td>
                                <td className="claude-table-cell">{food.quantity}g</td>
                                <td className="claude-table-cell">{Math.round(food.nutrients.protein * food.quantity / 100)}g</td>
                                <td className="claude-table-cell">{Math.round(food.nutrients.carbs * food.quantity / 100)}g</td>
                                <td className="claude-table-cell">{Math.round(food.nutrients.fat * food.quantity / 100)}g</td>
                                <td className="claude-table-cell">{Math.round(food.nutrients.calories * food.quantity / 100)} kcal</td>
                                <td className="claude-table-cell">{formatCurrency(food.costPer100g * food.quantity / 100)}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                 </div>
                </div>
            )}
          </div>

          {/* Shopping List (using selectedFoods which has aggregated quantities) */}
          {selectedFoods.length > 0 && (
            <div className="claude-shopping-list-section">
              <h3 className="claude-shopping-list-title">Shopping List (Total Quantities)</h3>
              <div className="claude-shopping-list-content">
                <div className="claude-shopping-list-grid">
                  {selectedFoods.map((food) => (
                    <div key={`${food.id}-shopping`} className="claude-shopping-list-item">
                      <span>{food.description}</span>
                      <span>{food.quantity}g</span>
                    </div>
                  ))}
                </div>
                <div className="claude-shopping-list-total">
                  <p>Total Estimated Cost: {formatCurrency(totals.cost)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Meal Plan Tips */}
          <div className="claude-tips-section">
            <h3 className="claude-tips-title">Meal Plan Tips</h3>
            <ul className="claude-tips-list">
              <li>Drink plenty of water throughout the day (aim for 3-4 liters).</li>
              <li>This meal plan provides a balanced approach based on your metrics and goals. Quantities are estimates; adjust based on hunger and progress.</li>
              <li>Feel free to add spices and herbs to your meals for flavor without adding significant calories.</li>
              <li>Try to have meals at consistent times each day.</li>
              <li>Consider meal prepping 2-3 days in advance to help stay consistent.</li>
              <li>For best results, combine this meal plan with appropriate exercise.</li>
              {fitnessGoal === 'cut' && (
                <li>While cutting, prioritize high-protein foods to preserve muscle mass. Ensure you are in a calorie deficit.</li>
              )}
              {fitnessGoal === 'bulk' && (
                <li>While bulking, ensure you eat enough to be in a calorie surplus. Focus on nutrient-dense foods.</li>
              )}
               <li>Listen to your body. If you're consistently hungry or too full, adjust portion sizes slightly.</li>
            </ul>
          </div>
        </div>
      ) : (
         // Optional: Show a message if the form is filled but no plan generated yet
         calorieGoal > 0 && !loading && !error && <p style={{textAlign: 'center', marginTop: '1rem'}}>Fill in your metrics and click "Generate Meal Plan".</p>
      )}

      {/* Error Message Display */}
      {error && (
        <div className="claude-error-message">
          <strong>Error:</strong>
          <span> {error}</span>
        </div>
      )}

      {/* Disclaimer */}
      <div className="claude-disclaimer">
        <p>Disclaimer: This meal planner provides general guidance based on standard calculations and a simplified selection process. Individual needs may vary.
          Consult with a registered dietitian or healthcare provider for personalized advice.</p>
      </div>
    </div>
  );
};

export default Claude;