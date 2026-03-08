function getEl(id) {
  return document.getElementById(id);
}

function setValue(possibleIds, value) {
  for (const id of possibleIds) {
    const el = getEl(id);
    if (el) {
      el.value = value;
      return true;
    }
  }
  return false;
}

function getValue(possibleIds) {
  for (const id of possibleIds) {
    const el = getEl(id);
    if (el) {
      return el.value;
    }
  }
  return "";
}

function calculate() {
  const rateInput = getValue(["rate"]);
  const milesInput = getValue(["miles", "loadedMiles"]);
  const deadheadInput = getValue(["deadhead"]);
  const fuelInput = getValue(["fuel"]);
  const mpgInput = getValue(["mpg"]);

  const rate = Number(rateInput);
  const miles = Number(milesInput);
  const deadhead = Number(deadheadInput || 0);
  const fuel = Number(fuelInput);
  const mpg = Number(mpgInput);

  const resultElement = getEl("result");
  const ratingElement = getEl("rating");
  const adviceElement = getEl("advice");
  const breakdownElement = getEl("breakdown");

  if (
    rateInput === "" ||
    milesInput === "" ||
    fuelInput === "" ||
    mpgInput === ""
  ) {
    resultElement.innerText = "Please enter all required fields.";
    if (ratingElement) {
      ratingElement.innerText = "";
      ratingElement.className = "";
    }
    if (adviceElement) adviceElement.innerText = "";
    if (breakdownElement) breakdownElement.innerText = "";
    return;
  }

  if (rate < 0 || miles < 0 || deadhead < 0 || fuel < 0 || mpg <= 0) {
    resultElement.innerText =
      "Please enter valid positive numbers. MPG must be greater than 0.";
    if (ratingElement) {
      ratingElement.innerText = "";
      ratingElement.className = "";
    }
    if (adviceElement) adviceElement.innerText = "";
    if (breakdownElement) breakdownElement.innerText = "";
    return;
  }

  const totalMiles = miles + deadhead;

  if (totalMiles <= 0) {
    resultElement.innerText = "Total miles must be greater than 0.";
    if (ratingElement) {
      ratingElement.innerText = "";
      ratingElement.className = "";
    }
    if (adviceElement) adviceElement.innerText = "";
    if (breakdownElement) breakdownElement.innerText = "";
    return;
  }

  const fuelCost = (totalMiles / mpg) * fuel;
  const profit = rate - fuelCost;
  const profitPerMile = profit / totalMiles;

  resultElement.innerText =
    "Estimated Profit: $" + profit.toFixed(2) +
    "\nProfit Per Mile: $" + profitPerMile.toFixed(2);

  let ratingText = "";

  if (profitPerMile > 2) {
    ratingText = "EXCELLENT LOAD";
    if (ratingElement) {
      ratingElement.innerText = "FleetBrain Rating: " + ratingText;
      ratingElement.className = "good";
    }
  } else if (profitPerMile > 1.25) {
    ratingText = "AVERAGE LOAD";
    if (ratingElement) {
      ratingElement.innerText = "FleetBrain Rating: " + ratingText;
      ratingElement.className = "average";
    }
  } else {
    ratingText = "POOR LOAD";
    if (ratingElement) {
      ratingElement.innerText = "FleetBrain Rating: " + ratingText;
      ratingElement.className = "bad";
    }
  }

  let advice = "";

  if (deadhead > miles * 0.2) {
    advice = "Deadhead miles are high. Try to find loads with less empty driving.";
  } else if (profitPerMile < 1.25) {
    advice = "Profit per mile is low. Consider negotiating a higher rate.";
  } else {
    advice = "This load looks healthy. Profit per mile is within a good range.";
  }

  if (adviceElement) {
    adviceElement.innerText = "FleetBrain Advice: " + advice;
  }

  if (breakdownElement) {
    breakdownElement.innerText =
      "Total Miles: " + totalMiles.toFixed(0) +
      "\nFuel Cost: $" + fuelCost.toFixed(2) +
      "\nRevenue: $" + rate.toFixed(2) +
      "\nNet Profit: $" + profit.toFixed(2);
  }

  const historyBody = getEl("historyBody");
  if (historyBody) {
    const newRow = historyBody.insertRow(0);

    const revenueCell = newRow.insertCell(0);
    const milesCell = newRow.insertCell(1);
    const fuelCell = newRow.insertCell(2);
    const profitCell = newRow.insertCell(3);
    const ratingCell = newRow.insertCell(4);

    revenueCell.innerText = "$" + rate.toFixed(2);
    milesCell.innerText = totalMiles.toFixed(0);
    fuelCell.innerText = "$" + fuelCost.toFixed(2);
    profitCell.innerText = "$" + profit.toFixed(2);
    ratingCell.innerText = ratingText;

    if (ratingText === "EXCELLENT LOAD") {
      ratingCell.className = "rating-good";
    } else if (ratingText === "AVERAGE LOAD") {
      ratingCell.className = "rating-average";
    } else {
      ratingCell.className = "rating-bad";
    }

    while (historyBody.rows.length > 5) {
      historyBody.deleteRow(5);
    }
  }
}

