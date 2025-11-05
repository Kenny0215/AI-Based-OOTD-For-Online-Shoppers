import os

root = r"C:\UTEM\Course\Sem 5\BAXU 3923 (Workshop 2)\AI-Based OOTD"

def clean_null_bytes(file_path):
    with open(file_path, "rb") as f:
        data = f.read()
    if b"\x00" in data:
        print(f"🧹 Cleaning null bytes in: {file_path}")
        cleaned = data.replace(b"\x00", b"")
        with open(file_path, "wb") as f:
            f.write(cleaned)
        print("✅ Cleaned successfully!")
    else:
        print(f"✅ No null bytes in: {file_path}")

# Walk through every .py file
for subdir, _, files in os.walk(root):
    for file in files:
        if file.endswith(".py"):
            clean_null_bytes(os.path.join(subdir, file))
