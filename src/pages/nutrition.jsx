// src/pages/nutrition.jsx
import React, { useState } from 'react';

const Nutrition = () => {
    const [foodData, setFoodData] = useState({
        food_name: '',
        calories: '',
        meal_type: 'Lunch',
    });

    const handleChange = (e) => {
        setFoodData({ ...foodData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Logging Food:', foodData);
        alert('Meal Logged!');
    };

    return (
        <div className="nutrition-container container-style">
            <header className="header-style">
                <h1 className="title-style">🍽️ Nutrition Log</h1>
            </header>

            <form onSubmit={handleSubmit} className="form-style">
                
                <div className="input-group-style">
                    <label htmlFor="meal-type" className="label-style">Meal Type:</label>
                    <select id="meal-type" name="meal_type" value={foodData.meal_type} onChange={handleChange} required className="input-style">
                        <option value="Breakfast">Breakfast</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Dinner">Dinner</option>
                        <option value="Snack">Snack</option>
                    </select>
                </div>

                <div className="input-group-style">
                    <label htmlFor="food-name" className="label-style">Food Item:</label>
                    <input type="text" id="food-name" name="food_name" value={foodData.food_name} onChange={handleChange} placeholder="E.g., Chicken Rice" required className="input-style" />
                </div>
                
                <div className="input-group-style">
                    <label htmlFor="calories" className="label-style">Calories:</label>
                    <input type="number" id="calories" name="calories" value={foodData.calories} onChange={handleChange} placeholder="E.g., 450" required className="input-style" />
                </div>
                
                <button type="submit" className="btn-primary-feature">Log Meal</button>
            </form>
        </div>
    );
};

export default Nutrition;