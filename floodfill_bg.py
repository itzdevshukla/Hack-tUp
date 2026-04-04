import sys
from PIL import Image, ImageDraw

def flood_remove_bg(img_path):
    try:
        # Open and ensure RGBA
        original = Image.open(img_path).convert("RGBA")
        width, height = original.size
        
        # Create a mask by floodfilling from the corners
        # We floodfill on a copy with a distinct color (e.g. magenta) to identify the background
        mask_test = original.copy().convert("RGB")
        target_color = (255, 0, 255) # Magenta
        
        corners = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
        
        for corner in corners:
            # check the pixel at the corner
            pixel = mask_test.getpixel(corner)
            if pixel[0] < 30 and pixel[1] < 30 and pixel[2] < 30: # If dark/black
                ImageDraw.floodfill(mask_test, xy=corner, value=target_color, thresh=30)
                
        # Now apply the mask: where mask_test is magenta, set original alpha to 0
        original_data = original.getdata()
        mask_data = mask_test.getdata()
        
        new_data = []
        for i in range(len(original_data)):
            if mask_data[i] == target_color:
                new_data.append((0, 0, 0, 0)) # transparent
            else:
                # Some logos have black aliasing at the edges, we could soften it, but let's keep it simple
                new_data.append(original_data[i])
                
        original.putdata(new_data)
        original.save(img_path, "PNG")
        print("Success")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    flood_remove_bg(r"c:\Users\Dev Shukla\Desktop\Hackitup\GLITCHMAFIA_UI\public\assets\images\HackitUp_Logo.png")
