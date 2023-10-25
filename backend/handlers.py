from PIL import Image
import numpy as np
import requests
from io import BytesIO
import tempfile

def create_morphed_gif_from_images(image_urls):
    img_objects = [Image.open(BytesIO(requests.get(image_url).content)) for image_url in image_urls]

    # Ensure all images have the same dimensions
    base_width, base_height = img_objects[0].size
    img_objects = [img.resize((base_width, base_height)) for img in img_objects]

    # Convert images to numpy arrays
    img_np_arrays = [np.array(img) for img in img_objects]

    # Create a series of images moving from one image to the next
    morphed_images = []
    steps = 15  # Change this for more or fewer steps in the morphing process
    for i in range(len(img_np_arrays) - 1):
        for t in np.linspace(0, 1, steps):
            morphed_image_np = (1.0 - t) * img_np_arrays[i] + t * img_np_arrays[i + 1]
            morphed_image_np = morphed_image_np.astype(np.uint8)
            morphed_image = Image.fromarray(morphed_image_np)
            morphed_images.append(morphed_image)

    # Save to a temporary GIF file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.gif') as f:
        morphed_images[0].save(
            f.name,
            save_all=True,
            append_images=morphed_images[1:],
            optimize=True,
            duration=100,
            loop=0,
        )
        return f.name
