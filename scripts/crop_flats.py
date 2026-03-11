import os
from PIL import Image

def crop_flats():
    out_dir = r"C:\GitHub\Digital Passport\scripts\cropped-flats"
    if not os.path.exists(out_dir):
        os.makedirs(out_dir)

    # Coords from the HTML browser tool:
    crops = [
        {
            "filename": "4bhk-corner-4070-wf.png",
            "page": r"C:\GitHub\Digital Passport\scripts\brochure-hires\page-14-blocks-BC.png",
            "box": (1936, 434, 1936+582, 434+2182) # (left, top, right, bottom)
        },
        {
            "filename": "35bhk-standard-3430-ef.png",
            "page": r"C:\GitHub\Digital Passport\scripts\brochure-hires\page-14-blocks-BC.png",
            "box": (3136, 2495, 3136+3792, 2495+6251)
        },
        {
            "filename": "3bhk-standard-2680-ef.png",
            "page": r"C:\GitHub\Digital Passport\scripts\brochure-hires\page-14-blocks-BC.png",
            "box": (6867, 2495, 6867+3656, 2495+6251)
        },
        {
            "filename": "35bhk-standard-3430-wf.png",
            "page": r"C:\GitHub\Digital Passport\scripts\brochure-hires\page-16-block-F.png",
            "box": (193, 407, 193+669, 407+1034)
        },
        {
            "filename": "3bhk-standard-2595-wf.png",
            "page": r"C:\GitHub\Digital Passport\scripts\brochure-hires\page-16-block-F.png",
            "box": (863, 407, 863+1139, 407+3814)
        }
    ]

    for crop in crops:
        print(f"Cropping {crop['filename']} from {os.path.basename(crop['page'])}...")
        try:
            with Image.open(crop['page']) as img:
                cropped = img.crop(crop['box'])
                cropped.save(os.path.join(out_dir, crop['filename']))
                print(f" -> Saved {crop['filename']}")
        except Exception as e:
            print(f"Failed to crop {crop['filename']}: {e}")

if __name__ == "__main__":
    crop_flats()
