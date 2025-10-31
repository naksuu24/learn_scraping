import {
  scrapeWSLSeasons,
  analyzeWSLPageStructure,
} from "./all-seasons-scraper.js";
import readline from "readline";

async function getCompetitionUrl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log("🏆 GENERAL FOOTBALL COMPETITION SCRAPER");
    console.log("=".repeat(60));
    console.log("\n📝 Enter the competition history URL from FBref:");
    console.log("Examples:");
    console.log(
      "  • WSL: https://fbref.com/en/comps/189/history/Womens-Super-League-Seasons"
    );
    console.log(
      "  • Premier League: https://fbref.com/en/comps/9/history/Premier-League-Seasons"
    );
    console.log(
      "  • Premiere Ligue: https://fbref.com/en/comps/193/history/Premiere-Ligue-Seasons"
    );
    console.log(
      "  • Bundesliga: https://fbref.com/en/comps/20/history/Bundesliga-Seasons"
    );
    console.log();

    rl.question("🔗 Enter competition URL: ", (url) => {
      rl.close();
      resolve(url.trim());
    });
  });
}

function extractCompetitionInfo(url) {
  try {
    // Extract competition name and ID from URL
    // URL pattern: https://fbref.com/en/comps/{ID}/history/{Name}-Seasons
    const urlParts = url.split("/");
    const competitionId = urlParts[5]; // The ID after /comps/
    const historyPart = urlParts[7]; // The name part like "Premier-League-Seasons"
    const competitionName = historyPart
      .replace("-Seasons", "")
      .replace(/-/g, " ");

    return {
      id: competitionId,
      name: competitionName,
      url: url,
    };
  } catch (error) {
    console.warn(
      "⚠️  Could not extract competition info from URL, using defaults"
    );
    return {
      id: "unknown",
      name: "Unknown Competition",
      url: url,
    };
  }
}

async function runGeneralScraper() {
  try {
    // Get competition URL from user
    const competitionUrl = await getCompetitionUrl();

    if (!competitionUrl) {
      console.error("❌ No URL provided. Exiting...");
      return;
    }

    // Validate URL format
    if (
      !competitionUrl.includes("fbref.com/en/comps/") ||
      !competitionUrl.includes("/history/")
    ) {
      console.error(
        "❌ Invalid URL format. Please use an FBref competition history URL."
      );
      console.error(
        "   Example: https://fbref.com/en/comps/189/history/Womens-Super-League-Seasons"
      );
      return;
    }

    const competitionInfo = extractCompetitionInfo(competitionUrl);

    console.log("\n=".repeat(60));
    console.log(`🏆 SCRAPING: ${competitionInfo.name.toUpperCase()}`);
    console.log("=".repeat(60));
    console.log(`📍 Competition ID: ${competitionInfo.id}`);
    console.log(`🔗 URL: ${competitionUrl}`);

    // Run the scraper with the provided URL
    console.log("\n🚀 Starting scraping process...");
    const data = await scrapeWSLSeasons(competitionUrl, competitionInfo);

    console.log("\n✅ Scraping completed successfully!");
    console.log(`   📊 Found ${data.seasons_count} seasons`);
    console.log(`   💾 Data saved to JSON and CSV files`);
    console.log(`   🏆 Competition: ${data.competition}`);
    console.log(`   📁 Check the 'data' folder for output files`);

    return data;
  } catch (error) {
    console.error("\n💥 Scraping failed:", error.message);
    console.error("Full error:", error);
    console.log("\n💡 Tips:");
    console.log("   • Make sure the URL is correct and accessible");
    console.log("   • Check your internet connection");
    console.log("   • Try a different competition URL");
  }
}

// Run the scraper
runGeneralScraper();
