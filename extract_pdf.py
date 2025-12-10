
import fitz  # PyMuPDF
import os
import io
from PIL import Image

def extract_from_pdf(pdf_PATH, output_folder):
    # Open the PDF
    pdf_document = fitz.open(pdf_PATH)
    
    # Create output directory for images
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        
    extracted_data = []

    print(f"Processing PDF: {pdf_PATH}")
    print(f"Total pages: {len(pdf_document)}")

    for page_num in range(len(pdf_document)):
        page = pdf_document.load_page(page_num)
        text = page.get_text("text")
        
        # Extract images
        image_list = page.get_images(full=True)
        
        page_images = []
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = pdf_document.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
            image_filename = f"page_{page_num + 1}_img_{img_index + 1}.{image_ext}"
            image_path = os.path.join(output_folder, image_filename)
            
            # Filter small images (likely icons or logos)
            try:
                img_obj = Image.open(io.BytesIO(image_bytes))
                if img_obj.width > 200 and img_obj.height > 200:
                    with open(image_path, "wb") as f:
                        f.write(image_bytes)
                    page_images.append(image_filename)
                    print(f"Saved image: {image_filename}")
            except Exception as e:
                print(f"Error saving image {img_index} on page {page_num}: {e}")

        extracted_data.append({
            "page": page_num + 1,
            "text": text,
            "images": page_images
        })

    return extracted_data

if __name__ == "__main__":
    pdf_path = "DunyaKatalog.pdf"
    output_dir = "assets/products"
    
    if os.path.exists(pdf_path):
        data = extract_from_pdf(pdf_path, output_dir)
        
        # Simple text analysis to help categorization
        print("\n--- Extracted Text Analysis ---")
        for page in data:
            if page['images']: # Only interesting if it has product images
                lines = [line.strip() for line in page['text'].split('\n') if line.strip()]
                if lines:
                    print(f"\nPage {page['page']} potential content:")
                    print('\n'.join(lines[:10])) # Show first 10 lines as preview
    else:
        print(f"File not found: {pdf_path}")
