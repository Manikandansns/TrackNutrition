import React from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import HomePage from './pages/user/homePage/HomePage';
import NutritionSearch from './pages/user/NutritionPage/NutritionSearch';
import RecipeSearch from './pages/user/RecipePage/RecipeSearch';
import Navbar from './components/navbar/Navbar';
import './App.css'

const App = () => {

  

  return (
       <BrowserRouter>
          <Navbar/>
            <Routes>                
                <Route path="/" element={<HomePage/> } />      
                <Route path="/nutrition" element={<NutritionSearch/> } />
                <Route path="/recipe" element={<RecipeSearch/> } />     
            </Routes>
        </BrowserRouter>
  )
}

export default App