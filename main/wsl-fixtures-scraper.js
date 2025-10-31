import { chromium } from "playwright";
import fs from "fs";

/**
 * Convert fixtures JSON data to CSV format
 * @param {Object} fixturesData - The fixtures data object
 * @returns {string} CSV content
 */
function convertFixturesToCSV(fixturesData) {
  const csvRows = [];

  // Define CSV headers for fixtures data
  const headers = [
    "season",
    "gameweek",
    "date",
    "day_of_week",
    "start_time",
    "home_team",
    "away_team",
    "home_score",
    "away_score",
    "score",
    "home_xg",
    "away_xg",
    "venue",
    "attendance",
    "referee",
    "status",
    "result",
    "home_team_url",
    "away_team_url",
    "match_report_url",
  ];

  // Add header row
  csvRows.push(headers.join(","));

  // Process each season's fixtures
  if (fixturesData.seasons_fixtures) {
    fixturesData.seasons_fixtures.forEach((seasonData) => {
      if (seasonData.fixtures && seasonData.fixtures.length > 0) {
        seasonData.fixtures.forEach((fixture) => {
          const row = headers.map((header) => {
            let value = "";

            if (header === "season") {
              value = seasonData.season || "";
            } else {
              value = fixture[header] || "";
            }

            // Handle CSV escaping
            if (typeof value === "string") {
              // Escape quotes and wrap in quotes if contains comma or quote
              if (
                value.includes(",") ||
                value.includes('"') ||
                value.includes("\n")
              ) {
                value = `"${value.replace(/"/g, '""')}"`;
              }
            }

            return value;
          });

          csvRows.push(row.join(","));
        });
      }
    });
  }

  return csvRows.join("\n");
}

/**
 * Convert individual season fixtures to CSV
 * @param {Object} seasonData - Single season fixtures data
 * @returns {string} CSV content
 */
function convertSingleSeasonToCSV(seasonData) {
  const csvRows = [];

  // Define CSV headers
  const headers = [
    "gameweek",
    "date",
    "day_of_week",
    "start_time",
    "home_team",
    "away_team",
    "home_score",
    "away_score",
    "score",
    "home_xg",
    "away_xg",
    "venue",
    "attendance",
    "referee",
    "status",
    "result",
    "home_team_url",
    "away_team_url",
    "match_report_url",
  ];

  // Add header row
  csvRows.push(headers.join(","));

  // Process fixtures
  if (seasonData.fixtures && seasonData.fixtures.length > 0) {
    seasonData.fixtures.forEach((fixture) => {
      const row = headers.map((header) => {
        let value = fixture[header] || "";

        // Handle CSV escaping
        if (typeof value === "string") {
          if (
            value.includes(",") ||
            value.includes('"') ||
            value.includes("\n")
          ) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
        }

        return value;
      });

      csvRows.push(row.join(","));
    });
  }

  return csvRows.join("\n");
}

/**
 * Comprehensive Fixtures Scraper for Women's Super League
 * Visits each season URL and scrapes fixtures/scores data
 */

/**
 * Convert a season stats URL to a fixtures URL
 * @param {string} seasonUrl - The season stats URL
 * @param {string} season - The season identifier (e.g., "2024-2025")
 * @returns {string} The fixtures URL
 */
function convertToFixturesUrl(seasonUrl, season) {
  // Handle current season (no year in URL)
  if (
    seasonUrl.includes("/Womens-Super-League-Stats") &&
    !seasonUrl.includes("/20")
  ) {
    return `https://fbref.com/en/comps/189/schedule/Womens-Super-League-Scores-and-Fixtures`;
  }

  // Handle historical seasons
  if (seasonUrl.includes(`/${season}/`)) {
    return seasonUrl.replace(
      `/${season}-Womens-Super-League-Stats`,
      `/schedule/${season}-Womens-Super-League-Scores-and-Fixtures`
    );
  }

  // Fallback construction
  return `https://fbref.com/en/comps/189/${season}/schedule/${season}-Womens-Super-League-Scores-and-Fixtures`;
}

/**
 * Scrape fixtures for a single season
 * @param {Object} browser - Playwright browser instance
 * @param {string} fixturesUrl - URL to the fixtures page
 * @param {string} season - Season identifier
 * @returns {Object} Fixtures data for the season
 */
