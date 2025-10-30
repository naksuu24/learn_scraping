import { scrapeAllSeasonFixtures } from "./wsl-fixtures-scraper.js";

async function testFixturesScraper() {
  try {
    console.log("🧪 Testing WSL Fixtures Scraper");
    console.log("=".repeat(50));

    // Test with just the most recent seasons first
    const options = {
      onlySeasons: ["2024-2025", "2023-2024"],
      maxConcurrent: 1, // Be gentle for testing
      saveToFile: true,
    };

    console.log("📋 Test parameters:");
    console.log(`   Seasons: ${options.onlySeasons.join(", ")}`);
    console.log(`   Max concurrent: ${options.maxConcurrent}`);

    const results = await scrapeAllSeasonFixtures(null, options);

    console.log("\n🎯 Test Results:");
    console.log(
      `   Total fixtures scraped: ${results.scraping_summary.total_fixtures_scraped}`
    );
    console.log(
      `   Successful seasons: ${results.scraping_summary.successful_seasons}`
    );
    console.log(
      `   Failed seasons: ${results.scraping_summary.failed_seasons}`
    );

    // Show sample fixtures from first season
    const firstSuccessfulSeason = results.seasons_fixtures.find(
      (s) => s.status === "success"
    );
    if (firstSuccessfulSeason && firstSuccessfulSeason.fixtures.length > 0) {
      console.log(`\n📊 Sample fixtures from ${firstSuccessfulSeason.season}:`);
      firstSuccessfulSeason.fixtures.slice(0, 3).forEach((fixture, index) => {
        console.log(
          `   ${index + 1}. ${fixture.date || "TBD"}: ${
            fixture.home_team || "TBD"
          } vs ${fixture.away_team || "TBD"}`
        );
        if (fixture.score) {
          console.log(`      Score: ${fixture.score} (${fixture.status})`);
        }
      });
    }

    return results;
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    throw error;
  }
}

// Run the test
console.log("Starting fixture scraper test...");
testFixturesScraper()
  .then(() => {
    console.log("\n✅ Test completed successfully!");
    console.log("📁 Check the data folder for generated files");
  })
  .catch((error) => {
    console.error("\n💥 Test failed:", error);
    process.exit(1);
  });
