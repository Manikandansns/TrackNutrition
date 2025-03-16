import { useState, useEffect } from 'react';
import './NutritionSearch.css';

const NutritionSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Default data for carrots and sandwich
  const defaultData = {
    items: [
      {
        name: "carrots",
        serving_size_g: 1360, // 3lb in grams
        calories: 544,
        protein_g: 12.2,
        fat_total_g: 3.2,
        carbohydrates_total_g: 128.6,
        sugar_g: 61.2,
        fiber_g: 38.1,
      },
      {
        name: "sandwich",
        serving_size_g: 200,
        calories: 480,
        protein_g: 18.4,
        fat_total_g: 20.5,
        carbohydrates_total_g: 56.3,
        sugar_g: 6.8,
        fiber_g: 3.2,
      }
    ]
  };

  // Load default data on component mount
  useEffect(() => {
    setResults(defaultData);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'X-Api-Key': import.meta.env.CALORIE_NINJAS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nutrition-search">
      <h2>Nutrition Information</h2>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter food items (e.g. 3lb carrots and a chicken sandwich)"
          className="search-input"
        />
        <button type="submit" className="search-button" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="error-message">Error: {error}</div>}

      {results && (
        <div className="results-container">
          <h3>Results{query ? ` for "${query}"` : " (3lb carrots and a sandwich)"}</h3>
          {results.items && results.items.length > 0 ? (
            <div className="nutrition-results">
              {results.items.map((item, index) => (
                <div key={index} className="nutrition-item">
                  <div className="nutrition-header-wrapper">
                    <h4>{item.name}</h4>
                    <div className="nutrition-value">
                      <span>Serving Size:</span> {item.serving_size_g}g
                    </div>
                  </div>
                  
                  <div className="nutrition-grid">
                    <div className="nutrition-value">
                      <span>Calories:</span> {item.calories}
                    </div>
                    <div className="nutrition-value">
                      <span>Fat:</span> {item.fat_total_g}g
                    </div>
                    <div className="nutrition-value">
                      <span>Fiber:</span> {item.fiber_g}g
                    </div>
                    <div className="nutrition-value">
                      <span>Protein:</span> {item.protein_g}g
                    </div>
                    <div className="nutrition-value">
                      <span>Carbs:</span> {item.carbohydrates_total_g}g
                    </div>
                    <div className="nutrition-value">
                      <span>Sugar:</span> {item.sugar_g}g
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No nutrition information found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default NutritionSearch;