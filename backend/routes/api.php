<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\FridgeController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\ShoppingItemController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/fridges', [FridgeController::class, 'index']);
    Route::post('/fridges', [FridgeController::class, 'store']);
    Route::get('/fridges/{fridge}', [FridgeController::class, 'show']);
    Route::patch('/fridges/{fridge}', [FridgeController::class, 'update']);
    Route::delete('/fridges/{fridge}', [FridgeController::class, 'destroy']);

    Route::post('/fridges/{fridge}/sections', [SectionController::class, 'store']);
    Route::patch('/sections/{section}', [SectionController::class, 'update']);
    Route::delete('/sections/{section}', [SectionController::class, 'destroy']);

    Route::post('/sections/{section}/items', [ItemController::class, 'store']);
    Route::patch('/items/{item}', [ItemController::class, 'update']);
    Route::delete('/items/{item}', [ItemController::class, 'destroy']);

    Route::get('/shopping-items', [ShoppingItemController::class, 'index']);
    Route::post('/shopping-items', [ShoppingItemController::class, 'store']);
    Route::patch('/shopping-items/{shoppingItem}', [ShoppingItemController::class, 'update']);
    Route::delete('/shopping-items/{shoppingItem}', [ShoppingItemController::class, 'destroy']);
});
