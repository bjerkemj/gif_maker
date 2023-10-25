from flask import Flask, request, jsonify
import requests
import os
from handlers import create_morphed_gif_from_images
from data import validDates
import boto3
from io import BytesIO

app = Flask(__name__)

NASA_API_KEY = 'D7AfJnFqdgmWalfDUNfDA54Pv0Xqbg8cVAufszBb'
NASA_API_URL = 'https://api.nasa.gov/EPIC/api/natural/date/'

LOCAL_IMAGE_DIR = 'images'
LOCAL_GIF_DIR = 'gifs'

S3_BUCKET_NAME = ''
AWS_ACCESS_KEY_ID = ''
AWS_SECRET_ACCESS_KEY = ''
AWS_REGION = ''

s3 = boto3.client('s3', region_name=AWS_REGION, aws_access_key_id=AWS_ACCESS_KEY_ID, aws_secret_access_key=AWS_SECRET_ACCESS_KEY)

@app.route('/create_morphed_gif', methods=['POST'])
def create_morphed_gif():
    data = request.json
    if 'inputDate' in data:
        # Fetch images from NASA and store in S3
        month_day = data['inputDate']
        
        if month_day not in validDates:
            return jsonify({'error': 'Invalid date'}), 400
        
        year = validDates[month_day]
        date = f"{year}-{month_day}"
        
        images = fetch_images_from_nasa(date)
        if not images:
            return jsonify({'error': 'No images found for the given date'}), 400
        
        # Store images in S3
        image_urls = []
        for i, image in enumerate(images):
            image_name = f"{date}_image_{i}.jpg"
            s3.upload_fileobj(BytesIO(image), S3_BUCKET_NAME, image_name)
            image_urls.append(f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{image_name}")
        
        # Create morphed GIF and store in S3
        gif_path = create_morphed_gif_from_images(image_urls)
        gif_name = f"{date}_morphed_earth.gif"
        s3.upload_file(gif_path, S3_BUCKET_NAME, gif_name)
        
        # Delete local GIF file
        os.remove(gif_path)
        
        gif_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{gif_name}"
        return jsonify({'message': 'Morphed GIF creation completed', 'gif_url': gif_url}), 200
    else:
        return jsonify({'error': 'Invalid data'}), 400

def fetch_images_from_nasa(date):
    # Call NASA API and fetch images for the given date
    url = f"{NASA_API_URL}{date}?api_key={NASA_API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        image_urls = [image['image'] for image in data]
        images = []
        for image_url in image_urls:
            image_response = requests.get(f'https://epic.gsfc.nasa.gov/epic-archive/jpg/{image_url}.jpg')
            if image_response.status_code == 200:
                images.append(image_response.content)
        return images
    else:
        print(f"Error fetching images: {response.status_code}")
        return []

if __name__ == '__main__':
    app.run(debug=True)
