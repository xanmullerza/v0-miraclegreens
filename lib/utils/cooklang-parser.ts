// Cooklang Parser - Comprehensive implementation
// Based on the Cooklang specification: https://cooklang.org/docs/spec

export interface Ingredient {
  name: string;
  quantity?: string;
  unit?: string;
  preparation?: string;
  isReference?: boolean;
}

export interface Cookware {
  name: string;
  quantity?: string;
}

export interface Timer {
  name?: string;
  duration: string;
  unit?: string;
}

export interface StepToken {
  type: "text" | "ingredient" | "cookware" | "timer";
  value: string;
  data?: Ingredient | Cookware | Timer;
}

export interface Section {
  name?: string;
  steps: StepToken[][];
}

export interface RecipeMetadata {
  title?: string;
  source?: string;
  servings?: string | number;
  time?: string;
  author?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface CooklangParsedRecipe {
  metadata: RecipeMetadata;
  sections: Section[];
  ingredients: Ingredient[];
  cookware: Cookware[];
  timers: Timer[];
}

// Parse YAML front matter
function parseMetadata(text: string): {
  metadata: RecipeMetadata;
  content: string;
} {
  const metadata: RecipeMetadata = {};

  // Check for YAML front matter
  const frontMatterMatch = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!frontMatterMatch) {
    return { metadata, content: text };
  }

  const yamlContent = frontMatterMatch[1];
  const content = text.slice(frontMatterMatch[0].length);

  // Simple YAML parser for common recipe metadata
  const lines = yamlContent.split("\n");
  let currentKey: string | null = null;
  let isArray = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for array item
    if (trimmed.startsWith("- ") && currentKey && isArray) {
      const value = trimmed.slice(2).trim();
      if (!Array.isArray(metadata[currentKey])) {
        metadata[currentKey] = [];
      }
      (metadata[currentKey] as string[]).push(value);
      continue;
    }

    // Check for key-value pair
    const kvMatch = trimmed.match(/^([^:]+):\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1].trim();
      const value = kvMatch[2].trim();

      if (value === "") {
        // Might be start of array
        isArray = true;
      } else {
        isArray = false;
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, "");
        metadata[currentKey] = cleanValue;
      }
    }
  }

  return { metadata, content };
}

// Remove comments from text
function removeComments(text: string): string {
  // Remove block comments [- ... -]
  let result = text.replace(/\[-[\s\S]*?-\]/g, "");
  // Remove line comments (-- to end of line), but not inside strings
  result = result.replace(/--.*$/gm, "");
  return result;
}

// Parse quantity and unit from within braces: {quantity%unit} or {quantity}
function parseQuantityUnit(content: string): {
  quantity?: string;
  unit?: string;
} {
  if (!content || content.trim() === "") {
    return {};
  }

  const trimmed = content.trim();

  // Check for % separator
  if (trimmed.includes("%")) {
    const parts = trimmed.split("%");
    return {
      quantity: parts[0].trim() || undefined,
      unit: parts.slice(1).join("%").trim() || undefined,
    };
  }

  // Just quantity
  return { quantity: trimmed };
}

