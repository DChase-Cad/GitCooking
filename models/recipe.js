const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const directionSchema = new Schema({
    step: {
        type: Number,
        required: true,
        unique: true
    },
    text: {
        type: String,
        required: true
    }
});

const ingredientSchema = new Schema({
    name: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    aisle: {
        type: String,
        required: true
    },
    amount: {
        type: String,
        required: true
    }
});



const recipeSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    duration: {
        type: String,
        required: true,
    },
    favorite: {
        type: Boolean,
        required: true,
        default: false
    },
    ingredients: [ingredientSchema],
    directions: [directionSchema]
}, { timestamps: true });

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
