// Get HTML elements
var amount = document.getElementById('amount');
var fromCurrency = document.getElementById('from-currency');
var toCurrency = document.getElementById('to-currency');
var convertBtn = document.getElementById('convert-btn');
var swapBtn = document.getElementById('swap-btn');
var result = document.getElementById('result');
var error = document.getElementById('error');

// List of popular currencies to display (against INR)
const POPULAR_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY'];
const BASE_CURRENCY = 'INR';

// Load currencies when page loads
window.onload = function() {
    loadCurrencies();
    fetchPopularRates();
};

// Convert button click
convertBtn.onclick = function() {
    convertCurrency();
};

// Swap button click
swapBtn.onclick = function() {
    var temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    result.innerHTML = '';
    error.style.display = 'none';
};

// Enter key to convert
amount.onkeypress = function(e) {
    if (e.key === 'Enter') {
        convertCurrency();
    }
};

// Load all currencies
function loadCurrencies() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.frankfurter.app/currencies');
    xhr.onload = function() {
        if (xhr.status === 200) {
            var currencies = JSON.parse(xhr.responseText);
            var currencyList = [];
            
            for (var code in currencies) {
                currencyList.push([code, currencies[code]]);
            }
            currencyList.sort();
            
            fromCurrency.innerHTML = '<option value="">Select currency</option>';
            toCurrency.innerHTML = '<option value="">Select currency</option>';
            
            for (var i = 0; i < currencyList.length; i++) {
                var code = currencyList[i][0];
                var name = currencyList[i][1];
                var option1 = document.createElement('option');
                var option2 = document.createElement('option');
                
                option1.value = code;
                option1.text = code + ' - ' + name;
                option2.value = code;
                option2.text = code + ' - ' + name;
                
                fromCurrency.add(option1);
                toCurrency.add(option2);
            }
            
            fromCurrency.value = 'USD';
            toCurrency.value = 'INR';
        }
    };
    xhr.send();
}

// Fetch and display popular rates
function fetchPopularRates() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `https://api.frankfurter.app/latest?from=${BASE_CURRENCY}`);
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                const data = JSON.parse(xhr.responseText);
                const tableBody = document.querySelector('#rates-table tbody');
                
                if (!tableBody) return;
                
                tableBody.innerHTML = '';
                
                // Update heading
                const heading = document.querySelector('.popular-rates h2');
                if (heading) {
                    heading.textContent = `📊 Popular Rates (1 ${BASE_CURRENCY})`;
                }
                
                POPULAR_CURRENCIES.forEach(currency => {
                    if (data.rates && data.rates[currency]) {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${currency} - ${getCurrencyName(currency)}</td>
                            <td>${data.rates[currency].toFixed(4)}</td>
                        `;
                        tableBody.appendChild(row);
                    }
                });
            } catch (e) {
                console.error('Error processing rates:', e);
            }
        }
    };
    xhr.onerror = function() {
        console.error('Failed to fetch popular rates');
    };
    xhr.send();
}

// Helper function to get full currency name
function getCurrencyName(code) {
    const option = Array.from(fromCurrency.options).find(opt => opt.value === code);
    return option ? option.text.split(' - ')[1] : code;
}

// Convert currency
function convertCurrency() {
    var amountValue = parseFloat(amount.value);
    var from = fromCurrency.value;
    var to = toCurrency.value;
    
    // Check if amount is valid
    if (!amountValue || amountValue <= 0) {
        showError('Please enter a valid amount');
        return;
    }
    
    // Check if currencies are selected
    if (!from || !to) {
        showError('Please select both currencies');
        return;
    }
    
    // If same currency
    if (from === to) {
        result.innerHTML = amountValue.toFixed(2) + ' ' + from + ' = ' + amountValue.toFixed(2) + ' ' + to;
        return;
    }
    
    // Show loading
    convertBtn.disabled = true;
    convertBtn.innerHTML = 'Converting...';
    error.style.display = 'none';
    
    // Make API call
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.frankfurter.app/latest?amount=' + amountValue + '&from=' + from + '&to=' + to);
    xhr.onload = function() {
        convertBtn.disabled = false;
        convertBtn.innerHTML = 'Convert';
        
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            var convertedAmount = data.rates[to];
            result.innerHTML = amountValue.toFixed(2) + ' ' + from + ' = ' + convertedAmount.toFixed(2) + ' ' + to;
        } else {
            showError('Conversion failed. Please try again.');
        }
    };
    xhr.onerror = function() {
        convertBtn.disabled = false;
        convertBtn.innerHTML = 'Convert';
        showError('Conversion failed. Please try again.');
    };
    xhr.send();
}

// Show error message
function showError(message) {
    error.innerHTML = message;
    error.style.display = 'block';
    setTimeout(function() {
        error.style.display = 'none';
    }, 5000);
}

// Auto-refresh popular rates every 5 minutes
setInterval(fetchPopularRates, 5 * 60 * 1000);
