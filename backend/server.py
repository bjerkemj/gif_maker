from flask import Flask, request, jsonify
import boto3
from handlers import create_gif_from_images, create_earth_rotation_gif
import requests

app = Flask(__name__)

NASA_API_KEY = 'D7AfJnFqdgmWalfDUNfDA54Pv0Xqbg8cVAufszBb'
NASA_API_URL = 'https://api.nasa.gov/EPIC/api/natural/date/'


# AWS Configurations
S3_BUCKET = 'your-s3-bucket-name'
s3 = boto3.client('s3')

@app.route('/create_gif', methods=['POST'])
def create_gif():
    data = request.json
    if 'birthday' in data:
        # Fetch images from NASA and store in S3
        date = data['birthday']
        images = fetch_images_from_nasa(date)
        for i, image in enumerate(images):
            s3.upload_fileobj(image, S3_BUCKET, f"earth_rotation/{date}/image_{i}.jpg")

        return jsonify({'message': 'GIF creation in process'}), 202

    elif 'images' in data:
        # Store images in S3
        images = data['images']
        for i, image in enumerate(images):
            s3.upload_fileobj(image, S3_BUCKET, f"custom_gif/image_{i}.jpg")

        return jsonify({'message': 'GIF creation in process'}), 202

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
