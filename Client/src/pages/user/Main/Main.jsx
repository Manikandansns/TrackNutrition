// --- START OF COMBINED FILE Main.jsx ---

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Removed PapaParse import, added XLSX import
import * as XLSX from 'xlsx'; // <--- Added for reading Excel files
import './Main.css'; // Assuming your CSS file is named Main.css

// Import Material UI Components (Consolidated)
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';

// Import Material UI Icons (Consolidated)
import AssessmentIcon from '@mui/icons-material/Assessment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CloseIcon from '@mui/icons-material/Close';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ScaleIcon from '@mui/icons-material/Scale';
import HeightIcon from '@mui/icons-material/Height';
import CakeIcon from '@mui/icons-material/Cake';
import WcIcon from '@mui/icons-material/Wc';
import StraightenIcon from '@mui/icons-material/Straighten';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import FlagIcon from '@mui/icons-material/Flag';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import NoMealsIcon from '@mui/icons-material/NoMeals';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalculateIcon from '@mui/icons-material/Calculate';
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import ImageIcon from '@mui/icons-material/Image'; // Ensure ImageIcon is imported

// Gemini API Key & URL - Loaded from environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = import.meta.env.VITE_GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'; // Default URL

// Check if API key is set (essential)
if (!GEMINI_API_KEY) {
    console.warn("Warning: VITE_GEMINI_API_KEY is not defined in your environment variables (.env file). AI enhancement features will be disabled.");
}

// =============================================
// START: Gemini API Service (No changes needed here)
// =============================================
const GeminiService = {
    generateDishDetails: async (dishName, existingIngredients = null, existingProcedure = null, existingImageUrl = null, existingCost = 0) => {
        if (!GEMINI_API_KEY) {
            console.warn("Gemini API Key is not configured. Skipping enhancement.");
            return { ingredients: existingIngredients || '', procedure: existingProcedure || '', imageUrl: existingImageUrl, estimatedCost: existingCost || 0 };
        }
        try {
            const needsIngredients = !existingIngredients || existingIngredients.trim() === '';
            const needsProcedure = !existingProcedure || existingProcedure.trim() === '';
            const needsImageUrl = !existingImageUrl;
            const needsCost = !existingCost || existingCost <= 0;

            if (!needsIngredients && !needsProcedure && !needsImageUrl && !needsCost) {
                 console.log(`Skipping AI enhancement for "${dishName}", all details already present.`);
                 return { ingredients: existingIngredients, procedure: existingProcedure, imageUrl: existingImageUrl, estimatedCost: existingCost };
            }

            let prompt = `Provide details for the Indian dish "${dishName}". Only include the fields requested below.\n`;
            if (needsIngredients) prompt += "- List the main ingredients, separated by semicolons (;).\n";
            if (needsProcedure) prompt += "- Provide a simple, step-by-step cooking procedure (use newlines for steps).\n";
            if (needsImageUrl) prompt += "- Provide a direct HTTPS URL to a relevant, royalty-free image for this dish. The URL must end with a common image extension (like .jpg, .png, .webp, .jpeg). If unavailable or no suitable URL found, state 'NO_IMAGE_AVAILABLE'.\n";
            if (needsCost) prompt += "- Estimate the approximate cost (numeric value only) to prepare one serving in Indian Rupees (INR).\n";
            prompt += "\nFormat the entire response strictly as a JSON object containing ONLY the keys for the information requested above (e.g., 'ingredients', 'procedure', 'imageUrl', 'estimatedCost'). If a field was not requested, do not include its key in the JSON. If requested but unavailable, use null for the value (except for imageUrl which uses 'NO_IMAGE_AVAILABLE'). Ensure the JSON is valid.";

            console.log("Sending prompt to Gemini for:", dishName, " Needs:", {needsIngredients, needsProcedure, needsImageUrl, needsCost});

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.4, maxOutputTokens: 800 }
                }),
            });

            if (!response.ok) {
                let errorBody = 'Could not read error response body.';
                try { errorBody = await response.text(); const errorData = JSON.parse(errorBody); console.error("Gemini API Error Response (JSON):", errorData); throw new Error(`Gemini API error (${response.status}): ${errorData.error?.message || errorBody}`); }
                catch (parseError) { console.error("Gemini API Error Response (non-JSON):", errorBody); throw new Error(`Gemini API error (${response.status}): ${errorBody}`); }
            }
            const data = await response.json();
            if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
                 if (data.candidates?.[0]?.finishReason && data.candidates[0].finishReason !== 'STOP') { throw new Error(`Gemini generation stopped: ${data.candidates[0].finishReason}`); }
                 throw new Error('Invalid response structure from Gemini API. No text part found.');
            }
            const textResponse = data.candidates[0].content.parts[0].text; console.log("Raw text response from Gemini:", textResponse);
            let jsonResponse = {};
            const jsonBlockMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonDirectMatch = textResponse.match(/\{[\s\S]*\}/);
            if (jsonBlockMatch && jsonBlockMatch[1]) { try { jsonResponse = JSON.parse(jsonBlockMatch[1]); console.log("Parsed JSON from ```json block:", jsonResponse); } catch (e) { console.error("Failed to parse JSON from ```json block:", e, "Content:", jsonBlockMatch[1]); if (jsonDirectMatch && jsonDirectMatch[0]) { try { jsonResponse = JSON.parse(jsonDirectMatch[0]); console.log("Parsed JSON from direct match (fallback):", jsonResponse); } catch (e2) { console.error("Failed to parse JSON from direct match (fallback):", e2, "Content:", jsonDirectMatch[0]); } } } }
            else if (jsonDirectMatch && jsonDirectMatch[0]) { try { jsonResponse = JSON.parse(jsonDirectMatch[0]); console.log("Parsed JSON from direct match:", jsonResponse); } catch (e) { console.error("Failed to parse JSON from direct match:", e, "Content:", jsonDirectMatch[0]); } }
            else { console.warn("Could not find JSON object in the Gemini response."); }
            const finalIngredients = needsIngredients && jsonResponse.ingredients ? jsonResponse.ingredients : existingIngredients;
            const finalProcedure = needsProcedure && jsonResponse.procedure ? jsonResponse.procedure : existingProcedure;
            let finalImageUrl = existingImageUrl;
            if (needsImageUrl && jsonResponse.imageUrl) { if (jsonResponse.imageUrl !== 'NO_IMAGE_AVAILABLE' && typeof jsonResponse.imageUrl === 'string' && jsonResponse.imageUrl.startsWith('https://')) { finalImageUrl = jsonResponse.imageUrl; } else if (jsonResponse.imageUrl === 'NO_IMAGE_AVAILABLE') { console.log(`Gemini indicated no image available for ${dishName}. Keeping existing or null.`); } else { console.warn(`Received invalid image URL format from Gemini: ${jsonResponse.imageUrl}`); } }
            let finalCost = existingCost;
            if (needsCost && typeof jsonResponse.estimatedCost === 'number' && jsonResponse.estimatedCost >= 0) { finalCost = jsonResponse.estimatedCost; }
            else if (needsCost && jsonResponse.hasOwnProperty('estimatedCost')) { console.warn(`Received invalid cost value from Gemini: ${jsonResponse.estimatedCost}`); }
            return { ingredients: finalIngredients || '', procedure: finalProcedure || '', imageUrl: finalImageUrl, estimatedCost: finalCost || 0 };
        } catch (error) {
            console.error(`Error during GeminiService enhancement for "${dishName}":`, error);
            return { ingredients: existingIngredients || '', procedure: existingProcedure || '', imageUrl: existingImageUrl, estimatedCost: existingCost || 0 };
        }
    }
};
// =============================================
// END: Gemini API Service
// =============================================


