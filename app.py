from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from config import Config
from biometrics import verify_face, recognize_face, iris_detection, iris_analysis
from voting import VotingContract
import logging

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Web3 contract
voting_contract = VotingContract()

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_IMAGE_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/verify')
def verify():
    return render_template('verify.html')

@app.route('/vote')
def vote():
    return render_template('vote.html')

@app.route('/api/verify_biometrics', methods=['POST'])
def verify_biometrics():
    try:
        if 'face' not in request.files or 'iris' not in request.files:
            return jsonify({'error': 'Missing required files'}), 400

        face_file = request.files['face']
        iris_file = request.files['iris']

        if face_file.filename == '' or iris_file.filename == '':
            return jsonify({'error': 'No selected files'}), 400

        if not (allowed_file(face_file.filename) and allowed_file(iris_file.filename)):
            return jsonify({'error': 'Invalid file type'}), 400

        # Create upload directory if it doesn't exist
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

        # Save files
        face_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(face_file.filename))
        iris_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(iris_file.filename))
        
        face_file.save(face_path)
        iris_file.save(iris_path)

        # Perform biometric verifications
        face_auth_result = verify_face(face_path)
        if not face_auth_result['success']:
            return jsonify({'error': 'Face authentication failed'}), 400

        face_recognition_result = recognize_face(face_path)
        if not face_recognition_result['success']:
            return jsonify({'error': 'Face recognition failed'}), 400

        iris_detection_result = iris_detection(iris_path)
        if not iris_detection_result['success']:
            return jsonify({'error': 'Iris detection failed'}), 400

        iris_analysis_result = iris_analysis(iris_path)
        if not iris_analysis_result['success']:
            return jsonify({'error': 'Iris analysis failed'}), 400

        # Clean up uploaded files
        os.remove(face_path)
        os.remove(iris_path)

        return jsonify({
            'success': True,
            'message': 'Biometric verification successful',
            'verification_id': face_recognition_result['verification_id']
        })

    except Exception as e:
        logger.error(f"Error in biometric verification: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/vote', methods=['POST'])
def cast_vote():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required_fields = ['voter_address', 'candidate_id', 'verification_id']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        # Cast vote using the smart contract
        result = voting_contract.cast_vote(
            data['voter_address'],
            int(data['candidate_id'])
        )

        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Vote cast successfully',
                'transaction_hash': result['transaction_hash']
            })
        else:
            return jsonify({'error': result['error']}), 400

    except Exception as e:
        logger.error(f"Error in casting vote: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/candidates', methods=['GET'])
def get_candidates():
    try:
        candidates = voting_contract.get_candidates()
        return jsonify({
            'success': True,
            'candidates': candidates
        })
    except Exception as e:
        logger.error(f"Error fetching candidates: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True)
