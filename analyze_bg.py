import sys
from PIL import Image

def analyze_img(img_path):
    try:
        img = Image.open(img_path)
        img = img.convert("RGBA")
        pixels = img.load()
        print(f"Size: {img.size}")
        print(f"Top-Left Pixel: {pixels[0, 0]}")
        
        # Count black and white pixels
        datas = img.getdata()
        black = 0
        white = 0
        trans = 0
        for item in datas:
            if item[3] == 0:
                trans += 1
            elif item[0] < 30 and item[1] < 30 and item[2] < 30:
                black += 1
            elif item[0] > 220 and item[1] > 220 and item[2] > 220:
                white += 1
                
        print(f"Transparent: {trans}, Black: {black}, White: {white}, Total: {len(datas)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_img(r"c:\Users\Dev Shukla\Desktop\Hackitup\GLITCHMAFIA_UI\public\assets\images\HackitUp_Logo.png")
