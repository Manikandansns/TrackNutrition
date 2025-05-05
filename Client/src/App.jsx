import React from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import HomePage from './pages/user/homePage/HomePage';
import NutritionSearch from './pages/user/NutritionPage/NutritionSearch';
import Navbar from './components/navbar/Navbar';
import './App.css';
import NutritionGoalTracker from './pages/user/NutritionGoalTracker/NutritionGoalTracker';
import Dataset from './pages/user/Dataset/Dataset';
import BodyFatCalculator from './pages/user/FatCalculator/BodyFatCalculator';
import Main from './pages/user/Main/Main';
import IndianDiet from './pages/user/indianDiet/IndianDiet';

const App = () => {

  return (
       <BrowserRouter>
          <Navbar/>
            <Routes>                
                <Route path="/" element={<HomePage/> } />      
                <Route path="/nutrition" element={<NutritionSearch/> } />
                <Route path="/indiandiet" element={<IndianDiet/> } /> 
                <Route path="/fat" element={<BodyFatCalculator/> } /> 
                <Route path="/dataset" element={<Dataset/> } /> 
                <Route path="/dietplan" element={<Main/> } />
                <Route path="/goaltrack" element={<NutritionGoalTracker/> } />   
            </Routes>
        </BrowserRouter>
  )
}

export default App