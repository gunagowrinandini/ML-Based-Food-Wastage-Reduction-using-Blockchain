const API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Web3 Configuration
// IMPORTANT: Update this address after deploying the contract
const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // Replace with deployed contract address
const CONTRACT_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "ngoAddress", "type": "address" },
            { "internalType": "string", "name": "itemName", "type": "string" }
        ],
        "name": "recordDonation",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "ngoAddress", "type": "address" },
            { "internalType": "string[]", "name": "itemNames", "type": "string[]" }
        ],
        "name": "recordMultipleDonations",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "donationId", "type": "uint256" }],
        "name": "getDonation",
        "outputs": [{
            "components": [
                { "internalType": "uint256", "name": "donationId", "type": "uint256" },
                { "internalType": "address", "name": "donor", "type": "address" },
                { "internalType": "address", "name": "ngoAddress", "type": "address" },
                { "internalType": "string", "name": "itemName", "type": "string" },
                { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
                { "internalType": "bool", "name": "isValid", "type": "bool" }
            ],
            "internalType": "struct FoodDonation.Donation",
            "name": "",
            "type": "tuple"
        }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "ngoAddress", "type": "address" }],
        "name": "getNGODonationCount",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalDonations",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

// Application State
let currentView = 'landingPage';
let selectedProduct = null;
let selectedImageFile = null;
let currentFilter = 'all';
let selectedNGO = null;
let currentTab = 'home'; // Track current top-level tab

// Web3 State
let web3 = null;
let contract = null;
let userAccount = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function () {
    initializeMockData();
    setupEventListeners();
    showTab('home'); // Start with homepage
});

