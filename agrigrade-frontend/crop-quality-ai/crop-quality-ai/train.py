import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import os

# ==========================================
# SETTINGS
# ==========================================

DATASET_PATH = "dataset"
MODEL_PATH = "models/crop_grade_model.keras"

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 16
EPOCHS = 15
SEED = 123

# ==========================================
# CREATE TEMPORARY FLAT DATASET
# ==========================================

TEMP_DATASET = "training_data"

if os.path.exists(TEMP_DATASET):
    print("Training dataset already exists.")
else:
    os.makedirs(TEMP_DATASET)

    crops = [
        "banana",
        "mango",
        "carrot",
        "okra",
        "onion",
        "tomato"
    ]

    grades = [
        "grade_a",
        "grade_b",
        "grade_c"
    ]

    print("Creating training labels...")

    for crop in crops:

        for grade in grades:

            source_folder = os.path.join(
                DATASET_PATH,
                crop,
                grade
            )

            label = crop + "_" + grade

            destination_folder = os.path.join(
                TEMP_DATASET,
                label
            )

            os.makedirs(destination_folder, exist_ok=True)

            if os.path.exists(source_folder):

                for image in os.listdir(source_folder):

                    source = os.path.join(
                        source_folder,
                        image
                    )

                    destination = os.path.join(
                        destination_folder,
                        image
                    )

                    if os.path.isfile(source):

                        try:
                            import shutil
                            shutil.copy2(source, destination)

                        except Exception as e:
                            print("Error copying:", source)
                            print(e)

print("Training dataset ready!")

# ==========================================
# LOAD DATASET
# ==========================================

train_ds = tf.keras.utils.image_dataset_from_directory(
    TEMP_DATASET,
    validation_split=0.2,
    subset="training",
    seed=SEED,
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE
)

validation_ds = tf.keras.utils.image_dataset_from_directory(
    TEMP_DATASET,
    validation_split=0.2,
    subset="validation",
    seed=SEED,
    image_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE
)

# ==========================================
# SHOW CLASSES
# ==========================================

class_names = train_ds.class_names

print("\nClasses detected:")

for number, class_name in enumerate(class_names):
    print(number, ":", class_name)

print("\nTotal classes:", len(class_names))

# ==========================================
# PERFORMANCE
# ==========================================

AUTOTUNE = tf.data.AUTOTUNE

train_ds = train_ds.prefetch(
    buffer_size=AUTOTUNE
)

validation_ds = validation_ds.prefetch(
    buffer_size=AUTOTUNE
)

# ==========================================
# DATA AUGMENTATION
# ==========================================

data_augmentation = keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.1),
    layers.RandomZoom(0.1),
])

# ==========================================
# MOBILE NET V2
# ==========================================

base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights="imagenet"
)

base_model.trainable = False

# ==========================================
# BUILD MODEL
# ==========================================

inputs = keras.Input(
    shape=(224, 224, 3)
)

x = data_augmentation(inputs)

x = tf.keras.applications.mobilenet_v2.preprocess_input(x)

x = base_model(
    x,
    training=False
)

x = layers.GlobalAveragePooling2D()(x)

x = layers.Dropout(0.3)(x)

outputs = layers.Dense(
    len(class_names),
    activation="softmax"
)(x)

model = keras.Model(
    inputs,
    outputs
)

# ==========================================
# COMPILE
# ==========================================

model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

print("\nModel created successfully!")

model.summary()

# ==========================================
# TRAIN
# ==========================================

print("\n==============================")
print("STARTING TRAINING")
print("==============================\n")

history = model.fit(
    train_ds,
    validation_data=validation_ds,
    epochs=EPOCHS
)

# ==========================================
# SAVE MODEL
# ==========================================

os.makedirs("models", exist_ok=True)

model.save(MODEL_PATH)

print("\n==============================")
print("TRAINING COMPLETED")
print("==============================")

print("Model saved at:")
print(MODEL_PATH)