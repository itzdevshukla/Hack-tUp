import os

REACT_DIR = r"c:\Users\Dev Shukla\Desktop\Hackitup\GLITCHMAFIA_UI\src\components"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Replace specific header patterns safely
    content = content.replace(
        "'Content-Type': 'application/json',",
        "'Content-Type': 'application/json',\n                    'X-CSRFToken': getCsrfToken(),"
    )
    
    # Sometimes it's without trailing comma, but only if not followed by CSRF
    if "'Content-Type': 'application/json'" in content and "'Content-Type': 'application/json'," not in content:
        content = content.replace(
            "'Content-Type': 'application/json'",
            "'Content-Type': 'application/json',\n                    'X-CSRFToken': getCsrfToken()"
        )
        
    # Headers empty
    content = content.replace(
        "headers: {}",
        "headers: {\n                    'X-CSRFToken': getCsrfToken()\n                }"
    )

    # Note: If it already had getCsrfToken, we might be doubling up. Let's fix doubles:
    content = content.replace("'X-CSRFToken': getCsrfToken(),\n                    'X-CSRFToken': getCsrfToken(),", "'X-CSRFToken': getCsrfToken(),")

    # If we injected getCsrfToken, ensure it's imported
    if 'getCsrfToken()' in content and 'import { getCsrfToken }' not in content:
        # insert after last import
        lines = content.split('\n')
        last_import = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import = i
        lines.insert(last_import + 1, "import { getCsrfToken } from '../utils/csrf';")
        content = '\n'.join(lines)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {os.path.basename(filepath)}")

for root, _, files in os.walk(REACT_DIR):
    for filename in files:
        if filename.endswith(".jsx"):
            process_file(os.path.join(root, filename))

print("Done injecting CSRF into React components.")
