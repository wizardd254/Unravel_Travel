const stockDataDiv = document.getElementById('stockData');
const portfolioDiv = document.getElementById('portfolio');
let totalInvested = 0;
let totalReturns = 0;
let percReturns = 0;
let pricelist={};



const stocks = ['A', 'AAL']; // Array of stock symbols 
async function fetchFinanceData(symbol) {
  const options = {
    method: 'GET',
    url: `https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-summary`,
    params: {
      symbol: symbol,
      region: 'IN'
    },
    headers: {
      'X-RapidAPI-Key': '487eda1fa8msh7a9e5cedeee12bcp137eb0jsn25ff9cf41b02',
      'X-RapidAPI-Host': 'apidojo-yahoo-finance-v1.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    return response.data; // Return the data for use in another function
  } catch (error) {
    console.error(error);
    return null; // Return null if there was an error
  }
}

async function displayAllStockData() {
  for (const symbol of stocks) {
    const data = await fetchFinanceData(symbol);
    if (data) {
      displayData(data, symbol);
    }
  }
}

function displayData(data, symbol) {
  // Create a container div for each stock item
  const stockItemDiv = document.createElement('div');
  stockItemDiv.id = `stock-item-${symbol}`;
  stockItemDiv.classList.add('stock-item'); // Assume 'stock-item' is a class in your CSS

  // Check if the necessary data is available and construct the inner HTML of the stock item
  if (data.price.regularMarketPrice.fmt) {
    const marketPrice = data.price.regularMarketPrice.fmt; // Formatted price
   

    stockItemDiv.innerHTML = `
      <h2>${symbol}</h2>
      <p>Price: ${marketPrice}</p>`;
  } else {
    stockItemDiv.innerHTML = `
      <h2>${symbol}</h2>
      <p>No stock data available.</p>`;
  }

  // Create a button element with a unique id based on the symbol
  const addbutton = document.createElement('button');
  addbutton.id = `add-${symbol}`; // Use a different id than the input element
  addbutton.classList.add('but');
  addbutton.textContent = 'Add To Portfolio';
   // Create saveButton outside the addbutton click event
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save';
  addbutton.addEventListener('click', function () {
    console.log('Hi');
    const marketPrice = data.price.regularMarketPrice.fmt;
    
    saveButton.id = `save-${symbol}`;
    stockItemDiv.innerHTML = `
      <h2>${symbol}</h2>
      <p>Price: ${marketPrice}</p>
      <label for="quantity">Quantity:</label>
      <input type="number" id="quantity" required>
      <label for="price">Purchase Price:</label>
      <input type="number" id="price" step="0.01" required>
    `;
    pricelist[symbol]=marketPrice;
    localStorage.setItem('pricelist', JSON.stringify(pricelist));
    stockItemDiv.appendChild(saveButton);
  });

  saveButton.addEventListener('click', function () {
    console.log('Hi');
    const quantityInput = document.getElementById('quantity');
    const priceInput = document.getElementById('price');
    const quantity = parseInt(quantityInput.value, 10);
    const purchasePrice = parseFloat(priceInput.value);
    const marketPrice = data.price.regularMarketPrice.fmt;
    stockItemDiv.innerHTML = `
      <h2>${symbol}</h2>
      <p>Price: ${marketPrice}</p>
    `;
    stockItemDiv.appendChild(addbutton);
    // Check if quantity and purchase price are provided and are valid numbers
    if (!isNaN(quantity) && !isNaN(purchasePrice)) {
      // Call saveToPortfolio with the entered information
      saveToPortfolio(symbol, quantity, purchasePrice);
    } else {
      alert("Invalid input. Please enter valid quantity and purchase price.");
    }
  });

  stockItemDiv.appendChild(addbutton);
  stockDataDiv.appendChild(stockItemDiv);
}

function saveToPortfolio(symbol, quantity, purchasePrice) {
  // Get the portfolio data from the local storage, or create an empty array if it does not exist
  let portfolioData = JSON.parse(localStorage.getItem('portfolio')) || [];
  
  // Create an object to represent the new entry
  const newEntry = {
    symbol: symbol,
    quantity: quantity,
    purchasePrice: purchasePrice,
  };

  // Add the new entry to the portfolio data
  portfolioData.push(newEntry);

  // Save the updated portfolio data back to the local storage
  localStorage.setItem('portfolio', JSON.stringify(portfolioData));

}
function updateDisplayValues() {
    totalInvested=totalInvested.toFixed(2);
    totalReturns=totalReturns.toFixed(2);
    percReturns=(totalReturns/totalInvested)*100
    document.getElementById('return').innerHTML = `$ ${totalInvested}`;
    document.getElementById('avg').innerHTML = `$ ${totalReturns}`;
    if(totalInvested>0){
    document.getElementById('perc').innerHTML=`${percReturns.toFixed(2)}%`;
    }
    else{
        document.getElementById('perc').innerHTML=`0%`;
    }
    localStorage.setItem('totalInvested', totalInvested);
  localStorage.setItem('totalReturns', totalReturns);

}

// Load the portfolio data when the page loads
async function loadPortfolio() {
    //calculating again
    totalInvested = 0;
    totalReturns = 0;

  // Get the portfolio data from the local storage, or create an empty array if it does not exist
  let portfolioData = JSON.parse(localStorage.getItem('portfolio')) || [];
  const pricelist = JSON.parse(localStorage.getItem('pricelist'));

  //await Promise.all(portfolioData.map(item => fetchFinanceData(item.symbol)));

  // Loop through the portfolio data and fetch the stock data for each symbol
  for (let portfolioItem of portfolioData) {
    totalInvested += portfolioItem.purchasePrice * portfolioItem.quantity;
   
        if (pricelist[portfolioItem.symbol]) {
            totalReturns += (pricelist[portfolioItem.symbol] * portfolioItem.quantity) - (portfolioItem.purchasePrice * portfolioItem.quantity);
        }
    const { symbol,quantity, purchasePrice } = portfolioItem;
    if (symbol) {
      displayData1(symbol, quantity, purchasePrice);
    }
  }
  updateDisplayValues(); 
}

function removeFromPortfolio(symbol) {
    // Get the portfolio data from the local storage
    let portfolioData = JSON.parse(localStorage.getItem('portfolio')) || [];
    const pricelist = JSON.parse(localStorage.getItem('pricelist'));
    // Find the index of the portfolio item with the matching symbol
    const index = portfolioData.findIndex(item => item.symbol === symbol);
  
    if (index !== -1) {
      // Remove the item from the portfolio data
      let removedItem = portfolioData[index];
      totalInvested -= removedItem.purchasePrice * removedItem.quantity;
      totalReturns -= (pricelist[removedItem.symbol] * removedItem.quantity) - (removedItem.purchasePrice * removedItem.quantity);
      updateDisplayValues(); 
      portfolioData.splice(index, 1);
      
      // Save the updated portfolio data back to the local storage
      localStorage.setItem('portfolio', JSON.stringify(portfolioData));
      const elementToRemove = document.getElementById(`stock-item-${symbol}`);
      if (elementToRemove) {
          elementToRemove.remove();
      }
    } else {
      console.log(`Symbol ${symbol} not found in the portfolio.`);
    }
  }
  


async function displayData1(symbol, quantity, purchasePrice) {
  // Create a container div for each stock item
  const stockItemDiv1 = document.createElement('div');
  stockItemDiv1.classList.add('stock-item'); // Assume 'stock-item' is a class in your CSS
  const data = await fetchFinanceData(symbol);
  // Check if the necessary data is available and construct the inner HTML of the stock item
  if (data.price.regularMarketPrice.fmt) {
    const marketPrice = data.price.regularMarketPrice.fmt; // Formatted price
    stockItemDiv1.innerHTML = `
      <h2>${symbol}</h2>
      <p>Price: ${marketPrice}</p>
      <p>Quantity: ${quantity}</p>
      <p>Purchase Price: ${purchasePrice}</p>`;
    
    // Create a button element to remove from portfolio
    const removeButton = document.createElement('button');
    removeButton.classList.add('but');
    removeButton.textContent = 'Remove From Portfolio';
    removeButton.addEventListener('click', function () {
      removeFromPortfolio(symbol);
    });

    stockItemDiv1.appendChild(removeButton);
    portfolioDiv.appendChild(stockItemDiv1);
  } else {
    stockItemDiv1.innerHTML = `
      <h2>${symbol}</h2>
      <p>No stock data available.</p>`;
    
    portfolioDiv.appendChild(stockItemDiv1);
  }
}

// Conditionally call displayAllStockData only for index(1).html
displayAllStockData();

// Call the loadPortfolio function to load the portfolio data in the portfolio.html page
if (window.location.pathname.includes('/portfolio')) {
  loadPortfolio();
}
