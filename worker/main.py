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

# Get the NASA API key from environment variables
NASA_API_KEY = os.getenv('API_KEY')
NASA_API_URL = 'https://api.nasa.gov/EPIC/api/natural/date/'

REGION_NAME = 'ap-southeast-2'
sqs = boto3.client('sqs', region_name=REGION_NAME)
queue_url = 'https://sqs.ap-southeast-2.amazonaws.com/901444280953/group99'

def fetch_images_from_nasa(date):
    start_time = time.time()
    url = f"{NASA_API_URL}{date}?api_key={NASA_API_KEY}"
    response = requests.get(url)
    data = handle_http_response(response) # Handle HTTP response and extract data
    if data is not None:
        image_urls = [f'https://epic.gsfc.nasa.gov/epic-archive/jpg/{image["image"]}.jpg' for image in data]
        images = [None] * len(image_urls)  # Initialize a list with the same length as image_urls
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = {executor.submit(fetch_image, image_url): index for index, image_url in enumerate(image_urls)}
            for future in as_completed(futures):
                index = futures[future]
                try:
                    image_data = future.result()
                    images[index] = image_data  # Place the image data at the correct index
                except Exception as exc:
                    print(f"Error: Received error fetching image URL {image_urls[index]}: {exc}")

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
    # Create a list of PIL Image objects from image data
    img_objects = [Image.open(BytesIO(image_data)) for image_data in image_data_list]

    base_width, base_height = width, height
    # Resize the image objects to the specified width and height
    img_objects = [img.resize((base_width, base_height), 1) for img in img_objects]

    # Convert image objects to NumPy arrays
    img_np_arrays = [np.array(img) for img in img_objects]

    morphed_images = []
    steps = 15
    # Generate intermediate morphed images between adjacent frames
    for i in range(len(img_np_arrays) - 1):
        for t in np.linspace(0, 1, steps):
            morphed_image_np = (1.0 - t) * img_np_arrays[i] + t * img_np_arrays[i + 1]
            morphed_image_np = morphed_image_np.astype(np.uint8)
            morphed_image = Image.fromarray(morphed_image_np)
            morphed_images.append(morphed_image)

    with tempfile.NamedTemporaryFile(delete=True, suffix='.gif') as f:
        # Save the morphed images as a GIF
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
    # Receive a message from an Amazon SQS queue
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
        receipt_handle = message['ReceiptHandle']  # Save the receipt handle for deleting the message later
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
        
        # Fetch images from NASA based on the date
        images = fetch_images_from_nasa(fullDate)
        if images:
            gif_data = create_gif_from_images(images)
            
            print(f"Morphed GIF creation completed for {date}.")
            
            # Upload the generated GIF to Amazon S3
            try:
                headers = {'Content-Type': 'image/gif'}
                response = requests.put(presignedUrl, data=gif_data, headers=headers)

                if response.status_code == 200:
                    print('Successfully uploaded to S3')
                    # Delete the message from the queue after successful processing
                    sqs.delete_message(
                        QueueUrl=queue_url,
                        ReceiptHandle=receipt_handle,
                    )
                    print('Successfully deleted message from the queue')
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