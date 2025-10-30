import {
  scrapeWSLSeasons,
  analyzeWSLPageStructure,
} from "./wsl-seasons-scraper.js";

async function runWSLScraper() {
  try {
    console.log("=".repeat(60));
    console.log("WOMEN'S SUPER LEAGUE SEASONS SCRAPER");
    console.log("=".repeat(60));

    // First analyze the page structure (optional, for debugging)
    // console.log("\n1. Analyzing page structure...");
    // await analyzeWSLPageStructure();

    // Then run the main scraper
    console.log("\n2. Starting main scraping process...");
    const data = await scrapeWSLSeasons();

    console.log("\n3. Scraping completed successfully!");
    console.log(`   - Found ${data.seasons_count} seasons`);
    console.log(`   - Data saved to JSON and CSV files`);
    console.log(`   - Competition: ${data.competition}`);

    return data;
  } catch (error) {
    console.error("\n Scraping failed:", error.message);
    console.error("Full error:", error);
  }
}

// Run the scraper
runWSLScraper();
