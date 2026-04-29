# WSL Fixtures Scraper

A Node.js web scraping project to collect Women's Super League (WSL) fixtures data using Playwright.

## 📋 Prerequisites

- Node.js (v16.0.0 or higher)
- npm (comes with Node.js)

---

# STEP-BY-STEP GUIDE: How to Run the Scraper

## Step 1: Install Dependencies

Open PowerShell and navigate to the project root directory:

```powershell
cd C:\Users\Naufal\OneDrive\Documents\learn_scraping
```

Install the required npm packages:

```powershell
npm install
```

## Step 2: Install Playwright Browsers

Install the browsers needed for web scraping:

```powershell
npx playwright install
```

This will download Chromium, Firefox, and WebKit browsers (~400MB).

## Step 3: Navigate to the Main Directory

**⚠️ CRITICAL:** You MUST run the scraper from inside the `main` directory.

```powershell
cd main
```

Verify you're in the correct directory:

```powershell
pwd
```

**Expected output:** `C:\Users\Naufal\OneDrive\Documents\learn_scraping\main`

## Step 4: Run the Scraper

**⚠️ IMPORTANT:** You must run `all-seasons-scraper.js` first to get the seasons data before running any fixture scrapers.

### First Time Setup: Get Seasons Data

Run this first to scrape Tournament seasons metadata:

```powershell
node run-scraper.js
```

This will create the seasons data file that the fixture scrapers need.

### Then Choose Your Scraping Option:

#### Option A: Test Scraper (Recommended First Run)

Tests with just 2 seasons (~2-3 minutes):

```powershell
node test-fixtures.js
```

#### Option B: Full Scraper (All 10 Seasons)

Scrapes all WSL seasons (~15-25 minutes, ~1,300 fixtures):

```powershell
node scrape-all-fixtures.js
```

## Step 5: Check Your Results

Once complete, check the `data` folder for output files:

```powershell
ls data
```

**Expected files:**

- `[League Name]_all_seasons_fixtures_[date].json` - All fixtures (JSON)
- `[League Name]_all_fixtures_[date].csv` - All fixtures (CSV)
- `[League Name]_fixtures_summary_[date].csv` - Summary statistics
- Individual season JSON and CSV files

---

## 📁 Project Structure

```
learn_scraping/
├── package.json                    # Project configuration and dependencies
├── README.md                       # This file
├── node_modules/                   # Installed dependencies
└── main/                          # Main application directory
    ├── scrape-all-fixtures.js     # Full scraper (all seasons)
    ├── test-fixtures.js           # Test scraper (2 seasons)
    ├── all-fixtures-scraper.js    # Core fixtures scraping logic
    ├── all-seasons-scraper.js     # Seasons data scraper
    ├── run-scraper.js         # WSL scraper runner
    ├── csvConverter.js            # CSV conversion utilities
    └── data/                      # Output directory for scraped data
        ├── *.json                 # JSON data files
        └── *.csv                  # CSV data files
```

## 📊 Output Files

All scraped data is saved in the `main/data/` directory:

## ⏱️ Expected Runtime

- **Test Scraper:** ~2-3 minutes (2 seasons)
- **Full Scraper:** ~15-25 minutes (all 10 seasons)
- **Expected Output:** ~1,300+ fixtures

## 🎯 Features

- ✅ Scrapes all tournament seasons (2014-2015 to 2024-2025)
- ✅ Extracts comprehensive fixture data (dates, teams, scores, venues, etc.)
- ✅ Concurrent scraping (2 seasons at a time) for efficiency
- ✅ Robust error handling and retry logic
- ✅ Automatic file generation (JSON and CSV formats)
- ✅ Progress tracking and detailed logging
- ✅ Summary statistics generation

## 📄 Data Source

FBref URL: https://fbref.com/en/comps

## 📄 License

MIT

## 👤 Author

naksuu24 & Rizal Anditama
