#!/usr/bin/env python3
# Fix the handleMarkEaten to add reload

file_path = 'app/(main)/dashboard/recipes/meal-o-matic/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and replace line with toast.success for "Marked as eaten"
for i, line in enumerate(lines):
    if 'Marked as eaten' in line and 'subtracted' in line:
        # Replace this line with a message without special character
        lines[i] = '            toast.success(`Marked as eaten. ${subtracted} pantry item${subtracted !== 1 ? \'s\' : \'\'} updated`);\n'
        # Add reload after toast
        lines.insert(i + 1, '            window.location.reload();\n')
        break

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('File updated with reload and fixed message')
