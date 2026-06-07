from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import openai
import os
import requests
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO
import json
from datetime import datetime
from functools import wraps
import secrets
import hashlib
import hmac

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))
openai.api_key = os.getenv('OPENAI_API_KEY')

# Paystack Configuration
PAYSTACK_SECRET_KEY = os.getenv('PAYSTACK_SECRET_KEY')
PAYSTACK_PUBLIC_KEY = os.getenv('PAYSTACK_PUBLIC_KEY')
PAYSTACK_BASE_URL = "https://api.paystack.co"

# Pricing plans
PLANS = {
    'free': {
        'monthly_price': 0,
        'per_file_price': 0,
        'has_watermark': True,
        'max_free_files': 3
    },
    'subscription': {
        'monthly_price': 1.00,
        'per_file_price': 0,
        'has_watermark': False,
        'plan_code': 'your_plan_code_here'  # Create this in Paystack Dashboard
    },
    'pay_as_you_go': {
        'monthly_price': 0,
        'per_file_price': 0.10,
        'has_watermark': False,
        'min_purchase': 10  # $10 minimum
    }
}

# User database (use real DB in production)
users = {}
user_credits = {}
generations = {}

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key or api_key not in users:
            return jsonify({'error': 'Invalid API key'}), 401
        request.user = users[api_key]
        return f(*args, **kwargs)
    return decorated_function

def can_generate(user):
    """Check if user can generate a document"""
    plan = user['plan']
    current_month = datetime.now().strftime('%Y-%m')
    
    if plan == 'free':
        if user.get('free_files_used', 0) >= PLANS['free']['max_free_files']:
            return False, "Free limit reached. Please upgrade to continue."
        return True, None
    
    elif plan == 'subscription':
        if user.get('subscription_active', False):
            # Monthly fair usage limit: 100 documents
            if current_month not in user['usage']:
                user['usage'][current_month] = 0
            if user['usage'][current_month] >= 100:
                return False, "Monthly limit reached. Contact support if you need more."
            return True, None
        else:
            return False, "Subscription expired. Please renew."
    
    elif plan == 'pay_as_you_go':
        if user_credits.get(user['email'], 0) >= 0.10:
            return True, None
        else:
            return False, "Insufficient credits. Please purchase more credits."
    
    return False, "Invalid plan"

def deduct_credits(user):
    """Deduct credits for document generation"""
    if user['plan'] == 'pay_as_you_go':
        current_credits = user_credits.get(user['email'], 0)
        user_credits[user['email']] = current_credits - 0.10
        
    elif user['plan'] == 'free':
        user['free_files_used'] = user.get('free_files_used', 0) + 1
        
    elif user['plan'] == 'subscription':
        current_month = datetime.now().strftime('%Y-%m')
        user['usage'][current_month] = user['usage'].get(current_month, 0) + 1

def verify_paystack_signature(request_data, signature):
    """Verify Paystack webhook signature for security"""
    expected_signature = hmac.new(
        PAYSTACK_SECRET_KEY.encode('utf-8'),
        request_data,
        hashlib.sha512
    ).hexdigest()
    return hmac.compare_digest(expected_signature, signature)

@app.route('/')
def serve_frontend():
    return send_file('../frontend/index.html')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    api_key = secrets.token_urlsafe(32)
    
    users[api_key] = {
        'email': data['email'],
        'plan': 'free',
        'free_files_used': 0,
        'subscription_active': False,
        'usage': {},
        'created_at': datetime.now().isoformat()
    }
    
    user_credits[data['email']] = 0
    
    return jsonify({
        'api_key': api_key, 
        'plan': 'free',
        'free_remaining': 3,
        'paystack_public_key': PAYSTACK_PUBLIC_KEY
    })

