import { scrapeAllSeasonFixtures } from "./wsl-fixtures-scraper.js";

async function testGeneralFixturesScraper() {
  try {
    console.log("🧪 Testing General Competition Fixtures Scraper");
    console.log("=".repeat(60));

    // Test with just the most recent seasons first
    const options = {
      onlySeasons: ["2024-2025", "2023-2024"], // Adjust based on available seasons
      maxConcurrent: 1, // Be gentle for testing
      saveToFile: true,
    };

    console.log("📋 Test parameters:");
    console.log(`   Seasons: ${options.onlySeasons.join(", ")}`);
    console.log(`   Max concurrent: ${options.maxConcurrent}`);
    console.log();

    console.log("🚀 Starting fixture scraper test...");
    const results = await scrapeAllSeasonFixtures(null, options);

    console.log("\n🎉 TEST COMPLETED!");
    console.log("=".repeat(50));
    console.log("📊 Results:");
    console.log(`   Competition: ${results.competition}`);
    console.log(
      `   Total seasons: ${results.scraping_summary.total_seasons_processed}`
    );
    console.log(
      `   Successful: ${results.scraping_summary.successful_seasons}`
    );
    console.log(`   Failed: ${results.scraping_summary.failed_seasons}`);
    console.log(
      `   Total fixtures: ${results.scraping_summary.total_fixtures_scraped}`
    );
    console.log();

    // Show breakdown by season
    console.log("📋 Season breakdown:");
    results.seasons_fixtures.forEach((season) => {
      const status = season.status === "success" ? "✅" : "❌";
      console.log(
        `   ${status} ${season.season}: ${season.fixtures_count} fixtures`
      );
    });

    console.log();
    console.log("✨ Files saved to data/ folder");
    console.log(
      "💡 The scraper automatically detects the competition from seasons data"
    );

    return results;
  } catch (error) {
    console.error("💥 Test failed:", error.message);
    console.error("Full error:", error);

    console.log("\n💡 Troubleshooting tips:");
    console.log(
      "   • Make sure you ran the seasons scraper first (node run-wsl-scraper.js)"
    );
    console.log("   • Check that seasons data file exists in data/ folder");
    console.log("   • Verify your internet connection");
  }
}

// Run the test
console.log("Starting fixture scraper test...");
testGeneralFixturesScraper();
