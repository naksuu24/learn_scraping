import { chromium } from "playwright";
import fs from "fs";
import { convertToCSV } from "./csvConverter.js";

// Function to scrape Women's Super League seasons history
async function scrapeWSLSeasons() {
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  let jsonData = null;

  try {
    const url =
      "https://fbref.com/en/comps/189/history/Womens-Super-League-Seasons";
    console.log("Navigating to Women's Super League seasons history page...");

    // Add retry logic for page navigation (same as read_all_leagues)
    let retries = 3;
    while (retries > 0) {
      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded", // More lenient than networkidle
          timeout: 180000, // 3 minutes timeout
        });
        break; // If successful, break the retry loop
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error; // If all retries failed, throw the error
        }
        console.log(
          `Navigation failed, retrying... (${retries} attempts remaining)`
        );
        await page.waitForTimeout(5000); // Wait 5 seconds before retrying
      }
    }

    console.log("Waiting for page to load...");
    try {
      // Try to wait for either network idle or DOM content loaded (same as read_all_leagues)
      await Promise.race([
        page.waitForLoadState("networkidle", { timeout: 30000 }),
        page.waitForLoadState("domcontentloaded", { timeout: 30000 }),
      ]);
      console.log("Page loaded successfully");
    } catch (error) {
      console.warn(
        "Timeout while waiting for page load, continuing anyway:",
        error.message
      );
    }

    // Add a fixed wait for dynamic content to load
    await page.waitForTimeout(10000);

    // Wait for table to be available with multiple selector attempts
    console.log("Looking for seasons table...");
    try {
      await page.waitForSelector("table#seasons", { timeout: 30000 });
      console.log('Found seasons table with ID "seasons"');
    } catch (error) {
      console.warn(
        'Table with ID "seasons" not found, trying alternative selectors...'
      );
      try {
        await page.waitForSelector("table", { timeout: 15000 });
        console.log("Found generic table element");
      } catch (error) {
        console.warn(
          "No table elements found, will attempt to analyze page structure"
        );
      }
    }

    // Analyze page structure before scraping (similar to read_all_leagues debugging)
    console.log("Analyzing page structure...");
    const pageStructure = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll("table")).map(
        (table) => ({
          id: table.id,
          className: table.className,
          caption: table.querySelector("caption")?.textContent?.trim(),
          headers: Array.from(table.querySelectorAll("thead th")).map((th) =>
            th.textContent.trim()
          ),
          bodyRowCount: table.querySelectorAll("tbody tr").length,
        })
      );

      const pageInfo = {
        title: document.title,
        url: window.location.href,
        tablesFound: tables.length,
        tables: tables,
      };

      return pageInfo;
    });

    console.log("Page Structure Analysis:");
    console.log(JSON.stringify(pageStructure, null, 2));

    // Extract seasons data with comprehensive error handling
    const seasonsData = await page.evaluate(() => {
      const data = [];

      // Debug logging
      console.log("Starting data extraction...");
      console.log("Current page:", document.title);
      console.log("URL:", window.location.href);

      // Try multiple table selectors (inspired by read_all_leagues flexibility)
      let seasonsTable =
        document.querySelector("table#seasons") ||
        document.querySelector("table.stats_table") ||
        document.querySelector('table[data-name*="season"]') ||
        document.querySelector("table");

      if (!seasonsTable) {
        console.error("No seasons table found with any selector");
        return data;
      }

      console.log(
        "Found table:",
        seasonsTable.id || seasonsTable.className || "unnamed table"
      );

      // Get the headers with data-stat attributes for better mapping
      const headers = Array.from(seasonsTable.querySelectorAll("thead th")).map(
        (th) => ({
          text: th.textContent.trim(),
          dataStat: th.getAttribute("data-stat"),
          index: Array.from(th.parentNode.children).indexOf(th),
        })
      );

      console.log("Headers found:", headers);

      // Get all data rows, excluding header rows
      const rows = seasonsTable.querySelectorAll("tbody tr:not(.thead)");
      console.log(`Found ${rows.length} data rows`);

      rows.forEach((row, rowIndex) => {
        // Skip header rows that might be in tbody
        if (row.classList.contains("thead")) {
          console.log(`Skipping header row ${rowIndex}`);
          return;
        }

        const rowData = {};
        const cells = row.querySelectorAll("th, td");

        console.log(`Processing row ${rowIndex} with ${cells.length} cells`);

        cells.forEach((cell, cellIndex) => {
          if (cellIndex >= headers.length) return;

          const header = headers[cellIndex];
          const cellText = cell.textContent.trim();
          const dataStat = header.dataStat;

          // Skip empty cells,
          // Instead of skipping, we might want to add null or N/A
          // if (!cellText) return;
          if (!cellText) {
            rowData[fieldName] = null; // or "N/A"
            return;
          }

          // Map data-stat attributes to field names, with fallbacks
          let fieldName;
          if (dataStat) {
            // Use data-stat but map to readable names
            switch (dataStat) {
              case "year_id":
                fieldName = "season";
                break;
              case "league_name":
                fieldName = "competition";
                break;
              case "num_teams":
                fieldName = "squads";
                break;
              case "champ":
                fieldName = "champion";
                break;
              case "top_scorers":
                fieldName = "top_scorer";
                break;
              default:
                fieldName = dataStat;
            }
          } else {
            // Fallback to header text mapping
            const headerText = header.text.toLowerCase();
            switch (headerText) {
              case "season":
                fieldName = "season";
                break;
              case "competition name":
              case "comp":
                fieldName = "competition";
                break;
              case "# squads":
              case "squads":
                fieldName = "squads";
                break;
              case "champion":
                fieldName = "champion";
                break;
              case "top scorer":
              case "top_scorer":
                fieldName = "top_scorer";
                break;
              // I think assists mapping isn't needed -- IGNORE --
              case "most assists":
              case "assists":
                fieldName = "most_assists";
                break;
              default:
                fieldName = headerText
                  .replace(/[\s#]+/g, "_")
                  .replace(/[^a-z0-9_]/g, "");
            }
          }

          // Handle special cases for different data types
          if (fieldName === "squads") {
            const squadCount = parseInt(cellText);
            if (!isNaN(squadCount)) {
              rowData[fieldName] = squadCount;
            }
          } else if (fieldName === "champion") {
            // Handle cases where champion might have additional info (points, etc.)
            const championMatch = cellText.match(/(.+?)(?:\s*[-–]\s*(\d+))?$/);
            if (championMatch) {
              rowData.champion = championMatch[1].trim();
              if (championMatch[2]) {
                rowData.champion_points = parseInt(championMatch[2]);
              }
            } else {
              rowData.champion = cellText;
            }
          } else {
            rowData[fieldName] = cellText;
          }

          // Extract URLs from links
          const link = cell.querySelector("a");
          if (link) {
            rowData[`${fieldName}_url`] = link.href;
          }
        });

        // Only add rows that have essential data (season info)
        if (rowData.season && rowData.season !== "Season") {
          // Add metadata
          rowData.league = "Women's Super League";
          rowData.country = "England";
          rowData.gender = "F";

          data.push(rowData);
          console.log(`Added row ${rowIndex}:`, rowData);
        }
      });

      console.log(`Extracted ${data.length} season records`);
      return data;
    });

    // Create comprehensive data structure
    jsonData = {
      timestamp: new Date().toISOString(),
      source: "fbref.com",
      competition: "Women's Super League",
      country: "England",
      gender: "Women",
      competition_id: "189",
      source_url: url,
      seasons_count: seasonsData.length,
      data_fields: seasonsData.length > 0 ? Object.keys(seasonsData[0]) : [],
      // We dont have the winner for the latest year comp
      // Is there a way to fix it and just add None
      seasons: seasonsData,
      // We actually dont need Metadata
      metadata: {
        scraping_method: "playwright",
        browser: "msedge",
        extraction_date: new Date().toISOString(),
        // page_structure: pageStructure,
      },
    };

    // Save to files with descriptive names
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const jsonFilename = `data/womens_super_league_seasons_${timestamp}.json`;
    const csvFilename = `data/womens_super_league_seasons_${timestamp}.csv`;

    // Ensure data directory exists
    if (!fs.existsSync("data")) {
      fs.mkdirSync("data", { recursive: true });
    }

    // Save JSON file
    fs.writeFileSync(jsonFilename, JSON.stringify(jsonData, null, 2));
    console.log(`\nData has been saved to ${jsonFilename}`);

    // Convert to CSV and save
    try {
        // This Map to CSV is not working 
      const csvContent = convertToCSV(jsonData);
      fs.writeFileSync(csvFilename, csvContent);
      console.log(`Data has been saved to ${csvFilename}`);
    } catch (csvError) {
      console.warn("Failed to create CSV:", csvError.message);

      // Fallback: create simple CSV from seasons data
      if (seasonsData.length > 0) {
        const headers = Object.keys(seasonsData[0]);
        const csvRows = [
          headers.join(","),
          ...seasonsData.map((season) =>
            headers
              .map((header) => {
                const value = season[header] || "";
                // Escape commas and quotes in CSV
                return typeof value === "string" &&
                  (value.includes(",") || value.includes('"'))
                  ? `"${value.replace(/"/g, '""')}"`
                  : value;
              })
              .join(",")
          ),
        ];

        const fallbackCsvFilename = `data/womens_super_league_seasons_simple_${timestamp}.csv`;
        fs.writeFileSync(fallbackCsvFilename, csvRows.join("\n"));
        console.log(`Fallback CSV saved to ${fallbackCsvFilename}`);
      }
    }

    // Display summary
    console.log("\n=== SCRAPING SUMMARY ===");
    console.log(`Competition: ${jsonData.competition}`);
    console.log(`Total seasons found: ${jsonData.seasons_count}`);
    console.log(`Data fields extracted: ${jsonData.data_fields.join(", ")}`);

    if (seasonsData.length > 0) {
      console.log("\n=== SAMPLE DATA ===");
      const sampleSeason = seasonsData[0];
      Object.entries(sampleSeason).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });

      console.log("\n=== RECENT SEASONS ===");
      seasonsData.slice(0, 3).forEach((season) => {
        console.log(
          `${season.season}: Champion - ${
            season.champion || "N/A"
          }, Top Scorer - ${season.top_scorer || "N/A"}`
        );
      });
    }
  } catch (error) {
    console.error("An error occurred during scraping:", error);

    // Save error information for debugging
    const errorData = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      url: "https://fbref.com/en/comps/189/history/Womens-Super-League-Seasons",
      scraping_attempt: "womens_super_league_seasons",
    };

    fs.writeFileSync(
      `data/error_log_${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
      JSON.stringify(errorData, null, 2)
    );

    throw error;
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }

  return jsonData;
}

// Helper function to analyze page structure (for debugging)
async function analyzeWSLPageStructure() {
  const browser = await chromium.launch({
    headless: false,
    channel: "msedge",
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  try {
    console.log("Analyzing Women's Super League page structure...");

    await page.goto(
      "https://fbref.com/en/comps/189/history/Womens-Super-League-Seasons",
      {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      }
    );

    await page.waitForTimeout(5000);

    const structure = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        tables: Array.from(document.querySelectorAll("table")).map(
          (table, index) => ({
            index: index,
            id: table.id,
            className: table.className,
            caption: table.querySelector("caption")?.textContent?.trim(),
            headers: Array.from(table.querySelectorAll("thead th")).map(
              (th) => ({
                text: th.textContent.trim(),
                dataStat: th.getAttribute("data-stat"),
              })
            ),
            sampleRows: Array.from(table.querySelectorAll("tbody tr"))
              .slice(0, 2)
              .map((row) =>
                Array.from(row.querySelectorAll("th, td")).map((cell) =>
                  cell.textContent.trim()
                )
              ),
          })
        ),
        filters: Array.from(document.querySelectorAll(".sr_preset")).map(
          (filter) => ({
            text: filter.textContent.trim(),
            dataHide: filter.getAttribute("data-hide"),
            dataShow: filter.getAttribute("data-show"),
          })
        ),
      };
    });

    console.log("Page Structure:");
    console.log(JSON.stringify(structure, null, 2));

    return structure;
  } catch (error) {
    console.error("Error analyzing page structure:", error);
  } finally {
    await browser.close();
  }
}

// Export functions
export { scrapeWSLSeasons, analyzeWSLPageStructure };

// Run the scraper if this file is executed directly
if (import.meta.url === new URL(process.argv[1], "file://").href) {
  console.log("Starting Women's Super League seasons scraper...");
  scrapeWSLSeasons().catch(console.error);
}
