import os

dataset_path = "dataset"

for crop in sorted(os.listdir(dataset_path)):

    crop_path = os.path.join(dataset_path, crop)

    if not os.path.isdir(crop_path):
        continue

    print("\n" + crop.upper())

    for grade in ["grade_a", "grade_b", "grade_c"]:

        grade_path = os.path.join(crop_path, grade)

        if os.path.exists(grade_path):

            images = [
                f for f in os.listdir(grade_path)
                if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
            ]

            print(f"  {grade}: {len(images)} images")

        else:
            print(f"  {grade}: MISSING")