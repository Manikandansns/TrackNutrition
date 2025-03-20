import React, { useState } from 'react';
import './RecipeSearch.css';

const RecipeSearch = () => {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchRecipes = async () => {
    if (!query.trim()) return;
   
    setLoading(true);
    setError(null);
   
    try {
      const response = await fetch(`https://api.calorieninjas.com/v1/recipe?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'X-Api-Key': import.meta.env.VITE_CALORIE_NINJAS_API_KEY ,
          'Content-Type': 'application/json'
        }
      });
     
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
     
      const data = await response.json();
      setRecipes(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch recipes');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    searchRecipes();
  };

  const formatIngredients = (ingredientsString) => {
    return ingredientsString.split('|').map((ingredient, index) => (
      <li key={index} className="ingredient-item">{ingredient.trim()}</li>
    ));
  };

  return (
    <div className="recipe-search">
      <div className="recipe-header-wrapper">
        <h2>Recipe Search</h2>
      </div>
     
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a dish name (e.g., mushroom risotto)"
          className="search-input"
        />
        <button type="submit" className="search-button" disabled={loading || !query.trim()}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {recipes.length > 0 ? (
        <div className="recipes-container">
          <h3>Found Recipes</h3>
          {recipes.map((recipe, index) => (
            <div key={index} className="recipe-card">
              <h4>{recipe.title}</h4>
             
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
             
              <div className="recipe-section">
                <div className="section-title">
                  Instructions
                </div>
                <div className="instructions-text">
                  {recipe.instructions}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && <div className="no-results">
          No recipes found. Try searching for a dish!
        </div>
      )}
    </div>
  );
};

export default RecipeSearch;