<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" type="text/css" href="style.css">
  <title>BJ</title>
</head>
<body>
  <h2>BJ</h2>
  <div id="playerBalance"></div>
  <div id="betContainer">
    <label for="bet">Bet:</label>
    <input id="bet" type="number" value="1" min="0">
  </div>
  <div id="controls">
    <button class="btn" id="playButton">Play</button>
    <button class="btn" id="hitButton" disabled>Hit</button>
    <button class="btn" id="standButton" disabled>Stand</button>
    <button class="btn" id="doubleButton" disabled>Double</button>
    <button class="btn" id="splitButton" disabled>Split</button>
  </div>
  <div id="table">
    <div id="status"></div>
    <div class="hand" id="dealerCards"></div>
    <div id="playerCards"></div>
    <div id="pay"></div>
  </div>
  <script src="script.js"></script>
</body>
</html>