let apiKey = localStorage.getItem('apiKey');
let paystackPublicKey = '';
let currentDocId = null;

// DOM Elements
const loginModal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const getStartedBtn = document.getElementById('getStartedBtn');
const loginForm = document.getElementById('loginForm');
const generatorSection = document.getElementById('generator');
const cvForm = document.getElementById('cvForm');
const coverForm = document.getElementById('coverForm');
const resultDiv = document.getElementById('result');
const resultContent = document.getElementById('resultContent');

// Show login modal
function showLoginModal() {
    loginModal.style.display = 'flex';
}

// Close modal
if (document.querySelector('.close')) {
    document.querySelector('.close').onclick = () => {
        loginModal.style.display = 'none';
    };
}

if (loginBtn) loginBtn.onclick = showLoginModal;
if (getStartedBtn) getStartedBtn.onclick = showLoginModal;

// Login/Register
loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        apiKey = data.api_key;
        paystackPublicKey = data.paystack_public_key;
        localStorage.setItem('apiKey', apiKey);
        
        loginModal.style.display = 'none';
        generatorSection.style.display = 'block';
        
        // Scroll to generator
        generatorSection.scrollIntoView({ behavior: 'smooth' });
        
        alert('Successfully registered! Your free API key has been saved.');
        
        // Check user status after login
        checkUserStatus();
        
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
};

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const tab = btn.dataset.tab;
        document.getElementById('cv-tab').style.display = tab === 'cv' ? 'block' : 'none';
        document.getElementById('cover-tab').style.display = tab === 'cover' ? 'block' : 'none';
    };
});

// Generate CV
if (cvForm) {
    cvForm.onsubmit = async (e) => {
        e.preventDefault();
        
        if (!apiKey) {
            showLoginModal();
            return;
        }
        
        const data = {
            name: document.getElementById('cvName').value,
            email: document.getElementById('cvEmail').value,
            phone: document.getElementById('cvPhone').value,
            experience: document.getElementById('cvExperience').value,
            education: document.getElementById('cvEducation').value,
            skills: document.getElementById('cvSkills').value,
            template: document.getElementById('cvTemplate').value
        };
        
        await generateDocument('/api/generate-cv', data, 'cv');
    };
}

// Generate Cover Letter
if (coverForm) {
    coverForm.onsubmit = async (e) => {
        e.preventDefault();
        
        if (!apiKey) {
            showLoginModal();
            return;
        }
        
        const data = {
            name: document.getElementById('coverName').value,
            position: document.getElementById('coverPosition').value,
            company: document.getElementById('coverCompany').value,
            experience: document.getElementById('coverExperience').value,
            skills: document.getElementById('coverSkills').value
        };
        
        await generateDocument('/api/generate-cover', data, 'cover');
    };
}

// Generate document function
async function generateDocument(endpoint, data, type) {
    const generateBtn = document.querySelector(`#${type}Form .btn-generate`);
    const originalText = generateBtn.textContent;
    generateBtn.textContent = 'Generating...';
    generateBtn.disabled = true;
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.status === 402 || result.need_upgrade) {
            alert(result.error || 'Please upgrade to continue generating documents.');
            return;
        }
        
        if (result.error) {
            alert('Error: ' + result.error);
            return;
        }
        
        currentDocId = result.cv_id || result.cover_id;
        resultContent.innerHTML = result.content.replace(/\n/g, '<br>');
        
        // Show watermark warning if applicable
        let watermarkWarning = '';
        if (result.has_watermark) {
            watermarkWarning = '<div class="watermark-warning">⚠️ This document will have a watermark when exported. <a href="#" onclick="upgradePrompt()">Upgrade to remove</a></div>';
        }
        
        resultDiv.innerHTML = watermarkWarning + '<div id="resultContent" class="result-content">' + resultContent.innerHTML + '</div>';
        resultDiv.style.display = 'block';
        resultDiv.dataset.hasWatermark = result.has_watermark;
        
        // Reset resultContent reference
        window.resultContent = document.getElementById('resultContent');
        
        // Show remaining info
        if (result.free_remaining !== undefined) {
            alert(`Document generated! You have ${result.free_remaining} free documents remaining.`);
        } else if (result.credits_remaining !== undefined) {
            alert(`Document generated! Credits remaining: $${result.credits_remaining.toFixed(2)} (${Math.floor(result.credits_remaining / 0.10)} documents left)`);
        }
        
        // Refresh status
        checkUserStatus();
        
    } catch (error) {
        alert('Generation failed: ' + error.message);
    } finally {
        generateBtn.textContent = originalText;
        generateBtn.disabled = false;
    }
}