// =============================================
// START: Definition of CalculationResults Component (No changes needed here)
// =============================================
const CalculationResults = ({ bmi, bodyFat, goals, timeline }) => { /* ... content identical to previous version ... */
    if (!bmi && !bodyFat && !goals?.cal) { return null; }
    return (
        <>
            <h2 className="section-title"><AssessmentIcon className="mui-icon" /> Calculation Results</h2>
            <div className="results-grid">
                {bmi && <div className="result-card"><h4>BMI</h4><p>{bmi}</p></div>}
                {bodyFat && <div className="result-card"><h4>Body Fat %</h4><p>{bodyFat}<span className="unit">%</span></p></div>}
                {goals?.cal && <div className="result-card"><h4>Calories</h4><p>{goals.cal}<span className="unit"> kcal/day</span></p></div>}
                {goals?.p && <div className="result-card"><h4>Protein</h4><p>{goals.p}<span className="unit"> g/day</span></p></div>}
                {goals?.c && <div className="result-card"><h4>Carbs</h4><p>{goals.c}<span className="unit"> g/day</span></p></div>}
                {goals?.f && <div className="result-card"><h4>Fat</h4><p>{goals.f}<span className="unit"> g/day</span></p></div>}
            </div>
            {timeline && (
                <div className={`timeline-result ${!timeline.possible ? 'impossible' : ''}`}>
                    <h4><ScheduleIcon className="mui-icon" /> Estimated Timeline</h4>
                    {timeline.possible ? ( <p>Approx. <strong>{timeline.weeks} weeks</strong> to reach a 5% weight change goal ({timeline.goal}).</p> ) :
                     ( <p>Current goal ({timeline.goal}) might not align with calculated calorie needs for safe weight change, or a target weight is needed.</p> )}
                </div>
            )}
        </>
    );
};
// =============================================
// END: Definition of CalculationResults Component
// =============================================


// =============================================
// START: Definition of DailySummary Component (No changes needed here)
// =============================================
const DailySummary = ({ totals, budget }) => { /* ... content identical to previous version ... */
    if (!totals) return null;
    return (
        <div className="daily-summary">
            <h3><AssessmentIcon className="mui-icon" /> Daily Totals Summary</h3>
            <div className="summary-grid">
                <div className="summary-item"><strong>{totals.calories}</strong><span>Calories</span></div>
                <div className="summary-item"><strong>{totals.protein}g</strong><span>Protein</span></div>
                <div className="summary-item"><strong>{totals.carbs}g</strong><span>Carbs</span></div>
                <div className="summary-item"><strong>{totals.fat}g</strong><span>Fat</span></div>
                <div className="summary-item"><strong>₹{totals.cost}</strong><span>Est. Cost</span></div>
                {budget > 0 && ( <div className="summary-item"> <strong>{Math.round((totals.cost / budget) * 100)}%</strong> <span>of ₹{budget} Budget</span> </div> )}
            </div>
        </div>
    );
 };
// =============================================
// END: Definition of DailySummary Component
// =============================================


