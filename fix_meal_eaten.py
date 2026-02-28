import re

with open('app/(main)/dashboard/recipes/meal-o-matic/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the toast message with one that includes reload
old_pattern = """        if (subtracted > 0) {
            toast.success(`Marked as eaten  ${subtracted} pantry item${subtracted !== 1 ? 's' : ''} updated`);
        } else {"""

new_pattern = """        if (subtracted > 0) {
            toast.success(`Marked as eaten. ${subtracted} pantry item${subtracted !== 1 ? 's' : ''} updated`);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {"""

# Try simple replacement
if old_pattern in content:
    content = content.replace(old_pattern, new_pattern)
    print("Pattern replaced successfully")
else:
    # If exact pattern doesn't match, try with just part of it
    if "Marked as eaten" in content and "subtracted > 0" in content:
        # Use regex to be more flexible
        content = re.sub(
            r'if \(subtracted > 0\) \{\s*toast\.success\(`Marked as eaten[^`]+` \)\;\s*\}',
            """if (subtracted > 0) {
            toast.success(`Marked as eaten. ${subtracted} pantry item${subtracted !== 1 ? 's' : ''} updated`);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }""",
            content,
            flags=re.MULTILINE
        )
        print("Regex pattern replaced")
    else:
        print("Could not find matching pattern")

with open('app/(main)/dashboard/recipes/meal-o-matic/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("File written successfully")