// Initialize mock data
function initializeMockData() {
    // Initialize mock products if not exists
    if (!localStorage.getItem('martProducts')) {
        const mockProducts = [
            { id: 1, barcode: '1234567890', name: 'Fresh Milk', expiryDate: getDateString(5), category: 'Dairy', quantity: 15 },
            { id: 2, barcode: '2345678901', name: 'Whole Wheat Bread', expiryDate: getDateString(3), category: 'Bakery', quantity: 8 },
            { id: 3, barcode: '3456789012', name: 'Organic Eggs', expiryDate: getDateString(7), category: 'Dairy', quantity: 12 },
            { id: 4, barcode: '4567890123', name: 'Fresh Tomatoes', expiryDate: getDateString(2), category: 'Vegetables', quantity: 20 },
            { id: 5, barcode: '5678901234', name: 'Yogurt', expiryDate: getDateString(8), category: 'Dairy', quantity: 10 },
            { id: 6, barcode: '6789012345', name: 'Chicken Breast', expiryDate: getDateString(1), category: 'Meat', quantity: 5 },
            { id: 7, barcode: '7890123456', name: 'Salmon Fillet', expiryDate: getDateString(4), category: 'Seafood', quantity: 4 },
            { id: 8, barcode: '8901234567', name: 'Fresh Spinach', expiryDate: getDateString(6), category: 'Vegetables', quantity: 15 },
            { id: 9, barcode: '9012345678', name: 'Orange Juice', expiryDate: getDateString(9), category: 'Beverages', quantity: 25 },
            { id: 10, barcode: '0123456789', name: 'Cheddar Cheese', expiryDate: getDateString(12), category: 'Dairy', quantity: 7 },
            { id: 11, barcode: '1111111111', name: 'Bananas', expiryDate: getDateString(15), category: 'Fruits', quantity: 30 },
            { id: 12, barcode: '2222222222', name: 'Ground Beef', expiryDate: getDateString(0), category: 'Meat', quantity: 6 },
        ];
        localStorage.setItem('martProducts', JSON.stringify(mockProducts));
    }

    // Always set fresh NGO data with valid addresses (force refresh)
    const correctNgos = [
        { id: 1, name: 'Food for All Foundation', description: 'Serving communities with fresh food donations', location: 'Downtown District', icon: '🍽️', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
        { id: 2, name: 'Community Kitchen Network', description: 'Providing meals to families in need', location: 'East Side', icon: '🥘', address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' },
        { id: 3, name: 'Hope Food Bank', description: 'Distributing food to shelters and community centers', location: 'West End', icon: '📦', address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' },
        { id: 4, name: 'Neighborhood Care', description: 'Local food assistance program', location: 'North Quarter', icon: '❤️', address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' },
    ];

    // Force update NGO data to ensure validity
    localStorage.setItem('ngos', JSON.stringify(correctNgos));

    // Initialize cart if not exists
    if (!localStorage.getItem('donationCart')) {
        localStorage.setItem('donationCart', JSON.stringify([]));
    }
}

// Helper function to get date string (days from today)
function getDateString(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
}

// Tab switching functions
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active state from tab buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
    });

    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    document.getElementById(tabName + 'TabBtn').classList.add('active');
    document.getElementById(tabName + 'TabBtn').setAttribute('aria-selected', 'true');

    currentTab = tabName;

    // If switching to inventory tab, initialize inventory
    if (tabName === 'inventory') {
        displayInventory();
    }

    // If switching to system tab, initialize the system
    if (tabName === 'system') {
        // Only initialize system if it hasn't been initialized yet
        if (!document.querySelector('#landingPage.active')) {
            showView('landingPage');
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Landing page options
    document.getElementById('martOption').addEventListener('click', () => showView('martPage'));
    document.getElementById('partyOption').addEventListener('click', () => showView('partyPage'));

    // Mart Food flow
    document.getElementById('addBarcodeBtn').addEventListener('click', handleBarcodeAdd);
    document.getElementById('barcodeInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleBarcodeAdd();
    });
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            displayProducts();
        });
    });

    // Party Food flow
    document.getElementById('partyImageInput').addEventListener('change', handlePartyImageSelect);
    document.getElementById('analyzePartyButton').addEventListener('click', analyzePartyFood);

    // Cart
    document.getElementById('proceedToNGO').addEventListener('click', () => showView('ngoPage'));

    // Wallet connection
    document.getElementById('connectWalletBtn').addEventListener('click', connectWallet);
    document.getElementById('disconnectWalletBtn').addEventListener('click', disconnectWallet);

    // Check if wallet is already connected
    checkWalletConnection();
}

// View management
function showView(viewName) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(viewName).classList.add('active');
    currentView = viewName;

    // Load view-specific content
    if (viewName === 'martPage') {
        displayProducts();
    } else if (viewName === 'cartPage') {
        displayCart();
    } else if (viewName === 'ngoPage') {
        displayNGOs();
    } else if (viewName === 'transactionPage') {
        displayTransactionDetails();
    }
}

function goBackFromCart() {
    const cart = JSON.parse(localStorage.getItem('donationCart') || '[]');
    if (cart.length === 0) {
        showView('landingPage');
    } else {
        // Determine which flow we came from
        const lastItem = cart[cart.length - 1];
        if (lastItem.source === 'mart') {
            showView('martPage');
        } else {
            showView('partyPage');
        }
    }
}

// Product Management
function displayProducts() {
    const products = JSON.parse(localStorage.getItem('martProducts') || '[]');
    const today = new Date();
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(today.getDate() + 10);

    let filteredProducts = products;
    if (currentFilter === 'expiring') {
        filteredProducts = products.filter(p => {
            const expiryDate = new Date(p.expiryDate);
            return expiryDate >= today && expiryDate <= tenDaysFromNow;
        });
    }

    const productsList = document.getElementById('productsList');
    if (filteredProducts.length === 0) {
        productsList.innerHTML = '<p class="no-products">No products found</p>';
        return;
    }

    productsList.innerHTML = filteredProducts.map(product => {
        const expiryDate = new Date(product.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        const isEligible = daysUntilExpiry > 0 && daysUntilExpiry <= 10;

        return `
            <div class="product-card ${isEligible ? 'eligible' : ''}">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="product-details">Barcode: ${product.barcode} | Category: ${product.category}</p>
                    <p class="product-details">Available Quantity: ${product.quantity || 1}</p>
                    <p class="expiry-info ${daysUntilExpiry <= 3 ? 'urgent' : ''}">
                        Expires: ${product.expiryDate} (${daysUntilExpiry} days)
                    </p>
                </div>
                <button class="select-product-btn" onclick="selectProduct(${product.id})">
                    ${isEligible ? 'Check Eligibility' : 'View Details'}
                </button>
            </div>
        `;
    }).join('');
}

function selectProduct(productId) {
    const products = JSON.parse(localStorage.getItem('martProducts') || '[]');
    selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
        checkExpiryAndEligibility();
    }
}