// Check user status and show status bar
async function checkUserStatus() {
    if (!apiKey) return;
    
    try {
        const response = await fetch('/api/user-status', {
            headers: { 'X-API-Key': apiKey }
        });
        
        const status = await response.json();
        
        // Show status bar
        const statusBar = document.createElement('div');
        statusBar.className = 'status-bar';
        
        if (status.plan === 'free') {
            statusBar.innerHTML = `
                <span>⚠️ Free trial: ${status.free_remaining} documents remaining (watermarked)</span>
                <button onclick="upgradePrompt()" class="status-upgrade">Upgrade to Remove Watermark →</button>
            `;
        } else if (status.plan === 'pay_as_you_go') {
            statusBar.innerHTML = `
                <span>💰 Credits: $${status.credits.toFixed(2)} (${status.files_from_credits} documents left)</span>
                <button onclick="initializePaystackPayment('credits')" class="status-upgrade">Buy More Credits →</button>
            `;
        } else if (status.plan === 'subscription') {
            statusBar.innerHTML = `
                <span>✨ Premium Active - No Watermarks! Unlimited Documents</span>
            `;
        }
        
        const existingBar = document.querySelector('.status-bar');
        if (existingBar) existingBar.remove();
        
        const generatorSection = document.querySelector('.generator');
        if (generatorSection) {
            generatorSection.insertBefore(statusBar, generatorSection.firstChild);
        }
        
        // Store paystack key
        if (status.paystack_public_key) {
            paystackPublicKey = status.paystack_public_key;
        }
        
    } catch (error) {
        console.error('Status check failed:', error);
    }
}

// Paystack payment handling
function initializePaystackPayment(paymentType, amount = null) {
    if (!apiKey) {
        showLoginModal();
        return;
    }
    
    if (paymentType === 'credits') {
        const dollarAmount = amount || prompt('How many credits would you like to buy?\n\n$1 = 10 documents\nMinimum $10\n\nEnter amount in USD:', '10');
        
        if (dollarAmount && dollarAmount >= 10) {
            initiatePaystackTransaction('credits', dollarAmount);
        } else if (dollarAmount && dollarAmount < 10) {
            alert('Minimum purchase is $10 (100 documents)');
        }
    } else if (paymentType === 'subscription') {
        const confirmSub = confirm('Subscribe for $1/month?\n\n✓ Unlimited documents\n✓ No watermarks\n✓ Cancel anytime');
        if (confirmSub) {
            initiatePaystackTransaction('subscription');
        }
    }
}

async function initiatePaystackTransaction(type, amount = null) {
    try {
        const response = await fetch('/api/initiate-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify({ 
                type: type, 
                amount: type === 'credits' ? parseFloat(amount) : null 
            })
        });
        
        const result = await response.json();
        
        if (result.authorization_url) {
            // Redirect to Paystack checkout page
            window.location.href = result.authorization_url;
        } else {
            alert('Payment initialization failed: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Payment failed: ' + error.message);
    }
}

// Check payment on callback page (when user returns)
async function checkPaymentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    
    if (reference) {
        try {
            const response = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
                body: JSON.stringify({ reference: reference })
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                alert(result.message);
                // Refresh user status
                checkUserStatus();
                // Remove reference from URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                alert('Payment verification failed: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Verification failed:', error);
        }
    }
}

// Upgrade prompt function
window.upgradePrompt = function() {
    const choice = confirm('Choose upgrade option:\n\nOK - $1/month subscription\nCancel - $0.10 per file (min $10)');
    if (choice) {
        initializePaystackPayment('subscription');
    } else {
        initializePaystackPayment('credits');
    }
};

// Buy more credits function
window.buyMoreCredits = function() {
    initializePaystackPayment('credits');
};

// Plan buttons
document.querySelectorAll('.btn-plan').forEach(btn => {
    btn.onclick = async () => {
        if (!apiKey) {
            showLoginModal();
            return;
        }
        
        const plan = btn.dataset.plan;
        
        if (plan === 'free') {
            alert('Free plan activated! You have 3 free documents to try.');
            return;
        }
        
        if (plan === 'subscription') {
            initializePaystackPayment('subscription');
        } else if (plan === 'pay_as_you_go') {
            initializePaystackPayment('credits');
        }
    };
});

// Export to PDF
if (document.getElementById('exportPDF')) {
    document.getElementById('exportPDF').onclick = async () => {
        if (!currentDocId) return;
        
        // Check if document has watermark
        const hasWatermark = resultDiv.dataset.hasWatermark === 'true';
        
        if (hasWatermark) {
            const confirmExport = confirm('⚠️ This document will have a watermark "Generated by ABSON CV Generator".\n\nUpgrade to $1/month or $0.10/file to remove watermarks.\n\nContinue with watermark?');
            if (!confirmExport) {
                // Offer upgrade
                const upgrade = confirm('Would you like to upgrade to remove watermarks?');
                if (upgrade) {
                    initializePaystackPayment('subscription');
                }
                return;
            }
        }
        
        try {
            const response = await fetch(`/api/export-pdf/${currentDocId}`, {
                headers: { 'X-API-Key': apiKey }
            });
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `document_${currentDocId}.pdf`;
            a.click();
        } catch (error) {
            alert('Export failed: ' + error.message);
        }
    };
}

// Copy to clipboard
if (document.getElementById('copyText')) {
    document.getElementById('copyText').onclick = () => {
        const text = resultContent.innerText;
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };
}

// New document
if (document.getElementById('newDocument')) {
    document.getElementById('newDocument').onclick = () => {
        resultDiv.style.display = 'none';
        currentDocId = null;
        
        // Clear forms
        if (cvForm) cvForm.reset();
        if (coverForm) coverForm.reset();
    };
}

// Call this when page loads
if (apiKey) {
    generatorSection.style.display = 'block';
    checkUserStatus();
    checkPaymentStatus();
}

// Make functions global for HTML onclick handlers
window.initializePaystackPayment = initializePaystackPayment;
window.upgradePrompt = upgradePrompt;
window.buyMoreCredits = buyMoreCredits;
window.checkUserStatus = checkUserStatus;