function clearHistory() {
  const historyBody = getEl("historyBody");
  if (historyBody) {
    historyBody.innerHTML = "";
  }
}

async function analyzeScreenshot() {
  const fileInput = getEl("imageUpload") || getEl("screenshotInput");
  const statusElement = getEl("ocrStatus");

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    if (statusElement) {
      statusElement.innerText = "Please upload a screenshot first.";
    } else {
      alert("Please upload a screenshot first.");
    }
    return;
  }

  const file = fileInput.files[0];

  if (statusElement) {
    statusElement.innerText = "Reading screenshot... this may take a few seconds.";
  }

  try {
    const result = await Tesseract.recognize(file, "eng", {
      logger: (m) => {
        if (statusElement && m.status) {
          statusElement.innerText =
            m.status + " " + Math.round((m.progress || 0) * 100) + "%";
        }
      }
    });

    const text = result?.data?.text || "";
    console.log("OCR TEXT:", text);

    extractLoadData(text);
  } catch (error) {
    console.error("OCR ERROR:", error);
    if (statusElement) {
      statusElement.innerText =
        "Could not analyze screenshot. Try a clearer screenshot.";
    } else {
      alert("Could not analyze screenshot. Try a clearer screenshot.");
    }
  }
}

function extractLoadData(text) {
  const statusElement = getEl("ocrStatus");
  const cleanedText = text.replace(/\s+/g, " ").trim();
  console.log("CLEANED OCR TEXT:", cleanedText);

  let revenue = null;
  let miles = null;

  // 1. Best-case revenue match: currency values like $3,100 or $3100
  const currencyMatches = [...cleanedText.matchAll(/\$\s?(\d{1,2}(?:,\d{3})+|\d{4,5})(?:\.\d{2})?/g)];
  const revenueCandidates = currencyMatches
    .map(match => Number(match[1].replace(/,/g, "")))
    .filter(value => value >= 500 && value <= 20000);

  if (revenueCandidates.length > 0) {
    revenue = revenueCandidates[0];
  }

  // 2. Best-case miles match: 795 miles, 1087 mi, etc.
  const mileMatches = [...cleanedText.matchAll(/(\d{2,5}(?:,\d{3})?)\s*(?:mi|miles)\b/gi)];
  const mileCandidates = mileMatches
    .map(match => Number(match[1].replace(/,/g, "")))
    .filter(value => value >= 50 && value <= 3500);

  if (mileCandidates.length > 0) {
    miles = mileCandidates[0];
  }

  // 3. If revenue not found, look for larger standalone numbers
  if (!revenue) {
    const allNumbers = [...cleanedText.matchAll(/\b\d{2,6}(?:,\d{3})?\b/g)]
      .map(match => Number(match[0].replace(/,/g, "")));

    const possibleRevenue = allNumbers.filter(value => value >= 1000 && value <= 20000);
    if (possibleRevenue.length > 0) {
      revenue = possibleRevenue[0];
    }
  }

  // 4. If miles not found, look for reasonable medium-size numbers
  if (!miles) {
    const allNumbers = [...cleanedText.matchAll(/\b\d{2,6}(?:,\d{3})?\b/g)]
      .map(match => Number(match[0].replace(/,/g, "")));

    const possibleMiles = allNumbers.filter(value => value >= 200 && value <= 3000);

    // avoid using same number as revenue
    const filteredMiles = possibleMiles.filter(value => value !== revenue);

    if (filteredMiles.length > 0) {
      miles = filteredMiles[0];
    }
  }

  // 5. Try to detect lane text like Dallas, TX to Atlanta, GA
  const laneMatch = cleanedText.match(
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s?[A-Z]{2})\s*(?:to|-|→)\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s?[A-Z]{2})/
  );

  if (revenue) {
    setValue(["rate"], revenue);
  }

  if (miles) {
    setValue(["miles", "loadedMiles"], miles);
  }

  if (statusElement) {
    if (revenue && miles) {
      if (laneMatch) {
        statusElement.innerText =
          "Detected lane: " +
          laneMatch[1] +
          " to " +
          laneMatch[2] +
          ". Auto-filled revenue and miles. Review values and click Calculate Profit.";
      } else {
        statusElement.innerText =
          "Auto-filled revenue and miles. Review values and click Calculate Profit.";
      }
    } else if (revenue || miles) {
      statusElement.innerText =
        "Partially extracted load details. Review the values and fill in anything missing.";
    } else {
      statusElement.innerText =
        "Screenshot was read, but no clear revenue or miles were found. Try a clearer screenshot.";
    }
  }

  console.log("EXTRACTED VALUES:", { revenue, miles });
}