function handleBarcodeAdd() {
    const barcode = document.getElementById('barcodeInput').value.trim();
    if (!barcode) {
        alert('Please enter a barcode');
        return;
    }

    const products = JSON.parse(localStorage.getItem('martProducts') || '[]');
    const product = products.find(p => p.barcode === barcode);

    if (product) {
        selectProduct(product.id);
        document.getElementById('barcodeInput').value = '';
    } else {
        alert('Product not found. Please check the barcode.');
    }
}

function checkExpiryAndEligibility() {
    if (!selectedProduct) {
        alert('Please select a product first');
        return;
    }

    const today = new Date();
    const expiryDate = new Date(selectedProduct.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    const isEligible = daysUntilExpiry > 0 && daysUntilExpiry <= 10;
    const resultDiv = document.getElementById('martResult');

    if (isEligible) {
        resultDiv.innerHTML = `
            <div class="result-fresh">
                <div class="result-title">✓ Eligible for Donation</div>
                <div class="result-explanation">
                    <p><strong>${selectedProduct.name}</strong> expires in ${daysUntilExpiry} days.</p>
                    <p>Quantity being donated: <strong>${selectedProduct.quantity || 1}</strong></p>
                    <p>This product is eligible for donation!</p>
                    <button class="add-to-cart-btn" onclick="addToCart('mart', '${selectedProduct.name}', ${daysUntilExpiry}, ${selectedProduct.quantity || 1})">
                        Add to Donation Cart
                    </button>
                </div>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="result-rotten">
                <div class="result-title">✗ Not Eligible for Donation</div>
                <div class="result-explanation">
                    <p><strong>${selectedProduct.name}</strong> ${daysUntilExpiry <= 0 ? 'has expired' : `expires in ${daysUntilExpiry} days`}.</p>
                    <p>This product cannot be donated. ${daysUntilExpiry <= 0 ? 'It has already expired.' : 'It is too far from expiry date.'}</p>
                </div>
            </div>
        `;
    }

    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth' });
}

// Party Food Flow
function handlePartyImageSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        selectedImageFile = file;
        document.getElementById('partyUploadText').textContent = file.name;
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('partyImagePreview').src = e.target.result;
            document.getElementById('partyPreviewSection').style.display = 'block';
            document.getElementById('partyResultSection').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

async function analyzePartyFood() {
    if (!selectedImageFile) {
        alert('Please select an image first');
        return;
    }

    document.getElementById('partyPreviewSection').style.display = 'none';
    document.getElementById('partyResultSection').style.display = 'none';
    document.getElementById('partyLoadingSection').style.display = 'block';

    try {
        const base64Image = await fileToBase64(selectedImageFile);
        const result = await analyzeImage(base64Image);
        displayPartyResult(result);
    } catch (error) {
        console.error('Error:', error);
        displayPartyError(error.message);
    } finally {
        document.getElementById('partyLoadingSection').style.display = 'none';
    }
}

async function analyzeImage(base64Image) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.href,
            'X-Title': 'Food Waste Management System'
        },
        body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Analyze this food image and determine if it is fresh and suitable for donation. Consider factors like freshness, appearance, and safety. Respond with "ELIGIBLE" if the food is fresh and safe to donate, or "NOT ELIGIBLE" if it appears rotten, spoiled, or unsafe. Provide a brief explanation.'
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: base64Image
                            }
                        }
                    ]
                }
            ]
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from API');
    }

    return data.choices[0].message.content;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            resolve(e.target.result);
        };
        reader.onerror = function (e) {
            reject(new Error('Failed to read image file'));
        };
        reader.readAsDataURL(file);
    });
}

