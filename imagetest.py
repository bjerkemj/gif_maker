from PIL import Image
import os
import numpy as np

script_directory = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_directory)

# Load the images
image1 = Image.open('image_1.png')
image2 = Image.open('image_2.png')

# Ensure both images have the same dimensions
assert image1.size == image2.size, "Both images should have the same dimensions."

# Convert images to numpy arrays
image1_np = np.array(image1)
image2_np = np.array(image2)

# Create a series of images moving from image1 to image2
morphed_images = []
steps = 30  # Change this for more or fewer steps in the morphing process
for t in np.linspace(0, 1, steps):
    morphed_image_np = (1.0 - t) * image1_np + t * image2_np
    morphed_image_np = morphed_image_np.astype(np.uint8)
    morphed_image = Image.fromarray(morphed_image_np)
    morphed_images.append(morphed_image)

# Save to a GIF
morphed_images[0].save('morphed.gif', save_all=True, append_images=morphed_images[1:], duration=100, loop=0)