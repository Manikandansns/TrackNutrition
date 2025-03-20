import React, { useState, useEffect } from 'react';
import './FoodRecommendation.css'; // Make sure to create this CSS file

const FoodRecommendation = () => {
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  // API Key
  const API_KEY = import.meta.env.VITE_USDA_API_KEY; 
  const API_URL = 'https://api.nal.usda.gov/fdc/v1';

  const searchFoods = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/foods/search?api_key=${API_KEY}&query=${searchTerm}&dataType=Foundation,SR%20Legacy&pageSize=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch food data');
      }
      
      const data = await response.json();
      setSearchResults(data.foods || []);
    } catch (err) {
      setError('Error searching for foods. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addFood = (food) => {
    // Find calorie and protein nutrients
    const calories = food.foodNutrients.find(n => 
      n.nutrientName === 'Energy' && n.unitName === 'KCAL'
    ) || { value: 0 };
    
    const protein = food.foodNutrients.find(n => 
      n.nutrientName === 'Protein'
    ) || { value: 0 };

    const newFood = {
      id: food.fdcId,
      name: food.description,
      calories: calories.value || 0,
      protein: protein.value || 0,
      servingSize: food.servingSize || 100,
      servingUnit: food.servingSizeUnit || 'g',
      quantity: 1
    };
    
    setSelectedFoods([...selectedFoods, newFood]);
    setSearchResults([]);
    setSearchTerm('');
  };

  const removeFood = (id) => {
    setSelectedFoods(selectedFoods.filter(food => food.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    setSelectedFoods(selectedFoods.map(food => 
      food.id === id ? { ...food, quantity: Math.max(quantity, 0) } : food
    ));
  };

  const calculateTotals = () => {
    return selectedFoods.reduce((totals, food) => {
      return {
        calories: totals.calories + (food.calories * food.quantity),
        protein: totals.protein + (food.protein * food.quantity)
      };
    }, { calories: 0, protein: 0 });
  };

  const generateRecommendations = () => {
    const totals = calculateTotals();
    const remainingCalories = calorieGoal - totals.calories;
    
    let recommendationText = '';
    let recommendedFoods = [];
    
    if (remainingCalories > 500) {
      recommendationText = `You have ${Math.round(remainingCalories)} calories left. Consider adding:`;
      recommendedFoods = [
        { name: 'Chicken breast (100g)', calories: 165, protein: 31 },
        { name: 'Salmon (100g)', calories: 208, protein: 20 },
        { name: 'Brown rice (100g cooked)', calories: 112, protein: 2.6 },
        { name: 'Sweet potato (100g)', calories: 86, protein: 1.6 },
        { name: 'Greek yogurt (170g)', calories: 100, protein: 17 }
      ];
    } else if (remainingCalories > 200) {
      recommendationText = `You have ${Math.round(remainingCalories)} calories left. Consider adding:`;
      recommendedFoods = [
        { name: 'Apple (medium)', calories: 95, protein: 0.5 },
        { name: 'Hard-boiled egg', calories: 78, protein: 6.3 },
        { name: 'Almonds (1oz)', calories: 164, protein: 6 },
        { name: 'Cottage cheese (1/2 cup)', calories: 110, protein: 12 }
      ];
    } else if (remainingCalories > 0) {
      recommendationText = `You have ${Math.round(remainingCalories)} calories left. Consider adding:`;
      recommendedFoods = [
        { name: 'Carrot (medium)', calories: 25, protein: 0.6 },
        { name: 'Celery stick', calories: 6, protein: 0.3 },
        { name: 'Cup of green tea', calories: 0, protein: 0 }
      ];
    } else {
      recommendationText = `You've exceeded your calorie goal by ${Math.abs(Math.round(remainingCalories))} calories.`;
      recommendedFoods = [];
    }
    
    setRecommendations({ text: recommendationText, foods: recommendedFoods });
  };

  useEffect(() => {
    if (selectedFoods.length > 0) {
      generateRecommendations();
    }
  }, [selectedFoods, calorieGoal]);

  const totals = calculateTotals();

  return (
    <div className="food-app-container">
      <h1 className="food-app-header">Food Recommendation App</h1>
      
      <div className="form-group">
        <label className="form-label">
          Daily Calorie Goal:
          <input
            type="number"
            value={calorieGoal}
            onChange={(e) => setCalorieGoal(Number(e.target.value))}
            className="form-input calorie-input"
          />
        </label>
      </div>
      
      <div className="form-group">
        <div className="input-group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for foods..."
            className="form-input search-input"
          />
          <button 
            onClick={searchFoods}
            className="btn btn-primary"
          >
            Search
          </button>
        </div>
        
        {loading && <p className="loading-message">Loading...</p>}
        {error && <p className="error-message">{error}</p>}
        
        {searchResults.length > 0 && (
          <div className="search-results">
            <h3 className="search-results-header">Search Results:</h3>
            <ul className="search-results-list">
              {searchResults.map(food => (
                <li key={food.fdcId} className="search-results-item">
                  {food.description}
                  <button 
                    onClick={() => addFood(food)}
                    className="btn btn-success"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="selected-foods">
        <h2 className="selected-foods-header">Selected Foods:</h2>
        {selectedFoods.length === 0 ? (
          <p className="no-foods-message">No foods selected yet.</p>
        ) : (
          <ul className="selected-foods-list">
            {selectedFoods.map(food => (
              <li key={food.id} className="selected-food-item">
                <div className="food-info">
                  <span className="food-name">{food.name}</span>
                  <div className="food-details">
                    {food.calories} kcal, {food.protein}g protein per {food.servingSize}{food.servingUnit}
                  </div>
                </div>
                <div className="food-controls">
                  <label className="quantity-label">
                    Qty:
                    <input
                      type="number"
                      value={food.quantity}
                      onChange={(e) => updateQuantity(food.id, Number(e.target.value))}
                      className="quantity-input"
                    />
                  </label>
                  <button 
                    onClick={() => removeFood(food.id)}
                    className="btn btn-danger"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="nutrition-summary">
        <h2 className="nutrition-summary-header">Nutrition Summary:</h2>
        <div className="nutrition-values">
          <div className="nutrition-value calories-value">
            <span className="nutrition-value-label">Total Calories:</span> {Math.round(totals.calories)} kcal
            <div className="nutrition-percentage">
              {calorieGoal > 0 ? `${Math.round((totals.calories / calorieGoal) * 100)}% of daily goal` : ''}
            </div>
          </div>
          <div className="nutrition-value protein-value">
            <span className="nutrition-value-label">Total Protein:</span> {Math.round(totals.protein)}g
          </div>
        </div>
      </div>
      
      {recommendations.text && (
        <div className="recommendations glass-panel">
          <h2 className="recommendations-header">Recommendations:</h2>
          <p className="recommendation-text">{recommendations.text}</p>
          {recommendations.foods.length > 0 && (
            <ul className="recommendation-foods">
              {recommendations.foods.map((food, index) => (
                <li key={index} className="recommendation-food-item">
                  {food.name} (<span className="accent-text">{food.calories} kcal</span>, {food.protein}g protein)
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default FoodRecommendation;