async function scrapeSingleSeasonFixtures(browser, fixturesUrl, season) {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  try {
    console.log(`\n🔄 Scraping fixtures for ${season}...`);
    console.log(`📍 URL: ${fixturesUrl}`);

    // Robust navigation with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await page.goto(fixturesUrl, {
          waitUntil: "domcontentloaded",
          timeout: 180000, // 3 minutes
        });
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(
            `Failed to navigate to ${fixturesUrl} after 3 attempts: ${error.message}`
          );
        }
        console.log(
          `⚠️  Navigation failed, retrying... (${retries} attempts remaining)`
        );
        await page.waitForTimeout(5000);
      }
    }

    // Flexible page loading
    try {
      await Promise.race([
        page.waitForLoadState("networkidle", { timeout: 30000 }),
        page.waitForLoadState("domcontentloaded", { timeout: 30000 }),
      ]);
      console.log("✅ Page loaded successfully");
    } catch (error) {
      console.warn(
        "⚠️  Timeout while waiting for page load, continuing anyway:",
        error.message
      );
    }

    // Wait for dynamic content
    await page.waitForTimeout(10000);

    // Check if page exists and has content
    const pageExists = await page.evaluate(() => {
      return (
        !document.body.textContent.includes("404") &&
        !document.body.textContent.includes("Page not found") &&
        document.querySelector("table")
      );
    });

    if (!pageExists) {
      console.log(`⚠️  No fixtures data available for ${season}`);
      return {
        season: season,
        fixtures_url: fixturesUrl,
        fixtures_count: 0,
        fixtures: [],
        status: "no_data",
        error: "Page not found or no fixtures available",
      };
    }

    // Analyze page structure
    const pageStructure = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll("table")).map(
        (table, index) => ({
          index: index,
          id: table.id,
          className: table.className,
          caption: table.querySelector("caption")?.textContent?.trim(),
          headers: Array.from(table.querySelectorAll("thead th")).map((th) => ({
            text: th.textContent.trim(),
            dataStat: th.getAttribute("data-stat"),
          })),
          bodyRowCount: table.querySelectorAll("tbody tr:not(.thead)").length,
        })
      );

      return {
        title: document.title,
        url: window.location.href,
        tablesFound: tables.length,
        fixturesTables: tables.filter(
          (t) =>
            t.id.includes("sched") ||
            t.className.includes("fixture") ||
            t.caption?.toLowerCase().includes("fixture") ||
            t.caption?.toLowerCase().includes("schedule") ||
            t.bodyRowCount > 5 // Likely a fixtures table
        ),
      };
    });

    console.log(
      `📊 Found ${pageStructure.tablesFound} tables, ${pageStructure.fixturesTables.length} potential fixtures tables`
    );

    // Extract fixtures data
    const fixturesData = await page.evaluate(() => {
      const fixtures = [];

      // Find the main fixtures table
      let fixturesTable =
        document.querySelector("table#sched_all") ||
        document.querySelector('table[id*="sched"]') ||
        document.querySelector("table.scores") ||
        document.querySelector("table.fixture");

      // Fallback: find table with most rows (likely fixtures)
      if (!fixturesTable) {
        const tables = Array.from(document.querySelectorAll("table"));
        let maxRows = 0;
        tables.forEach((table) => {
          const rows = table.querySelectorAll("tbody tr:not(.thead)").length;
          if (rows > maxRows) {
            maxRows = rows;
            fixturesTable = table;
          }
        });
      }

      if (!fixturesTable) {
        console.error("No fixtures table found");
        return fixtures;
      }

      console.log(
        "Found fixtures table:",
        fixturesTable.id || fixturesTable.className || "unnamed table"
      );

      // Get headers with data-stat mapping
      const headers = Array.from(
        fixturesTable.querySelectorAll("thead th")
      ).map((th) => ({
        text: th.textContent.trim(),
        dataStat: th.getAttribute("data-stat"),
        index: Array.from(th.parentNode.children).indexOf(th),
      }));

      console.log(
        "Headers found:",
        headers.map((h) => `${h.text} (${h.dataStat || "no-stat"})`)
      );

      // Extract fixture rows
      const rows = fixturesTable.querySelectorAll("tbody tr:not(.thead)");
      console.log(`Processing ${rows.length} fixture rows`);

      rows.forEach((row, rowIndex) => {
        // Skip spacer rows or non-fixture rows
        if (
          row.classList.contains("thead") ||
          row.classList.contains("spacer")
        ) {
          return;
        }

        const fixtureData = {};
        const cells = row.querySelectorAll("th, td");

        cells.forEach((cell, cellIndex) => {
          if (cellIndex >= headers.length) return;

          const header = headers[cellIndex];
          const cellText = cell.textContent.trim();

          if (!cellText) return;

          // Map data-stat to field names
          let fieldName;
          if (header.dataStat) {
            switch (header.dataStat) {
              case "date":
              case "game_date":
                fieldName = "date";
                break;
              case "time":
              case "game_time":
                fieldName = "time";
                break;
              case "round":
              case "game_week":
                fieldName = "round";
                break;
              case "dayofweek":
                fieldName = "day_of_week";
                break;
              case "home_team":
              case "squad_a":
                fieldName = "home_team";
                break;
              case "away_team":
              case "squad_b":
                fieldName = "away_team";
                break;
              case "home_score":
              case "score_a":
                fieldName = "home_score";
                break;
              case "away_score":
              case "score_b":
                fieldName = "away_score";
                break;
              case "venue":
                fieldName = "venue";
                break;
              case "attendance":
                fieldName = "attendance";
                break;
              case "referee":
                fieldName = "referee";
                break;
              case "match_report":
                fieldName = "match_report";
                break;
              case "notes":
                fieldName = "notes";
                break;
              default:
                fieldName = header.dataStat;
            }
          } else {
            // Fallback header text mapping
            const headerText = header.text.toLowerCase();
            switch (headerText) {
              case "date":
                fieldName = "date";
                break;
              case "time":
                fieldName = "time";
                break;
              case "round":
              case "wk":
                fieldName = "round";
                break;
              case "day":
                fieldName = "day_of_week";
                break;
              case "home":
                fieldName = "home_team";
                break;
              case "away":
                fieldName = "away_team";
                break;
              case "score":
                fieldName = "score";
                break;
              case "venue":
                fieldName = "venue";
                break;
              case "attendance":
              case "att":
                fieldName = "attendance";
                break;
              case "referee":
                fieldName = "referee";
                break;
              case "match report":
                fieldName = "match_report";
                break;
              case "notes":
                fieldName = "notes";
                break;
              default:
                fieldName = headerText
                  .replace(/[\s]+/g, "_")
                  .replace(/[^a-z0-9_]/g, "");
            }
          }

          // Process different data types
          if (fieldName === "attendance") {
            const attendance = parseInt(cellText.replace(/,/g, ""));
            if (!isNaN(attendance)) {
              fixtureData[fieldName] = attendance;
            } else {
              fixtureData[fieldName] = cellText;
            }
          } else if (fieldName === "score" && cellText.includes("–")) {
            // Split combined score into home/away scores
            const scores = cellText.split("–").map((s) => s.trim());
            if (scores.length === 2) {
              const homeScore = parseInt(scores[0]);
              const awayScore = parseInt(scores[1]);
              if (!isNaN(homeScore) && !isNaN(awayScore)) {
                fixtureData.home_score = homeScore;
                fixtureData.away_score = awayScore;
                fixtureData.score = cellText;
              }
            }
          } else if (fieldName === "home_score" || fieldName === "away_score") {
            const score = parseInt(cellText);
            if (!isNaN(score)) {
              fixtureData[fieldName] = score;
            } else {
              fixtureData[fieldName] = cellText;
            }
          } else {
            fixtureData[fieldName] = cellText;
          }

          // Extract URLs from links
          const link = cell.querySelector("a");
          if (link) {
            fixtureData[`${fieldName}_url`] = link.href;
          }
        });

        // Only add rows with essential fixture data
        if (
          fixtureData.date ||
          fixtureData.home_team ||
          fixtureData.away_team
        ) {
          // Add match status
          if (
            fixtureData.home_score !== undefined &&
            fixtureData.away_score !== undefined
          ) {
            fixtureData.status = "completed";
            if (fixtureData.home_score > fixtureData.away_score) {
              fixtureData.result = "home_win";
            } else if (fixtureData.away_score > fixtureData.home_score) {
              fixtureData.result = "away_win";
            } else {
              fixtureData.result = "draw";
            }
          } else {
            fixtureData.status = "scheduled";
          }

          fixtures.push(fixtureData);
        }
      });

      console.log(`Extracted ${fixtures.length} fixtures`);
      return fixtures;
    });

    await context.close();

    console.log(
      `✅ Successfully scraped ${fixturesData.length} fixtures for ${season}`
    );

    return {
      season: season,
      fixtures_url: fixturesUrl,
      fixtures_count: fixturesData.length,
      fixtures: fixturesData,
      status: "success",
      page_structure: pageStructure,
    };
  } catch (error) {
    await context.close();
    console.error(`❌ Error scraping fixtures for ${season}:`, error.message);

    return {
      season: season,
      fixtures_url: fixturesUrl,
      fixtures_count: 0,
      fixtures: [],
      status: "error",
      error: error.message,
    };
  }
}

