import re

file_path = 'app/(main)/dashboard/recipes/meal-o-matic/page.tsx'

with open(file_path, 'rb') as f:
    content = f.read()

# Find the section with "Marked as eaten" and "subtracted > 0"
# Using regex to match the pattern with any special characters
old_pattern = rb'''if \(subtracted > 0\) \{\s+toast\.success\([^)]*Marked as eaten[^`]*updated`\);'''

new_pattern = b'''if (subtracted > 0) {
            toast.success(`Marked as eaten. ${subtracted} pantry item${subtracted !== 1 ? 's' : ''} updated`);
            window.location.reload();'''

content = re.sub(old_pattern, new_pattern, content)

with open(file_path, 'wb') as f:
    f.write(content)

print('File fixed')
