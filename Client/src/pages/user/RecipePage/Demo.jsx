import React, { useState, useEffect } from 'react';
import './Demo.css';

// Mock data for when API fails
const MOCK_RECIPES = {
  "potato": [
    {
      title: "Baked Potato",
      servings: "4",
      ingredients: "4 large russet potatoes|2 tablespoons olive oil|1 teaspoon salt|1/4 teaspoon black pepper|Optional toppings: sour cream, chives, butter, cheese",
      instructions: "Preheat oven to 425°F. Scrub potatoes and dry well. Poke several holes in each potato with a fork. Rub with olive oil and sprinkle with salt and pepper. Bake directly on oven rack for 45-60 minutes until skin is crisp and inside is tender."
    },
    {
      title: "Mashed Potatoes",
      servings: "6",
      ingredients: "3 pounds russet potatoes, peeled and cut into chunks|1/2 cup milk, warmed|4 tablespoons butter|1 teaspoon salt|1/4 teaspoon pepper|2 cloves garlic, minced (optional)",
      instructions: "Place potatoes in large pot and cover with cold water. Bring to boil, reduce heat and simmer until tender, about 20 minutes. Drain well. Return to pot and mash. Add warm milk, butter, salt and pepper. Mix until smooth and creamy."
    }
  ],
  "chicken": [
    {
      title: "Roasted Chicken",
      servings: "6",
      ingredients: "1 whole chicken (about 4-5 pounds)|2 tablespoons olive oil|1 teaspoon salt|1/2 teaspoon black pepper|2 cloves garlic, minced|1 lemon, halved|Fresh herbs (rosemary, thyme)",
      instructions: "Preheat oven to 425°F. Pat chicken dry. Rub with oil, salt, pepper and garlic. Place lemon and herbs in cavity. Roast for 1 hour 15 minutes until internal temperature reaches 165°F. Rest 15 minutes before carving."
    }
  ],
  "pasta": [
    {
      title: "Spaghetti with Tomato Sauce",
      servings: "4",
      ingredients: "1 pound spaghetti|2 tablespoons olive oil|1 onion, chopped|3 cloves garlic, minced|1 can (28 oz) crushed tomatoes|1 teaspoon dried basil|1 teaspoon dried oregano|Salt and pepper to taste|Grated parmesan cheese",
      instructions: "Cook pasta according to package directions. Meanwhile, heat oil in large pan over medium heat. Add onion and cook until soft. Add garlic and cook 30 seconds. Add tomatoes and herbs. Simmer 15 minutes. Season with salt and pepper. Serve sauce over pasta with parmesan."
    }
  ]
};

// Mock nutrition data
const MOCK_NUTRITION = {
  "Baked Potato": { protein: 4.5, carbs: 37 },
  "Mashed Potatoes": { protein: 4, carbs: 35 },
  "Roasted Chicken": { protein: 38, carbs: 0 },
  "Spaghetti with Tomato Sauce": { protein: 10, carbs: 70 },
};

