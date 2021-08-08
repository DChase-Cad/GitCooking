const express = require('express');
const Recipe = require('../models/recipe');

const recipeRouter = express.Router();

//routing for all recipes at once
recipeRouter.route('/')
    .get((req, res, next) => {
        Recipe.find()
            .then(recipes => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(recipes);
            })
            .catch(err => next(err));
    })
    .post((req, res, next) => {
        Recipe.create(req.body)
            .then(recipe => {
                console.log('Recipe Created ', recipe);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(recipe);
            })
            .catch(err => next(err));
    })
    .put((req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /recipes');
    })
    .delete((req, res, next) => {
        Recipe.deleteMany()
            .then(response => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            })
            .catch(err => next(err));
    });

//routing for paths with a recipeid
recipeRouter.route('/:recipeId')
    .get((req, res, next) => {
        Recipe.findById(req.params.recipeId)
            .then(recipe => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(recipe);
            })
            .catch(err => next(err));
    })
    .post((req, res) => {
        res.statusCode = 403;
        res.end(`POST operation not supported on /recipes/${req.params.recipeId}`);
    })
    .put((req, res, next) => {
        Recipe.findByIdAndUpdate(req.params.recipeId, {
            $set: req.body
        }, { new: true })
            .then(recipe => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(recipe);
            })
            .catch(err => next(err));
    })
    .delete((req, res, next) => {
        Recipe.findByIdAndDelete(req.params.recipeId)
            .then(response => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            })
            .catch(err => next(err));
    });

