import os
from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_talisman  import Talisman
from flask_cors import CORS, cross_origin
import torch
from PIL import Image
from torchvision import transforms, models
from torchvision.models import resnet101, ResNet101_Weights
import uuid
import logging
from werkzeug.utils import secure_filename
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

UPLOAD_FOLDER = os.environ.get('TEMP_FOLDER', os.path.join(os.path.dirname(__file__), 'tmp'))

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
    
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

app = Flask(__name__, static_folder="./dist", static_url_path="/")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Configure CORS for production
if os.environ.get('FLASK_ENV') == 'development':
    CORS(app)
    app.config['TALISMAN_ENABLED'] = False
else:
    CORS(app, resources={r"/*": {"origins": "https://nikhil-kadapala.github.io"}}, supports_credentials=True)

    talisman = Talisman(
        app,
        force_https=True,  # Force HTTPS
        strict_transport_security=True,
        content_security_policy={
            'default-src': '\'self\'',
        }
    )

from werkzeug.middleware.proxy_fix import ProxyFix
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1)

@app.before_request
def enforce_https():
    if os.environ.get('FLASK_ENV') == 'development':
        return
    
    if request.headers.get('X-Forwarded-Proto') == 'http':
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)
    
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def transform_image(image_path):
    try:
        image = Image.open(image_path)
        Transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        return Transform(image)
    except Exception as e:
        logger.error(f"Error transforming image: {e}")
        raise

def get_classes():
    try:
        with open("classes.txt", "r") as f:
            classes = [line.strip() for line in f.readlines()]
        return classes
    except Exception as e:
        logger.error(f"Error loading classes: {e}")
        raise

def predict_class(image_path):
    try:
        image = transform_image(image_path)
        batched_img = image.unsqueeze(0)
        weights = ResNet101_Weights.IMAGENET1K_V1
        model = resnet101(weights=weights)
        with torch.no_grad():
            model.eval()
            output = model(batched_img)
            classes = get_classes()
            _, pred = torch.max(output, dim=1)
            prob = torch.softmax(output, dim=1)[0] * 100
            return classes[pred], prob[pred].item()
    except Exception as e:
        logger.error(f"Error predicting class: {e}")
        raise


#@app.route('/', methods=['GET'])

#def main():
    #return send_from_directory(app.static_folder, "index.html")

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per day", "50 per hour"],
    storage_uri="redis://red-cv29v6d6l47c73fmc1sg:6379",
    strategy="fixed-window"
)

@limiter.limit("5 per minute")

@app.route('/', methods=['GET', 'POST'])
@cross_origin(origins="https://nikhil-kadapala.github.io")
def upload_file():
    if request.method == 'POST':
        try:
            # Check if image is in request
            if 'image' not in request.files:
                return jsonify({'error': 'No image part in the request'}), 400
            
            file = request.files['image']
            
            # Check if file is empty
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
                
            # Validate file type
            if not allowed_file(file.filename):
                return jsonify({'error': 'File type not allowed'}), 400
                
            # Create a safe filename
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.normpath(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
            
            # Save file
            file.save(file_path)
            
            # Process image
            category, probability = predict_class(file_path)
            
            # Clean up
            os.remove(file_path)
            
            return jsonify({
                'category': category, 
                'probability': probability, 
                'stopSlideshow': True
            })
            
        except Exception as e:
            logger.error(f"Error processing request: {e}")
            return jsonify({'error': 'Server error processing image'}), 500
    else:
        return jsonify({'message': 'Ready to process images. Please send a POST request with an image.'})

@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
