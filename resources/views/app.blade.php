<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="NIA Budget Records Management System — National Irrigation Administration">
    <meta name="author" content="National Irrigation Administration">
    <meta property="og:title" content="NIA Budget Records">
    <meta property="og:description" content="Budget Records Management System for the National Irrigation Administration">
    <meta property="og:image" content="{{ asset('images/nia-logo.png') }}">
    <link rel="icon" type="image/png" href="{{ asset('images/nia-logo.png') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <title>NIA Budget Records</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="min-h-screen bg-gray-50 text-gray-900">
    <div id="app"></div>
</body>
</html>
