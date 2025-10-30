# WSL Fixtures Scraper# WSL Fixtures Scraper

A Node.js web scraping project to collect Women's Super League (WSL) fixtures data using Playwright.A Node.js web scraping project to collect Women's Super League (WSL) fixtures data using Playwright.

## 📋 Prerequisites## 📋 Prerequisites

- Node.js (v16.0.0 or higher)- Node.js (v16.0.0 or higher)

- npm (comes with Node.js)- npm (comes with Node.js)

---

# STEP-BY-STEP GUIDE: How to Run the Scraper# STEP-BY-STEP GUIDE: How to Run the Scraper

## Step 1: Install Dependencies## Step 1: Install Dependencies

Open PowerShell and navigate to the project root directory:Open PowerShell and navigate to the project root directory:

`powershell`powershell

cd C:\Users\Naufal\OneDrive\Documents\learn_scrapingcd C:\Users\Naufal\OneDrive\Documents\learn_scraping

````



Install the required npm packages:Install the required npm packages:



```powershell```powershell

npm installnpm install

````

## Step 2: Install Playwright Browsers## Step 2: Install Playwright Browsers

Install the browsers needed for web scraping:Install the browsers needed for web scraping:

`powershell`powershell

npx playwright installnpx playwright install

````



This will download Chromium, Firefox, and WebKit browsers (~400MB).This will download Chromium, Firefox, and WebKit browsers (~400MB).



## Step 3: Navigate to the Main Directory## Step 3: Navigate to the Main Directory



**⚠️ CRITICAL:** You MUST run the scraper from inside the `main` directory.**⚠️ CRITICAL:** You MUST run the scraper from inside the `main` directory.



```powershell```powershell

cd maincd main

````

Verify you're in the correct directory:Verify you're in the correct directory:

`powershell`powershell

pwdpwd

```````



**Expected output:** `C:\Users\Naufal\OneDrive\Documents\learn_scraping\main`**Expected output:** `C:\Users\Naufal\OneDrive\Documents\learn_scraping\main`



## Step 4: Run the Scraper## Step 4: Run the Scraper



**⚠️ IMPORTANT:** You must run `run-wsl-scraper.js` first to get the seasons data before running any fixture scrapers.**⚠️ IMPORTANT:** You must run `run-wsl-scraper.js` first to get the seasons data before running any fixture scrapers.



### First Time Setup: Get Seasons Data### First Time Setup: Get Seasons Data

Run this first to scrape WSL seasons metadata:

```powershellRun this first to scrape WSL seasons metadata:

node run-wsl-scraper.js

``````powershell

node run-wsl-scraper.js

This will create the seasons data file that the fixture scrapers need.```



### Then Choose Your Scraping Option:This will create the seasons data file that the fixture scrapers need.



#### Option A: Test Scraper (Recommended First Run)### Then Choose Your Scraping Option:

Tests with just 2 seasons (~2-3 minutes):

```powershell### Option A: Test Scraper (Recommended First Run)

node test-fixtures.js

```Tests with just 2 seasons (~2-3 minutes):



#### Option B: Full Scraper (All 10 Seasons)```powershell

Scrapes all WSL seasons (~15-25 minutes, ~1,300 fixtures):node test-fixtures.js

```powershell```

node scrape-all-wsl-fixtures.js

```### Option B: Full Scraper (All 10 Seasons)



## Step 5: Check Your ResultsScrapes all WSL seasons (~15-25 minutes, ~1,300 fixtures):



Once complete, check the `data` folder for output files:```powershell

node scrape-all-wsl-fixtures.js

```powershell```

ls data

```## Step 5: Check Your Results



**Expected files:**Once complete, check the `data` folder for output files:

- `wsl_all_seasons_fixtures_[date].json` - All fixtures (JSON)

- `wsl_all_fixtures_[date].csv` - All fixtures (CSV)```powershell

- `wsl_fixtures_summary_[date].csv` - Summary statisticsls data

- Individual season JSON and CSV files```



---**Expected files:**



## 📁 Project Structure- `wsl_all_seasons_fixtures_[date].json` - All fixtures (JSON)

- `wsl_all_fixtures_[date].csv` - All fixtures (CSV)

```- `wsl_fixtures_summary_[date].csv` - Summary statistics