@app.route('/api/generate-cv', methods=['POST'])
@require_auth
def generate_cv():
    user = request.user
    
    can_gen, message = can_generate(user)
    if not can_gen:
        return jsonify({'error': message, 'need_upgrade': True}), 402
    
    data = request.json
    
    prompt = f"""
    Create a professional CV/resume with the following information:
    Name: {data.get('name')}
    Email: {data.get('email')}
    Phone: {data.get('phone')}
    Experience: {data.get('experience')}
    Education: {data.get('education')}
    Skills: {data.get('skills')}
    Template Style: {data.get('template', 'modern')}
    
    Format the CV professionally with clear sections. Use markdown formatting.
    """
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000
        )
        
        generated_cv = response.choices[0].message.content
        
        deduct_credits(user)
        
        cv_id = secrets.token_urlsafe(16)
        generations[cv_id] = {
            'content': generated_cv, 
            'type': 'cv', 
            'user': user['email'],
            'has_watermark': PLANS[user['plan']]['has_watermark']
        }
        
        response_data = {
            'cv_id': cv_id,
            'content': generated_cv,
            'has_watermark': PLANS[user['plan']]['has_watermark']
        }
        
        if user['plan'] == 'free':
            response_data['free_remaining'] = max(0, 3 - user.get('free_files_used', 0))
        elif user['plan'] == 'pay_as_you_go':
            response_data['credits_remaining'] = user_credits.get(user['email'], 0)
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-cover', methods=['POST'])
@require_auth
def generate_cover():
    user = request.user
    
    can_gen, message = can_generate(user)
    if not can_gen:
        return jsonify({'error': message, 'need_upgrade': True}), 402
    
    data = request.json
    
    prompt = f"""
    Write a professional cover letter for:
    Position: {data.get('position')}
    Company: {data.get('company')}
    Candidate Name: {data.get('name')}
    Experience Summary: {data.get('experience')}
    Key Skills: {data.get('skills')}
    
    Make it persuasive and tailored to the position. Use markdown formatting.
    """
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800
        )
        
        generated_cover = response.choices[0].message.content
        
        deduct_credits(user)
        
        cover_id = secrets.token_urlsafe(16)
        generations[cover_id] = {
            'content': generated_cover, 
            'type': 'cover', 
            'user': user['email'],
            'has_watermark': PLANS[user['plan']]['has_watermark']
        }
        
        response_data = {
            'cover_id': cover_id,
            'content': generated_cover,
            'has_watermark': PLANS[user['plan']]['has_watermark']
        }
        
        if user['plan'] == 'free':
            response_data['free_remaining'] = max(0, 3 - user.get('free_files_used', 0))
        elif user['plan'] == 'pay_as_you_go':
            response_data['credits_remaining'] = user_credits.get(user['email'], 0)
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/initiate-payment', methods=['POST'])
@require_auth
def initiate_payment():
    """Initialize Paystack payment for credits or subscription"""
    user = request.user
    data = request.json
    payment_type = data.get('type')  # 'credits' or 'subscription'
    
    if payment_type == 'credits':
        amount = data.get('amount', 10)  # Amount in dollars
        # Convert to kobo/cents (Paystack uses smallest currency unit)
        amount_in_cents = int(amount * 100)
        
        # Reference for this transaction
        reference = f"PAY-{secrets.token_urlsafe(12)}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Initialize transaction with Paystack
        headers = {
            "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "email": user['email'],
            "amount": amount_in_cents,
            "currency": "USD",
            "reference": reference,
            "metadata": {
                "user_email": user['email'],
                "credit_amount": amount * 10,  # $1 = 10 files
                "payment_type": "credits"
            },
            "callback_url": "https://yourdomain.com/payment-callback"
        }
        
        try:
            response = requests.post(
                f"{PAYSTACK_BASE_URL}/transaction/initialize",
                headers=headers,
                json=payload
            )
            
            result = response.json()
            
            if result['status']:
                return jsonify({
                    'authorization_url': result['data']['authorization_url'],
                    'reference': reference
                })
            else:
                return jsonify({'error': result['message']}), 400
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500
            
    elif payment_type == 'subscription':
        # Create subscription plan in Paystack Dashboard first
        # Then use the plan code
        headers = {
            "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "email": user['email'],
            "plan": PLANS['subscription']['plan_code'],
            "metadata": {
                "user_email": user['email'],
                "plan": "subscription"
            },
            "callback_url": "https://yourdomain.com/subscription-callback"
        }
        
        try:
            response = requests.post(
                f"{PAYSTACK_BASE_URL}/transaction/initialize",
                headers=headers,
                json=payload
            )
            
            result = response.json()
            
            if result['status']:
                return jsonify({
                    'authorization_url': result['data']['authorization_url'],
                    'reference': result['data']['reference']
                })
            else:
                return jsonify({'error': result['message']}), 400
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid payment type'}), 400

