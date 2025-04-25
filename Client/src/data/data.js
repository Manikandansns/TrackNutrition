export const IndianFoods = [
    // Protein sources
    {
      id: "p1",
      description: "Chicken Breast",
      category: "protein",
      vegetarian: false,
      mealPreference: ["lunch", "dinner"],
      nutrients: { protein: 31, carbs: 0, fat: 3.6, calories: 165 },
      costPer100g: 30 // in INR
    },
    {
      id: "p2",
      description: "Paneer",
      category: "protein",
      vegetarian: true,
      mealPreference: ["breakfast", "lunch", "dinner"],
      nutrients: { protein: 18, carbs: 3.1, fat: 22, calories: 265 },
      costPer100g: 40
    },
    {
      id: "p3",
      description: "Eggs",
      category: "protein",
      vegetarian: false,
      mealPreference: ["breakfast", "snacks"],
      nutrients: { protein: 13, carbs: 1.1, fat: 11, calories: 155 },
      costPer100g: 15 // ~2 eggs
    },
    {
      id: "p4",
      description: "Chana Dal",
      category: "protein",
      vegetarian: true,
      mealPreference: ["lunch", "dinner"],
      nutrients: { protein: 17, carbs: 57, fat: 5, calories: 360 },
      costPer100g: 10
    },
    {
      id: "p5",
      description: "Moong Dal",
      category: "protein",
      vegetarian: true,
      mealPreference: ["lunch", "dinner"],
      nutrients: { protein: 24, carbs: 63, fat: 1, calories: 330 },
      costPer100g: 12
    },
    {
      id: "p6",
      description: "Toor Dal",
      category: "protein",
      vegetarian: true,
      mealPreference: ["lunch", "dinner"],
      nutrients: { protein: 22, carbs: 63, fat: 1.5, calories: 335 },
      costPer100g: 13
    },
    {
      id: "p7",
      description: "Fish (Rohu)",
      category: "protein",
      vegetarian: false,
      mealPreference: ["lunch", "dinner"],
      nutrients: { protein: 16.6, carbs: 0, fat: 1.7, calories: 97 },
      costPer100g: 35
    },
    {
      id: "p8",
      description: "Tofu",
      category: "protein",
      vegetarian: true,
      mealPreference: ["breakfast", "lunch", "dinner"],
      nutrients: { protein: 8, carbs: 2, fat: 4, calories: 76 },
      costPer100g: 25
    },
    
    // Carbohydrate sources
    {
      id: "c1",
      description: "Brown Rice",
      category: "carbs",
      vegetarian: true,
      mealPreference: ["lunch", "dinner"],
      nutrients: { protein: 2.6, carbs: 23, fat: 0.9, calories: 112 },
      costPer100g: 8
    },
    {
      id: "c2",
      description: "Chapati/Roti",
      category: "carbs",
      vegetarian: true,
      mealPreference: ["breakfast", "lunch", "dinner"],
      nutrients: { protein: 3, carbs: 18, fat: 0.4, calories: 85 },
      costPer100g: 5 // for ~1 roti
    },
    {
      id: "c3",
      description: "Oats",
      category: "carbs",
      vegetarian: true,
      mealPreference: ["breakfast", "snacks"],
      nutrients: { protein: 13, carbs: 68, fat: 6.5, calories: 375 },
      costPer100g: 15
    },
    {
      id: "c4",
      description: "Sweet Potato",
      category: "carbs",
      vegetarian: true,
      mealPreference: ["breakfast", "lunch", "dinner", "snacks"],
      nutrients: { protein: 1.6, carbs: 20, fat: 0.1, calories: 86 },
      costPer100g: 5
    },
    {
      id: "c5",
      description: "Quinoa",
      category: "carbs",
      vegetarian: true,
      mealPreference: ["breakfast", "lunch", "dinner"],
      nutrients: { protein: 4.4, carbs: 21, fat: 1.9, calories: 120 },
      costPer100g: 30
    },
    {
      id: "c6",
      description: "Poha",
      category: "carbs",
      vegetarian: true,
      mealPreference: ["breakfast", "snacks"],
      nutrients: { protein: 2.5, carbs: 76, fat: 0.6, calories: 330 },
      costPer100g: 8
    },
    {
      id: "c7",
      description: "Idli",
      category: "carbs",
      vegetarian: true,
      mealPreference: ["breakfast"],
      nutrients: { protein: 2, carbs: 22, fat: 0.1, calories: 100 },
      costPer100g: 7
    },
    {
      id: "c8",
      description: "Upma",
      category: "carbs",
      vegetarian: true,
      mealPreference: ["breakfast"],
      nutrients: { protein: 3, carbs: 18, fat: 2.5, calories: 110 },
      costPer100g: 7
    },
    
    // Fat sources
    {
      id: "f1",
      description: "Ghee",
      category: "fat",
      vegetarian: true,
      mealPreference: ["breakfast", "lunch", "dinner"],
      nutrients: { protein: 0, carbs: 0, fat: 99.5, calories: 899 },
      costPer100g: 60
    },
    {
      id: "f2",
      description: "Coconut Oil",
      category: "fat",
      vegetarian: true,
      mealPreference: ["breakfast", "lunch", "dinner"],
      nutrients: { protein: 0, carbs: 0, fat: 99, calories: 892 },
      costPer100g: 50
    },
    {
      id: "f3",
      description: "Peanut Butter",
      category: "fat",
      vegetarian: true,
      mealPreference: ["breakfast", "snacks"],
      nutrients: { protein: 25, carbs: 20, fat: 50, calories: 590 },
      costPer100g: 70
    },
    {
      id: "f4",
      description: "Flaxseed",
      category: "fat",
      vegetarian: true,
      mealPreference: ["breakfast", "snacks"],
      nutrients: { protein: 18, carbs: 29, fat: 42, calories: 534 },
      costPer100g: 30
    },
    {
      id: "f5",
      description: "Almonds",
      category: "fat",
      vegetarian: true,
      mealPreference: ["breakfast", "snacks"],
      nutrients: { protein: 21, carbs: 22, fat: 49, calories: 579 },
      costPer100g: 100
    },
    
    // Vegetables and fruits
    {
      id: "v1",
      description: "Mixed Vegetables",
      category: "vegetables",
      vegetarian: true,
      mealPreference: ["lunch", "dinner"],
      nutrients: { protein: 2, carbs: 10, fat: 0.3, calories: 50 },
      costPer100g: 10
    },
    {
      id: "v2",
      description: "Spinach/Palak",
      category: "vegetables",
      vegetarian: true,
      mealPreference: ["lunch", "dinner"],
      nutrients: { protein: 2.9, carbs: 3.6, fat: 0.4, calories: 23 },
      costPer100g: 5
    },
    {
      id: "v3",
      description: "Banana",
      category: "fruit",
      vegetarian: true,
      mealPreference: ["breakfast", "snacks"],
      nutrients: { protein: 1.1, carbs: 23, fat: 0.3, calories: 89 },
      costPer100g: 5
    },
    {
      id: "v4",
      description: "Apple",
      category: "fruit",
      vegetarian: true,
      mealPreference: ["breakfast", "snacks"],
      nutrients: { protein: 0.3, carbs: 14, fat: 0.2, calories: 52 },
      costPer100g: 15
    },
    
    // Dairy and others
    {
      id: "d1",
      description: "Greek Yogurt/Dahi",
      category: "dairy",
      vegetarian: true,
      mealPreference: ["breakfast", "lunch", "dinner", "snacks"],
      nutrients: { protein: 10, carbs: 3.6, fat: 0.4, calories: 59 },
      costPer100g: 15
    },
    {
      id: "d2",
      description: "Milk",
      category: "dairy",
      vegetarian: true,
      mealPreference: ["breakfast", "snacks"],
      nutrients: { protein: 3.2, carbs: 4.8, fat: 3.9, calories: 65 },
      costPer100g: 8
    },
    {
      id: "d3",
      description: "Whey Protein",
      category: "supplement",
      vegetarian: true,
      mealPreference: ["breakfast", "snacks"],
      nutrients: { protein: 80, carbs: 7, fat: 3, calories: 400 },
      costPer100g: 200
    },
    {
      id: "s1",
      description: "Chana Chaat",
      category: "snack",
      vegetarian: true,
      mealPreference: ["snacks"],
      nutrients: { protein: 8, carbs: 27, fat: 3, calories: 160 },
      costPer100g: 15
    },
    {
      id: "s2",
      description: "Sprouts Salad",
      category: "snack",
      vegetarian: true,
      mealPreference: ["breakfast", "snacks"],
      nutrients: { protein: 3, carbs: 8, fat: 0.5, calories: 48 },
      costPer100g: 12
    }
  ];