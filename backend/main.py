import time
import requests
import os
from PIL import Image
import numpy as np
from io import BytesIO
import tempfile
import boto3
from data import validDates, month_to_number
from concurrent.futures import ThreadPoolExecutor, as_completed
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
    start_time = time.time()
    url = f"{NASA_API_URL}{date}?api_key={NASA_API_KEY}"
    print(url)
    response = requests.get(url)
    print(response)
    data = handle_http_response(response)
    if data is not None:
        image_urls = [f'https://epic.gsfc.nasa.gov/epic-archive/jpg/{image["image"]}.jpg' for image in data]
        images = []
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = {executor.submit(fetch_image, image_url): image_url for image_url in image_urls}
            for future in as_completed(futures):
                image_url = futures[future]
                try:
                    image_data = future.result()
                    images.append(image_data)
                except Exception as exc:
                    print(f"Error: Received error fetching image URL {image_url}: {exc}")

        print(f"Time taken to fetch images from NASA: {time.time() - start_time} seconds")
        return images
    else:
        return []

def fetch_image(image_url):
    response = requests.get(image_url)
    if response.status_code == 200:
        return response.content
    else:
        print(f"Error: Received unexpected HTTP status code {response.status_code} for image URL {image_url}")
        return None


def create_gif_from_images(image_data_list, width=400, height=400):
    start_time = time.time()
    img_objects = [Image.open(BytesIO(image_data)) for image_data in image_data_list]

    base_width, base_height = width, height
    img_objects = [img.resize((base_width, base_height), 1) for img in img_objects]

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
        print(f"Time taken to create GIF from images: {time.time() - start_time} seconds")
        return f.read()
    

def process_sqs_message():
    start_time = time.time()
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
        print(fullDate)
        images = fetch_images_from_nasa(fullDate)
        if images:
            gif_data = create_gif_from_images(images)
            
            print(f"Morphed GIF creation completed for {date}.")
            
            # Upload to S3
            try:
                headers = {'Content-Type': 'image/gif'}
                response = requests.put(presignedUrl, data=gif_data, headers=headers)

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

    print(f"Time taken to process SQS message: {time.time() - start_time} seconds")

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

def main():
    while True:
        start_time = time.time()
        process_sqs_message()
        print(f"Time taken for one iteration of main loop: {time.time() - start_time} seconds")

if __name__ == '__main__':
    main()