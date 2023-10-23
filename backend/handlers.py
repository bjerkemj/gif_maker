from PIL import Image
import boto3

def create_gif_from_images(images, output_path):
    img_objects = [Image.open(image) for image in images]
    img_objects[0].save(
        output_path,
        save_all=True,
        append_images=img_objects[1:],
        optimize=True,
        duration=500,
        loop=0,
    )

def create_earth_rotation_gif(date, output_path):
    # Fetch images from S3 for the given date
    s3 = boto3.client('s3', region_name='your-region')
    S3_BUCKET = 'your-s3-bucket-name'

    images = []
    for i in range(24):  # Assuming there are 24 images for a full rotation
        image_path = f"earth_rotation/{date}/image_{i}.jpg"
        image = s3.get_object(Bucket=S3_BUCKET, Key=image_path)
        images.append(image['Body'].read())

    # Create GIF
    create_gif_from_images(images, output_path)