// =============================================
// START: Definition of DishDetailModal Component (No changes needed here)
// =============================================
const dishModalStyle = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 600, maxHeight: '85vh', bgcolor: 'background.paper', border: '1px solid #ccc', boxShadow: 24, p: { xs: 2, sm: 3, md: 4 }, overflowY: 'auto', borderRadius: '8px', };
const DishDetailModal = ({ dish, open, onClose, onEnhanceDish, isLoading }) => { /* ... content identical to previous version ... */
    if (!dish) return null;
    const showLoadingSkeletons = isLoading;
    const ingredientsList = !showLoadingSkeletons && dish.ingredients && typeof dish.ingredients === 'string' ? dish.ingredients.split(';').map(item => item.trim()).filter(item => item) : [];
    const procedureSteps = !showLoadingSkeletons && dish.procedure && typeof dish.procedure === 'string' ? dish.procedure.split('\n').map((step, index) => step.trim() && <p key={index}>{step}</p>).filter(Boolean) : null;
    const handleManualEnhanceClick = async () => { if (onEnhanceDish && !isLoading) { await onEnhanceDish(dish); } };
    const canManuallyEnhance = GEMINI_API_KEY && (!dish.ingredients || !dish.procedure || !dish.imageUrl || !dish.cost);
    const [imageLoadError, setImageLoadError] = useState(false);
    useEffect(() => { setImageLoadError(false); }, [dish, open]);
    return (
        <Modal open={open} onClose={onClose} aria-labelledby="dish-detail-title" aria-describedby="dish-detail-description">
            <Box sx={dishModalStyle}>
                <IconButton aria-label="close" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}><CloseIcon /></IconButton>
                <Typography id="dish-detail-title" variant="h5" component="h2" gutterBottom>{dish.name}</Typography>
                <Box sx={{ textAlign: 'center', my: 2, minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {showLoadingSkeletons ? ( <Box sx={{ display: 'flex', height: 150, width: '80%', maxWidth: '300px', background: '#f0f0f0', borderRadius: '4px', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}> <CircularProgress size={40} /> </Box> )
                    : dish.imageUrl && !imageLoadError ? ( <img src={dish.imageUrl} alt={dish.name} style={{ maxWidth: '100%', maxHeight: '250px', height: 'auto', borderRadius: '4px', display: 'block', margin: '0 auto' }} onError={() => { console.warn(`Failed to load image: ${dish.imageUrl}`); setImageLoadError(true); }} onLoad={() => { if (imageLoadError) setImageLoadError(false); }} /> )
                    : ( <Box sx={{ display: 'flex', height: 150, width: '80%', maxWidth: '300px', background: '#f0f0f0', borderRadius: '4px', alignItems: 'center', justifyContent: 'center', color: '#aaa', }}> <ImageNotSupportedIcon sx={{ fontSize: 60 }} /> </Box> )}
                </Box>
                <Typography id="dish-detail-description" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>{dish.description || 'No description available.'}</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>Ingredients</Typography>
                {showLoadingSkeletons ? ( <Box sx={{ pl: 2 }}><Typography variant="body2"><CircularProgress size={16} sx={{ mr: 1}} /> Loading...</Typography></Box> )
                : ingredientsList.length > 0 ? ( <List dense sx={{ pl: 2 }}> {ingredientsList.map((item, index) => ( <ListItem key={index} disablePadding sx={{ pl: 0 }}><ListItemText primary={`• ${item}`} /></ListItem> ))} </List> )
                : (<Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>Ingredients not available.</Typography>)}
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>Procedure</Typography>
                {showLoadingSkeletons ? ( <Box sx={{ pl: 2 }}><Typography variant="body2"><CircularProgress size={16} sx={{ mr: 1}}/> Loading...</Typography></Box> )
                : procedureSteps ? ( <Box className="procedure-section" sx={{ pl: 2 }}> {procedureSteps} </Box> )
                : (<Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>Procedure not available.</Typography>)}
                {canManuallyEnhance && !showLoadingSkeletons && (
                     <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <button onClick={handleManualEnhanceClick} className="enhance-button" disabled={isLoading} title={GEMINI_API_KEY ? "Retry fetching missing details with AI" : "AI enhancement disabled (API Key missing)"} >
                            {isLoading ? ( <><CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />Enhancing...</> ) : ( <><ImageIcon sx={{ mr: 1, verticalAlign: 'bottom' }}/>Retry Enhance with AI</> )}
                        </button>
                         {!GEMINI_API_KEY && <Typography variant="caption" display="block" color="error" sx={{mt: 1}}>API Key missing</Typography>}
                    </Box>
                )}
            </Box>
        </Modal>
    );
};
// =============================================
// END: Definition of DishDetailModal Component
// =============================================


// =============================================
// START: Definition of MealInterval Component (No changes needed here)
// =============================================
const MealInterval = ({ mealName, foods, onShowDetails }) => { /* ... content identical to previous version ... */
    const title = mealName.charAt(0).toUpperCase() + mealName.slice(1);
    const icons = { breakfast: <CakeIcon className="mui-icon" />, lunch: <RestaurantMenuIcon className="mui-icon" />, dinner: <LocalDiningIcon className="mui-icon" />, snacks: <ScaleIcon className="mui-icon" />, };
    const icon = icons[mealName] || <LocalDiningIcon className="mui-icon" />;
    const mealTotals = foods.reduce((acc, food) => { acc.calories += food.calories || 0; acc.protein += food.protein || 0; acc.carbs += food.carbs || 0; acc.fat += food.fat || 0; acc.cost += food.cost || 0; return acc; }, { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 });
    return (
        <div className="meal-interval">
            <h4>{icon} {title}</h4>
            {foods && foods.length > 0 ? (
                <div className="meal-items">
                    <table className="meal-table">
                        <thead><tr><th>Dish</th><th>Calories</th><th>Protein</th><th>Carbs</th><th>Fat</th><th>Cost</th><th>Details</th></tr></thead>
                        <tbody>
                            {foods.map(food => ( <tr key={food.id} className="meal-item-row"> <td onClick={() => onShowDetails(food)} title={food.description || food.name} style={{ cursor: 'pointer' }}>{food.name}</td> <td align="right">{Math.round(food.calories || 0)}</td><td align="right">{Math.round(food.protein || 0)}g</td> <td align="right">{Math.round(food.carbs || 0)}g</td><td align="right">{Math.round(food.fat || 0)}g</td> <td align="right">₹{Math.round(food.cost || 0)}</td> <td><button onClick={() => onShowDetails(food)} className="details-button">View</button></td> </tr> ))}
                            <tr className="meal-totals"> <td>Meal Totals:</td><td align="right">{Math.round(mealTotals.calories)}</td><td align="right">{Math.round(mealTotals.protein)}g</td> <td align="right">{Math.round(mealTotals.carbs)}g</td><td align="right">{Math.round(mealTotals.fat)}g</td> <td align="right">₹{Math.round(mealTotals.cost)}</td><td /> </tr>
                        </tbody>
                    </table>
                </div>
            ) : (<p className="no-meal-message">No items selected for {mealName}.</p>)}
        </div>
    );
};
// =============================================
// END: Definition of MealInterval Component
// =============================================


// =============================================
// START: Definition of Main Component
// =============================================
const Main = () => {
    // --- State Variables ---
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('male');
    const [waist, setWaist] = useState('');
    const [neck, setNeck] = useState('');
    const [activityLevel, setActivityLevel] = useState('1.375');
    const [goal, setGoal] = useState('maintain');
    const [mealType, setMealType] = useState('Veg');
    const [budget, setBudget] = useState('');
    const [nutrientGoals, setNutrientGoals] = useState({ cal: null, p: null, c: null, f: null });
    const [bmi, setBmi] = useState(null);
    const [bodyFat, setBodyFat] = useState(null);
    const [timeline, setTimeline] = useState(null);
    const [foodData, setFoodData] = useState([]);
    const [mealPlan, setMealPlan] = useState(null);
    const [dailyTotals, setDailyTotals] = useState(null);
    const [parsingFile, setParsingFile] = useState(true); // Renamed from parsingCsv
    const [loading, setLoading] = useState(false); // Main calc/plan loading
    const [error, setError] = useState('');
    const [selectedDish, setSelectedDish] = useState(null);
    const [isEnhancingDish, setIsEnhancingDish] = useState(false); // Loading state specific to modal enhancement

    // --- Constants ---
    const activityMultipliers = useMemo(() => ({
        '1.2': 'Sedentary', '1.375': 'Lightly active', '1.55': 'Moderately active',
        '1.725': 'Very active', '1.9': 'Extra active',
    }), []);

    // --- Data Loading (Handles XLSX) ---
    useEffect(() => {
        const fetchAndParseXlsx = async () => {
            try {
                setParsingFile(true); setError('');
                // *** Fetch the XLSX file ***
                const response = await fetch('/nutrition.xlsx'); // Fetching XLSX
                if (!response.ok) throw new Error(`Fetch XLSX failed (${response.status}): ${response.statusText}. Make sure 'nutrition.xlsx' is in the 'public' folder.`);

                // *** Read the response as ArrayBuffer ***
                const arrayBuffer = await response.arrayBuffer();

                // *** Parse the ArrayBuffer using xlsx library ***
                const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });

                // *** Assume data is in the first sheet ***
                const firstSheetName = workbook.SheetNames[0];
                if (!firstSheetName) {
                    throw new Error("Excel file seems empty or has no sheets.");
                }
                const worksheet = workbook.Sheets[firstSheetName];

                // *** Convert sheet to JSON array of objects ***
                // `header: 1` generates arrays, `header: 'A'` uses column letters, default uses first row as header keys
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (!jsonData || jsonData.length === 0) {
                     setError("Excel sheet appears empty or could not be parsed correctly.");
                     setParsingFile(false);
                     setFoodData([]);
                     return;
                }

                // --- Data Cleaning (Similar to CSV, adapt as needed) ---
                const cleanedData = jsonData.map((row, index) => {
                     // Check essential fields first - ** Match exact headers from your Excel file **
                     // Example: If Excel has "Dish" instead of "Dish Name", use row['Dish']
                    const dishName = row['Dish Name']?.toString().trim(); // Ensure string conversion
                    if (!dishName) { console.warn(`Skipping row ${index + 2}: Missing 'Dish Name'.`); return null; }

                    // Check for 'Calories (kcal)' header exactly
                    const caloriesText = row['Calories (kcal)']?.toString().trim();
                    const calories = parseFloat(caloriesText);
                    if (isNaN(calories) || calories <= 0) { console.warn(`Skipping row ${index + 2} ('${dishName}'): Invalid or missing 'Calories (kcal)'. Found: "${caloriesText}"`); return null; }

                    // Parse other numeric fields, defaulting to 0 if invalid/missing
                    const parseNumeric = (value, fieldName) => {
                        // Check if value exists before trimming/parsing
                        const stringValue = value?.toString().trim();
                        const num = parseFloat(stringValue);
                        if (isNaN(num)) { return 0; } // Default to 0 if invalid/missing
                        return num >= 0 ? num : 0; // Ensure non-negative
                    };

                    const protein = parseNumeric(row['Protein (g)'], 'Protein');
                    const fat = parseNumeric(row['Fat (g)'], 'Fat');
                    const carbs = parseNumeric(row['Carbohydrates (g)'], 'Carbohydrates');
                    const costCsv = parseNumeric(row['Cost (INR)'], 'Cost');
                    const cost = costCsv > 0 ? costCsv : Math.max(1, Math.round(calories * 0.08));

                    // Handle Meal Type (allow comma-separated)
                    const mealTypesRaw = row['Meal Type']?.toString().trim();
                    const mealTypes = mealTypesRaw ? mealTypesRaw.split(',').map(t => t.trim().toLowerCase()).filter(t => t) : ['unknown'];
                    if (mealTypes.length === 0) mealTypes.push('unknown');

                    const tagsRaw = row['Tags']?.toString().trim();
                    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(t => t) : [];

                    const imageUrl = row['Image URL']?.toString().trim() || null;

                    return {
                        id: `${dishName.replace(/[^a-zA-Z0-9]/g, '-')}-${index}`,
                        name: dishName,
                        description: row['Description']?.toString().trim() || '',
                        cuisine: row['Cuisine']?.toString().trim() || 'Unknown',
                        mealType: mealTypes,
                        diet: row['Diet']?.toString().trim() || 'Unknown',
                        tags: tags,
                        allergens: row['Allergens']?.toString().trim() || 'None',
                        calories: calories,
                        protein: protein,
                        fat: fat,
                        carbs: carbs,
                        cost: cost,
                        imageUrl: imageUrl,
                        ingredients: row['Ingredients']?.toString().trim() || null,
                        procedure: row['Procedure']?.toString().trim() || null,
                        enhancementAttempted: false,
                    };
                }).filter(item => item !== null);
                // --- End Data Cleaning ---


                if (cleanedData.length === 0 && !error) {
                     setError("No valid food data found after processing the Excel file. Check the file content and headers.");
                } else if (cleanedData.length < jsonData.length) {
                     console.warn(`Loaded ${cleanedData.length} valid food items out of ${jsonData.length} rows. Check console for skipped rows.`);
                } else if (!error) {
                     console.log(`Successfully processed ${cleanedData.length} food items from Excel.`);
                }
                setFoodData(cleanedData);
                setParsingFile(false);

            } catch (err) {
                console.error("Error fetching or processing XLSX:", err);
                setError(`Failed to load data: ${err.message}. Please ensure 'nutrition.xlsx' exists in the 'public' directory and is accessible.`);
                setParsingFile(false);
                setFoodData([]);
            }
        };
        fetchAndParseXlsx(); // Call the XLSX processing function
    }, []); // Run once on mount

    // --- Calculation Functions ---
    const calculateBMI = useCallback((h, w) => { if (!h || !w || h <= 0 || w <= 0) return null; const hm = h / 100; return (w / (hm * hm)).toFixed(1); }, []);

    // *** CORRECTED calculateBodyFatNavy with cleaned comments ***
    const calculateBodyFatNavy = useCallback((h, n, wa, gen, cw, ca) => {
        if (!h || !n || !wa || h <= 0 || n <= 0 || wa <= 0) return null;
        let bf;
        const logH = Math.log10(h);
        if (gen === 'male') {
            const logWaistNeck = Math.log10(wa - n);
            // Ensure logs are valid numbers before calculation
            if (!isFinite(logWaistNeck) || logWaistNeck <= 0 || !isFinite(logH) || logH <= 0) return null;
            bf = 86.010 * logWaistNeck - 70.041 * logH + 36.76;
        } else {
            // Using simpler BMI-based method for females for now:
            const bmi = calculateBMI(h, cw);
            if (!bmi || !ca) return null; // Ensure bmi and age are available
            bf = (1.20 * parseFloat(bmi)) + (0.23 * ca) - 5.4;
        }
        // Ensure bf is a valid number before formatting and capping
        if (!isFinite(bf)) return null;
        return Math.max(0, Math.min(60, parseFloat(bf.toFixed(1)))); // Cap body fat %
    }, [calculateBMI]); // Dependency array is correct

    const calculateNutrientGoals = useCallback((w, h, ag, gen, actLvl, goalType) => { if (!w || !h || !ag || w <= 0 || h <= 0 || ag <= 0) return { cal: null, p: null, c: null, f: null, time: null }; let bmr; if (gen === 'male') { bmr = (10 * w + 6.25 * h - 5 * ag + 5); } else { bmr = (10 * w + 6.25 * h - 5 * ag - 161); } const tdee = bmr * parseFloat(actLvl); let dailyCal, adj = 0; const calorieDeficitSurplus = { cut: -400, bulk: 300, maintain: 0 }; adj = calorieDeficitSurplus[goalType]; dailyCal = tdee + adj; const minCalories = gen === 'female' ? 1200 : 1500; dailyCal = Math.max(minCalories, dailyCal); dailyCal = Math.round(dailyCal); let macroRatios; if (goalType === 'cut') { macroRatios = { p: 0.40, c: 0.30, f: 0.30 }; } else if (goalType === 'bulk') { macroRatios = { p: 0.30, c: 0.50, f: 0.20 }; } else { macroRatios = { p: 0.30, c: 0.40, f: 0.30 }; } const pG = Math.round((dailyCal * macroRatios.p) / 4); const cG = Math.round((dailyCal * macroRatios.c) / 4); const fG = Math.round((dailyCal * macroRatios.f) / 9); let estW = null, poss = false; const targetKg = w * 0.05 * (goalType === 'cut' ? -1 : 1); const kcalChangeNeeded = targetKg * 7700; const actualDailyAdj = dailyCal - tdee; if (goalType !== 'maintain' && Math.abs(actualDailyAdj) > 50) { const days = kcalChangeNeeded / actualDailyAdj; const maxWeeklyChangeKg = w * 0.01; const minWeeksForSafeChange = Math.abs(targetKg) / maxWeeklyChangeKg; if (days > 0 && isFinite(days)) { estW = Math.round(Math.max(days / 7, minWeeksForSafeChange)); poss = true; } } else if (goalType === 'maintain') { poss = true; } const timeRes = goalType !== 'maintain' ? { weeks: estW, possible: poss, goal: goalType } : null; return { cal: dailyCal, p: pG, c: cG, f: fG, time: timeRes }; }, []);


    // --- Meal Plan Generation (No changes needed here) ---
    const generateMealPlanImproved = useCallback(() => { /* ... content identical to previous version ... */
        if (foodData.length === 0 || !nutrientGoals.cal) { setError("Cannot generate plan: Nutrition data or calculated goals are missing."); return false; }
        setError(''); setMealPlan(null); setDailyTotals(null);
        try {
             const dietFilter = mealType === 'Veg' ? 'Veg' : 'Any';
             let availableFoods = foodData.filter(f => (dietFilter === 'Veg' && f.diet === 'Veg') || dietFilter === 'Any' );
             if (availableFoods.length === 0) { throw new Error(`No suitable ${mealType} dishes found in the loaded data.`); }
             availableFoods.sort(() => Math.random() - 0.5);
             const mealTargets = { breakfast: { name: 'Breakfast', targets: { cal: 0.25, p: 0.25, c: 0.30, f: 0.20 }, maxItems: 2 }, lunch: { name: 'Lunch', targets: { cal: 0.35, p: 0.35, c: 0.35, f: 0.30 }, maxItems: 2 }, dinner: { name: 'Dinner', targets: { cal: 0.30, p: 0.35, c: 0.25, f: 0.35 }, maxItems: 2 }, snacks: { name: 'Snacks', targets: { cal: 0.10, p: 0.05, c: 0.10, f: 0.15 }, maxItems: 1 }, };
             let generatedPlan = {}; let todaysSelectedIds = new Set(); let totalCostSoFar = 0;
             const numericBudget = budget ? parseFloat(budget) : Infinity;
             const calculateScore = (food, mealTargetCals, currentMealCals, repetitionPenalty, budgetLeft) => { if (food.calories <= 0) return -Infinity; const potentialTotalCals = currentMealCals + food.calories; const calDiff = Math.abs(mealTargetCals - potentialTotalCals); const overshootPenalty = Math.max(0, potentialTotalCals - mealTargetCals * 1.1); const calScore = 100 / (1 + calDiff + overshootPenalty * 2); const proteinDensity = food.calories > 0 ? (food.protein / food.calories) * 100 : 0; const proteinScore = Math.min(50, proteinDensity * 2.5); const foodCost = food.cost || (food.calories * 0.08); const costPer100kcal = food.calories > 0 ? (foodCost / food.calories) * 100 : 10; const costScore = 50 / (1 + costPer100kcal); const budgetPenalty = (totalCostSoFar + foodCost > numericBudget) ? 1000 : 0; return calScore + proteinScore + costScore - repetitionPenalty - budgetPenalty; };
             for (const mealKey of ['breakfast', 'lunch', 'dinner', 'snacks']) {
                 const { name: mealName, targets, maxItems } = mealTargets[mealKey]; const targetCals = nutrientGoals.cal * targets.cal; let mealItems = []; let currentMealCals = 0; let mealAttempts = 0;
                 let potentialFoodsForMeal = availableFoods.filter(f => f.mealType.includes(mealName.toLowerCase()) || f.mealType.includes('unknown') );
                 if (potentialFoodsForMeal.length < maxItems * 2 && availableFoods.length > potentialFoodsForMeal.length) { potentialFoodsForMeal = [...new Set([...potentialFoodsForMeal, ...availableFoods])]; }
                 potentialFoodsForMeal.sort((a, b) => a.calories - b.calories);
                 while (mealItems.length < maxItems && currentMealCals < targetCals * 1.2 && potentialFoodsForMeal.length > 0 && mealAttempts < 50) {
                     mealAttempts++; const budgetLeft = numericBudget - totalCostSoFar;
                     const scoredFoods = potentialFoodsForMeal .map(food => ({ ...food, score: calculateScore(food, targetCals, currentMealCals, todaysSelectedIds.has(food.id) ? 50 : 0, budgetLeft) })) .filter(f => f.score > -Infinity) .sort((a, b) => b.score - a.score);
                     if (scoredFoods.length === 0) break;
                     let foodToAdd = scoredFoods[0];
                     const addedCost = foodToAdd.cost || (foodToAdd.calories * 0.08);
                     if (totalCostSoFar + addedCost <= numericBudget) { mealItems.push(foodToAdd); currentMealCals += foodToAdd.calories; todaysSelectedIds.add(foodToAdd.id); totalCostSoFar += addedCost; potentialFoodsForMeal = potentialFoodsForMeal.filter(f => f.id !== foodToAdd.id); availableFoods = availableFoods.filter(f => f.id !== foodToAdd.id); }
                     else { potentialFoodsForMeal = potentialFoodsForMeal.filter(f => f.id !== foodToAdd.id); }
                 } generatedPlan[mealKey] = mealItems;
             }
            const finalFoods = Object.values(generatedPlan).flat(); if (finalFoods.length === 0) { throw new Error("Failed to select any dishes. Try adjusting goals, budget, or check data suitability."); }
            const totals = finalFoods.reduce((acc, f) => { acc.calories += f.calories || 0; acc.protein += f.protein || 0; acc.carbs += f.carbs || 0; acc.fat += f.fat || 0; acc.cost += f.cost || 0; return acc; }, { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 });
            Object.keys(totals).forEach(key => { totals[key] = Math.round(totals[key]); });
            setMealPlan(generatedPlan); setDailyTotals(totals); console.log("Generated Plan:", generatedPlan); console.log("Daily Totals:", totals); return true;
        } catch (err) { console.error("Meal Plan Generation Error:", err); setError(`Failed to generate meal plan: ${err.message}`); setMealPlan(null); setDailyTotals(null); return false; }
    }, [foodData, nutrientGoals, mealType, budget]); // Dependencies look correct


     // --- Enhance Dish with AI (No changes needed here) ---
     const enhanceDishWithAI = useCallback(async (dishToEnhance) => { /* ... content identical to previous version ... */
        if (!GEMINI_API_KEY) { console.warn("Skipping enhancement: API Key missing."); setFoodData(prev => prev.map(f => f.id === dishToEnhance.id ? { ...f, enhancementAttempted: true } : f)); setSelectedDish(current => (current && current.id === dishToEnhance.id) ? { ...current, enhancementAttempted: true } : current); return; }
        console.log(`Attempting AI enhancement for dish: ${dishToEnhance.name}`); setError(''); setIsEnhancingDish(true);
        try {
            const enhancedDetails = await GeminiService.generateDishDetails( dishToEnhance.name, dishToEnhance.ingredients, dishToEnhance.procedure, dishToEnhance.imageUrl, dishToEnhance.cost ); console.log("AI Enhancement result:", enhancedDetails);
            const updatedDishData = { ...dishToEnhance, ingredients: enhancedDetails.ingredients || dishToEnhance.ingredients, procedure: enhancedDetails.procedure || dishToEnhance.procedure, imageUrl: enhancedDetails.imageUrl || dishToEnhance.imageUrl, cost: enhancedDetails.estimatedCost > 0 ? enhancedDetails.estimatedCost : dishToEnhance.cost, enhancementAttempted: true, }; console.log("Final updated dish data after enhancement:", updatedDishData);
            const newFoodData = foodData.map(f => f.id === dishToEnhance.id ? updatedDishData : f ); setFoodData(newFoodData);
            setSelectedDish(current => (current && current.id === dishToEnhance.id) ? updatedDishData : current);
            let planUpdated = false; let newMealPlan = mealPlan ? { ...mealPlan } : null;
            if (newMealPlan) { Object.keys(newMealPlan).forEach(mealKey => { if (newMealPlan[mealKey]) { newMealPlan[mealKey] = newMealPlan[mealKey].map(f => { if (f.id === dishToEnhance.id) { planUpdated = true; return updatedDishData; } return f; }); } });
                 if (planUpdated) { setMealPlan(newMealPlan); const allFoods = Object.values(newMealPlan).flat(); const newTotals = allFoods.reduce((acc, f) => { acc.calories += f.calories || 0; acc.protein += f.protein || 0; acc.carbs += f.carbs || 0; acc.fat += f.fat || 0; acc.cost += f.cost || 0; return acc; }, { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 }); Object.keys(newTotals).forEach(key => newTotals[key] = Math.round(newTotals[key])); setDailyTotals(newTotals); console.log("Meal plan updated with enhanced dish details."); }
            }
        } catch (error) { console.error(`Error during enhancement process for ${dishToEnhance.name}:`, error); setError(`Failed to enhance ${dishToEnhance.name}. ${error.message}`); setFoodData(prev => prev.map(f => f.id === dishToEnhance.id ? { ...f, enhancementAttempted: true } : f)); setSelectedDish(current => (current && current.id === dishToEnhance.id) ? { ...current, enhancementAttempted: true } : current);
        } finally { setIsEnhancingDish(false); }
    }, [foodData, mealPlan, GEMINI_API_KEY]);


    // --- Modal Handlers (No changes needed here) ---
    const handleShowDetails = useCallback((dish) => { /* ... content identical to previous version ... */
        console.log(`Showing details for: ${dish.name}`, dish); setSelectedDish(dish);
        const needsEnhancement = GEMINI_API_KEY && ( !dish.ingredients || dish.ingredients.trim() === '' || !dish.procedure || dish.procedure.trim() === '' || !dish.imageUrl || !dish.cost || dish.cost <= 0 );
        const attemptEnhancement = needsEnhancement && !dish.enhancementAttempted;
        console.log(` -> Needs enhancement: ${needsEnhancement} (Ing: ${!dish.ingredients}, Proc: ${!dish.procedure}, Img: ${!dish.imageUrl}, Cost: ${!dish.cost})`); console.log(` -> Enhancement attempted previously: ${dish.enhancementAttempted}`); console.log(` -> Triggering enhancement now: ${attemptEnhancement}`);
        if (attemptEnhancement) { enhanceDishWithAI(dish); }
    }, [enhanceDishWithAI, GEMINI_API_KEY]);
    const handleCloseDetails = useCallback(() => { setSelectedDish(null); setIsEnhancingDish(false); }, []);

    // --- Main Calculation and Planning Handler (No changes needed here) ---
    const handleCalculateAndPlan = useCallback(async (e) => { /* ... content identical to previous version ... */
        e.preventDefault(); setLoading(true); setError(''); setMealPlan(null); setDailyTotals(null); setBmi(null); setBodyFat(null); setNutrientGoals({ cal: null, p: null, c: null, f: null }); setTimeline(null);
        const requiredPositiveNumbers = { height, weight, age, waist, neck }; let formValid = true;
        for (const [key, value] of Object.entries(requiredPositiveNumbers)) { const numValue = parseFloat(value); if (!value || isNaN(numValue) || numValue <= 0) { setError(`Input error: '${key.charAt(0).toUpperCase() + key.slice(1)}' must be a positive number.`); formValid = false; break; } if (key === 'height' && (numValue < 50 || numValue > 300)) { setError('Height must be between 50 and 300 cm.'); formValid = false; break; } if (key === 'weight' && (numValue < 20 || numValue > 500)) { setError('Weight must be between 20 and 500 kg.'); formValid = false; break; } if (key === 'age' && (numValue < 10 || numValue > 120)) { setError('Age must be between 10 and 120 years.'); formValid = false; break; } if (key === 'waist' && (numValue < 30 || numValue > 300)) { setError('Waist circumference must be between 30 and 300 cm.'); formValid = false; break; } if (key === 'neck' && (numValue < 10 || numValue > 100)) { setError('Neck circumference must be between 10 and 100 cm.'); formValid = false; break; } }
        if (!formValid) { setLoading(false); return; }
        const cw = parseFloat(weight); const ch = parseFloat(height); const ca = parseInt(age); const cn = parseFloat(neck); const cwa = parseFloat(waist);
        try { const bmiRes = calculateBMI(ch, cw); const bfRes = calculateBodyFatNavy(ch, cn, cwa, gender, cw, ca); const goalsRes = calculateNutrientGoals(cw, ch, ca, gender, activityLevel, goal); setBmi(bmiRes); setBodyFat(bfRes); setNutrientGoals({ cal: goalsRes.cal, p: goalsRes.p, c: goalsRes.c, f: goalsRes.f }); setTimeline(goalsRes.time);
            if (goalsRes.cal) { const planSuccess = generateMealPlanImproved(); if (!planSuccess && !error) { setError("Nutrient goals calculated, but failed to generate a suitable meal plan. Try adjusting budget, diet preferences, or check if enough diverse food data is available."); } else if (planSuccess) { console.log("Meal plan generated successfully."); } }
            else if (!error) { setError("Could not calculate nutrient goals based on the provided inputs. Please check your metrics."); }
        } catch (calculationError) { console.error("Error during calculations:", calculationError); setError(`An error occurred during calculation: ${calculationError.message}`);
        } finally { setLoading(false); }
    }, [ height, weight, age, waist, neck, gender, activityLevel, goal, budget, calculateBMI, calculateBodyFatNavy, calculateNutrientGoals, generateMealPlanImproved, error, foodData, nutrientGoals.cal ]);


    // --- Render Logic ---
    return (
        <div className="app-container">
            <h1 className="main-title"><FitnessCenterIcon fontSize="large" sx={{ verticalAlign: 'middle', mr: 1 }}/> Nutrition & Meal Planner</h1>

            {/* Use parsingFile state here */}
            {parsingFile && <p className="loading-message"><CircularProgress size={20} sx={{ mr: 1 }} /> Loading Nutrition Data...</p>}
            {!parsingFile && foodData.length === 0 && !error && (
                <p className="warning-message">Nutrition data file loaded, but no valid food items were found. Please check the format and content of 'public/nutrition.xlsx'.</p>
            )}
            {!GEMINI_API_KEY && <p className="warning-message">Note: AI features (like auto-filling details) are disabled as the API key is missing.</p>}
            {error && <p className="error-message">{error}</p>}

            {/* Input Form (No changes needed here) */}
            <form onSubmit={handleCalculateAndPlan}>
                 <h2 className="section-title"><ScaleIcon className="mui-icon"/> Your Metrics</h2>
                 <div className="form-grid"> <div className="form-group"><label htmlFor="height"><HeightIcon className="mui-icon"/> Height <span className="unit-hint">(cm)*</span></label><input type="number" id="height" value={height} onChange={e => setHeight(e.target.value)} min="50" max="300" step="0.1" required placeholder="e.g., 175"/></div> <div className="form-group"><label htmlFor="weight"><ScaleIcon className="mui-icon"/> Weight <span className="unit-hint">(kg)*</span></label><input type="number" id="weight" value={weight} onChange={e => setWeight(e.target.value)} min="20" max="500" step="0.1" required placeholder="e.g., 70"/></div> <div className="form-group"><label htmlFor="age"><CakeIcon className="mui-icon"/> Age <span className="unit-hint">*</span></label><input type="number" id="age" value={age} onChange={e => setAge(e.target.value)} min="10" max="120" required placeholder="e.g., 30"/></div> <div className="form-group"><label htmlFor="gender"><WcIcon className="mui-icon"/> Gender</label><select id="gender" value={gender} onChange={e => setGender(e.target.value)} required><option value="male">Male</option><option value="female">Female</option></select></div> </div>
                 <h2 className="section-title"><MonitorWeightIcon className="mui-icon"/> Body Composition (Optional)</h2>
                 <div className="form-grid"> <div className="form-group"><label htmlFor="waist"><StraightenIcon className="mui-icon"/> Waist <span className="unit-hint">(cm)*</span></label><input type="number" id="waist" value={waist} onChange={e => setWaist(e.target.value)} min="30" max="300" step="0.1" required placeholder="At narrowest point"/></div> <div className="form-group"><label htmlFor="neck"><StraightenIcon className="mui-icon"/> Neck <span className="unit-hint">(cm)*</span></label><input type="number" id="neck" value={neck} onChange={e => setNeck(e.target.value)} min="10" max="100" step="0.1" required placeholder="Below Adam's apple"/></div> </div>
                 <h2 className="section-title"><FlagIcon className="mui-icon"/> Goals & Activity</h2>
                 <div className="form-grid"> <div className="form-group"><label htmlFor="activityLevel"><DirectionsRunIcon className="mui-icon"/> Activity Level</label><select id="activityLevel" value={activityLevel} onChange={e => setActivityLevel(e.target.value)} required>{Object.entries(activityMultipliers).map(([v, l]) => (<option key={v} value={v}>{l} ({v})</option>))}</select></div> <div className="form-group"><label htmlFor="goal"><FlagIcon className="mui-icon"/> Fitness Goal</label><select id="goal" value={goal} onChange={e => setGoal(e.target.value)} required><option value="maintain">Maintain Weight</option><option value="cut">Lose Weight (Cut)</option><option value="bulk">Gain Weight (Bulk)</option></select></div> </div>
                 <h2 className="section-title"><RestaurantMenuIcon className="mui-icon"/> Meal Preferences</h2>
                 <div className="form-grid"> <div className="form-group"><label htmlFor="mealType"><NoMealsIcon className="mui-icon"/> Dietary Preference</label><select id="mealType" value={mealType} onChange={e => setMealType(e.target.value)} required><option value="Veg">Vegetarian</option><option value="Non-Veg">Non-Vegetarian (includes Veg)</option></select></div> <div className="form-group"><label htmlFor="budget"><AttachMoneyIcon className="mui-icon"/> Daily Budget <span className="unit-hint">(INR, Optional)</span></label><input type="number" id="budget" value={budget} onChange={e => setBudget(e.target.value)} min="0" step="1" placeholder="e.g., 300 (Leave blank for no limit)" /></div> </div>

                {/* Disable button based on parsingFile state */}
                <button type="submit" className="calculate-button" disabled={parsingFile || loading || foodData.length === 0} title={foodData.length === 0 ? "Cannot calculate without nutrition data" : (parsingFile ? "Loading data..." : "")} >
                    <CalculateIcon sx={{ mr: 1 }} />
                    {loading ? 'Processing...' : (mealPlan ? 'Recalculate & Regenerate Plan' : 'Calculate & Generate Meal Plan')}
                </button>
            </form>

            {/* Results Sections (No changes needed here) */}
            {!loading && (bmi || bodyFat || nutrientGoals.cal) && (
                <CalculationResults bmi={bmi} bodyFat={bodyFat} goals={nutrientGoals} timeline={timeline} />
            )}

            {/* Meal Plan Section (No changes needed here) */}
            {mealPlan && dailyTotals && !loading && (
                <div className="meal-plan-section">
                    <h2 className="section-title"><LocalDiningIcon className="mui-icon"/> Generated Daily Meal Plan</h2>
                    <DailySummary totals={dailyTotals} budget={parseFloat(budget || 0)} />
                    {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealKey) => ( mealPlan[mealKey] && mealPlan[mealKey].length > 0 && <MealInterval key={mealKey} mealName={mealKey} foods={mealPlan[mealKey]} onShowDetails={handleShowDetails} /> ))}
                </div>
             )}
             {!loading && !mealPlan && nutrientGoals.cal && !error && (
                 <p className="info-message">Calculations complete. Press the button again to generate a meal plan, or adjust settings and recalculate.</p>
             )}

            {/* Modal for Dish Details (No changes needed here) */}
            <DishDetailModal dish={selectedDish} open={!!selectedDish} onClose={handleCloseDetails} onEnhanceDish={enhanceDishWithAI} isLoading={isEnhancingDish} />
        </div>
    );
};
// =============================================
// END: Definition of Main Component
// =============================================

export default Main;

// --- END OF COMBINED FILE Main.jsx ---