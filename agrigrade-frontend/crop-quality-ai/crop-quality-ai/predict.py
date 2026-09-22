import tensorflow as tf
import numpy as np

# Load trained model
MODEL_PATH = "models/crop_grade_model.keras"

model = tf.keras.models.load_model(MODEL_PATH)

# IMPORTANT:
# These must match the class order printed during training.
class_names = [
    "banana_grade_a",
    "banana_grade_b",
    "banana_grade_c",
    "carrot_grade_a",
    "carrot_grade_b",
    "carrot_grade_c",
    "mango_grade_a",
    "mango_grade_b",
    "mango_grade_c",
    "okra_grade_a",
    "okra_grade_b",
    "okra_grade_c",
    "onion_grade_a",
    "onion_grade_b",
    "onion_grade_c",
    "tomato_grade_a",
    "tomato_grade_b",
    "tomato_grade_c"
]

# Ask for image
image_path = input("Enter image path: ")

# Load image
image = tf.keras.utils.load_img(
    image_path,
    target_size=(224, 224)
)

# Convert image to array
image_array = tf.keras.utils.img_to_array(image)

# Add batch dimension
image_array = np.expand_dims(image_array, axis=0)

# Predict
predictions = model.predict(image_array)

# Find highest probability
index = np.argmax(predictions[0])

confidence = predictions[0][index] * 100

prediction = class_names[index]

# Separate crop and grade
crop, grade = prediction.split("_",1)

# Display result
print("\n==============================")
print("       AI PREDICTION")
print("==============================")

print("Crop       :", crop.capitalize())
grade = grade.replace("GRADE_", "")
print("Grade      :", grade)
print("Confidence :", f"{confidence:.2f}%")

print("==============================")