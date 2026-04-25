<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="NIA Budget Records Management System — National Irrigation Administration">
    <link rel="icon" type="image/png" href="{{ asset('images/nia-logo.png') }}">
    <title>NIA Budget Records</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb; color: #111827; }
        .card { text-align: center; max-width: 400px; padding: 3rem 2rem; }
        .logo { width: 96px; height: 96px; object-fit: contain; margin: 0 auto 1.5rem; }
        h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
        .sub { font-size: 0.875rem; color: #6b7280; margin-bottom: 2rem; }
        .btn { display: inline-block; padding: 0.625rem 1.5rem; background: #1d4ed8; color: #fff; border-radius: 0.5rem; text-decoration: none; font-size: 0.875rem; font-weight: 600; transition: background 150ms; }
        .btn:hover { background: #1e40af; }
    </style>
</head>
<body>
    <div class="card">
        <img src="{{ asset('images/nia-logo.png') }}" alt="NIA Logo" class="logo">
        <h1>NIA Budget Records</h1>
        <p class="sub">National Irrigation Administration<br>Budget Records Management System</p>
        <a href="/app" class="btn">Open Application</a>
    </div>
</body>
</html>
