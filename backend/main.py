import time
import requests
import os
from PIL import Image
import numpy as np
from io import BytesIO
import tempfile
import boto3
from data import validDates, month_to_number
from dotenv import load_dotenv
load_dotenv()

NASA_API_KEY = os.getenv('API_KEY')
NASA_API_URL = 'https://api.nasa.gov/EPIC/api/natural/date/'

LOCAL_IMAGE_DIR = 'images'
LOCAL_GIF_DIR = 'gifs'

region_name = 'ap-southeast-2'
sqs = boto3.client('sqs', region_name=region_name)
queue_url = 'https://sqs.ap-southeast-2.amazonaws.com/901444280953/group99'

def fetch_images_from_nasa(date):
    url = f"{NASA_API_URL}{date}?api_key={NASA_API_KEY}"
    response = requests.get(url)
    data = handle_http_response(response)
    if data is not None:
        image_urls = [image['image'] for image in data]
        images = []
        for image_url in image_urls:
            image_response = requests.get(f'https://epic.gsfc.nasa.gov/epic-archive/jpg/{image_url}.jpg')
            if image_response.status_code == 200:
                images.append(image_response.content)
            else:
                print(f"Error: Received unexpected HTTP status code {image_response.status_code} for image URL {image_url}")
        return images
    else:
        return []

def create_gif_from_images(image_data_list):
    img_objects = [Image.open(BytesIO(image_data)) for image_data in image_data_list]

    base_width, base_height = img_objects[0].size
    img_objects = [img.resize((base_width, base_height)) for img in img_objects]

    img_np_arrays = [np.array(img) for img in img_objects]

    morphed_images = []
    steps = 15
    for i in range(len(img_np_arrays) - 1):
        for t in np.linspace(0, 1, steps):
            morphed_image_np = (1.0 - t) * img_np_arrays[i] + t * img_np_arrays[i + 1]
            morphed_image_np = morphed_image_np.astype(np.uint8)
            morphed_image = Image.fromarray(morphed_image_np)
            morphed_images.append(morphed_image)

    with tempfile.NamedTemporaryFile(delete=True, suffix='.gif') as f:
        morphed_images[0].save(
            f.name,
            save_all=True,
            append_images=morphed_images[1:],
            optimize=True,
            duration=100,
            loop=0,
        )
        return f.read()

def process_sqs_message():
    response = sqs.receive_message(
        QueueUrl=queue_url,
        AttributeNames=['SentTimestamp'],
        MaxNumberOfMessages=1,
        MessageAttributeNames=['All'],
        VisibilityTimeout=20,
        WaitTimeSeconds=20,
    )

    messages = response.get('Messages')
    if messages:
        message = messages[0]
        attributes = message.get('MessageAttributes', {})

        day = attributes['Day']['StringValue']
        month = attributes['Month']['StringValue']
        presignedUrl = attributes['PresignedUrl']['StringValue']

        if len(day) == 1:
            day = "0" + day

        month = month_to_number[month]
        date = month + "-" + day
        year = validDates[date]
        fullDate = year + "-" + date

        images = fetch_images_from_nasa(fullDate)
        if images:
            gif_data = create_gif_from_images(images)
            local_gif_path = os.path.join(LOCAL_GIF_DIR, f"{date}_morphed_earth.gif")
            with open(local_gif_path, 'wb') as f:
                f.write(gif_data)

            print(f"Morphed GIF creation completed for {date}. File saved at {local_gif_path}")

            # Upload to S3
            try:
                with open(local_gif_path, 'rb') as file_data:
                    headers = {'Content-Type': 'image/gif'}
                    response = requests.put(presignedUrl, data=file_data, headers=headers)

                    if response.status_code == 200:
                        print('Successfully uploaded to S3')
                    else:
                        print('Failed to upload to S3. Status:', response.status_code, response.reason)
            except Exception as e:
                print('Error uploading to S3:', e)

        else:
            print("No images available for the given date.")

    else:
        print("No messages available in the queue.")

def handle_http_response(response):
    if response.status_code == 200:
        return response.json()
    elif response.status_code == 404:
        print("Error: Resource not found")
    elif response.status_code == 500:
        print("Error: Internal server error")
    else:
        print(f"Error: Received unexpected HTTP status code {response.status_code}")
    return None

COOLING_PERIOD = 10

def main():
    while True:
        process_sqs_message()
        time.sleep(COOLING_PERIOD)

if __name__ == '__main__':
    main()