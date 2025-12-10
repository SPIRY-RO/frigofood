
import fitz

def check_text(pdf_path, page_num):
    try:
        doc = fitz.open(pdf_path)
        page = doc.load_page(page_num - 1) # 0-indexed
        text = page.get_text()
        print(f"--- Text on Page {page_num} ---")
        print(text[:500]) # First 500 chars
        print("---------------------------")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_text("DunyaKatalog.pdf", 10)
    check_text("DunyaKatalog.pdf", 50)