// Parse an ingredient: @name{quantity%unit}(preparation) or @name or @multi word name{}
function parseIngredient(
  match: string,
  fullText: string,
  startIndex: number
): { ingredient: Ingredient; endIndex: number } {
  // Check if it's a reference (starts with ./)
  const isReference = match.startsWith("@./");
  const nameStart = isReference ? 3 : 1; // Skip @./ or @

  let name = "";
  let quantity: string | undefined;
  let unit: string | undefined;
  let preparation: string | undefined;
  let currentIndex = startIndex + nameStart;

  // Check if there's a brace following for multi-word or quantity
  const afterAt = fullText.slice(currentIndex);

  // Find the name - either single word or until {}
  const braceIndex = afterAt.indexOf("{");
  const spaceIndex = afterAt.search(/\s/);
  const parenIndex = afterAt.indexOf("(");

  if (braceIndex === -1) {
    // No braces - single word ingredient
    // Name ends at space, punctuation, or special chars
    const nameMatch = afterAt.match(/^([a-zA-Z0-9_-]+)/);
    if (nameMatch) {
      name = nameMatch[1];
      currentIndex += name.length;
    }
  } else if (braceIndex === 0 || (spaceIndex !== -1 && spaceIndex < braceIndex)) {
    // Braces immediately or space before braces
    if (braceIndex === 0) {
      // Just {} for ending multi-word - but this shouldn't happen at start
      name = "";
    } else {
      // Name is until braces
      name = afterAt.slice(0, braceIndex).trim();
      currentIndex += braceIndex;
    }

    // Now parse the braces content
    const braceContent = fullText.slice(currentIndex);
    const closeBraceIndex = braceContent.indexOf("}");
    if (closeBraceIndex !== -1) {
      const insideBraces = braceContent.slice(1, closeBraceIndex);
      const parsed = parseQuantityUnit(insideBraces);
      quantity = parsed.quantity;
      unit = parsed.unit;
      currentIndex += closeBraceIndex + 1;
    }
  } else {
    // Name is until braces
    name = afterAt.slice(0, braceIndex).trim();
    currentIndex += braceIndex;

    // Parse braces content
    const braceContent = fullText.slice(currentIndex);
    const closeBraceIndex = braceContent.indexOf("}");
    if (closeBraceIndex !== -1) {
      const insideBraces = braceContent.slice(1, closeBraceIndex);
      // Check for = prefix (scaling marker)
      const scaledContent = insideBraces.startsWith("=")
        ? insideBraces.slice(1)
        : insideBraces;
      const parsed = parseQuantityUnit(scaledContent);
      quantity = parsed.quantity;
      unit = parsed.unit;
      currentIndex += closeBraceIndex + 1;
    }
  }

  // Check for preparation in parentheses
  const afterBraces = fullText.slice(currentIndex);
  if (afterBraces.startsWith("(")) {
    const closeParenIndex = afterBraces.indexOf(")");
    if (closeParenIndex !== -1) {
      preparation = afterBraces.slice(1, closeParenIndex);
      currentIndex += closeParenIndex + 1;
    }
  }

  return {
    ingredient: {
      name: name.trim(),
      quantity,
      unit,
      preparation,
      isReference,
    },
    endIndex: currentIndex,
  };
}

// Parse cookware: #name{quantity} or #name or #multi word name{}
function parseCookware(
  fullText: string,
  startIndex: number
): { cookware: Cookware; endIndex: number } {
  let name = "";
  let quantity: string | undefined;
  let currentIndex = startIndex + 1; // Skip #

  const afterHash = fullText.slice(currentIndex);
  const braceIndex = afterHash.indexOf("{");

  if (braceIndex === -1) {
    // No braces - single word
    const nameMatch = afterHash.match(/^([a-zA-Z0-9_-]+)/);
    if (nameMatch) {
      name = nameMatch[1];
      currentIndex += name.length;
    }
  } else {
    // Name until braces
    name = afterHash.slice(0, braceIndex).trim();
    currentIndex += braceIndex;

    // Parse braces
    const braceContent = fullText.slice(currentIndex);
    const closeBraceIndex = braceContent.indexOf("}");
    if (closeBraceIndex !== -1) {
      const insideBraces = braceContent.slice(1, closeBraceIndex).trim();
      if (insideBraces) {
        quantity = insideBraces;
      }
      currentIndex += closeBraceIndex + 1;
    }
  }

  return {
    cookware: { name: name.trim(), quantity },
    endIndex: currentIndex,
  };
}

