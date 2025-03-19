import React, { useState } from 'react';
import './NutritionGoalTracker.css'

const NutritionGoalTracker = () => {
  const USDA_API_KEY = 'ZCTTFISfUYkwUQEZLM0J63N9bghXMxXAsidrMLbH';
  const USDA_API_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

  const [proteinGoal, setProteinGoal] = useState(0);
  const [carbGoal, setCarbGoal] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [optimizedQuantities, setOptimizedQuantities] = useState({});
  const [goalsMet, setGoalsMet] = useState(false);
  const [manualAdjustment, setManualAdjustment] = useState(false);

  // Search for foods in USDA database
  const searchFoods = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${USDA_API_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(searchQuery)}&pageSize=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Map the results to a simpler format
      const formattedResults = data.foods.map(food => ({
        fdcId: food.fdcId,
        description: food.description,
        brandName: food.brandName || 'Generic',
        servingSize: food.servingSize || 100,
        servingSizeUnit: food.servingSizeUnit || 'g',
        nutrients: food.foodNutrients.reduce((acc, nutrient) => {
          // USDA nutrient IDs: 1003 = Protein, 1005 = Carbs, 1008 = Calories
          if (nutrient.nutrientId === 1003) acc.protein = nutrient.value || 0;
          if (nutrient.nutrientId === 1005) acc.carbs = nutrient.value || 0;
          if (nutrient.nutrientId === 1008) acc.calories = nutrient.value || 0;
          return acc;
        }, { protein: 0, carbs: 0, calories: 0 })
      }));
      
      setSearchResults(formattedResults);
    } catch (err) {
      setError(err.message || 'Failed to fetch foods');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add food to selected foods
  const addFood = (food) => {
    if (!selectedFoods.some(f => f.fdcId === food.fdcId)) {
      setSelectedFoods(prev => [...prev, food]);
      setOptimizedQuantities(prev => ({
        ...prev,
        [food.fdcId]: 100 // Start with 100g for new foods
      }));
    }
  };

  // Remove food from selected foods
  const removeFood = (fdcId) => {
    setSelectedFoods(prev => prev.filter(food => food.fdcId !== fdcId));
    setOptimizedQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[fdcId];
      return newQuantities;
    });
  };

  // Handle quantity change for a specific food
  const handleQuantityChange = (fdcId, quantity) => {
    setManualAdjustment(true);
    setOptimizedQuantities(prev => ({
      ...prev,
      [fdcId]: Math.max(0, quantity)
    }));
  };

  // Calculate optimal quantities to meet goals
  const calculateOptimalQuantities = () => {
    // Don't calculate if we don't have goals or foods
    if ((proteinGoal <= 0 && carbGoal <= 0 && calorieGoal <= 0) || selectedFoods.length === 0) {
      return;
    }

    setManualAdjustment(false);

    // Filter foods that have nutrition data
    const foodsWithData = selectedFoods.filter(food => 
      food.nutrients && 
      (food.nutrients.protein > 0 || food.nutrients.carbs > 0 || food.nutrients.calories > 0)
    );

    if (foodsWithData.length === 0) {
      return;
    }

    // Initial quantities set to 100g of each food
    let newQuantities = {};
    foodsWithData.forEach(food => {
      newQuantities[food.fdcId] = 100;
    });
    
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalCalories = 0;
    
    // Calculate initial totals
    foodsWithData.forEach(food => {
      totalProtein += (food.nutrients.protein / 100) * 100;
      totalCarbs += (food.nutrients.carbs / 100) * 100;
      totalCalories += (food.nutrients.calories / 100) * 100;
    });

    // Adjust quantities to meet goals
    const MAX_ITERATIONS = 100;
    let iterations = 0;
    let adjustmentMade = true;

    while (adjustmentMade && iterations < MAX_ITERATIONS) {
      adjustmentMade = false;
      iterations++;

      // Check if we're under protein goal
      if (proteinGoal > 0 && totalProtein < proteinGoal) {
        // Find food with highest protein-to-carb ratio
        const bestProteinFood = foodsWithData.reduce((best, current) => {
          const currentRatio = current.nutrients.protein / 
                              (current.nutrients.carbs || 0.1);
          const bestRatio = best ? 
            best.nutrients.protein / (best.nutrients.carbs || 0.1) : 0;
          
          return currentRatio > bestRatio ? current : best;
        }, null);

        if (bestProteinFood) {
          const increment = 25; // increment by 25g
          newQuantities[bestProteinFood.fdcId] += increment;
          totalProtein += (bestProteinFood.nutrients.protein / 100) * increment;
          totalCarbs += (bestProteinFood.nutrients.carbs / 100) * increment;
          totalCalories += (bestProteinFood.nutrients.calories / 100) * increment;
          adjustmentMade = true;
        }
      }

      // Check if we're under carb goal
      if (carbGoal > 0 && totalCarbs < carbGoal) {
        // Find food with highest carb-to-protein ratio
        const bestCarbFood = foodsWithData.reduce((best, current) => {
          const currentRatio = current.nutrients.carbs / 
                              (current.nutrients.protein || 0.1);
          const bestRatio = best ? 
            best.nutrients.carbs / (best.nutrients.protein || 0.1) : 0;
          
          return currentRatio > bestRatio ? current : best;
        }, null);

        if (bestCarbFood) {
          const increment = 25; // increment by 25g
          newQuantities[bestCarbFood.fdcId] += increment;
          totalProtein += (bestCarbFood.nutrients.protein / 100) * increment;
          totalCarbs += (bestCarbFood.nutrients.carbs / 100) * increment;
          totalCalories += (bestCarbFood.nutrients.calories / 100) * increment;
          adjustmentMade = true;
        }
      }

      // Check if we're under calorie goal
      if (calorieGoal > 0 && totalCalories < calorieGoal) {
        // Find food with highest calorie density
        const bestCalorieFood = foodsWithData.reduce((best, current) => {
          return (current.nutrients.calories > (best?.nutrients.calories || 0)) ? current : best;
        }, null);

        if (bestCalorieFood) {
          const increment = 25; // increment by 25g
          newQuantities[bestCalorieFood.fdcId] += increment;
          totalProtein += (bestCalorieFood.nutrients.protein / 100) * increment;
          totalCarbs += (bestCalorieFood.nutrients.carbs / 100) * increment;
          totalCalories += (bestCalorieFood.nutrients.calories / 100) * increment;
          adjustmentMade = true;
        }
      }

      // If we've met all goals, we can stop
      if ((proteinGoal <= 0 || totalProtein >= proteinGoal) && 
          (carbGoal <= 0 || totalCarbs >= carbGoal) && 
          (calorieGoal <= 0 || totalCalories >= calorieGoal)) {
        break;
      }
    }

    setOptimizedQuantities(newQuantities);
  };

  // Calculate totals based on current quantities
  const calculateTotals = () => {
    let proteinTotal = 0;
    let carbsTotal = 0;
    let caloriesTotal = 0;
    
    selectedFoods.forEach(food => {
      const quantity = optimizedQuantities[food.fdcId] || 0;
      
      if (food.nutrients) {
        proteinTotal += (food.nutrients.protein / 100) * quantity;
        carbsTotal += (food.nutrients.carbs / 100) * quantity;
        caloriesTotal += (food.nutrients.calories / 100) * quantity;
      }
    });
    
    const goalsAreMet = 
      (proteinGoal <= 0 || proteinTotal >= proteinGoal) && 
      (carbGoal <= 0 || carbsTotal >= carbGoal) && 
      (calorieGoal <= 0 || caloriesTotal >= calorieGoal);
    
    if (goalsAreMet !== goalsMet) {
      setGoalsMet(goalsAreMet);
    }
    
    return { proteinTotal, carbsTotal, caloriesTotal };
  };

  const { proteinTotal, carbsTotal, caloriesTotal } = calculateTotals();
  
  // Calculate percentages for progress bars
  const proteinPercentage = proteinGoal > 0 ? Math.min(100, (proteinTotal / proteinGoal) * 100) : 0;
  const carbPercentage = carbGoal > 0 ? Math.min(100, (carbsTotal / carbGoal) * 100) : 0;
  const caloriePercentage = calorieGoal > 0 ? Math.min(100, (caloriesTotal / calorieGoal) * 100) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    searchFoods();
  };

  return (
    <div className="nutrition-tracker">
      <h2 className="nutrition-tracker__title">Nutrition Goal Tracker</h2>
      
      <div className="nutrition-tracker__goals">
        <h3 className="nutrition-tracker__goals-title">Set Your Nutrition Goals</h3>
        <div className="nutrition-tracker__goals-inputs">
          <div className="nutrition-tracker__goal-group">
            <label className="nutrition-tracker__goal-label">Protein Goal (g):</label>
            <input 
              type="number" 
              value={proteinGoal} 
              onChange={(e) => setProteinGoal(Math.max(0, parseInt(e.target.value) || 0))} 
              min="0"
              className="nutrition-tracker__goal-input"
            />
          </div>
          <div className="nutrition-tracker__goal-group">
            <label className="nutrition-tracker__goal-label">Carbohydrates Goal (g):</label>
            <input 
              type="number" 
              value={carbGoal} 
              onChange={(e) => setCarbGoal(Math.max(0, parseInt(e.target.value) || 0))} 
              min="0"
              className="nutrition-tracker__goal-input"
            />
          </div>
          <div className="nutrition-tracker__goal-group">
            <label className="nutrition-tracker__goal-label">Calories Goal (kcal):</label>
            <input 
              type="number" 
              value={calorieGoal} 
              onChange={(e) => setCalorieGoal(Math.max(0, parseInt(e.target.value) || 0))} 
              min="0"
              className="nutrition-tracker__goal-input"
            />
          </div>
        </div>
      </div>
      
      {/* Display progress and optimized quantities */}
      <div className="nutrition-tracker__progress">
        <h3 className="nutrition-tracker__progress-title">Nutrition Progress</h3>
        
        {selectedFoods.length === 0 ? (
          <p className="nutrition-tracker__empty-message">No foods selected yet. Search and add foods below.</p>
        ) : (proteinGoal <= 0 && carbGoal <= 0 && calorieGoal <= 0) ? (
          <p className="nutrition-tracker__empty-message">Set your nutrition goals above to track progress.</p>
        ) : (
          <div>
            {/* Optimize Button */}
            <button 
              onClick={calculateOptimalQuantities} 
              className="nutrition-tracker__optimize-button"
              disabled={selectedFoods.length === 0}
            >
              Optimize Food Quantities
            </button>
            
            {/* Progress Bars */}
            <div className="nutrition-tracker__progress-bars">
              {proteinGoal > 0 && (
                <div className="nutrition-tracker__progress-item">
                  <div className="nutrition-tracker__progress-labels">
                    <span className="nutrition-tracker__progress-label">Protein: {proteinTotal.toFixed(1)}g of {proteinGoal}g</span>
                    <span className="nutrition-tracker__progress-percentage">{proteinPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="nutrition-tracker__progress-bar-container">
                    <div 
                      className={`nutrition-tracker__progress-bar ${proteinPercentage >= 100 ? 'nutrition-tracker__progress-bar--protein-complete' : 'nutrition-tracker__progress-bar--protein'}`} 
                      style={{ width: `${proteinPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {carbGoal > 0 && (
                <div className="nutrition-tracker__progress-item">
                  <div className="nutrition-tracker__progress-labels">
                    <span className="nutrition-tracker__progress-label">Carbs: {carbsTotal.toFixed(1)}g of {carbGoal}g</span>
                    <span className="nutrition-tracker__progress-percentage">{carbPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="nutrition-tracker__progress-bar-container">
                    <div 
                      className={`nutrition-tracker__progress-bar ${carbPercentage >= 100 ? 'nutrition-tracker__progress-bar--carbs-complete' : 'nutrition-tracker__progress-bar--carbs'}`} 
                      style={{ width: `${carbPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {calorieGoal > 0 && (
                <div className="nutrition-tracker__progress-item">
                  <div className="nutrition-tracker__progress-labels">
                    <span className="nutrition-tracker__progress-label">Calories: {caloriesTotal.toFixed(1)} of {calorieGoal} kcal</span>
                    <span className="nutrition-tracker__progress-percentage">{caloriePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="nutrition-tracker__progress-bar-container">
                    <div 
                      className={`nutrition-tracker__progress-bar ${caloriePercentage >= 100 ? 'nutrition-tracker__progress-bar--calories-complete' : 'nutrition-tracker__progress-bar--calories'}`} 
                      style={{ width: `${caloriePercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {goalsMet ? 
                <p className="nutrition-tracker__goals-met">✓ All set goals met!</p> : 
                <p className="nutrition-tracker__goals-not-met">⚠ Goals not fully met with current food selections.</p>
              }
            </div>
            
            <h4 className="nutrition-tracker__quantities-title">Food Quantities</h4>
            <div className="nutrition-tracker__quantities">
              <ul className="nutrition-tracker__quantities-list">
                {selectedFoods.map((food) => (
                  <li key={food.fdcId} className="nutrition-tracker__quantity-item">
                    <div className="nutrition-tracker__quantity-header">
                      <div className="nutrition-tracker__food-name">{food.description}</div>
                      <button 
                        onClick={() => removeFood(food.fdcId)} 
                        className="nutrition-tracker__remove-button"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="nutrition-tracker__quantity-controls">
                      <div className="nutrition-tracker__quantity-adjuster">
                        <button 
                          onClick={() => handleQuantityChange(food.fdcId, (optimizedQuantities[food.fdcId] || 0) - 25)}
                          className="nutrition-tracker__quantity-button nutrition-tracker__quantity-button--decrement"
                          disabled={(optimizedQuantities[food.fdcId] || 0) <= 0}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={optimizedQuantities[food.fdcId] || 0}
                          onChange={(e) => handleQuantityChange(food.fdcId, parseInt(e.target.value) || 0)}
                          className="nutrition-tracker__quantity-input"
                          min="0"
                        />
                        <button 
                          onClick={() => handleQuantityChange(food.fdcId, (optimizedQuantities[food.fdcId] || 0) + 25)}
                          className="nutrition-tracker__quantity-button nutrition-tracker__quantity-button--increment"
                        >
                          +
                        </button>
                        <span className="nutrition-tracker__quantity-unit">g</span>
                      </div>
                      
                      <div className="nutrition-tracker__nutrient-info">
                        {food.nutrients && (
                          <>
                            Protein: {((food.nutrients.protein / 100) * (optimizedQuantities[food.fdcId] || 0)).toFixed(1)}g, 
                            Carbs: {((food.nutrients.carbs / 100) * (optimizedQuantities[food.fdcId] || 0)).toFixed(1)}g
                            {food.nutrients.calories ? `, Calories: ${((food.nutrients.calories / 100) * (optimizedQuantities[food.fdcId] || 0)).toFixed(1)} kcal` : ''}
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Food Search Area */}
      <div className="nutrition-tracker__search">
        <h3 className="nutrition-tracker__search-title">Search and Add Foods</h3>
        
        <form onSubmit={handleSubmit} className="nutrition-tracker__search-form">
          <div className="nutrition-tracker__search-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for foods..."
              className="nutrition-tracker__search-input"
            />
            <button 
              type="submit" 
              className="nutrition-tracker__search-button"
              disabled={loading || !searchQuery.trim()}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        
        {error && (
          <div className="nutrition-tracker__error">
            Error: {error}
          </div>
        )}
        
        {searchResults.length > 0 && (
          <div className="nutrition-tracker__results">
            <h4 className="nutrition-tracker__results-title">Search Results:</h4>
            <ul className="nutrition-tracker__results-list">
              {searchResults.map((food) => (
                <li key={food.fdcId} className="nutrition-tracker__result-item">
                  <div className="nutrition-tracker__result-content">
                    <div>
                      <div className="nutrition-tracker__result-name">{food.description}</div>
                      <div className="nutrition-tracker__result-info">
                        {food.brandName !== 'Generic' && `${food.brandName}, `}
                        Protein: {food.nutrients.protein}g, Carbs: {food.nutrients.carbs}g
                        {food.nutrients.calories ? `, Calories: ${food.nutrients.calories} kcal` : ''}
                        (per 100g)
                      </div>
                    </div>
                    <button 
                      onClick={() => addFood(food)} 
                      className="nutrition-tracker__add-button"
                      disabled={selectedFoods.some(f => f.fdcId === food.fdcId)}
                    >
                      {selectedFoods.some(f => f.fdcId === food.fdcId) ? 'Added' : 'Add'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {searchQuery && searchResults.length === 0 && !loading && (
          <p className="nutrition-tracker__no-results">No results found. Try different keywords.</p>
        )}
      </div>
    </div>
  );
};

export default NutritionGoalTracker;