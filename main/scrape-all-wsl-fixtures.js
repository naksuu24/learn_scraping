import { scrapeAllSeasonFixtures } from "./wsl-fixtures-scraper.js";

console.log("🚀 Starting COMPLETE WSL Fixtures Scraper");
console.log(
  "🎯 This will scrape ALL 10 seasons of Women's Super League fixtures"
);
console.log("⏰ Estimated time: 15-25 minutes");
console.log("📊 Expected output: ~1,300+ fixtures");
console.log("");

// Run with optimal settings for full scrape
const options = {
  maxConcurrent: 2, // Process 2 seasons simultaneously
  saveToFile: true,
};

scrapeAllSeasonFixtures(null, options)
  .then((results) => {
    console.log("\n🎉 COMPLETE SUCCESS!");
    console.log("=".repeat(50));
    console.log(`📊 Final Statistics:`);
    console.log(
      `   Total seasons: ${results.scraping_summary.total_seasons_processed}`
    );
    console.log(
      `   Total fixtures: ${results.scraping_summary.total_fixtures_scraped}`
    );
    console.log(
      `   Success rate: ${results.scraping_summary.successful_seasons}/${results.scraping_summary.total_seasons_processed}`
    );
    console.log("");
    console.log("📁 Generated files:");
    console.log(
      `   📄 Main data: wsl_all_seasons_fixtures_${
        new Date().toISOString().split("T")[0]
      }.json`
    );
    console.log(
      `   📄 Summary: wsl_fixtures_summary_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    console.log(`   📄 Individual season files for each successful season`);
    console.log("");
    console.log(
      "🎯 You now have comprehensive fixtures data for the entire WSL history!"
    );
  })
  .catch((error) => {
    console.error("\n💥 Scraping failed:", error.message);
    console.error("Check the error logs in the data folder for details.");
    process.exit(1);
  });
