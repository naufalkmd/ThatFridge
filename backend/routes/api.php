<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\IngestionController;
use App\Http\Controllers\BarcodeController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\AgentController;

Route::prefix('api')->group(function () {
    Route::post('items/manual', [IngestionController::class, 'store']);
    Route::post('items/barcode', [BarcodeController::class, 'scan']);
    Route::post('items/receipt/scan', [ReceiptController::class, 'scan']);
    Route::post('items/receipt/confirm', [ReceiptController::class, 'confirm']);
    Route::post('items/photo/scan', [PhotoController::class, 'scan']);
    Route::post('items/photo/confirm', [PhotoController::class, 'confirm']);
});

Route::prefix('chat')->group(function () {
    Route::get('/', [AgentController::class, 'history']);
    Route::post('/', [AgentController::class, 'send']);
});