const Demo = () => {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  
  // Nutrition goals and tracking
  const [proteinGoal, setProteinGoal] = useState(50);  // Default values
  const [carbGoal, setCarbGoal] = useState(250);       // Default values
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [nutritionData, setNutritionData] = useState({});
  const [portions, setPortions] = useState({});
  
  // Track total nutrition values
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  
  // Simple cache for API responses
  const [recipeCache, setRecipeCache] = useState({});
  const [nutritionCache, setNutritionCache] = useState({});

  // Search for recipes
  const searchRecipes = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setUsingMockData(false);
    
    // First check if we have this query cached
    if (recipeCache[query.toLowerCase()]) {
      setRecipes(recipeCache[query.toLowerCase()]);
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`https://api.calorieninjas.com/v1/recipe?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'X-Api-Key': import.meta.env.VITE_CALORIE_NINJAS_API_KEY,
          'Content-Type': 'application/json'
        },
        // Add timeout
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the response
      setRecipeCache(prev => ({
        ...prev,
        [query.toLowerCase()]: data
      }));
      
      setRecipes(data);
    } catch (err) {
      console.error('Error:', err);
      
      // Use mock data as fallback
      if (MOCK_RECIPES[query.toLowerCase()]) {
        setRecipes(MOCK_RECIPES[query.toLowerCase()]);
        setUsingMockData(true);
        setError("API request failed. Using sample data instead.");
      } else {
        setError(`Failed to fetch recipes: ${err.message}. Try searching for "potato", "chicken", or "pasta" to see sample data.`);
        setRecipes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get nutrition data for a recipe
  const fetchNutritionData = async (recipe) => {
    if (nutritionData[recipe.title]) return;
    
    // If we're using mock data, use mock nutrition info
    if (usingMockData && MOCK_NUTRITION[recipe.title]) {
      setNutritionData(prev => ({
        ...prev,
        [recipe.title]: MOCK_NUTRITION[recipe.title]
      }));
      
      setPortions(prev => ({
        ...prev,
        [recipe.title]: 1
      }));
      
      return;
    }
    
    // Check cache first
    const cacheKey = recipe.ingredients.replace(/\s+/g, '').toLowerCase();
    if (nutritionCache[cacheKey]) {
      setNutritionData(prev => ({
        ...prev,
        [recipe.title]: nutritionCache[cacheKey]
      }));
      
      setPortions(prev => ({
        ...prev,
        [recipe.title]: 1
      }));
      
      return;
    }
    
    try {
      const response = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(recipe.ingredients)}`, {
        method: 'GET',
        headers: {
          'X-Api-Key': import.meta.env.VITE_CALORIE_NINJAS_API_KEY || 'your-api-key-here',
          'Content-Type': 'application/json'
        },
        // Add timeout
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`Nutrition API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Calculate total carbs and protein for the recipe
      const totalNutrition = data.items.reduce((acc, item) => {
        return {
          carbs: acc.carbs + (item.carbohydrates_total_g || 0),
          protein: acc.protein + (item.protein_g || 0)
        };
      }, { carbs: 0, protein: 0 });
      
      // Cache this nutrition data
      setNutritionCache(prev => ({
        ...prev,
        [cacheKey]: totalNutrition
      }));
      
      // Store the nutrition data with the recipe title as key
      setNutritionData(prev => ({
        ...prev,
        [recipe.title]: totalNutrition
      }));
      
      // Initialize portion for this recipe
      setPortions(prev => ({
        ...prev,
        [recipe.title]: 1
      }));
    } catch (err) {
      console.error('Error fetching nutrition data:', err);
      
      // If API fails, use estimated values based on recipe name
      const estimatedData = estimateNutrition(recipe.title, recipe.ingredients);
      
      setNutritionData(prev => ({
        ...prev,
        [recipe.title]: estimatedData
      }));
      
      setPortions(prev => ({
        ...prev,
        [recipe.title]: 1
      }));
      
      // Show a note about estimated data
      setError(prev => prev ? 
        `${prev}. Using estimated nutrition values for ${recipe.title}.` : 
        `Using estimated nutrition values for ${recipe.title}.`);
    }
  };
  
  // Simple function to estimate nutrition when API fails
  const estimateNutrition = (title, ingredients) => {
    // Try to match with mock data first
    if (MOCK_NUTRITION[title]) {
      return MOCK_NUTRITION[title];
    }
    
    // Very basic estimation based on ingredients
    const lowerTitle = title.toLowerCase();
    const lowerIngredients = ingredients.toLowerCase();
    
    let protein = 5; // base protein
    let carbs = 20;  // base carbs
    
    // Adjust based on keywords in title and ingredients
    if (lowerTitle.includes('chicken') || lowerIngredients.includes('chicken')) {
      protein += 25;
    }
    if (lowerTitle.includes('beef') || lowerIngredients.includes('beef')) {
      protein += 30;
    }
    if (lowerTitle.includes('fish') || lowerIngredients.includes('fish')) {
      protein += 22;
    }
    if (lowerTitle.includes('tofu') || lowerIngredients.includes('tofu')) {
      protein += 15;
    }
    if (lowerTitle.includes('beans') || lowerIngredients.includes('beans')) {
      protein += 10;
      carbs += 15;
    }
    if (lowerTitle.includes('rice') || lowerIngredients.includes('rice')) {
      carbs += 45;
    }
    if (lowerTitle.includes('pasta') || lowerIngredients.includes('pasta')) {
      carbs += 40;
    }
    if (lowerTitle.includes('potato') || lowerIngredients.includes('potato')) {
      carbs += 30;
    }
    if (lowerTitle.includes('bread') || lowerIngredients.includes('bread')) {
      carbs += 15;
    }
    
    return { protein, carbs };
  };

  // Add recipe to selected recipes
  const addRecipe = (recipe) => {
    if (!selectedRecipes.some(r => r.title === recipe.title)) {
      setSelectedRecipes(prev => [...prev, recipe]);
      fetchNutritionData(recipe);
    }
  };

  // Remove recipe from selected recipes
  const removeRecipe = (recipeTitle) => {
    setSelectedRecipes(prev => prev.filter(r => r.title !== recipeTitle));
  };

  // Update portion size
  const updatePortion = (recipeTitle, value) => {
    const newValue = Math.max(0.25, parseFloat(value) || 0.25);
    setPortions(prev => ({
      ...prev,
      [recipeTitle]: newValue
    }));
  };

  // Calculate totals when selected recipes or portions change
  useEffect(() => {
    let proteinTotal = 0;
    let carbsTotal = 0;
    
    selectedRecipes.forEach(recipe => {
      const nutrition = nutritionData[recipe.title];
      const portion = portions[recipe.title] || 1;
      
      if (nutrition) {
        proteinTotal += nutrition.protein * portion;
        carbsTotal += nutrition.carbs * portion;
      }
    });
    
    setTotalProtein(proteinTotal);
    setTotalCarbs(carbsTotal);
  }, [selectedRecipes, nutritionData, portions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    searchRecipes();
  };

  const formatIngredients = (ingredientsString) => {
    return ingredientsString.split('|').map((ingredient, index) => (
      <li key={index} className="ingredient-item">{ingredient.trim()}</li>
    ));
  };

  // Calculate percentage of goals met
  const proteinPercentage = proteinGoal > 0 ? (totalProtein / proteinGoal) * 100 : 0;
  const carbsPercentage = carbGoal > 0 ? (totalCarbs / carbGoal) * 100 : 0;

  return (
    <div className="nutrition-goal-tracker">
      <div className="goal-setter">
        <h2>Set Your Nutrition Goals</h2>
        <div className="goal-inputs">
          <div className="goal-input-group">
            <label>Protein Goal (g):</label>
            <input 
              type="number" 
              value={proteinGoal} 
              onChange={(e) => setProteinGoal(Math.max(0, parseInt(e.target.value) || 0))} 
              min="0"
            />
          </div>
          <div className="goal-input-group">
            <label>Carbohydrates Goal (g):</label>
            <input 
              type="number" 
              value={carbGoal} 
              onChange={(e) => setCarbGoal(Math.max(0, parseInt(e.target.value) || 0))} 
              min="0"
            />
          </div>
        </div>
      </div>
      
      <div className="goals-progress">
        <h3>Progress Towards Goals</h3>
        <div className="progress-container">
          <div className="progress-item">
            <div className="progress-label">Protein: {totalProtein.toFixed(1)}g / {proteinGoal}g</div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${Math.min(proteinPercentage, 100)}%`,
                  backgroundColor: proteinPercentage >= 100 ? '#4CAF50' : '#2196F3'
                }}
              ></div>
            </div>
          </div>
          <div className="progress-item">
            <div className="progress-label">Carbs: {totalCarbs.toFixed(1)}g / {carbGoal}g</div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${Math.min(carbsPercentage, 100)}%`,
                  backgroundColor: carbsPercentage >= 100 ? '#4CAF50' : '#2196F3'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="selected-recipes">
        <h3>Selected Recipes</h3>
        {selectedRecipes.length === 0 ? (
          <p>No recipes selected yet. Search and add recipes below.</p>
        ) : (
          <div className="selected-recipes-list">
            {selectedRecipes.map((recipe, index) => (
              <div key={index} className="selected-recipe-item">
                <div className="recipe-info">
                  <h4>{recipe.title}</h4>
                  {nutritionData[recipe.title] && (
                    <div className="nutrition-info">
                      <p>Per portion: {nutritionData[recipe.title].protein.toFixed(1)}g protein, {nutritionData[recipe.title].carbs.toFixed(1)}g carbs</p>
                      <p>Your portion: <b>{(nutritionData[recipe.title].protein * (portions[recipe.title] || 1)).toFixed(1)}g protein, {(nutritionData[recipe.title].carbs * (portions[recipe.title] || 1)).toFixed(1)}g carbs</b></p>
                    </div>
                  )}
                </div>
                <div className="portion-control">
                  <label>Portions:</label>
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={portions[recipe.title] || 1}
                    onChange={(e) => updatePortion(recipe.title, e.target.value)}
                  />
                </div>
                <button onClick={() => removeRecipe(recipe.title)} className="remove-button">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="recipe-search">
        <div className="recipe-header-wrapper">
          <h2>Find Recipes to Add</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="search-form">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a dish name (e.g., potato, chicken, pasta)"
            className="search-input"
          />
          <button type="submit" className="search-button" disabled={loading || !query.trim()}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {usingMockData && (
          <div className="mock-data-notice">
            Using sample data. For demonstration purposes only.
          </div>
        )}

        {recipes.length > 0 ? (
          <div className="recipes-container">
            <h3>Search Results</h3>
            {recipes.map((recipe, index) => (
              <div key={index} className="recipe-card">
                <div className="recipe-header">
                  <h4>{recipe.title}</h4>
                  <button onClick={() => addRecipe(recipe)} className="add-button">
                    Add to Selection
                  </button>
                </div>
                
                <div className="recipe-section">
                  <div className="section-title">
                    Servings
                  </div>
                  <div>{recipe.servings}</div>
                </div>
                
                <div className="recipe-section">
                  <div className="section-title">
                    Ingredients
                  </div>
                  <ul className="ingredients-list">
                    {formatIngredients(recipe.ingredients)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="no-results">
              {query && !error ? "No recipes found." : "Try searching for a dish like 'potato', 'chicken', or 'pasta'."}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Demo;