// Parse timer: ~{duration%unit} or ~name{duration%unit}
function parseTimer(
  fullText: string,
  startIndex: number
): { timer: Timer; endIndex: number } {
  let name: string | undefined;
  let duration = "";
  let unit: string | undefined;
  let currentIndex = startIndex + 1; // Skip ~

  const afterTilde = fullText.slice(currentIndex);
  const braceIndex = afterTilde.indexOf("{");

  if (braceIndex === -1) {
    // No braces - shouldn't happen for valid timer
    return {
      timer: { duration: "" },
      endIndex: currentIndex,
    };
  }

  if (braceIndex > 0) {
    // There's a name before the braces
    name = afterTilde.slice(0, braceIndex).trim();
  }
  currentIndex += braceIndex;

  // Parse braces
  const braceContent = fullText.slice(currentIndex);
  const closeBraceIndex = braceContent.indexOf("}");
  if (closeBraceIndex !== -1) {
    const insideBraces = braceContent.slice(1, closeBraceIndex);
    const parsed = parseQuantityUnit(insideBraces);
    duration = parsed.quantity || "";
    unit = parsed.unit;
    currentIndex += closeBraceIndex + 1;
  }

  return {
    timer: { name, duration, unit },
    endIndex: currentIndex,
  };
}

// Parse a step into tokens
function parseStep(stepText: string): StepToken[] {
  const tokens: StepToken[] = [];
  let currentIndex = 0;
  let textBuffer = "";

  while (currentIndex < stepText.length) {
    const char = stepText[currentIndex];

    // Check for special markers
    if (char === "@") {
      // Flush text buffer
      if (textBuffer) {
        tokens.push({ type: "text", value: textBuffer });
        textBuffer = "";
      }

      const { ingredient, endIndex } = parseIngredient(
        stepText.slice(currentIndex),
        stepText,
        currentIndex
      );

      // Format the display value
      let displayValue = ingredient.name;
      if (ingredient.quantity) {
        displayValue += ` (${ingredient.quantity}${ingredient.unit ? " " + ingredient.unit : ""})`;
      }
      if (ingredient.preparation) {
        displayValue += `, ${ingredient.preparation}`;
      }

      tokens.push({
        type: "ingredient",
        value: displayValue,
        data: ingredient,
      });
      currentIndex = endIndex;
    } else if (char === "#") {
      // Flush text buffer
      if (textBuffer) {
        tokens.push({ type: "text", value: textBuffer });
        textBuffer = "";
      }

      const { cookware, endIndex } = parseCookware(stepText, currentIndex);

      let displayValue = cookware.name;
      if (cookware.quantity) {
        displayValue += ` (${cookware.quantity})`;
      }

      tokens.push({
        type: "cookware",
        value: displayValue,
        data: cookware,
      });
      currentIndex = endIndex;
    } else if (char === "~") {
      // Flush text buffer
      if (textBuffer) {
        tokens.push({ type: "text", value: textBuffer });
        textBuffer = "";
      }

      const { timer, endIndex } = parseTimer(stepText, currentIndex);

      let displayValue = timer.duration;
      if (timer.unit) {
        displayValue += ` ${timer.unit}`;
      }
      if (timer.name) {
        displayValue = `${timer.name}: ${displayValue}`;
      }

      tokens.push({
        type: "timer",
        value: displayValue,
        data: timer,
      });
      currentIndex = endIndex;
    } else {
      textBuffer += char;
      currentIndex++;
    }
  }

  // Flush remaining text
  if (textBuffer) {
    tokens.push({ type: "text", value: textBuffer });
  }

  return tokens;
}

