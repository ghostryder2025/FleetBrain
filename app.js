function calculate() {
  let rateInput = document.getElementById("rate").value;
  let milesInput = document.getElementById("miles").value;
  let deadheadInput = document.getElementById("deadhead").value;
  let fuelInput = document.getElementById("fuel").value;
  let mpgInput = document.getElementById("mpg").value;

  let rate = Number(rateInput);
  let miles = Number(milesInput);
  let deadhead = Number(deadheadInput);
  let fuel = Number(fuelInput);
  let mpg = Number(mpgInput);

  let resultElement = document.getElementById("result");
  let ratingElement = document.getElementById("rating");
  let adviceElement = document.getElementById("advice");
  let breakdownElement = document.getElementById("breakdown");

  if (
    rateInput === "" ||
    milesInput === "" ||
    fuelInput === "" ||
    mpgInput === ""
  ) {
    resultElement.innerText = "Please enter all required fields.";
    ratingElement.innerText = "";
    ratingElement.className = "";
    adviceElement.innerText = "";
    breakdownElement.innerText = "";
    return;
  }

  if (rate < 0 || miles < 0 || deadhead < 0 || fuel < 0 || mpg <= 0) {
    resultElement.innerText = "Please enter valid positive numbers. MPG must be greater than 0.";
    ratingElement.innerText = "";
    ratingElement.className = "";
    adviceElement.innerText = "";
    breakdownElement.innerText = "";
    return;
  }

  let totalMiles = miles + deadhead;

  if (totalMiles <= 0) {
    resultElement.innerText = "Total miles must be greater than 0.";
    ratingElement.innerText = "";
    ratingElement.className = "";
    adviceElement.innerText = "";
    breakdownElement.innerText = "";
    return;
  }

  let fuelCost = (totalMiles / mpg) * fuel;
  let profit = rate - fuelCost;
  let profitPerMile = profit / totalMiles;

  resultElement.innerText =
    "Estimated Profit: $" + profit.toFixed(2) +
    "\nProfit Per Mile: $" + profitPerMile.toFixed(2);

  let ratingText = "";

  if (profitPerMile > 2) {
    ratingText = "EXCELLENT LOAD";
    ratingElement.innerText = "FleetBrain Rating: " + ratingText;
    ratingElement.className = "good";
  } else if (profitPerMile > 1.25) {
    ratingText = "AVERAGE LOAD";
    ratingElement.innerText = "FleetBrain Rating: " + ratingText;
    ratingElement.className = "average";
  } else {
    ratingText = "POOR LOAD";
    ratingElement.innerText = "FleetBrain Rating: " + ratingText;
    ratingElement.className = "bad";
  }

  let advice = "";

  if (deadhead > miles * 0.2) {
    advice = "Deadhead miles are high. Try to find loads with less empty driving.";
  } else if (profitPerMile < 1.25) {
    advice = "Profit per mile is low. Consider negotiating a higher rate.";
  } else {
    advice = "This load looks healthy. Profit per mile is within a good range.";
  }

  adviceElement.innerText = "FleetBrain Advice: " + advice;

  breakdownElement.innerText =
    "Total Miles: " + totalMiles.toFixed(0) +
    "\nFuel Cost: $" + fuelCost.toFixed(2) +
    "\nRevenue: $" + rate.toFixed(2) +
    "\nNet Profit: $" + profit.toFixed(2);

  let historyBody = document.getElementById("historyBody");
  let newRow = historyBody.insertRow(0);

  let revenueCell = newRow.insertCell(0);
  let milesCell = newRow.insertCell(1);
  let fuelCell = newRow.insertCell(2);
  let profitCell = newRow.insertCell(3);
  let ratingCell = newRow.insertCell(4);

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

function clearHistory() {
  let historyBody = document.getElementById("historyBody");
  historyBody.innerHTML = "";
}

async function analyzeScreenshot() {
  const fileInput = document.getElementById("imageUpload");
  const statusElement = document.getElementById("ocrStatus");

  if (!fileInput.files || fileInput.files.length === 0) {
    statusElement.innerText = "Please upload a screenshot first.";
    return;
  }

  const file = fileInput.files[0];
  statusElement.innerText = "Reading screenshot... this may take a few seconds.";

  try {
    const { data } = await Tesseract.recognize(file, "eng", {
      logger: (m) => {
        if (m.status) {
          statusElement.innerText =
            m.status + " " + Math.round((m.progress || 0) * 100) + "%";
        }
      }
    });

    const text = data.text || "";
    console.log("OCR TEXT:", text);

    statusElement.innerText = "Screenshot analyzed. Attempting to extract load details...";
    extractLoadData(text);
  } catch (error) {
    console.error(error);
    statusElement.innerText = "Could not analyze screenshot. Try a clearer image.";
  }
}

function extractLoadData(text) {
  const cleanedText = text.replace(/\s+/g, " ").trim();

  const rateMatch = cleanedText.match(/\$?\s?(\d{3,5}(?:,\d{3})?(?:\.\d{2})?)/);
  const milesMatch = cleanedText.match(/(\d{2,5})\s?(?:mi|miles)/i);
  const laneMatch = cleanedText.match(
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s*(?:to|-|→)\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/
  );

  if (rateMatch) {
    const parsedRate = rateMatch[1].replace(/,/g, "");
    document.getElementById("rate").value = parsedRate;
  }

  if (milesMatch) {
    document.getElementById("miles").value = milesMatch[1];
  }

  const statusElement = document.getElementById("ocrStatus");

  if (rateMatch || milesMatch) {
    if (laneMatch) {
      statusElement.innerText =
        "Detected lane: " +
        laneMatch[1] +
        " to " +
        laneMatch[2] +
        ". Review the auto-filled values and click Calculate Profit.";
    } else {
      statusElement.innerText =
        "Text extracted. Review the auto-filled values and click Calculate Profit.";
    }
  } else {
    statusElement.innerText =
      "Screenshot was read, but no clear rate or miles were found. Try a clearer screenshot.";
  }
}