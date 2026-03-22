import os
import re

DIR = r"c:\Users\Dev Shukla\Desktop\Hackitup\GLITCHMAFIA_UI\src\components"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    orig = content

    # Fix AdminOverview.jsx broken import
    content = content.replace("import {\nimport { getCsrfToken } from '../utils/csrf';", "import { getCsrfToken } from '../utils/csrf';\nimport {")

    # Fix duplicate keys (regex to catch different variations)
    # the injection added: 'X-CSRFToken': getCsrfToken(),
    # followed potentially by: 'X-CSRFToken': <something else>
    
    # Let's cleanly replace the duplicate blocks
    content = re.sub(
        r"'X-CSRFToken': getCsrfToken\(\),\s*'X-CSRFToken': [^\n]+", 
        r"'X-CSRFToken': getCsrfToken()", 
        content
    )
    
    # Sometimes it doesn't have a trailing comma on the second one
    content = content.replace(
        "'X-CSRFToken': getCsrfToken(),\n                    'X-CSRFToken': getCsrfToken()",
        "'X-CSRFToken': getCsrfToken()"
    )

    if orig != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {os.path.basename(filepath)}")

for root, _, files in os.walk(DIR):
    for filename in files:
        if filename.endswith(".jsx"):
            fix_file(os.path.join(root, filename))

print("Done fixing.")