// Parse sections from content
function parseSections(content: string): Section[] {
  const sections: Section[] = [];
  let currentSection: Section = { steps: [] };

  // Split by double newlines for steps, but also check for section headers
  const lines = content.split("\n");
  let currentStepLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for section header: = Section Name or == Section Name ==
    const sectionMatch = trimmedLine.match(/^=+\s*(.+?)\s*=*$/);
    if (sectionMatch && !trimmedLine.startsWith("==") && trimmedLine.startsWith("=")) {
      // Single = is section header
      // Flush current step
      if (currentStepLines.length > 0) {
        const stepText = currentStepLines.join(" ").trim();
        if (stepText) {
          currentSection.steps.push(parseStep(stepText));
        }
        currentStepLines = [];
      }

      // Save current section if it has steps
      if (currentSection.steps.length > 0 || currentSection.name) {
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        name: sectionMatch[1].trim(),
        steps: [],
      };
    } else if (trimmedLine.match(/^==\s*(.+?)\s*==$/)) {
      // Double == is also section header
      const match = trimmedLine.match(/^==\s*(.+?)\s*==$/);
      if (match) {
        // Flush current step
        if (currentStepLines.length > 0) {
          const stepText = currentStepLines.join(" ").trim();
          if (stepText) {
            currentSection.steps.push(parseStep(stepText));
          }
          currentStepLines = [];
        }

        // Save current section if it has steps
        if (currentSection.steps.length > 0 || currentSection.name) {
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          name: match[1].trim(),
          steps: [],
        };
      }
    } else if (trimmedLine === "") {
      // Empty line - end of step
      if (currentStepLines.length > 0) {
        const stepText = currentStepLines.join(" ").trim();
        if (stepText) {
          currentSection.steps.push(parseStep(stepText));
        }
        currentStepLines = [];
      }
    } else if (trimmedLine.startsWith(">")) {
      // Note/callout - treat as part of step
      currentStepLines.push(trimmedLine.slice(1).trim());
    } else {
      currentStepLines.push(trimmedLine);
    }
  }

  // Flush final step
  if (currentStepLines.length > 0) {
    const stepText = currentStepLines.join(" ").trim();
    if (stepText) {
      currentSection.steps.push(parseStep(stepText));
    }
  }

  // Add final section
  if (currentSection.steps.length > 0 || currentSection.name) {
    sections.push(currentSection);
  }

  return sections;
}

// Extract all ingredients from sections
function extractIngredients(sections: Section[]): Ingredient[] {
  const ingredients: Ingredient[] = [];
  const seen = new Set<string>();

  for (const section of sections) {
    for (const step of section.steps) {
      for (const token of step) {
        if (token.type === "ingredient" && token.data) {
          const ing = token.data as Ingredient;
          const key = `${ing.name}-${ing.quantity}-${ing.unit}`;
          if (!seen.has(key)) {
            seen.add(key);
            ingredients.push(ing);
          }
        }
      }
    }
  }

  return ingredients;
}

// Extract all cookware from sections
function extractCookware(sections: Section[]): Cookware[] {
  const cookware: Cookware[] = [];
  const seen = new Set<string>();

  for (const section of sections) {
    for (const step of section.steps) {
      for (const token of step) {
        if (token.type === "cookware" && token.data) {
          const cw = token.data as Cookware;
          if (!seen.has(cw.name)) {
            seen.add(cw.name);
            cookware.push(cw);
          }
        }
      }
    }
  }

  return cookware;
}

// Extract all timers from sections
function extractTimers(sections: Section[]): Timer[] {
  const timers: Timer[] = [];

  for (const section of sections) {
    for (const step of section.steps) {
      for (const token of step) {
        if (token.type === "timer" && token.data) {
          timers.push(token.data as Timer);
        }
      }
    }
  }

  return timers;
}

// Main parse function
export function parseCooklangComprehensive(input: string): CooklangParsedRecipe {
  // Parse metadata
  const { metadata, content } = parseMetadata(input);

  // Remove comments
  const cleanContent = removeComments(content);

  // Parse sections and steps
  const sections = parseSections(cleanContent);

  // Extract ingredients, cookware, and timers
  const ingredients = extractIngredients(sections);
  const cookware = extractCookware(sections);
  const timers = extractTimers(sections);

  return {
    metadata,
    sections,
    ingredients,
    cookware,
    timers,
  };
}