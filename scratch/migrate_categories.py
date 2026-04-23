import os
import django

import sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ctf.settings')
sys.path.append(os.getcwd())
django.setup()

from challenges.models import Category, Challenge

# 1. Seed categories
categories = ['Web', 'Crypto', 'OSINT', 'Pwn', 'Forensics', 'Misc']
cat_objs = {}
for name in categories:
    obj, _ = Category.objects.get_or_create(name=name)
    cat_objs[name.lower()] = obj

# 2. Map existing challenges
challenges = Challenge.objects.all()
count = 0
for c in challenges:
    old_cat = c.category.lower() if c.category else 'misc'
    if old_cat in cat_objs:
        c.category_new = cat_objs[old_cat]
    else:
        # Fallback to misc
        c.category_new = cat_objs['misc']
    c.save()
    count += 1

print(f"Successfully migrated {count} challenges to new category system.")
