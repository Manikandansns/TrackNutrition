import React from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import HomePage from './pages/user/homePage/HomePage';
import NutritionSearch from './pages/user/NutritionPage/NutritionSearch';
import RecipeSearch from './pages/user/RecipePage/RecipeSearch';
import Navbar from './components/navbar/Navbar';
import './App.css'
import FoodRecommendationApp from './pages/user/FoodRecommendation/FoodRecommendationApp';
import NutritionGoalTracker from './pages/user/NutritionGoalTracker/NutritionGoalTracker';
import Demo from './pages/user/RecipePage/Demo';
import FitnessMealPlanner from './pages/user/FitnessMealPlanner/FitnessMealPlanner';
import GeminiPlanner from './pages/user/GeminiPlanner/GeminiPlanner';

const App = () => {

  return (
       <BrowserRouter>
          <Navbar/>
            <Routes>                
                <Route path="/" element={<HomePage/> } />      
                <Route path="/nutrition" element={<NutritionSearch/> } />
                <Route path="/recipe" element={<RecipeSearch/> } />  
                <Route path="/plan" element={<FoodRecommendationApp/> } />  
                <Route path="/demo" element={<Demo/> } /> 
                <Route path="/fitness" element={<FitnessMealPlanner/> } /> 
                <Route path="/gemini" element={<GeminiPlanner/> } /> 
                <Route path="/goaltrack" element={<NutritionGoalTracker/> } />   
            </Routes>
        </BrowserRouter>
  )
}

export default App