function displayPartyResult(resultText) {
    const resultSection = document.getElementById('partyResultSection');
    const resultContent = document.getElementById('partyResultContent');

    resultSection.style.display = 'block';

    const lowerResult = resultText.toLowerCase();
    const isEligible = lowerResult.includes('eligible') && !lowerResult.includes('not eligible');

    let resultClass = 'result-rotten';
    let resultTitle = 'Not Eligible ✗';

    if (isEligible) {
        resultClass = 'result-fresh';
        resultTitle = 'Eligible for Donation ✓';
    }

    resultContent.className = resultClass;
    resultContent.innerHTML = `
        <div class="result-title">${resultTitle}</div>
        <div class="result-explanation">${resultText}</div>
        ${isEligible ? `
            <button class="add-to-cart-btn" onclick="addToCart('party', 'Party Food Item', null)">
                Add to Donation Cart
            </button>
        ` : ''}
    `;

    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function displayPartyError(errorMessage) {
    const resultSection = document.getElementById('partyResultSection');
    const resultContent = document.getElementById('partyResultContent');

    resultSection.style.display = 'block';
    resultContent.className = 'result-error';
    resultContent.innerHTML = `
        <div class="result-title">Error</div>
        <div class="result-explanation">${errorMessage}</div>
    `;

    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Cart Management
function addToCart(source, itemName, daysUntilExpiry) {
    const cart = JSON.parse(localStorage.getItem('donationCart') || '[]');
    const cartItem = {
        id: Date.now(),
        source: source,
        name: itemName,
        daysUntilExpiry: daysUntilExpiry,
        quantity: arguments[3] || 1,
        addedAt: new Date().toISOString()
    };
    cart.push(cartItem);
    localStorage.setItem('donationCart', JSON.stringify(cart));

    alert(`${itemName} added to donation cart!`);
    showView('cartPage');
}

function displayCart() {
    const cart = JSON.parse(localStorage.getItem('donationCart') || '[]');
    const cartItemsDiv = document.getElementById('cartItems');
    const emptyCartDiv = document.getElementById('emptyCart');
    const cartActionsDiv = document.getElementById('cartActions');

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '';
        emptyCartDiv.style.display = 'block';
        cartActionsDiv.style.display = 'none';
        return;
    }

    emptyCartDiv.style.display = 'none';
    cartActionsDiv.style.display = 'block';

    cartItemsDiv.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <p>Quantity: <strong>${item.quantity || 1}</strong></p>
                <p>Source: ${item.source === 'mart' ? 'Mart Food' : 'Wedding/Party Food'}</p>
                ${item.daysUntilExpiry !== null ? `<p>Expires in: ${item.daysUntilExpiry} days</p>` : ''}
            </div>
            <button class="remove-item-btn" onclick="removeFromCart(${index})">Remove</button>
        </div>
    `).join('');
}

function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem('donationCart') || '[]');
    cart.splice(index, 1);
    localStorage.setItem('donationCart', JSON.stringify(cart));
    displayCart();
}

// NGO Selection
function displayNGOs() {
    const ngos = JSON.parse(localStorage.getItem('ngos') || '[]');
    const ngoListDiv = document.getElementById('ngoList');

    ngoListDiv.innerHTML = ngos.map(ngo => `
        <div class="ngo-card" onclick="selectNGO(${ngo.id})">
            <div class="ngo-icon">${ngo.icon}</div>
            <div class="ngo-info">
                <h3>${ngo.name}</h3>
                <p>${ngo.description}</p>
                <p class="ngo-location">📍 ${ngo.location}</p>
            </div>
            <button class="select-ngo-btn">Select</button>
        </div>
    `).join('');
}

function selectNGO(ngoId) {
    const ngos = JSON.parse(localStorage.getItem('ngos') || '[]');
    selectedNGO = ngos.find(n => n.id === ngoId);
    if (selectedNGO) {
        showView('transactionPage');
        displayTransactionDetails();
    }
}

// Web3 Wallet Connection
async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await initializeWeb3(accounts[0]);
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    }
}

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('MetaMask is not installed. Please install MetaMask to continue.');
        window.open('https://metamask.io/', '_blank');
        return;
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
            await initializeWeb3(accounts[0]);
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        if (error.code === 4001) {
            alert('Please connect to MetaMask to proceed with the donation.');
        } else {
            alert('Error connecting wallet: ' + error.message);
        }
    }
}

async function initializeWeb3(account) {
    try {
        web3 = new Web3(window.ethereum);
        userAccount = account;

        // Get network name
        const chainId = await web3.eth.getChainId();
        const networkNames = {
            1: 'Ethereum Mainnet',
            5: 'Goerli Testnet',
            11155111: 'Sepolia Testnet',
            1337: 'Local Network'
        };
        const networkName = networkNames[chainId] || `Network ${chainId}`;

        // Initialize contract if address is set
        if (CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
            contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        }

        // Update UI
        document.getElementById('walletStatus').style.display = 'none';
        document.getElementById('walletInfo').style.display = 'block';
        document.getElementById('walletAddress').textContent = `${account.substring(0, 6)}...${account.substring(38)}`;
        document.getElementById('walletNetwork').textContent = networkName;

        // Show transaction details if on transaction page
        if (currentView === 'transactionPage') {
            displayTransactionDetails();
        }

        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());
    } catch (error) {
        console.error('Error initializing Web3:', error);
        alert('Error initializing Web3: ' + error.message);
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        disconnectWallet();
    } else {
        initializeWeb3(accounts[0]);
    }
}

function disconnectWallet() {
    web3 = null;
    contract = null;
    userAccount = null;
    document.getElementById('walletStatus').style.display = 'block';
    document.getElementById('walletInfo').style.display = 'none';
}

function displayTransactionDetails() {
    const cart = JSON.parse(localStorage.getItem('donationCart') || '[]');
    const transactionDetails = document.getElementById('transactionDetails');

    if (!selectedNGO || cart.length === 0) {
        return;
    }

    // Only show transaction details if wallet is connected
    if (userAccount) {
        transactionDetails.innerHTML = `
            <div class="detail-item">
                <strong>Items:</strong> ${cart.length} item(s)
            </div>
            <div class="detail-item">
                <strong>NGO:</strong> ${selectedNGO.name}
            </div>
            <div class="detail-item">
                <strong>NGO Address:</strong> ${selectedNGO.address || 'Not set'}
            </div>
            <div class="detail-item">
                <strong>Timestamp:</strong> ${new Date().toLocaleString()}
            </div>
            <div class="detail-item">
                <strong>Your Address:</strong> ${userAccount.substring(0, 6)}...${userAccount.substring(38)}
            </div>
            <button id="executeDonationBtn" class="proceed-button" style="margin-top: 20px; width: 100%;">
                Execute Donation on Blockchain
            </button>
        `;

        transactionDetails.style.display = 'block';
        document.getElementById('executeDonationBtn').addEventListener('click', executeDonation);
    } else {
        transactionDetails.style.display = 'none';
    }
}

async function executeDonation() {
    if (!web3 || !userAccount) {
        alert('Please connect your wallet first');
        return;
    }

    const cart = JSON.parse(localStorage.getItem('donationCart') || '[]');
    if (cart.length === 0) {
        alert('Cart is empty');
        return;
    }

    if (!selectedNGO || !selectedNGO.address) {
        alert('NGO address is not set');
        return;
    }

    // Validate NGO address
    if (!web3.utils.isAddress(selectedNGO.address)) {
        alert('Invalid NGO address. Please check the NGO configuration.');
        return;
    }

    try {
        // Hide wallet section and show progress
        document.getElementById('walletSection').style.display = 'none';
        document.getElementById('transactionProgress').style.display = 'block';
        document.getElementById('transactionError').style.display = 'none';
        document.getElementById('transactionBackBtn').style.display = 'none';

        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const transactionHash = document.getElementById('transactionHash');
        const transactionSuccess = document.getElementById('transactionSuccess');

        // Reset progress
        progressFill.style.width = '0%';
        transactionHash.style.display = 'none';
        transactionSuccess.style.display = 'none';

        // Prepare item names
        const itemNames = cart.map(item => item.name);

        progressText.textContent = 'Preparing transaction...';
        progressFill.style.width = '20%';

        // Simulate blockchain transaction (DEMO MODE)
        progressText.textContent = 'Sending transaction to blockchain...';
        progressFill.style.width = '40%';

        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        progressText.textContent = 'Transaction sent! Waiting for confirmation...';
        progressFill.style.width = '60%';

        // Generate fake transaction hash
        const fakeTxHash = generateFakeTransactionHash();

        // Display transaction hash
        const explorerUrl = `https://etherscan.io/tx/${fakeTxHash}`;
        transactionHash.innerHTML = `
            <p><strong>Transaction Hash:</strong></p>
            <code>${fakeTxHash}</code>
            <a href="${explorerUrl}" target="_blank" class="explorer-link">View on Explorer</a>
        `;
        transactionHash.style.display = 'block';

        // Simulate waiting for confirmation
        progressText.textContent = 'Waiting for block confirmation...';
        progressFill.style.width = '80%';

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Show success
        progressFill.style.width = '100%';
        progressText.textContent = 'Transaction confirmed!';

        setTimeout(() => {
            transactionSuccess.style.display = 'block';
            // Clear cart after successful donation
            localStorage.setItem('donationCart', JSON.stringify([]));
        }, 1000);

    } catch (error) {
        console.error('Transaction error:', error);
        document.getElementById('transactionProgress').style.display = 'none';
        const errorDiv = document.getElementById('transactionError');
        errorDiv.innerHTML = `
            <div class="result-error">
                <div class="result-title">Transaction Failed</div>
                <div class="result-explanation">
                    ${error.message || 'An error occurred while processing the transaction.'}
                    ${error.code === 4001 ? '<p>Transaction was rejected by user.</p>' : ''}
                </div>
            </div>
        `;
        errorDiv.style.display = 'block';
        document.getElementById('transactionBackBtn').style.display = 'block';
    }
}

