import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Filter, Search, ChevronDown, ChevronUp, Info } from 'lucide-react';

// Material UI imports
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  TextField, 
  Paper, 
  Grid, 
  Tabs, 
  Tab, 
  Checkbox, 
  FormControlLabel, 
  Chip, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  ThemeProvider,
  createTheme
} from '@mui/material';

// Create custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1',
    },
    secondary: {
      main: '#a5b4fc',
    },
    background: {
      default: '#f5f7fa',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          overflow: 'hidden',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
  },
});

export default function Dataset() {
  const [csvData, setCsvData] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [userGoals, setUserGoals] = useState({
    calories: 2000,
    protein: 50,
    fat: 70,
    carbs: 260
  });
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedMealTypes, setSelectedMealTypes] = useState([]);
  const [selectedDietTags, setSelectedDietTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [recommendedMeals, setRecommendedMeals] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('Loading local file...');

  // Fetch the CSV file from local path
  useEffect(() => {
    async function fetchCSVData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to fetch from public folder (absolute path)
        console.log('Attempting to fetch CSV from /nutrition.csv');
        const response = await fetch('/nutrition.csv');
        
        console.log('Response:', response);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        
        // Important: Get the actual text content from the response
        const text = await response.text();
        console.log('CSV content length:', text.length);
        
        if (!text || text.trim() === '') {
          throw new Error('The CSV file is empty');
        }
        
        setCsvData(text);
        setDataSource('Local nutrition.csv file');
      } catch (err) {
        console.error("Error fetching local CSV file:", err);
        
        // Try to fetch from the same directory as a fallback
        try {
          console.log('Attempting to fetch CSV from ./nutrition.csv');
          const fallbackResponse = await fetch('./nutrition.csv');
          
          console.log('Fallback response:', fallbackResponse);
          
          if (!fallbackResponse.ok) {
            throw new Error(`Failed to fetch data from fallback location: ${fallbackResponse.status}`);
          }
          
          // Important: Get the actual text content from the response
          const fallbackText = await fallbackResponse.text();
          console.log('Fallback CSV content length:', fallbackText.length);
          
          if (!fallbackText || fallbackText.trim() === '') {
            throw new Error('The fallback CSV file is empty');
          }
          
          setCsvData(fallbackText);
          setDataSource('Local nutrition.csv file (fallback path)');
        } catch (fallbackErr) {
          console.error("Error fetching fallback CSV file:", fallbackErr);
          // Use example data as a last resort
          generateExampleData();
          setError("Could not load nutrition.csv. Using example data instead. Please ensure nutrition.csv is in the public folder.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCSVData();
  }, []);

  // Parse CSV data when it changes
// Parse CSV data when it changes
useEffect(() => {
    if (!csvData) {
      console.log('No CSV data to parse');
      return;
    }
    
    try {
      console.log('Parsing CSV data of type:', typeof csvData);
      
      if (typeof csvData !== 'string') {
        throw new Error('CSV data is not a string');
      }
      
      // Normalize line endings
      const normalizedData = csvData.replace(/\r\n/g, '\n').trim();
      const lines = normalizedData.split('\n');
      console.log('CSV lines:', lines.length);
      
      if (lines.length <= 1) {
        console.log('Not enough lines in CSV');
        setParsedData([]);
        return;
      }
      
      // Parse headers - handle quotation marks if present
      const headers = parseCSVLine(lines[0]);
      console.log('CSV headers:', headers);
      
      if (!headers.length || headers.every(h => !h)) {
        throw new Error('No valid headers found in CSV');
      }
      
      const result = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        const values = parseCSVLine(lines[i]);
        
        if (values.length !== headers.length) {
          console.log(`Skipping line ${i} due to column count mismatch. Expected ${headers.length}, got ${values.length}`);
          console.log('Line content:', lines[i]);
          continue;
        }
        
        const entry = {};
        headers.forEach((header, index) => {
          entry[header] = values[index];
        });
        
        // Try to extract numeric values from strings
        try {
          entry['Calories (kcal)'] = parseFloat(entry['Calories (kcal)']) || 0;
          entry['Protein (g)'] = parseFloat(entry['Protein (g)']) || 0;
          entry['Fat (g)'] = parseFloat(entry['Fat (g)']) || 0;
          entry['Carbohydrates (g)'] = parseFloat(entry['Carbohydrates (g)']) || 0;
        } catch (e) {
          console.error("Error parsing numeric values:", e);
        }
        
        result.push(entry);
      }
      
      console.log('Parsed data items:', result.length);
      setParsedData(result);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      setError(`Failed to parse CSV data: ${error.message}`);
    }
  }, [csvData]);
  
  // Helper function to properly parse CSV lines with quoted fields
  function parseCSVLine(line) {
    const result = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Don't forget the last value
    result.push(currentValue.trim());
    
    return result;
  }

  // Generate food recommendations when data or goals change
  useEffect(() => {
    if (!parsedData.length) return;
    
    // Simple recommendation algorithm based on nutritional goals
    const recommendations = parsedData
      .filter(item => {
        // Filter by search term
        if (searchTerm && !item['Dish Name']?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Filter by cuisine
        if (selectedCuisines.length > 0 && !selectedCuisines.includes(item['Cuisine'])) {
          return false;
        }
        
        // Filter by meal type
        if (selectedMealTypes.length > 0 && !selectedMealTypes.includes(item['Meal Type'])) {
          return false;
        }
        
        // Filter by diet tags
        if (selectedDietTags.length > 0) {
          const itemTags = item['Diet Tags']?.split(',').map(tag => tag.trim()) || [];
          if (!selectedDietTags.some(tag => itemTags.includes(tag))) {
            return false;
          }
        }
        
        return true;
      })
      .map(item => {
        // Calculate how well this item matches nutritional goals
        const calorieMatch = Math.abs(1 - (item['Calories (kcal)'] / (userGoals.calories / 3))); // Assume 3 meals per day
        const proteinMatch = Math.abs(1 - (item['Protein (g)'] / (userGoals.protein / 3)));
        const fatMatch = Math.abs(1 - (item['Fat (g)'] / (userGoals.fat / 3)));
        const carbMatch = Math.abs(1 - (item['Carbohydrates (g)'] / (userGoals.carbs / 3)));
        
        // Calculate overall match score (lower is better)
        const matchScore = (calorieMatch + proteinMatch + fatMatch + carbMatch) / 4;
        
        return {
          ...item,
          matchScore
        };
      })
      .sort((a, b) => a.matchScore - b.matchScore);
    
    setRecommendedMeals(recommendations.slice(0, 5)); // Top 5 recommendations
  }, [parsedData, userGoals, searchTerm, selectedCuisines, selectedMealTypes, selectedDietTags]);

  // Extract unique values for filters
  const cuisines = [...new Set(parsedData.map(item => item['Cuisine']).filter(Boolean))];
  const mealTypes = [...new Set(parsedData.map(item => item['Meal Type']).filter(Boolean))];
  const dietTags = [...new Set(parsedData.flatMap(item => {
    if (item['Diet Tags']) {
      return item['Diet Tags'].split(',').map(tag => tag.trim());
    }
    return [];
  }).filter(Boolean))];

  // Handle file upload (as a backup option)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsLoading(true);
      setError(null);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target.result;
        console.log('Uploaded file content type:', typeof result);
        console.log('Uploaded file content length:', result.length);
        setCsvData(result);
        setDataSource(`Uploaded file: ${file.name}`);
        setIsLoading(false);
      };
      reader.onerror = (evt) => {
        console.error('FileReader error:', evt);
        setError("Failed to read the uploaded file");
        setIsLoading(false);
      };
      reader.readAsText(file);
    }
  };

  // Generate an example CSV if none provided
  const generateExampleData = () => {
    const exampleCSV = `Dish Name,Description,Cuisine,Meal Type,Diet Tags,Calories (kcal),Protein (g),Fat (g),Carbohydrates (g),Allergens
Grilled Salmon with Asparagus,Fresh salmon fillet grilled with lemon and herbs served with steamed asparagus,Mediterranean,Dinner,High Protein,320,35,18,5,Fish
Vegetable Stir Fry,Mixed vegetables stir-fried with tofu in soy ginger sauce,Asian,Lunch,Vegetarian,280,15,12,30,Soy
Quinoa Breakfast Bowl,Quinoa topped with fresh berries nuts and honey,American,Breakfast,Gluten-Free,350,10,14,45,Nuts
Greek Salad,Fresh vegetables with feta cheese and olive oil dressing,Mediterranean,Lunch,Vegetarian,220,8,18,10,Dairy
Japanese Vegetable Broth Fried Eggs,A hearty Japanese breakfast with fried eggs and vegetables,Japanese,Breakfast,Vegetarian,445,10.5,37,37,None`;
    console.log('Setting example data');
    setCsvData(exampleCSV);
    setDataSource('Example data');
  };

  // Example data for nutrition chart
  const nutritionData = [
    { name: 'Calories', current: recommendedMeals.reduce((sum, meal) => sum + (meal['Calories (kcal)'] || 0), 0), goal: userGoals.calories },
    { name: 'Protein', current: recommendedMeals.reduce((sum, meal) => sum + (meal['Protein (g)'] || 0), 0), goal: userGoals.protein },
    { name: 'Fat', current: recommendedMeals.reduce((sum, meal) => sum + (meal['Fat (g)'] || 0), 0), goal: userGoals.fat },
    { name: 'Carbs', current: recommendedMeals.reduce((sum, meal) => sum + (meal['Carbohydrates (g)'] || 0), 0), goal: userGoals.carbs }
  ];

  // Try loading nutrition.csv again manually
  const tryLoadingAgain = () => {
    setIsLoading(true);
    setError(null);
    
    fetch('/nutrition.csv')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then(text => {
        console.log('Manual fetch succeeded, content length:', text.length);
        setCsvData(text);
        setDataSource('Local nutrition.csv file (manual fetch)');
      })
      .catch(err => {
        console.error('Manual fetch failed:', err);
        setError(`Failed to load nutrition.csv: ${err.message}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ py: 4 }} style={{marginTop: '7rem'}}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            Nutrition Tracker & Meal Recommender
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your nutrition goals and get personalized meal recommendations
          </Typography>
        </Box>
        
        {/* Data Loading Status */}
        {isLoading && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Loading nutrition data...
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* File Upload Section */}
        <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Nutrition Data Source
          </Typography>
          
          {!isLoading && (
            <Alert severity={error ? "warning" : "success"} sx={{ mb: 2 }}>
              <Typography variant="body2">
                Current data source: {dataSource}
              </Typography>
            </Alert>
          )}
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                component="label"
                fullWidth
                sx={{ p: 1.5 }}
              >
                Upload CSV File
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={handleFileUpload}
                />
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button 
                variant="outlined"
                onClick={tryLoadingAgain}
                fullWidth
                sx={{ p: 1.5 }}
              >
                Try Loading Local File Again
              </Button>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="text"
              onClick={generateExampleData}
              fullWidth
              sx={{ p: 1.5 }}
            >
              Use Example Data Instead
            </Button>
          </Box>
          
          {parsedData.length > 0 && !isLoading && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Successfully loaded {parsedData.length} food items!
            </Alert>
          )}
        </Paper>

        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            TabIndicatorProps={{
              style: { height: 3 }
            }}
          >
            <Tab label="Nutrition Goals" />
            <Tab label="Food Recommendations" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Set Your Nutrition Goals
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Daily Calories (kcal)"
                  type="number"
                  fullWidth
                  value={userGoals.calories}
                  onChange={(e) => setUserGoals({...userGoals, calories: Number(e.target.value)})}
                  inputProps={{ min: 0 }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Daily Protein (g)"
                  type="number"
                  fullWidth
                  value={userGoals.protein}
                  onChange={(e) => setUserGoals({...userGoals, protein: Number(e.target.value)})}
                  inputProps={{ min: 0 }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Daily Fat (g)"
                  type="number"
                  fullWidth
                  value={userGoals.fat}
                  onChange={(e) => setUserGoals({...userGoals, fat: Number(e.target.value)})}
                  inputProps={{ min: 0 }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Daily Carbohydrates (g)"
                  type="number"
                  fullWidth
                  value={userGoals.carbs}
                  onChange={(e) => setUserGoals({...userGoals, carbs: Number(e.target.value)})}
                  inputProps={{ min: 0 }}
                  variant="outlined"
                />
              </Grid>
            </Grid>
            
            {/* Nutrition Chart */}
            {parsedData.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Current Nutrition vs. Goals
                </Typography>
                <Paper elevation={1} sx={{ p: 2, bgcolor: '#fcfcfc', height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={nutritionData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          borderRadius: 8, 
                          border: 'none', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                        }} 
                      />
                      <Legend wrapperStyle={{ paddingTop: 10 }} />
                      <Bar dataKey="current" name="Selected Meals" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="goal" name="Daily Goal" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Box>
            )}
          </Paper>
        )}

        {activeTab === 1 && (
          <>
            {/* Filters Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  Find Foods
                </Typography>
                <Button 
                  variant="text"
                  onClick={() => setShowFilters(!showFilters)}
                  startIcon={<Filter size={18} />}
                  endIcon={showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                >
                  Filters
                </Button>
              </Box>
              
              <TextField
                fullWidth
                placeholder="Search foods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} />
                    </InputAdornment>
                  ),
                }}
              />
              
              {showFilters && (
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      Cuisines
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 1, maxHeight: 200, overflow: 'auto' }}>
                      {cuisines.map(cuisine => (
                        <FormControlLabel
                          key={cuisine}
                          control={
                            <Checkbox
                              checked={selectedCuisines.includes(cuisine)}
                              onChange={() => {
                                if (selectedCuisines.includes(cuisine)) {
                                  setSelectedCuisines(selectedCuisines.filter(c => c !== cuisine));
                                } else {
                                  setSelectedCuisines([...selectedCuisines, cuisine]);
                                }
                              }}
                              size="small"
                            />
                          }
                          label={cuisine}
                        />
                      ))}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      Meal Types
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 1, maxHeight: 200, overflow: 'auto' }}>
                      {mealTypes.map(mealType => (
                        <FormControlLabel
                          key={mealType}
                          control={
                            <Checkbox
                              checked={selectedMealTypes.includes(mealType)}
                              onChange={() => {
                                if (selectedMealTypes.includes(mealType)) {
                                  setSelectedMealTypes(selectedMealTypes.filter(m => m !== mealType));
                                } else {
                                  setSelectedMealTypes([...selectedMealTypes, mealType]);
                                }
                              }}
                              size="small"
                            />
                          }
                          label={mealType}
                        />
                      ))}
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                      Diet Tags
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 1, maxHeight: 200, overflow: 'auto' }}>
                      {dietTags.map(tag => (
                        <FormControlLabel
                          key={tag}
                          control={
                            <Checkbox
                              checked={selectedDietTags.includes(tag)}
                              onChange={() => {
                                if (selectedDietTags.includes(tag)) {
                                  setSelectedDietTags(selectedDietTags.filter(t => t !== tag));
                                } else {
                                  setSelectedDietTags([...selectedDietTags, tag]);
                                }
                              }}
                              size="small"
                            />
                          }
                          label={tag}
                        />
                      ))}
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </Paper>

            {/* Recommended Foods */}
            <Paper elevation={0} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Recommended Foods
              </Typography>
              
              {isLoading ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography color="text.secondary">
                    Loading nutrition data...
                  </Typography>
                </Box>
              ) : parsedData.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography color="text.secondary">
                    No nutrition data available. Please check the CSV file format.
                  </Typography>
                </Box>
              ) : recommendedMeals.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography color="text.secondary">
                    No foods match your current filters. Try adjusting your search criteria.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {recommendedMeals.map((meal, index) => (
                    <Grid item xs={12} key={index}>
                      <Card variant="outlined">
                        <CardHeader
                          title={meal['Dish Name']}
                          action={
                            <Chip 
                              label={`${Math.round((1 - meal.matchScore) * 100)}% match`}
                              color="primary"
                              variant="outlined"
                            />
                          }
                        />
                        <CardContent>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {meal['Description']}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {meal['Cuisine'] && (
                              <Chip 
                                label={meal['Cuisine']} 
                                size="small" 
                                sx={{ bgcolor: '#e3f2fd', color: '#f62c21' }}
                              />
                            )}
                            {meal['Meal Type'] && (
                              <Chip 
                                label={meal['Meal Type']} 
                                size="small" 
                                sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }}
                              />
                            )}
                            {meal['Diet Tags']?.split(',').map((tag, i) => (
                              <Chip 
                                key={i} 
                                label={tag.trim()} 
                                size="small" 
                                sx={{ bgcolor: '#f3e5f5', color: '#6a1b9a' }}
                              />
                            ))}
                          </Box>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Grid container spacing={2}>
                            <Grid item xs={3}>
                              <Paper 
                                variant="outlined" 
                                sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f5f5f5' }}
                              >
                                <Typography variant="h6">{meal['Calories (kcal)']}</Typography>
                                <Typography variant="caption" color="text.secondary">calories</Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={3}>
                              <Paper 
                                variant="outlined" 
                                sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f5f5f5' }}
                              >
                                <Typography variant="h6">{meal['Protein (g)']}</Typography>
                                <Typography variant="caption" color="text.secondary">protein (g)</Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={3}>
                              <Paper 
                                variant="outlined" 
                                sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f5f5f5' }}
                              >
                                <Typography variant="h6">{meal['Fat (g)']}</Typography>
                                <Typography variant="caption" color="text.secondary">fat (g)</Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={3}>
                              <Paper 
                                variant="outlined" 
                                sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f5f5f5' }}
                              >
                                <Typography variant="h6">{meal['Carbohydrates (g)']}</Typography>
                                <Typography variant="caption" color="text.secondary">carbs (g)</Typography>
                              </Paper>
                            </Grid>
                          </Grid>
                          
                          {meal['Allergens'] && meal['Allergens'] !== 'None' && (
                            <Alert 
                              severity="warning" 
                              icon={<Info size={16} />}
                              sx={{ mt: 2 }}
                            >
                              <Typography variant="body2">
                                Allergens: {meal['Allergens']}
                              </Typography>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </>
        )}
      </Container>
    </ThemeProvider>
  );
}