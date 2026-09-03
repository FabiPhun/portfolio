# convert-all-to-spa.py
# Run with: python convert-all-to-spa.py

import os
import re

def convert_to_spa(file_path):
    """Convert a single HTML file to SPA format"""
    print(f"Processing: {file_path}")
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    
    # 1. Add id="page-content" to main content wrapper
    wrappers = [
        'class="body_content"',
        'class="body_item_wrapper"',
        'class="main-content"',
        'class="content"',
        'class="page-content"'
    ]
    
    for wrapper in wrappers:
        pattern = rf'(<div\s+{re.escape(wrapper)})'
        if re.search(pattern, content):
            content = re.sub(pattern, lambda m: m.group(0) if 'id=' in m.group(0) else m.group(0).replace(wrapper, f'{wrapper} id="page-content"'), content)
            modified = True
            break
    
    # If no wrapper found, try adding to the first div after body
    if not modified:
        body_pattern = r'<body[^>]*>\s*<div'
        match = re.search(body_pattern, content)
        if match:
            content = re.sub(body_pattern, lambda m: m.group(0).replace('<div', '<div id="page-content"'), content)
            modified = True
    
    # 2. Remove navbar container (with or without directoryFix)
    navbar_pattern = r'<div\s+id="navbar-container"[^>]*>.*?</div>\s*'
    if re.search(navbar_pattern, content, re.DOTALL):
        content = re.sub(navbar_pattern, '', content, flags=re.DOTALL)
        modified = True
    
    # 3. Remove navbar script tags
    navbar_script_pattern = r'<script[^>]*navbar\.js[^>]*>.*?</script>\s*'
    if re.search(navbar_script_pattern, content, re.DOTALL):
        content = re.sub(navbar_script_pattern, '', content, flags=re.DOTALL)
        modified = True
    
    # 4. Remove any directoryFix attributes
    dir_fix_pattern = r'directoryFix="[^"]*"\s*'
    if re.search(dir_fix_pattern, content):
        content = re.sub(dir_fix_pattern, '', content)
        modified = True
    
    # 5. Clean up extra whitespace
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
    
    # Only write if changes were made
    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Updated: {file_path}")
        return True
    else:
        print(f"⏭️  Skipped: {file_path} (no changes needed)")
        return False

def find_html_files(directory):
    """Find all HTML files excluding index.html"""
    results = []
    
    # Folders to skip
    skip_folders = {'node_modules', '.git', 'components', '__pycache__'}
    
    for root, dirs, files in os.walk(directory):
        # Skip unwanted folders
        dirs[:] = [d for d in dirs if d not in skip_folders]
        
        for file in files:
            if file.endswith('.html') and file != 'index.html':
                results.append(os.path.join(root, file))
    
    return results

def main():
    """Main execution"""
    start_dir = os.getcwd()
    print(f"📁 Searching for HTML files in: {start_dir}\n")
    
    html_files = find_html_files(start_dir)
    print(f"Found {len(html_files)} HTML files to process\n")
    
    if len(html_files) == 0:
        print('No HTML files found (excluding index.html)')
        return
    
    updated = 0
    skipped = 0
    
    for file in html_files:
        if convert_to_spa(file):
            updated += 1
        else:
            skipped += 1
    
    print(f"\n✅ Done! Updated: {updated}, Skipped: {skipped}")

if __name__ == "__main__":
    main()
