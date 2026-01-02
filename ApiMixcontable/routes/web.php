<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/', function () {
    return view('welcome');
});

// Named login route to satisfy references to route('login') from middleware/exceptions.
Route::post('/login', [AuthController::class, 'login'])->name('login');
