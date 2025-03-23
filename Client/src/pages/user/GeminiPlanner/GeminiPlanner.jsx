import React, { useState, useEffect } from 'react';
import './GeminiPlanner.css';
// import './../FitnessMealPlanner/FitnessMealPlanner.css'

const GeminiPlanner = () => {
  // Gemini API key (you should store this securely in a production environment)
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY ; // Replace with your actual API key
  const GEMINI_API_URL = import.meta.env.VITE_GEMINI_API_URL;

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

  // Function to fetch food recommendations from Gemini API
// Update your fetchRecommendedFoods function to handle the Gemini response format correctly
const fetchRecommendedFoods = async () => {
    setIsRecommending(true);
    setLoading(true);
    setError(null);
    
    try {
      // Create a prompt for Gemini based on user's fitness goals and metrics
      const prompt = `
        Generate a detailed meal plan recommendation for a ${age} year old ${gender} with the following metrics:
        - Current weight: ${currentWeight} kg (${kgToLbs(currentWeight)} lbs)
        - Target weight: ${targetWeight} kg (${kgToLbs(targetWeight)} lbs)
        - Height: ${height} cm
        - Activity level: ${activityLevel}
        - Fitness goal: ${fitnessGoal}
        - Daily calorie target: ${calorieGoal} kcal
        - Macronutrient targets: ${proteinGoal}g protein, ${carbGoal}g carbs, ${fatGoal}g fat
        ${budgetConstraint > 0 ? `- Daily food budget: $${budgetConstraint}` : ''}
  
        For each food item, provide the following details in a structured JSON format:
        1. Name/description of the food
        2. Category (protein, carb, fat, or mixed)
        3. Nutrients per 100g (protein, carbs, fat, calories)
        4. Recommended quantity in grams
        5. Estimated cost per 100g in USD
        6. Meal assignment (breakfast, lunch, dinner, or snack)
  
        The response should be in valid JSON format with an array of food objects without any additional text, markdown, or code formatting.
      `;
  
      // Call Gemini API
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });
  
      if (!response.ok) {
        throw new Error(`Gemini API request failed with status ${response.status}`);
      }
  
      const data = await response.json();
      
      // Extract the text response from Gemini
      const textResponse = data.candidates[0].content.parts[0].text;
      
      // Process the text response to extract the JSON data
      let foodData = [];
      
      // Check if the response contains a JSON array
      // First, try to match a JSON array pattern
      const jsonMatch = textResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (jsonMatch) {
        // Clean up the text by removing code block markers, if present
        const cleanedJson = jsonMatch[0].replace(/```json|```/g, '').trim();
        
        try {
          foodData = JSON.parse(cleanedJson);
        } catch (err) {
          console.error("Failed to parse JSON from Gemini response", err);
          console.log("Attempted to parse:", cleanedJson);
          throw new Error("Invalid JSON response from Gemini");
        }
      } else {
        // If no JSON array pattern found, try to extract from code blocks
        const codeBlockMatch = textResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        
        if (codeBlockMatch) {
          try {
            foodData = JSON.parse(codeBlockMatch[1]);
          } catch (err) {
            console.error("Failed to parse JSON from code block", err);
            throw new Error("Invalid JSON in code block from Gemini");
          }
        } else {
          throw new Error("Couldn't find valid JSON data in Gemini response");
        }
      }
      
      // Process the food data
      const processedFoods = foodData.map(food => ({
        fdcId: food.id || `food-${Math.random().toString(36).substr(2, 9)}`,
        description: food.description,
        category: food.category,
        nutrients: food.nutrients,
        brandName: 'AI Recommended',
        servingSize: 100,
        servingSizeUnit: 'g',
        estimatedCostPer100g: food.estimatedCostPer100g,
        meal: food.meal,
        recommendedQuantity: food.recommendedQuantity
      }));
      
      // Calculate optimal quantities based on Gemini's recommendations
      const optimizedQuantities = {};
      processedFoods.forEach(food => {
        optimizedQuantities[food.fdcId] = food.recommendedQuantity;
      });
      
      // Create a price lookup for foods
      const priceLookup = processedFoods.reduce((acc, food) => {
        acc[food.fdcId] = food.estimatedCostPer100g;
        return acc;
      }, {});
      
      setFoodPriceEstimates(priceLookup);
      setRecommendedFoods(processedFoods);
      setSelectedFoods(processedFoods);
      setOptimizedQuantities(optimizedQuantities);
      
      // Generate meal plan from the recommended foods
      generateMealPlanFromGemini(processedFoods, optimizedQuantities);
      
      // Calculate total daily cost
      const totalCost = processedFoods.reduce((sum, food) => {
        return sum + (food.estimatedCostPer100g * food.recommendedQuantity / 100);
      }, 0);
      
      setTotalDailyCost(totalCost);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch recommended foods from Gemini');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setIsRecommending(false);
    }
  };

  // Generate meal plan from Gemini response
  const generateMealPlanFromGemini = (foods, quantities) => {
    // Group foods by meal
    const mealGroups = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: []
    };
    
    foods.forEach(food => {
      const mealType = food.meal.toLowerCase();
      const mealKey = mealType === 'snack' ? 'snacks' : mealType;
      
      if (mealGroups[mealKey]) {
        mealGroups[mealKey].push({
          ...food,
          mealQuantity: quantities[food.fdcId] || food.recommendedQuantity
        });
      }
    });
    
    setMealPlan(mealGroups);
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
      <h2 className="fitness-planner__title">AI-Powered Fitness Meal Planner</h2>
      
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
          {loading ? 'Generating AI Meal Plan...' : 'Generate AI Meal Plan'}
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
          <h3 className="fitness-planner__section-title">Your AI-Optimized Meal Plan</h3>
          
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
          <h3 className="fitness-planner__section-title">AI-Recommended Foods</h3>
          <div className="fitness-planner__food-table-container">
            <table className="fitness-planner__food-table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Category</th>
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
                    <td>{food.category}</td>
                    <td>{optimizedQuantities[food.fdcId] || 0}g</td>
                    <td>{Math.round((food.nutrients.protein / 100) * (optimizedQuantities[food.fdcId] || 0))}g</td>
                    <td>{Math.round((food.nutrients.carbs / 100) * (optimizedQuantities[food.fdcId] || 0))}g</td>
                    <td>{Math.round((food.nutrients.fat / 100) * (optimizedQuantities[food.fdcId] || 0))}g</td>
                    <td>{Math.round((food.nutrients.calories / 100) * (optimizedQuantities[food.fdcId] || 0))} kcal</td>
                    <td>${((food.estimatedCostPer100g || 0) * (optimizedQuantities[food.fdcId] || 0) / 100).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="fitness-planner__food-table-totals">
                  <td colSpan="3">Total</td>
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
      
      {/* Error display */}
      {error && (
        <div className="fitness-planner__error">
          <p>Error: {error}</p>
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="fitness-planner__loading">
          <p>Loading...</p>
          <div className="fitness-planner__loading-spinner"></div>
        </div>
      )}
      
      {/* Tips and guidance section */}
      {selectedFoods.length > 0 && (
        <div className="fitness-planner__tips">
          <h3 className="fitness-planner__section-title">Nutrition Tips</h3>
          <ul className="fitness-planner__tip-list">
            <li>Aim to distribute your protein intake evenly throughout the day for optimal muscle synthesis.</li>
            <li>Stay hydrated! Drink at least 8 glasses of water daily alongside this meal plan.</li>
            <li>Time your carb intake around your workouts for improved performance and recovery.</li>
            <li>Consider taking progress photos weekly to track visual changes as you follow this plan.</li>
            <li>Adjust portion sizes if you're not seeing progress after 2-3 weeks.</li>
          </ul>
        </div>
      )}
      
      {/* Save/Export functionality */}
      {selectedFoods.length > 0 && (
        <div className="fitness-planner__export">
          <button className="fitness-planner__export-btn">
            Export Meal Plan (PDF)
          </button>
          <button className="fitness-planner__export-btn">
            Save Plan
          </button>
        </div>
      )}
      
      {/* Footer */}
      <div className="fitness-planner__footer">
        <p>Powered by Gemini AI | Disclaimer: Consult a healthcare professional before starting any new diet plan</p>
      </div>
    </div>
  );
};

// CSS styles that would be in the FitnessMealPlanner.css file
// This is just a placeholder, you'd want to create the actual CSS file
// and import it at the top of your component file

export default GeminiPlanner;