learn_scraping/- Individual season JSON and CSV files

├── package.json                    # Project configuration and dependencies

├── README.md                       # This file---

├── node_modules/                   # Installed dependencies

└── main/                          # Main application directory# Women's Soccer Data Scraping

    ├── scrape-all-wsl-fixtures.js # Full scraper (all 10 seasons)

    ├── test-fixtures.js           # Test scraper (2 seasons)Learning web scraping techniques and tools for women's soccer data, specifically targeting WSL (Women's Super League).

    ├── wsl-fixtures-scraper.js    # Core fixtures scraping logic

    ├── wsl-seasons-scraper.js     # Seasons data scraper## 🚀 Quick Start - WSL Data via API (RECOMMENDED)

    ├── run-wsl-scraper.js         # WSL scraper runner

    ├── csvConverter.js            # CSV conversion utilities### 1. Get Free API Access

    └── data/                      # Output directory for scraped data

        ├── *.json                 # JSON data files1. Go to [API-Football on RapidAPI](https://rapidapi.com/api-sports/api/api-football)

        └── *.csv                  # CSV data files2. Sign up for free account (100 requests/day)

```3. Subscribe to free plan and get your API key



## 📊 Output Files### 2. Configure API Key



All scraped data is saved in the `main/data/` directory:```bash

# Option 1: Environment variable (Windows)

### Main Output Files:set RAPIDAPI_KEY=your_key_here

- `wsl_all_seasons_fixtures_[date].json` - Complete fixtures data for all seasons

- `wsl_fixtures_summary_[date].csv` - Summary statistics# Option 2: Create .env file

- `wsl_all_fixtures_[date].csv` - All fixtures in CSV formatcopy .env.template .env

# Edit .env and add your key

### Individual Season Files:```

- `wsl_fixtures_[season]_[date].json` - Individual season fixtures (JSON)

- `wsl_fixtures_[season]_[date].csv` - Individual season fixtures (CSV)### 3. Run WSL Scraper



### Seasons Data:```bash

- `womens_super_league_seasons_[date].json` - Seasons metadata# Get current season WSL fixtures and results

- `womens_super_league_seasons_[date].csv` - Seasons data in CSVpython wsl_api_football.py



## ⏱️ Expected Runtime# Save to specific file

python wsl_api_football.py --output wsl_2024_25.csv

- **Test Scraper:** ~2-3 minutes (2 seasons)

- **Full Scraper:** ~15-25 minutes (all 10 seasons)# Save as Parquet

- **Expected Output:** ~1,300+ fixturespython wsl_api_football.py --parquet wsl_data.parquet



## 🎯 Features# Get previous season

python wsl_api_football.py --season 2023

- ✅ Scrapes all 10 WSL seasons (2014-2015 to 2024-2025)```

- ✅ Extracts comprehensive fixture data (dates, teams, scores, venues, etc.)

- ✅ Concurrent scraping (2 seasons at a time) for efficiency## 📁 Available Scripts

- ✅ Robust error handling and retry logic

- ✅ Automatic file generation (JSON and CSV formats)- **`wsl_api_football.py`** - 🏆 Main WSL scraper using API-Football (RapidAPI)

- ✅ Progress tracking and detailed logging- **`comprehensive_womens_api_test.py`** - Test multiple women's soccer APIs

- ✅ Summary statistics generation- **`working_womens_api.py`** - Working example with German women's league

- **`womens_soccer_final_summary.py`** - Complete research summary

## 📄 Data Source

## 🔧 Requirements

FBref URL: https://fbref.com/en/comps/189/2024-2025/schedule/2024-2025-Womens-Super-League-Scores-and-Fixtures

```bash

## 📄 Licensepip install requests pandas beautifulsoup4 python-dotenv

```

MIT

---

## 👤 Author

## 🌐 Alternative: FBref Web Scraping (Node.js)

naksuu24

Original FBref URL: https://fbref.com/en/comps/189/2024-2025/schedule/2024-2025-Womens-Super-League-Scores-and-Fixtures