@app.route('/api/verify-payment', methods=['POST'])
@require_auth
def verify_payment():
    """Verify payment status with Paystack"""
    data = request.json
    reference = data.get('reference')
    
    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}",
            headers=headers
        )
        
        result = response.json()
        
        if result['status'] and result['data']['status'] == 'success':
            # Payment successful
            metadata = result['data']['metadata']
            
            if metadata.get('payment_type') == 'credits':
                # Add credits to user
                credit_amount = float(metadata.get('credit_amount', 0))
                user_credits[metadata['user_email']] = user_credits.get(metadata['user_email'], 0) + credit_amount
                
                # Update plan if user was free
                for api_key, user_data in users.items():
                    if user_data['email'] == metadata['user_email'] and user_data['plan'] == 'free':
                        user_data['plan'] = 'pay_as_you_go'
                        break
                        
                return jsonify({
                    'status': 'success',
                    'message': f'Added {credit_amount} credits to your account',
                    'credits': user_credits.get(metadata['user_email'], 0)
                })
                
            elif metadata.get('plan') == 'subscription':
                # Activate subscription
                for api_key, user_data in users.items():
                    if user_data['email'] == metadata['user_email']:
                        user_data['plan'] = 'subscription'
                        user_data['subscription_active'] = True
                        break
                        
                return jsonify({
                    'status': 'success',
                    'message': 'Subscription activated! No watermarks on your documents.'
                })
        
        return jsonify({'status': 'failed', 'message': 'Payment verification failed'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/webhook/paystack', methods=['POST'])
def paystack_webhook():
    """Handle Paystack webhook events"""
    signature = request.headers.get('x-paystack-signature')
    raw_body = request.get_data()
    
    # Verify webhook signature for security
    if not verify_paystack_signature(raw_body, signature):
        return jsonify({'error': 'Invalid signature'}), 401
    
    event = request.json
    
    if event['event'] == 'charge.success':
        # Handle successful charge
        data = event['data']
        metadata = data.get('metadata', {})
        
        if metadata.get('payment_type') == 'credits':
            credit_amount = float(metadata.get('credit_amount', 0))
            user_credits[metadata['user_email']] = user_credits.get(metadata['user_email'], 0) + credit_amount
            
            # Update user plan if needed
            for api_key, user in users.items():
                if user['email'] == metadata['user_email'] and user['plan'] == 'free':
                    user['plan'] = 'pay_as_you_go'
                    break
                    
        elif metadata.get('plan') == 'subscription':
            for api_key, user in users.items():
                if user['email'] == metadata['user_email']:
                    user['plan'] = 'subscription'
                    user['subscription_active'] = True
                    break
    
    elif event['event'] == 'subscription.disable':
        # Handle subscription cancellation
        data = event['data']
        email = data.get('email')
        for api_key, user in users.items():
            if user['email'] == email:
                user['subscription_active'] = False
                user['plan'] = 'pay_as_you_go' if user_credits.get(email, 0) > 0 else 'free'
                break
    
    return jsonify({'status': 'success'}), 200

@app.route('/api/export-pdf/<doc_id>', methods=['GET'])
@require_auth
def export_pdf(doc_id):
    if doc_id not in generations:
        return jsonify({'error': 'Document not found'}), 404
    
    doc = generations[doc_id]
    
    # Create PDF with content
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    y = height - 50
    c.setFont("Helvetica", 12)
    
    for line in doc['content'].split('\n'):
        if y < 50:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 12)
        
        if len(line) > 80:
            words = line.split()
            current_line = ""
            for word in words:
                if len(current_line + word) < 80:
                    current_line += word + " "
                else:
                    c.drawString(50, y, current_line)
                    y -= 15
                    current_line = word + " "
            if current_line:
                c.drawString(50, y, current_line)
                y -= 15
        else:
            c.drawString(50, y, line)
            y -= 15
    
    # Add watermark if needed
    if doc['has_watermark']:
        c.saveState()
        c.setFont("Helvetica", 16)
        c.setFillColorRGB(0.5, 0.5, 0.5, alpha=0.3)
        c.translate(width/2, height/2)
        c.rotate(45)
        c.drawCentredString(0, 0, "Generated by ABSON CV Generator")
        c.restoreState()
    
    c.save()
    buffer.seek(0)
    
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"{doc['type']}_{doc_id}.pdf",
        mimetype='application/pdf'
    )

@app.route('/api/user-status', methods=['GET'])
@require_auth
def user_status():
    user = request.user
    credits = user_credits.get(user['email'], 0)
    
    return jsonify({
        'plan': user['plan'],
        'free_files_used': user.get('free_files_used', 0),
        'free_remaining': max(0, 3 - user.get('free_files_used', 0)),
        'credits': credits,
        'files_from_credits': int(credits / 0.10) if credits > 0 else 0,
        'subscription_active': user.get('subscription_active', False),
        'paystack_public_key': PAYSTACK_PUBLIC_KEY
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