recipeRouter.route('/:recipeId/ingredients')
    .get((req, res, next) => {
        Recipe.findById(req.params.recipeId)
            .then(recipe => {
                if (recipe) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(recipe.ingredients);
                } else {
                    err = new Error(`recipe${req.params.recipeId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .post((req, res, next) => {
        Recipe.findById(req.params.recipeId)
            .then(recipe => {
                if (recipe && testDupItem(recipe.ingredients, req.body.name)) {                             //testDup() is testing for duplicate ingredient
                    recipe.ingredients.push(req.body);
                    recipe.save()
                        .then(recipe => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(recipe);
                        })
                        .catch(err => next(err));
                } else if (!testDupItem(recipe.ingredients, req.body.name)) {                               //error for duplicate ingredient existing
                    err = new Error(`${req.body.name} already exists in the recipe for ${recipe.name}`)
                    err.status = 403;
                    return next(err);
                }
                else {
                    err = new Error(`recipe${req.params.recipeId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .put((req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /recipes/${req.params.recipeId}/recipes`);
    })
    .delete((req, res, next) => {
        Recipe.findById(req.params.recipeId)
            .then(recipe => {
                if (recipe) {
                    for (let i = (recipe.ingredients.length - 1); i >= 0; i--) {
                        recipe.ingredients.id(recipe.ingredients[i]._id).remove();
                    }
                    recipe.save()
                        .then(recipe => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(recipe);
                        })
                        .catch(err => next(err));
                } else {
                    err = new Error(`recipe${req.params.recipeId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    });


//routing for specific ingredient on specific recipe
recipeRouter.route('/:recipeId/ingredients/:ingredientId')
    .get((req, res, next) => {
        Recipe.findById(req.params.recipeId)
            .then(recipe => {
                if (recipe && recipe.ingredients.id(req.params.ingredientId)) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(recipe.ingredients.id(req.params.ingredientId));
                } else if (!recipe) {
                    err = new Error(`recipe${req.params.recipeId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`ingredient ${req.params.ingredientId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .post((req, res) => {
        res.statusCode = 403;
        res.end(`POST operation not supported on /recipes/${req.params.recipeId}/recipes/${req.params.ingredientId}`);
    })
    .put((req, res, next) => {
        Recipe.findById(req.params.recipeId)
            .then(recipe => {
                if (recipe && recipe.ingredients.id(req.params.ingredientId)) {
                    if (req.body.name) {
                        recipe.ingredients.id(req.params.ingredientId).name = req.body.name;
                    }
                    if (req.body.aisle) {
                        recipe.ingredients.id(req.params.ingredientId).aisle = req.body.aisle;
                    }
                    if (req.body.amount) {
                        recipe.ingredients.id(req.params.ingredientId).amount = req.body.amount;
                    }
                    recipe.save()
                        .then(recipe => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(recipe);
                        })
                        .catch(err => next(err));
                } else if (!recipe) {
                    err = new Error(`recipe${req.params.recipeId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`ingredient ${req.params.ingredientId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .delete((req, res, next) => {
        Recipe.findById(req.params.recipeId)
            .then(recipe => {
                if (recipe && recipe.ingredients.id(req.params.ingredientId)) {
                    recipe.ingredients.id(req.params.ingredientId).remove();
                    recipe.save()
                        .then(recipe => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(recipe);
                        })
                        .catch(err => next(err));
                } else if (!recipe) {
                    err = new Error(`recipe${req.params.recipeId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`ingredient ${req.params.ingredientId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));

    });

//routing for all directions on a specific recipe
recipeRouter.route('/:recipeId/directions')
    .get((req, res, next) => {
        Recipe.findById(req.params.recipeId)
            .then(recipe => {
                if (recipe) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(recipe.directions);
                } else {
                    err = new Error(`recipe${req.params.recipeId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .put((req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /recipes/${req.params.recipeId}/directions`);
    })
    .post((req, res, next) => {
        Recipe.findById(req.params.recipeId)
            .then(recipe => {
                if (recipe && testDupStep(recipe.directions, req.body.step)) {                                   //testing for duplicate step #
                    recipe.directions.push(req.body);
                    recipe.save()
                        .then(recipe => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(recipe);
                        })
                        .catch(err => next(err));
                } else if (!testDupStep(recipe.directions, req.body.step)) {                                    //error for duplicate step #
                    err = new Error(`Next step number must come numerically next (should be ${recipe.directions.length + 1})`)
                    err.status = 403;
                    return next(err);
                } else {
                    err = new Error(`recipe ${req.params.recipeId} not found`);                                 //error for recipe not found
                    err.status = 404;
                    return next(err);
                }
            })
    })
    .delete((req, res, next) => {
        Recipe.findById(req.params.recipeId)
            .then(recipe => {
                if (recipe) {
                    for (let i = (recipe.directions.length - 1); i >= 0; i--) {
                        recipe.directions.id(recipe.directions[i]._id).remove();
                    }
                    recipe.save()
                        .then(recipe => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(recipe);
                        })
                        .catch(err => next(err));
                } else {
                    err = new Error(`recipe${req.params.recipeId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    });

recipeRouter.route('/:recipeId/directions/:directionId')
    .get((req, res, next) => {
        Recipe.findById(req.params.recipeId)
            .then(recipe => {
                if (recipe && recipe.directions.id(req.params.directionId)) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(recipe.directions.id(req.params.directionId));
                } else if (!recipe) {
                    err = new Error(`recipe${req.params.recipeId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`direction ${req.params.directionId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .post((req, res) => {
        res.statusCode = 403;
        res.end(`POST operation not supported on /recipes/${req.params.recipeId}/recipes/${req.params.directionId}`);
    })
    .put((req, res, next) => {
        Recipe.findById(req.params.recipeId)
            .then(recipe => {
                if (recipe && recipe.directions.id(req.params.directionId)) {
                    if (req.body.step) {
                        recipe.directions.id(req.params.directionId).step = req.body.step;
                    }
                    if (req.body.text) {
                        recipe.directions.id(req.params.directionId).text = req.body.text;
                    }
                    recipe.save()
                        .then(recipe => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(recipe);
                        })
                        .catch(err => next(err));
                } else if (!recipe) {
                    err = new Error(`recipe${req.params.recipeId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`ingredient ${req.params.directionId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .delete((req, res, next) => {
        Recipe.findById(req.params.recipeId)
            .then(recipe => {
                if (recipe && recipe.directions.id(req.params.directionId)) {
                    recipe.directions.id(req.params.directionId).remove();
                    recipe.save()
                        .then(recipe => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(recipe);
                        })
                        .catch(err => next(err));
                } else if (!recipe) {
                    err = new Error(`recipe${req.params.recipeId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`direction ${req.params.directionId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));

    });

//function testing for duplicate ingredient
function testDupItem(arr, item) {
    let test = true;
    arr.map(e => {
        if (e.name === item || e.step === item) {
            test = false;
        }
    })
    return test;
}

//function for testing for proper step on directions
function testDupStep(arr, item) {

    let test = true;
    console.log(arr)
    if (item != arr.length + 1) {
        test = false;
    }
    return test;

}
module.exports = recipeRouter;
