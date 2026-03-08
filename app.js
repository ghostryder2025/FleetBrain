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
    adviceElement.innerText = "";
    breakdownElement.innerText = "";
    return;
  }

  if (rate < 0 || miles < 0 || deadhead < 0 || fuel < 0 || mpg <= 0) {
    resultElement.innerText = "Please enter valid positive numbers. MPG must be greater than 0.";
    ratingElement.innerText = "";
    adviceElement.innerText = "";
    breakdownElement.innerText = "";
    return;
  }

  let totalMiles = miles + deadhead;
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