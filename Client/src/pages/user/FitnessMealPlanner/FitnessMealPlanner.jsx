import React, { useState, useEffect } from 'react';
import './FitnessMealPlanner.css';

const FitnessMealPlanner = () => {
  const USDA_API_KEY = 'ZCTTFISfUYkwUQEZLM0J63N9bghXMxXAsidrMLbH';
  const USDA_API_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

  // User metrics and goals
  const [currentWeight, setCurrentWeight] = useState(0);
  const [targetWeight, setTargetWeight] = useState(0);
  const [height, setHeight] = useState(0);
  const [age, setAge] = useState(0);
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [fitnessGoal, setFitnessGoal] = useState('maintain');
  
  // Macronutrient goals
  const [proteinGoal, setProteinGoal] = useState(0);
  const [carbGoal, setCarbGoal] = useState(0);
  const [fatGoal, setFatGoal] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(0);

  // Food database and selections
  const [recommendedFoods, setRecommendedFoods] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [optimizedQuantities, setOptimizedQuantities] = useState({});
  const [isRecommending, setIsRecommending] = useState(false);
  const [bestFoodCombination, setBestFoodCombination] = useState([]);
  const [mealPlan, setMealPlan] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });

  // Cost-related states
  const [foodPriceEstimates, setFoodPriceEstimates] = useState({});
  const [totalDailyCost, setTotalDailyCost] = useState(0);
  const [budgetConstraint, setBudgetConstraint] = useState(0);

  // Calculate TDEE (Total Daily Energy Expenditure) and macros based on user metrics
  const calculateNutritionGoals = () => {
    if (!currentWeight || !height || !age) {
      return;
    }

    // Calculate BMR using Mifflin-St Jeor equation
    let bmr;
    if (gender === 'male') {
      bmr = 10 * currentWeight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * currentWeight + 6.25 * height - 5 * age - 161;
    }

    // Apply activity level multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9
    };
    
    let tdee = bmr * activityMultipliers[activityLevel];
    
    // Adjust based on fitness goal
    let dailyCalories;
    switch (fitnessGoal) {
      case 'bulk':
        dailyCalories = tdee + 500; // Caloric surplus for bulking
        break;
      case 'cut':
        dailyCalories = Math.max(1200, tdee - 500); // Caloric deficit for cutting (min 1200)
        break;
      default: // maintain
        dailyCalories = tdee;
    }
    
    // Calculate macros based on fitness goal
    let proteinRatio, carbRatio, fatRatio;
    
    if (fitnessGoal === 'bulk') {
      proteinRatio = 0.25; // 25% of calories from protein
      fatRatio = 0.25;     // 25% of calories from fat
      carbRatio = 0.5;     // 50% of calories from carbs
    } else if (fitnessGoal === 'cut') {
      proteinRatio = 0.4;  // 40% of calories from protein
      fatRatio = 0.3;      // 30% of calories from fat
      carbRatio = 0.3;     // 30% of calories from carbs
    } else { // maintain
      proteinRatio = 0.3;  // 30% of calories from protein
      fatRatio = 0.3;      // 30% of calories from fat
      carbRatio = 0.4;     // 40% of calories from carbs
    }
    
    // Calculate macros in grams (protein: 4cal/g, carbs: 4cal/g, fat: 9cal/g)
    const proteinCalories = dailyCalories * proteinRatio;
    const carbCalories = dailyCalories * carbRatio;
    const fatCalories = dailyCalories * fatRatio;
    
    const proteinGrams = Math.round(proteinCalories / 4);
    const carbGrams = Math.round(carbCalories / 4);
    const fatGrams = Math.round(fatCalories / 9);
    
    // Set the calculated goals
    setCalorieGoal(Math.round(dailyCalories));
    setProteinGoal(proteinGrams);
    setCarbGoal(carbGrams);
    setFatGoal(fatGrams);
  };

  // Fetch recommended foods based on fitness goal
  const fetchRecommendedFoods = async () => {
    setIsRecommending(true);
    setLoading(true);
    setError(null);
    
    // Define food categories to search for based on fitness goal
    let foodCategories = [];
    
    if (fitnessGoal === 'bulk') {
      foodCategories = [
        'chicken breast', 'ground turkey', 'salmon', 'eggs', 'whey protein',
        'rice', 'oats', 'sweet potato', 'quinoa', 'beans',
        'avocado', 'olive oil', 'nuts', 'greek yogurt', 'cottage cheese'
      ];
    } else if (fitnessGoal === 'cut') {
      foodCategories = [
        'chicken breast', 'tuna', 'egg whites', 'tilapia', 'lean beef',
        'broccoli', 'spinach', 'kale', 'cauliflower', 'zucchini',
        'berries', 'cottage cheese', 'greek yogurt', 'tofu', 'tempeh'
      ];
    } else { // maintain
      foodCategories = [
        'chicken breast', 'turkey', 'salmon', 'eggs', 'tuna',
        'brown rice', 'quinoa', 'sweet potato', 'oats', 'vegetables',
        'avocado', 'olive oil', 'nuts', 'fruits', 'dairy'
      ];
    }
    
    try {
      // Fetch data for all food categories in parallel
      const fetchPromises = foodCategories.map(category => 
        fetch(`${USDA_API_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(category)}&pageSize=3`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(response => {
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          return response.json();
        })
      );
      
      const results = await Promise.all(fetchPromises);
      
      // Process all results
      let allFoods = [];
      
      results.forEach((data, index) => {
        // Extract the first 1-3 results for each category
        const categoryFoods = data.foods.slice(0, 3).map(food => ({
          fdcId: food.fdcId,
          description: food.description,
          category: foodCategories[index],
          brandName: food.brandName || 'Generic',
          servingSize: food.servingSize || 100,
          servingSizeUnit: food.servingSizeUnit || 'g',
          nutrients: food.foodNutrients.reduce((acc, nutrient) => {
            // USDA nutrient IDs: 1003 = Protein, 1005 = Carbs, 1004 = Fat, 1008 = Calories
            if (nutrient.nutrientId === 1003) acc.protein = nutrient.value || 0;
            if (nutrient.nutrientId === 1005) acc.carbs = nutrient.value || 0;
            if (nutrient.nutrientId === 1004) acc.fat = nutrient.value || 0;
            if (nutrient.nutrientId === 1008) acc.calories = nutrient.value || 0;
            return acc;
          }, { protein: 0, carbs: 0, fat: 0, calories: 0 }),
          // Assign estimated cost per 100g based on category
          // These are rough estimates and would be better if using a real price API
          estimatedCostPer100g: getEstimatedFoodCost(foodCategories[index])
        }));
        
        allFoods = [...allFoods, ...categoryFoods];
      });
      
      // Filter out foods with incomplete nutritional info
      const validFoods = allFoods.filter(food => 
        food.nutrients.protein > 0 || 
        food.nutrients.carbs > 0 || 
        food.nutrients.fat > 0
      );
      
      // Create a price lookup for foods
      const priceLookup = validFoods.reduce((acc, food) => {
        acc[food.fdcId] = food.estimatedCostPer100g;
        return acc;
      }, {});
      setFoodPriceEstimates(priceLookup);
      
      setRecommendedFoods(validFoods);
      
      // Generate initial meal plan with these foods
      if (validFoods.length > 0) {
        optimizeFoodSelections(validFoods);
      }
      
    } catch (err) {
      setError(err.message || 'Failed to fetch recommended foods');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setIsRecommending(false);
    }
  };

  // Returns estimated cost per 100g based on food category
  const getEstimatedFoodCost = (category) => {
    // These are rough estimates in $ per 100g
    const costMap = {
      'chicken breast': 0.75,
      'ground turkey': 0.65,
      'salmon': 1.50,
      'eggs': 0.40,
      'whey protein': 1.80,
      'rice': 0.15,
      'oats': 0.25,
      'sweet potato': 0.30,
      'quinoa': 0.55,
      'beans': 0.20,
      'avocado': 0.90,
      'olive oil': 0.70,
      'nuts': 1.20,
      'greek yogurt': 0.45,
      'cottage cheese': 0.50,
      'tuna': 0.95,
      'egg whites': 0.35,
      'tilapia': 0.85,
      'lean beef': 1.25,
      'broccoli': 0.35,
      'spinach': 0.40,
      'kale': 0.45,
      'cauliflower': 0.30,
      'zucchini': 0.25,
      'berries': 1.10,
      'tofu': 0.50,
      'tempeh': 0.70,
      'turkey': 0.80,
      'brown rice': 0.18,
      'vegetables': 0.35,
      'fruits': 0.60,
      'dairy': 0.50
    };
    
    return costMap[category] || 0.50; // Default to $0.50 if category not found
  };

  // Select the most cost-effective foods that meet macro goals
  const optimizeFoodSelections = (availableFoods) => {
    if (calorieGoal <= 0 || !availableFoods || availableFoods.length === 0) {
      return;
    }
    
    // Create different food groups to ensure variety
    const proteinFoods = availableFoods.filter(food => 
      food.nutrients.protein / food.nutrients.calories > 0.15
    ).sort((a, b) => 
      (a.nutrients.protein / a.estimatedCostPer100g) > (b.nutrients.protein / b.estimatedCostPer100g) ? -1 : 1
    );
    
    const carbFoods = availableFoods.filter(food => 
      food.nutrients.carbs / food.nutrients.calories > 0.15
    ).sort((a, b) => 
      (a.nutrients.carbs / a.estimatedCostPer100g) > (b.nutrients.carbs / b.estimatedCostPer100g) ? -1 : 1
    );
    
    const fatFoods = availableFoods.filter(food => 
      food.nutrients.fat / food.nutrients.calories > 0.15
    ).sort((a, b) => 
      (a.nutrients.fat / a.estimatedCostPer100g) > (b.nutrients.fat / b.estimatedCostPer100g) ? -1 : 1
    );
    
    // Select top foods from each category
    const selectedProteinFoods = proteinFoods.slice(0, 3);
    const selectedCarbFoods = carbFoods.slice(0, 3);
    const selectedFatFoods = fatFoods.slice(0, 2);
    
    // Combine selected foods
    const optimalFoods = [
      ...selectedProteinFoods, 
      ...selectedCarbFoods, 
      ...selectedFatFoods
    ];
    
    // Remove duplicates
    const uniqueOptimalFoods = optimalFoods.filter((food, index, self) =>
      index === self.findIndex((f) => f.fdcId === food.fdcId)
    );
    
    setSelectedFoods(uniqueOptimalFoods);
    
    // Calculate optimal quantities
    const newQuantities = {};
    
    // Start with a base quantity for all foods
    uniqueOptimalFoods.forEach(food => {
      newQuantities[food.fdcId] = 100; // Starting with 100g each
    });
    
    // Initialize macro totals based on initial quantities
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalCalories = 0;
    let totalCost = 0;
    
    // Calculate daily cost of foods
    uniqueOptimalFoods.forEach(food => {
      const quantity = 100; // start with 100g
      totalProtein += (food.nutrients.protein / 100) * quantity;
      totalCarbs += (food.nutrients.carbs / 100) * quantity;
      totalFat += (food.nutrients.fat / 100) * quantity;
      totalCalories += (food.nutrients.calories / 100) * quantity;
      totalCost += (food.estimatedCostPer100g * quantity / 100);
    });
    
    // Iteratively adjust quantities to meet macro goals with minimum cost
    const MAX_ITERATIONS = 100;
    let iterations = 0;
    
    while (iterations < MAX_ITERATIONS) {
      iterations++;
      
      // Check if we've met all our goals
      if (totalProtein >= proteinGoal && 
          totalCarbs >= carbGoal && 
          totalFat >= fatGoal && 
          totalCalories >= calorieGoal) {
        break;
      }
      
      // Determine which macro needs the most attention
      const proteinDeficit = Math.max(0, proteinGoal - totalProtein) / proteinGoal;
      const carbDeficit = Math.max(0, carbGoal - totalCarbs) / carbGoal;
      const fatDeficit = Math.max(0, fatGoal - totalFat) / fatGoal;
      
      let targetMacro;
      if (proteinDeficit >= carbDeficit && proteinDeficit >= fatDeficit) {
        targetMacro = 'protein';
      } else if (carbDeficit >= proteinDeficit && carbDeficit >= fatDeficit) {
        targetMacro = 'carbs';
      } else {
        targetMacro = 'fat';
      }
      
      // Find the most cost-effective food for the target macro
      let bestFood = null;
      let bestRatio = 0;
      
      uniqueOptimalFoods.forEach(food => {
        // Calculate the macro per dollar ratio
        let ratio;
        if (targetMacro === 'protein') {
          ratio = food.nutrients.protein / (food.estimatedCostPer100g || 0.5);
        } else if (targetMacro === 'carbs') {
          ratio = food.nutrients.carbs / (food.estimatedCostPer100g || 0.5);
        } else { // fat
          ratio = food.nutrients.fat / (food.estimatedCostPer100g || 0.5);
        }
        
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestFood = food;
        }
      });
      
      if (bestFood) {
        // Increase the quantity of the best food by 25g
        const fdcId = bestFood.fdcId;
        newQuantities[fdcId] = (newQuantities[fdcId] || 0) + 25;
        
        // Update totals
        totalProtein += (bestFood.nutrients.protein / 100) * 25;
        totalCarbs += (bestFood.nutrients.carbs / 100) * 25;
        totalFat += (bestFood.nutrients.fat / 100) * 25;
        totalCalories += (bestFood.nutrients.calories / 100) * 25;
        totalCost += (bestFood.estimatedCostPer100g * 25 / 100);
      }
    }
    
    setOptimizedQuantities(newQuantities);
    setTotalDailyCost(totalCost);
    
    // Create meal plan based on optimized foods
    generateMealPlan(uniqueOptimalFoods, newQuantities);
    
    // Store the best combination for display
    const bestCombo = uniqueOptimalFoods.map(food => ({
      ...food,
      quantity: newQuantities[food.fdcId] || 0
    }));
    
    setBestFoodCombination(bestCombo);
  };

  // Generate a daily meal plan from the optimized foods
  const generateMealPlan = (foods, quantities) => {
    if (!foods || foods.length === 0) return;
    
    // Group foods by type
    const proteinFoods = foods.filter(food => food.nutrients.protein / food.nutrients.calories > 0.15);
    const carbFoods = foods.filter(food => food.nutrients.carbs / food.nutrients.calories > 0.15);
    const fatFoods = foods.filter(food => food.nutrients.fat / food.nutrients.calories > 0.15);
    const mixedFoods = foods.filter(food => 
      food.nutrients.protein / food.nutrients.calories <= 0.15 &&
      food.nutrients.carbs / food.nutrients.calories <= 0.15 &&
      food.nutrients.fat / food.nutrients.calories <= 0.15
    );
    
    // Distribute foods across meals (simple distribution)
    const breakfast = [
      ...pickRandom(carbFoods, 1),
      ...pickRandom(proteinFoods, 1),
      ...pickRandom(fatFoods, 1)
    ];
    
    const lunch = [
      ...pickRandom(proteinFoods.filter(f => !breakfast.includes(f)), 1),
      ...pickRandom(carbFoods.filter(f => !breakfast.includes(f)), 1),
      ...pickRandom(mixedFoods, 1)
    ];
    
    const dinner = [
      ...pickRandom(proteinFoods.filter(f => !breakfast.includes(f) && !lunch.includes(f)), 1),
      ...pickRandom(carbFoods.filter(f => !breakfast.includes(f) && !lunch.includes(f)), 1),
      ...pickRandom(fatFoods.filter(f => !breakfast.includes(f)), 1)
    ];
    
    const snacks = [
      ...pickRandom(foods.filter(f => 
        !breakfast.includes(f) && 
        !lunch.includes(f) && 
        !dinner.includes(f)
      ), 2)
    ];
    
    // Calculate proportions for each meal (typical distribution)
    const breakfastPortion = 0.25; // 25% of daily intake
    const lunchPortion = 0.35;     // 35% of daily intake
    const dinnerPortion = 0.30;    // 30% of daily intake
    const snacksPortion = 0.10;    // 10% of daily intake
    
    // Adjust quantities for each meal
    const adjustQuantitiesForMeal = (mealFoods, portionOfDay) => {
      return mealFoods.map(food => {
        const totalQuantity = quantities[food.fdcId] || 0;
        return {
          ...food,
          mealQuantity: Math.round((totalQuantity * portionOfDay) / mealFoods.length)
        };
      });
    };
    
    const mealPlan = {
      breakfast: adjustQuantitiesForMeal(breakfast, breakfastPortion),
      lunch: adjustQuantitiesForMeal(lunch, lunchPortion),
      dinner: adjustQuantitiesForMeal(dinner, dinnerPortion),
      snacks: adjustQuantitiesForMeal(snacks, snacksPortion)
    };
    
    setMealPlan(mealPlan);
  };
  
  // Helper function to pick random items from an array
  const pickRandom = (array, count) => {
    if (!array || array.length === 0) return [];
    if (array.length <= count) return array;
    
    const result = [];
    const arrayCopy = [...array];
    
    for (let i = 0; i < count && arrayCopy.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * arrayCopy.length);
      result.push(arrayCopy[randomIndex]);
      arrayCopy.splice(randomIndex, 1);
    }
    
    return result;
  };

  // Run calculations when user metrics change
  useEffect(() => {
    calculateNutritionGoals();
  }, [currentWeight, targetWeight, height, age, gender, activityLevel, fitnessGoal]);

  // Calculate expected time to reach target weight
  const calculateWeightChangeTimeline = () => {
    if (!currentWeight || !targetWeight || currentWeight === targetWeight) {
      return null;
    }
    
    const weightDifference = Math.abs(targetWeight - currentWeight);
    const isGaining = targetWeight > currentWeight;
    
    // Assuming 1 pound of fat is ~3500 calories
    // For bulking: ~0.5-1 lb per week (we'll use 0.75)
    // For cutting: ~1-2 lb per week (we'll use 1.5)
    
    const weeklyRateInPounds = isGaining ? 0.75 : 1.5;
    const weeklyRateInKg = weeklyRateInPounds * 0.453592;
    
    const weeksToGoal = weightDifference / weeklyRateInKg;
    const monthsToGoal = weeksToGoal / 4.33;
    
    return {
      weeks: Math.round(weeksToGoal),
      months: monthsToGoal.toFixed(1)
    };
  };

  const timeline = calculateWeightChangeTimeline();

  // Convert kg to pounds and vice versa
  const kgToLbs = kg => (kg * 2.20462).toFixed(1);
  const lbsToKg = lbs => (lbs / 2.20462).toFixed(1);

  // Calculate totals based on current quantities
  const calculateTotals = () => {
    let proteinTotal = 0;
    let carbsTotal = 0;
    let fatTotal = 0;
    let caloriesTotal = 0;
    let costTotal = 0;
    
    selectedFoods.forEach(food => {
      const quantity = optimizedQuantities[food.fdcId] || 0;
      
      if (food.nutrients) {
        proteinTotal += (food.nutrients.protein / 100) * quantity;
        carbsTotal += (food.nutrients.carbs / 100) * quantity;
        fatTotal += (food.nutrients.fat / 100) * quantity;
        caloriesTotal += (food.nutrients.calories / 100) * quantity;
      }
      
      costTotal += (food.estimatedCostPer100g || 0) * quantity / 100;
    });
    
    return { 
      proteinTotal, 
      carbsTotal, 
      fatTotal, 
      caloriesTotal,
      costTotal
    };
  };

  const { proteinTotal, carbsTotal, fatTotal, caloriesTotal, costTotal } = calculateTotals();
  
  // Calculate percentages for progress bars
  const proteinPercentage = proteinGoal > 0 ? Math.min(100, (proteinTotal / proteinGoal) * 100) : 0;
  const carbPercentage = carbGoal > 0 ? Math.min(100, (carbsTotal / carbGoal) * 100) : 0;
  const fatPercentage = fatGoal > 0 ? Math.min(100, (fatTotal / fatGoal) * 100) : 0;
  const caloriePercentage = calorieGoal > 0 ? Math.min(100, (caloriesTotal / calorieGoal) * 100) : 0;

  return (
    <div className="fitness-planner">
      <h2 className="fitness-planner__title">Budget-Friendly Fitness Meal Planner</h2>
      
      {/* User Metrics Form */}
      <div className="fitness-planner__user-metrics">
        <h3 className="fitness-planner__section-title">Your Information</h3>
        <div className="fitness-planner__metrics-grid">
          <div className="fitness-planner__metric-group">
            <label>Current Weight (kg):</label>
            <input 
              type="number" 
              value={currentWeight} 
              onChange={(e) => setCurrentWeight(Math.max(0, parseFloat(e.target.value) || 0))} 
              min="0"
              step="0.5"
            />
            <span className="fitness-planner__unit-converter">{kgToLbs(currentWeight)} lbs</span>
          </div>
          
          <div className="fitness-planner__metric-group">
            <label>Target Weight (kg):</label>
            <input 
              type="number" 
              value={targetWeight} 
              onChange={(e) => setTargetWeight(Math.max(0, parseFloat(e.target.value) || 0))} 
              min="0"
              step="0.5"
            />
            <span className="fitness-planner__unit-converter">{kgToLbs(targetWeight)} lbs</span>
          </div>
          
          <div className="fitness-planner__metric-group">
            <label>Height (cm):</label>
            <input 
              type="number" 
              value={height} 
              onChange={(e) => setHeight(Math.max(0, parseInt(e.target.value) || 0))} 
              min="0"
            />
          </div>
          
          <div className="fitness-planner__metric-group">
            <label>Age:</label>
            <input 
              type="number" 
              value={age} 
              onChange={(e) => setAge(Math.max(0, parseInt(e.target.value) || 0))} 
              min="0"
            />
          </div>
          
          <div className="fitness-planner__metric-group">
            <label>Gender:</label>
            <select 
              value={gender} 
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          
          <div className="fitness-planner__metric-group">
            <label>Activity Level:</label>
            <select 
              value={activityLevel} 
              onChange={(e) => setActivityLevel(e.target.value)}
            >
              <option value="sedentary">Sedentary (little/no exercise)</option>
              <option value="light">Light (1-3 days/week)</option>
              <option value="moderate">Moderate (3-5 days/week)</option>
              <option value="active">Active (6-7 days/week)</option>
              <option value="veryActive">Very Active (2x per day)</option>
            </select>
          </div>
          
          <div className="fitness-planner__metric-group">
            <label>Fitness Goal:</label>
            <select 
              value={fitnessGoal} 
              onChange={(e) => setFitnessGoal(e.target.value)}
            >
              <option value="bulk">Bulking (Gain Weight)</option>
              <option value="maintain">Maintain Weight</option>
              <option value="cut">Cutting (Lose Weight)</option>
            </select>
          </div>
          
          <div className="fitness-planner__metric-group">
            <label>Daily Budget ($):</label>
            <input 
              type="number" 
              value={budgetConstraint} 
              onChange={(e) => setBudgetConstraint(Math.max(0, parseFloat(e.target.value) || 0))} 
              min="0" 
              step="0.01"
            />
          </div>
        </div>
        
        <button 
          className="fitness-planner__generate-btn"
          onClick={fetchRecommendedFoods}
          disabled={loading || isRecommending || !currentWeight || !height || !age}
        >
          {loading ? 'Generating...' : 'Generate Meal Plan'}
        </button>
      </div>
      
      {/* Nutrition Goals and Progress */}
      {calorieGoal > 0 && (
        <div className="fitness-planner__goals">
          <h3 className="fitness-planner__section-title">Your Daily Nutrition Targets</h3>
          <div className="fitness-planner__goals-grid">
            <div className="fitness-planner__goal-item">
              <div className="fitness-planner__goal-header">
                <span>Calories</span>
                <span>{Math.round(caloriesTotal)} / {calorieGoal} kcal</span>
              </div>
              <div className="fitness-planner__progress-bar">
                <div 
                  className="fitness-planner__progress-fill"
                  style={{ width: `${caloriePercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="fitness-planner__goal-item">
              <div className="fitness-planner__goal-header">
                <span>Protein</span>
                <span>{Math.round(proteinTotal)} / {proteinGoal} g</span>
              </div>
              <div className="fitness-planner__progress-bar">
                <div 
                  className="fitness-planner__progress-fill fitness-planner__progress-fill--protein"
                  style={{ width: `${proteinPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="fitness-planner__goal-item">
              <div className="fitness-planner__goal-header">
                <span>Carbs</span>
                <span>{Math.round(carbsTotal)} / {carbGoal} g</span>
              </div>
              <div className="fitness-planner__progress-bar">
                <div 
                  className="fitness-planner__progress-fill fitness-planner__progress-fill--carbs"
                  style={{ width: `${carbPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="fitness-planner__goal-item">
              <div className="fitness-planner__goal-header">
                <span>Fat</span>
                <span>{Math.round(fatTotal)} / {fatGoal} g</span>
              </div>
              <div className="fitness-planner__progress-bar">
                <div 
                  className="fitness-planner__progress-fill fitness-planner__progress-fill--fat"
                  style={{ width: `${fatPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {timeline && (
            <div className="fitness-planner__timeline">
              <p>
                Expected time to reach your target weight: 
                <strong>{timeline.weeks} weeks</strong> (~{timeline.months} months)
              </p>
            </div>
          )}
          
          <div className="fitness-planner__cost-summary">
            <p>
              Daily food cost: <strong>${costTotal.toFixed(2)}</strong>
              {budgetConstraint > 0 && (
                <span> / ${budgetConstraint.toFixed(2)} budget</span>
              )}
            </p>
          </div>
        </div>
      )}
      
      {/* Meal Plan Display */}
      {Object.values(mealPlan).some(meal => meal.length > 0) && (
        <div className="fitness-planner__meal-plan">
          <h3 className="fitness-planner__section-title">Your Optimized Meal Plan</h3>
          
          <div className="fitness-planner__meal-cards">
            {/* Breakfast */}
            <div className="fitness-planner__meal-card">
              <h4>Breakfast</h4>
              <ul className="fitness-planner__meal-items">
                {mealPlan.breakfast.map((food, index) => (
                  <li key={`breakfast-${index}`} className="fitness-planner__meal-item">
                    <span className="fitness-planner__food-name">{food.description}</span>
                    <span className="fitness-planner__food-quantity">{food.mealQuantity}g</span>
                    <div className="fitness-planner__food-macros">
                      <span>{Math.round((food.nutrients.calories / 100) * food.mealQuantity)} kcal</span>
                      <span>{Math.round((food.nutrients.protein / 100) * food.mealQuantity)}g P</span>
                      <span>{Math.round((food.nutrients.carbs / 100) * food.mealQuantity)}g C</span>
                      <span>{Math.round((food.nutrients.fat / 100) * food.mealQuantity)}g F</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Lunch */}
            <div className="fitness-planner__meal-card">
              <h4>Lunch</h4>
              <ul className="fitness-planner__meal-items">
                {mealPlan.lunch.map((food, index) => (
                  <li key={`lunch-${index}`} className="fitness-planner__meal-item">
                    <span className="fitness-planner__food-name">{food.description}</span>
                    <span className="fitness-planner__food-quantity">{food.mealQuantity}g</span>
                    <div className="fitness-planner__food-macros">
                      <span>{Math.round((food.nutrients.calories / 100) * food.mealQuantity)} kcal</span>
                      <span>{Math.round((food.nutrients.protein / 100) * food.mealQuantity)}g P</span>
                      <span>{Math.round((food.nutrients.carbs / 100) * food.mealQuantity)}g C</span>
                      <span>{Math.round((food.nutrients.fat / 100) * food.mealQuantity)}g F</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Dinner */}
            <div className="fitness-planner__meal-card">
              <h4>Dinner</h4>
              <ul className="fitness-planner__meal-items">
                {mealPlan.dinner.map((food, index) => (
                  <li key={`dinner-${index}`} className="fitness-planner__meal-item">
                    <span className="fitness-planner__food-name">{food.description}</span>
                    <span className="fitness-planner__food-quantity">{food.mealQuantity}g</span>
                    <div className="fitness-planner__food-macros">
                      <span>{Math.round((food.nutrients.calories / 100) * food.mealQuantity)} kcal</span>
                      <span>{Math.round((food.nutrients.protein / 100) * food.mealQuantity)}g P</span>
                      <span>{Math.round((food.nutrients.carbs / 100) * food.mealQuantity)}g C</span>
                      <span>{Math.round((food.nutrients.fat / 100) * food.mealQuantity)}g F</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Snacks */}
            <div className="fitness-planner__meal-card">
              <h4>Snacks</h4>
              <ul className="fitness-planner__meal-items">
                {mealPlan.snacks.map((food, index) => (
                  <li key={`snack-${index}`} className="fitness-planner__meal-item">
                    <span className="fitness-planner__food-name">{food.description}</span>
                    <span className="fitness-planner__food-quantity">{food.mealQuantity}g</span>
                    <div className="fitness-planner__food-macros">
                      <span>{Math.round((food.nutrients.calories / 100) * food.mealQuantity)} kcal</span>
                      <span>{Math.round((food.nutrients.protein / 100) * food.mealQuantity)}g P</span>
                      <span>{Math.round((food.nutrients.carbs / 100) * food.mealQuantity)}g C</span>
                      <span>{Math.round((food.nutrients.fat / 100) * food.mealQuantity)}g F</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Food Selections */}
      {selectedFoods.length > 0 && (
        <div className="fitness-planner__food-selections">
          <h3 className="fitness-planner__section-title">Optimal Food Selections</h3>
          <div className="fitness-planner__food-table-container">
            <table className="fitness-planner__food-table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Quantity</th>
                  <th>Protein</th>
                  <th>Carbs</th>
                  <th>Fat</th>
                  <th>Calories</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {selectedFoods.map((food) => (
                  <tr key={food.fdcId}>
                    <td>{food.description}</td>
                    <td>{optimizedQuantities[food.fdcId] || 0}g</td>
                    <td>{Math.round((food.nutrients.protein / 100) * (optimizedQuantities[food.fdcId] || 0))}g</td>
                    <td>{Math.round((food.nutrients.carbs / 100) * (optimizedQuantities[food.fdcId] || 0))}g</td>
                    <td>{Math.round((food.nutrients.fat / 100) * (optimizedQuantities[food.fdcId] || 0))}g</td>
                    <td>{Math.round((food.nutrients.calories / 100) * (optimizedQuantities[food.fdcId] || 0))} kcal</td>
                    <td>${((food.estimatedCostPer100g || 0) * (optimizedQuantities[food.fdcId] || 0) / 100).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="fitness-planner__food-table-totals">
                  <td colSpan="2">Total</td>
                  <td>{Math.round(proteinTotal)}g</td>
                  <td>{Math.round(carbsTotal)}g</td>
                  <td>{Math.round(fatTotal)}g</td>
                  <td>{Math.round(caloriesTotal)} kcal</td>
                  <td>${costTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="fitness-planner__loading">
          <p>Generating your personalized meal plan...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="fitness-planner__error">
          <p>Error: {error}</p>
        </div>
      )}
    </div>
  );
};

export default FitnessMealPlanner;