/**
 * Main function to scrape all season fixtures
 * @param {string} seasonsDataFile - Path to the seasons JSON file
 * @param {Object} options - Scraping options
 */
async function scrapeAllSeasonFixtures(seasonsDataFile = null, options = {}) {
  const {
    saveToFile = true,
    maxConcurrent = 2, // Don't overwhelm the server
    startFromSeason = null,
    onlySeasons = null, // Array of specific seasons to scrape
  } = options;

  console.log("🚀 Starting Women's Super League Fixtures Scraper");
  console.log("=".repeat(60));

  // Load seasons data
  let seasonsData;
  if (seasonsDataFile && fs.existsSync(seasonsDataFile)) {
    console.log(`📂 Loading seasons data from: ${seasonsDataFile}`);
    seasonsData = JSON.parse(fs.readFileSync(seasonsDataFile, "utf8"));
  } else {
    // Use most recent seasons file
    const dataFiles = fs
      .readdirSync("data")
      .filter(
        (f) => f.includes("womens_super_league_seasons") && f.endsWith(".json")
      );
    if (dataFiles.length === 0) {
      throw new Error(
        "No seasons data file found. Please run the seasons scraper first."
      );
    }

    const latestFile = dataFiles.sort().reverse()[0];
    console.log(`📂 Loading latest seasons data: data/${latestFile}`);
    seasonsData = JSON.parse(fs.readFileSync(`data/${latestFile}`, "utf8"));
  }

  console.log(`📊 Found ${seasonsData.seasons_count} seasons to process`);

  // Filter seasons if requested
  let seasonsToProcess = seasonsData.seasons;
  if (onlySeasons) {
    seasonsToProcess = seasonsToProcess.filter((s) =>
      onlySeasons.includes(s.season)
    );
    console.log(
      `🔍 Filtering to ${
        seasonsToProcess.length
      } specific seasons: ${onlySeasons.join(", ")}`
    );
  }
  if (startFromSeason) {
    const startIndex = seasonsToProcess.findIndex(
      (s) => s.season === startFromSeason
    );
    if (startIndex >= 0) {
      seasonsToProcess = seasonsToProcess.slice(startIndex);
      console.log(
        `🔍 Starting from season ${startFromSeason}, processing ${seasonsToProcess.length} seasons`
      );
    }
  }

  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
  });

  const allFixturesData = [];
  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;

  try {
    // Process seasons in batches to avoid overwhelming the server
    for (let i = 0; i < seasonsToProcess.length; i += maxConcurrent) {
      const batch = seasonsToProcess.slice(i, i + maxConcurrent);
      console.log(
        `\n📦 Processing batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(
          seasonsToProcess.length / maxConcurrent
        )}`
      );
      console.log(`   Seasons: ${batch.map((s) => s.season).join(", ")}`);

      const batchPromises = batch.map((seasonData) => {
        const fixturesUrl = convertToFixturesUrl(
          seasonData.season_url,
          seasonData.season
        );
        return scrapeSingleSeasonFixtures(
          browser,
          fixturesUrl,
          seasonData.season
        );
      });

      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach((result) => {
        allFixturesData.push(result);
        processedCount++;

        if (result.status === "success") {
          successCount++;
          console.log(`✅ ${result.season}: ${result.fixtures_count} fixtures`);
        } else {
          errorCount++;
          console.log(
            `❌ ${result.season}: ${result.error || "Unknown error"}`
          );
        }
      });

      // Wait between batches to be respectful to the server
      if (i + maxConcurrent < seasonsToProcess.length) {
        console.log("⏳ Waiting 10 seconds before next batch...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }

    // Compile comprehensive results
    const totalFixtures = allFixturesData.reduce(
      (sum, season) => sum + season.fixtures_count,
      0
    );

    const compiledData = {
      timestamp: new Date().toISOString(),
      source: "fbref.com",
      competition: "Women's Super League",
      competition_id: "189",
      scraping_summary: {
        total_seasons_processed: processedCount,
        successful_seasons: successCount,
        failed_seasons: errorCount,
        total_fixtures_scraped: totalFixtures,
        processing_options: options,
      },
      seasons_fixtures: allFixturesData,
      metadata: {
        scraping_method: "playwright",
        browser: "msedge",
        extraction_date: new Date().toISOString(),
        max_concurrent: maxConcurrent,
      },
    };

    if (saveToFile) {
      // Save comprehensive data
      const timestamp = new Date().toISOString().split("T")[0];
      const fixturesFilename = `data/wsl_all_seasons_fixtures_${timestamp}.json`; /// --------------------- IMPORTANT ---

      // Ensure data directory exists
      if (!fs.existsSync("data")) {
        fs.mkdirSync("data", { recursive: true });
      }

      fs.writeFileSync(fixturesFilename, JSON.stringify(compiledData, null, 2));
      console.log(`\n💾 All fixtures data saved to: ${fixturesFilename}`);

      // Save comprehensive CSV file with all fixtures
      const mainCsvFilename = `data/wsl_all_fixtures_${timestamp}.csv`;
      const csvContent = convertFixturesToCSV(compiledData);
      fs.writeFileSync(mainCsvFilename, csvContent);
      console.log(`📊 All fixtures CSV saved to: ${mainCsvFilename}`);

    //   // Save individual season files (both JSON and CSV)
    //   allFixturesData.forEach((seasonData) => {
    //     if (seasonData.status === "success" && seasonData.fixtures_count > 0) {
    //       const seasonName = seasonData.season.replace("/", "-");

    //       // Save JSON
    //       const seasonJsonFilename = `data/wsl_fixtures_${seasonName}_${timestamp}.json`;
    //       fs.writeFileSync(
    //         seasonJsonFilename,
    //         JSON.stringify(seasonData, null, 2)
    //       );

    //       // Save CSV
    //       const seasonCsvFilename = `data/wsl_fixtures_${seasonName}_${timestamp}.csv`;
    //       const seasonCsvContent = convertSingleSeasonToCSV(seasonData);
    //       fs.writeFileSync(seasonCsvFilename, seasonCsvContent);
    //       console.log(`📄 ${seasonData.season}: JSON and CSV saved`);
    //     }
    //   });

      // Create CSV summary
      const csvData = [];
      csvData.push("season,fixtures_count,status,fixtures_url");
      allFixturesData.forEach((season) => {
        csvData.push(
          `${season.season},${season.fixtures_count},${season.status},"${season.fixtures_url}"`
        );
      });

      const csvFilename = `data/wsl_fixtures_summary_${timestamp}.csv`;
      fs.writeFileSync(csvFilename, csvData.join("\n"));
      console.log(`📊 Summary CSV saved to: ${csvFilename}`);
    }

    // Display final summary
    console.log("\n" + "=".repeat(60));
    console.log("🏁 FIXTURES SCRAPING COMPLETED");
    console.log("=".repeat(60));
    console.log(`📊 Total seasons processed: ${processedCount}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`⚽ Total fixtures scraped: ${totalFixtures}`);

    console.log("\n📈 Season breakdown:");
    allFixturesData.forEach((season) => {
      const status = season.status === "success" ? "✅" : "❌";
      console.log(
        `   ${status} ${season.season}: ${season.fixtures_count} fixtures`
      );
    });

    return compiledData;
  } catch (error) {
    console.error("💥 Fatal error during fixtures scraping:", error);
    throw error;
  } finally {
    await browser.close();
    console.log("\n🔒 Browser closed");
  }
}

// Export functions
export {
  scrapeAllSeasonFixtures,
  scrapeSingleSeasonFixtures,
  convertToFixturesUrl,
  convertFixturesToCSV,
  convertSingleSeasonToCSV,
};

// CLI execution
if (import.meta.url === new URL(process.argv[1], "file://").href) {
  const args = process.argv.slice(2);

  let options = {};

  // Parse command line arguments
  if (args.includes("--test")) {
    options.onlySeasons = ["2024-2025", "2023-2024"]; // Test with recent seasons
    console.log("🧪 Test mode: Only scraping recent seasons");
  }

  if (args.includes("--current-only")) {
    options.onlySeasons = ["2025-2026"];
    console.log("📅 Current season only mode");
  }

  const maxConcurrentIndex = args.indexOf("--concurrent");
  if (maxConcurrentIndex >= 0 && args[maxConcurrentIndex + 1]) {
    options.maxConcurrent = parseInt(args[maxConcurrentIndex + 1]);
    console.log(`⚡ Max concurrent: ${options.maxConcurrent}`);
  }

  console.log("🔥 Starting comprehensive fixtures scraper...");

  scrapeAllSeasonFixtures(null, options)
    .then((data) => {
      console.log("\n🎉 All done! Check the data folder for results.");
    })
    .catch((error) => {
      console.error("\n💀 Scraping failed:", error.message);
      process.exit(1);
    });
}