function generateFakeTransactionHash() {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
}

function getExplorerUrl(txHash) {
    const chainId = web3 ? web3.currentProvider.chainId : null;
    const explorers = {
        1: `https://etherscan.io/tx/${txHash}`,
        5: `https://goerli.etherscan.io/tx/${txHash}`,
        11155111: `https://sepolia.etherscan.io/tx/${txHash}`,
    };
    return explorers[chainId] || `https://etherscan.io/tx/${txHash}`;
}

function resetAndGoHome() {
    // Clear cart
    localStorage.setItem('donationCart', JSON.stringify([]));
    selectedProduct = null;
    selectedImageFile = null;
    selectedNGO = null;

    // Reset views
    document.getElementById('martResult').style.display = 'none';
    document.getElementById('partyPreviewSection').style.display = 'none';
    document.getElementById('partyResultSection').style.display = 'none';
    document.getElementById('transactionHash').style.display = 'none';
    document.getElementById('transactionSuccess').style.display = 'none';
    document.getElementById('transactionError').style.display = 'none';
    document.getElementById('transactionProgress').style.display = 'none';
    document.getElementById('transactionDetails').style.display = 'none';
    document.getElementById('walletSection').style.display = 'block';
    document.getElementById('transactionBackBtn').style.display = 'none';
    document.getElementById('progressFill').style.width = '0%';

    showView('landingPage');
}

