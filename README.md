# Welcome to Our Laravel Project! 🚀

This guide will help you set up and run this project on your laptop for the first time. Don't worry if you haven't done this before—just follow these steps one by one!

## Prerequisites
Before we begin, make sure you have the following installed on your laptop:
1. **PHP**
2. **Composer** (The package manager for PHP)
3. **Node.js & npm** (For managing frontend assets)
4. **XAMPP or WAMP** (For your local database / MySQL)

---

## Step-by-Step Setup Guide

### Step 1: Open your terminal
Open your terminal (Command Prompt, PowerShell, or Git Bash, or the built-in terminal in VS Code) and navigate to the project folder where you extracted or cloned this code.

### Step 2: Install PHP Dependencies
Run this command to install all the required hidden tools (dependencies) the project needs:
```bash
composer install
```
*(Wait a minute or two for this to finish.)*

### Step 3: Install Frontend Dependencies
Now, install the visual tools needed for the website:
```bash
npm install
```

### Step 4: Set Up the Environment (.env) File
The project needs a configuration file to know your database passwords and settings. We have a starting template named `.env.example`. 
Run this command to copy the template into a new active `.env` file:
```bash
copy .env.example .env
```
*(Note for Mac/Linux users: use `cp .env.example .env` instead).*

### Step 5: Generate an Application Key
Laravel needs a secret key to keep things secure. Run this command to generate it automatically:
```bash
php artisan key:generate
```

### Step 6: Set Up the Database
1. Open XAMPP and start the **MySQL** module.
2. Open your browser and go to `http://localhost/phpmyadmin`.
3. Create a new empty database. Let's name it `my_project_db` (or look at what it's already named in the `.env` file).
4. Now, go back to your code editor, open the `.env` file you created in Step 4, and look for these database lines. Update them to match exactly this:
   ```text
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=my_project_db   <-- Change this to the database name you created
   DB_USERNAME=root            <-- Default XAMPP username is 'root'
   DB_PASSWORD=                <-- Leave this blank for default XAMPP
   ```

### Step 7: Run Migrations and Seeders (Create Tables and Demo Users)
This step creates all database tables **and** the demo accounts used on the login screen.

```bash
php artisan migrate --seed
```

If you already ran `migrate` without `--seed`, run:

```bash
php artisan db:seed
```

**Demo accounts** (password for both is `password`):

- **Admin:** `admin@nia.gov.ph`
- **Encoder:** `encoder@nia.gov.ph`

Re-running `php artisan db:seed` updates those users again (useful if login fails because an old password was set). Your `.env` `DB_*` values must point at the same database the app uses.

If login still fails, check `APP_URL` matches how you open the app (for example `http://127.0.0.1:8000`), and that cookies are not blocked.

### Performance tuning (optional)

- **`LOCAL_PERF_LOG`**: In `.env`, set `LOCAL_PERF_LOG=true` while `APP_ENV=local` to write **duration, query count, and slow queries** to the application log (`storage/logs`). Turn this off when you are done profiling.
- **`SESSION_DRIVER`** / **`CACHE_STORE`**: Defaults use the **database**, which adds queries on each request. For local troubleshooting you can try `SESSION_DRIVER=file` (ensure `storage/framework/sessions` is writable) to see if latency improves—verify login still works before deploying any change.

### Step 8: Build the Frontend
To compile all the CSS and JavaScript so the project looks nice, run:
```bash
npm run dev
```

### Step 9: Start the Server!
Leave the terminal from Step 8 running. Open a **new, separate terminal window**, make sure you are in the project folder, and run:
```bash
php artisan serve
```

### Step 10: View the Website! 🎉
The terminal in Step 9 will give you a link (usually `http://127.0.0.1:8000`). Hold `Ctrl` and click that link, or copy-paste it into your Google Chrome. 

You should now see the project running locally! If you get stuck at any point, ask me in our group chat!