// --- Inventory Management Logic ---

// Display inventory items
function displayInventory() {
    const products = JSON.parse(localStorage.getItem('martProducts') || '[]');
    const searchTerm = document.getElementById('inventorySearch').value.toLowerCase();

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.barcode.includes(searchTerm)
    );

    const inventoryList = document.getElementById('inventoryList');
    if (filteredProducts.length === 0) {
        inventoryList.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #666;">No products found in inventory</td></tr>';
        return;
    }

    const today = new Date();
    inventoryList.innerHTML = filteredProducts.map(product => {
        const expiryDate = new Date(product.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        const isExpired = daysUntilExpiry <= 0;
        const isEligible = daysUntilExpiry > 0 && daysUntilExpiry <= 10;

        return `
            <tr>
                <td><strong>${product.name}</strong></td>
                <td><code>${product.barcode}</code></td>
                <td>${product.category}</td>
                <td><strong>${product.quantity || 1}</strong></td>
                <td>${product.expiryDate}</td>
                <td>
                    <span class="status-badge ${isExpired ? 'status-expired' : (isEligible ? 'status-active' : 'status-pending')}">
                        ${isExpired ? 'Expired' : (isEligible ? 'Eligible' : 'Too Fresh')}
                        <br><small>${isExpired ? '' : daysUntilExpiry + ' days'}</small>
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="edit-btn" onclick="editProduct(${product.id})">Edit</button>
                        <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Modal management
function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('modalTitle');
    const editId = document.getElementById('editProductId');

    form.reset();
    modal.classList.add('active');

    if (productId) {
        const products = JSON.parse(localStorage.getItem('martProducts') || '[]');
        const product = products.find(p => p.id === productId);
        if (product) {
            title.textContent = 'Edit Product';
            editId.value = product.id;
            document.getElementById('prodName').value = product.name;
            document.getElementById('prodBarcode').value = product.barcode;
            document.getElementById('prodCategory').value = product.category;
            document.getElementById('prodExpiry').value = product.expiryDate;
            document.getElementById('prodQuantity').value = product.quantity || 1;
        }
    } else {
        title.textContent = 'Add New Product';
        editId.value = '';
    }
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

// CRUD Operations
function handleProductSubmit(event) {
    event.preventDefault();

    const id = document.getElementById('editProductId').value;
    const name = document.getElementById('prodName').value.trim();
    const barcode = document.getElementById('prodBarcode').value.trim();
    const category = document.getElementById('prodCategory').value;
    const expiryDate = document.getElementById('prodExpiry').value;
    const quantity = parseInt(document.getElementById('prodQuantity').value) || 1;

    if (!name || !barcode || !category || !expiryDate) {
        alert('Please fill in all fields');
        return;
    }

    let products = JSON.parse(localStorage.getItem('martProducts') || '[]');

    if (id) {
        // Edit existing product
        const index = products.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            products[index] = { ...products[index], name, barcode, category, expiryDate, quantity };
        }
    } else {
        // Add new product
        const newProduct = {
            id: Date.now(), // Simplified unique ID
            name,
            barcode,
            category,
            expiryDate,
            quantity
        };
        products.push(newProduct);
    }

    localStorage.setItem('martProducts', JSON.stringify(products));
    closeProductModal();
    displayInventory();

    // Also update mart page if products list is visible
    if (currentView === 'martPage') {
        displayProducts();
    }
}

function editProduct(id) {
    openProductModal(id);
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        let products = JSON.parse(localStorage.getItem('martProducts') || '[]');
        products = products.filter(p => p.id !== id);
        localStorage.setItem('martProducts', JSON.stringify(products));
        displayInventory();

        if (currentView === 'martPage') {
            displayProducts();
        }
    }
}
